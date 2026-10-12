import { DayRecord, DayStats, HabitStreak, PrayerTimeItem, Task, TaskCategory, TaskPriority, Theme, WeeklyDayData } from '../types';

import { sortTasksByTime } from './date';
import { autoDetectCategory } from './categories';
import { SCHEDULE_TEMPLATES } from './templates';
import { userStorage } from './scopedStorage';
import { enqueue, enqueueDay } from '../services/syncQueue';
import { nextRecordTimestamp } from '../shared/merge';

const STORAGE_KEY = 'daily_tasks_app_data_v8_saturday_schedule';
const THEME_KEY = 'daily_theme_v1';
const HABITS_KEY = 'daily_habits_v8_saturday_schedule';
const PRAYER_TIMES_KEY = 'daily_fixed_prayer_times_v1';

export const DEFAULT_PRAYER_TIMES: PrayerTimeItem[] = [
  { id: 'fajr', nameAr: 'الفجر', nameEn: 'Fajr', time: '05:00' },
  { id: 'dhuhr', nameAr: 'الظهر', nameEn: 'Dhuhr', time: '12:30' },
  { id: 'asr', nameAr: 'العصر', nameEn: 'Asr', time: '15:45' },
  { id: 'maghrib', nameAr: 'المغرب', nameEn: 'Maghrib', time: '18:15' },
  { id: 'isha', nameAr: 'العشاء', nameEn: 'Isha', time: '19:45' },
];

export function getStoredPrayerTimes(): PrayerTimeItem[] {
  try {
    const raw = userStorage.getItem(PRAYER_TIMES_KEY);
    if (!raw) return DEFAULT_PRAYER_TIMES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 5) {
      return parsed;
    }
    return DEFAULT_PRAYER_TIMES;
  } catch {
    return DEFAULT_PRAYER_TIMES;
  }
}

export function saveStoredPrayerTimes(times: PrayerTimeItem[]): void {
  try {
    userStorage.setItem(PRAYER_TIMES_KEY, JSON.stringify(times));
    enqueue('settings', { prayerTimes: times });
  } catch (err) {
    console.error('Error saving prayer times:', err);
  }
}

