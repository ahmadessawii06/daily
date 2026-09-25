import { DayRecord, DayStats, HabitStreak, PrayerTimeItem, Task, TaskCategory, Theme, WeeklyDayData } from '../types';
import { sortTasksByTime } from './date';
import { autoDetectCategory } from './categories';
import { SCHEDULE_TEMPLATES } from './templates';
import { saveDayToDb, saveHabitsToDb } from '../services/api';

const STORAGE_KEY = 'daily_tasks_app_data_v2';
const THEME_KEY = 'daily_theme_v1';
const HABITS_KEY = 'daily_habits_v1';
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

export const INITIAL_HABITS: HabitStreak[] = [
  {
    id: 'habit-fajr',
    title: 'صلاة الفجر وقراءة أذكار الصباح',
    category: 'worship',
    currentStreak: 14,
    bestStreak: 30,
  },
  {
    id: 'habit-study',
    title: 'جلسات الدراسة العميقة والبرمجة',
    category: 'study',
    currentStreak: 7,
    bestStreak: 18,
  },
  {
    id: 'habit-health',
    title: 'النشاط البدني والمشي 30 دقيقة',
    category: 'health',
    currentStreak: 5,
    bestStreak: 12,
  },
  {
    id: 'habit-quran',
    title: 'مراجعة وتدبر ورد القرآن اليومي',
    category: 'worship',
    currentStreak: 9,
    bestStreak: 21,
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

// Authentic initial seed schedule structured as true TIME BLOCKS!
// Notice "نوم" is one single 5-hour block instead of 5 repeated rows!
const INITIAL_SEED_DATA: Record<string, DayRecord> = {
  '2026-09-24': {
    date: '2026-09-24',
    updatedAt: '2026-09-24T07:15:00Z',
    dayNote: 'جدول اليوم الدراسي والعبادات ومشاريع البرمجة',
    tasks: [
      {
        id: 'seed-24-01',
        time: '00:00',
        endTime: '05:00',
        duration: 300,
        title: 'نوم واستعادة طاقة',
        status: 'done',
        category: 'sleep',
        createdAt: '2026-09-24T00:00:00Z',
      },
      {
        id: 'seed-24-02',
        time: '05:00',
        endTime: '06:00',
        duration: 60,
        title: 'صلاة الفجر + مراجعة القرآن',
        status: 'done',
        category: 'worship',
        notes: 'مراجعة الجزء الثاني',
        createdAt: '2026-09-24T05:00:00Z',
      },
      {
        id: 'seed-24-03',
        time: '06:00',
        endTime: '07:00',
        duration: 60,
        title: 'تجهيز للدوام + أذكار الصباح',
        status: 'done',
        category: 'worship',
        createdAt: '2026-09-24T06:00:00Z',
      },
      {
        id: 'seed-24-04',
        time: '07:00',
        endTime: '08:00',
        duration: 60,
        title: 'مواصلات والتوجه للجامعة',
        status: 'done',
        category: 'general',
        createdAt: '2026-09-24T07:00:00Z',
      },
      {
        id: 'seed-24-05',
        time: '08:00',
        endTime: '10:00',
        duration: 120,
        title: 'محاضرة استرجاع وتطبيقات خوارزميات',
        status: 'done',
        category: 'study',
        createdAt: '2026-09-24T08:00:00Z',
      },
      {
        id: 'seed-24-06',
        time: '10:00',
        endTime: '11:00',
        duration: 60,
        title: 'فطور صحي واستراحة',
        status: 'not-done',
        category: 'health',
        createdAt: '2026-09-24T10:00:00Z',
      },
      {
        id: 'seed-24-07',
        time: '11:00',
        endTime: '12:00',
        duration: 60,
        title: 'ترتيب وتنظيم اللابتوب وملاحظات المحاضرات',
        status: 'pending',
        category: 'work',
        createdAt: '2026-09-24T11:00:00Z',
      },
      {
        id: 'seed-24-08',
        time: '12:00',
        endTime: '14:00',
        duration: 120,
        title: 'محاضرة التعلم الآلي والذكاء الاصطناعي',
        status: 'pending',
        category: 'study',
        createdAt: '2026-09-24T12:00:00Z',
      },
      {
        id: 'seed-24-09',
        time: '14:00',
        endTime: '15:00',
        duration: 60,
        title: 'صلاة الظهر + جلسة هدوء',
        status: 'pending',
        category: 'worship',
        createdAt: '2026-09-24T14:00:00Z',
      },
      {
        id: 'seed-24-10',
        time: '15:00',
        endTime: '16:00',
        duration: 60,
        title: 'مواصلات العودة للمنزل',
        status: 'pending',
        category: 'general',
        createdAt: '2026-09-24T15:00:00Z',
      },
      {
        id: 'seed-24-11',
        time: '16:00',
        endTime: '17:00',
        duration: 60,
        title: 'صلاة العصر',
        status: 'pending',
        category: 'worship',
        createdAt: '2026-09-24T16:00:00Z',
      },
      {
        id: 'seed-24-12',
        time: '17:00',
        endTime: '18:00',
        duration: 60,
        title: 'دراسة ومراجعة الـ 4 محاضرات',
        status: 'pending',
        category: 'study',
        createdAt: '2026-09-24T17:00:00Z',
      },
      {
        id: 'seed-24-13',
        time: '18:00',
        endTime: '19:00',
        duration: 60,
        title: 'صلاة المغرب',
        status: 'pending',
        category: 'worship',
        createdAt: '2026-09-24T18:00:00Z',
      },
      {
        id: 'seed-24-14',
        time: '19:00',
        endTime: '20:00',
        duration: 60,
        title: 'برمجة خفيفة وتكملة موقع Daily Track',
        status: 'pending',
        category: 'work',
        notes: 'تطوير المخطط الزمني والتحسينات',
        createdAt: '2026-09-24T19:00:00Z',
      },
      {
        id: 'seed-24-15',
        time: '20:00',
        endTime: '21:00',
        duration: 60,
        title: 'صلاة العشاء',
        status: 'pending',
        category: 'worship',
        createdAt: '2026-09-24T20:00:00Z',
      },
      {
        id: 'seed-24-16',
        time: '21:00',
        endTime: '23:00',
        duration: 120,
        title: 'استراحة شخصية وجلسة عائلية',
        status: 'pending',
        category: 'rest',
        createdAt: '2026-09-24T21:00:00Z',
      },
      {
        id: 'seed-24-17',
        time: '23:00',
        endTime: '24:00',
        duration: 60,
        title: 'نوم واستعداد ليوم الغد',
        status: 'pending',
        category: 'sleep',
        createdAt: '2026-09-24T23:00:00Z',
      },
    ],
  },
  '2026-09-23': {
    date: '2026-09-23',
    updatedAt: '2026-09-23T23:45:00Z',
    dayNote: 'أمس - إنجاز مميز في الجامعة',
    tasks: [
      { id: 'seed-23-01', time: '00:00', endTime: '05:00', duration: 300, title: 'نوم', status: 'done', category: 'sleep', createdAt: '2026-09-23T00:00:00Z' },
      { id: 'seed-23-02', time: '05:00', endTime: '06:00', duration: 60, title: 'صلاة الفجر + مراجعة القرآن', status: 'done', category: 'worship', createdAt: '2026-09-23T05:00:00Z' },
      { id: 'seed-23-03', time: '06:00', endTime: '08:00', duration: 120, title: 'تجهيز ومواصلات', status: 'done', category: 'general', createdAt: '2026-09-23T06:00:00Z' },
      { id: 'seed-23-04', time: '08:00', endTime: '10:00', duration: 120, title: 'محاضرة استرجاع', status: 'done', category: 'study', createdAt: '2026-09-23T08:00:00Z' },
      { id: 'seed-23-05', time: '10:00', endTime: '11:00', duration: 60, title: 'فطور + راحة', status: 'not-done', category: 'health', createdAt: '2026-09-23T10:00:00Z' },
      { id: 'seed-23-06', time: '11:00', endTime: '14:00', duration: 180, title: 'محاضرات التعلم الآلي', status: 'done', category: 'study', createdAt: '2026-09-23T11:00:00Z' },
      { id: 'seed-23-07', time: '14:00', endTime: '16:00', duration: 120, title: 'صلاة الظهر ومواصلات', status: 'done', category: 'worship', createdAt: '2026-09-23T14:00:00Z' },
      { id: 'seed-23-08', time: '16:00', endTime: '18:00', duration: 120, title: 'صلاة العصر ودراسة المحاضرات', status: 'done', category: 'study', createdAt: '2026-09-23T16:00:00Z' },
      { id: 'seed-23-09', time: '18:00', endTime: '20:00', duration: 120, title: 'صلاة المغرب وبرمجة', status: 'done', category: 'work', createdAt: '2026-09-23T18:00:00Z' },
      { id: 'seed-23-10', time: '20:00', endTime: '23:00', duration: 180, title: 'صلاة العشاء واستراحة', status: 'done', category: 'rest', createdAt: '2026-09-23T20:00:00Z' },
      { id: 'seed-23-11', time: '23:00', endTime: '24:00', duration: 60, title: 'نوم', status: 'done', category: 'sleep', createdAt: '2026-09-23T23:00:00Z' },
    ],
  },
  '2026-09-22': {
    date: '2026-09-22',
    updatedAt: '2026-09-22T23:30:00Z',
    dayNote: 'يوم الثلاثاء - معمل الشبكات والرياضة',
    tasks: [
      { id: 'seed-22-01', time: '05:00', endTime: '06:00', duration: 60, title: 'صلاة الفجر وقراءة أذكار', status: 'done', category: 'worship', createdAt: '2026-09-22T05:00:00Z' },
      { id: 'seed-22-02', time: '08:00', endTime: '11:00', duration: 180, title: 'الجامعة — معمل الشبكات', status: 'done', category: 'study', createdAt: '2026-09-22T08:00:00Z' },
      { id: 'seed-22-03', time: '12:00', endTime: '15:00', duration: 180, title: 'الدراسة ومراجعة السلايدات', status: 'done', category: 'study', createdAt: '2026-09-22T12:00:00Z' },
      { id: 'seed-22-04', time: '16:00', endTime: '18:00', duration: 120, title: 'التمرين والنادي الرياضي', status: 'not-done', category: 'health', notes: 'تأجل بسبب ضغط المذاكرة', createdAt: '2026-09-22T16:00:00Z' },
      { id: 'seed-22-05', time: '19:00', endTime: '21:00', duration: 120, title: 'حل واجب الذكاء الاصطناعي', status: 'done', category: 'study', createdAt: '2026-09-22T19:00:00Z' },
      { id: 'seed-22-06', time: '21:30', endTime: '23:00', duration: 90, title: 'مراجعة خفيفة وترتيب مهام الغد', status: 'done', category: 'rest', createdAt: '2026-09-22T21:30:00Z' },
    ],
  },
};

// Deduplicate tasks sharing the exact same start time (e.g. 11:00)
function deduplicateTasksByTime(taskArr: Task[]): Task[] {
  const map = new Map<string, Task>();
  for (const t of taskArr) {
    const timeKey = t.time || '00:00';
    const existing = map.get(timeKey);
    if (!existing) {
      map.set(timeKey, t);
    } else {
      if ((!existing.title || existing.title.trim() === '') && (t.title && t.title.trim() !== '')) {
        map.set(timeKey, t);
      }
    }
  }
  return Array.from(map.values());
}

// Normalize tasks without auto-merging adjacent items of the same title
function normalizeTasksWithoutMerging(rawTasks: Task[]): Task[] {
  if (!rawTasks || rawTasks.length === 0) return [];

  return rawTasks.map((t) => {
    const cat = t.category || autoDetectCategory(t.title);
    let dur = t.duration;
    let end = t.endTime;
    if (!dur && !end) {
      dur = 60;
      end = minutesToTime(timeToMinutes(t.time) + 60);
    } else if (!end && dur) {
      end = minutesToTime(timeToMinutes(t.time) + dur);
    } else if (end && !dur) {
      const diff = timeToMinutes(end) - timeToMinutes(t.time);
      dur = diff > 0 ? diff : 60;
    }
    return {
      ...t,
      category: cat,
      duration: dur,
      endTime: end,
    };
  });
}

export function loadAllDays(): Record<string, DayRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let parsed: Record<string, DayRecord>;
    if (!raw) {
      parsed = JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
    } else {
      parsed = JSON.parse(raw);
    }
    if (!parsed || typeof parsed !== 'object') {
      parsed = JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
    }

    // Ensure every day has exactly 24 hourly slots (00:00 to 23:00) without gaps or duplication
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

  // Generate 7 days ending at referenceDate + 2 (or surrounding the reference date)
  // Let's get the 7 days containing referenceDate (e.g. 6 days ago up to today)
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
        category: existing?.category || 'general',
        createdAt: new Date().toISOString(),
      });
    }
  }

  record.tasks = sortTasksByTime(tasks);
  record.updatedAt = new Date().toISOString();
  all[dateStr] = record;
  saveAllDays(all);
  return record.tasks;
}
