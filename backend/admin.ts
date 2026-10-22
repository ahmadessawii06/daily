import type express from 'express';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { hasPermission, rolePermissions, ROLES, type Permission, type Role } from '../src/shared/admin.js';
import { listAccounts, listAudit, accountOverview, auditRows, findAccount, findGrant, securityTransaction, type Account, type SecurityTransaction } from './repository.js';
import { hashPassword, signToken, verifyTokenClaims, type TokenClaims } from './security.js';

export function fail(status: number, message: string): never { throw Object.assign(new Error(message), { status, expose: true }); }
export const usable = (a: Account | null) => !!a && !a.deletedAt && a.status !== 'suspended';
export function publicUser(a: Account) {
  return { id: a.id, userCode: a.userCode, username: a.username, name: a.name, avatarUrl: a.avatarUrl, email: a.email, createdAt: a.createdAt, lastLoginAt: a.lastLoginAt, role: a.role || 'user', status: a.deletedAt ? 'deleted' : a.status || 'active', deletedAt: a.deletedAt || null };
}
export function sessionAllowed(a: Account, claims: TokenClaims) {
  return usable(a) && (claims.ver || 0) === (a.authVersion || 0) && (!claims.sid ? !a.authVersion : a.sessions?.some(s => s.id === claims.sid && !s.revokedAt && Date.parse(s.expiresAt) > Date.now()));
}
export const requestClaims = (req: express.Request) => verifyTokenClaims(req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '');
export async function authenticateRequest(req: express.Request, res: express.Response) {
  const claims = requestClaims(req), account = claims ? await findAccount(claims.sub, true) : null;
  if (!claims || !account || !usable(account)) fail(401, 'انتهت الجلسة أو الحساب غير متاح، يرجى تسجيل الدخول');
  if (claims.actor) {
    const [actor, grant] = await Promise.all([findAccount(claims.actor, true), findGrant(claims.grant!)]);
    if (!actor || !usable(actor) || !hasPermission(actor.role, 'users.impersonate') || actor.authVersion !== claims.actorVersion || account.authVersion !== claims.ver || account.role !== 'user' || !grant || grant.endedAt || grant.actorId !== actor.id || grant.targetId !== account.id || grant.actorVersion !== claims.actorVersion || grant.targetVersion !== claims.ver || Date.parse(grant.expiresAt) <= Date.now()) fail(401, 'انتهت جلسة الدعم');
    if (!sessionAllowed(actor, { sub: actor.id, exp: claims.exp, ver: grant.actorVersion, sid: grant.actorSessionId })) fail(401, 'انتهت جلسة الأدمن الأصلية');
    res.locals.impersonation = { id: grant.id, actorId: actor.id, expiresAt: grant.expiresAt };
  } else if (!sessionAllowed(account, claims)) fail(401, 'تم إلغاء الجلسة، يرجى تسجيل الدخول');
  res.locals.account = account; res.locals.claims = claims;
}
export function newSession(a: Account) {
  const now = new Date().toISOString(), id = randomUUID(), expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
  return { token: signToken(a.id, { ver: a.authVersion || 0, sid: id }), sessions: [...(a.sessions || []).filter(s => !s.revokedAt && Date.parse(s.expiresAt) > Date.now()).slice(-99), { id, createdAt: now, expiresAt }], lastLoginAt: now };
}
function reason(body: any): string {
  if (typeof body?.reason !== 'string' || body.reason.trim().length < 5 || body.reason.length > 500) fail(400, 'اكتب سببًا واضحًا بين 5 و500 حرف');
  return body.reason.trim();
}
const audit = (tx: SecurityTransaction, actor: Account, action: string, targetId: string, why: string) => tx.audit({ id: randomUUID(), actorId: actor.id, actorName: actor.name || actor.username, action, targetId, at: new Date().toISOString(), reason: why });
async function actorFor(tx: SecurityTransaction, res: express.Response, permission: Permission) {
  const actor = await tx.account(res.locals.account.id);
  if (!actor || !sessionAllowed(actor, res.locals.claims) || res.locals.claims.actor || !hasPermission(actor.role, permission)) fail(403, 'لا تملك صلاحية تنفيذ هذه العملية');
  return actor;
}
function protectTarget(actor: Account, target: Account) {
  if (target.role !== 'user' && actor.role !== 'super_admin') fail(403, 'إدارة الحسابات ذات الصلاحيات متاحة للمشرف الأعلى فقط');
}
function revoke(a: Account): Partial<Account> { return { authVersion: (a.authVersion || 0) + 1, sessions: [], reset: undefined }; }
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export type ResetMailer = (to: string, link: string) => Promise<void>;
export async function sendResetEmail(to: string, link: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.RESET_EMAIL_FROM) fail(503, 'يلزم إعداد Resend والبريد المرسل أولًا');
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.RESET_EMAIL_FROM, to: [to], subject: 'Mizan — إعادة تعيين كلمة المرور', text: `استخدم الرابط التالي خلال 15 دقيقة لإعادة تعيين كلمة المرور. يعمل مرة واحدة فقط.\n${link}\nإذا لم تتوقع هذه الرسالة، تجاهلها وتواصل مع الدعم.` }), signal: AbortSignal.timeout(10000) });
  if (!response.ok) fail(503, 'تعذر إرسال البريد، تحقق من إعدادات Resend');
}
function resetOrigin() {
  let url: URL; try { url = new URL(process.env.APP_URL || ''); } catch { fail(503, 'يلزم إعداد APP_URL لإرسال رابط آمن'); }
  if (url!.username || url!.password || url!.search || url!.hash || (url!.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(url!.hostname)))) fail(503, 'APP_URL يجب أن يكون رابط HTTPS موثوقًا');
  return url!.origin;
}
export function installResetRoute(api: express.Router, asyncRoute: any) {
  api.post('/auth/reset-password', asyncRoute(async (req: express.Request, res: express.Response) => {
    if (requestClaims(req)?.actor) fail(403, 'لا يمكن تغيير كلمة المرور خلال الانتحال');
    const { token, password } = req.body || {};
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || typeof password !== 'string' || password.length < 10 || password.length > 200) fail(400, 'الرابط غير صالح أو كلمة المرور يجب أن تكون بين 10 و200 حرف');
    await securityTransaction(async tx => {
      const a = await tx.byReset(tokenHash(token));
      if (!a || !usable(a) || a.reset?.usedAt || Date.parse(a.reset!.expiresAt) <= Date.now()) fail(400, 'الرابط منتهي أو مستخدم أو غير صالح');
    });
    const salt = randomBytes(16).toString('hex'), passwordHash = await hashPassword(password, salt);
    await securityTransaction(async tx => {
      const a = await tx.byReset(tokenHash(token));
      if (!a || !usable(a) || a.reset?.usedAt || Date.parse(a.reset!.expiresAt) <= Date.now()) fail(400, 'الرابط منتهي أو مستخدم أو غير صالح');
      await tx.patch(a.id, { ...revoke(a), salt, passwordHash, reset: { ...a.reset!, usedAt: new Date().toISOString() } });
      await audit(tx, a, 'auth.password_reset', a.id, 'Password reset completed using an emailed single-use link');
    });
    res.json({ success: true });
  }));
}
export function installAdminRoutes(api: express.Router, asyncRoute: any, mailer: ResetMailer = sendResetEmail) {
  api.get('/sync/read', (_req, res) => res.json({ success: true, ...res.locals.account.state }));
  api.post('/auth/logout', asyncRoute(async (_req: express.Request, res: express.Response) => {
    await securityTransaction(async tx => { const a = await tx.account(res.locals.account.id); if (!a) return; await tx.patch(a.id, res.locals.claims.sid ? { sessions: a.sessions!.map(s => s.id === res.locals.claims.sid ? { ...s, revokedAt: new Date().toISOString() } : s) } : revoke(a)); });
    res.json({ success: true });
  }));
  // End with the original admin session, including after the support token expires.
  api.post('/auth/impersonation/end', asyncRoute(async (req: express.Request, res: express.Response) => {
    if (res.locals.claims.actor || typeof req.body?.grantId !== 'string') fail(403, 'استخدم جلسة الأدمن الأصلية لإنهاء الدعم');
    await securityTransaction(async tx => {
      const actor = await tx.account(res.locals.account.id), grant = await tx.grant(req.body.grantId);
      if (!actor || !sessionAllowed(actor, res.locals.claims) || !grant || grant.actorId !== actor.id) fail(403, 'جلسة دعم غير صالحة');
      if (!grant.endedAt) { await tx.putGrant({ ...grant, endedAt: new Date().toISOString() }); await audit(tx, actor, 'impersonation.end', grant.targetId, 'Support session ended'); }
    });
    res.json({ success: true, user: publicUser(res.locals.account) });
  }));
  api.use('/admin', (_req, res, next) => {
    if (res.locals.claims.actor || !hasPermission(res.locals.account.role, 'users.read')) return next(Object.assign(new Error('هذه الصفحة للمخولين فقط'), { status: 403 }));
    res.set('Cache-Control', 'no-store'); next();
  });
  api.get('/admin/overview', asyncRoute(async (_req: express.Request, res: express.Response) => {
    res.json({ success: true, permissions: rolePermissions(res.locals.account.role), ...await accountOverview() });
  }));
  api.get('/admin/users', asyncRoute(async (req: express.Request, res: express.Response) => {
    const q = String(req.query.q || '').toLowerCase().slice(0, 100), role = String(req.query.role || ''), status = String(req.query.status || '');
    const page = Math.max(1, Math.min(1000000, Math.floor(Number(req.query.page) || 1))), pageSize = Math.max(1, Math.min(50, Math.floor(Number(req.query.pageSize) || 15)));
    const result = await listAccounts({ q, role, status, page, pageSize });
    res.json({ success: true, total: result.total, page, pageSize, users: result.users.map(publicUser) });
  }));
  api.get('/admin/users/:id', asyncRoute(async (req: express.Request, res: express.Response) => {
    const a = await findAccount(req.params.id, true); if (!a) fail(404, 'الحساب غير موجود');
    const days = Object.values(a.state.days), tasks = days.flatMap(d => d.tasks);
    res.json({ success: true, user: publicUser(a), activity: { days: days.length, tasks: tasks.filter(t => t.title.trim()).length, completed: tasks.filter(t => t.title.trim() && t.status === 'done').length, sessions: a.sessions!.filter(s => !s.revokedAt && Date.parse(s.expiresAt) > Date.now()).length }, events: (await auditRows(a.id)).slice(0, 30) });
  }));
  api.get('/admin/audit', asyncRoute(async (req: express.Request, res: express.Response) => {
    if (!hasPermission(res.locals.account.role, 'audit.read')) fail(403, 'لا تملك صلاحية قراءة سجل التدقيق');
    const page = Math.max(1, Math.min(1000000, Math.floor(Number(req.query.page) || 1))), q = String(req.query.q || '').toLowerCase().slice(0, 100);
    res.json({ success: true, page, ...await listAudit(q, page) });
  }));
  const operations: Record<string, Permission> = { profile: 'users.write', role: 'roles.write', suspend: 'users.suspend', activate: 'users.suspend', revoke: 'users.sessions', delete: 'users.delete', restore: 'users.restore', reset: 'users.reset', impersonate: 'users.impersonate' };
  api.post('/admin/users/:id/:operation', asyncRoute(async (req: express.Request, res: express.Response) => {
    const op = req.params.operation, permission = operations[op]; if (!permission) fail(404, 'عملية غير موجودة');
    if (!hasPermission(res.locals.account.role, permission)) fail(403, 'لا تملك صلاحية تنفيذ هذه العملية');
    if (op === 'reset' && mailer === sendResetEmail && (!process.env.RESEND_API_KEY || !process.env.RESET_EMAIL_FROM)) fail(503, 'يلزم إعداد Resend والبريد المرسل أولًا');
    const why = reason(req.body), rawReset = op === 'reset' ? randomBytes(32).toString('hex') : undefined;
    const origin = op === 'reset' ? resetOrigin() : undefined;
    let recipient: string | undefined;
    const response = await securityTransaction(async tx => {
      const actor = await actorFor(tx, res, permission), target = await tx.account(req.params.id); if (!target) fail(404, 'الحساب غير موجود');
      if (op === 'impersonate') {
        if (!usable(target) || target.role !== 'user' || target.id === actor.id) fail(403, 'يمكن انتحال حساب مستخدم عادي نشط فقط');
        const grant = { id: randomUUID(), actorId: actor.id, targetId: target.id, actorVersion: actor.authVersion!, targetVersion: target.authVersion!, actorSessionId: res.locals.claims.sid, expiresAt: new Date(Date.now() + 15 * 60000).toISOString() };
        await tx.putGrant(grant); await audit(tx, actor, 'impersonation.start', target.id, why);
        return { success: true, user: { ...publicUser(target), impersonation: { id: grant.id, actorId: actor.id, expiresAt: grant.expiresAt } }, token: signToken(target.id, { ver: target.authVersion, actor: actor.id, actorVersion: actor.authVersion, grant: grant.id, ttl: 15 * 60 }) };
      }
      protectTarget(actor, target);
      if (target.deletedAt && op !== 'restore') fail(409, 'استعد الحساب المحذوف أولًا');
      if (['delete', 'suspend', 'role'].includes(op) && target.id === actor.id) fail(403, 'لا يمكنك حذف حسابك أو إيقافه أو تعديل دورك');
      if (target.role === 'super_admin' && ['delete', 'suspend', 'role'].includes(op) && await tx.superAdmins() <= 1) fail(409, 'لا يمكن تعطيل آخر Super Admin');
      let changes: Partial<Account> = {};
      if (op === 'profile') {
        const keys = Object.keys(req.body); if (keys.some(k => !['reason', 'name', 'email'].includes(k))) fail(400, 'حقول غير مسموحة');
        if (typeof req.body.name !== 'string' || !req.body.name.trim() || req.body.name.length > 100 || typeof req.body.email !== 'string' || (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) || req.body.email.length > 254) fail(400, 'تحقق من الاسم والبريد الإلكتروني');
        const email = req.body.email.trim().toLowerCase();
        const existing = email ? await findAccount(email) : null;
        if (existing && existing.id !== target.id) fail(409, 'البريد الإلكتروني مستخدم');
        changes = { name: req.body.name.trim(), email: email || undefined, reset: undefined };
      } else if (op === 'role') {
        if (!ROLES.includes(req.body.role as Role)) fail(400, 'دور غير صالح');
        changes = { ...revoke(target), role: req.body.role };
      } else if (op === 'suspend') changes = { ...revoke(target), status: 'suspended' };
      else if (op === 'activate') changes = { status: 'active' };
      else if (op === 'revoke') changes = revoke(target);
      else if (op === 'delete') {
        if (req.body.confirmUsername !== target.username) fail(400, 'اكتب اسم المستخدم لتأكيد الحذف');
        changes = { ...revoke(target), deletedAt: new Date().toISOString() };
      } else if (op === 'restore') changes = { ...revoke(target), deletedAt: null };
      else if (op === 'reset') {
        if (!usable(target) || !target.email) fail(400, 'الحساب يحتاج بريدًا إلكترونيًا وحالة نشطة');
        if (target.reset && Date.parse(target.reset.requestedAt) > Date.now() - 60000) fail(429, 'انتظر دقيقة قبل إرسال رابط جديد');
        recipient = target.email;
        changes = { reset: { hash: tokenHash(rawReset!), requestedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 15 * 60000).toISOString() } };
      }
      await tx.patch(target.id, changes); await audit(tx, actor, `users.${op}`, target.id, why);
      return { success: true, user: publicUser({ ...target, ...changes }) };
    });
    if (recipient) {
      try { await mailer(recipient, `${origin}/#reset=${rawReset}`); }
      catch { await securityTransaction(async tx => { const a = await tx.account(req.params.id); if (a?.reset?.hash === tokenHash(rawReset!)) await tx.patch(a.id, { reset: { ...a.reset!, usedAt: new Date().toISOString() } }); await tx.audit({ id: randomUUID(), actorId: res.locals.account.id, actorName: res.locals.account.name || res.locals.account.username, targetId: req.params.id, action: 'users.reset_delivery_failed', at: new Date().toISOString(), reason: 'Email provider delivery request failed; link invalidated' }); }); fail(503, 'تعذر إرسال رابط إعادة التعيين؛ تحقق من إعدادات البريد'); }
    }
    res.json(response);
  }));
}

export async function bootstrapSuperAdmin(username: string) {
  const found = await findAccount(username.toLowerCase()); if (!found) fail(404, 'Register the account first');
  return securityTransaction(async tx => {
    if (await tx.superAdmins() > 0) fail(409, 'A super admin already exists; use the authorized admin panel');
    const a = await tx.account(found.id); if (!a || !usable(a)) fail(400, 'Account must be active');
    await tx.patch(a.id, { ...revoke(a), role: 'super_admin' }); await audit(tx, a, 'roles.bootstrap', a.id, 'Explicit operator CLI bootstrap');
    return a.username;
  });
}
