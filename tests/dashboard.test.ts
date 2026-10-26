import test from 'node:test';
import assert from 'node:assert/strict';
import { activeCategories, createWorkspace, groupTasksByCategory, mergeWorkspace, parseWorkspace, taskCategoryId, UNASSIGNED_CATEGORY } from '../src/shared/workspace';
import type { Task } from '../src/types';
import { deletePlannerCategoryAndTasks } from '../src/utils/categoryDeletion';

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
Object.defineProperty(globalThis, 'window', { value: new EventTarget(), configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true });
const auth = await import('../src/utils/auth');
const storage = await import('../src/utils/storage');
const workspace = await import('../src/utils/workspace');
const queue = await import('../src/services/syncQueue');
const oldTask: Task = { id: 'existing', title: 'Existing appointment', time: '09:45', endTime: '10:30', duration: 45, status: 'done', category: 'study', createdAt: '2026-01-01T00:00:00Z' };

test('dashboard uses existing daily task storage and keeps legacy timeline behavior', async t => {
  auth.saveStoredAuth({ id: 'legacy-dashboard', userCode: 'OLD' }, 'test-token');
  await t.test('missing metadata selects timeline on any device and retains the 24-hour day', () => {
    assert.equal(workspace.getPlannerWorkspace().view, 'timeline');
    assert.equal(storage.getDayRecord('2026-01-01').tasks.length, 24);
  });
  await t.test('cards start with an empty day; switching views leaves existing records unchanged', () => {
    workspace.storeWorkspace(createWorkspace('cards'));
    assert.deepEqual(storage.getDayRecord('2026-01-02').tasks, []);
    storage.saveAllDays({ '2026-01-01': { date: '2026-01-01', tasks: [oldTask], updatedAt: oldTask.createdAt } });
    workspace.setPlannerView('timeline');
    assert.deepEqual(storage.getDayRecord('2026-01-01').tasks, [oldTask]);
    workspace.setPlannerView('cards');
    assert.deepEqual(storage.getDayRecord('2026-01-01').tasks, [oldTask]);
  });
  await t.test('inline tasks have no invented start, end or duration, and timeline mutations affect the same IDs', () => {
    const task = storage.addTaskToDay('2026-01-02', { title: 'Read a chapter', time: '', categoryId: 'study' });
    assert.equal(task.time, ''); assert.equal(task.endTime, undefined); assert.equal(task.duration, undefined);
    assert.equal(storage.calculateStats([task]).totalDurationMinutes, 0);
    workspace.setPlannerView('timeline');
    storage.updateTaskInDay('2026-01-02', task.id, { status: 'done', time: '12:15', endTime: '12:45' });
    workspace.setPlannerView('cards');
    const updated = storage.getDayRecord('2026-01-02').tasks[0];
    assert.equal(updated.id, task.id); assert.equal(updated.status, 'done'); assert.equal(updated.duration, 30);
    storage.updateTaskInDay('2026-01-02', task.id, { time: '' });
    assert.equal(storage.getDayRecord('2026-01-02').tasks[0].endTime, undefined);
    storage.deleteTaskFromDay('2026-01-02', task.id);
    assert.equal(storage.getDayRecord('2026-01-02').tasks.length, 0);
  });
  await t.test('renaming and deleting categories preserve tasks on every date and the archive', () => {
    const created = workspace.createPlannerCategory('My project', 'briefcase');
    const category = created.categories.find(c => c.name === 'My project')!;
    const task = storage.addTaskToDay('2026-01-03', { title: 'Project task', time: '', categoryId: category.id });
    workspace.updatePlannerCategory(category.id, { name: 'Renamed project', icon: 'leaf', collapsed: true });
    assert.equal(taskCategoryId(task, workspace.getPlannerWorkspace()), category.id);
    const before = storage.loadAllDays();
    workspace.deletePlannerCategory(category.id);
    assert.deepEqual(storage.loadAllDays(), before);
    assert.equal(taskCategoryId(task, workspace.getPlannerWorkspace()), UNASSIGNED_CATEGORY);
    assert.equal(storage.getAllArchiveDays().length, 2);
  });
  await t.test('account preferences and pending category edits are isolated and persist through sign-in', () => {
    const first = workspace.getPlannerWorkspace();
    assert.ok(queue.getQueue().some(item => item.type === 'workspace'));
    auth.clearStoredAuth();
    auth.saveStoredAuth({ id: 'other-dashboard', userCode: 'OTHER' }, 'other-token');
    assert.equal(workspace.getPlannerWorkspace().view, 'timeline'); assert.deepEqual(queue.getQueue(), []);
    auth.clearStoredAuth(); auth.saveStoredAuth({ id: 'legacy-dashboard', userCode: 'OLD' }, 'test-token');
    assert.deepEqual(workspace.getPlannerWorkspace(), first);
    auth.clearStoredAuth();
  });
});

