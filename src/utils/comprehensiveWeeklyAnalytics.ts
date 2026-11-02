import { DayRecord, Language, Task, PlannerCategory, RecurringItem } from '../types';
import { addDays, formatDate, parseDate, formatTime12h, getTodayDateString } from './date';
import { loadAllDays } from './storage';
import { userStorage } from './scopedStorage';
import { partitionPrayerTasks } from './prayerTasks';
import { loadStoredRecurringItems } from './recurring';
import {
  getStoredMorningCounts,
  isStoredMorningConfirmed,
  getStoredEveningCounts,
  isStoredEveningConfirmed,
  getStoredQuranCompleted,
  getStoredDuasCompleted,
  isMorningAdhkarTask,
  isEveningAdhkarTask,
  isQuranWirdTask,
  isDuasTask,
} from './dailyProgress';
import { AZKAR_SABAH } from '../data/azkarSabah';
import { AZKAR_MASAA } from '../data/azkarMasaa';

export type WeekStartDay = 'saturday' | 'sunday' | 'monday';

export interface PrayerDayStatus {
  date: string;
  dayName: string;
  fajr: 'done' | 'not-done' | 'pending';
  dhuhr: 'done' | 'not-done' | 'pending';
  asr: 'done' | 'not-done' | 'pending';
  maghrib: 'done' | 'not-done' | 'pending';
  isha: 'done' | 'not-done' | 'pending';
  completedCount: number;
  allDone: boolean;
}

export interface DayActivityItem {
  id: string;
  title: string;
  time: string;
  endTime?: string;
  durationMinutes: number;
  category: string;
  categoryId?: string;
  categoryName: string;
  status: 'done' | 'not-done' | 'pending';
  notes?: string;
  quantityLabel?: string;
}

export interface DayOverview {
  date: string;
  dayName: string;
  dayShortDate: string;
  isToday: boolean;
  totalTasks: number;
  doneTasks: number;
  pendingTasks: number;
  notDoneTasks: number;
  completionRate: number;
  prayersDone: number;
  quranPagesRead: number;
  studyDurationMinutes: number;
  lecturesCount: number;
  bookPagesRead: number;
  totalDurationMinutes: number;
  statusQuality: 'excellent' | 'good' | 'low' | 'empty';
  statusLabel: string;
  activities: DayActivityItem[];
}

export interface CategorySummary {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  totalTasks: number;
  doneTasks: number;
  pendingTasks: number;
  notDoneTasks: number;
  completionRate: number;
  durationMinutes: number;
  daysPresent: number;
}

export interface BookReadingEntry {
  title: string;
  pagesRead: number;
  sessionsCount: number;
  durationMinutes: number;
  days: string[];
}

export interface LectureEntry {
  id: string;
  title: string;
  date: string;
  dayName: string;
  time?: string;
  durationMinutes: number;
  status: 'done' | 'not-done' | 'pending';
}

export interface HabitWeeklyPerformance {
  id: string;
  title: string;
  currentStreak: number;
  bestStreak: number;
  daysCompletedThisWeek: number;
  completionHistoryThisWeek: Record<string, boolean>;
  targetDaysCount: number;
}

export interface HeatmapCell {
  hour: number;
  date: string;
  dayName: string;
  tasks: Task[];
  hasActivity: boolean;
  intensity: number; // 0 to 4
  doneCount: number;
  pendingCount: number;
  notDoneCount: number;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'prayer' | 'quran' | 'study' | 'productivity' | 'streak';
  unlocked: boolean;
  metricValue?: string;
}

export interface ActionableRecommendation {
  id: string;
  title: string;
  reason: string;
  suggestedStep: string;
  expectedBenefit: string;
  actionType: 'reschedule' | 'study_split' | 'reading_target' | 'habit_protect';
}

export interface WeeklyLifeDashboardData {
  // Section 01: Range & Header
  startDate: string;
  endDate: string;
  rangeLabel: string;
  isCurrentWeek: boolean;
  isCompletedWeek: boolean;
  weekStartDay: WeekStartDay;

  // Section 02: 8 KPIs
  kpis: {
    prayers: {
      done: number;
      expected: number;
      percentage: number;
      daysAllCompleted: number;
      diffFromLastWeek: number;
      sunnahCount: number;
    };
    quran: {
      totalPages: number;
      sessionsCount: number;
      daysRead: number;
      averagePagesPerSession: number;
      weeklyTarget: number;
      targetPercentage: number;
      diffFromLastWeek: number;
    };
    books: {
      totalPages: number;
      sessionsCount: number;
      durationMinutes: number;
      titles: string[];
      entries: BookReadingEntry[];
    };
    lectures: {
      totalCount: number;
      completedCount: number;
      durationMinutes: number;
      entries: LectureEntry[];
      percentage: number;
    };
    study: {
      durationMinutes: number;
      sessionsCount: number;
      topicsCount: number;
      diffFromLastWeek: number;
    };
    tasks: {
      total: number;
      done: number;
      pending: number;
      notDone: number;
      percentage: number;
      diffFromLastWeek: number;
    };
    habits: {
      totalCompletions: number;
      daysWithHabit: number;
      bestStreak: number;
      mostConsistentHabitName: string;
      items: HabitWeeklyPerformance[];
    };
    activity: {
      activeDaysCount: number;
      totalEventsRecorded: number;
      totalDurationMinutes: number;
      diffDurationMinutes: number;
      diffEventsCount: number;
    };
  };

  // Section 03: The Story of My Week (7 days)
  days: DayOverview[];

  // Section 04: Detailed Categories
  prayerMatrix: {
    days: PrayerDayStatus[];
    totalDone: number;
    totalExpected: number;
    missedCount: number;
    mostConsistentPrayer: { name: string; count: number };
    leastConsistentPrayer: { name: string; count: number };
    daysWithAllFive: number;
    morningAdhkarDoneDays: number;
    eveningAdhkarDoneDays: number;
    duasDoneDays: number;
  };
  quranDetail: {
    totalPages: number;
    dailyPages: { date: string; dayName: string; pages: number }[];
    readingDaysCount: number;
    restDaysCount: number;
    avgPagesPerReadingDay: number;
    estimatedKhatmahProgressPercent: number;
  };
  booksDetail: {
    entries: BookReadingEntry[];
    totalPages: number;
    totalDurationMinutes: number;
  };
  lecturesDetail: {
    entries: LectureEntry[];
    totalHours: number;
    completionRate: number;
  };
  customCategoriesDetail: CategorySummary[];

  // Section 05: Weekly Activity Timeline Heatmap
  heatmap: {
    days: {
      date: string;
      dayName: string;
      hours: HeatmapCell[];
    }[];
    peakActiveTimeRange: string;
    totalTimedTasksCount: number;
  };

  // Section 06: Weekly Performance Analytics
  performanceChart: {
    days: {
      date: string;
      dayName: string;
      total: number;
      done: number;
      notDone: number;
      pending: number;
      percentage: number;
      quality: 'excellent' | 'good' | 'low' | 'empty';
    }[];
    averageDailyTasks: number;
    bestDayName: string;
  };

