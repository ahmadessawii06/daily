import { Task } from '../types';

export function getTodayDateString(): string {
  // Configured default start date: Saturday 2026-09-26
  return '2026-09-26';
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameDay(dateStr1: string, dateStr2: string): boolean {
  return dateStr1 === dateStr2;
}

export function isToday(dateStr: string): boolean {
  return isSameDay(dateStr, getTodayDateString());
}

const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const arabicMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const englishDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const englishMonths = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function formatDate(dateStr: string, lang: 'ar' | 'en' = 'ar'): string {
  const d = parseDate(dateStr);
  const dayIndex = d.getDay();
  const monthIndex = d.getMonth();
  const dayNum = d.getDate();
  const yearNum = d.getFullYear();

  if (lang === 'ar') {
    return `${arabicDays[dayIndex]}، ${dayNum} ${arabicMonths[monthIndex]} ${yearNum}`;
  }
  return `${englishDays[dayIndex]}, ${englishMonths[monthIndex]} ${dayNum}, ${yearNum}`;
}

export function formatHeaderDate(dateStr: string, lang: 'ar' | 'en' = 'ar'): string {
  const d = parseDate(dateStr);
  const dayIndex = d.getDay();
  const monthIndex = d.getMonth();
  const dayNum = d.getDate();

  if (lang === 'ar') {
    return `${arabicDays[dayIndex]}، ${dayNum} ${arabicMonths[monthIndex]}`;
  }
  return `${englishDays[dayIndex]}, ${englishMonths[monthIndex]} ${dayNum}`;
}

export function formatMonthYear(dateStr: string, lang: 'ar' | 'en' = 'ar'): string {
  const d = parseDate(dateStr);
  const monthIndex = d.getMonth();
  const yearNum = d.getFullYear();

  if (lang === 'ar') {
    return `${arabicMonths[monthIndex]} ${yearNum}`;
  }
  return `${englishMonths[monthIndex]} ${yearNum}`;
}

export function formatShortDate(dateStr: string, lang: 'ar' | 'en' = 'ar'): string {
  const d = parseDate(dateStr);
  const dayNum = d.getDate();
  const monthIndex = d.getMonth();
  const yearNum = d.getFullYear();

  if (lang === 'ar') {
    return `${dayNum} ${arabicMonths[monthIndex]} ${yearNum}`;
  }
  return `${englishMonths[monthIndex]} ${dayNum}, ${yearNum}`;
}

export function getDateRelativeLabel(dateStr: string, lang: 'ar' | 'en' = 'ar'): string | null {
  const today = getTodayDateString();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);

  if (dateStr === today) return lang === 'ar' ? 'اليوم' : 'Today';
  if (dateStr === yesterday) return lang === 'ar' ? 'أمس' : 'Yesterday';
  if (dateStr === tomorrow) return lang === 'ar' ? 'غداً' : 'Tomorrow';
  return null;
}

/**
 * Sorts tasks chronologically by time (HH:MM format)
 */
export function sortTasksByTime(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Normalise time strings to HH:MM format
    const timeA = normalizeTime(a.time);
    const timeB = normalizeTime(b.time);
    return timeA.localeCompare(timeB);
  });
}

export function normalizeTime(time: string): string {
  if (!time) return '00:00';
  const parts = time.trim().split(':');
  let h = parseInt(parts[0], 10);
  let m = parts[1] ? parseInt(parts[1], 10) : 0;
  if (isNaN(h)) h = 0;
  if (isNaN(m)) m = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface FormattedTime12h {
  time12: string;     // e.g. "05:00"
  hours: number;
  minutes: string;
  isPM: boolean;
  period: string;     // "صباحًا" or "مساءً"
  periodShort: string;// "ص" or "م"
  formatted: string;  // "05:00 صباحًا"
}

export function formatTime12h(time24: string, lang: 'ar' | 'en' = 'ar'): FormattedTime12h {
  const norm = normalizeTime(time24);
  const [hStr, mStr] = norm.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr || '00';

  const isPM = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const time12 = `${String(h12).padStart(2, '0')}:${m}`;

  const period = lang === 'ar' ? (isPM ? 'مساءً' : 'صباحًا') : (isPM ? 'PM' : 'AM');
  const periodShort = lang === 'ar' ? (isPM ? 'م' : 'ص') : (isPM ? 'PM' : 'AM');

  return {
    time12,
    hours: h12,
    minutes: m,
    isPM,
    period,
    periodShort,
    formatted: `${time12} ${period}`,
  };
}
