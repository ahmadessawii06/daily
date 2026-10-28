import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspace, activeCategories } from '../src/shared/workspace';
import {
  createPlannerCategory,
  deletePlannerCategory,
  getPlannerWorkspace,
  readStoredWorkspace,
  storePlannerWorkspaceForDate,
  storeWorkspace,
  updatePlannerCategory,
} from '../src/utils/workspace';

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
Object.defineProperty(globalThis, 'window', { value: new EventTarget(), configurable: true });

const ids = (date: string) => activeCategories(getPlannerWorkspace(date)).map(category => category.id);

test('daily card configurations initialize independently and survive switching and refresh', () => {
  const dayA = '2026-10-28';
  const dayB = '2026-10-29';
  storeWorkspace(createWorkspace('cards'));

  assert.deepEqual(ids(dayA), ['work', 'study', 'health', 'rest', 'ideas', 'expenses']);
  assert.deepEqual(ids(dayB), ['work', 'study', 'health', 'rest', 'ideas', 'expenses']);

  deletePlannerCategory('study', dayA);
  updatePlannerCategory('expenses', { collapsed: true }, dayA);
  const withCustom = createPlannerCategory('Day A custom', 'leaf', dayA);
  const dayAWorkspace = getPlannerWorkspace(dayA);
  storePlannerWorkspaceForDate(dayA, {
    ...dayAWorkspace,
    categories: [...dayAWorkspace.categories].reverse().map((category, order) => ({ ...category, order })),
  });

  assert.equal(ids(dayA).includes('study'), false);
  assert.ok(ids(dayA).includes(withCustom.categories.find(category => category.name === 'Day A custom')!.id));
  assert.deepEqual(ids(dayB), ['work', 'study', 'health', 'rest', 'ideas', 'expenses']);

  // Re-reading the persisted workspace simulates a refresh; switching back must
  // return the exact date-scoped configuration, not the last opened date.
  assert.ok(readStoredWorkspace()?.dailyCategories?.[dayA]);
  const beforeRefresh = ids(dayA);
  assert.deepEqual(ids(dayB), ['work', 'study', 'health', 'rest', 'ideas', 'expenses']);
  assert.deepEqual(ids(dayA), beforeRefresh);
});

test('an initialized day with zero cards is never repopulated', () => {
  const date = '2026-10-30';
  const workspace = getPlannerWorkspace(date);
  storePlannerWorkspaceForDate(date, { ...workspace, categories: workspace.categories.map(category => ({ ...category, deletedAt: new Date().toISOString() })) });
  assert.deepEqual(ids(date), []);
});
