import test from 'node:test';
import assert from 'node:assert/strict';
import type { DayRecord, Task } from '../src/types';

class MemoryStorage {
  values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] || null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
Object.defineProperty(globalThis, 'window', { value: new EventTarget(), configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });
const auth = await import('../src/utils/auth');
const storage = await import('../src/utils/storage');
const queue = await import('../src/services/syncQueue');
const engine = await import('../src/services/syncEngine');
const recurring = await import('../src/utils/recurring');
const { userStorage, legacyBackup } = await import('../src/utils/scopedStorage');
const { mergeDay } = await import('../src/shared/merge');
const workspace = await import('../src/utils/workspace');
const { createWorkspace } = await import('../src/shared/workspace');
const user = { id: 'alice', userCode: 'ALICE', username: 'alice' };
const task: Task = { id: 'one', time: '09:30', title: 'Study', status: 'pending', duration: 75, endTime: '10:45', createdAt: '2026-10-01T09:00:00Z', updatedAt: '2026-10-01T09:00:00Z' };
const day: DayRecord = { date: '2026-10-01', tasks: [task, { ...task, id: 'two', time: '09:45' }, { ...task, id: 'flexible', time: '' }], updatedAt: task.updatedAt! };

test('login accepts valid credentials even when optional workspace metadata is incompatible', async () => {
  const originalFetch = globalThis.fetch;
  const { loginApi } = await import('../src/services/api');
  try {
    for (const metadata of [{ view: 'cards', categories: [] }, createWorkspace('cards')]) {
      globalThis.fetch = async () => new Response(JSON.stringify({ success: true, user, token: 'valid-token', workspace: metadata }), { headers: { 'content-type': 'application/json' } });
      const result = await loginApi('alice', 'password');
      assert.equal(result.success, true);
      assert.equal(result.token, 'valid-token');
      assert.deepEqual(result.workspace ? JSON.parse(JSON.stringify(result.workspace)) : undefined, 'viewUpdatedAt' in metadata ? metadata : undefined);
    }
    globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { 'content-type': 'application/json' } });
    assert.equal((await loginApi('alice', 'wrong')).success, false);
  } finally { globalThis.fetch = originalFetch; }
});

