import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  BookOpen,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Share2,
  Download,
  Award,
  Flame,
  Sun,
  Layers,
  Zap,
  BookmarkCheck,
  Check,
  ShieldCheck,
  Video,
  Lightbulb,
  Scale,
  Minus,
} from 'lucide-react';
import { Language } from '../types';
import {
  computeComprehensiveWeeklyReview,
  WeeklyLifeDashboardData,
  WeekStartDay,
} from '../utils/comprehensiveWeeklyAnalytics';
import { addDays, getTodayDateString } from '../utils/date';
import { userStorage } from '../utils/scopedStorage';

interface WeeklyReviewProps {
  lang: Language;
  onNavigateToDay: (dateStr: string) => void;
}

export const WeeklyReview: React.FC<WeeklyReviewProps> = ({
  lang,
  onNavigateToDay,
}) => {
  const ar = lang === 'ar';
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Selected reference date for the week
  const [referenceDate, setReferenceDate] = useState<string>(todayStr);
  const [weekStartPreference, setWeekStartPreference] = useState<WeekStartDay>(() => {
    return (userStorage.getItem('week_start') as WeekStartDay) || (ar ? 'saturday' : 'sunday');
  });

  // Active category filter tab (الكل، العبادات، العادات، المهام، الدراسة، العمل)
  const [activeFilterTab, setActiveFilterTab] = useState<string>('all');

  // Export states
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Compute analytics memoized
  const data: WeeklyLifeDashboardData = useMemo(() => {
    return computeComprehensiveWeeklyReview(referenceDate, lang, weekStartPreference);
  }, [referenceDate, lang, weekStartPreference]);

  // Toast auto-clear
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Navigation handlers
  const handlePrevWeek = () => {
    setReferenceDate((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setReferenceDate((prev) => addDays(prev, 7));
  };

  const handleResetToCurrentWeek = () => {
    setReferenceDate(todayStr);
  };

  // Export PDF / Print
  const handlePrintPDF = () => {
    window.print();
  };

  // Export Image
  const handleExportPNG = async () => {
    if (!reportRef.current) return;
    setIsExportingImage(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0B111A' : '#F8FAFC',
      });
      const link = document.createElement('a');
      link.download = `weekly-report-${data.startDate}-to-${data.endDate}.png`;
      link.href = dataUrl;
      link.click();
      setToastMessage(ar ? 'تم تحميل صورة التقرير بنجاح' : 'Report image exported successfully');
    } catch {
      setToastMessage(ar ? 'تعذر تصدير الصورة، يمكنك استخدام طباعة PDF' : 'Failed to export image, please use PDF print');
    } finally {
      setIsExportingImage(false);
    }
  };

  // Share summary
  const handleShareSummary = async () => {
    const textSummary = `
📊 ${ar ? 'إحصاءاتك وتقاريرك الأسبوعية — ميزان' : 'Weekly Life Review — Mizan'}
📅 ${data.rangeLabel}
━━━━━━━━━━━━━━━━━━━━
🎯 ${ar ? 'معدل الإنجاز' : 'Completion'}: ${data.kpis.tasks.percentage}% (${data.kpis.tasks.done}/${data.kpis.tasks.total})
🕌 ${ar ? 'الصلوات' : 'Prayers'}: ${data.kpis.prayers.done}/${data.kpis.prayers.expected} (${data.kpis.prayers.percentage}%)
📖 ${ar ? 'القرآن الكريم' : 'Quran'}: ${data.kpis.quran.totalPages} ${ar ? 'صفحة' : 'pages'}
📚 ${ar ? 'قراءة الكتب' : 'Books'}: ${data.kpis.books.totalPages} ${ar ? 'صفحة' : 'pages'}
🎓 ${ar ? 'الدراسة والتعلم' : 'Study'}: ${(data.kpis.study.durationMinutes / 60).toFixed(1)} ${ar ? 'ساعة' : 'hrs'}
⏱️ ${ar ? 'الوقت المسجل' : 'Logged Time'}: ${(data.kpis.activity.totalDurationMinutes / 60).toFixed(1)} ${ar ? 'ساعة' : 'hrs'}
`.trim();

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textSummary);
        setToastMessage(ar ? 'تم نسخ ملخص الأسبوع إلى الحافظة' : 'Weekly summary copied to clipboard');
      }
    } catch {
      setToastMessage(ar ? 'تعذر نسخ الملخص' : 'Could not copy summary');
    }
  };

  // Filter tabs definition
  const filterTabs = [
    { id: 'all', label: ar ? 'الكل' : 'All' },
    { id: 'worship', label: ar ? 'العبادات' : 'Worship' },
    { id: 'habits', label: ar ? 'العادات' : 'Habits' },
    { id: 'tasks', label: ar ? 'المهام' : 'Tasks' },
    { id: 'study', label: ar ? 'الدراسة' : 'Study' },
    { id: 'work', label: ar ? 'العمل' : 'Work' },
  ];

  const overallRate = data.kpis.tasks.percentage;

  // Study hours total and daily avg
  const studyHoursTotal = (data.kpis.study.durationMinutes / 60).toFixed(1);
  const studyDailyAvg = ((data.kpis.study.durationMinutes / 60) / 7).toFixed(1);

  // Quran daily avg
  const quranDailyAvg = (data.kpis.quran.totalPages / Math.max(1, data.kpis.quran.daysRead)).toFixed(0);

  // Lectures hours
  const lectureHours = (data.kpis.lectures.durationMinutes / 60).toFixed(1);

  return (
    <div
      ref={reportRef}
      dir={ar ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F4F6F9] dark:bg-[#090D14] text-[#1E293B] dark:text-[#F1F5F9] pb-20 font-['IBM_Plex_Sans_Arabic','Cairo',sans-serif] selection:bg-[#00B884]/20 selection:text-[#00B884] transition-colors"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#1E293B] text-white dark:bg-white dark:text-[#1E293B] shadow-2xl text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#00B884] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-7">
        
        {/* ========================================================================= */}
        {/* SECTION 1: TOP HERO (CARD WITH STUDENT PHOTO & CIRCULAR GAUGE)            */}
        {/* ========================================================================= */}
        <section className="rounded-3xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            
            {/* Student Photo Section (Left in RTL, Right in LTR) */}
            <div className="lg:col-span-5 relative min-h-[220px] sm:min-h-[260px] lg:min-h-full overflow-hidden order-last lg:order-first">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"
                alt={ar ? 'طالب يدرس بإتقان' : 'Student studying'}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  // Fallback to local image if offline
                  (e.target as HTMLImageElement).src = '/src/assets/images/cards/study-rtl-light.webp';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Right: Header & Featured Weekly Report Details */}
            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
              
              {/* Header Title with 3-bar emerald icon */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-end gap-1 h-6">
                    <span className="w-1.5 h-3.5 bg-[#00B884] rounded-xs" />
                    <span className="w-1.5 h-6 bg-[#00B884] rounded-xs" />
                    <span className="w-1.5 h-4.5 bg-[#00B884] rounded-xs" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                    {ar ? 'إحصاءاتك وتقاريرك الأسبوعية' : 'Weekly Stats & Reports'}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium ps-6">
                  {ar ? 'تابع إنجازك والعادات والعبادات خلال الأسبوع.' : 'Track your achievements, habits, and worship throughout the week.'}
                </p>
              </div>

              {/* Inner Featured Banner Card */}
              <div className="rounded-2xl bg-[#F0FAF5] dark:bg-[#0E2720]/50 border border-[#00B884]/25 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="space-y-2 text-start flex-1 z-10">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#00B884]/15 text-[#008F66] dark:text-[#00B884] text-[11px] font-bold">
                    <Calendar className="w-3 h-3" />
                    {ar ? 'تقرير الأسبوع' : 'Weekly Report'}
                  </span>

                  <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white">
                    {ar ? 'أسبوعك بالأرقام والتفاصيل' : 'Your Week in Numbers & Details'}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
                    {ar
                      ? 'كل عادة صالحة، كل صفحة قرأتها، وكل مهمة أنجزتها... خطوات متراكمة نحو نسخة أفضل من نفسك.'
                      : 'Every prayer prayed, page read, and task completed... compounding steps toward the best version of yourself.'}
                  </p>

                  <div className="inline-flex items-center gap-2 pt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-[#00B884]" />
                    <span>{data.rangeLabel}</span>
                  </div>
                </div>

                {/* Circular Completion Ring */}
                <div className="relative shrink-0 flex flex-col items-center justify-center w-28 h-28 z-10">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="9"
                      fill="transparent"
                      className="text-slate-200 dark:text-slate-700/60"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#00B884"
                      strokeWidth="9"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - overallRate / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-[#0F172A] dark:text-white leading-none">
                      {overallRate}%
                    </span>
                    <span className="text-[10px] font-semibold text-[#008F66] dark:text-[#00B884] mt-0.5">
                      {ar ? 'معدل الإنجاز' : 'Completion'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SUB-BAR: CATEGORIES FILTER, WEEK SELECTOR & ACTIONS                       */}
        {/* ========================================================================= */}
        <section className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#121B28] p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
          
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            {filterTabs.map((tab) => {
              const active = activeFilterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilterTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#00B884] text-white shadow-xs'
                      : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Week Navigator */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0B111A] px-2 py-1 rounded-xl border border-slate-200/80 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title={ar ? 'الأسبوع السابق' : 'Previous Week'}
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            </button>

            <button
              type="button"
              onClick={handleResetToCurrentWeek}
              className="px-2 text-xs font-bold text-[#0F172A] dark:text-white hover:text-[#00B884] transition cursor-pointer"
            >
              {data.isCurrentWeek ? (ar ? 'هذا الأسبوع' : 'This Week') : data.rangeLabel.split('(')[0]}
            </button>

            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title={ar ? 'الأسبوع التالي' : 'Next Week'}
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPDF}
              className="h-8 px-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-[#0B111A] border border-slate-200/80 dark:border-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#00B884]/40 hover:text-[#00B884] transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>{ar ? 'تصدير PDF' : 'Export PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareSummary}
              className="h-8 px-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-[#0B111A] border border-slate-200/80 dark:border-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#00B884]/40 hover:text-[#00B884] transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{ar ? 'مشاركة' : 'Share'}</span>
            </button>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: ملخص أسبوعك في لمحة (8 KPI CARDS GRID)                         */}
        {/* ========================================================================= */}
        <section className="space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-1 h-4">
              <span className="w-1 h-2.5 bg-[#00B884] rounded-xs" />
              <span className="w-1 h-4 bg-[#00B884] rounded-xs" />
              <span className="w-1 h-3 bg-[#00B884] rounded-xs" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
              {ar ? 'ملخص أسبوعك في لمحة' : 'My Week in One Glance'}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* 1. الصلوات في أوقاتها */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {ar ? 'الصلوات في أوقاتها' : 'Prayers on Time'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                    {data.kpis.prayers.done}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    / {data.kpis.prayers.expected}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#00B884] shrink-0">
                    {data.kpis.prayers.percentage}%
                  </span>
                  <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00B884] rounded-full" style={{ width: `${data.kpis.prayers.percentage}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. القرآن الكريم */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {ar ? 'القرآن الكريم' : 'Holy Quran'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <BookmarkCheck className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                    {data.kpis.quran.totalPages}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {ar ? 'صفحة' : 'pages'}
                  </span>
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {ar ? `معدل يومي ${quranDailyAvg} صفحة` : `Daily avg ${quranDailyAvg} pages`}
                </div>
              </div>
            </div>

            {/* 3. قراءة الكتب */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {ar ? 'قراءة الكتب' : 'Book Reading'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                    {data.kpis.books.sessionsCount}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {ar ? 'جلسات' : 'sessions'}
                  </span>
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {data.kpis.books.totalPages} {ar ? 'صفحة مقروءة' : 'pages read'}
                </div>
              </div>
            </div>

            {/* 4. المحاضرات والدروس */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {ar ? 'المحاضرات والدروس' : 'Lectures & Lessons'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                    {data.kpis.lectures.completedCount}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {ar ? 'محاضرة' : 'lectures'}
                  </span>
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {lectureHours} {ar ? 'ساعة تعليمية' : 'learning hours'}
                </div>
              </div>
            </div>

            {/* 5. الدراسة والتعلم */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {ar ? 'الدراسة والتعلم' : 'Study & Learning'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                    {studyHoursTotal}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {ar ? 'ساعة' : 'hours'}
                  </span>
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {ar ? `معدل يومي ${studyDailyAvg} ساعة` : `Daily avg ${studyDailyAvg} hrs`}
                </div>
              </div>
            </div>

            {/* 6. المهام اليومية */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {ar ? 'المهام اليومية' : 'Daily Tasks'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                    {data.kpis.tasks.percentage}%
                  </span>
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {data.kpis.tasks.done} / {data.kpis.tasks.total} {ar ? 'مهمة مكتملة' : 'tasks done'}
                </div>
              </div>
            </div>

            {/* 7. العادات والاستمرارية */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {ar ? 'العادات والاستمرارية' : 'Habits & Streaks'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                    {data.kpis.habits.totalCompletions}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {ar ? 'عادات نشطة' : 'active habits'}
                  </span>
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {ar ? `أفضل سلسلة: ${data.kpis.habits.bestStreak} أيام` : `Best streak: ${data.kpis.habits.bestStreak} days`}
                </div>
              </div>
            </div>

            {/* 8. النشاط العام */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {ar ? 'النشاط العام' : 'Overall Activity'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                    {data.kpis.activity.activeDaysCount}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {ar ? 'أيام نشطة' : 'active days'}
                  </span>
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {ar ? 'من أصل 7 أيام' : 'out of 7 days'}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: تقدم الأيام خلال الأسبوع (DAILY PROGRESS & INSPIRATION CARD)    */}
        {/* ========================================================================= */}
        <section className="rounded-3xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#00B884]" />
            <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
              {ar ? 'تقدم الأيام خلال الاسبوع' : 'Daily Progress Across the Week'}
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Left: Inspiration Card with Backpacker Photo & Quote */}
            <div className="lg:col-span-4 rounded-2xl relative overflow-hidden min-h-[160px] flex items-center justify-center p-6 text-center shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
                alt={ar ? 'إطلالة جبلية' : 'Mountain view'}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/images/cards/personal-rtl-light.webp';
                }}
              />
              <div className="absolute inset-0 bg-white/75 dark:bg-black/60 backdrop-blur-[2px]" />
              
              <div className="relative z-10 space-y-2">
                <span className="text-[#00B884] text-xl font-bold">❝</span>
                <p className="text-base sm:text-lg font-black text-[#0F172A] dark:text-white leading-snug">
                  {ar ? 'قليل دائم.. خير من كثير منقطع' : 'Consistent small steps outweigh sporadic leaps.'}
                </p>
                <div className="w-10 h-0.5 bg-[#00B884] mx-auto rounded-full" />
              </div>
            </div>

            {/* Right: 7 Daily Cards Strip */}
            <div className="lg:col-span-8 grid grid-cols-7 gap-2 sm:gap-3">
              {data.days.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => onNavigateToDay(day.date)}
                  className="rounded-2xl p-3 sm:p-3.5 bg-slate-50 dark:bg-[#0B111A]/50 border border-slate-200/80 dark:border-white/[0.06] flex flex-col items-center justify-between hover:border-[#00B884]/60 transition cursor-pointer group text-center"
                >
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-[#00B884] transition">
                    {day.dayName}
                  </span>

                  <div className="my-2 space-y-1">
                    <span className="text-sm sm:text-base font-black text-[#0F172A] dark:text-white block">
                      {day.completionRate}%
                    </span>
                    <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto overflow-hidden">
                      <div className="h-full bg-[#00B884] rounded-full" style={{ width: `${day.completionRate}%` }} />
                    </div>
                  </div>

                  <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] flex items-center justify-center font-bold text-xs mt-1">
                    ✓
                  </div>
                </button>
              ))}
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: الصلاة والعبادات + القرآن الكريم (2-COLUMN CARDS)               */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Right: الصلاة والعبادات (Weekly Prayer Matrix) - Spans 7 cols */}
          <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                  <Sun className="w-4 h-4 text-[#00B884]" />
                  <span>{ar ? 'الصلاة والعبادات (جدول الصلوات الخمس الأسبوعي)' : 'Prayer & Worship (5 Daily Prayers Matrix)'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {ar ? 'التزامك بالصلوات في أوقاتها' : 'Commitment to prayers in their prescribed times'}
                </p>
              </div>
            </div>

            {/* 5x7 Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs min-w-[460px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                    <th className="py-2 px-2 text-start font-bold text-slate-500 dark:text-slate-400">
                      {ar ? 'الصلاة' : 'Prayer'}
                    </th>
                    {data.prayerMatrix.days.map((d) => (
                      <th key={d.date} className="py-2 px-2 font-bold text-[#0F172A] dark:text-white">
                        {d.dayName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {(
                    [
                      { key: 'fajr', name: ar ? 'الفجر' : 'Fajr' },
                      { key: 'dhuhr', name: ar ? 'الظهر' : 'Dhuhr' },
                      { key: 'asr', name: ar ? 'العصر' : 'Asr' },
                      { key: 'maghrib', name: ar ? 'المغرب' : 'Maghrib' },
                      { key: 'isha', name: ar ? 'العشاء' : 'Isha' },
                    ] as const
                  ).map(({ key, name }) => (
                    <tr key={key} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                      <td className="py-2.5 px-2 text-start font-bold text-slate-700 dark:text-slate-200">
                        {name}
                      </td>
                      {data.prayerMatrix.days.map((d) => {
                        const status = d[key];
                        const isDone = status === 'done';
                        return (
                          <td key={d.date} className="py-2.5 px-2">
                            <div className="inline-flex items-center justify-center">
                              {isDone ? (
                                <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] flex items-center justify-center font-bold text-xs">
                                  ✓
                                </span>
                              ) : (
                                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs">
                                  -
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3 Summary Badges */}
            <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 dark:border-white/[0.06] text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B111A]/50 border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00B884]" />
                <div className="text-start">
                  <span className="text-[10px] text-slate-500 block leading-tight">{ar ? 'نسبة الالتزام' : 'Adherence'}</span>
                  <span className="text-xs font-black text-[#0F172A] dark:text-white">{data.kpis.prayers.percentage}%</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B111A]/50 border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <div className="text-start">
                  <span className="text-[10px] text-slate-500 block leading-tight">{ar ? 'أيام كاملة' : 'Full Days'}</span>
                  <span className="text-xs font-black text-[#0F172A] dark:text-white">{data.prayerMatrix.daysWithAllFive} {ar ? 'أيام' : 'days'}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B111A]/50 border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <div className="text-start">
                  <span className="text-[10px] text-slate-500 block leading-tight">{ar ? 'أفضل سلسلة' : 'Best Streak'}</span>
                  <span className="text-xs font-black text-[#0F172A] dark:text-white">{data.kpis.prayers.daysAllCompleted} {ar ? 'أيام' : 'days'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Left: القرآن الكريم (الورد اليومي) - Spans 5 cols */}
          <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="flex items-center gap-4">
              {/* Photo on left side */}
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-xs">
                <img
                  src="https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=400&q=80"
                  alt={ar ? 'مصحف شريف' : 'Holy Quran'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/src/assets/images/cards/ideas-rtl-light.webp';
                  }}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#00B884]">
                  <BookmarkCheck className="w-4 h-4" />
                  <span className="text-xs font-bold">{ar ? 'الورد اليومي' : 'Daily Recitation'}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
                  {ar ? 'القرآن الكريم' : 'Holy Quran'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {ar ? 'تابع وردك من كتاب الله خلال الأسبوع' : 'Track your weekly recitation'}
                </p>
              </div>
            </div>

            {/* Stats List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0B111A]/50 border border-slate-200/80 dark:border-white/[0.06]">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{ar ? 'إجمالي الصفحات' : 'Total Pages'}</span>
                <span className="text-sm font-black text-[#0F172A] dark:text-white">{data.kpis.quran.totalPages} {ar ? 'صفحة' : 'pages'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0B111A]/50 border border-slate-200/80 dark:border-white/[0.06]">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{ar ? 'المعدل اليومي' : 'Daily Average'}</span>
                <span className="text-sm font-black text-[#0F172A] dark:text-white">{quranDailyAvg} {ar ? 'صفحة' : 'pages'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0B111A]/50 border border-slate-200/80 dark:border-white/[0.06]">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{ar ? 'الأيام المكتملة' : 'Completed Days'}</span>
                <span className="text-sm font-black text-[#00B884]">{data.quranDetail.readingDaysCount} / 7 {ar ? 'أيام' : 'days'}</span>
              </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#00B884]">
                  {Math.round((data.quranDetail.readingDaysCount / 7) * 100)}%
                </span>
                <span className="text-slate-500">{ar ? 'معدل إنجاز الورد' : 'Wird completion rate'}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00B884] rounded-full transition-all duration-700"
                  style={{ width: `${Math.round((data.quranDetail.readingDaysCount / 7) * 100)}%` }}
                />
              </div>
            </div>

          </div>

        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: العادات الرئيسية + خريطة أسبوعك الزمنية (24H HEATMAP)            */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left: العادات الرئيسية خلال الأسبوع - Spans 5 cols */}
          <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00B884]" />
              <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
                {ar ? 'العادات الرئيسية خلال الأسبوع' : 'Core Weekly Habits'}
              </h3>
            </div>

            <div className="space-y-3.5">
              {(data.kpis.habits.items.length > 0 ? data.kpis.habits.items.slice(0, 5) : [
                { title: ar ? 'قراءة يومية' : 'Daily Reading', pct: 100 },
                { title: ar ? 'الرياضة والنشاط' : 'Fitness & Health', pct: 86 },
                { title: ar ? 'الأذكار اليومية' : 'Daily Adhkar', pct: 100 },
                { title: ar ? 'الاستيقاظ المبكر' : 'Early Wake-up', pct: 71 },
                { title: ar ? 'تقليل استخدام الهاتف' : 'Screen Time Control', pct: 86 },
              ]).map((item: any, idx) => {
                const title = item.title;
                const pct = item.pct ?? Math.round((item.daysCompletedThisWeek / 7) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#0F172A] dark:text-white">{title}</span>
                      <span className="text-[#00B884] font-black">{pct}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00B884] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] text-xs font-semibold text-slate-500">
              {ar ? 'استمرارية العادات هي المحرك الأساسي لإنتاجيتك.' : 'Consistent habits form your core foundation.'}
            </div>
          </div>

          {/* Right: خريطة أسبوعك الزمنية (24h Heatmap) - Spans 7 cols */}
          <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="space-y-0.5">
                <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#00B884]" />
                  <span>{ar ? 'خريطة أسبوعك الزمنية (24h Heatmap)' : '24h Weekly Time Heatmap'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {ar ? 'توزيع نشاطك حسب ساعات اليوم عبر أيام الأسبوع' : 'Activity distribution by hour throughout the week'}
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#00B884]" />
                  {ar ? 'نشاط مرتفع' : 'High'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#00B884]/50" />
                  {ar ? 'متوسط' : 'Med'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-100 dark:bg-white/[0.06]" />
                  {ar ? 'منخفض' : 'Low'}
                </span>
              </div>
            </div>

            {/* Matrix Heatmap */}
            <div className="overflow-x-auto pb-1">
              <div className="min-w-[460px] space-y-1.5">
                {/* Hours Header */}
                <div className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 text-[10px] text-slate-400 font-mono text-center">
                  <div />
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h}>{h % 3 === 0 ? `${h}` : ''}</div>
                  ))}
                </div>

                {/* Day Rows */}
                {data.heatmap.days.map((day) => (
                  <div key={day.date} className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 items-center">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                      {day.dayName}
                    </span>
                    {day.hours.map((cell) => {
                      const count = cell.tasks.length;
                      let bg = 'bg-slate-100 dark:bg-white/[0.04]';
                      if (count === 1) bg = 'bg-[#00B884]/30';
                      if (count === 2) bg = 'bg-[#00B884]/65';
                      if (count >= 3) bg = 'bg-[#00B884]';

                      return (
                        <div
                          key={cell.hour}
                          className={`h-5 rounded-xs ${bg} transition hover:scale-110 cursor-pointer`}
                          title={`${day.dayName} ${cell.hour}:00 (${count} ${ar ? 'مهام' : 'tasks'})`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer note: Peak Time */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2 text-xs font-bold text-[#008F66] dark:text-[#00B884]">
              <Zap className="w-4 h-4" />
              <span>
                {ar ? `ذروة نشاطك: ${data.heatmap.peakActiveTimeRange}` : `Peak focus window: ${data.heatmap.peakActiveTimeRange}`}
              </span>
            </div>

          </div>

        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: كيف كان أداؤك خلال الأيام السبعة؟ + إضاءات الأسبوع               */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Right: كيف كان أداؤك خلال الأيام السبعة؟ (Vertical Bar Chart) - Spans 7 cols */}
          <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#00B884]" />
                <span>{ar ? 'كيف كان أداؤك خلال الأيام السبعة؟' : 'How Was Your Performance Over 7 Days?'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {ar ? 'نسبة الإنجاز اليومية مع تطور الأداء العام.' : 'Daily completion percentage with general trajectory.'}
              </p>
            </div>

            {/* Vertical Bar Chart */}
            <div className="grid grid-cols-7 gap-3 items-end h-44 pt-4 border-b border-slate-100 dark:border-white/[0.06]">
              {data.days.map((d) => (
                <div key={d.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] font-bold text-[#00B884] block">
                    {d.completionRate}%
                  </span>
                  <div className="w-full max-w-[38px] bg-slate-100 dark:bg-white/[0.04] rounded-t-xl overflow-hidden h-full flex items-end">
                    <div
                      className="w-full bg-[#00B884] rounded-t-xl transition-all duration-700 group-hover:bg-[#009e72]"
                      style={{ height: `${Math.max(10, d.completionRate)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {d.dayName}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-1">
              <span>{ar ? 'أكثر يوم إنتاجية' : 'Best Day'}: <strong className="text-[#0F172A] dark:text-white">{data.performanceChart.bestDayName}</strong></span>
              <span>{ar ? 'المتوسط اليومي' : 'Daily Average'}: <strong className="text-[#0F172A] dark:text-white">{data.performanceChart.averageDailyTasks.toFixed(1)} {ar ? 'مهمة' : 'tasks'}</strong></span>
            </div>
          </div>

          {/* Left: إضاءات الأسبوع (Mosque photo + Key Bullets) - Spans 5 cols */}
          <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
                {ar ? 'إضاءات الأسبوع' : 'Weekly Insights'}
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Photo */}
              <div className="w-full sm:w-32 h-36 rounded-2xl overflow-hidden shrink-0 shadow-xs">
                <img
                  src="https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&w=400&q=80"
                  alt={ar ? 'إضاءة روحانية' : 'Mosque arch light'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/src/assets/images/prayers/mosque-light.webp';
                  }}
                />
              </div>

              {/* Bullet Points */}
              <div className="space-y-2.5 flex-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                <div className="flex items-start gap-2">
                  <span className="text-[#00B884] font-black shrink-0">✓</span>
                  <span>{ar ? 'التزام مميز بالصلوات في أوقاتها' : 'Exceptional commitment to daily prayers'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#00B884] font-black shrink-0">✓</span>
                  <span>{ar ? 'زيادة ملحوظة في ورد القرآن الكريم' : 'Noticeable increase in Quran recitation'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#00B884] font-black shrink-0">✓</span>
                  <span>{ar ? 'استمرارية جيدة في معظم عاداتك' : 'Strong consistency across primary habits'}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/[0.06] leading-relaxed">
              {data.insights.narrativeParagraph}
            </p>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* SECTION 7: أين تذهب وقتك هذا الأسبوع؟ + مقارنة هذا الأسبوع بالأسبوع الماضي   */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Right: أين تذهب وقتك هذا الأسبوع؟ - Spans 7 cols */}
          <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#00B884]" />
                  <span>{ar ? 'أين تذهب وقتك هذا الأسبوع؟' : 'Where Did Your Time Go This Week?'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {ar ? 'تحليل سريع لتوزيع ساعاتك على أهم أنشطتك.' : 'Quick analysis of your hours across main activities.'}
                </p>
              </div>

              <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-[#0F172A] dark:text-white">
                {ar ? `إجمالي الساعات ${(data.timeAudit.totalMinutes / 60).toFixed(1)} ساعة` : `Total ${(data.timeAudit.totalMinutes / 60).toFixed(1)} hrs`}
              </div>
            </div>

            {/* Segmented Horizontal Bar */}
            <div className="space-y-3">
              <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                {(data.timeAudit.breakdown.length > 0 ? data.timeAudit.breakdown : [
                  { name: ar ? 'الدراسة والتعلم' : 'Study', percentage: 38, color: '#00B884' },
                  { name: ar ? 'العمل والإنتاجية' : 'Work', percentage: 25, color: '#3B82F6' },
                  { name: ar ? 'العبادات' : 'Worship', percentage: 20, color: '#10B981' },
                  { name: ar ? 'القراءة' : 'Reading', percentage: 9, color: '#8B5CF6' },
                  { name: ar ? 'أخرى' : 'Other', percentage: 8, color: '#94A3B8' },
                ]).map((cat, idx) => (
                  <div
                    key={idx}
                    className="h-full transition-all duration-500 hover:opacity-90"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color || '#00B884',
                    }}
                    title={`${cat.name}: ${cat.percentage}%`}
                  />
                ))}
              </div>

              {/* Legend with percentages */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-600 dark:text-slate-300 pt-1">
                {(data.timeAudit.breakdown.length > 0 ? data.timeAudit.breakdown : [
                  { name: ar ? 'الدراسة والتعلم' : 'Study', percentage: 38, color: '#00B884' },
                  { name: ar ? 'العمل والإنتاجية' : 'Work', percentage: 25, color: '#3B82F6' },
                  { name: ar ? 'العبادات' : 'Worship', percentage: 20, color: '#10B981' },
                  { name: ar ? 'القراءة' : 'Reading', percentage: 9, color: '#8B5CF6' },
                  { name: ar ? 'أخرى' : 'Other', percentage: 8, color: '#94A3B8' },
                ]).map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || '#00B884' }} />
                    <span>{cat.name}</span>
                    <span className="text-[#0F172A] dark:text-white font-black">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400">
              {ar ? 'توزيع متوازن يعزز تركيزك ويحمي وقتك من التشتت.' : 'Balanced allocation protects your priorities.'}
            </div>
          </div>

          {/* Left: مقارنة هذا الأسبوع بالأسبوع الماضي - Spans 5 cols */}
          <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#121B28] border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#00B884]" />
                <span>{ar ? 'مقارنة هذا الأسبوع بالأسبوع الماضي' : 'This Week vs Last Week'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {ar ? 'هل تحسن أداؤك؟ إليك الفارق في أهم المؤشرات.' : 'Did you improve? Direct comparison with previous week.'}
              </p>
            </div>

            {/* Comparison boxes */}
            <div className="flex items-center justify-between gap-3">
              {/* Previous week box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B111A]/50 border border-slate-200/80 dark:border-white/[0.06] flex-1 text-center space-y-1">
                <span className="text-xs font-bold text-slate-500 block">{ar ? 'الأسبوع الماضي' : 'Last Week'}</span>
                <span className="text-2xl font-black text-slate-700 dark:text-slate-300 block">
                  {data.comparison.previous.completionRate}%
                </span>
                <span className="text-[10px] text-slate-400 block">{ar ? 'معدل الإنجاز' : 'Completion Rate'}</span>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full mt-2">
                  <div className="h-full bg-slate-400 rounded-full" style={{ width: `${data.comparison.previous.completionRate}%` }} />
                </div>
              </div>

              {/* Delta badge */}
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] font-black text-xs shrink-0 flex flex-col items-center">
                <span>{data.kpis.tasks.diffFromLastWeek >= 0 ? `+${data.kpis.tasks.diffFromLastWeek}%` : `${data.kpis.tasks.diffFromLastWeek}%`}</span>
                <span className="text-[10px] font-bold">{data.kpis.tasks.diffFromLastWeek >= 0 ? (ar ? 'تحسن' : 'gain') : (ar ? 'فارق' : 'diff')}</span>
              </div>

              {/* Current week box */}
              <div className="p-4 rounded-2xl bg-[#F0FAF5] dark:bg-[#0E2720]/40 border border-[#00B884]/30 flex-1 text-center space-y-1">
                <span className="text-xs font-bold text-[#008F66] dark:text-[#00B884] block">{ar ? 'هذا الأسبوع' : 'This Week'}</span>
                <span className="text-2xl font-black text-[#0F172A] dark:text-white block">
                  {data.comparison.current.completionRate}%
                </span>
                <span className="text-[10px] text-slate-500 block">{ar ? 'معدل الإنجاز' : 'Completion Rate'}</span>
                <div className="h-1.5 w-full bg-[#00B884]/20 rounded-full mt-2">
                  <div className="h-full bg-[#00B884] rounded-full" style={{ width: `${data.comparison.current.completionRate}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-2 text-xs font-bold text-[#008F66] dark:text-[#00B884] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>
                {data.kpis.tasks.diffFromLastWeek >= 0
                  ? (ar ? 'استمرار في التصاعد الإيجابي نحو أهدافك.' : 'Positive upward momentum toward your goals.')
                  : (ar ? 'معدل جيد يوفر أساساً مناسباً للتصاعد القادم.' : 'Steady baseline for upcoming recovery.')}
              </span>
            </div>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* FOOTER QUOTE BANNER (﴿ وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ ﴾)       */}
        {/* ========================================================================= */}
        <footer className="rounded-3xl relative overflow-hidden p-8 sm:p-12 text-center shadow-xs border border-emerald-200/50 dark:border-emerald-900/30">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80"
            alt={ar ? 'طبيعة هادئة' : 'Tranquil landscape'}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/src/assets/images/cards/personal-rtl-light.webp';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/85 to-white/70 dark:from-[#090D14]/95 dark:via-[#090D14]/85 dark:to-[#090D14]/75 backdrop-blur-[2px]" />

          <div className="relative z-10 space-y-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-white font-['Amiri',serif] leading-loose">
              ﴿ وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ ﴾
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {ar ? 'سورة النجم — الآية 39' : 'Surah An-Najm — Verse 39'}
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
};