test('workspace merge retains independent edits and category deletion despite stale offline uploads', () => {
  const base = createWorkspace('cards', '2026-01-01T00:00:00Z');
  const first = structuredClone(base), second = structuredClone(base);
  first.categories[0] = { ...first.categories[0], name: 'New study name', updatedAt: '2026-01-02T00:00:00Z' };
  second.categories[1] = { ...second.categories[1], name: 'New work name', updatedAt: '2026-01-03T00:00:00Z' };
  second.view = 'timeline'; second.viewUpdatedAt = '2026-01-04T00:00:00Z';
  const merged = mergeWorkspace(first, second);
  assert.equal(merged.categories.find(c => c.id === 'study')?.name, 'New study name');
  assert.equal(merged.categories.find(c => c.id === 'work')?.name, 'New work name');
  assert.equal(merged.view, 'timeline');
  const deleted = structuredClone(merged);
  deleted.categories[0].deletedAt = deleted.categories[0].updatedAt = '2026-01-05T00:00:00Z';
  const stale = structuredClone(base);
  stale.categories[0].updatedAt = '2026-01-06T00:00:00Z';
  assert.ok(!activeCategories(mergeWorkspace(deleted, stale)).some(c => c.id === deleted.categories[0].id));
  assert.equal(mergeWorkspace(merged, base).view, 'timeline');
});

test('deleting a card permanently removes only its associated tasks across days', () => {
  auth.saveStoredAuth({ id: 'category-delete', userCode: 'DELETE' }, 'test-token');
  const current = createWorkspace('cards');
  current.categories.push({ id: 'custom', name: 'Custom card', icon: 'leaf', order: 7, updatedAt: current.viewUpdatedAt });
  workspace.storeWorkspace(current);
  const removed = { id: 'removed', title: 'Remove me', time: '', status: 'pending' as const, categoryId: 'custom', createdAt: '2026-01-01T00:00:00Z' };
  const kept = { id: 'kept', title: 'Keep me', time: '', status: 'pending' as const, categoryId: 'study', createdAt: '2026-01-01T00:00:00Z' };
  storage.saveAllDays({
    '2026-01-04': { date: '2026-01-04', tasks: [removed, kept], updatedAt: '2026-01-01T00:00:00Z' },
    '2026-01-05': { date: '2026-01-05', tasks: [{ ...removed, id: 'removed-2' }], updatedAt: '2026-01-01T00:00:00Z' },
  });
  queue.saveQueue([]);

  deletePlannerCategoryAndTasks('custom');

  const after = storage.loadAllDays();
  assert.deepEqual(after['2026-01-04'].tasks.map(task => task.id), ['kept']);
  assert.deepEqual(after['2026-01-05'].tasks, []);
  assert.ok(after['2026-01-04'].deletedTaskIds?.removed);
  assert.ok(after['2026-01-05'].deletedTaskIds?.['removed-2']);
  assert.ok(!activeCategories(workspace.getPlannerWorkspace()).some(category => category.id === 'custom'));
  assert.ok(queue.getQueue().some(item => item.type === 'workspace'));
  assert.equal(queue.getQueue().filter(item => item.type === 'day').length, 2);
  auth.clearStoredAuth();
});

test('legacy metadata upgrades without losing categories or deletion markers', () => {
  const legacy = { view: 'cards', categories: [
    { id: 'study', name: 'My study' },
    { id: 'custom', name: 'My card', deletedAt: '2026-10-01T00:00:00Z' },
  ] };
  const upgraded = parseWorkspace(legacy);
  assert.deepEqual(upgraded.categories.map(c => c.id), ['study', 'custom']);
  assert.equal(upgraded.categories[0].name, 'My study');
  assert.equal(upgraded.categories[0].icon, 'book');
  assert.equal(upgraded.categories[1].deletedAt, legacy.categories[1].deletedAt);
  assert.deepEqual(parseWorkspace(JSON.parse(JSON.stringify(upgraded))), upgraded);
});

test('workspace rejects invalid metadata without silently inventing categories', () => {
  const base = createWorkspace('cards');
  for (const value of [{ ...base, view: 'bad' }, { ...base, categories: [base.categories[0], base.categories[0]] },
    { ...base, categories: [{ ...base.categories[0], name: ' ' }] }, { ...base, categories: [{ ...base.categories[0], icon: 'script' }] },
    { ...base, categories: [{ ...base.categories[0], updatedAt: 'invalid' }] }, { ...base, viewUpdatedAt: 123 }]) {
    assert.throws(() => parseWorkspace(value), /Invalid planner workspace/);
  }
});

test('cards partition named legacy and custom tasks exactly once, retaining unknown categories', () => {
  const workspace = createWorkspace('cards');
  workspace.categories.push({ id: 'custom', name: 'Custom card', icon: 'leaf', order: 7, updatedAt: workspace.viewUpdatedAt });
  const tasks = [oldTask, { ...oldTask, id: 'custom-task', categoryId: 'custom' },
    { ...oldTask, id: 'unknown-task', categoryId: 'missing-card' }, { ...oldTask, id: 'empty-slot', title: '' }];
  const grouped = groupTasksByCategory(tasks, workspace);
  assert.equal(grouped.get('study')?.[0].id, oldTask.id);
  assert.equal(grouped.get('custom')?.[0].id, 'custom-task');
  assert.equal(grouped.get(UNASSIGNED_CATEGORY)?.[0].id, 'unknown-task');
  assert.deepEqual([...grouped.values()].flat().map(t => t.id).sort(), ['custom-task', 'existing', 'unknown-task']);
});