test('client storage and sync regression cases', async t => {
  auth.saveStoredAuth(user, 'signed-token');
  await t.test('reading preserves arbitrary minutes, multiple tasks per hour and untimed tasks', () => {
    storage.saveAllDays({ [day.date]: day });
    assert.deepEqual(storage.loadAllDays()[day.date], day);
    assert.deepEqual(storage.getDayRecord(day.date), day);
    storage.apply24HourTemplate(day.date, true);
    for (const original of day.tasks) assert.deepEqual(storage.getDayRecord(day.date).tasks.find(t => t.id === original.id), original);
  });
  await t.test('empty days stay empty, and reading an old date never purges history', () => {
    const empty = { date: '2020-01-01', tasks: [], updatedAt: day.updatedAt };
    storage.saveAllDays({ [empty.date]: empty });
    assert.deepEqual(storage.getDayRecord(empty.date), empty);
  });
  await t.test('accounts have independent days, habits, recurring items, settings and queues', () => {
    storage.saveAllDays({ [day.date]: day });
    userStorage.setItem('daily_habits_v8_saturday_schedule', '[]');
    recurring.saveStoredRecurringItems([]);
    queue.enqueueDay(day);
    auth.clearStoredAuth();
    auth.saveStoredAuth({ id: 'bob', userCode: 'BOB' }, 'bob-token');
    assert.deepEqual(storage.loadAllDays(), {}); assert.deepEqual(queue.getQueue(), []);
    auth.clearStoredAuth(); auth.saveStoredAuth(user, 'signed-token');
    assert.equal(storage.loadAllDays()[day.date].tasks.length, 3);
    assert.deepEqual(storage.getStoredHabits(), []); assert.deepEqual(recurring.loadStoredRecurringItems(), []);
    assert.equal(auth.getAuthToken(), 'signed-token');
  });
  await t.test('legacy records are preserved without auto-import into another account', () => {
    localStorage.setItem('daily_tasks_app_data_v7_saturday26_clean', JSON.stringify({ old: true }));
    assert.deepEqual(legacyBackup()['daily_tasks_app_data_v7_saturday26_clean'], { old: true });
    assert.equal(storage.loadAllDays().old, undefined);
  });
  await t.test('deleted tasks do not return after stale merge; explicit restoration has a newer timestamp', () => {
    storage.saveAllDays({ [day.date]: day });
    storage.deleteTaskFromDay(day.date, 'one');
    const deleted = storage.getDayRecord(day.date);
    assert.ok(deleted.deletedTaskIds?.one);
    assert.ok(!mergeDay(deleted, day).tasks.some(t => t.id === 'one'));
    storage.restoreTaskToDay(day.date, task);
    assert.ok(mergeDay(deleted, storage.getDayRecord(day.date)).tasks.some(t => t.id === 'one'));
  });
  await t.test('queued preferences merge instead of dropping the first setting', () => {
    queue.saveQueue([]);
    queue.enqueue('settings', { theme: 'light' }); queue.enqueue('settings', { lang: 'en' });
    assert.deepEqual(queue.getQueue()[0].data, { theme: 'light', lang: 'en' });
  });
  await t.test('new collection edits advance past the last observed remote version', () => {
    queue.saveQueue([]);
    const future = Date.now() + 86400000;
    userStorage.setItem('sync_versions', JSON.stringify({ habits: future }));
    queue.enqueue('habits', []);
    assert.ok(queue.getQueue()[0].clientTimestamp > future);
    queue.saveQueue([]);
  });
  await t.test('edits created while sync is in flight remain queued and are retried', async () => {
    queue.saveQueue([]); storage.saveAllDays({ [day.date]: day }); queue.enqueueDay(day);
    let release!: (value: Response) => void;
    globalThis.fetch = async () => new Promise<Response>(resolve => { release = resolve; });
    const pending = engine.triggerSync(user.id, true);
    assert.ok(release);
    const edited = { ...day, tasks: [{ ...task, title: 'New edit', updatedAt: '2026-10-02T10:00:00Z' }], updatedAt: '2026-10-02T10:00:00Z' };
    storage.saveAllDays({ [day.date]: edited }); queue.enqueueDay(edited);
    release(new Response(JSON.stringify({ success: true, days: { [day.date]: day }, habits: [], recurring: [], settings: {}, versions: {} }), { headers: { 'content-type': 'application/json' } }));
    assert.equal(await pending, true);
    assert.equal(queue.getQueue().length, 1);
    assert.equal(storage.loadAllDays()[day.date].tasks.find(t => t.id === task.id)?.title, 'New edit');
    auth.clearStoredAuth(); auth.saveStoredAuth(user, 'signed-token');
  });
  await t.test('category edits made in flight merge remote cards and remain queued', async () => {
    queue.saveQueue([]);
    const baseline = createWorkspace('cards');
    workspace.storeWorkspace(baseline); queue.enqueue('workspace', baseline);
    let release!: (value: Response) => void;
    globalThis.fetch = async () => new Promise<Response>(resolve => { release = resolve; });
    const pending = engine.triggerSync(user.id, true);
    const edited = workspace.createPlannerCategory('Created during sync', 'leaf');
    const category = edited.categories.find(c => c.name === 'Created during sync')!;
    const remote = { ...baseline, categories: [...baseline.categories, { ...category, id: 'remote-card', name: 'Remote category' }] };
    release(new Response(JSON.stringify({ success: true, days: {}, workspace: remote, versions: { workspace: 1 } }), { headers: { 'content-type': 'application/json' } }));
    assert.equal(await pending, true);
    assert.equal(queue.getQueue().length, 1);
    assert.ok(workspace.getPlannerWorkspace().categories.some(c => c.id === category.id));
    assert.ok(workspace.getPlannerWorkspace().categories.some(c => c.id === 'remote-card'));
    assert.ok(queue.getQueue()[0].data.categories.some((c: any) => c.id === 'remote-card'));
    auth.clearStoredAuth(); auth.saveStoredAuth(user, 'signed-token');
  });
  await t.test('an older backend cannot silently acknowledge unsupported workspace edits', async () => {
    queue.saveQueue([]); queue.enqueue('workspace', createWorkspace('cards'));
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true, days: {}, versions: {} }), { headers: { 'content-type': 'application/json' } });
    assert.equal(await engine.triggerSync(user.id, true), false);
    assert.equal(queue.getQueue().length, 1);
    auth.clearStoredAuth(); auth.saveStoredAuth(user, 'signed-token'); queue.saveQueue([]);
  });
  await t.test('late responses from previous account never populate the active account', async () => {
    let release!: (value: Response) => void;
    globalThis.fetch = async () => new Promise<Response>(resolve => { release = resolve; });
    const pending = engine.triggerSync(user.id, true);
    auth.clearStoredAuth(); auth.saveStoredAuth({ id: 'bob', userCode: 'BOB' }, 'bob-token');
    release(new Response(JSON.stringify({ success: true, days: { [day.date]: day } }), { headers: { 'content-type': 'application/json' } }));
    assert.equal(await pending, false); assert.deepEqual(storage.loadAllDays(), {});
    auth.clearStoredAuth();
  });
});
