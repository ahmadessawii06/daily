import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CANONICAL_SPACES, ensureCanonicalSpaces, getPlannerWorkspace, resetPlannerWorkspace, storeWorkspace } from '../src/utils/workspace';
import { createWorkspace, activeCategories } from '../src/shared/workspace';
import { getTaskCardCategories } from '../src/utils/cardCategories';
import type { PlannerWorkspace, Task } from '../src/types';

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
Object.defineProperty(globalThis, 'window', { value: new EventTarget(), configurable: true });

test('6 default spaces: names, icons, and presence in ensureCanonicalSpaces', () => {
  const expected = [
    { id: 'work', name: 'العمل والمشاريع', icon: 'briefcase' },
    { id: 'study', name: 'الجامعة والدراسة', icon: 'book' },
    { id: 'health', name: 'الصحة والنشاط', icon: 'heart' },
    { id: 'rest', name: 'الحياة الشخصية', icon: 'leaf' },
    { id: 'ideas', name: 'الأفكار والمساعدات', icon: 'moon' },
    { id: 'expenses', name: 'المصاريف اليومية', icon: 'dollar-sign' },
  ];

  const ws = ensureCanonicalSpaces(createWorkspace('cards'));
  const active = activeCategories(ws);

  for (const exp of expected) {
    const found = active.find(c => c.id === exp.id);
    assert.ok(found, `Category ${exp.id} must be present`);
    assert.equal(found?.name, exp.name, `Category ${exp.id} name must match`);
    assert.equal(found?.icon, exp.icon, `Category ${exp.id} icon must match`);
  }
});

test('5 default spaces: migration upgrades legacy study name and retires legacy general', () => {
  const legacyWorkspace: PlannerWorkspace = {
    view: 'cards',
    viewUpdatedAt: '2026-01-01T00:00:00Z',
    categories: [
      { id: 'study', name: 'الدراسة', icon: 'book', order: 0, updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'work', name: 'العمل والمشاريع', icon: 'briefcase', order: 1, updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'health', name: 'الصحة والنشاط', icon: 'heart', order: 2, updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'rest', name: 'الحياة الشخصية', icon: 'leaf', order: 3, updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'general', name: 'مساحة مفتوحة', icon: 'layers', order: 4, updatedAt: '2026-01-01T00:00:00Z' },
    ],
  };

  const migrated = ensureCanonicalSpaces(legacyWorkspace);
  const active = activeCategories(migrated);

  // 'study' is updated to 'الجامعة والدراسة'
  assert.equal(active.find(c => c.id === 'study')?.name, 'الجامعة والدراسة');
  // 'ideas' was missing, now seeded
  assert.ok(active.some(c => c.id === 'ideas'));
  // 'general' is retired
  assert.ok(!active.some(c => c.id === 'general'));
});

test('5 default spaces: custom user categories are preserved and not duplicated', () => {
  const workspaceWithCustom: PlannerWorkspace = {
    view: 'cards',
    viewUpdatedAt: '2026-01-01T00:00:00Z',
    categories: [
      { id: 'custom_1', name: 'مشروع تخرج', icon: 'book', order: 10, updatedAt: '2026-01-01T00:00:00Z' },
    ],
  };

  const migrated = ensureCanonicalSpaces(workspaceWithCustom);
  const active = activeCategories(migrated);

  // Custom category remains
  assert.ok(active.some(c => c.id === 'custom_1' && c.name === 'مشروع تخرج'));
  // All 5 canonical spaces added
  assert.equal(active.filter(c => ['work', 'study', 'health', 'rest', 'ideas', 'expenses'].includes(c.id)).length, 6);
  // Total active categories = 7
  assert.equal(active.length, 7);

  // Running it again is idempotent
  const twice = ensureCanonicalSpaces(migrated);
  assert.equal(activeCategories(twice).length, 7);
});

test('getTaskCardCategories renders all 6 default spaces even with 0 tasks', () => {
  const ws = ensureCanonicalSpaces(createWorkspace('cards'));
  const cards = getTaskCardCategories([], ws);
  const ids = cards.map(c => c.id);

  assert.ok(ids.includes('work'));
  assert.ok(ids.includes('study'));
  assert.ok(ids.includes('health'));
  assert.ok(ids.includes('rest'));
  assert.ok(ids.includes('ideas'));
  assert.ok(ids.includes('expenses'));
});