export function getStoredTheme(): Theme {
  try {
    const saved = userStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function setStoredTheme(theme: Theme): void {
  try {
    if (userStorage.getItem(THEME_KEY) !== theme) {
      userStorage.setItem(THEME_KEY, theme);
      enqueue('settings', { theme });
    }
  } catch {
    // Ignore storage errors
  }
}

// Convert "HH:MM" to minutes from 00:00
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  return h * 60 + m;
}

// Convert minutes from 00:00 to "HH:MM"
export function minutesToTime(minutes: number): string {
  const norm = Math.max(0, Math.min(24 * 60, minutes));
  const h = Math.floor(norm / 60) % 24;
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// All habit streaks reset to 0 from Saturday 26
export const INITIAL_HABITS: HabitStreak[] = [
  {
    id: 'habit-fajr',
    title: 'صلاة الفجر وقراءة أذكار الصباح',
    category: 'worship',
    currentStreak: 0,
    bestStreak: 0,
  },
  {
    id: 'habit-study',
    title: 'جلسات الدراسة العميقة والبرمجة',
    category: 'study',
    currentStreak: 0,
    bestStreak: 0,
  },
  {
    id: 'habit-health',
    title: 'النشاط البدني والمشي 30 دقيقة',
    category: 'health',
    currentStreak: 0,
    bestStreak: 0,
  },
  {
    id: 'habit-quran',
    title: 'مراجعة وتدبر ورد القرآن اليومي',
    category: 'worship',
    currentStreak: 0,
    bestStreak: 0,
  },
];

export function getStoredHabits(): HabitStreak[] {
  try {
    const raw = userStorage.getItem(HABITS_KEY);
    if (!raw) {
      userStorage.setItem(HABITS_KEY, JSON.stringify(INITIAL_HABITS));
      return INITIAL_HABITS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_HABITS;
  }
}

export function saveHabits(habits: HabitStreak[]): void {
  try {
    userStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    // Asynchronously sync to MongoDB Atlas
    enqueue('habits', habits);
  } catch {
    // Ignore
  }
}

export function toggleHabitToday(habitId: string, todayDate: string): HabitStreak[] {
  const habits = getStoredHabits();
  const updated = habits.map((h) => {
    if (h.id !== habitId) return h;
    const isAlreadyCompletedToday = h.lastCompletedDate === todayDate;
    if (isAlreadyCompletedToday) {
      // Untoggle
      const newStreak = Math.max(0, h.currentStreak - 1);
      return {
        ...h,
        currentStreak: newStreak,
        lastCompletedDate: undefined,
      };
    } else {
      // Toggle complete
      const newStreak = h.currentStreak + 1;
      const best = Math.max(newStreak, h.bestStreak);
      return {
        ...h,
        currentStreak: newStreak,
        bestStreak: best,
        lastCompletedDate: todayDate,
      };
    }
  });
  saveHabits(updated);
  return updated;
}

// Helper to create 24 clean, empty hourly slots for a date from 00:00 to 23:00
export function createEmpty24HourTasks(dateStr: string): Task[] {
  const tasks: Task[] = [];
  for (let h = 0; h < 24; h++) {
    const timeStr = `${String(h).padStart(2, '0')}:00`;
    const endHour = (h + 1) % 24;
    const endTimeStr = `${String(endHour).padStart(2, '0')}:00`;
    tasks.push({
      id: `task-${dateStr}-${timeStr}`,
      time: timeStr,
      endTime: endTimeStr,
      duration: 60,
      title: '',
      status: 'pending',
      category: h < 6 || h >= 23 ? 'sleep' : 'general',
      createdAt: new Date().toISOString(),
    });
  }
  return tasks;
}

export function loadAllDays(): Record<string, DayRecord> {
  try {
    const raw = userStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (err) {
    console.error('Error loading saved days:', err);
    return {};
  }
}

export function saveAllDays(days: Record<string, DayRecord>): void {
  try {
    userStorage.setItem(STORAGE_KEY, JSON.stringify(days));
  } catch (err) {
    console.error('Error saving data to localStorage:', err);
  }
}

export function syncDayToMongo(date: string): void {
  const record = loadAllDays()[date];
  if (record) enqueueDay(record);
}

export function getDayRecord(date: string): DayRecord {
  const all = loadAllDays();
  if (all[date] && Array.isArray(all[date].tasks)) return all[date];
  const record: DayRecord = { date, tasks: createEmpty24HourTasks(date), updatedAt: new Date().toISOString() };
  all[date] = record;
  saveAllDays(all);
  return record;
}

export function applyTemplateToDay(date: string, templateId: string): Task[] {
  const template = SCHEDULE_TEMPLATES.find((t) => t.id === templateId) || SCHEDULE_TEMPLATES[0];
  const all = loadAllDays();
  const now = new Date().toISOString();

  const newTasks: Task[] = template.tasks.map((t, idx) => ({
    id: `tpl_${date}_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    time: t.time,
    endTime: t.endTime || minutesToTime(timeToMinutes(t.time) + (t.duration || 60)),
    duration: t.duration || 60,
    title: t.title,
    status: t.status || 'pending',
    category: t.category || autoDetectCategory(t.title),
    notes: t.notes,
    createdAt: now,
  }));

  const updatedRecord: DayRecord = {
    date,
    tasks: newTasks,
    dayNote: `${template.nameAr} - ${date}`,
    updatedAt: now,
    deletedTaskIds: { ...all[date]?.deletedTaskIds, ...Object.fromEntries((all[date]?.tasks || []).map(t => [t.id, now])) },
  };

  all[date] = updatedRecord;
  saveAllDays(all);
  syncDayToMongo(date);
  return newTasks;
}

export function addTaskToDay(
  date: string,
  taskInput: {
    time: string;
    endTime?: string;
    duration?: number;
    title: string;
    status?: Task['status'];
    notes?: string;
    category?: TaskCategory;
    priority?: TaskPriority;
    deadline?: string;
    isTopFocus?: boolean;
    recurringTemplateId?: string;
  }
): Task {
  const all = loadAllDays();
  const currentRecord = getDayRecord(date);
  
  const startTime = taskInput.time ? taskInput.time.trim() : '';
  let duration = taskInput.duration || 45;
  let endTime = taskInput.endTime?.trim();

  if (startTime) {
    if (!endTime && duration) {
      endTime = minutesToTime(timeToMinutes(startTime) + duration);
    } else if (endTime && !duration) {
      const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
      duration = diff > 0 ? diff : 60;
    }
  }

  const category = taskInput.category || autoDetectCategory(taskInput.title);

  const newTask: Task = {
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    time: startTime,
    endTime,
    duration,
    title: taskInput.title.trim(),
    status: taskInput.status || 'pending',
    notes: taskInput.notes?.trim() || undefined,
    category,
    priority: taskInput.priority || 'medium',
    deadline: taskInput.deadline,
    isTopFocus: taskInput.isTopFocus,
    recurringTemplateId: taskInput.recurringTemplateId,
    createdAt: new Date().toISOString(),
    updatedAt: nextRecordTimestamp(currentRecord),
  };

  const updatedTasks = sortTasksByTime([...currentRecord.tasks, newTask]);
  all[date] = {
    ...currentRecord,
    tasks: updatedTasks,
    updatedAt: newTask.updatedAt!,
  };
  saveAllDays(all);
  syncDayToMongo(date);
  return newTask;
}


export function updateTaskInDay(date: string, taskId: string, updates: Partial<Task>): void {
  const all = loadAllDays();
  const record = all[date];
  if (!record) return;

  const taskIndex = record.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) return;

  const existing = record.tasks[taskIndex];
  const merged: Task = {
    ...existing,
    ...updates,
    updatedAt: nextRecordTimestamp(record),
  };

  // Recalculate duration if time or endTime changed
  if (updates.time || updates.endTime) {
    const s = updates.time || merged.time;
    const e = updates.endTime || merged.endTime;
    if (s && e) {
      const diff = timeToMinutes(e) - timeToMinutes(s);
      merged.duration = diff > 0 ? diff : (merged.duration || 60);
    }
  } else if (updates.duration && updates.duration !== existing.duration) {
    merged.endTime = minutesToTime(timeToMinutes(merged.time) + updates.duration);
  }

  // Recalculate category if title changed and category wasn't explicitly provided
  if (updates.title && !updates.category) {
    merged.category = autoDetectCategory(updates.title);
  }

  const newTasks = [...record.tasks];
  newTasks[taskIndex] = merged;

  record.tasks = sortTasksByTime(newTasks);
  record.updatedAt = merged.updatedAt!;
  all[date] = record;
  saveAllDays(all);
  syncDayToMongo(date);
}

export function deleteTaskFromDay(date: string, taskId: string): Task | null {
  const all = loadAllDays();
  const record = all[date];
  if (!record) return null;

  const deletedTask = record.tasks.find((t) => t.id === taskId) || null;
  record.tasks = record.tasks.filter((t) => t.id !== taskId);
  const deletedAt = nextRecordTimestamp(record);
  record.deletedTaskIds = { ...record.deletedTaskIds, [taskId]: deletedAt };
  record.updatedAt = deletedAt;
  all[date] = record;
  saveAllDays(all);
  syncDayToMongo(date);
  return deletedTask;
}

export function restoreTaskToDay(date: string, task: Task): void {
  const all = loadAllDays();
  const record = all[date] || { date, tasks: [], updatedAt: new Date().toISOString() };
  const restoredAt = nextRecordTimestamp(record);
  record.tasks = sortTasksByTime([...record.tasks.filter(t => t.id !== task.id), { ...task, updatedAt: restoredAt }]);
  record.updatedAt = restoredAt;
  all[date] = record;
  saveAllDays(all);
  syncDayToMongo(date);
}

export function calculateStats(tasks: Task[]): DayStats {
  const activeTasks = tasks.filter((t) => t.title && t.title.trim().length > 0);
  const targetTasks = activeTasks.length > 0 ? activeTasks : tasks;
  const total = targetTasks.length;
  let done = 0;
  let notDone = 0;
  let pending = 0;
  let totalDurationMinutes = 0;
  let doneDurationMinutes = 0;

  for (const t of targetTasks) {
    const dur = t.duration || 60;
    totalDurationMinutes += dur;
    if (t.status === 'done') {
      done++;
      doneDurationMinutes += dur;
    } else if (t.status === 'not-done') {
      notDone++;
    } else {
      pending++;
    }
  }

  const completionPercentage = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    total,
    done,
    notDone,
    pending,
    completionPercentage,
    totalDurationMinutes,
    doneDurationMinutes,
  };
}

export function getWeeklyStats(referenceDate: string): WeeklyDayData[] {
  const all = loadAllDays();
  const ref = new Date(referenceDate);
  const result: WeeklyDayData[] = [];

  const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(ref);
    d.setDate(ref.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();

    const record = all[dateStr];
    const tasks = record ? record.tasks.filter((t) => t.title && t.title.trim().length > 0) : [];
    const stats = calculateStats(tasks);

    result.push({
      date: dateStr,
      dayNameAr: dayNamesAr[dayOfWeek],
      dayNameEn: dayNamesEn[dayOfWeek],
      shortDate: `${d.getDate()}/${d.getMonth() + 1}`,
      total: stats.total,
      done: stats.done,
      percentage: stats.completionPercentage,
      isToday: dateStr === referenceDate,
    });
  }

  return result;
}

export function getAllArchiveDays(): DayRecord[] {
  const all = loadAllDays();
  const keys = Object.keys(all);
  keys.sort((a, b) => b.localeCompare(a));

  return keys
    .map((key) => all[key])
    .filter((record) => record && record.tasks && record.tasks.some((t) => t.title && t.title.trim().length > 0));
}

export function resetToDefaults(): void {
  const days = loadAllDays();
  for (const record of Object.values(days)) {
    const now = nextRecordTimestamp(record);
    record.deletedTaskIds = { ...record.deletedTaskIds, ...Object.fromEntries(record.tasks.map(t => [t.id, now])) };
    record.tasks = [];
    record.notes = '';
    record.dayNote = '';
    record.updatedAt = now;
  }
  saveAllDays(days);
  for (const record of Object.values(days)) enqueueDay(record);
  saveHabits(structuredClone(INITIAL_HABITS));
}

// Fill missing slots without changing existing tasks, times or durations.
export function apply24HourTemplate(dateStr: string, _force = false): Task[] {
  const all = loadAllDays();
  const record = all[dateStr] || { date: dateStr, tasks: [], updatedAt: new Date().toISOString() };
  const changedAt = nextRecordTimestamp(record);
  const missing = createEmpty24HourTasks(dateStr).filter(slot => !record.tasks.some(t => t.time === slot.time)).map(slot => ({ ...slot, updatedAt: changedAt }));
  record.tasks = sortTasksByTime([...record.tasks, ...missing]);
  record.updatedAt = changedAt;
  all[dateStr] = record;
  saveAllDays(all);
  syncDayToMongo(dateStr);
  return record.tasks;
}
