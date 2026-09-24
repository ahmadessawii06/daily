import { DayRecord, Language, Task } from '../types';
import { addDays, formatDate, parseDate } from './date';
import { loadAllDays } from './storage';

export interface CategoryStat {
  id: string;
  name: string;
  nameEn: string;
  iconName: string;
  total: number;
  done: number;
  notDone: number;
  pending: number;
  percentage: number;
  daysPresent: number; // how many unique days it occurred in
  missedTimes: {
    morning: number;   // 05:00 - 11:59
    afternoon: number; // 12:00 - 16:59
    evening: number;   // 17:00 - 22:59
    night: number;     // 23:00 - 04:59
  };
}

export interface DayWeeklyStat {
  date: string;
  dayName: string;
  total: number;
  done: number;
  notDone: number;
  pending: number;
  percentage: number;
  tasks: Task[];
}

export interface ImprovementArea {
  id: string;
  name: string;
  percentage: number;
  done: number;
  total: number;
  daysPresent: number;
  advice: string;
  adviceEn: string;
}

export interface WeeklyAnalysisResult {
  startDate: string;
  endDate: string;
  rangeLabel: string;
  days: DayWeeklyStat[];
  overallPercentage: number;
  previousWeekPercentage: number;
  diffFromLastWeek: number; // e.g. +12 or -5
  completedDaysCount: number; // days >= 85%
  weakDaysCount: number;      // days < 50%
  topStrength: CategoryStat | null;
  topWeakness: CategoryStat | null;
  improvements: ImprovementArea[];
  categories: CategoryStat[];
  totalTasksCount: number;
  totalDoneCount: number;
}

// Map task titles to core life categories
export function classifyTaskCategory(title: string): { id: string; name: string; nameEn: string; isExcludedFromStrength: boolean } {
  const t = (title || '').toLowerCase().trim();

  // Sleep & Rest
  if (
    t.includes('نوم') || 
    t.includes('sleep') || 
    t.includes('nap') || 
    t.includes('قيلولة') || 
    t.includes('راحة') || 
    t.includes('استراحة')
  ) {
    return { id: 'sleep_rest', name: 'نوم وراحة', nameEn: 'Sleep & Rest', isExcludedFromStrength: true };
  }

  // Worship & Prayers
  if (
    t.includes('صلاة') || 
    t.includes('فجر') || 
    t.includes('ظهر') || 
    t.includes('عصر') || 
    t.includes('مغرب') || 
    t.includes('عشاء') || 
    t.includes('قرآن') || 
    t.includes('تلاوة') || 
    t.includes('أذكار') || 
    t.includes('اذكار') || 
    t.includes('مسجد') || 
    t.includes('تراويح') || 
    t.includes('دعاء') || 
    t.includes('prayer') || 
    t.includes('quran')
  ) {
    return { id: 'worship', name: 'صلاة وعبادات', nameEn: 'Worship & Prayer', isExcludedFromStrength: false };
  }

  // Study & Learning
  if (
    t.includes('دراسة') || 
    t.includes('مذاكرة') || 
    t.includes('محاضرة') || 
    t.includes('جامعة') || 
    t.includes('مدرسة') || 
    t.includes('كتاب') || 
    t.includes('امتحان') || 
    t.includes('اختبار') || 
    t.includes('واجب') || 
    t.includes('كورس') || 
    t.includes('استرجاع') || 
    t.includes('study') || 
    t.includes('exam') || 
    t.includes('lecture')
  ) {
    return { id: 'study', name: 'دراسة ومحاضرات', nameEn: 'Study & Academic', isExcludedFromStrength: false };
  }

  // Work & Dev & Code
  if (
    t.includes('برمجة') || 
    t.includes('كود') || 
    t.includes('تطوير') || 
    t.includes('مشروع') || 
    t.includes('عمل') || 
    t.includes('دوام') || 
    t.includes('وظيفة') || 
    t.includes('مكتب') || 
    t.includes('تقرير') || 
    t.includes('عميل') || 
    t.includes('code') || 
    t.includes('work') || 
    t.includes('dev')
  ) {
    return { id: 'work_dev', name: 'برمجة ومشاريع العمل', nameEn: 'Dev & Work Projects', isExcludedFromStrength: false };
  }

  // Workout & Fitness
  if (
    t.includes('رياضة') || 
    t.includes('تمرين') || 
    t.includes('جيم') || 
    t.includes('نادي') || 
    t.includes('حديد') || 
    t.includes('مشي') || 
    t.includes('جري') || 
    t.includes('سباحة') || 
    t.includes('gym') || 
    t.includes('workout') || 
    t.includes('fitness')
  ) {
    return { id: 'fitness', name: 'رياضة ولياقة بدنية', nameEn: 'Fitness & Workout', isExcludedFromStrength: false };
  }

  // Health & Nutrition
  if (
    t.includes('طبيب') || 
    t.includes('دكتور') || 
    t.includes('دواء') || 
    t.includes('علاج') || 
    t.includes('صحة') || 
    t.includes('فطور') || 
    t.includes('غداء') || 
    t.includes('عشاء') || 
    t.includes('قهوة') || 
    t.includes('وجبة')
  ) {
    return { id: 'health_nutrition', name: 'صحة وتغذية', nameEn: 'Health & Nutrition', isExcludedFromStrength: false };
  }

  // General & Routine
  return { id: 'general_routine', name: 'تنظيم ومهام عامة', nameEn: 'General Routine', isExcludedFromStrength: false };
}

