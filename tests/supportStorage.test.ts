import test from 'node:test';
import assert from 'node:assert/strict';
import { beginSupportSession, clearStoredAuth, clearSupportSession, getStoredAuth, originalAdminSession, saveStoredAuth } from '../src/utils/auth';
import { scopedKey, userStorage } from '../src/utils/scopedStorage';
import { enqueue, getQueue } from '../src/services/syncQueue';
import type { User } from '../src/types';
import { requestApi } from '../src/services/api';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(i: number) { return [...this.values.keys()][i] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}
test('support identity, planner storage and sync queue stay isolated from administrator and target caches', async () => {
  const previousLocal = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const previousSession = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new MemoryStorage() });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: new MemoryStorage() });
  const admin: User = { id: 'administrator', username: 'owner', userCode: 'ADMIN', role: 'super_admin' };
  const target: User = { id: 'target', username: 'member', userCode: 'USER', role: 'user', impersonation: { id: 'grant-one', actorId: admin.id, expiresAt: new Date(Date.now() + 900000).toISOString() } };
  try {
    saveStoredAuth(admin, 'admin-test-token');
    userStorage.setItem('tasks', 'admin tasks');
    localStorage.setItem(scopedKey('tasks', target.id), 'target offline tasks');
    enqueue('settings', { lang: 'ar' }); const originalQueue = getQueue();
    beginSupportSession(target, 'support-test-token');
    assert.equal(getStoredAuth().user?.id, target.id);
    assert.equal(originalAdminSession()?.user.id, admin.id);
    assert.equal(userStorage.getItem('tasks'), null);
    userStorage.setItem('tasks', 'support snapshot');
    enqueue('settings', { lang: 'en' });
    assert.deepEqual(getQueue(), [], 'Support cannot queue writes');
    saveStoredAuth({ ...target, name: 'Updated support name' }, 'support-test-token');
    assert.equal(originalAdminSession()?.token, 'admin-test-token');
    clearSupportSession();
    assert.equal(getStoredAuth().user?.id, admin.id);
    assert.equal(userStorage.getItem('tasks'), 'admin tasks');
    assert.equal(localStorage.getItem(scopedKey('tasks', target.id)), 'target offline tasks');
    assert.equal(localStorage.getItem('mizan_support_grant-one:tasks'), null);
    assert.deepEqual(getQueue(), originalQueue);
    beginSupportSession(target, 'support-test-token'); clearStoredAuth();
    assert.equal(getStoredAuth().user, null); assert.equal(sessionStorage.length, 0);
    const fetchBefore = globalThis.fetch;
    try {
      let complete: (value: Response) => void;
      globalThis.fetch = () => new Promise(resolve => { complete = resolve; });
      let expired = 0;
      window.addEventListener('mizan:auth-expired', () => { expired++; });
      saveStoredAuth(admin, 'old-test-session');
      const pending = requestApi('/auth/me');
      saveStoredAuth(admin, 'new-test-session');
      complete!(new Response(JSON.stringify({ error: 'Expired session' }), { status: 401, headers: { 'Content-Type': 'application/json' } }));
      await assert.rejects(pending);
      assert.equal(expired, 0, 'An old request must not log out a replacement session');
      const active = requestApi('/auth/me');
      complete!(new Response('{}', { status: 401, headers: { 'Content-Type': 'application/json' } }));
      await assert.rejects(active); assert.equal(expired, 1);
      clearStoredAuth();
    } finally { globalThis.fetch = fetchBefore; }
  } finally {
    if (previousLocal) Object.defineProperty(globalThis, 'localStorage', previousLocal); else Reflect.deleteProperty(globalThis, 'localStorage');
    if (previousSession) Object.defineProperty(globalThis, 'sessionStorage', previousSession); else Reflect.deleteProperty(globalThis, 'sessionStorage');
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else Reflect.deleteProperty(globalThis, 'window');
  }
});
