import { DayRecord, DayStats, HabitStreak, PrayerTimeItem, Task, TaskCategory, Theme, WeeklyDayData } from '../types';
import { sortTasksByTime } from './date';
import { autoDetectCategory } from './categories';
import { SCHEDULE_TEMPLATES } from './templates';
import { saveDayToDb, saveHabitsToDb } from '../services/api';

const STORAGE_KEY = 'daily_tasks_app_data_v7_saturday26_clean';
const THEME_KEY = 'daily_theme_v1';
const HABITS_KEY = 'daily_habits_v7_saturday26_clean';
const PRAYER_TIMES_KEY = 'daily_fixed_prayer_times_v1';

// One-time purge of old storage keys from previous versions
try {
  const oldKeys = [
    'daily_tasks_app_data_v1',
    'daily_tasks_app_data_v2',
    'daily_tasks_app_data_v3',
    'daily_tasks_app_data_v4',
    'daily_tasks_app_data_v5',
    'daily_tasks_app_data_v6_saturday26',
    'daily_habits_v1',
    'daily_habits_v2',
    'daily_habits_v3',
    'daily_habits_v4',
    'daily_habits_v5',
    'daily_habits_v6_saturday26',
  ];
  for (const k of oldKeys) {
    localStorage.removeItem(k);
  }
} catch {
  // Ignore
}

export const DEFAULT_PRAYER_TIMES: PrayerTimeItem[] = [
  { id: 'fajr', nameAr: 'الفجر', nameEn: 'Fajr', time: '05:00' },
  { id: 'dhuhr', nameAr: 'الظهر', nameEn: 'Dhuhr', time: '12:30' },
  { id: 'asr', nameAr: 'العصر', nameEn: 'Asr', time: '15:45' },
  { id: 'maghrib', nameAr: 'المغرب', nameEn: 'Maghrib', time: '18:15' },
  { id: 'isha', nameAr: 'العشاء', nameEn: 'Isha', time: '19:45' },
];

export function getStoredPrayerTimes(): PrayerTimeItem[] {
  try {
    const raw = localStorage.getItem(PRAYER_TIMES_KEY);
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
    localStorage.setItem(PRAYER_TIMES_KEY, JSON.stringify(times));
  } catch (err) {
    console.error('Error saving prayer times:', err);
  }
}

export function getStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
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
    localStorage.setItem(THEME_KEY, theme);
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
    const raw = localStorage.getItem(HABITS_KEY);
    if (!raw) {
      localStorage.setItem(HABITS_KEY, JSON.stringify(INITIAL_HABITS));
      return INITIAL_HABITS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_HABITS;
  }
}

