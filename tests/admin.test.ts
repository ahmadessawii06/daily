import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import { createApiApp } from '../backend/app';
import { bootstrapSuperAdmin } from '../backend/admin';
import { findAccount, securityTransaction } from '../backend/repository';

test('admin RBAC, sessions, recovery, deletion and support grants use real persisted API records', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mizan-admin-'));
  process.env.DATA_DIR = directory; process.env.MONGODB_URI = ''; process.env.JWT_SECRET = 'admin-test-secret-with-more-than-thirty-two-characters'; process.env.NODE_ENV = 'test'; process.env.APP_URL = 'https://mizan.example';
  const mail: string[] = [];
  let deliveryFails = false;
  const server: Server = createApiApp(false, { resetMailer: async (_to, link) => { if (deliveryFails) throw new Error('Provider down'); mail.push(link); } }).listen(0, '127.0.0.1');
  await new Promise<void>(r => server.once('listening', r));
  const base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  const req = async (route: string, body?: any, token?: string) => { const r = await fetch(base + route, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); return { status: r.status, data: await r.json() }; };
  const register = async (username: string) => (await req('/auth/register', { username, password: 'correct-password', name: username, email: `${username}@example.test`, role: 'super_admin' })).data;
  const login = async (username: string, password = 'correct-password') => (await req('/auth/login', { username, password })).data;
  try {
    const owner = await register('owner'), user = await register('regular'), helper = await register('helper'), manager = await register('manager');
    await t.test('registration cannot grant roles and non-admin/anonymous access is denied', async () => {
      assert.equal(owner.user.role, 'user'); assert.equal((await req('/admin/users')).status, 401); assert.equal((await req('/admin/users', undefined, user.token)).status, 403);
      assert.equal((await req(`/admin/users/${owner.user.id}/role`, { role: 'super_admin', reason: 'forged request' }, user.token)).status, 403);
    });
    await bootstrapSuperAdmin('owner'); const root = await login('owner'); const rootToken = root.token;
    await t.test('bootstrap invalidates old sessions, runs only once and exposes no secrets', async () => {
      assert.equal((await req('/days', undefined, owner.token)).status, 401); await assert.rejects(bootstrapSuperAdmin('regular'));
      assert.equal(root.user.role, 'super_admin'); assert.equal(root.user.passwordHash, undefined); assert.equal(root.user.salt, undefined); assert.ok(root.user.lastLoginAt);
    });
    await req(`/admin/users/${helper.user.id}/role`, { role: 'support', reason: 'Assign support role' }, rootToken); const support = await login('helper');
    await req(`/admin/users/${manager.user.id}/role`, { role: 'admin', reason: 'Assign manager role' }, rootToken); const admin = await login('manager');
    await t.test('dashboard/table search, filters and pagination return sanitized records', async () => {
      const metrics = (await req('/admin/overview', undefined, rootToken)).data; assert.equal(metrics.total, 4); assert.equal(metrics.active, 4); assert.equal(metrics.newUsers, 4);
      const page = (await req('/admin/users?pageSize=1&page=2', undefined, rootToken)).data; assert.equal(page.users.length, 1); assert.equal(page.total, 4);
      const query = (await req('/admin/users?q=regular&role=user&status=active', undefined, support.token)).data; assert.equal(query.users[0].id, user.user.id);
      assert.ok(!JSON.stringify(query).includes('passwordHash')); assert.ok(!JSON.stringify(query).includes('reset')); assert.ok(!JSON.stringify(query).includes('sessions'));
    });
    await t.test('permission boundaries, mass assignment and self/last-admin protection', async () => {
      assert.equal((await req(`/admin/users/${user.user.id}/profile`, { name: 'User', email: 'user@example.test', reason: 'Support edit attempt' }, support.token)).status, 403);
      assert.equal((await req(`/admin/users/${user.user.id}/role`, { role: 'super_admin', reason: 'Manager escalation' }, admin.token)).status, 403);
      assert.equal((await req(`/admin/users/${owner.user.id}/suspend`, { reason: 'Manager targeting owner' }, admin.token)).status, 403);
      assert.equal((await req(`/admin/users/${owner.user.id}/delete`, { confirmUsername: 'owner', reason: 'Attempt own deletion' }, rootToken)).status, 403);
      assert.equal((await req(`/admin/users/${user.user.id}/profile`, { name: 'User', email: 'user@example.test', role: 'super_admin', passwordHash: 'bad', reason: 'Mass assignment attempt' }, rootToken)).status, 400);
      assert.equal((await req(`/admin/users/${user.user.id}/suspend`, { reason: '' }, rootToken)).status, 400);
    });
    const day = { date: '2026-10-14', tasks: [{ id: 'kept', title: 'Keep this task', time: '', status: 'pending', createdAt: new Date().toISOString() }], updatedAt: new Date().toISOString() };
    await req('/sync/batch', { days: { [day.date]: day } }, user.token);
    await t.test('suspension invalidates all sessions and activation never resurrects them', async () => {
      assert.equal((await req(`/admin/users/${user.user.id}/suspend`, { reason: 'Security investigation' }, admin.token)).status, 200);
      assert.equal((await req('/days', undefined, user.token)).status, 401); assert.equal((await req('/auth/login', { username: 'regular', password: 'correct-password' })).status, 401);
      await req(`/admin/users/${user.user.id}/activate`, { reason: 'Investigation resolved' }, admin.token); assert.equal((await req('/days', undefined, user.token)).status, 401);
      user.token = (await login('regular')).token; assert.equal((await req(`/days/${day.date}`, undefined, user.token)).data.tasks[0].id, 'kept');
    });
    await t.test('revoke and logout invalidate persisted sessions', async () => {
      const second = await login('regular'); await req(`/admin/users/${user.user.id}/revoke`, { reason: 'Revoke all active sessions' }, admin.token);
      assert.equal((await req('/days', undefined, user.token)).status, 401); assert.equal((await req('/days', undefined, second.token)).status, 401);
      user.token = (await login('regular')).token; await req('/auth/logout', {}, user.token); assert.equal((await req('/days', undefined, user.token)).status, 401); user.token = (await login('regular')).token;
    });
    await t.test('support requires a reason, cannot impersonate staff, and cannot mutate anything', async () => {
      assert.equal((await req(`/admin/users/${owner.user.id}/impersonate`, { reason: 'Investigate staff account' }, rootToken)).status, 403);
      assert.equal((await req(`/admin/users/${user.user.id}/impersonate`, {}, support.token)).status, 400);
      const start = await req(`/admin/users/${user.user.id}/impersonate`, { reason: 'Investigate reported task display' }, support.token); assert.equal(start.status, 200);
      const imp = start.data; assert.ok(imp.user.impersonation); assert.equal((await req(`/days/${day.date}`, undefined, imp.token)).data.tasks[0].id, 'kept');
      for (const route of ['/sync/batch', '/days/2026-10-14', '/auth/reset-password', '/auth/register', `/admin/users/${user.user.id}/role`, '/billing/charge']) assert.equal((await req(route, { days: {} }, imp.token)).status, 403, route);
      assert.equal((await req('/admin/users', undefined, imp.token)).status, 403);
      assert.equal((await req('/auth/impersonation/end', { grantId: imp.user.impersonation.id }, admin.token)).status, 403);
      assert.equal((await req('/auth/impersonation/end', { grantId: imp.user.impersonation.id }, support.token)).status, 200);
      assert.equal((await req('/days', undefined, imp.token)).status, 401); assert.equal((await req('/auth/me', undefined, support.token)).data.user.id, helper.user.id);
    });
    await t.test('expired/revoked actor grants stop immediately but original sessions can end them', async () => {
      const imp = (await req(`/admin/users/${user.user.id}/impersonate`, { reason: 'Check support expiration' }, admin.token)).data;
      await securityTransaction(async tx => { const g = await tx.grant(imp.user.impersonation.id); await tx.putGrant({ ...g!, expiresAt: '2000-01-01T00:00:00Z' }); });
      assert.equal((await req('/days', undefined, imp.token)).status, 401); assert.equal((await req('/auth/impersonation/end', { grantId: imp.user.impersonation.id }, admin.token)).status, 200);
      const active = (await req(`/admin/users/${user.user.id}/impersonate`, { reason: 'Actor permission revocation' }, support.token)).data;
      await req(`/admin/users/${helper.user.id}/role`, { role: 'user', reason: 'Support authorization removed' }, rootToken); assert.equal((await req('/days', undefined, active.token)).status, 401);
    });
    await t.test('logging out of the initiating administrator session revokes its support grant', async () => {
      const session = await login('manager');
      const imp = (await req(`/admin/users/${user.user.id}/impersonate`, { reason: 'Check parent session logout' }, session.token)).data;
      assert.equal((await req('/sync/read', undefined, imp.token)).status, 200);
      await req('/auth/logout', {}, session.token);
      assert.equal((await req('/sync/read', undefined, imp.token)).status, 401);
      assert.equal((await req('/auth/me', undefined, admin.token)).status, 200, 'Other admin sessions remain valid');
    });
    await t.test('soft delete requires typed confirmation and restores tasks without reviving sessions', async () => {
      assert.equal((await req(`/admin/users/${user.user.id}/delete`, { reason: 'Request account deletion', confirmUsername: 'wrong' }, admin.token)).status, 400);
      await req(`/admin/users/${user.user.id}/delete`, { reason: 'Request account deletion', confirmUsername: 'regular' }, admin.token);
      assert.equal((await req('/days', undefined, user.token)).status, 401); assert.equal((await req('/admin/users?status=deleted', undefined, rootToken)).data.users[0].id, user.user.id);
      await req(`/admin/users/${user.user.id}/restore`, { reason: 'Restore requested account' }, admin.token); user.token = (await login('regular')).token; assert.equal((await req(`/days/${day.date}`, undefined, user.token)).data.tasks[0].id, 'kept');
    });
    await t.test('reset links are mailed, hashed, expiring, single-use and invalidate sessions', async () => {
      const sent = await req(`/admin/users/${user.user.id}/reset`, { reason: 'User requested password recovery' }, admin.token); assert.equal(sent.status, 200); assert.equal(sent.data.token, undefined); assert.equal(mail.length, 1);
      const resetToken = new URL(mail[0]).hash.slice('#reset='.length), persisted = await findAccount(user.user.id, true); assert.notEqual(persisted!.reset!.hash, resetToken); assert.equal(persisted!.passwordHash.includes('correct-password'), false);
      assert.equal((await req(`/admin/users/${user.user.id}/reset`, { reason: 'Duplicate recovery request' }, admin.token)).status, 429);
      assert.equal((await req('/auth/reset-password', { token: resetToken, password: 'new-secure-password' })).status, 200); assert.equal((await req('/auth/reset-password', { token: resetToken, password: 'other-password' })).status, 400);
      assert.equal((await req('/days', undefined, user.token)).status, 401); assert.equal((await req('/auth/login', { username: 'regular', password: 'correct-password' })).status, 401); assert.equal((await req('/auth/login', { username: 'regular', password: 'new-secure-password' })).status, 200);
      await securityTransaction(async tx => { const a = await tx.account(user.user.id); await tx.patch(a!.id, { reset: { ...a!.reset!, usedAt: undefined, expiresAt: '2000-01-01T00:00:00Z' } }); }); assert.equal((await req('/auth/reset-password', { token: resetToken, password: 'new-secure-password' })).status, 400);
    });
    await t.test('delivery failure is explicit and never exposes a reset link', async () => {
      deliveryFails = true; const failed = await req(`/admin/users/${manager.user.id}/reset`, { reason: 'Test provider delivery failure' }, rootToken); assert.equal(failed.status, 503); assert.equal(failed.data.token, undefined); assert.ok((await findAccount(manager.user.id, true))!.reset!.usedAt);
    });
    await t.test('audit covers actors/actions/reasons and excludes credentials and tokens', async () => {
      const events = (await req('/admin/audit', undefined, rootToken)).data.events; const raw = JSON.stringify(events); assert.ok(events.some((e: any) => e.action === 'impersonation.start')); assert.ok(events.some((e: any) => e.action === 'impersonation.end')); assert.ok(events.every((e: any) => e.actorId && e.targetId && e.at && e.reason));
      for (const secret of [rootToken, admin.token, 'correct-password', 'new-secure-password', 'passwordHash', 'salt']) assert.ok(!raw.includes(secret));
    });
    await t.test('concurrent opposing super-admin deletions leave an active super admin', async () => {
      await req(`/admin/users/${manager.user.id}/role`, { role: 'super_admin', reason: 'Assign second super admin' }, rootToken); const other = await login('manager');
      const actions = await Promise.all([req(`/admin/users/${manager.user.id}/delete`, { confirmUsername: 'manager', reason: 'Concurrent delete manager' }, rootToken), req(`/admin/users/${owner.user.id}/delete`, { confirmUsername: 'owner', reason: 'Concurrent delete owner' }, other.token)]);
      assert.equal(actions.filter(r => r.status === 200).length, 1); assert.equal(await securityTransaction(tx => tx.superAdmins()), 1);
    });
  } finally { await new Promise<void>(r => server.close(() => r())); fs.rmSync(directory, { recursive: true, force: true }); }
});
