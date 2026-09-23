import { DayRecord, DayStats, Task } from '../types';
import { sortTasksByTime } from './date';

const STORAGE_KEY = 'daily_tasks_app_data_v1';

// Seed data mirroring the user's authentic schedule from the uploaded image
const INITIAL_SEED_DATA: Record<string, DayRecord> = {
  '2026-09-23': {
    date: '2026-09-23',
    updatedAt: new Date().toISOString(),
    dayNote: 'جدول اليوم الدراسي والعبادات والمشاريع البرمجية',
    tasks: [
      { id: 'seed-23-01', time: '00:00', title: 'نوم', status: 'done', createdAt: '2026-09-23T00:00:00Z' },
      { id: 'seed-23-02', time: '01:00', title: 'نوم', status: 'done', createdAt: '2026-09-23T01:00:00Z' },
      { id: 'seed-23-03', time: '02:00', title: 'نوم', status: 'done', createdAt: '2026-09-23T02:00:00Z' },
      { id: 'seed-23-04', time: '03:00', title: 'نوم', status: 'done', createdAt: '2026-09-23T03:00:00Z' },
      { id: 'seed-23-05', time: '04:00', title: 'نوم', status: 'done', createdAt: '2026-09-23T04:00:00Z' },
      { id: 'seed-23-06', time: '05:00', title: 'صلاة الفجر + مراجعة القرآن', status: 'not-done', notes: 'مراجعة القرآن لم يتم', createdAt: '2026-09-23T05:00:00Z' },
      { id: 'seed-23-07', time: '06:00', title: 'تجهيز للدوام + أذكار الصباح', status: 'done', createdAt: '2026-09-23T06:00:00Z' },
      { id: 'seed-23-08', time: '07:00', title: 'مواصلات', status: 'done', createdAt: '2026-09-23T07:00:00Z' },
      { id: 'seed-23-09', time: '08:00', title: 'محاضرة استرجاع', status: 'done', createdAt: '2026-09-23T08:00:00Z' },
      { id: 'seed-23-10', time: '09:00', title: 'محاضرة استرجاع', status: 'done', createdAt: '2026-09-23T09:00:00Z' },
      { id: 'seed-23-11', time: '10:00', title: 'فطور + مراجعة قرآن', status: 'not-done', notes: 'مراجعة القرآن لم يتم', createdAt: '2026-09-23T10:00:00Z' },
      { id: 'seed-23-12', time: '11:00', title: 'ترتيب اللابتوب', status: 'pending', createdAt: '2026-09-23T11:00:00Z' },
      { id: 'seed-23-13', time: '12:00', title: 'محاضرة التعلم الآلي', status: 'done', createdAt: '2026-09-23T12:00:00Z' },
      { id: 'seed-23-14', time: '13:00', title: 'محاضرة التعلم الآلي', status: 'done', createdAt: '2026-09-23T13:00:00Z' },
      { id: 'seed-23-15', time: '14:00', title: 'صلاة الظهر + قعدة بسيطة', status: 'done', createdAt: '2026-09-23T14:00:00Z' },
      { id: 'seed-23-16', time: '15:00', title: 'مواصلات', status: 'done', createdAt: '2026-09-23T15:00:00Z' },
      { id: 'seed-23-17', time: '16:00', title: 'صلاة العصر', status: 'done', createdAt: '2026-09-23T16:00:00Z' },
      { id: 'seed-23-18', time: '17:00', title: 'دراسة الـ4 محاضرات', status: 'not-done', createdAt: '2026-09-23T17:00:00Z' },
      { id: 'seed-23-19', time: '18:00', title: 'صلاة المغرب', status: 'done', createdAt: '2026-09-23T18:00:00Z' },
      { id: 'seed-23-20', time: '19:00', title: 'برمجة خفيفة وتكمل موقع نفس', status: 'done', notes: 'تطوير واجهة المستخدم', createdAt: '2026-09-23T19:00:00Z' },
      { id: 'seed-23-21', time: '20:00', title: 'صلاة العشاء', status: 'done', createdAt: '2026-09-23T20:00:00Z' },
      { id: 'seed-23-22', time: '21:00', title: 'استراحة', status: 'done', createdAt: '2026-09-23T21:00:00Z' },
      { id: 'seed-23-23', time: '22:00', title: 'استراحة', status: 'done', createdAt: '2026-09-23T22:00:00Z' },
      { id: 'seed-23-24', time: '23:00', title: 'نوم', status: 'done', createdAt: '2026-09-23T23:00:00Z' },
    ]
  },
  '2026-09-22': {
    date: '2026-09-22',
    updatedAt: '2026-09-22T23:30:00Z',
    dayNote: 'يوم الجامعة والمشروع',
    tasks: [
      { id: 'seed-22-01', time: '05:00', title: 'صلاة الفجر وقراءة أذكار', status: 'done', createdAt: '2026-09-22T05:00:00Z' },
      { id: 'seed-22-02', time: '08:00', title: 'الجامعة — معمل الشبكات', status: 'done', createdAt: '2026-09-22T08:00:00Z' },
      { id: 'seed-22-03', time: '12:00', title: 'الدراسة ومراجعة السلايدات', status: 'done', createdAt: '2026-09-22T12:00:00Z' },
      { id: 'seed-22-04', time: '16:00', title: 'التمرين والنادي', status: 'not-done', notes: 'تأجل بسبب ضغط المذاكرة', createdAt: '2026-09-22T16:00:00Z' },
      { id: 'seed-22-05', time: '19:00', title: 'حل واجب الذكاء الاصطناعي', status: 'done', createdAt: '2026-09-22T19:00:00Z' },
      { id: 'seed-22-06', time: '21:30', title: 'مراجعة خفيفة وترتيب مهام الغد', status: 'done', createdAt: '2026-09-22T21:30:00Z' }
    ]
  },
  '2026-09-21': {
    date: '2026-09-21',
    updatedAt: '2026-09-21T23:00:00Z',
    dayNote: 'بداية الأسبوع',
    tasks: [
      { id: 'seed-21-01', time: '05:00', title: 'صلاة الفجر', status: 'done', createdAt: '2026-09-21T05:00:00Z' },
      { id: 'seed-21-02', time: '08:30', title: 'محاضرة قواعد البيانات', status: 'done', createdAt: '2026-09-21T08:30:00Z' },
      { id: 'seed-21-03', time: '13:00', title: 'مشروع التخرج ومناقشة الفريق', status: 'done', createdAt: '2026-09-21T13:00:00Z' },
      { id: 'seed-21-04', time: '17:00', title: 'قراءة كتاب البرمجة الشيئية', status: 'pending', createdAt: '2026-09-21T17:00:00Z' },
      { id: 'seed-21-05', time: '20:00', title: 'جلسة عائلية واستراحة', status: 'done', createdAt: '2026-09-21T20:00:00Z' }
    ]
  }
};