export function saveHabits(habits: HabitStreak[]): void {
  try {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    // Asynchronously sync to MongoDB Atlas
    saveHabitsToDb(habits).catch((err) => console.warn('Cloud habits save failed:', err));
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

// Clean start for Saturday 2026-09-26: all tasks set to pending (0% done)
export const INITIAL_SEED_DATA: Record<string, DayRecord> = {
  '2026-09-26': {
    date: '2026-09-26',
    updatedAt: new Date().toISOString(),
    dayNote: 'بداية جدول يوم السبت 26 سبتمبر - انطلاقة جديدة من الصفر',
    tasks: [
      {
        id: 'sat-26-01',
        time: '00:00',
        endTime: '05:00',
        duration: 300,
        title: 'نوم واستعادة طاقة ونشاط',
        status: 'pending',
        category: 'sleep',
        createdAt: '2026-09-26T00:00:00Z',
      },
      {
        id: 'sat-26-02',
        time: '05:00',
        endTime: '06:00',
        duration: 60,
        title: 'صلاة الفجر وقراءة أذكار الصباح',
        status: 'pending',
        category: 'worship',
        createdAt: '2026-09-26T05:00:00Z',
      },
      {
        id: 'sat-26-03',
        time: '06:00',
        endTime: '07:00',
        duration: 60,
        title: 'تجهيز اليوم وقراءة الورد القرآني',
        status: 'pending',
        category: 'worship',
        createdAt: '2026-09-26T06:00:00Z',
      },
      {
        id: 'sat-26-04',
        time: '07:00',
        endTime: '08:00',
        duration: 60,
        title: 'فطور صحي وانطلاق بنشاط',
        status: 'pending',
        category: 'health',
        createdAt: '2026-09-26T07:00:00Z',
      },
      {
        id: 'sat-26-05',
        time: '08:00',
        endTime: '10:00',
        duration: 120,
        title: 'جلسة دراسة وعمل مركزة (Deep Work)',
        status: 'pending',
        category: 'study',
        createdAt: '2026-09-26T08:00:00Z',
      },
      {
        id: 'sat-26-06',
        time: '10:00',
        endTime: '12:00',
        duration: 120,
        title: 'تطوير مشاريع وبرمجة مهام السبت',
        status: 'pending',
        category: 'work',
        createdAt: '2026-09-26T10:00:00Z',
      },
      {
        id: 'sat-26-07',
        time: '12:00',
        endTime: '13:00',
        duration: 60,
        title: 'صلاة الظهر واستراحة غداء',
        status: 'pending',
        category: 'worship',
        createdAt: '2026-09-26T12:00:00Z',
      },
      {
        id: 'sat-26-08',
        time: '13:00',
        endTime: '15:00',
        duration: 120,
        title: 'إنجاز المهام التطبيقية ومتابعة الأهداف',
        status: 'pending',
        category: 'work',
        createdAt: '2026-09-26T13:00:00Z',
      },
      {
        id: 'sat-26-09',
        time: '15:00',
        endTime: '16:00',
        duration: 60,
        title: 'صلاة العصر وجلسة هدوء',
        status: 'pending',
        category: 'worship',
        createdAt: '2026-09-26T15:00:00Z',
      },
      {
        id: 'sat-26-10',
        time: '16:00',
        endTime: '18:00',
        duration: 120,
        title: 'مذاكرة وحل تمارين دراسية',
        status: 'pending',
        category: 'study',
        createdAt: '2026-09-26T16:00:00Z',
      },
      {
        id: 'sat-26-11',
        time: '18:00',
        endTime: '19:00',
        duration: 60,
        title: 'صلاة المغرب واستراحة عائلية',
        status: 'pending',
        category: 'worship',
        createdAt: '2026-09-26T18:00:00Z',
      },
      {
        id: 'sat-26-12',
        time: '19:00',
        endTime: '20:00',
        duration: 60,
        title: 'تمرين ونشاط رياضي ومشي',
        status: 'pending',
        category: 'health',
        createdAt: '2026-09-26T19:00:00Z',
      },
      {
        id: 'sat-26-13',
        time: '20:00',
        endTime: '21:00',
        duration: 60,
        title: 'صلاة العشاء وأذكار المساء',
        status: 'pending',
        category: 'worship',
        createdAt: '2026-09-26T20:00:00Z',
      },
      {
        id: 'sat-26-14',
        time: '21:00',
        endTime: '22:00',
        duration: 60,
        title: 'قراءة حرة وتطوير ذاتي',
        status: 'pending',
        category: 'study',
        createdAt: '2026-09-26T21:00:00Z',
      },
      {
        id: 'sat-26-15',
        time: '22:00',
        endTime: '23:00',
        duration: 60,
        title: 'مراجعة إنجازات اليوم وتخطيط مهام الغد',
        status: 'pending',
        category: 'work',
        createdAt: '2026-09-26T22:00:00Z',
      },
      {
        id: 'sat-26-16',
        time: '23:00',
        endTime: '00:00',
        duration: 60,
        title: 'تهيئة للنوم والراحة التامة',
        status: 'pending',
        category: 'sleep',
        createdAt: '2026-09-26T23:00:00Z',
      },
    ],
  },
};

export function loadAllDays(): Record<string, DayRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let parsed: Record<string, DayRecord>;
    if (!raw) {
      parsed = JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } else {
      parsed = JSON.parse(raw);
    }
    if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
      parsed = JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }

    // Ensure every day has exactly 24 hourly slots (00:00 to 23:00) without gaps
    for (const key of Object.keys(parsed)) {
      if (!parsed[key]) parsed[key] = { date: key, tasks: [], updatedAt: new Date().toISOString() };
      const existingTasks = parsed[key].tasks || [];
      
      const hourlyTasks: Task[] = [];
      for (let h = 0; h < 24; h++) {
        const timeStr = `${String(h).padStart(2, '0')}:00`;
        const endHour = (h + 1) % 24;
        const endTimeStr = `${String(endHour).padStart(2, '0')}:00`;

        const matches = existingTasks.filter(t => t.time && (t.time === timeStr || t.time.startsWith(`${String(h).padStart(2, '0')}:`)));
        const bestMatch = matches.find(t => t.title && t.title.trim() !== '') || matches[0];

        if (bestMatch) {
          hourlyTasks.push({
            ...bestMatch,
            time: timeStr,
            endTime: endTimeStr,
            duration: 60,
          });
        } else {
          hourlyTasks.push({
            id: `t-${key}-${timeStr}-${Math.random().toString(36).substr(2, 5)}`,
            time: timeStr,
            endTime: endTimeStr,
            duration: 60,
            title: '',
            status: 'pending',
            category: h < 6 || h >= 23 ? 'sleep' : 'general',
            createdAt: new Date().toISOString(),
          });
        }
      }
      parsed[key].tasks = sortTasksByTime(hourlyTasks);
    }
    return parsed;
  } catch (err) {
    console.error('Error loading data from localStorage:', err);
    return JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
  }
}

