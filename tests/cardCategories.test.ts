import test from 'node:test';
import assert from 'node:assert/strict';
import { getTaskCardCategories } from '../src/utils/cardCategories';
import { createWorkspace, UNASSIGNED_CATEGORY } from '../src/shared/workspace';
import type { Task } from '../src/types';

const task = (title: string, categoryId: string): Task => ({ id: title, title, categoryId, time: '', status: 'pending', createdAt: '2026-10-14T00:00:00Z' });

test('task destinations match dashboard cards while keeping the five daily prayers separate', () => {
  const workspace = createWorkspace('cards');
  const prayers = ['صلاة الفجر', 'صلاة الظهر', 'صلاة العصر', 'صلاة المغرب', 'صلاة العشاء'].map(title => task(title, 'worship'));
  assert.ok(!getTaskCardCategories(prayers, workspace, true).some(card => card.id === 'worship'));
  assert.ok(getTaskCardCategories([...prayers, task('قراءة القرآن', 'worship')], workspace).some(card => card.id === 'worship'));
  assert.equal(getTaskCardCategories(prayers, workspace, true).filter(card => card.id === UNASSIGNED_CATEGORY).length, 1);
  assert.ok(!getTaskCardCategories(prayers, workspace).some(card => card.id === UNASSIGNED_CATEGORY));
});

test('deleted, renamed and collapsed cards retain their tasks and usable destinations', () => {
  const workspace = createWorkspace('timeline');
  workspace.categories[0] = { ...workspace.categories[0], name: 'الجامعة', nameEn: undefined, collapsed: true };
  workspace.categories[1].deletedAt = '2026-10-14T00:00:00Z';
  const tasks = [task('محاضرة', 'study'), task('عمل قديم', 'work')];
  const before = structuredClone({ tasks, workspace });
  const cards = getTaskCardCategories(tasks, workspace);
  assert.equal(cards.find(card => card.id === 'study')?.name, 'الجامعة');
  assert.equal(cards.find(card => card.id === 'study')?.collapsed, true);
  assert.ok(!cards.some(card => card.id === 'work'));
  assert.ok(cards.some(card => card.id === UNASSIGNED_CATEGORY));
  assert.deepEqual({ tasks, workspace }, before, 'Resolving destinations must not modify tasks or preferences');
  workspace.categories.forEach(card => { card.deletedAt = '2026-10-14T00:00:00Z'; });
  assert.deepEqual(getTaskCardCategories(tasks, workspace).map(card => card.id), [UNASSIGNED_CATEGORY]);
});
