import { RecurringItem, RecurringFrequency, TaskCategory, TaskPriority } from '../types';
import { autoDetectCategory } from './categories';
import { getTodayDateString, parseDate } from './date';
import { fetchRecurringFromDb, saveRecurringToDb } from '../services/api';

const RECURRING_STORAGE_KEY = 'daily_life_recurring_items_v2';

export const INITIAL_RECURRING_ITEMS: RecurringItem[] = [
  {
    id: 'rec_quran_daily',
    title: 'قراءة القرآن الكريم',
    category: 'worship',
    frequency: 'daily',
    targetDuration: 20,
    priority: 'high',
    icon: '📖',
    isActive: true,
    startDate: '2026-09-01',
    currentStreak: 5,
    bestStreak: 14,
    completionHistory: {},
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'rec_database_study',
    title: 'مراجعة وتطبيق Database',
    category: 'study',
    frequency: 'selected_days',
    selectedDays: [0, 2, 4, 6], // Sunday, Tuesday, Thursday, Saturday
    targetDuration: 60,
    priority: 'high',
    icon: '💾',
    isActive: true,
    startDate: '2026-09-01',
    currentStreak: 3,
    bestStreak: 8,
    completionHistory: {},
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'rec_adhkar_daily',
    title: 'أذكار الصباح والمساء',
    category: 'worship',
    frequency: 'daily',
    targetDuration: 15,
    priority: 'medium',
    icon: '🤲',
    isActive: true,
    startDate: '2026-09-01',
    currentStreak: 7,
    bestStreak: 21,
    completionHistory: {},
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'rec_workout_days',
    title: 'تمارين رياضية / نشاط بدني',
    category: 'health',
    frequency: 'selected_days',
    selectedDays: [1, 3, 5], // Monday, Wednesday, Friday
    targetDuration: 30,
    priority: 'medium',
    icon: '🏃',
    isActive: true,
    startDate: '2026-09-01',
    currentStreak: 2,
    bestStreak: 6,
    completionHistory: {},
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'rec_hygiene_3days',
    title: 'عناية واستحمام عميق',
    category: 'health',
    frequency: 'every_x_days',
    everyXDays: 3,
    targetDuration: 25,
    priority: 'medium',
    icon: '🚿',
    isActive: true,
    startDate: '2026-09-20',
    currentStreak: 1,
    bestStreak: 4,
    completionHistory: {},
    createdAt: '2026-09-20T00:00:00Z',
  },
  {
    id: 'rec_haircut_monthly',
    title: 'قص الشعر والعناية الشخصية',
    category: 'general',
    frequency: 'every_x_days',
    everyXDays: 30,
    targetDuration: 45,
    priority: 'low',
    icon: '✂️',
    isActive: true,
    startDate: '2026-09-01',
    currentStreak: 1,
    bestStreak: 2,
    completionHistory: {},
    createdAt: '2026-09-01T00:00:00Z',
  },
];

export function loadStoredRecurringItems(): RecurringItem[] {
  try {
    const raw = localStorage.getItem(RECURRING_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(INITIAL_RECURRING_ITEMS));
      return INITIAL_RECURRING_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_RECURRING_ITEMS;
  } catch (err) {
    console.warn('Error loading recurring items:', err);
    return INITIAL_RECURRING_ITEMS;
  }
}

export function saveStoredRecurringItems(items: RecurringItem[]): void {
  try {
    localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(items));
    // Background cloud sync
    saveRecurringToDb(items).catch(() => {});
  } catch (err) {
    console.error('Error saving recurring items:', err);
  }
}

/**
 * Checks if a recurring item is due on the specified date string (YYYY-MM-DD).
 */
export function isRecurringDueOnDate(item: RecurringItem, dateStr: string): boolean {
  if (!item.isActive) return false;
  
  if (dateStr < item.startDate) return false;

  const targetDate = parseDate(dateStr);
  const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  switch (item.frequency) {
    case 'daily':
      return true;

    case 'weekly': {
      const startD = parseDate(item.startDate);
      return dayOfWeek === startD.getDay();
    }

    case 'selected_days': {
      if (!Array.isArray(item.selectedDays) || item.selectedDays.length === 0) return true;
      return item.selectedDays.includes(dayOfWeek);
    }

    case 'every_x_days': {
      const interval = item.everyXDays || 1;
      if (interval <= 1) return true;

      // Calculate difference in whole days from start date
      const startD = parseDate(item.startDate);
      const diffTime = targetDate.getTime() - startD.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return false;
      return diffDays % interval === 0;
    }

    case 'monthly': {
      const startD = parseDate(item.startDate);
      const targetDay = targetDate.getDate();
      const startDay = startD.getDate();
      
      // Matches the same day of month, or last day of month if month has fewer days
      const lastDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
      const effectiveTarget = Math.min(startDay, lastDayOfMonth);
      return targetDay === effectiveTarget;
    }

    default:
      return true;
  }
}