  // Section 07: Where Did My Time Go?
  timeAudit: {
    totalMinutes: number;
    breakdown: {
      id: string;
      name: string;
      nameEn: string;
      color: string;
      minutes: number;
      hoursFormatted: string;
      percentage: number;
    }[];
  };

  // Section 08: Weekly Comparison
  comparison: {
    current: {
      completionRate: number;
      prayersDone: number;
      quranPages: number;
      bookPages: number;
      lectureHours: number;
      studyHours: number;
      habitCompletions: number;
      totalActivities: number;
    };
    previous: {
      completionRate: number;
      prayersDone: number;
      quranPages: number;
      bookPages: number;
      lectureHours: number;
      studyHours: number;
      habitCompletions: number;
      totalActivities: number;
    };
    diffs: {
      completionRate: { diff: number; trend: 'up' | 'down' | 'same' };
      prayersDone: { diff: number; trend: 'up' | 'down' | 'same' };
      quranPages: { diff: number; trend: 'up' | 'down' | 'same' };
      bookPages: { diff: number; trend: 'up' | 'down' | 'same' };
      lectureHours: { diff: number; trend: 'up' | 'down' | 'same' };
      studyHours: { diff: number; trend: 'up' | 'down' | 'same' };
      habitCompletions: { diff: number; trend: 'up' | 'down' | 'same' };
      totalActivities: { diff: number; trend: 'up' | 'down' | 'same' };
    };
  };

  // Section 09: Smart Insights
  insights: {
    topStrength: {
      title: string;
      metric: string;
      explanation: string;
    } | null;
    topWeakness: {
      title: string;
      metric: string;
      explanation: string;
    } | null;
    mostProductiveDay: {
      dayName: string;
      date: string;
      doneCount: number;
      percentage: number;
    };
    topHabit: {
      title: string;
      streak: number;
      daysDone: number;
    } | null;
    biggestChange: {
      label: string;
      diffText: string;
      trend: 'up' | 'down';
    } | null;
    narrativeParagraph: string;
  };

  // Section 10: Weekly Achievements
  achievements: AchievementBadge[];

  // Section 11: Unfinished Business
  unfinishedTasks: {
    id: string;
    title: string;
    date: string;
    dayName: string;
    category: string;
    status: 'not-done' | 'pending';
    notDoneReason?: string;
  }[];

  // Section 12: Actionable Recommendations
  recommendations: ActionableRecommendation[];

  // Section 13: Closing Summary
  closing: {
    summaryText: string;
    topHighlight: string;
    growthOpportunity: string;
    encouragingMessage: string;
  };
}

// -------------------------------------------------------------
// HELPER FUNCTIONS FOR TEXT EXTRACTION & CLASSIFICATION
// -------------------------------------------------------------

function parseTaskQuantity(title: string): string | undefined {
  if (!title) return undefined;
  const t = title.trim();

  // Pages match: e.g. "10 صفحات", "5 ص", "20 صفحة"
  const pagesMatch = t.match(/(\d+)\s*(صفحات|صفحة|ص\b)/);
  if (pagesMatch) {
    return `${pagesMatch[1]} صفحة`;
  }

  // Minutes / Hours match: e.g. "45 دقيقة", "ساعتين", "ساعة"
  if (t.includes('ساعتين') || t.includes('ساعتان')) return 'ساعتان';
  if (t.includes('ساعة ونصف')) return 'ساعة ونصف';
  if (t.includes('ساعة')) return 'ساعة واحدة';
  const minMatch = t.match(/(\d+)\s*(دقيقة|دقائق)/);
  if (minMatch) {
    return `${minMatch[1]} دقيقة`;
  }

  return undefined;
}

function parseTaskDurationMinutes(task: Task): number {
  if (typeof task.duration === 'number' && task.duration > 0) {
    return task.duration;
  }

  if (task.time && task.endTime) {
    const [sh, sm] = task.time.split(':').map(Number);
    const [eh, em] = task.endTime.split(':').map(Number);
    if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) return diff;
    }
  }

  const title = (task.title || '').toLowerCase();
  if (title.includes('ساعتين') || title.includes('ساعتان')) return 120;
  if (title.includes('ساعة ونصف')) return 90;
  if (title.includes('ساعة') && !title.includes('ساعات')) return 60;
  const minMatch = title.match(/(\d+)\s*(دقيقة|دقائق)/);
  if (minMatch) {
    const m = parseInt(minMatch[1], 10);
    if (!isNaN(m) && m > 0) return m;
  }
  const hourMatch = title.match(/(\d+)\s*(ساعات|ساعة)/);
  if (hourMatch) {
    const h = parseInt(hourMatch[1], 10);
    if (!isNaN(h) && h > 0) return h * 60;
  }

  // Default duration by common activity type
  if (isQuranWirdTask(title)) return 20;
  if (title.includes('صلاة') || title.includes('فجر') || title.includes('ظهر') || title.includes('عصر') || title.includes('مغرب') || title.includes('عشاء')) return 15;
  if (title.includes('محاضرة') || title.includes('lecture')) return 60;
  if (title.includes('قراءة') || title.includes('كتاب')) return 30;
  if (title.includes('دراسة') || title.includes('مذاكرة')) return 45;
  if (title.includes('رياضة') || title.includes('جيم')) return 45;

  return 0;
}

function extractBookTitle(title: string): string | undefined {
  const t = title.trim();
  const bookMatch = t.match(/كتاب\s+([^\d\(\)\-–،]+)/);
  if (bookMatch && bookMatch[1].trim().length > 2) {
    return `كتاب ${bookMatch[1].trim()}`;
  }
  if (t.includes('قراءة') && t.length < 50) {
    return t;
  }
  return undefined;
}

function extractPagesFromTitle(title: string): number {
  const match = title.match(/(\d+)\s*(صفحات|صفحة|ص\b)/);
  if (match) {
    const p = parseInt(match[1], 10);
    if (!isNaN(p) && p > 0 && p < 1000) return p;
  }
  return 0;
}

// -------------------------------------------------------------
// COMPUTE 7 DATES BASED ON WEEK START PREFERENCE
// -------------------------------------------------------------

export function getWeekDateRange(referenceDate: string, startDay: WeekStartDay = 'saturday'): {
  startDate: string;
  endDate: string;
  dates: string[];
} {
  const ref = parseDate(referenceDate);
  const dayOfWeek = ref.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  let targetStartDayIndex = 6; // Saturday by default for Arab world
  if (startDay === 'sunday') targetStartDayIndex = 0;
  if (startDay === 'monday') targetStartDayIndex = 1;

  // Calculate days back to start of week
  const diffToStart = (dayOfWeek - targetStartDayIndex + 7) % 7;
  const startDate = addDays(referenceDate, -diffToStart);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(startDate, i));
  }

  return {
    startDate,
    endDate: dates[6],
    dates,
  };
}

