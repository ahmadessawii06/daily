export type TaskStatus = 'done' | 'not-done' | 'pending';

export interface Task {
  id: string;
  time: string; // "HH:MM" e.g. "05:00", "14:30"
  title: string;
  status: TaskStatus;
  notes?: string;
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DayRecord {
  date: string; // "YYYY-MM-DD" e.g. "2026-09-23"
  tasks: Task[];
  dayNote?: string;
  updatedAt: string;
}

export interface DayStats {
  total: number;
  done: number;
  notDone: number;
  pending: number;
  completionPercentage: number;
}

export type ViewMode = 'cards' | 'table';
export type StatusFilter = 'all' | 'done' | 'pending' | 'not-done';
export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';
