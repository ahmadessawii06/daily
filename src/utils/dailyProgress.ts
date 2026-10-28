import type { DayStats, Task } from '../types';
import { partitionPrayerTasks } from './prayerTasks';
import { calculateStats } from './storage';
import { userStorage } from './scopedStorage';
import { AZKAR_SABAH } from '../data/azkarSabah';
import { AZKAR_MASAA } from '../data/azkarMasaa';

export interface ReligiousProgressDetails {
  prayers: { total: number; done: number; ratio: number };
  morningAdhkar: { total: number; done: number; repetitionsCounted: number; repetitionsRequired: number; ratio: number };
  eveningAdhkar: { total: number; done: number; repetitionsCounted: number; repetitionsRequired: number; ratio: number };
  ordinaryTasks: { total: number; done: number };
}

export interface UnifiedDailyStats extends DayStats {
  exactDone?: number;
  details?: ReligiousProgressDetails;
}

export interface ReligiousProgressInput {
  morningCounts?: Record<string, number>;
  eveningCounts?: Record<string, number>;
}

/**
 * Normalizes text to match religious titles accurately without tashkeel or punctuation.
 */
function normalizeArabicText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects if a task specifically represents Morning Adhkar to avoid double-counting.
 */
export function isMorningAdhkarTask(title: string): boolean {
  const norm = normalizeArabicText(title);
  return (
    norm.includes('اذكار الصباح') ||
    norm.includes('اذكار صباح') ||
    norm.includes('morning adhkar') ||
    norm.includes('morning athkar') ||
    norm === 'اذكار الصباح' ||
    norm === 'اذكار صباح'
  );
}

/**
 * Detects if a task specifically represents Evening Adhkar to avoid double-counting.
 */
export function isEveningAdhkarTask(title: string): boolean {
  const norm = normalizeArabicText(title);
  return (
    norm.includes('اذكار المساء') ||
    norm.includes('اذكار مساء') ||
    norm.includes('evening adhkar') ||
    norm.includes('evening athkar') ||
    norm === 'اذكار المساء' ||
    norm === 'اذكار مساء'
  );
}

/**
 * Reads Morning Adhkar counts from userStorage for a given date.
 */
