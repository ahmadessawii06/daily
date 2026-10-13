import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchOfficialPrayerTimes, getDefaultLocationConfig } from '../src/utils/prayerTimes';

const values = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
}, configurable: true });
const payload = (date = '13-10-2026', timezone = 'Asia/Hebron') => ({ code: 200, data: {
  timings: { Fajr: '5:19 (EEST)', Dhuhr: '12:25', Asr: '15:41', Maghrib: '18:16', Isha: '19:31' },
  date: { gregorian: { date } }, meta: { timezone },
} });

test('Nablus schedules use the selected date and Palestine timezone with validated daily caching', async t => {
  await t.test('requests Nablus coordinates and Asia/Hebron regardless of the device timezone', async t => {
    values.clear();
    const config = getDefaultLocationConfig();
    assert.equal(config.city, 'Nablus');
    assert.equal(config.country, 'Palestine');
    t.mock.method(globalThis, 'fetch', async (input: string) => {
      const url = new URL(input);
      assert.equal(url.pathname, '/v1/timings/13-10-2026');
      assert.equal(url.searchParams.get('latitude'), '32.2211');
      assert.equal(url.searchParams.get('longitude'), '35.2544');
      assert.equal(url.searchParams.get('method'), '3');
      assert.equal(url.searchParams.get('timezonestring'), 'Asia/Hebron');
      assert.equal(url.searchParams.get('tune'), '0,-1,0,0,-1,7,0,5,0');
      return new Response(JSON.stringify(payload()));
    });
    const result = await fetchOfficialPrayerTimes('2026-10-13', config);
    assert.deepEqual(result.prayers.map(p => p.time), ['05:19', '12:25', '15:41', '18:16', '19:31']);
    assert.equal(result.date, '2026-10-13');
    assert.equal(values.size, 1);
    assert.ok([...values.keys()][0].includes('daily_prayer_cache_v4_'));
  });
  await t.test('cache never crosses dates, timezones or timing adjustments, and refresh bypasses it', async t => {
    values.clear();
    let requests = 0;
    t.mock.method(globalThis, 'fetch', async (input: string) => {
      requests++;
      const url = new URL(input);
      return new Response(JSON.stringify(payload(url.pathname.split('/').at(-1), url.searchParams.get('timezonestring')!)));
    });
    const config = getDefaultLocationConfig();
    await fetchOfficialPrayerTimes('2026-10-13', config);
    await fetchOfficialPrayerTimes('2026-10-13', config);
    assert.equal(requests, 1);
    await fetchOfficialPrayerTimes('2026-10-14', config);
    await fetchOfficialPrayerTimes('2026-10-13', { ...config, timezone: 'UTC' });
    await fetchOfficialPrayerTimes('2026-10-13', { ...config, tune: '0,0,0,0,0,0,0,0,0' });
    await fetchOfficialPrayerTimes('2026-10-13', config, true);
    assert.equal(requests, 5);
  });
  await t.test('network failures and partial or mismatched schedules never return invented times', async t => {
    values.clear();
    const invalidTime = payload(); invalidTime.data.timings.Asr = '25:99';
    const missingTime = payload(); delete (missingTime.data.timings as Partial<typeof missingTime.data.timings>).Isha;
    const inputs = [invalidTime, missingTime, payload('14-10-2026'), payload('13-10-2026', 'UTC'), { code: 400 }, 'not json'];
    t.mock.method(globalThis, 'fetch', async () => { const input = inputs.shift(); return new Response(typeof input === 'string' ? input : JSON.stringify(input)); });
    for (let n = 0; n < 6; n++) await assert.rejects(fetchOfficialPrayerTimes('2026-10-13', getDefaultLocationConfig()));
    assert.equal(values.size, 0);
    t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Network unavailable'); });
    await assert.rejects(fetchOfficialPrayerTimes('2026-10-13', getDefaultLocationConfig()), /Network unavailable/);
  });
  await t.test('corrupt cache entries are refreshed instead of displaying wrong-day or invalid times', async t => {
    values.clear();
    let requests = 0;
    t.mock.method(globalThis, 'fetch', async () => { requests++; return new Response(JSON.stringify(payload())); });
    const config = getDefaultLocationConfig();
    const valid = await fetchOfficialPrayerTimes('2026-10-13', config);
    const key = [...values.keys()][0];
    for (const invalid of [
      { ...valid, date: '2026-10-12' },
      { ...valid, prayers: [...valid.prayers].reverse() },
      { ...valid, prayers: valid.prayers.map(p => ({ ...p, time: '25:00' })) },
    ]) {
      values.set(key, JSON.stringify(invalid));
      assert.deepEqual(await fetchOfficialPrayerTimes('2026-10-13', config), valid);
    }
    assert.equal(requests, 4);
  });
});