export function loadAllDays(): Record<string, DayRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_DATA));
      return INITIAL_SEED_DATA;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_DATA));
      return INITIAL_SEED_DATA;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading data from localStorage:', err);
    return INITIAL_SEED_DATA;
  }
}

export function saveAllDays(days: Record<string, DayRecord>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
  } catch (err) {
    console.error('Error saving data to localStorage:', err);
  }
}

export function getDayRecord(date: string): DayRecord {
  const all = loadAllDays();
  if (all[date]) {
    return all[date];
  }
  // Create empty record for date
  const newRecord: DayRecord = {
    date,
    tasks: [],
    updatedAt: new Date().toISOString()
  };
  all[date] = newRecord;
  saveAllDays(all);
  return newRecord;
}

export function saveDayTasks(date: string, tasks: Task[]): void {
  const all = loadAllDays();
  const sorted = sortTasksByTime(tasks);
  all[date] = {
    ...(all[date] || { date }),
    tasks: sorted,
    updatedAt: new Date().toISOString()
  };
  saveAllDays(all);
}

export function addTaskToDay(
  date: string,
  taskInput: { time: string; title: string; status?: Task['status']; notes?: string; category?: string }
): Task {
  const all = loadAllDays();
  const currentRecord = all[date] || { date, tasks: [], updatedAt: new Date().toISOString() };
  
  const newTask: Task = {
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    time: taskInput.time.trim(),
    title: taskInput.title.trim(),
    status: taskInput.status || 'pending',
    notes: taskInput.notes?.trim() || undefined,
    category: taskInput.category?.trim() || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedTasks = sortTasksByTime([...currentRecord.tasks, newTask]);
  all[date] = {
    ...currentRecord,
    tasks: updatedTasks,
    updatedAt: new Date().toISOString()
  };
  saveAllDays(all);
  return newTask;
}

export function updateTaskInDay(date: string, taskId: string, updates: Partial<Task>): void {
  const all = loadAllDays();
  const record = all[date];
  if (!record) return;

  const taskIndex = record.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return;

  const updatedTask: Task = {
    ...record.tasks[taskIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  const newTasks = [...record.tasks];
  newTasks[taskIndex] = updatedTask;
  
  // Re-sort if time changed
  record.tasks = sortTasksByTime(newTasks);
  record.updatedAt = new Date().toISOString();
  all[date] = record;
  saveAllDays(all);
}

export function deleteTaskFromDay(date: string, taskId: string): void {
  const all = loadAllDays();
  const record = all[date];
  if (!record) return;

  record.tasks = record.tasks.filter(t => t.id !== taskId);
  record.updatedAt = new Date().toISOString();
  all[date] = record;
  saveAllDays(all);
}

export function calculateStats(tasks: Task[]): DayStats {
  const total = tasks.length;
  let done = 0;
  let notDone = 0;
  let pending = 0;

  for (const t of tasks) {
    if (t.status === 'done') done++;
    else if (t.status === 'not-done') notDone++;
    else pending++;
  }

  const completionPercentage = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    total,
    done,
    notDone,
    pending,
    completionPercentage
  };
}

export function getAllArchiveDays(): DayRecord[] {
  const all = loadAllDays();
  const keys = Object.keys(all);
  // Sort descending by date (latest first)
  keys.sort((a, b) => b.localeCompare(a));
  
  // Filter to days that have at least one task or were saved
  return keys
    .map(key => all[key])
    .filter(record => record && record.tasks.length > 0);
}

export function resetToDefaults(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_DATA));
}