export function saveAllDays(days: Record<string, DayRecord>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
  } catch (err) {
    console.error('Error saving data to localStorage:', err);
  }
}

export function syncDayToMongo(date: string): void {
  try {
    const all = loadAllDays();
    const rec = all[date];
    if (rec) {
      saveDayToDb(date, rec.tasks, rec.notes || rec.dayNote).catch((e) =>
        console.warn('Cloud day sync failed:', e)
      );
    }
  } catch {
    // Ignore
  }
}

export function getDayRecord(date: string): DayRecord {
  const all = loadAllDays();
  if (all[date] && all[date].tasks && all[date].tasks.length >= 24) {
    return all[date];
  }
  
  // Default to 24-hour template tasks for new days
  apply24HourTemplate(date, false);
  return loadAllDays()[date];
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
  }
): Task {
  const all = loadAllDays();
  const currentRecord = getDayRecord(date);
  
  const startTime = taskInput.time.trim();
  let duration = taskInput.duration;
  let endTime = taskInput.endTime?.trim();

  if (!duration && !endTime) {
    duration = 60;
    endTime = minutesToTime(timeToMinutes(startTime) + 60);
  } else if (!endTime && duration) {
    endTime = minutesToTime(timeToMinutes(startTime) + duration);
  } else if (endTime && !duration) {
    const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
    duration = diff > 0 ? diff : 60;
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedTasks = sortTasksByTime([...currentRecord.tasks, newTask]);
  all[date] = {
    ...currentRecord,
    tasks: updatedTasks,
    updatedAt: new Date().toISOString(),
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
    updatedAt: new Date().toISOString(),
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
  record.updatedAt = new Date().toISOString();
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
  record.updatedAt = new Date().toISOString();
  all[date] = record;
  saveAllDays(all);
  syncDayToMongo(date);
  return deletedTask;
}

export function restoreTaskToDay(date: string, task: Task): void {
  const all = loadAllDays();
  const record = all[date] || { date, tasks: [], updatedAt: new Date().toISOString() };
  record.tasks = sortTasksByTime([...record.tasks, task]);
  record.updatedAt = new Date().toISOString();
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_DATA));
  localStorage.setItem(HABITS_KEY, JSON.stringify(INITIAL_HABITS));
}

export function apply24HourTemplate(dateStr: string, force = false): Task[] {
  const all = loadAllDays();
  const record = all[dateStr] || { date: dateStr, tasks: [], updatedAt: new Date().toISOString() };
  
  const tasks: Task[] = [];
  for (let h = 0; h < 24; h++) {
    const timeStr = `${String(h).padStart(2, '0')}:00`;
    const endHour = (h + 1) % 24;
    const endTimeStr = `${String(endHour).padStart(2, '0')}:00`;
    
    const existing = record.tasks.find(t => t.time === timeStr);
    if (existing && !force) {
      tasks.push(existing);
    } else {
      tasks.push({
        id: `t-${dateStr}-${timeStr}-${Math.random().toString(36).substr(2, 5)}`,
        time: timeStr,
        endTime: endTimeStr,
        duration: 60,
        title: existing?.title || '',
        status: existing?.status || 'pending',
        category: existing?.category || (h < 6 || h >= 23 ? 'sleep' : 'general'),
        createdAt: new Date().toISOString(),
      });
    }
  }

  record.tasks = sortTasksByTime(tasks);
  record.updatedAt = new Date().toISOString();
  all[dateStr] = record;
  saveAllDays(all);
  syncDayToMongo(dateStr);
  return record.tasks;
}