// -------------------------------------------------------------
// MAIN COMPREHENSIVE ANALYTICS ENGINE
// -------------------------------------------------------------

export function computeComprehensiveWeeklyReview(
  referenceDate: string,
  lang: Language = 'ar',
  preferredWeekStart?: WeekStartDay
): WeeklyLifeDashboardData {
  const ar = lang === 'ar';
  const allDays = loadAllDays();
  const todayStr = getTodayDateString();

  // Determine week start preference
  const weekStartDay: WeekStartDay = preferredWeekStart || (userStorage.getItem('week_start') as WeekStartDay) || 'saturday';

  const { startDate, endDate, dates } = getWeekDateRange(referenceDate, weekStartDay);

  // Previous week's dates
  const prevStartDate = addDays(startDate, -7);
  const prevDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    prevDates.push(addDays(prevStartDate, i));
  }

  // Week Status
  const isCurrentWeek = dates.includes(todayStr);
  const isCompletedWeek = endDate < todayStr;

  // Day names dictionary
  const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // -----------------------------------------------------------
  // PROCESS CURRENT WEEK DAYS
  // -----------------------------------------------------------
  const dayOverviews: DayOverview[] = [];
  const prayerDayStatuses: PrayerDayStatus[] = [];
  const bookEntriesMap: Map<string, BookReadingEntry> = new Map();
  const lectureEntries: LectureEntry[] = [];
  const categoryAggregationMap: Map<string, { total: number; done: number; pending: number; notDone: number; duration: number; days: Set<string>; name: string; nameEn: string; icon: string }> = new Map();
  const unfinishedTasksList: WeeklyLifeDashboardData['unfinishedTasks'] = [];

  let weekTotalTasks = 0;
  let weekDoneTasks = 0;
  let weekPendingTasks = 0;
  let weekNotDoneTasks = 0;
  let weekTotalDuration = 0;
  let weekActiveDaysCount = 0;
  let weekStudyDuration = 0;
  let weekStudySessions = 0;
  let weekQuranTotalPages = 0;
  let weekQuranSessions = 0;
  let weekQuranDaysCount = 0;
  let weekBooksTotalPages = 0;
  let weekBooksSessions = 0;
  let weekBooksDuration = 0;
  let weekPrayersDoneTotal = 0;
  let weekSunnahCount = 0;
  let weekDaysAllPrayers = 0;
  let morningAdhkarDoneDays = 0;
  let eveningAdhkarDoneDays = 0;
  let duasDoneDays = 0;

  const prayerCounts: Record<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', number> = {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  };

  const heatmapMatrix: {
    date: string;
    dayName: string;
    hours: HeatmapCell[];
  }[] = [];

  const hourActivityHistogram: number[] = new Array(24).fill(0);

  dates.forEach((dateStr) => {
    const record: DayRecord | undefined = allDays[dateStr];
    const tasks: Task[] = (record?.tasks || []).filter((t) => t.title && t.title.trim().length > 0);
    const dayDate = parseDate(dateStr);
    const dayIndex = dayDate.getDay();
    const dayName = ar ? dayNamesAr[dayIndex] : dayNamesEn[dayIndex];
    const dayShortDate = `${dateStr.slice(8)}/${dateStr.slice(5, 7)}`;
    const isToday = dateStr === todayStr;

    let dayDone = 0;
    let dayPending = 0;
    let dayNotDone = 0;
    let dayDuration = 0;
    let dayStudyDuration = 0;
    let dayLecturesCount = 0;
    let dayBookPages = 0;

    // Religious checks
    const quranCompletedInStorage = getStoredQuranCompleted(dateStr);
    const morningConfirmed = isStoredMorningConfirmed(dateStr);
    const eveningConfirmed = isStoredEveningConfirmed(dateStr);
    const duasCompleted = getStoredDuasCompleted(dateStr).completed;

    if (morningConfirmed) morningAdhkarDoneDays++;
    if (eveningConfirmed) eveningAdhkarDoneDays++;
    if (duasCompleted) duasDoneDays++;

    // Calculate prayer partitions for this day
    const prayers = partitionPrayerTasks(tasks);
    let dayPrayersDone = 0;
    const prayerStatusObj: PrayerDayStatus = {
      date: dateStr,
      dayName,
      fajr: 'pending',
      dhuhr: 'pending',
      asr: 'pending',
      maghrib: 'pending',
      isha: 'pending',
      completedCount: 0,
      allDone: false,
    };

    prayers.slots.forEach((slot) => {
      const pid = slot.prayer.id;
      if (slot.task) {
        prayerStatusObj[pid] = slot.task.status;
        if (slot.task.status === 'done') {
          dayPrayersDone++;
          prayerCounts[pid]++;
        }
      } else {
        // If date is before today and not tracked, mark as not-done/unrecorded
        prayerStatusObj[pid] = dateStr < todayStr ? 'not-done' : 'pending';
      }
    });

    prayerStatusObj.completedCount = dayPrayersDone;
    prayerStatusObj.allDone = dayPrayersDone === 5;
    if (prayerStatusObj.allDone) weekDaysAllPrayers++;
    weekPrayersDoneTotal += dayPrayersDone;
    prayerDayStatuses.push(prayerStatusObj);

    // Quran pages tracking for this day
    let dayQuranPages = 0;
    const rawSavedPage = userStorage.getItem(`islambook_quran_wird_page_${dateStr}`);
    if (rawSavedPage) {
      const p = parseInt(rawSavedPage, 10);
      if (!isNaN(p) && p > 0) dayQuranPages = Math.min(p, 20); // normalized reading
    }
    if (dayQuranPages === 0 && quranCompletedInStorage) {
      dayQuranPages = 4; // standard default wird
    }

    // Process tasks
    const dayActivities: DayActivityItem[] = [];

    tasks.forEach((t) => {
      if (t.status === 'done') dayDone++;
      else if (t.status === 'not-done') dayNotDone++;
      else dayPending++;

      const dur = parseTaskDurationMinutes(t);
      dayDuration += dur;
      const lower = t.title.toLowerCase();

      // Check Sunnah prayers & extra acts
      if (lower.includes('سنة') || lower.includes('ضحى') || lower.includes('قيام') || lower.includes('وتر') || lower.includes('تراويح')) {
        if (t.status === 'done') weekSunnahCount++;
      }

      // Check Quran tasks
      if (isQuranWirdTask(t.title)) {
        const pagesInTitle = extractPagesFromTitle(t.title);
        if (pagesInTitle > 0) {
          dayQuranPages = Math.max(dayQuranPages, pagesInTitle);
        }
        if (t.status === 'done') {
          weekQuranSessions++;
        }
      }

      // Check Book Reading tasks
      const isBook = (lower.includes('كتاب') || lower.includes('قراءة') || lower.includes('رواية') || lower.includes('book')) && !isQuranWirdTask(t.title);
      if (isBook) {
        const pages = extractPagesFromTitle(t.title) || 10;
        dayBookPages += pages;
        if (t.status === 'done') {
          weekBooksSessions++;
          weekBooksTotalPages += pages;
          weekBooksDuration += dur;
        }
        const bookTitle = extractBookTitle(t.title) || (ar ? 'قراءة كتب متنوعة' : 'General Reading');
        const existingBook = bookEntriesMap.get(bookTitle) || {
          title: bookTitle,
          pagesRead: 0,
          sessionsCount: 0,
          durationMinutes: 0,
          days: [],
        };
        existingBook.pagesRead += pages;
        existingBook.sessionsCount++;
        existingBook.durationMinutes += dur;
        if (!existingBook.days.includes(dateStr)) existingBook.days.push(dateStr);
        bookEntriesMap.set(bookTitle, existingBook);
      }

      // Check Lectures
      const isLecture = lower.includes('محاضرة') || lower.includes('درس') || lower.includes('كورس') || lower.includes('دورة') || lower.includes('lecture') || lower.includes('course');
      if (isLecture) {
        dayLecturesCount++;
        lectureEntries.push({
          id: t.id,
          title: t.title,
          date: dateStr,
          dayName,
          time: t.time || undefined,
          durationMinutes: dur || 60,
          status: t.status,
        });
      }

      // Check Study
      const isStudy = (lower.includes('دراسة') || lower.includes('مذاكرة') || lower.includes('امتحان') || lower.includes('واجب') || lower.includes('study') || lower.includes('exam')) || t.category === 'study';
      if (isStudy) {
        dayStudyDuration += dur;
        if (t.status === 'done') {
          weekStudySessions++;
          weekStudyDuration += dur;
        }
      }

      // Unfinished tasks
      if (t.status === 'not-done' || t.status === 'pending') {
        unfinishedTasksList.push({
          id: t.id,
          title: t.title,
          date: dateStr,
          dayName,
          category: t.category || 'general',
          status: t.status,
          notDoneReason: t.notDoneReason,
        });
      }

      // Category breakdown aggregation
      const catKey = t.category || (t.categoryId ? `custom_${t.categoryId}` : 'general');
      const catName = t.category === 'worship' ? (ar ? 'العبادات والصلوات' : 'Worship & Prayers')
        : t.category === 'study' ? (ar ? 'الدراسة والتعليم' : 'Study & Learning')
        : t.category === 'work' ? (ar ? 'العمل والمشاريع' : 'Work & Projects')
        : t.category === 'health' ? (ar ? 'الصحة والرياضة' : 'Health & Fitness')
        : t.category === 'rest' ? (ar ? 'الراحة والاسترخاء' : 'Rest & Break')
        : (ar ? 'المهام العامة' : 'General Tasks');

      const existingCat = categoryAggregationMap.get(catKey) || {
        total: 0,
        done: 0,
        pending: 0,
        notDone: 0,
        duration: 0,
        days: new Set<string>(),
        name: catName,
        nameEn: catKey,
        icon: catKey,
      };
      existingCat.total++;
      if (t.status === 'done') existingCat.done++;
      else if (t.status === 'not-done') existingCat.notDone++;
      else existingCat.pending++;
      existingCat.duration += dur;
      existingCat.days.add(dateStr);
      categoryAggregationMap.set(catKey, existingCat);

      // Hourly distribution
      if (t.time) {
        const hour = parseInt(t.time.split(':')[0], 10);
        if (!isNaN(hour) && hour >= 0 && hour < 24) {
          hourActivityHistogram[hour]++;
        }
      }

      // Activity entry for daily log
      dayActivities.push({
        id: t.id,
        title: t.title,
        time: t.time || '',
        endTime: t.endTime,
        durationMinutes: dur,
        category: t.category || 'general',
        categoryId: t.categoryId,
        categoryName: catName,
        status: t.status,
        notes: t.notes || t.notDoneReason,
        quantityLabel: parseTaskQuantity(t.title),
      });
    });

    if (dayQuranPages > 0) {
      weekQuranTotalPages += dayQuranPages;
      weekQuranDaysCount++;
    }

    const dayTotal = tasks.length;
    const dayRate = dayTotal > 0 ? Math.round((dayDone / dayTotal) * 100) : 0;

    let dayQuality: 'excellent' | 'good' | 'low' | 'empty' = 'empty';
    let statusLabel = ar ? 'لا توجد بيانات' : 'No data';
    if (dayTotal > 0) {
      if (dayRate >= 80) {
        dayQuality = 'excellent';
        statusLabel = ar ? 'يوم ممتاز' : 'Excellent day';
      } else if (dayRate >= 50) {
        dayQuality = 'good';
        statusLabel = ar ? 'يوم متوسط' : 'Good day';
      } else {
        dayQuality = 'low';
        statusLabel = ar ? 'نشاط منخفض' : 'Low activity';
      }
    }

    if (dayTotal > 0 || dayQuranPages > 0 || dayPrayersDone > 0) {
      weekActiveDaysCount++;
    }

    // Sort activities by time
    dayActivities.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });

    dayOverviews.push({
      date: dateStr,
      dayName,
      dayShortDate,
      isToday,
      totalTasks: dayTotal,
      doneTasks: dayDone,
      pendingTasks: dayPending,
      notDoneTasks: dayNotDone,
      completionRate: dayRate,
      prayersDone: dayPrayersDone,
      quranPagesRead: dayQuranPages,
      studyDurationMinutes: dayStudyDuration,
      lecturesCount: dayLecturesCount,
      bookPagesRead: dayBookPages,
      totalDurationMinutes: dayDuration,
      statusQuality: dayQuality,
      statusLabel,
      activities: dayActivities,
    });

    weekTotalTasks += dayTotal;
    weekDoneTasks += dayDone;
    weekPendingTasks += dayPending;
    weekNotDoneTasks += dayNotDone;
    weekTotalDuration += dayDuration;

    // Build Heatmap row
    const hourCells: HeatmapCell[] = [];
    for (let h = 0; h < 24; h++) {
      const hStr = String(h).padStart(2, '0');
      const hourTasks = tasks.filter((t) => t.time && t.time.startsWith(hStr));
      const hDone = hourTasks.filter((t) => t.status === 'done').length;
      const hNotDone = hourTasks.filter((t) => t.status === 'not-done').length;
      const hPending = hourTasks.filter((t) => t.status === 'pending').length;
      let intensity = 0;
      if (hourTasks.length > 0) {
        if (hDone === hourTasks.length) intensity = 4;
        else if (hDone > 0) intensity = 3;
        else if (hPending > 0) intensity = 2;
        else intensity = 1;
      }
      hourCells.push({
        hour: h,
        date: dateStr,
        dayName,
        tasks: hourTasks,
        hasActivity: hourTasks.length > 0,
        intensity,
        doneCount: hDone,
        pendingCount: hPending,
        notDoneCount: hNotDone,
      });
    }
    heatmapMatrix.push({
      date: dateStr,
      dayName,
      hours: hourCells,
    });
  });

  // Calculate Peak active hours
  let maxHourIndex = 9;
  let maxHourVal = -1;
  for (let h = 5; h < 23; h++) {
    const combined = (hourActivityHistogram[h] || 0) + (hourActivityHistogram[h + 1] || 0);
    if (combined > maxHourVal) {
      maxHourVal = combined;
      maxHourIndex = h;
    }
  }
  const peakStart = `${String(maxHourIndex).padStart(2, '0')}:00`;
  const peakEnd = `${String(Math.min(maxHourIndex + 2, 23)).padStart(2, '0')}:00`;
  const peakTimeRange = ar
    ? `بين الساعة ${formatTime12h(peakStart, lang).formatted} والساعة ${formatTime12h(peakEnd, lang).formatted}`
    : `Between ${formatTime12h(peakStart, lang).formatted} and ${formatTime12h(peakEnd, lang).formatted}`;

  // -----------------------------------------------------------
  // PROCESS PREVIOUS WEEK (FOR COMPARISON)
  // -----------------------------------------------------------
  let prevTotalTasks = 0;
  let prevDoneTasks = 0;
  let prevPrayersDone = 0;
  let prevQuranPages = 0;
  let prevBookPages = 0;
  let prevLectureMinutes = 0;
  let prevStudyMinutes = 0;
  let prevHabitsCompletions = 0;
  let prevTotalDuration = 0;
  let prevTotalActivities = 0;

  prevDates.forEach((pDate) => {
    const rec = allDays[pDate];
    const tasks = rec?.tasks || [];
    prevTotalTasks += tasks.length;
    prevTotalActivities += tasks.length;
    tasks.forEach((t) => {
      if (t.status === 'done') prevDoneTasks++;
      const dur = parseTaskDurationMinutes(t);
      prevTotalDuration += dur;
      const lower = t.title.toLowerCase();
      if (t.status === 'done') {
        if (lower.includes('محاضرة') || lower.includes('lecture')) prevLectureMinutes += dur || 60;
        if (lower.includes('دراسة') || lower.includes('مذاكرة') || t.category === 'study') prevStudyMinutes += dur || 45;
        if (lower.includes('كتاب') || lower.includes('قراءة')) prevBookPages += extractPagesFromTitle(t.title) || 10;
        if (isQuranWirdTask(t.title)) prevQuranPages += extractPagesFromTitle(t.title) || 4;
      }
    });

    const prayers = partitionPrayerTasks(tasks);
    prayers.slots.forEach((s) => {
      if (s.task?.status === 'done') prevPrayersDone++;
    });
    if (getStoredQuranCompleted(pDate)) prevQuranPages += 4;
  });

  const prevCompletionRate = prevTotalTasks > 0 ? Math.round((prevDoneTasks / prevTotalTasks) * 100) : 0;
  const currentCompletionRate = weekTotalTasks > 0 ? Math.round((weekDoneTasks / weekTotalTasks) * 100) : 0;

  // -----------------------------------------------------------
  // PROCESS HABITS (RECURRING ITEMS)
  // -----------------------------------------------------------
  const recurringItems: RecurringItem[] = loadStoredRecurringItems();
  const habitPerformances: HabitWeeklyPerformance[] = [];
  let weekHabitCompletions = 0;
  let mostConsistentHabitTitle = ar ? 'لا توجد عادات مسجلة' : 'No habits tracked';
  let maxHabitDays = 0;

  recurringItems.forEach((item) => {
    const history = item.completionHistory || {};
    let daysDone = 0;
    const weekHistoryMap: Record<string, boolean> = {};

    dates.forEach((d) => {
      const isDone = Boolean(history[d]);
      weekHistoryMap[d] = isDone;
      if (isDone) {
        daysDone++;
        weekHabitCompletions++;
      }
    });

    if (daysDone > maxHabitDays) {
      maxHabitDays = daysDone;
      mostConsistentHabitTitle = item.title;
    }

    habitPerformances.push({
      id: item.id,
      title: item.title,
      currentStreak: item.currentStreak || daysDone,
      bestStreak: Math.max(item.bestStreak || 0, daysDone),
      daysCompletedThisWeek: daysDone,
      completionHistoryThisWeek: weekHistoryMap,
      targetDaysCount: item.selectedDays ? item.selectedDays.length : 7,
    });
  });

  // Most & Least Consistent Prayers
  const prayerNameMap: Record<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', string> = {
    fajr: ar ? 'صلاة الفجر' : 'Fajr',
    dhuhr: ar ? 'صلاة الظهر' : 'Dhuhr',
    asr: ar ? 'صلاة العصر' : 'Asr',
    maghrib: ar ? 'صلاة المغرب' : 'Maghrib',
    isha: ar ? 'صلاة العشاء' : 'Isha',
  };

  const sortedPrayers = (Object.keys(prayerCounts) as ('fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha')[])
    .map((k) => ({ name: prayerNameMap[k], count: prayerCounts[k] }))
    .sort((a, b) => b.count - a.count);

  const mostConsistentPrayer = sortedPrayers[0] || { name: ar ? 'الفجر' : 'Fajr', count: 0 };
  const leastConsistentPrayer = sortedPrayers[sortedPrayers.length - 1] || { name: ar ? 'العشاء' : 'Isha', count: 0 };

  // Category summaries list
  const categorySummaries: CategorySummary[] = Array.from(categoryAggregationMap.entries()).map(([k, v]) => ({
    id: k,
    name: v.name,
    nameEn: v.nameEn,
    icon: v.icon,
    totalTasks: v.total,
    doneTasks: v.done,
    pendingTasks: v.pending,
    notDoneTasks: v.notDone,
    completionRate: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
    durationMinutes: v.duration,
    daysPresent: v.days.size,
  })).sort((a, b) => b.totalTasks - a.totalTasks);

  // Time distribution audit
  const colorsPalette = ['#00C896', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#64748b'];
  const totalAuditMinutes = Math.max(weekTotalDuration, 1);
  const timeAuditBreakdown = categorySummaries.map((cat, idx) => ({
    id: cat.id,
    name: cat.name,
    nameEn: cat.nameEn,
    color: colorsPalette[idx % colorsPalette.length],
    minutes: cat.durationMinutes,
    hoursFormatted: `${(cat.durationMinutes / 60).toFixed(1)} ${ar ? 'ساعة' : 'hrs'}`,
    percentage: Math.round((cat.durationMinutes / totalAuditMinutes) * 100),
  })).filter((c) => c.minutes > 0);

  // Comparison trends
  const makeDiff = (curr: number, prev: number) => {
    const diff = curr - prev;
    const trend: 'up' | 'down' | 'same' = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same';
    return { diff, trend };
  };

  const compDiffs = {
    completionRate: makeDiff(currentCompletionRate, prevCompletionRate),
    prayersDone: makeDiff(weekPrayersDoneTotal, prevPrayersDone),
    quranPages: makeDiff(weekQuranTotalPages, prevQuranPages),
    bookPages: makeDiff(weekBooksTotalPages, prevBookPages),
    lectureHours: makeDiff(Math.round(lectureEntries.reduce((acc, l) => acc + l.durationMinutes, 0) / 60), Math.round(prevLectureMinutes / 60)),
    studyHours: makeDiff(Math.round(weekStudyDuration / 60), Math.round(prevStudyMinutes / 60)),
    habitCompletions: makeDiff(weekHabitCompletions, prevHabitsCompletions),
    totalActivities: makeDiff(weekTotalTasks, prevTotalActivities),
  };

  // Best productive day
  let bestDay = dayOverviews[0];
  dayOverviews.forEach((d) => {
    if (d.doneTasks > (bestDay?.doneTasks || 0) || (d.doneTasks === bestDay?.doneTasks && d.completionRate > bestDay.completionRate)) {
      bestDay = d;
    }
  });

  // Top Strength & Top Weakness
  const validCategoriesForStrength = categorySummaries.filter((c) => c.totalTasks >= 2);
  const topStrengthCat = validCategoriesForStrength.length > 0
    ? [...validCategoriesForStrength].sort((a, b) => b.completionRate - a.completionRate || b.doneTasks - a.doneTasks)[0]
    : null;

  const topWeaknessCat = validCategoriesForStrength.length > 0
    ? [...validCategoriesForStrength].sort((a, b) => a.completionRate - b.completionRate || b.notDoneTasks - a.notDoneTasks)[0]
    : null;

  // Generate Narrative Review in natural Arabic
  let narrativeParagraph = '';
  if (ar) {
    const prayerRemark = weekPrayersDoneTotal >= 30
      ? 'حافظت على ثبات رائع في صلواتك وعباداتك طوال الأسبوع'
      : weekPrayersDoneTotal >= 20
        ? 'أظهرت التزاماً جيداً بالصلوات مع وجود فرصة لتعزيز صلوات الجماعة'
        : 'تحتاج الصلوات إلى أولوية أكبر في جدول يومك القادم';

    const quranRemark = weekQuranTotalPages > 0
      ? `وحققت إنجازاً طيباً بقراءة ${weekQuranTotalPages} صفحة من القرآن الكريم`
      : 'بينما ينتظر ورد القرآن الكريم عودتك المباركة';

    const bestDayRemark = bestDay && bestDay.doneTasks > 0
      ? `وكان يوم ${bestDay.dayName} هو الأكثر إنتاجية بإنجاز ${bestDay.doneTasks} مهام`
      : 'مع توزيع هادئ للأنشطة عبر الأيام';

    const recommendationRemark = topWeaknessCat && topWeaknessCat.completionRate < 60
      ? `ننصحك ببدء يومك بمهام ${topWeaknessCat.name} في وقت مبكر لتجنب تأجيلها لآخر اليوم.`
      : 'واصل الحفاظ على هذا التوازن الجميل وتثبيت عاداتك في الأسبوع القادم.';

    narrativeParagraph = `هذا الأسبوع، ${prayerRemark}، ${quranRemark}. ${bestDayRemark}. ${recommendationRemark}`;
  } else {
    narrativeParagraph = `This week, you maintained consistent progress across core areas, completing ${weekDoneTasks} tasks. ${bestDay ? `${bestDay.dayName} was your peak productivity day with ${bestDay.doneTasks} tasks finished.` : ''} Keep this momentum going into next week!`;
  }

  // -----------------------------------------------------------
  // ACHIEVEMENTS & MILESTONES
  // -----------------------------------------------------------
  const achievementsList: AchievementBadge[] = [
    {
      id: 'prayers_champion',
      title: ar ? 'حارس الصلوات' : 'Prayer Guardian',
      description: ar ? 'أتممت صلوات 5 أيام كاملة دون تفويت' : 'Completed all 5 daily prayers on at least 5 days',
      icon: 'MoonStar',
      category: 'prayer',
      unlocked: weekDaysAllPrayers >= 5,
      metricValue: `${weekDaysAllPrayers}/5 ${ar ? 'أيام' : 'days'}`,
    },
    {
      id: 'quran_wird_keeper',
      title: ar ? 'نور القرآن' : 'Quran Companion',
      description: ar ? 'التزمت بقراءة الورد القرآني في 4 أيام أو أكثر' : 'Read your Quran wird on 4 or more days',
      icon: 'BookOpen',
      category: 'quran',
      unlocked: weekQuranDaysCount >= 4,
      metricValue: `${weekQuranTotalPages} ${ar ? 'صفحة' : 'pages'}`,
    },
    {
      id: 'high_output_day',
      title: ar ? 'يوم الإنتاجية الفائقة' : 'Peak Performance Day',
      description: ar ? 'أنجزت 7 مهام أو أكثر في يوم واحد بنجاح' : 'Completed 7 or more tasks in a single day',
      icon: 'Flame',
      category: 'productivity',
      unlocked: Boolean(bestDay && bestDay.doneTasks >= 7),
      metricValue: bestDay ? `${bestDay.doneTasks} ${ar ? 'مهمة' : 'tasks'}` : undefined,
    },
    {
      id: 'habit_consistency',
      title: ar ? 'بطل العادات' : 'Habit Champion',
      description: ar ? 'حافظت على عادة متواصلة طوال أيام الأسبوع' : 'Maintained a habit throughout the week',
      icon: 'Zap',
      category: 'streak',
      unlocked: maxHabitDays >= 5,
      metricValue: `${maxHabitDays}/7 ${ar ? 'أيام' : 'days'}`,
    },
    {
      id: 'week_finisher',
      title: ar ? 'حصاد الأسبوع الذهبي' : 'Golden Harvest',
      description: ar ? 'حققت نسبة إنجاز عامة للأسبوع تتجاوز 75%' : 'Achieved an overall completion rate of 75%+',
      icon: 'Award',
      category: 'productivity',
      unlocked: currentCompletionRate >= 75,
      metricValue: `${currentCompletionRate}%`,
    },
  ];

  // -----------------------------------------------------------
  // ACTIONABLE RECOMMENDATIONS (3 Tailored Tips)
  // -----------------------------------------------------------
  const recommendationsList: ActionableRecommendation[] = [];

  if (topWeaknessCat && topWeaknessCat.completionRate < 70) {
    recommendationsList.push({
      id: 'rec_weakness',
      title: ar ? `إعادة جدولة مهام «${topWeaknessCat.name}» في أوقات الذروة` : `Prioritize ${topWeaknessCat.nameEn}`,
      reason: ar
        ? `نسبة إنجاز ${topWeaknessCat.name} بلغت ${topWeaknessCat.completionRate}% فقط مع تفويت ${topWeaknessCat.notDoneTasks + topWeaknessCat.pendingTasks} مهام.`
        : `Completion for ${topWeaknessCat.nameEn} was ${topWeaknessCat.completionRate}%.`,
      suggestedStep: ar
        ? `انقل هذه المهام إلى الفترة الصباحية (${peakStart}) حيث تكون طاقتك وتركيزك في أعلى مستوياتها.`
        : `Move these tasks to your morning peak hours (${peakStart}).`,
      expectedBenefit: ar ? 'رفع نسبة إنجاز هذه الفئة بنسبة 25%+ وحمايتها من الإرهاق المسائي.' : 'Boost completion rate by 25%+.',
      actionType: 'reschedule',
    });
  }

  if (weekStudySessions > 0 && weekStudyDuration / Math.max(weekStudySessions, 1) > 90) {
    recommendationsList.push({
      id: 'rec_study_split',
      title: ar ? 'تقسيم جلسات الدراسة إلى فترات أقصر (Pomodoro)' : 'Break down study blocks',
      reason: ar
        ? 'متوسط الجلسة الدراسية تجاوز 90 دقيقة مما يؤدي لتراجع الاستيعاب في آخر الجلسة.'
        : 'Study sessions averaged over 90 minutes.',
      suggestedStep: ar
        ? 'قسّم كل جلسة إلى 45 دقيقة دراسة تتبعها 10 دقائق استراحة حقيقية.'
        : 'Adopt 45-minute focused blocks with 10-minute breaks.',
      expectedBenefit: ar ? 'مضاعفة الاستيعاب وتجنب الإنهاك الفكري السريع.' : 'Higher focus retention without mental fatigue.',
      actionType: 'study_split',
    });
  } else {
    recommendationsList.push({
      id: 'rec_reading_target',
      title: ar ? 'تثبيت جلسة قراءة يومية 15 دقيقة قبل النوم' : 'Fixed 15-minute evening reading',
      reason: ar
        ? `أنجزت ${weekBooksTotalPages} صفحة هذا الأسبوع، وتثبيت جلسة منتظمة سيرفع هذا المعدل بسهولة.`
        : 'Consistent 15-minute daily reading compounds steadily.',
      suggestedStep: ar
        ? 'اقرأ 5-10 صفحات ثابتة بعد صلاة العشاء أو قبل إطفاء الأنوار.'
        : 'Read 5-10 pages after night prayer.',
      expectedBenefit: ar ? 'إنهاء كتاب كامل كل 2-3 أسابيع دون ضغط زمني.' : 'Complete an entire book every 2-3 weeks.',
      actionType: 'reading_target',
    });
  }

  recommendationsList.push({
    id: 'rec_habit_protect',
    title: ar ? `حماية سلسلة عادة «${mostConsistentHabitTitle}»` : 'Protect habit streak',
    reason: ar
      ? `حققت فيها استمرارية ممتازة (${maxHabitDays} أيام)، والحفاظ عليها يمنحك دافعاً قوياً لبقية الأسبوع.`
      : 'Solid habit consistency recorded this week.',
    suggestedStep: ar
      ? 'حدد لها موعداً غير قابل للتفاوض في بداية اليوم حتى تضمن تنفيذها مهما كانت مشاغلك.'
      : 'Anchor it to a fixed morning trigger.',
      expectedBenefit: ar ? 'تحويل العادة إلى سلوك تلقائي دائم مدى الحياة.' : 'Turn the habit into an effortless daily ritual.',
    actionType: 'habit_protect',
  });

  // Range Label
  const startD = parseDate(startDate);
  const endD = parseDate(endDate);
  const rangeLabel = ar
    ? `${startD.getDate()} ${dayNamesAr[startD.getDay()]} – ${endD.getDate()} ${dayNamesAr[endD.getDay()]} (${startDate} إلى ${endDate})`
    : `${startDate} to ${endDate}`;

  return {
    startDate,
    endDate,
    rangeLabel,
    isCurrentWeek,
    isCompletedWeek,
    weekStartDay,

    kpis: {
      prayers: {
        done: weekPrayersDoneTotal,
        expected: 35,
        percentage: Math.round((weekPrayersDoneTotal / 35) * 100),
        daysAllCompleted: weekDaysAllPrayers,
        diffFromLastWeek: compDiffs.prayersDone.diff,
        sunnahCount: weekSunnahCount,
      },
      quran: {
        totalPages: weekQuranTotalPages,
        sessionsCount: weekQuranSessions,
        daysRead: weekQuranDaysCount,
        averagePagesPerSession: weekQuranSessions > 0 ? Math.round((weekQuranTotalPages / weekQuranSessions) * 10) / 10 : weekQuranTotalPages,
        weeklyTarget: 30, // 30 pages standard goal
        targetPercentage: Math.min(Math.round((weekQuranTotalPages / 30) * 100), 100),
        diffFromLastWeek: compDiffs.quranPages.diff,
      },
      books: {
        totalPages: weekBooksTotalPages,
        sessionsCount: weekBooksSessions,
        durationMinutes: weekBooksDuration,
        titles: Array.from(bookEntriesMap.keys()),
        entries: Array.from(bookEntriesMap.values()),
      },
      lectures: {
        totalCount: lectureEntries.length,
        completedCount: lectureEntries.filter((l) => l.status === 'done').length,
        durationMinutes: lectureEntries.reduce((acc, l) => acc + l.durationMinutes, 0),
        entries: lectureEntries,
        percentage: lectureEntries.length > 0 ? Math.round((lectureEntries.filter((l) => l.status === 'done').length / lectureEntries.length) * 100) : 0,
      },
      study: {
        durationMinutes: weekStudyDuration,
        sessionsCount: weekStudySessions,
        topicsCount: categoryAggregationMap.get('study')?.total || 0,
        diffFromLastWeek: compDiffs.studyHours.diff,
      },
      tasks: {
        total: weekTotalTasks,
        done: weekDoneTasks,
        pending: weekPendingTasks,
        notDone: weekNotDoneTasks,
        percentage: currentCompletionRate,
        diffFromLastWeek: compDiffs.completionRate.diff,
      },
      habits: {
        totalCompletions: weekHabitCompletions,
        daysWithHabit: habitPerformances.filter((h) => h.daysCompletedThisWeek > 0).length,
        bestStreak: maxHabitDays,
        mostConsistentHabitName: mostConsistentHabitTitle,
        items: habitPerformances,
      },
      activity: {
        activeDaysCount: weekActiveDaysCount,
        totalEventsRecorded: weekTotalTasks,
        totalDurationMinutes: weekTotalDuration,
        diffDurationMinutes: weekTotalDuration - prevTotalDuration,
        diffEventsCount: weekTotalTasks - prevTotalActivities,
      },
    },

    days: dayOverviews,

    prayerMatrix: {
      days: prayerDayStatuses,
      totalDone: weekPrayersDoneTotal,
      totalExpected: 35,
      missedCount: 35 - weekPrayersDoneTotal,
      mostConsistentPrayer,
      leastConsistentPrayer,
      daysWithAllFive: weekDaysAllPrayers,
      morningAdhkarDoneDays,
      eveningAdhkarDoneDays,
      duasDoneDays,
    },

    quranDetail: {
      totalPages: weekQuranTotalPages,
      dailyPages: dayOverviews.map((d) => ({ date: d.date, dayName: d.dayName, pages: d.quranPagesRead })),
      readingDaysCount: weekQuranDaysCount,
      restDaysCount: 7 - weekQuranDaysCount,
      avgPagesPerReadingDay: weekQuranDaysCount > 0 ? Math.round((weekQuranTotalPages / weekQuranDaysCount) * 10) / 10 : 0,
      estimatedKhatmahProgressPercent: Math.round(((weekQuranTotalPages) / 604) * 100),
    },

    booksDetail: {
      entries: Array.from(bookEntriesMap.values()),
      totalPages: weekBooksTotalPages,
      totalDurationMinutes: weekBooksDuration,
    },

    lecturesDetail: {
      entries: lectureEntries,
      totalHours: Math.round((lectureEntries.reduce((acc, l) => acc + l.durationMinutes, 0) / 60) * 10) / 10,
      completionRate: lectureEntries.length > 0 ? Math.round((lectureEntries.filter((l) => l.status === 'done').length / lectureEntries.length) * 100) : 0,
    },

    customCategoriesDetail: categorySummaries,

    heatmap: {
      days: heatmapMatrix,
      peakActiveTimeRange: peakTimeRange,
      totalTimedTasksCount: dayOverviews.reduce((acc, d) => acc + d.activities.filter((a) => a.time).length, 0),
    },

    performanceChart: {
      days: dayOverviews.map((d) => ({
        date: d.date,
        dayName: d.dayName,
        total: d.totalTasks,
        done: d.doneTasks,
        notDone: d.notDoneTasks,
        pending: d.pendingTasks,
        percentage: d.completionRate,
        quality: d.statusQuality,
      })),
      averageDailyTasks: Math.round((weekTotalTasks / 7) * 10) / 10,
      bestDayName: bestDay ? bestDay.dayName : (ar ? 'الأحد' : 'Sun'),
    },

    timeAudit: {
      totalMinutes: weekTotalDuration,
      breakdown: timeAuditBreakdown,
    },

    comparison: {
      current: {
        completionRate: currentCompletionRate,
        prayersDone: weekPrayersDoneTotal,
        quranPages: weekQuranTotalPages,
        bookPages: weekBooksTotalPages,
        lectureHours: Math.round(lectureEntries.reduce((acc, l) => acc + l.durationMinutes, 0) / 60),
        studyHours: Math.round(weekStudyDuration / 60),
        habitCompletions: weekHabitCompletions,
        totalActivities: weekTotalTasks,
      },
      previous: {
        completionRate: prevCompletionRate,
        prayersDone: prevPrayersDone,
        quranPages: prevQuranPages,
        bookPages: prevBookPages,
        lectureHours: Math.round(prevLectureMinutes / 60),
        studyHours: Math.round(prevStudyMinutes / 60),
        habitCompletions: prevHabitsCompletions,
        totalActivities: prevTotalActivities,
      },
      diffs: compDiffs,
    },

    insights: {
      topStrength: topStrengthCat
        ? {
            title: topStrengthCat.name,
            metric: `${topStrengthCat.completionRate}% (${topStrengthCat.doneTasks}/${topStrengthCat.totalTasks})`,
            explanation: ar
              ? `أعلى نسبة إنجاز وثبات هذا الأسبوع، بمعدل نجاح ${topStrengthCat.completionRate}%.`
              : `Highest consistency at ${topStrengthCat.completionRate}%.`,
          }
        : null,
      topWeakness: topWeaknessCat && topWeaknessCat.completionRate < 80
        ? {
            title: topWeaknessCat.name,
            metric: `${topWeaknessCat.completionRate}% (${topWeaknessCat.doneTasks}/${topWeaknessCat.totalTasks})`,
            explanation: ar
              ? `تم تفويت ${topWeaknessCat.notDoneTasks + topWeaknessCat.pendingTasks} مهام في هذا الجانب، يحتاج إعادة جدولة.`
              : `Missed ${topWeaknessCat.notDoneTasks + topWeaknessCat.pendingTasks} tasks in this category.`,
          }
        : null,
      mostProductiveDay: {
        dayName: bestDay ? bestDay.dayName : (ar ? 'الأحد' : 'Sun'),
        date: bestDay ? bestDay.date : startDate,
        doneCount: bestDay ? bestDay.doneTasks : 0,
        percentage: bestDay ? bestDay.completionRate : 0,
      },
      topHabit: habitPerformances.length > 0 && maxHabitDays > 0
        ? {
            title: mostConsistentHabitTitle,
            streak: maxHabitDays,
            daysDone: maxHabitDays,
          }
        : null,
      biggestChange: compDiffs.completionRate.diff !== 0
        ? {
            label: ar ? 'نسبة الإنجاز العامة' : 'Overall Completion',
            diffText: `${compDiffs.completionRate.diff > 0 ? '+' : ''}${compDiffs.completionRate.diff}%`,
            trend: compDiffs.completionRate.trend === 'up' ? 'up' : 'down',
          }
        : null,
      narrativeParagraph,
    },

    achievements: achievementsList,

    unfinishedTasks: unfinishedTasksList,

    recommendations: recommendationsList,

    closing: {
      summaryText: ar
        ? `خلال هذا الأسبوع أنجزت ${weekDoneTasks} مهمة، وأديت ${weekPrayersDoneTotal} صلاة مسجلة، وقرأت ${weekQuranTotalPages + weekBooksTotalPages} صفحة، وحضرت ${lectureEntries.length} محاضرة، وحافظت على نشاطك خلال ${weekActiveDaysCount} أيام.`
        : `This week you completed ${weekDoneTasks} tasks, performed ${weekPrayersDoneTotal} prayers, read ${weekQuranTotalPages + weekBooksTotalPages} pages, and stayed active across ${weekActiveDaysCount} days.`,
      topHighlight: topStrengthCat
        ? (ar ? `أقوى ركائز أسبوعك كانت في ${topStrengthCat.name} بنسبة ${topStrengthCat.completionRate}%!` : `Strongest consistency in ${topStrengthCat.nameEn}.`)
        : (ar ? 'نشاط متوازن واستمرارية طيبة طوال الأيام.' : 'Balanced activity across the week.'),
      growthOpportunity: topWeaknessCat && topWeaknessCat.completionRate < 70
        ? (ar ? `التركيز على ${topWeaknessCat.name} في الأسبوع القادم سيرفع إنتاجيتك العامة بشكل ملحوظ.` : `Prioritizing ${topWeaknessCat.nameEn} next week will noticeably boost your output.`)
        : (ar ? 'الحفاظ على نفس الوتيرة مع تعزيز ساعات النوم والراحة.' : 'Maintain your pace while protecting restful sleep.'),
      encouragingMessage: ar
        ? 'كل خطوة صغيرة تخطوها اليوم تصنع فارقاً حقيقياً في مستقبلك. أسبوعك القادم يحمل فرصاً جديدة للإنجاز والارتقاء!'
        : 'Every small step forward compounds into meaningful life progress. Your next week holds fresh opportunities!',
    },
  };
}