export function getStoredMorningCounts(date?: string): Record<string, number> {
  if (!date) return {};
  try {
    const raw = userStorage.getItem(`islambook_azkar_morning_counts_${date}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Reads Evening Adhkar counts from userStorage for a given date.
 */
export function getStoredEveningCounts(date?: string): Record<string, number> {
  if (!date) return {};
  try {
    const raw = userStorage.getItem(`islambook_azkar_evening_counts_${date}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Calculates completed items in Adhkar list based on tap counts.
 */
export function calculateAdhkarCompletedCount(
  list: readonly { id: string; count: number }[],
  counts: Record<string, number>
): number {
  let done = 0;
  for (const item of list) {
    const tapped = counts[item.id] || 0;
    if (tapped >= item.count && item.count > 0) {
      done++;
    }
  }
  return done;
}

/**
 * Calculates actual counted repetitions vs required repetitions across an Adhkar list,
 * strictly capped at the required count for each zekr to avoid overflow.
 */
export function calculateAdhkarRepetitionsRatio(
  list: readonly { id: string; count: number }[],
  counts: Record<string, number>
): { ratio: number; counted: number; required: number } {
  let required = 0;
  let counted = 0;
  for (const item of list) {
    required += item.count;
    const tapped = counts[item.id] || 0;
    counted += Math.min(item.count, Math.max(0, tapped));
  }
  const ratio = required > 0 ? Math.min(1, Math.max(0, counted / required)) : 0;
  return { ratio, counted, required };
}

/**
 * Unified Daily Progress Calculator:
 * Computes a single authoritative 0-100% daily completion percentage integrating:
 * 1. The 5 daily prayers (1 unit each = 5 units).
 * 2. Morning Adhkar (1 unit, partial based on completed repetitions/total required).
 * 3. Evening Adhkar (1 unit, partial based on completed repetitions/total required).
 * 4. Ordinary tasks (1 unit each), excluding prayers or adhkar tasks that already have dedicated widgets to avoid double-counting.
 *
 * When date is omitted (legacy callers / basic tests), operates purely on the 5 prayers + tasks.
 */
export function calculateDailyProgress(
  tasks: Task[],
  date?: string,
  overrides?: ReligiousProgressInput
): UnifiedDailyStats {
  const namedTasks = tasks.filter(task => task.title && task.title.trim().length > 0);
  const baseStats = calculateStats(namedTasks);

  // 1. Five Daily Prayers
  const prayerPartition = partitionPrayerTasks(namedTasks);
  const completedPrayers = prayerPartition.slots.filter(s => s.task && s.task.status === 'done').length;
  const missingPrayers = prayerPartition.slots.filter(s => !s.task).length;

  // Filter out any other tasks that duplicate Morning Adhkar or Evening Adhkar
  const nonDuplicateTasks: Task[] = [];
  let morningTaskStatus: Task['status'] | undefined;
  let eveningTaskStatus: Task['status'] | undefined;

  for (const task of prayerPartition.otherTasks) {
    if (isMorningAdhkarTask(task.title)) {
      if (!morningTaskStatus || task.status === 'done') morningTaskStatus = task.status;
    } else if (isEveningAdhkarTask(task.title)) {
      if (!eveningTaskStatus || task.status === 'done') eveningTaskStatus = task.status;
    } else {
      nonDuplicateTasks.push(task);
    }
  }

  // Count ordinary non-duplicate task statuses
  let ordinaryDone = 0;
  let ordinaryNotDone = 0;
  let ordinaryPending = 0;
  for (const t of nonDuplicateTasks) {
    if (t.status === 'done') ordinaryDone++;
    else if (t.status === 'not-done') ordinaryNotDone++;
    else ordinaryPending++;
  }

  // Count explicit not-done prayers
  const prayerNotDone = prayerPartition.slots.filter(s => s.task && s.task.status === 'not-done').length;

  // If no date and no overrides provided, maintain exact backwards compatibility with legacy tests
  if (!date && !overrides) {
    const total = baseStats.total + missingPrayers;
    return {
      total,
      done: baseStats.done,
      notDone: baseStats.notDone,
      pending: baseStats.pending + missingPrayers,
      completionPercentage: total > 0 ? Math.round((baseStats.done / total) * 100) : 0,
      totalDurationMinutes: baseStats.totalDurationMinutes,
      doneDurationMinutes: baseStats.doneDurationMinutes,
    };
  }

  // 2. Morning Adhkar Progress (based on repetitions ratio)
  const morningCounts = overrides?.morningCounts ?? getStoredMorningCounts(date);
  const morningDoneCount = calculateAdhkarCompletedCount(AZKAR_SABAH, morningCounts);
  const morningRep = calculateAdhkarRepetitionsRatio(AZKAR_SABAH, morningCounts);
  let morningRatio = morningRep.ratio;
  if (morningTaskStatus === 'done') morningRatio = 1;

  // 3. Evening Adhkar Progress (based on repetitions ratio)
  const eveningCounts = overrides?.eveningCounts ?? getStoredEveningCounts(date);
  const eveningDoneCount = calculateAdhkarCompletedCount(AZKAR_MASAA, eveningCounts);
  const eveningRep = calculateAdhkarRepetitionsRatio(AZKAR_MASAA, eveningCounts);
  let eveningRatio = eveningRep.ratio;
  if (eveningTaskStatus === 'done') eveningRatio = 1;

  // Unified Units calculation:
  // 5 Prayers (5 units) + Morning (1 unit) + Evening (1 unit) + Ordinary tasks (N units)
  const totalUnits = 5 + 1 + 1 + nonDuplicateTasks.length;
  const actualDoneUnits = completedPrayers + morningRatio + eveningRatio + ordinaryDone;

  // Strict 100% Guard:
  // Must NOT display 100% due to floating-point rounding if any unit is not fully 100% completed.
  const isFullyComplete =
    completedPrayers === 5 &&
    morningRatio >= 1 &&
    eveningRatio >= 1 &&
    ordinaryDone === nonDuplicateTasks.length;

  let rawPercentage = totalUnits > 0 ? (actualDoneUnits / totalUnits) * 100 : 0;
  let completionPercentage = Math.round(rawPercentage);

  if (completionPercentage >= 100 && !isFullyComplete) {
    completionPercentage = 99; // Never show 100% until every single requirement is actually satisfied
  }
  completionPercentage = Math.min(100, Math.max(0, completionPercentage));

  // Integer counts for standard DayStats compatibility:
  const doneCount = Math.floor(actualDoneUnits);
  const totalCount = totalUnits;
  const notDoneCount = ordinaryNotDone + prayerNotDone;
  const pendingCount = Math.max(0, totalCount - doneCount - notDoneCount);

  return {
    total: totalCount,
    done: doneCount,
    notDone: notDoneCount,
    pending: pendingCount,
    completionPercentage,
    totalDurationMinutes: baseStats.totalDurationMinutes,
    doneDurationMinutes: baseStats.doneDurationMinutes,
    exactDone: actualDoneUnits,
    details: {
      prayers: { total: 5, done: completedPrayers, ratio: completedPrayers / 5 },
      morningAdhkar: { total: AZKAR_SABAH.length, done: morningDoneCount, repetitionsCounted: morningRep.counted, repetitionsRequired: morningRep.required, ratio: morningRatio },
      eveningAdhkar: { total: AZKAR_MASAA.length, done: eveningDoneCount, repetitionsCounted: eveningRep.counted, repetitionsRequired: eveningRep.required, ratio: eveningRatio },
      ordinaryTasks: { total: nonDuplicateTasks.length, done: ordinaryDone },
    },
  };
}
