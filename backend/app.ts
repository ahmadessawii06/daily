import 'dotenv/config';
import express from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import { createAccount, findAccount, storageStatus, updateState, type Account } from './repository.js';
import { hashPassword, matchesPassword } from './security.js';
import { authenticateRequest, installAdminRoutes, installResetRoute, newSession, publicUser, requestClaims, usable, fail, type ResetMailer } from './admin.js';
import { securityTransaction } from './repository.js';
import { mergeDay } from '../src/shared/merge.js';
import { createWorkspace, mergeWorkspace, parseWorkspace } from '../src/shared/workspace.js';
import type { DayRecord } from '../src/types';
import { normalizePhotoTimestamp } from '../src/shared/photoTimestamp.js';
import { installProfileRoutes } from './profile.js';

function badRequest(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

function validDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}

export function validateDay(date: string, data: any): DayRecord {
  if (!validDate(date) || !data || !Array.isArray(data.tasks) || data.tasks.length > 1000) badRequest('Invalid day record');
  const seen = new Set<string>();
  for (const t of data.tasks) {
    if (t?.notDoneReason !== undefined && (typeof t.notDoneReason !== 'string' || t.notDoneReason.length > 200)) badRequest('Invalid not-done reason');
    if (!t || typeof t.id !== 'string' || !t.id || seen.has(t.id) || typeof t.title !== 'string' || typeof t.time !== 'string' ||
      !['done', 'pending', 'not-done'].includes(t.status) || (t.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(t.time))) badRequest('Invalid task');
    seen.add(t.id);
    if (t.isTopFocus !== undefined && typeof t.isTopFocus !== 'boolean') badRequest('Invalid focus flag');
    if (t.categoryId !== undefined && (typeof t.categoryId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(t.categoryId))) badRequest('Invalid task category');
    for (const key of ['createdAt', 'updatedAt']) if (t[key] && !Number.isFinite(Date.parse(t[key]))) badRequest('Invalid task timestamp');
  }
  const updatedAt = data.updatedAt || data.clientUpdatedAt || new Date().toISOString();
  if (!Number.isFinite(Date.parse(updatedAt))) badRequest('Invalid timestamp');
  const deletedTaskIds: Record<string, string> = {};
  // Older records can contain null for the optional single-photo field.
  if (data.dayPhoto === null) data = { ...data, dayPhoto: '' };
  if (data.dayPhoto !== undefined && (typeof data.dayPhoto !== 'string' || data.dayPhoto.length > 100000 || (data.dayPhoto !== '' && !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(data.dayPhoto)))) badRequest('Invalid day photo');
  if (data.dayPhotos !== undefined && (!Array.isArray(data.dayPhotos) || data.dayPhotos.some((photo: unknown) => typeof photo !== 'string' || photo.length > 100000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo)))) badRequest('Invalid day photos');
  const dayPhotoUpdatedAt = normalizePhotoTimestamp(data, updatedAt);
  for (const [id, time] of Object.entries(data.deletedTaskIds || {})) {
    if (typeof time !== 'string' || !Number.isFinite(Date.parse(time))) badRequest('Invalid deletion');
    Object.defineProperty(deletedTaskIds, id, { value: time, enumerable: true, writable: true, configurable: true });
  }
  return { date, tasks: data.tasks, notes: typeof data.notes === 'string' ? data.notes : '',
    dayPhoto: data.dayPhoto, dayPhotos: data.dayPhotos, dayPhotoUpdatedAt,
    dayNote: typeof data.dayNote === 'string' ? data.dayNote : undefined, updatedAt, deletedTaskIds };
}

