import type { Task } from '../types';

export const DAILY_PRAYERS = [
  { id: 'fajr', nameAr: 'الفجر', nameEn: 'Fajr' },
  { id: 'dhuhr', nameAr: 'الظهر', nameEn: 'Dhuhr' },
  { id: 'asr', nameAr: 'العصر', nameEn: 'Asr' },
  { id: 'maghrib', nameAr: 'المغرب', nameEn: 'Maghrib' },
  { id: 'isha', nameAr: 'العشاء', nameEn: 'Isha' },
] as const;

export type DailyPrayer = typeof DAILY_PRAYERS[number];

// Match whole prayer titles, not mentions such as "read after Fajr" or "cook dinner".
export function dailyPrayerId(title: string): DailyPrayer['id'] | undefined {
  const normalized = title.normalize('NFKC').toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا')
    .replace(/[\p{P}\p{S}]/gu, ' ').replace(/\s+/g, ' ').trim();
  return DAILY_PRAYERS.find(prayer => {
    const arabic = prayer.nameAr.slice(2);
    const english = prayer.id === 'dhuhr' ? '(?:dhuhr|zuhr|duhr)' : prayer.id;
    return new RegExp(`^(?:صلاة\\s+|صلاه\\s+)?(?:ال)?${arabic}$`).test(normalized)
      || new RegExp(`^(?:prayer\\s+|pray\\s+)?${english}(?:\\s+prayer)?$`).test(normalized);
  })?.id;
}

// A view projection only: no records are generated, renamed, or deleted here.
export function partitionPrayerTasks(tasks: Task[]) {
  const selected = new Map<DailyPrayer['id'], Task>();
  const otherTasks: Task[] = [];
  for (const task of tasks) {
    const id = dailyPrayerId(task.title);
    if (id && !selected.has(id)) selected.set(id, task);
    else otherTasks.push(task);
  }
  return { slots: DAILY_PRAYERS.map(prayer => ({ prayer, task: selected.get(prayer.id) })), otherTasks };
}
