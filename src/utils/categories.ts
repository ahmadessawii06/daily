import { TaskCategory } from '../types';

export interface CategoryMeta {
  id: TaskCategory;
  nameAr: string;
  nameEn: string;
  borderClass: string;
  badgeClass: string;
  dotClass: string;
  bgLightClass: string;
  bgDarkClass: string;
  accentHex: string;
  iconName: string;
}

export const CATEGORIES: Record<TaskCategory, CategoryMeta> = {
  study: {
    id: 'study',
    nameAr: 'دراسة',
    nameEn: 'Study',
    borderClass: 'border-l-4 border-l-blue-500 rtl:border-r-4 rtl:border-r-blue-500 rtl:border-l-0',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50',
    dotClass: 'bg-blue-500',
    bgLightClass: 'bg-blue-50/40',
    bgDarkClass: 'dark:bg-blue-950/20',
    accentHex: '#3b82f6',
    iconName: 'BookOpen',
  },
  worship: {
    id: 'worship',
    nameAr: 'عبادة',
    nameEn: 'Worship',
    borderClass: 'border-l-4 border-l-emerald-500 rtl:border-r-4 rtl:border-r-emerald-500 rtl:border-l-0',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50',
    dotClass: 'bg-emerald-500',
    bgLightClass: 'bg-emerald-50/40',
    bgDarkClass: 'dark:bg-emerald-950/20',
    accentHex: '#10b981',
    iconName: 'MoonStar',
  },
  health: {
    id: 'health',
    nameAr: 'صحة',
    nameEn: 'Health',
    borderClass: 'border-l-4 border-l-rose-500 rtl:border-r-4 rtl:border-r-rose-500 rtl:border-l-0',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50',
    dotClass: 'bg-rose-500',
    bgLightClass: 'bg-rose-50/40',
    bgDarkClass: 'dark:bg-rose-950/20',
    accentHex: '#f43f5e',
    iconName: 'Activity',
  },
  rest: {
    id: 'rest',
    nameAr: 'راحة',
    nameEn: 'Rest',
    borderClass: 'border-l-4 border-l-purple-500 rtl:border-r-4 rtl:border-r-purple-500 rtl:border-l-0',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50',
    dotClass: 'bg-purple-500',
    bgLightClass: 'bg-purple-50/40',
    bgDarkClass: 'dark:bg-purple-950/20',
    accentHex: '#a855f7',
    iconName: 'Coffee',
  },
  sleep: {
    id: 'sleep',
    nameAr: 'نوم',
    nameEn: 'Sleep',
    borderClass: 'border-l-4 border-l-slate-400 dark:border-l-slate-500 rtl:border-r-4 rtl:border-r-slate-400 dark:rtl:border-r-slate-500 rtl:border-l-0',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    dotClass: 'bg-slate-400 dark:bg-slate-500',
    bgLightClass: 'bg-slate-50/80',
    bgDarkClass: 'dark:bg-slate-900/40',
    accentHex: '#64748b',
    iconName: 'Bed',
  },
  work: {
    id: 'work',
    nameAr: 'عمل',
    nameEn: 'Work',
    borderClass: 'border-l-4 border-l-amber-500 rtl:border-r-4 rtl:border-r-amber-500 rtl:border-l-0',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50',
    dotClass: 'bg-amber-500',
    bgLightClass: 'bg-amber-50/40',
    bgDarkClass: 'dark:bg-amber-950/20',
    accentHex: '#f59e0b',
    iconName: 'Briefcase',
  },
  general: {
    id: 'general',
    nameAr: 'عام',
    nameEn: 'General',
    borderClass: 'border-l-4 border-l-slate-300 dark:border-l-zinc-700 rtl:border-r-4 rtl:border-r-slate-300 dark:rtl:border-r-zinc-700 rtl:border-l-0',
    badgeClass: 'bg-slate-50 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700',
    dotClass: 'bg-slate-400',
    bgLightClass: 'bg-slate-50/30',
    bgDarkClass: 'dark:bg-zinc-900/30',
    accentHex: '#94a3b8',
    iconName: 'Clock',
  },
};

export function getCategoryMeta(category?: string): CategoryMeta {
  if (category && category in CATEGORIES) {
    return CATEGORIES[category as TaskCategory];
  }
  return CATEGORIES.general;
}

export function autoDetectCategory(title: string): TaskCategory {
  const lower = title.toLowerCase().trim();
  if (lower.includes('نوم') || lower.includes('sleep') || lower.includes('قيلولة')) {
    return 'sleep';
  }
  if (
    lower.includes('صلاة') ||
    lower.includes('قرآن') ||
    lower.includes('أذكار') ||
    lower.includes('ذكر') ||
    lower.includes('فجر') ||
    lower.includes('ظهر') ||
    lower.includes('عصر') ||
    lower.includes('مغرب') ||
    lower.includes('عشاء') ||
    lower.includes('جمعة') ||
    lower.includes('دعاء') ||
    lower.includes('worship') ||
    lower.includes('prayer')
  ) {
    return 'worship';
  }
  if (
    lower.includes('دراسة') ||
    lower.includes('محاضرة') ||
    lower.includes('مذاكرة') ||
    lower.includes('مراجعة') ||
    lower.includes('امتحان') ||
    lower.includes('اختبار') ||
    lower.includes('واجب') ||
    lower.includes('جامعة') ||
    lower.includes('مدرسة') ||
    lower.includes('كتاب') ||
    lower.includes('بحث') ||
    lower.includes('study')
  ) {
    return 'study';
  }
  if (
    lower.includes('تمرين') ||
    lower.includes('رياضة') ||
    lower.includes('نادي') ||
    lower.includes('جيم') ||
    lower.includes('مشي') ||
    lower.includes('جري') ||
    lower.includes('صحة') ||
    lower.includes('فطور') ||
    lower.includes('غداء') ||
    lower.includes('عشاء') ||
    lower.includes('طعام') ||
    lower.includes('health') ||
    lower.includes('workout')
  ) {
    return 'health';
  }
  if (
    lower.includes('برمجة') ||
    lower.includes('عمل') ||
    lower.includes('مشروع') ||
    lower.includes('دوام') ||
    lower.includes('اجتماع') ||
    lower.includes('موقع') ||
    lower.includes('كود') ||
    lower.includes('work') ||
    lower.includes('project')
  ) {
    return 'work';
  }
  if (
    lower.includes('راحة') ||
    lower.includes('استراحة') ||
    lower.includes('قعدة') ||
    lower.includes('عائلة') ||
    lower.includes('أهل') ||
    lower.includes('نزهة') ||
    lower.includes('أصدقاء') ||
    lower.includes('فيلم') ||
    lower.includes('شاي') ||
    lower.includes('قهوة') ||
    lower.includes('rest') ||
    lower.includes('break')
  ) {
    return 'rest';
  }
  return 'general';
}
