import test from 'node:test';
import assert from 'node:assert/strict';
import type { Task } from '../src/types';
import { createWorkspace } from '../src/shared/workspace';
import { DAILY_PRAYERS } from '../src/utils/prayerTasks';
import { shouldPlayListCompletionSound } from '../src/utils/listCompletion';

const workspace = createWorkspace('cards');
const task = (id: string, status: Task['status'] = 'pending', categoryId = 'study'): Task => ({ id, title: id, status, categoryId, time: '', createdAt: '2026-10-14T00:00:00Z' });
const prayers = DAILY_PRAYERS.map(prayer => ({ ...task(prayer.id, 'done', 'worship'), title: `صلاة ${prayer.nameAr}` }));
const finish = (tasks: Task[], id: string) => tasks.map(item => item.id === id ? { ...item, status: 'done' as const } : item);

test('a card celebrates only its final completed task, including untimed tasks and hidden incomplete states', () => {
  const before = [task('first', 'done'), task('last'), task('other-card', 'pending', 'work')];
  assert.equal(shouldPlayListCompletionSound(before, finish(before, 'last'), workspace, 'cards', 'last'), true);
  assert.equal(shouldPlayListCompletionSound(before, finish(before, 'last'), workspace, 'timeline', 'last'), false);
  for (const status of ['pending', 'not-done'] as const) {
    const blocked = [...before, task('hidden-blocker', status)];
    assert.equal(shouldPlayListCompletionSound(blocked, finish(blocked, 'last'), workspace, 'cards', 'last'), false);
  }
  const almost = [...Array.from({ length: 199 }, (_, i) => task(String(i), 'done')), task('last'), task('not-done', 'not-done')];
  assert.equal(Math.round(200 / 201 * 100), 100);
  assert.equal(shouldPlayListCompletionSound(almost, finish(almost, 'last'), workspace, 'cards', 'last'), false, 'Rounded 100% is not full completion');
});

test('timeline completion includes every named task and all five prayers, excluding unused hourly placeholders', () => {
  const before = [...prayers, task('timed', 'done'), task('untimed', 'not-done'), { ...task('empty-hour'), title: '  ', time: '08:00' }];
  assert.equal(shouldPlayListCompletionSound(before, finish(before, 'untimed'), workspace, 'timeline', 'untimed'), true);
  const missingPrayer = before.filter(item => item.id !== 'isha');
  assert.equal(shouldPlayListCompletionSound(missingPrayer, finish(missingPrayer, 'untimed'), workspace, 'timeline', 'untimed'), false);
  const blocked = [...before, task('another-task', 'not-done', 'work')];
  assert.equal(shouldPlayListCompletionSound(blocked, finish(blocked, 'untimed'), workspace, 'timeline', 'untimed'), false);
});

test('the fifth prayer completes its card in both views and can complete the day in the same single decision', () => {
  const before = prayers.slice(0, 4), after = [...before, prayers[4]];
  for (const view of ['cards', 'timeline'] as const) {
    assert.equal(shouldPlayListCompletionSound(before, after, workspace, view, 'isha'), true);
    assert.equal(shouldPlayListCompletionSound(after, after, workspace, view, 'isha'), false);
    const blocked = before.map(item => item.id === 'asr' ? { ...item, status: 'not-done' as const } : item);
    assert.equal(shouldPlayListCompletionSound(blocked, [...blocked, prayers[4]], workspace, view, 'isha'), false);
  }
});

test('empty lists, deletions, unchanged done states and previously completed cards do not replay; recompletion can celebrate', () => {
  const completed = [task('done', 'done')];
  assert.equal(shouldPlayListCompletionSound([], [], workspace, 'cards', 'missing'), false);
  assert.equal(shouldPlayListCompletionSound(completed, completed, workspace, 'cards', 'done'), false);
  assert.equal(shouldPlayListCompletionSound(completed, [...completed, task('new-done', 'done')], workspace, 'cards', 'new-done'), false);
  assert.equal(shouldPlayListCompletionSound([], completed, workspace, 'cards', 'done'), true);
  assert.equal(shouldPlayListCompletionSound([...completed, task('deleted')], completed, workspace, 'cards', 'done'), false);
  assert.equal(shouldPlayListCompletionSound([task('done')], completed, workspace, 'cards', 'done'), true);
});

test('collapsed, custom and deleted categories use the entire shared list without mutating tasks or preferences', () => {
  const custom = createWorkspace('cards');
  custom.categories[0].collapsed = true;
  custom.categories[1].deletedAt = '2026-10-14T00:00:00Z';
  custom.categories.push({ id: 'custom', name: 'Custom', icon: 'leaf', order: 8, updatedAt: custom.viewUpdatedAt });
  const before = [task('study-done', 'done'), task('study-last'), task('custom-last', 'pending', 'custom'), task('deleted-category', 'done', 'work'), task('unknown-last', 'pending', 'missing')];
  const snapshot = structuredClone({ before, custom });
  for (const id of ['study-last', 'custom-last', 'unknown-last']) assert.equal(shouldPlayListCompletionSound(before, finish(before, id), custom, 'cards', id), true);
  assert.deepEqual({ before, custom }, snapshot);
});
