export type TaskStatus = 'done' | 'not-done' | 'pending';

export type TaskCategory = 'study' | 'worship' | 'health' | 'rest' | 'sleep' | 'work' | 'general';

export interface Task {
  id: string;
  time: string; // "HH:MM" e.g. "05:00", "14:30"
  endTime?: string; // "HH:MM" e.g. "08:00" for extended block
  duration?: number; // duration in minutes (e.g. 60, 120, 240)
  title: string;
  status: TaskStatus;
  notes?: string;
  category?: TaskCategory;
  createdAt: string;
  updatedAt?: string;
}

export interface DayRecord {
  date: string; // "YYYY-MM-DD" e.g. "2026-09-24"
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
  totalDurationMinutes?: number;
  doneDurationMinutes?: number;
}

export interface HabitStreak {
  id: string;
  title: string;
  category: TaskCategory;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate?: string;
  icon?: string;
}

export interface WeeklyDayData {
  date: string; // "YYYY-MM-DD"
  dayNameAr: string;
  dayNameEn: string;
  shortDate: string;
  total: number;
  done: number;
  percentage: number;
  isToday: boolean;
}

export type ViewMode = 'timeline' | 'periods' | 'list';
export type ActiveTab = 'daily' | 'stats' | 'archive';
export type StatusFilter = 'all' | 'scheduled' | 'done' | 'pending' | 'not-done';
export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';

export interface PrayerTimeItem {
  id: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nameAr: string;
  nameEn: string;
  time: string; // "HH:MM" e.g. "05:00"
}

export interface PrayerLocationConfig {
  city: string;
  cityDisplayAr: string;
  cityDisplayEn: string;
  country: string;
  countryDisplayAr: string;
  countryDisplayEn: string;
  method: number; // e.g. 4 for Umm Al-Qura, 5 for Egypt
  latitude?: number;
  longitude?: number;
  useGeolocation?: boolean;
}

export interface PrayerTimesDayResponse {
  date: string; // "YYYY-MM-DD"
  prayers: PrayerTimeItem[];
  sunrise?: string;
  hijriFormatted?: string;
  hijriDay?: string;
  hijriMonth?: string;
  hijriYear?: string;
  locationNameAr?: string;
  locationNameEn?: string;
  methodNameAr?: string;
  methodNameEn?: string;
}

