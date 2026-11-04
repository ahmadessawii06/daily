import type { DayStats, Task } from '../types';
import { partitionPrayerTasks } from './prayerTasks';
import { calculateStats, loadAllDays } from './storage';
import { userStorage } from './scopedStorage';
import { AZKAR_SABAH } from '../data/azkarSabah';
import { AZKAR_MASAA } from '../data/azkarMasaa';
import { QURANIC_DUAS } from '../data/quranicDuas';

export interface ReligiousProgressDetails {
  prayers: { total: number; done: number; ratio: number };
  morningAdhkar: { total: number; done: number; repetitionsCounted: number; repetitionsRequired: number; ratio: number };
  eveningAdhkar: { total: number; done: number; repetitionsCounted: number; repetitionsRequired: number; ratio: number };
  quranWird: { completed: boolean; ratio: number };
  duas: { completed: boolean; ratio: number };
  ordinaryTasks: { total: number; done: number };
}

export interface UnifiedDailyStats extends DayStats {
  exactDone?: number;
  details?: ReligiousProgressDetails;
}

export interface ReligiousProgressInput {
  morningCounts?: Record<string, number>;
  eveningCounts?: Record<string, number>;
  quranCompleted?: boolean;
  duasCompleted?: boolean;
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

function getTasksForDate(date?: string): Task[] {
  if (!date) return [];
  try {
    const all = loadAllDays();
    return all[date]?.tasks || [];
  } catch {
    return [];
  }
}

/**
 * Detects if a task specifically represents Morning Adhkar to avoid double-counting.
 */
export function isMorningAdhkarTask(title: string): boolean {
  const norm = normalizeArabicText(title);
  if (norm.includes('مساء') || norm.includes('evening')) return false;
  return (
    norm.includes('اذكار الصباح') ||
    norm.includes('اذكار صباح') ||
    norm.includes('morning adhkar') ||
    norm.includes('morning athkar') ||
    (norm.includes('اذكار') && norm.includes('صباح')) ||
    norm === 'اذكار الصباح' ||
    norm === 'اذكار صباح' ||
    norm === 'اذكار' ||
    norm === 'الاذكار' ||
    norm.includes('الاذكار +') ||
    norm.includes('الاذكار و') ||
    norm.includes('اذكار +') ||
    norm.includes('اذكار و')
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
    (norm.includes('اذكار') && norm.includes('مساء')) ||
    norm === 'اذكار المساء' ||
    norm === 'اذكار مساء'
  );
}

/**
 * Detects if a task specifically represents Quran Wird (وردك) to avoid double-counting.
 */
export function isQuranWirdTask(title: string): boolean {
  const norm = normalizeArabicText(title);
  return (
    norm.includes('ورد القران') ||
    norm.includes('الورد القراني') ||
    norm.includes('وردك') ||
    norm.includes('قراءة القران') ||
    norm.includes('الورد اليومي') ||
    norm.includes('ورد يومي') ||
    norm.includes('الورد') ||
    norm.includes('quran wird') ||
    norm === 'ورد القران' ||
    norm === 'الورد القراني' ||
    norm === 'وردك' ||
    norm === 'الورد' ||
    norm === 'ورد'
  );
}

/**
 * Detects if a task specifically represents Quranic Duas (أدعيتك) to avoid double-counting.
 */
export function isDuasTask(title: string): boolean {
  const norm = normalizeArabicText(title);
  return (
    norm.includes('ادعيتك') ||
    norm.includes('الادعية') ||
    norm.includes('ادعية قرانية') ||
    norm.includes('قراءة الادعية') ||
    norm.includes('فقرة الادعية') ||
    norm.includes('ادعية') ||
    norm.includes('duas') ||
    norm === 'ادعيتك' ||
    norm === 'الادعية'
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

export function isStoredMorningConfirmed(date?: string): boolean {
  if (!date) return false;
  try {
    const session = JSON.parse(userStorage.getItem(`islambook_azkar_morning_session_${date}`) || '{}');
    if (Boolean(session.confirmed)) return true;
    const tasks = getTasksForDate(date);
    return tasks.some(t => isMorningAdhkarTask(t.title) && t.status === 'done');
  } catch {
    return false;
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

export function isStoredEveningConfirmed(date?: string): boolean {
  if (!date) return false;
  try {
    const session = JSON.parse(userStorage.getItem(`islambook_azkar_evening_session_${date}`) || '{}');
    if (Boolean(session.confirmed)) return true;
    const tasks = getTasksForDate(date);
    return tasks.some(t => isEveningAdhkarTask(t.title) && t.status === 'done');
  } catch {
    return false;
  }
}

/**
 * Checks if Quran Wird is completed for a given date.
 */
export function getStoredQuranCompleted(date?: string): boolean {
  if (!date) return false;
  try {
    if (userStorage.getItem(`islambook_quran_wird_completed_${date}`) === 'true') return true;
    const session = JSON.parse(userStorage.getItem(`islambook_quran_wird_session_${date}`) || '{}');
    if (Boolean(session.completed)) return true;
    const legacy = JSON.parse(userStorage.getItem('religious_quran_wird') || '{}');
    if (legacy && legacy.date === date && Number(legacy.progress) >= Number(legacy.goal || 5) && Number(legacy.progress) > 0) return true;
    const tasks = getTasksForDate(date);
    return tasks.some(t => isQuranWirdTask(t.title) && t.status === 'done');
  } catch {
    return false;
  }
}

/**
 * Checks if Quranic Duas are completed for a given date.
 */
export function getStoredDuasCompleted(date?: string): { completed: boolean; ratio: number } {
  if (!date) return { completed: false, ratio: 0 };
  try {
    const session = JSON.parse(
      userStorage.getItem(`islambook_duas_quran_session_${date}`) ||
      userStorage.getItem(`islambook_quranic_duas_session_${date}`) ||
      '{}'
    );
    if (session.confirmed) return { completed: true, ratio: 1 };
    const counts = JSON.parse(
      userStorage.getItem(`islambook_duas_quran_counts_${date}`) ||
      userStorage.getItem(`islambook_quranic_duas_counts_${date}`) ||
      '{}'
    );
    const totalRequired = QURANIC_DUAS.length;
    let done = 0;
    for (const d of QURANIC_DUAS) {
      if ((counts[d.id] || 0) >= d.count) done++;
    }
    const ratio = totalRequired > 0 ? Math.min(1, done / totalRequired) : 0;
    if (ratio >= 1) return { completed: true, ratio: 1 };
    const tasks = getTasksForDate(date);
    if (tasks.some(t => isDuasTask(t.title) && t.status === 'done')) {
      return { completed: true, ratio: 1 };
    }
    return { completed: false, ratio };
  } catch {
    return { completed: false, ratio: 0 };
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
 * 2. Morning Adhkar (1 unit, partial based on completed repetitions/total required or confirmation).
 * 3. Evening Adhkar (1 unit, partial based on completed repetitions/total required or confirmation).
 * 4. Quran Wird (1 unit, 100% when marked completed or page target reached).
 * 5. Quranic Duas (1 unit, 100% when confirmed or all duas completed).
 * 6. Ordinary tasks (1 unit each), excluding prayers or religious tasks that already have dedicated widgets to avoid double-counting.
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

  // Filter out any other tasks that duplicate Morning Adhkar, Evening Adhkar, Quran Wird, or Duas
  const nonDuplicateTasks: Task[] = [];
  let morningTaskStatus: Task['status'] | undefined;
  let eveningTaskStatus: Task['status'] | undefined;
  let quranTaskStatus: Task['status'] | undefined;
  let duasTaskStatus: Task['status'] | undefined;

  for (const task of prayerPartition.otherTasks) {
    if (isMorningAdhkarTask(task.title)) {
      if (!morningTaskStatus || task.status === 'done') morningTaskStatus = task.status;
    } else if (isEveningAdhkarTask(task.title)) {
      if (!eveningTaskStatus || task.status === 'done') eveningTaskStatus = task.status;
    } else if (isQuranWirdTask(task.title)) {
      if (!quranTaskStatus || task.status === 'done') quranTaskStatus = task.status;
    } else if (isDuasTask(task.title)) {
      if (!duasTaskStatus || task.status === 'done') duasTaskStatus = task.status;
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

  // 2. Morning Adhkar Progress
  const morningCounts = overrides?.morningCounts ?? getStoredMorningCounts(date);
  const morningDoneCount = calculateAdhkarCompletedCount(AZKAR_SABAH, morningCounts);
  const morningRep = calculateAdhkarRepetitionsRatio(AZKAR_SABAH, morningCounts);
  let morningRatio = morningRep.ratio;
  if (morningTaskStatus === 'done' || isStoredMorningConfirmed(date) || morningDoneCount === AZKAR_SABAH.length) {
    morningRatio = 1;
  }

  // 3. Evening Adhkar Progress
  const eveningCounts = overrides?.eveningCounts ?? getStoredEveningCounts(date);
  const eveningDoneCount = calculateAdhkarCompletedCount(AZKAR_MASAA, eveningCounts);
  const eveningRep = calculateAdhkarRepetitionsRatio(AZKAR_MASAA, eveningCounts);
  let eveningRatio = eveningRep.ratio;
  if (eveningTaskStatus === 'done' || isStoredEveningConfirmed(date) || eveningDoneCount === AZKAR_MASAA.length) {
    eveningRatio = 1;
  }

  // 4. Quran Wird Progress (وردك)
  let quranRatio = 0;
  if (overrides?.quranCompleted !== undefined) {
    quranRatio = overrides.quranCompleted ? 1 : 0;
  } else if (quranTaskStatus === 'done' || getStoredQuranCompleted(date)) {
    quranRatio = 1;
  }

  // 5. Quranic Duas Progress (أدعيتك)
  let duasRatio = 0;
  if (overrides?.duasCompleted !== undefined) {
    duasRatio = overrides.duasCompleted ? 1 : 0;
  } else if (duasTaskStatus === 'done') {
    duasRatio = 1;
  } else {
    const duasState = getStoredDuasCompleted(date);
    duasRatio = duasState.ratio;
  }

  // Unified Units calculation:
  // 5 Prayers (5 units) + Morning (1 unit) + Evening (1 unit) + Quran Wird (1 unit) + Duas (1 unit) + Ordinary tasks (N units)
  const totalUnits = 5 + 1 + 1 + 1 + 1 + nonDuplicateTasks.length;
  const actualDoneUnits = completedPrayers + morningRatio + eveningRatio + quranRatio + duasRatio + ordinaryDone;

  // Strict 100% Guard:
  // Must NOT display 100% due to floating-point rounding if any unit is not fully 100% completed.
  const isFullyComplete =
    completedPrayers === 5 &&
    morningRatio >= 1 &&
    eveningRatio >= 1 &&
    quranRatio >= 1 &&
    duasRatio >= 1 &&
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
      quranWird: { completed: quranRatio >= 1, ratio: quranRatio },
      duas: { completed: duasRatio >= 1, ratio: duasRatio },
      ordinaryTasks: { total: nonDuplicateTasks.length, done: ordinaryDone },
    },
  };
}
