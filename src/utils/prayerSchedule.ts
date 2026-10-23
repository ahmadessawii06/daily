import type { PrayerTimeItem } from '../types';

const PRAYER_TIME_ZONE = 'Asia/Hebron';

function getZonedParts(date: Date, timeZone = PRAYER_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

export function getPrayerTimeZoneDate(date: Date, timeZone = PRAYER_TIME_ZONE): string {
  const { year, month, day } = getZonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getNextScheduledPrayer(
  prayers: readonly Pick<PrayerTimeItem, 'id' | 'time'>[],
  now: Date,
  timeZone = PRAYER_TIME_ZONE,
): Pick<PrayerTimeItem, 'id' | 'time'> | null {
  const { hour, minute, second } = getZonedParts(now, timeZone);
  const currentSeconds = hour * 3600 + minute * 60 + second;
  return prayers
    .filter(prayer => /^([01]\d|2[0-3]):[0-5]\d$/.test(prayer.time))
    .map(prayer => ({
      prayer,
      seconds: Number(prayer.time.slice(0, 2)) * 3600 + Number(prayer.time.slice(3, 5)) * 60,
    }))
    .filter(({ seconds }) => seconds > currentSeconds)
    .sort((a, b) => a.seconds - b.seconds)[0]?.prayer ?? null;
}

export interface NextPrayerSchedule {
  id: PrayerTimeItem['id'];
  time?: string;
  date: string;
  isTomorrow: boolean;
}

export function isPrayerUpcomingOnDate(
  prayerId: PrayerTimeItem['id'],
  prayerTime: string | undefined,
  currentDate: string,
  isToday: boolean,
  schedule: NextPrayerSchedule | null,
): boolean {
  return Boolean(
    isToday
    && prayerTime
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(prayerTime)
    && schedule
    && !schedule.isTomorrow
    && schedule.date === currentDate
    && schedule.id === prayerId
    && schedule.time === prayerTime,
  );
}

export function getNextPrayerSchedule(
  prayers: readonly Pick<PrayerTimeItem, 'id' | 'time'>[],
  tomorrowFajrTime: string | undefined,
  now: Date,
  timeZone = PRAYER_TIME_ZONE,
): NextPrayerSchedule | null {
  const today = getPrayerTimeZoneDate(now, timeZone);
  const nextPrayer = getNextScheduledPrayer(prayers, now, timeZone);
  if (nextPrayer) return { ...nextPrayer, date: today, isTomorrow: false };
  if (prayers.length !== 5 || prayers.some(prayer => !/^([01]\d|2[0-3]):[0-5]\d$/.test(prayer.time))) return null;
  if (tomorrowFajrTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(tomorrowFajrTime)) return null;
  const [year, month, day] = today.split('-').map(Number);
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1));
  const date = `${tomorrow.getUTCFullYear()}-${String(tomorrow.getUTCMonth() + 1).padStart(2, '0')}-${String(tomorrow.getUTCDate()).padStart(2, '0')}`;
  return { id: 'fajr', time: tomorrowFajrTime, date, isTomorrow: true };
}

export function getDateTimeInPrayerTimeZone(
  date: string,
  time: string | undefined,
  timeZone = PRAYER_TIME_ZONE,
): Date | null {
  if (!time) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute);
  let timestamp = targetUtc;
  for (let attempt = 0; attempt < 3; attempt++) {
    const zoned = getZonedParts(new Date(timestamp), timeZone);
    const representedUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
    timestamp += targetUtc - representedUtc;
  }
  const result = new Date(timestamp);
  return Number.isNaN(result.getTime()) ? null : result;
}

export function getPrayerIntervalProgress(
  previousDate: string,
  previousTime: string | undefined,
  nextDate: string,
  nextTime: string | undefined,
  now: Date,
  timeZone = PRAYER_TIME_ZONE,
): number | null {
  const previousPrayer = getDateTimeInPrayerTimeZone(previousDate, previousTime, timeZone);
  const nextPrayer = getDateTimeInPrayerTimeZone(nextDate, nextTime, timeZone);
  if (!previousPrayer || !nextPrayer || nextPrayer <= previousPrayer) return null;

  const duration = nextPrayer.getTime() - previousPrayer.getTime();
  const elapsed = now.getTime() - previousPrayer.getTime();
  return Math.min(100, Math.max(0, elapsed / duration * 100));
}
