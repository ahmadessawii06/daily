import 'dotenv/config';
import express from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import { createAccount, findAccount, storageStatus, updateState, type Account } from './repository.js';
import { hashPassword, matchesPassword, signToken, verifyToken } from './security.js';
import { mergeDay } from '../src/shared/merge.js';
import { createWorkspace, mergeWorkspace, parseWorkspace } from '../src/shared/workspace.js';
import type { DayRecord } from '../src/types';

function publicUser(account: Account) {
  const { id, userCode, username, name, email, createdAt } = account;
  return { id, userCode, username, name, email, createdAt };
}

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
    if (!t || typeof t.id !== 'string' || !t.id || seen.has(t.id) || typeof t.title !== 'string' || typeof t.time !== 'string' ||
      !['done', 'pending', 'not-done'].includes(t.status) || (t.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(t.time))) badRequest('Invalid task');
    seen.add(t.id);
    if (t.categoryId !== undefined && (typeof t.categoryId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(t.categoryId))) badRequest('Invalid task category');
    for (const key of ['createdAt', 'updatedAt']) if (t[key] && !Number.isFinite(Date.parse(t[key]))) badRequest('Invalid task timestamp');
  }
  const updatedAt = data.updatedAt || data.clientUpdatedAt || new Date().toISOString();
  if (!Number.isFinite(Date.parse(updatedAt))) badRequest('Invalid timestamp');
  const deletedTaskIds: Record<string, string> = {};
  for (const [id, time] of Object.entries(data.deletedTaskIds || {})) {
    if (typeof time !== 'string' || !Number.isFinite(Date.parse(time))) badRequest('Invalid deletion');
    Object.defineProperty(deletedTaskIds, id, { value: time, enumerable: true, writable: true, configurable: true });
  }
  return { date, tasks: data.tasks, notes: typeof data.notes === 'string' ? data.notes : '',
    dayNote: typeof data.dayNote === 'string' ? data.dayNote : undefined, updatedAt, deletedTaskIds };
}

export function createApiApp(production = false) {
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
      state: { days: {}, habits: [], recurring: [], settings: {}, versions: {}, workspace: createWorkspace('cards', new Date().toISOString()) },
    };
    account.passwordHash = await hashPassword(password, account.salt);
    // Fail configuration before persisting a new account.
    const token = signToken(account.id);
    await createAccount(account);
    res.status(201).json({ success: true, user: publicUser(account), token, workspace: account.state.workspace });
  }));

  api.post('/auth/login', asyncRoute(async (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || password.length > 200) badRequest('Invalid credentials');
    const account = await findAccount(username.trim().toLowerCase());
    if (!account || !await matchesPassword(password, account.salt, account.passwordHash)) {
      return res.status(401).json({ success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
    res.json({ success: true, user: publicUser(account), token: signToken(account.id), workspace: account.state.workspace });
  }));

  api.use((req, res, next) => {
    (async () => {
      const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
      const id = token ? verifyToken(token) : null;
      const account = id ? await findAccount(id, true) : null;
      if (!account) return res.status(401).json({ success: false, error: 'يرجى تسجيل الدخول' });
      res.locals.account = account;
      next();
    })().catch(next);
  });

  api.get('/auth/me', (_req, res) => res.json({ success: true, user: publicUser(res.locals.account) }));
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
            const allowed = ['theme', 'lang', 'prayerLocation', 'prayerTimes'];
            state.settings = { ...state.settings, ...Object.fromEntries(Object.entries(body.settings).filter(([k]) => allowed.includes(k))) };
          } else state[key] = body[key];
          state.versions[key] = version;
        }
      }
    });
    res.json({ success: true, ...state });
  }));
  for (const key of ['habits', 'recurring', 'settings'] as const) {
    api.get(`/${key}`, (_req, res) => res.json({ [key]: res.locals.account.state[key] }));
  }
  api.use((_req, res) => res.status(404).json({ success: false, error: 'API endpoint not found' }));
  app.use('/api', api);
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.code === 11000 ? 409 : err.status || 503;
    if (status >= 500) console.error('API failure:', err.message);
    res.status(status).json({ success: false, connected: false, error: status === 409 ? 'اسم المستخدم أو البريد مستخدم بالفعل' : status >= 500 ? 'الخادم أو قاعدة البيانات غير متاحين، يرجى المحاولة لاحقًا' : err.message });
  });
  return app;
}
