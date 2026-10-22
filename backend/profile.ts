import type { Router } from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import { securityTransaction, type Account } from './repository.js';
import { fail, newSession, publicUser, sessionAllowed } from './admin.js';
import { hashPassword, matchesPassword } from './security.js';

export function installProfileRoutes(api: Router) {
  api.post('/auth/profile', (req, res, next) => {
    void (async () => {
      if (res.locals.impersonation) fail(403, 'جلسة الدعم للقراءة فقط');
      const body = req.body;
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !['name', 'username', 'avatarUrl', 'currentPassword', 'newPassword'].includes(k))) fail(400, 'بيانات غير صالحة');
      if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 100)) fail(400, 'الاسم مطلوب وبحد أقصى 100 حرف');
      if (body.username !== undefined && (typeof body.username !== 'string' || !/^[a-zA-Z0-9_.-]{3,30}$/.test(body.username.trim()))) fail(400, 'اسم المستخدم: 3–30 حرفًا إنجليزيًا أو رقمًا أو _ . -');
      if (body.newPassword !== undefined && (typeof body.newPassword !== 'string' || body.newPassword.length < 10 || body.newPassword.length > 200)) fail(400, 'كلمة المرور الجديدة بين 10 و200 حرف');
      if (body.currentPassword !== undefined && (typeof body.currentPassword !== 'string' || body.currentPassword.length > 200)) fail(400, 'كلمة المرور الحالية غير صالحة');
      if (body.avatarUrl !== undefined && body.avatarUrl !== '') {
        if (typeof body.avatarUrl !== 'string' || body.avatarUrl.length > 65000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(body.avatarUrl)) fail(400, 'الصورة يجب أن تكون JPEG صغيرة');
        const bytes = Buffer.from(body.avatarUrl.split(',')[1], 'base64');
        if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) fail(400, 'الصورة غير صالحة');
      }
      const result = await securityTransaction(async tx => {
        const account = await tx.account(res.locals.account.id);
        if (!account || !sessionAllowed(account, res.locals.claims)) fail(401, 'انتهت الجلسة');
        const username = body.username?.trim().toLowerCase();
        const credentialChange = Boolean(body.newPassword || (username && username !== account.username));
        if (credentialChange && (!body.currentPassword || !await matchesPassword(body.currentPassword, account.salt, account.passwordHash))) fail(400, 'كلمة المرور الحالية غير صحيحة');
        if (username) { const other = await tx.byUsername(username); if (other && other.id !== account.id) fail(409, 'اسم المستخدم مستخدم بالفعل'); }
        const changes: Partial<Account> = {};
        if (body.name !== undefined) changes.name = body.name.trim();
        if (username) changes.username = username;
        if (body.avatarUrl !== undefined) changes.avatarUrl = body.avatarUrl;
        if (body.newPassword) {
          changes.salt = randomBytes(16).toString('hex');
          changes.passwordHash = await hashPassword(body.newPassword, changes.salt);
          changes.reset = undefined;
        }
        let token: string | undefined;
        if (credentialChange) {
          changes.authVersion = (account.authVersion || 0) + 1;
          changes.sessions = [];
          const session = newSession({ ...account, ...changes });
          token = session.token;
          changes.sessions = session.sessions;
          changes.lastLoginAt = session.lastLoginAt;
        }
        await tx.patch(account.id, changes);
        await tx.audit({ id: randomUUID(), actorId: account.id, actorName: account.name || account.username, action: credentialChange ? 'auth.credentials_updated' : 'account.profile_updated', targetId: account.id, at: new Date().toISOString(), reason: 'Account owner updated their profile' });
        return { success: true, user: publicUser({ ...account, ...changes }), ...(token ? { token } : {}) };
      });
      res.json(result);
    })().catch(next);
  });
}