/**
 * Human-readable frequency description in Arabic or English
 */
export function getFrequencyLabel(item: RecurringItem, lang: 'ar' | 'en' = 'ar'): string {
  const arDayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const enDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  switch (item.frequency) {
    case 'daily':
      return lang === 'ar' ? 'يومياً' : 'Daily';

    case 'weekly':
      return lang === 'ar' ? 'أسبوعياً' : 'Weekly';

    case 'selected_days': {
      const days = item.selectedDays || [];
      if (days.length === 7) return lang === 'ar' ? 'يومياً' : 'Daily';
      if (days.length === 0) return lang === 'ar' ? 'أيام محددة' : 'Selected days';
      const names = days.map((d) => (lang === 'ar' ? arDayNames[d] : enDayNames[d]));
      return names.join('، ');
    }

    case 'every_x_days': {
      const x = item.everyXDays || 1;
      if (lang === 'ar') {
        if (x === 1) return 'يومياً';
        if (x === 2) return 'كل يومين';
        if (x <= 10) return `كل ${x} أيام`;
        return `كل ${x} يوماً`;
      }
      return `Every ${x} days`;
    }

    case 'monthly':
      return lang === 'ar' ? 'شهرياً' : 'Monthly';

    default:
      return lang === 'ar' ? 'متكرر' : 'Recurring';
  }
}

/**
 * Toggle completion of a recurring item for a specific date
 */
export function toggleRecurringStatus(itemId: string, dateStr: string): RecurringItem[] {
  const items = loadStoredRecurringItems();
  const index = items.findIndex((i) => i.id === itemId);
  if (index === -1) return items;

  const item = items[index];
  const history = { ...(item.completionHistory || {}) };
  const currentCompleted = !!history[dateStr];
  const newCompleted = !currentCompleted;

  history[dateStr] = newCompleted;

  let currentStreak = item.currentStreak || 0;
  let bestStreak = item.bestStreak || 0;

  if (newCompleted) {
    currentStreak += 1;
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
  } else {
    currentStreak = Math.max(0, currentStreak - 1);
  }

  const updated: RecurringItem = {
    ...item,
    completionHistory: history,
    lastCompletedDate: newCompleted ? dateStr : item.lastCompletedDate,
    currentStreak,
    bestStreak,
    updatedAt: new Date().toISOString(),
  };

  items[index] = updated;
  saveStoredRecurringItems(items);
  return items;
}

/**
 * Add a new recurring item
 */
export function createRecurringItem(input: {
  title: string;
  category?: TaskCategory;
  frequency: RecurringFrequency;
  selectedDays?: number[];
  everyXDays?: number;
  targetDuration?: number;
  preferredTime?: string;
  priority?: TaskPriority;
  icon?: string;
  startDate?: string;
}): RecurringItem {
  const items = loadStoredRecurringItems();
  const now = new Date().toISOString();
  const newItem: RecurringItem = {
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: input.title.trim(),
    category: input.category || autoDetectCategory(input.title),
    frequency: input.frequency,
    selectedDays: input.selectedDays,
    everyXDays: input.everyXDays,
    targetDuration: input.targetDuration || 30,
    preferredTime: input.preferredTime,
    priority: input.priority || 'medium',
    icon: input.icon || '🔁',
    isActive: true,
    startDate: input.startDate || getTodayDateString(),
    currentStreak: 0,
    bestStreak: 0,
    completionHistory: {},
    createdAt: now,
    updatedAt: now,
  };

  items.unshift(newItem);
  saveStoredRecurringItems(items);
  return newItem;
}

/**
 * Update an existing recurring item
 */
export function updateRecurringItem(itemId: string, updates: Partial<RecurringItem>): RecurringItem[] {
  const items = loadStoredRecurringItems();
  const index = items.findIndex((i) => i.id === itemId);
  if (index === -1) return items;

  items[index] = {
    ...items[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveStoredRecurringItems(items);
  return items;
}

/**
 * Delete a recurring item
 */
export function deleteRecurringItem(itemId: string): RecurringItem[] {
  const items = loadStoredRecurringItems();
  const filtered = items.filter((i) => i.id !== itemId);
  saveStoredRecurringItems(filtered);
  return filtered;
}
