import test from 'node:test';
import assert from 'node:assert/strict';
import type { Task } from '../src/types';
import { DAILY_PRAYERS, dailyPrayerId, partitionPrayerTasks } from '../src/utils/prayerTasks';

test('prayer card recognizes full Arabic and English prayer titles without capturing other activities', () => {
  assert.equal(dailyPrayerId('صَلاةُ الفَجْرِ'), 'fajr');
  assert.equal(dailyPrayerId('Dhuhr prayer'), 'dhuhr');
  assert.equal(dailyPrayerId('Pray Zuhr'), 'dhuhr');
  assert.equal(dailyPrayerId('صلاه العصر'), 'asr');
  assert.equal(dailyPrayerId('صلاة المغرب 🕌'), 'maghrib');
  assert.equal(dailyPrayerId('Isha'), 'isha');
  for (const title of ['قراءة بعد صلاة الفجر', 'Cook dinner', 'قراءة القرآن', 'أذكار الصباح', 'Travel to المغرب']) assert.equal(dailyPrayerId(title), undefined);
});

test('five prayer slots are a read-only projection; duplicate and extra worship tasks remain accessible', () => {
  const prayers: Task[] = DAILY_PRAYERS.map((prayer, index) => ({ id: prayer.id, title: `صلاة ${prayer.nameAr}`, status: index === 0 ? 'done' : 'pending', category: 'worship', time: '05:10', createdAt: '2026-01-01T00:00:00Z' }));
  const extra = { ...prayers[0], id: 'quran', title: 'قراءة القرآن', notes: 'Keep this note' };
  const duplicate = { ...prayers[0], id: 'second-fajr', notes: 'Do not drop duplicate' };
  const tasks = [...prayers, extra, duplicate];
  const before = structuredClone(tasks);
  const result = partitionPrayerTasks(tasks);
  assert.equal(result.slots.length, 5);
  assert.equal(result.slots[0].task, prayers[0]);
  assert.deepEqual(result.otherTasks, [extra, duplicate]);
  assert.deepEqual([...result.slots.flatMap(slot => slot.task ? [slot.task.id] : []), ...result.otherTasks.map(task => task.id)].sort(), tasks.map(task => task.id).sort());
  assert.deepEqual(tasks, before);
  assert.equal(partitionPrayerTasks([]).slots.filter(slot => slot.task).length, 0);
  assert.equal(partitionPrayerTasks(prayers.slice(1)).slots[0].task, undefined);
});
