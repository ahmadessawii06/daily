import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDateTimeInPrayerTimeZone,
  getNextPrayerSchedule,
  getPrayerIntervalProgress,
  getPrayerTimeZoneDate,
  isPrayerUpcomingOnDate,
} from '../src/utils/prayerSchedule';

const prayers = [
  { id: 'fajr', time: '04:30' },
  { id: 'dhuhr', time: '12:10' },
  { id: 'asr', time: '15:30' },
  { id: 'maghrib', time: '18:10' },
  { id: 'isha', time: '19:40' },
] as const;

function localInstant(date: string, time: string) {
  const instant = getDateTimeInPrayerTimeZone(date, time);
  assert.ok(instant);
  return instant;
}

test('next prayer selection follows the Asia/Hebron prayer schedule, not task completion', async t => {
  await t.test('selects Fajr before dawn, the next midday prayer, and Maghrib after Asr', () => {
    assert.equal(getNextPrayerSchedule(prayers, '04:32', localInstant('2026-10-24', '04:00'))?.id, 'fajr');
    assert.equal(getNextPrayerSchedule(prayers, '04:32', localInstant('2026-10-24', '09:00'))?.id, 'dhuhr');
    assert.equal(getNextPrayerSchedule(prayers, '04:32', localInstant('2026-10-24', '16:30'))?.id, 'maghrib');
  });

  await t.test('keeps Isha as the next prayer when all five task records are already complete', () => {
    const completedSlots = prayers.map(prayer => ({ ...prayer, status: 'done' }));
    const schedule = getNextPrayerSchedule(completedSlots, '04:32', localInstant('2026-10-24', '18:30'));
    assert.equal(schedule?.id, 'isha');
    assert.equal(schedule?.isTomorrow, false);
  });

  await t.test('uses tomorrow Fajr after Isha regardless of completed, missed, or pending task states', () => {
    const now = localInstant('2026-10-24', '21:00');
    const statuses = ['done', 'not-done', 'pending', 'done', 'not-done'] as const;
    for (const status of statuses) {
      const slotsWithStatus = prayers.map(prayer => ({ ...prayer, status }));
      const schedule = getNextPrayerSchedule(slotsWithStatus, '04:32', now);
      assert.deepEqual(schedule, { id: 'fajr', time: '04:32', date: '2026-10-25', isTomorrow: true });
      const countdownTarget = schedule && getDateTimeInPrayerTimeZone(schedule.date, schedule.time);
      assert.ok(countdownTarget && countdownTarget.getTime() > now.getTime());
    }
  });

  await t.test('selects the current day Fajr after midnight and before its time', () => {
    const schedule = getNextPrayerSchedule(prayers, '04:32', localInstant('2026-10-25', '01:00'));
    assert.deepEqual(schedule, { id: 'fajr', time: '04:30', date: '2026-10-25', isTomorrow: false });
    assert.equal(isPrayerUpcomingOnDate('fajr', '04:30', '2026-10-25', true, schedule), true);
  });

  await t.test('highlights only the valid prayer scheduled for the selected current date', () => {
    const beforeFajr = getNextPrayerSchedule(prayers, '04:32', localInstant('2026-10-24', '04:00'));
    assert.equal(isPrayerUpcomingOnDate('fajr', '04:30', '2026-10-24', true, beforeFajr), true);

    const afterFajr = getNextPrayerSchedule(prayers, '04:32', localInstant('2026-10-24', '05:00'));
    assert.equal(isPrayerUpcomingOnDate('fajr', '04:30', '2026-10-24', true, afterFajr), false);
    assert.equal(isPrayerUpcomingOnDate('dhuhr', '12:10', '2026-10-24', true, afterFajr), true);

    const afterAsr = getNextPrayerSchedule(prayers, '04:32', localInstant('2026-10-24', '16:30'));
    assert.equal(isPrayerUpcomingOnDate('maghrib', '18:10', '2026-10-24', true, afterAsr), true);

    const afterIsha = getNextPrayerSchedule(prayers, '04:32', localInstant('2026-10-24', '21:00'));
    assert.equal(isPrayerUpcomingOnDate('fajr', '04:30', '2026-10-24', true, afterIsha), false);
    assert.equal(isPrayerUpcomingOnDate('fajr', '04:32', '2026-10-25', true, afterIsha), false);

    assert.equal(isPrayerUpcomingOnDate('fajr', '04:30', '2026-10-24', false, beforeFajr), false);
    assert.equal(isPrayerUpcomingOnDate('fajr', undefined, '2026-10-24', true, beforeFajr), false);
    assert.equal(isPrayerUpcomingOnDate('fajr', '25:99', '2026-10-24', true, beforeFajr), false);
  });

  await t.test('upcoming highlighting is independent of done, missed, and pending task status', () => {
    const schedule = getNextPrayerSchedule(prayers, '04:32', localInstant('2026-10-24', '09:00'));
    const resultByStatus = ['done', 'not-done', 'pending'].map(status => ({
      status,
      highlighted: isPrayerUpcomingOnDate('dhuhr', '12:10', '2026-10-24', true, schedule),
    }));
    assert.deepEqual(resultByStatus.map(result => result.highlighted), [true, true, true]);
  });

  await t.test('does not invent tomorrow Fajr while today’s schedule is incomplete', () => {
    assert.equal(getNextPrayerSchedule(prayers.slice(0, 4), '04:32', localInstant('2026-10-24', '21:00')), null);
  });

  await t.test('converts the target prayer time using Asia/Hebron rather than the device timezone', () => {
    const target = localInstant('2026-10-25', '04:32');
    assert.equal(getPrayerTimeZoneDate(target), '2026-10-25');
    assert.equal(target.getTime() - localInstant('2026-10-25', '04:31').getTime(), 60_000);
  });

  await t.test('calculates elapsed prayer interval progress using actual local prayer dates', () => {
    assert.equal(
      getPrayerIntervalProgress('2026-10-24', '04:30', '2026-10-24', '12:10', localInstant('2026-10-24', '04:30')),
      0,
    );
    assert.equal(
      getPrayerIntervalProgress('2026-10-24', '04:30', '2026-10-24', '12:10', localInstant('2026-10-24', '08:20')),
      50,
    );
    const overnightStart = localInstant('2026-10-24', '19:40');
    const overnightEnd = localInstant('2026-10-25', '04:32');
    const overnightMidpoint = new Date((overnightStart.getTime() + overnightEnd.getTime()) / 2);
    assert.equal(getPrayerIntervalProgress('2026-10-24', '19:40', '2026-10-25', '04:32', overnightMidpoint), 50);
    assert.equal(
      getPrayerIntervalProgress('2026-10-24', '19:40', '2026-10-25', '04:32', localInstant('2026-10-25', '04:32')),
      100,
    );
  });

  await t.test('rejects missing, invalid, or non-increasing prayer interval bounds', () => {
    const now = localInstant('2026-10-24', '09:00');
    assert.equal(getPrayerIntervalProgress('2026-10-24', undefined, '2026-10-24', '12:10', now), null);
    assert.equal(getPrayerIntervalProgress('2026-10-24', '12:10', '2026-10-24', '04:30', now), null);
  });
});