export function createApiApp(production = false, options: { resetMailer?: ResetMailer } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '5mb' }));
  const api = express.Router();
  if (production) api.use((_req, _res, next) => {
    if (!process.env.MONGODB_URI?.trim() || process.env.MONGODB_URI.includes('<') || (process.env.JWT_SECRET?.trim().length || 0) < 32) {
      return next(new Error('MONGODB_URI and a strong JWT_SECRET are required in production'));
    }
    next();
  });
  const asyncRoute = (fn: (req: express.Request, res: express.Response) => Promise<any>) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) => { fn(req, res).catch(next); };
  api.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  api.use((req, _res, next) => {
    if (req.method !== 'GET' && requestClaims(req)?.actor) return next(Object.assign(new Error('جلسة الدعم للقراءة فقط'), { status: 403 }));
    next();
  });
  installResetRoute(api, asyncRoute);

  api.get('/health', asyncRoute(async (_req, res) => {
    res.json({ connected: true, database: await storageStatus() });
  }));

  api.post('/auth/register', asyncRoute(async (req, res) => {
    const { username, password, name, email } = req.body || {};
    if (typeof username !== 'string' || !/^[a-zA-Z0-9_.-]{3,30}$/.test(username.trim())) badRequest('اسم المستخدم يجب أن يكون بين 3 و30 حرفًا');
    if (typeof password !== 'string' || password.length < 6 || password.length > 200) badRequest('كلمة المرور يجب أن تكون بين 6 و200 حرف');
    const account: Account = {
      id: randomUUID(), userCode: randomBytes(12).toString('hex').toUpperCase(), username: username.trim().toLowerCase(),
      name: typeof name === 'string' ? name.trim().slice(0, 100) : username.trim(),
      ...(typeof email === 'string' && email.trim() ? { email: email.trim().toLowerCase() } : {}),
      createdAt: new Date().toISOString(), salt: randomBytes(16).toString('hex'), passwordHash: '', revision: 0,
      role: 'user', status: 'active', authVersion: 0, sessions: [],
      state: { days: {}, habits: [], recurring: [], settings: {}, versions: {}, workspace: createWorkspace('cards', new Date().toISOString()) },
    };
    account.passwordHash = await hashPassword(password, account.salt);
    // Fail configuration before persisting a new account.
    const { token, ...session } = newSession(account);
    Object.assign(account, session);
    await createAccount(account);
    res.status(201).json({ success: true, user: publicUser(account), token, workspace: account.state.workspace });
  }));

  api.post('/auth/login', asyncRoute(async (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || password.length > 200) badRequest('Invalid credentials');
    const account = await findAccount(username.trim().toLowerCase());
    if (!account || !usable(account) || !await matchesPassword(password, account.salt, account.passwordHash)) {
      return res.status(401).json({ success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
    const result = await securityTransaction(async tx => {
      const fresh = await tx.account(account.id);
      if (!fresh || !usable(fresh) || fresh.passwordHash !== account.passwordHash) fail(401, 'الحساب غير متاح');
      const { token, ...session } = newSession(fresh);
      await tx.patch(fresh.id, session);
      await tx.audit({ id: randomUUID(), actorId: fresh.id, actorName: fresh.name || fresh.username, action: 'auth.login', targetId: fresh.id, at: session.lastLoginAt, reason: 'Successful credential sign-in' });
      return { success: true, user: publicUser({ ...fresh, ...session }), token, workspace: fresh.state.workspace };
    });
    res.json(result);
  }));

  api.use((req, res, next) => {
    (async () => {
      await authenticateRequest(req, res);
      if (res.locals.impersonation && req.method !== 'GET') fail(403, 'جلسة الدعم للقراءة فقط؛ لا يسمح بتعديل البيانات أو كلمات المرور أو الصلاحيات أو العمليات المالية');
      next();
    })().catch(next);
  });

  api.get('/auth/me', (_req, res) => res.json({ success: true, user: { ...publicUser(res.locals.account), ...(res.locals.impersonation ? { impersonation: res.locals.impersonation } : {}) } }));
  installAdminRoutes(api, asyncRoute, options.resetMailer);
  api.get('/days', (_req, res) => res.json({ days: res.locals.account.state.days }));
  api.get('/days/:date', (req, res) => {
    const day = res.locals.account.state.days[req.params.date];
    res.json(day ? { ...day, found: true } : { date: req.params.date, tasks: [], found: false });
  });
  api.post('/days/:date', asyncRoute(async (req, res) => {
    const day = validateDay(req.params.date, req.body);
    const state = await updateState(res.locals.account.id, state => { state.days[day.date] = mergeDay(state.days[day.date], day); });
    res.json({ success: true, day: state.days[day.date] });
  }));

  api.post('/sync/batch', asyncRoute(async (req, res) => {
    const body = req.body || {};
    const workspace = body.workspace === undefined ? undefined : parseWorkspace(body.workspace);
    const days: DayRecord[] = [];
    if (body.days) {
      if (typeof body.days !== 'object' || Array.isArray(body.days) || Object.keys(body.days).length > 5000) badRequest('Invalid days');
      for (const [date, data] of Object.entries(body.days)) days.push(validateDay(date, data));
    }
    for (const key of ['habits', 'recurring']) {
      if (body[key] !== undefined && (!Array.isArray(body[key]) || body[key].length > 1000 || body[key].some((item: any) => !item || typeof item.id !== 'string' || typeof item.title !== 'string'))) badRequest(`Invalid ${key}`);
    }
    if (body.settings !== undefined) {
      if (!body.settings || typeof body.settings !== 'object' || Array.isArray(body.settings)) badRequest('Invalid settings');
      if (body.settings.theme !== undefined && !['dark', 'light'].includes(body.settings.theme)) badRequest('Invalid theme');
      if (body.settings.lang !== undefined && !['ar', 'en'].includes(body.settings.lang)) badRequest('Invalid language');
      if (body.settings.onboarding !== undefined) {
        if (!body.settings.onboarding || typeof body.settings.onboarding !== 'object' || Array.isArray(body.settings.onboarding)) badRequest('Invalid onboarding');
        if (body.settings.onboarding.completed !== undefined && typeof body.settings.onboarding.completed !== 'boolean') badRequest('Invalid onboarding completion');
        if (body.settings.onboarding.skipped !== undefined && typeof body.settings.onboarding.skipped !== 'boolean') badRequest('Invalid onboarding skipped');
      }
    }
    const state = await updateState(res.locals.account.id, state => {
      if (workspace) {
        const version = body.versions?.workspace;
        if (!Number.isFinite(version) || version <= 0) badRequest('Invalid workspace version');
        state.workspace = mergeWorkspace(state.workspace, workspace);
        state.versions.workspace = Math.max(state.versions.workspace || 0, version);
      }
      for (const day of days) state.days[day.date] = mergeDay(state.days[day.date], day);
      for (const key of ['habits', 'recurring', 'settings'] as const) {
        if (body[key] === undefined) continue;
        const version = body.versions?.[key];
        if (!Number.isFinite(version) || version <= 0) badRequest('Invalid version');
        if (version >= (state.versions[key] || 0)) {
          if (key === 'settings') {
            const allowed = ['theme', 'lang', 'prayerLocation', 'prayerTimes', 'onboarding'];
            state.settings = { ...state.settings, ...Object.fromEntries(Object.entries(body.settings).filter(([k]) => allowed.includes(k))) };
          } else state[key] = body[key];
          state.versions[key] = version;
        }
      }
    });
    res.json({ success: true, ...state });
  }));
  installProfileRoutes(api);
  for (const key of ['habits', 'recurring', 'settings'] as const) {
    api.get(`/${key}`, (_req, res) => res.json({ [key]: res.locals.account.state[key] }));
  }
  api.use((_req, res) => res.status(404).json({ success: false, error: 'API endpoint not found' }));
  app.use('/api', api);
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.code === 11000 ? 409 : err.status || 503;
    if (status >= 500) console.error('API failure:', err.message);
    res.status(status).json({ success: false, connected: false, error: err.code === 11000 ? 'اسم المستخدم أو البريد مستخدم بالفعل' : status >= 500 && !err.expose ? 'الخادم أو قاعدة البيانات غير متاحين، يرجى المحاولة لاحقًا' : err.message });
  });
  return app;
}
