import test from 'node:test';
import assert from 'node:assert/strict';
import type { Task } from '../src/types';
import { DAILY_PRAYERS } from '../src/utils/prayerTasks';
import { calculateDailyProgress } from '../src/utils/dailyProgress';

const task = (id: string, title: string, status: Task['status'] = 'pending'): Task => ({ id, title, status, time: '', createdAt: '2026-10-14T00:00:00Z' });
const prayers = DAILY_PRAYERS.map(prayer => task(prayer.id, `صلاة ${prayer.nameAr}`, 'done'));

test('daily progress includes five pending prayers on empty days without generating records', () => {
  const tasks: Task[] = [];
  assert.deepEqual(calculateDailyProgress(tasks), { total: 5, done: 0, notDone: 0, pending: 5, completionPercentage: 0, totalDurationMinutes: 0, doneDurationMinutes: 0 });
  assert.deepEqual(tasks, []);
  assert.equal(calculateDailyProgress([task('blank', '  ')]).total, 5);
});

test('eight ordinary tasks plus five prayers total thirteen throughout completion and removal', () => {
  const ordinary = Array.from({ length: 8 }, (_, index) => task(String(index), `Task ${index}`, 'done'));
  assert.equal(calculateDailyProgress(ordinary).total, 13);
  assert.equal(calculateDailyProgress(ordinary).completionPercentage, 62);
  for (let count = 1; count <= 5; count++) {
    const stats = calculateDailyProgress([...ordinary, ...prayers.slice(0, count)]);
    assert.equal(stats.total, 13);
    assert.equal(stats.done, 8 + count);
    assert.equal(stats.pending, 5 - count);
    assert.equal(stats.completionPercentage, Math.round((8 + count) / 13 * 100));
  }
  assert.equal(calculateDailyProgress([...ordinary, ...prayers.slice(1)]).total, 13);
});

test('stored prayer statuses and duplicate records are counted once each, retaining durations and data', () => {
  const stored = [
    { ...prayers[0], duration: 10, notes: 'Keep this note' },
    { ...prayers[1], status: 'not-done' as const },
    { ...prayers[2], status: 'pending' as const },
    { ...task('extra-fajr', 'Fajr prayer', 'done'), duration: 5 },
    task('activity', 'قراءة بعد صلاة الفجر'),
  ];
  const before = structuredClone(stored);
  const stats = calculateDailyProgress(stored);
  assert.deepEqual({ total: stats.total, done: stats.done, notDone: stats.notDone, pending: stats.pending }, { total: 7, done: 2, notDone: 1, pending: 4 });
  assert.equal(stats.totalDurationMinutes, 15);
  assert.equal(stats.doneDurationMinutes, 15);
  assert.deepEqual(stored, before);
  assert.equal(calculateDailyProgress([]).done, 0, 'New dates must not inherit completed prayers');
});