function getTimeSlotBucket(timeStr: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = parseInt(timeStr.split(':')[0] || '0', 10);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 23) return 'evening';
  return 'night';
}

/**
 * Computes deep weekly analytics for any given 7-day span ending at `endDateStr`.
 */
export function analyzeWeek(endDateStr: string, lang: Language = 'ar'): WeeklyAnalysisResult {
  const allDays = loadAllDays();
  const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Current week's 7 dates (from endDateStr - 6 days up to endDateStr)
  const dateStrings: string[] = [];
  for (let i = 6; i >= 0; i--) {
    dateStrings.push(addDays(endDateStr, -i));
  }

  const startDateStr = dateStrings[0];

  // Previous week's 7 dates for comparison
  const prevDateStrings: string[] = [];
  for (let i = 13; i >= 7; i--) {
    prevDateStrings.push(addDays(endDateStr, -i));
  }

  // Gather current week day stats
  const daysStats: DayWeeklyStat[] = [];
  const categoryMap: Record<string, CategoryStat & { datesSet: Set<string>; isExcluded: boolean }> = {};

  let totalTasks = 0;
  let totalDone = 0;
  let completedDaysCount = 0;
  let weakDaysCount = 0;

  dateStrings.forEach((dStr) => {
    const record: DayRecord | undefined = allDays[dStr];
    const tasks: Task[] = record?.tasks || [];
    const activeTasks = tasks.filter((t) => t.title && t.title.trim().length > 0);

    let dayDone = 0;
    let dayNotDone = 0;
    let dayPending = 0;

    activeTasks.forEach((t) => {
      if (t.status === 'done') dayDone++;
      else if (t.status === 'not-done') dayNotDone++;
      else dayPending++;

      // Category aggregation
      const cat = classifyTaskCategory(t.title);
      if (!categoryMap[cat.id]) {
        categoryMap[cat.id] = {
          id: cat.id,
          name: cat.name,
          nameEn: cat.nameEn,
          iconName: cat.id,
          total: 0,
          done: 0,
          notDone: 0,
          pending: 0,
          percentage: 0,
          daysPresent: 0,
          isExcluded: cat.isExcludedFromStrength,
          datesSet: new Set<string>(),
          missedTimes: { morning: 0, afternoon: 0, evening: 0, night: 0 },
        };
      }

      categoryMap[cat.id].total++;
      categoryMap[cat.id].datesSet.add(dStr);

      if (t.status === 'done') {
        categoryMap[cat.id].done++;
      } else {
        if (t.status === 'not-done') {
          categoryMap[cat.id].notDone++;
        } else {
          categoryMap[cat.id].pending++;
        }
        // Track when this task was missed/pending
        const bucket = getTimeSlotBucket(t.time || '12:00');
        categoryMap[cat.id].missedTimes[bucket]++;
      }
    });

    const dayTotal = activeTasks.length;
    const dayPercentage = dayTotal > 0 ? Math.round((dayDone / dayTotal) * 100) : 0;

    totalTasks += dayTotal;
    totalDone += dayDone;

    if (dayTotal > 0) {
      if (dayPercentage >= 85) completedDaysCount++;
      if (dayPercentage < 50) weakDaysCount++;
    }

    const jsDate = parseDate(dStr);
    const dayName = lang === 'ar' ? dayNamesAr[jsDate.getDay()] : dayNamesEn[jsDate.getDay()];

    daysStats.push({
      date: dStr,
      dayName,
      total: dayTotal,
      done: dayDone,
      notDone: dayNotDone,
      pending: dayPending,
      percentage: dayPercentage,
      tasks,
    });
  });

  // Calculate overall percentage
  const overallPercentage = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  // Previous week calculation
  let prevTotalTasks = 0;
  let prevTotalDone = 0;
  prevDateStrings.forEach((dStr) => {
    const record: DayRecord | undefined = allDays[dStr];
    const tasks: Task[] = record?.tasks || [];
    const active = tasks.filter((t) => t.title && t.title.trim().length > 0);
    active.forEach((t) => {
      prevTotalTasks++;
      if (t.status === 'done') prevTotalDone++;
    });
  });

  const previousWeekPercentage = prevTotalTasks > 0 ? Math.round((prevTotalDone / prevTotalTasks) * 100) : overallPercentage;
  const diffFromLastWeek = overallPercentage - previousWeekPercentage;

  // Finalize categories list
  const categoryList: CategoryStat[] = Object.values(categoryMap).map((c) => ({
    id: c.id,
    name: c.name,
    nameEn: c.nameEn,
    iconName: c.iconName,
    total: c.total,
    done: c.done,
    notDone: c.notDone,
    pending: c.pending,
    percentage: c.total > 0 ? Math.round((c.done / c.total) * 100) : 0,
    daysPresent: c.datesSet.size,
    missedTimes: c.missedTimes,
  }));

  // Sort categories by percentage descending
  categoryList.sort((a, b) => b.percentage - a.percentage);

  // Eligible categories for Top Strength & Weakness:
  // 1. Exclude 'sleep_rest'
  // 2. Minimum 3 days frequency
  // 3. Minimum 3 total occurrences
  const eligibleCategories = categoryList.filter(
    (c) => c.id !== 'sleep_rest' && c.daysPresent >= 3 && c.total >= 3
  );

  let topStrength: CategoryStat | null = null;
  let topWeakness: CategoryStat | null = null;

  if (eligibleCategories.length > 0) {
    // Highest percentage
    topStrength = eligibleCategories[0];

    // Lowest percentage (must have at least one not-done or lower score than top)
    const sortedAsc = [...eligibleCategories].sort((a, b) => a.percentage - b.percentage);
    if (sortedAsc.length > 1 && sortedAsc[0].percentage < topStrength.percentage) {
      topWeakness = sortedAsc[0];
    } else if (sortedAsc.length === 1 && sortedAsc[0].percentage < 80) {
      topWeakness = sortedAsc[0];
    }
  }

  // Areas to improve: categories with 35% <= percentage <= 70% or lowest performers
  const improvementCandidates = eligibleCategories.filter(
    (c) => c.id !== topStrength?.id && c.percentage <= 75
  );

  // Generate actionable advice based on calculated missed times
  const improvements: ImprovementArea[] = improvementCandidates.slice(0, 3).map((c) => {
    const misses = c.missedTimes;
    let peakMissBucket: 'morning' | 'afternoon' | 'evening' | 'night' = 'evening';
    let maxMiss = -1;

    (Object.entries(misses) as [keyof typeof misses, number][]).forEach(([bucket, count]) => {
      if (count > maxMiss) {
        maxMiss = count;
        peakMissBucket = bucket;
      }
    });

    let advice = 'احرص على تثبيت موعدها وتخفيف المهام المتزامنة لرفع معدل إنجازها.';
    let adviceEn = 'Consider fixing its slot and reducing overlapping tasks to improve completion.';

    if (peakMissBucket === 'morning') {
      advice = 'لاحظنا أن أغلب التفويت يحدث في الفترة الصباحية، جرب وضعها بعد صلاة الفجر مباشرة أو تجهيز متطلباتها من الليلة السابقة.';
      adviceEn = 'Most misses happen in the morning. Try scheduling right after dawn or preparing prerequisites the night before.';
    } else if (peakMissBucket === 'afternoon') {
      advice = 'يحدث التأجيل عادة في فترة الظهيرة؛ جرّب جدولتها قبل استراحة الغداء أو بعد العصر مباشرة لتفادي فترات الخمول.';
      adviceEn = 'Delays concentrate around noon; try scheduling right before lunch or after afternoon prayers.';
    } else if (peakMissBucket === 'evening') {
      advice = 'تتركز فترات عدم الإنجاز في المساء؛ نقترح تقديم موعدها ساعتين قبل التعب المسائي أو تقسيمها إلى جلسة مركزة مدتها 30 دقيقة.';
      adviceEn = 'Misses peak in the evening. Consider moving 2 hours earlier or splitting into a focused 30-minute block.';
    } else if (peakMissBucket === 'night') {
      advice = 'التفويت يتكرر في ساعات الليل المتأخرة؛ النوم المبكر ونقل المهمة إلى النهار سيضمن إتمامها دون إرهاق.';
      adviceEn = 'Misses occur late at night. Earlier rest and moving it to daytime will ensure consistent completion.';
    }

    return {
      id: c.id,
      name: lang === 'ar' ? c.name : c.nameEn,
      percentage: c.percentage,
      done: c.done,
      total: c.total,
      daysPresent: c.daysPresent,
      advice,
      adviceEn,
    };
  });

  // Range label e.g. "17 سبتمبر - 23 سبتمبر"
  const startFormatted = formatDate(startDateStr, lang);
  const endFormatted = formatDate(endDateStr, lang);
  const rangeLabel = `${startFormatted} — ${endFormatted}`;

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    rangeLabel,
    days: daysStats,
    overallPercentage,
    previousWeekPercentage,
    diffFromLastWeek,
    completedDaysCount,
    weakDaysCount,
    topStrength,
    topWeakness,
    improvements,
    categories: categoryList,
    totalTasksCount: totalTasks,
    totalDoneCount: totalDone,
  };
}
