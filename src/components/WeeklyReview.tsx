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
  TrendingDown,
  Minus,
  Share2,
  Download,
  AlertCircle,
  Award,
  ArrowRight,
  Flame,
  Sun,
  Activity,
  Layers,
  Compass,
  ArrowUpRight,
  RefreshCw,
  Info,
  CalendarCheck2,
  BookmarkCheck,
  Check,
} from 'lucide-react';
import { Language, Task } from '../types';
import {
  computeComprehensiveWeeklyReview,
  WeeklyLifeDashboardData,
  WeekStartDay,
  DayOverview,
  HeatmapCell,
} from '../utils/comprehensiveWeeklyAnalytics';
import { addDays, getTodayDateString, formatHeaderDate, formatTime12h } from '../utils/date';
import { addTaskToDay } from '../utils/storage';
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

  // Selected reference date for the week (defaults to today)
  const [referenceDate, setReferenceDate] = useState<string>(todayStr);
  const [weekStartPreference, setWeekStartPreference] = useState<WeekStartDay>(() => {
    return (userStorage.getItem('week_start') as WeekStartDay) || (ar ? 'saturday' : 'sunday');
  });

  // Selected Day for Section C "The Seven-Day Experience"
  const [selectedDayDate, setSelectedDayDate] = useState<string>(todayStr);

  // Heatmap hover & inspection
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState<{ dayName: string; hourStr: string; tasksText: string } | null>(null);

  // Export & copy states
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Compute the comprehensive weekly analytics
  const data: WeeklyLifeDashboardData = useMemo(() => {
    return computeComprehensiveWeeklyReview(referenceDate, lang, weekStartPreference);
  }, [referenceDate, lang, weekStartPreference]);

  // Keep selectedDayDate within current week
  useEffect(() => {
    if (!data.days.some((d) => d.date === selectedDayDate)) {
      const todayInWeek = data.days.find((d) => d.date === todayStr);
      setSelectedDayDate(todayInWeek ? todayInWeek.date : data.days[data.days.length - 1].date);
    }
  }, [data.days, selectedDayDate, todayStr]);

  const selectedDayOverview: DayOverview | undefined = useMemo(() => {
    return data.days.find((d) => d.date === selectedDayDate) || data.days[0];
  }, [data.days, selectedDayDate]);

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
    setSelectedDayDate(todayStr);
  };

  const handleWeekStartChange = (start: WeekStartDay) => {
    setWeekStartPreference(start);
    userStorage.setItem('week_start', start);
  };

  // Export PDF / Print
  const handlePrintPDF = () => {
    window.print();
  };

  // Export Image via html-to-image
  const handleExportPNG = async () => {
    if (!reportRef.current) return;
    setIsExportingImage(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0B111A' : '#F7F9FC',
      });
      const link = document.createElement('a');
      link.download = `weekly-life-review-${data.startDate}-to-${data.endDate}.png`;
      link.href = dataUrl;
      link.click();
      setToastMessage(ar ? 'تم تحميل صورة التقرير بنجاح' : 'Report image exported successfully');
    } catch {
      setToastMessage(ar ? 'تعذر تصدير الصورة، يمكنك استخدام طباعة PDF' : 'Failed to export image, please use PDF print');
    } finally {
      setIsExportingImage(false);
    }
  };

  // Share summary to clipboard
  const handleShareSummary = async () => {
    const textSummary = `
📊 ${ar ? 'حصاد أسبوعي — ميزان' : 'Weekly Life Review — Mizan'}
📅 ${data.rangeLabel}
━━━━━━━━━━━━━━━━━━━━
🎯 ${ar ? 'نسبة الإنجاز الكلية' : 'Completion'}: ${data.kpis.tasks.percentage}% (${data.kpis.tasks.done}/${data.kpis.tasks.total})
🕌 ${ar ? 'الصلوات' : 'Prayers'}: ${data.kpis.prayers.done}/${data.kpis.prayers.expected}
📖 ${ar ? 'القرآن الكريم' : 'Quran'}: ${data.kpis.quran.totalPages} ${ar ? 'صفحة' : 'pages'}
📚 ${ar ? 'قراءة الكتب' : 'Books'}: ${data.kpis.books.totalPages} ${ar ? 'صفحة' : 'pages'}
🎓 ${ar ? 'المحاضرات' : 'Lectures'}: ${data.kpis.lectures.completedCount} ${ar ? 'محاضرة' : 'lectures'}
⏱️ ${ar ? 'وقت الأنشطة المسجل' : 'Logged Time'}: ${(data.kpis.activity.totalDurationMinutes / 60).toFixed(1)} ${ar ? 'ساعة' : 'hours'}
━━━━━━━━━━━━━━━━━━━━
💡 ${data.insights.narrativeParagraph}
`.trim();

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textSummary);
        setToastMessage(ar ? 'تم نسخ ملخص الأسبوع إلى الحافظة' : 'Weekly summary copied to clipboard');
      } else {
        setToastMessage(ar ? 'المتصفح لا يدعم النسخ التلقائي' : 'Clipboard not supported');
      }
    } catch {
      setToastMessage(ar ? 'تعذر نسخ الملخص' : 'Could not copy summary');
    }
  };

  // Rollover single task to today
  const handleRolloverTask = (item: { title: string; category?: string; notDoneReason?: string }) => {
    try {
      addTaskToDay(todayStr, {
        title: item.title,
        time: '',
        category: (item.category as any) || 'personal',
        priority: 'medium',
        status: 'pending',
        notes: item.notDoneReason ? `مرحّلة: ${item.notDoneReason}` : 'مرحّلة من أسبوع سابق',
      });
      setToastMessage(
        ar
          ? `تم ترحيل المهمة «${item.title}» إلى جدول اليوم بنجاح`
          : `Task "${item.title}" rolled over to today`
      );
    } catch {
      setToastMessage(ar ? 'حدث خطأ أثناء ترحيل المهمة' : 'Error rolling over task');
    }
  };

  // Rollover all unfinished tasks to today
  const handleRolloverAll = () => {
    if (data.unfinishedTasks.length === 0) return;
    let count = 0;
    data.unfinishedTasks.forEach((task) => {
      try {
        addTaskToDay(todayStr, {
          title: task.title,
          time: '',
          category: (task.category as any) || 'personal',
          priority: 'medium',
          status: 'pending',
          notes: 'مرحّلة من تقرير الأسبوع',
        });
        count++;
      } catch {
        // continue
      }
    });
    setToastMessage(
      ar
        ? `تم ترحيل ${count} مهمة غير مكتملة إلى مهام اليوم`
        : `Rolled over ${count} unfinished tasks to today`
    );
  };

  // Category Color Tags
  const getCategoryTheme = (catKey: string) => {
    const key = catKey.toLowerCase();
    if (key.includes('health') || key.includes('صحة') || key.includes('رياضة')) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] border-emerald-200 dark:border-emerald-800/40',
        dot: 'bg-[#00B884]',
        hex: '#00B884',
      };
    }
    if (key.includes('study') || key.includes('دراس') || key.includes('جامع') || key.includes('تعلم')) {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40 text-[#4775E7] border-blue-200 dark:border-blue-800/40',
        dot: 'bg-[#4775E7]',
        hex: '#4775E7',
      };
    }
    if (key.includes('work') || key.includes('عمل') || key.includes('مشروع')) {
      return {
        bg: 'bg-violet-50 dark:bg-violet-950/40 text-[#8A6DE9] border-violet-200 dark:border-violet-800/40',
        dot: 'bg-[#8A6DE9]',
        hex: '#8A6DE9',
      };
    }
    if (key.includes('finance') || key.includes('مال') || key.includes('مصاريف')) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40 text-[#F3A536] border-amber-200 dark:border-amber-800/40',
        dot: 'bg-[#F3A536]',
        hex: '#F3A536',
      };
    }
    return {
      bg: 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-400',
      hex: '#64748B',
    };
  };

  const isCurrentActiveWeek = data.isCurrentWeek;

  return (
    <div
      ref={reportRef}
      dir={ar ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F7F9FC] dark:bg-[#0B111A] text-[#10213A] dark:text-[#F1F5F9] pb-24 font-['IBM_Plex_Sans_Arabic','Cairo',sans-serif] selection:bg-[#00B884]/20 selection:text-[#00B884] transition-colors"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#10213A] text-white dark:bg-white dark:text-[#10213A] shadow-xl text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#00B884] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-12 sm:space-y-16">
        
        {/* ========================================================================= */}
        {/* SECTION A — ELEGANT WEEKLY HERO                                           */}
        {/* ========================================================================= */}
        <section className="relative pb-6 border-b border-[#E6ECF3] dark:border-white/[0.08]">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Right: Editorial Title & Context */}
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] shadow-xs text-xs font-semibold">
                <span className={`w-2 h-2 rounded-full ${isCurrentActiveWeek ? 'bg-[#00B884] animate-pulse' : 'bg-slate-400'}`} />
                <span className="text-[#64748B] dark:text-[#94A3B8]">
                  {isCurrentActiveWeek ? (ar ? 'الأسبوع الحالي (قيد التوثيق)' : 'Current Week (In Progress)') : (ar ? 'أسبوع مكتمل ومحفوظ' : 'Archived Week')}
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-[#10213A] dark:text-white font-bold">{data.rangeLabel}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-[#10213A] dark:text-white leading-[1.2]">
                {ar ? 'هذا كان أسبوعك' : 'This Was Your Week'}
              </h1>

              {/* Data-driven narrative quote directly under hero title */}
              <p className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] leading-relaxed font-normal">
                {data.insights.narrativeParagraph}
              </p>
            </div>

            {/* Left: Week Controls, Preferences, and Actions */}
            <div className="flex flex-wrap items-center gap-2.5 lg:justify-end self-start">
              {/* Previous Week */}
              <button
                type="button"
                onClick={handlePrevWeek}
                title={ar ? 'الأسبوع السابق' : 'Previous week'}
                className="h-10 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] text-xs font-semibold text-[#10213A] dark:text-white hover:border-[#00B884]/40 hover:text-[#00B884] transition shadow-xs cursor-pointer"
              >
                {ar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span>{ar ? 'السابق' : 'Prev'}</span>
              </button>

              {/* Today / Current Week Reset */}
              <button
                type="button"
                onClick={handleResetToCurrentWeek}
                className={`h-10 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition shadow-xs cursor-pointer ${
                  isCurrentActiveWeek
                    ? 'bg-[#00B884]/10 border-[#00B884]/30 text-[#00B884] dark:text-[#00B884]'
                    : 'bg-white dark:bg-[#131C29] border-[#E6ECF3] dark:border-white/[0.08] text-[#10213A] dark:text-white hover:border-[#00B884]/40'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{ar ? 'هذا الأسبوع' : 'This Week'}</span>
              </button>

              {/* Next Week */}
              <button
                type="button"
                onClick={handleNextWeek}
                title={ar ? 'الأسبوع التالي' : 'Next week'}
                className="h-10 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] text-xs font-semibold text-[#10213A] dark:text-white hover:border-[#00B884]/40 hover:text-[#00B884] transition shadow-xs cursor-pointer"
              >
                <span>{ar ? 'التالي' : 'Next'}</span>
                {ar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              <div className="h-6 w-px bg-slate-200 dark:bg-white/[0.08] hidden sm:block mx-1" />

              {/* Share Summary */}
              <button
                type="button"
                onClick={handleShareSummary}
                className="h-10 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] text-xs font-semibold text-[#10213A] dark:text-white hover:border-[#4775E7]/40 hover:text-[#4775E7] transition shadow-xs cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{ar ? 'مشاركة' : 'Share'}</span>
              </button>

              {/* PDF Print */}
              <button
                type="button"
                onClick={handlePrintPDF}
                className="h-10 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] text-xs font-semibold text-[#10213A] dark:text-white hover:border-[#00B884]/40 hover:text-[#00B884] transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              {/* Week Start Selector */}
              <select
                aria-label={ar ? 'بداية الأسبوع' : 'Week Start'}
                value={weekStartPreference}
                onChange={(e) => handleWeekStartChange(e.target.value as WeekStartDay)}
                className="h-10 px-3 rounded-xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs cursor-pointer outline-none"
              >
                <option value="saturday">{ar ? 'يبدأ: السبت' : 'Starts: Saturday'}</option>
                <option value="sunday">{ar ? 'يبدأ: الأحد' : 'Starts: Sunday'}</option>
                <option value="monday">{ar ? 'يبدأ: الاثنين' : 'Starts: Monday'}</option>
              </select>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION B — BEAUTIFUL WEEKLY HIGHLIGHTS («أسبوعك في أرقام»)                 */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#10213A] dark:text-white">
                {ar ? 'أسبوعك في أرقام' : 'Your Week in Numbers'}
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
                {ar ? 'نظرة شمولية متوازنة على الإنجاز والعبادات والتعلم والوقت' : 'A balanced, comprehensive view of achievement, worship, and focus'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* FEATURED LARGE KPI CARD (Spans 5 cols on desktop) */}
            <div className="md:col-span-5 rounded-3xl bg-gradient-to-br from-[#00B884] to-[#009267] text-white p-7 sm:p-8 flex flex-col justify-between shadow-lg shadow-[#00B884]/15 relative overflow-hidden">
              {/* Background ambient pattern */}
              <div className="absolute -top-16 -end-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-20 -start-20 w-60 h-60 rounded-full bg-emerald-950/20 blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold tracking-wide uppercase backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    {ar ? 'مؤشر الإنجاز الكلي' : 'Overall Completion'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-black/15 backdrop-blur-sm">
                    {data.kpis.tasks.diffFromLastWeek >= 0 ? (
                      <>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-200" />
                        <span>+{data.kpis.tasks.diffFromLastWeek}%</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3.5 h-3.5 text-rose-200" />
                        <span>{data.kpis.tasks.diffFromLastWeek}%</span>
                      </>
                    )}
                    <span className="opacity-75">{ar ? 'عن الماضي' : 'vs last'}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-baseline gap-3">
                  <span className="text-5xl sm:text-6xl font-black tracking-tight">{data.kpis.tasks.percentage}%</span>
                  <span className="text-sm sm:text-base font-medium opacity-90">
                    {ar ? `(${data.kpis.tasks.done} من ${data.kpis.tasks.total} مهمة)` : `(${data.kpis.tasks.done} of ${data.kpis.tasks.total} tasks)`}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed font-medium">
                  {data.kpis.tasks.percentage >= 80
                    ? (ar ? 'أداء استثنائي وتناغم رائع بين الواجبات والمهام طوال الأسبوع.' : 'Exceptional rhythm and balanced completion throughout the entire week.')
                    : data.kpis.tasks.percentage >= 50
                    ? (ar ? 'وتيرة إنجاز جيدة مع وجود مساحة مريحة لتعزيز الالتزام بالأهداف.' : 'Solid momentum with positive room to turn good progress into complete consistency.')
                    : (ar ? 'أسبوع هادئ يمكن البناء عليه تدريجيًا لتحقيق انطلاقة أقوى في الأسبوع القادم.' : 'A quiet week offering a clean foundation for gradual recovery next week.')}
                </p>
              </div>

              {/* Progress bar inside featured card */}
              <div className="relative z-10 pt-6 mt-4 border-t border-white/20 space-y-2">
                <div className="flex justify-between text-xs font-semibold opacity-90">
                  <span>{ar ? 'المنجز الفعلي' : 'Completed Work'}</span>
                  <span>{data.kpis.tasks.percentage}%</span>
                </div>
                <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, data.kpis.tasks.percentage))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* SUPPORTING METRICS (Spans 7 cols on desktop: 2x3 grid) */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              
              {/* Prayers */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] shadow-xs flex flex-col justify-between hover:border-[#00B884]/40 transition group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {ar ? 'الصلوات' : 'Prayers'}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#10213A] dark:text-white">
                      {data.kpis.prayers.done}
                    </span>
                    <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                      / {data.kpis.prayers.expected}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#00B884]">
                    <span>{data.kpis.prayers.percentage}%</span>
                    <span className="text-[#94A3B8] font-normal">{ar ? 'التزام' : 'adherence'}</span>
                  </div>
                </div>
              </div>

              {/* Quran */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] shadow-xs flex flex-col justify-between hover:border-[#00B884]/40 transition group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {ar ? 'القرآن الكريم' : 'Holy Quran'}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] flex items-center justify-center">
                    <BookmarkCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#10213A] dark:text-white">
                      {data.kpis.quran.totalPages}
                    </span>
                    <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                      {ar ? 'صفحة' : 'pages'}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {data.kpis.quran.daysRead} {ar ? 'أيام تلاوة' : 'reading days'}
                  </div>
                </div>
              </div>

              {/* Books */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] shadow-xs flex flex-col justify-between hover:border-[#4775E7]/40 transition group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {ar ? 'قراءة الكتب' : 'Book Reading'}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#4775E7] flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#10213A] dark:text-white">
                      {data.kpis.books.totalPages}
                    </span>
                    <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                      {ar ? 'صفحة' : 'pages'}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {data.kpis.books.sessionsCount} {ar ? 'جلسة قراءة' : 'sessions'}
                  </div>
                </div>
              </div>

              {/* Lectures */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] shadow-xs flex flex-col justify-between hover:border-[#8A6DE9]/40 transition group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {ar ? 'المحاضرات' : 'Lectures'}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-[#8A6DE9] flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#10213A] dark:text-white">
                      {data.kpis.lectures.completedCount}
                    </span>
                    <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                      {ar ? 'محاضرة' : 'completed'}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {data.kpis.lectures.durationMinutes} {ar ? 'دقيقة تعليمية' : 'mins watched'}
                  </div>
                </div>
              </div>

              {/* Habits */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] shadow-xs flex flex-col justify-between hover:border-[#F3A536]/40 transition group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {ar ? 'العادات اليومية' : 'Daily Habits'}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#F3A536] flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#10213A] dark:text-white">
                      {data.kpis.habits.totalCompletions}
                    </span>
                    <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                      {ar ? 'تكرار' : 'times'}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-[#F3A536]">
                    {data.kpis.habits.daysWithHabit} {ar ? 'أيام نشطة' : 'active days'}
                  </div>
                </div>
              </div>

              {/* Recorded Time */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] shadow-xs flex flex-col justify-between hover:border-[#00B884]/40 transition group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {ar ? 'الوقت المسجل' : 'Logged Focus'}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#10213A] dark:text-white">
                      {(data.kpis.activity.totalDurationMinutes / 60).toFixed(1)}
                    </span>
                    <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                      {ar ? 'ساعة' : 'hrs'}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {data.kpis.activity.activeDaysCount} {ar ? 'أيام موثقة' : 'logged days'}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION C — THE SEVEN-DAY EXPERIENCE («أسبوعك، يومًا بيوم»)               */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#10213A] dark:text-white">
                {ar ? 'أسبوعك، يومًا بيوم' : 'Your Week, Day by Day'}
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
                {ar ? 'اختر أي يوم لاسترجاع خطه الزمني، وإنجازاته، وتفاصيل أدائه' : 'Select any day to inspect its full chronological timeline and performance snapshot'}
              </p>
            </div>
            {selectedDayOverview && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] text-[#64748B] dark:text-[#94A3B8] self-start sm:self-auto">
                {ar ? 'اليوم المعروض حاليًا:' : 'Inspecting:'} <strong className="text-[#10213A] dark:text-white">{selectedDayOverview.dayName} ({formatHeaderDate(selectedDayOverview.date, lang)})</strong>
              </span>
            )}
          </div>

          {/* Horizontal 7-Day Overview Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {data.days.map((day) => {
              const isSelected = day.date === selectedDayDate;
              const isToday = day.isToday;

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDayDate(day.date)}
                  className={`p-4 rounded-2xl text-start transition-all duration-200 cursor-pointer relative flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-white dark:bg-[#131C29] border-[#00B884] ring-2 ring-[#00B884]/20 shadow-md'
                      : 'bg-white dark:bg-[#131C29] border-[#E6ECF3] dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  {isToday && (
                    <span className="absolute top-2.5 end-2.5 w-2 h-2 rounded-full bg-[#00B884]" title={ar ? 'اليوم' : 'Today'} />
                  )}

                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className={`text-sm font-bold ${isSelected ? 'text-[#00B884]' : 'text-[#10213A] dark:text-white'}`}>
                        {day.dayName}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium">
                      {formatHeaderDate(day.date, lang).split(' ').slice(0, 2).join(' ')}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[#10213A] dark:text-white">{day.completionRate}%</span>
                      <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        {day.doneTasks}/{day.totalTasks}
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          day.completionRate >= 80 ? 'bg-[#00B884]' : day.completionRate >= 50 ? 'bg-[#F3A536]' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                        style={{ width: `${day.completionRate}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Rich Selected-Day Experience (2 Asymmetric Columns) */}
          {selectedDayOverview && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Column 1: Daily Timeline (Spans 7 cols) */}
              <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#10213A] dark:text-white">
                        {ar ? 'الخط الزمني لأنشطة اليوم' : 'Daily Chronological Timeline'}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {selectedDayOverview.activities.length}{' '}
                        {ar ? 'نشاط مسجل ومصنف خلال ساعات هذا اليوم' : 'logged activities and milestones'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToDay(selectedDayOverview.date)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00B884] hover:underline cursor-pointer"
                  >
                    <span>{ar ? 'فتح جدول اليوم' : 'Open Day Planner'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {selectedDayOverview.activities.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <CalendarCheck2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">
                      {ar ? 'لا توجد أنشطة مسجلة في هذا اليوم' : 'No recorded activities on this day'}
                    </p>
                  </div>
                ) : (
                  <div className="relative ps-6 space-y-4 before:absolute before:top-2 before:bottom-2 before:start-2.5 before:w-0.5 before:bg-slate-200 dark:before:bg-white/[0.08]">
                    {selectedDayOverview.activities.map((ev, idx) => {
                      const theme = getCategoryTheme(ev.category);
                      const isDone = ev.status === 'done';
                      return (
                        <div key={idx} className="relative flex items-start gap-3.5 group">
                          {/* Timeline bullet dot */}
                          <div
                            className={`absolute -start-6 top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#131C29] ${
                              isDone ? 'bg-[#00B884]' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          />

                          <div className="flex-1 p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#0B111A]/60 border border-slate-100 dark:border-white/[0.04] flex items-center justify-between gap-3 group-hover:border-slate-300 dark:group-hover:border-slate-700 transition">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${theme.bg}`}>
                                  {ev.categoryName || ev.category}
                                </span>
                                <span className="text-xs font-mono font-medium text-[#64748B] dark:text-[#94A3B8]">
                                  {ev.time ? (typeof formatTime12h(ev.time, lang) === 'string' ? (formatTime12h(ev.time, lang) as unknown as string) : formatTime12h(ev.time, lang).formatted) : (ar ? 'طوال اليوم' : 'All day')}
                                </span>
                              </div>
                              <p className={`text-sm font-semibold ${isDone ? 'text-[#10213A] dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                {ev.title}
                              </p>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {ev.durationMinutes > 0 ? (
                                <span className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8] px-2 py-1 rounded-lg bg-white dark:bg-[#131C29] border border-slate-200 dark:border-white/[0.06]">
                                  {ev.durationMinutes} {ar ? 'د' : 'm'}
                                </span>
                              ) : null}
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  isDone
                                    ? 'bg-[#00B884]/10 text-[#00B884]'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                }`}
                              >
                                {isDone ? <Check className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Column 2: Day Snapshot (Spans 5 cols) */}
              <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#10213A] dark:text-white">
                    {ar ? 'ملخص إنجاز اليوم' : 'Day Snapshot'}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    {ar ? 'تفصيل رقمي فوري لهذا اليوم المحدد' : 'Instant quantitative breakdown for this day'}
                  </p>
                </div>

                {/* Circular / Large Rate Meter */}
                <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#0B111A]/50 border border-[#E6ECF3] dark:border-white/[0.04] flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                      {ar ? 'إجمالي نسبة إنجاز اليوم' : 'Daily Completion'}
                    </span>
                    <div className="text-3xl font-black text-[#10213A] dark:text-white">
                      {selectedDayOverview.completionRate}%
                    </div>
                    <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                      {selectedDayOverview.doneTasks} {ar ? 'من' : 'of'} {selectedDayOverview.totalTasks} {ar ? 'مهمة' : 'tasks'}
                    </span>
                  </div>

                  <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center relative">
                    <span className="text-xs font-bold text-[#00B884]">
                      {selectedDayOverview.completionRate}%
                    </span>
                  </div>
                </div>

                {/* Day breakdown cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-1">
                    <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">{ar ? 'الصلوات' : 'Prayers'}</span>
                    <p className="text-lg font-bold text-[#10213A] dark:text-white">{selectedDayOverview.prayersDone} / 5</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-1">
                    <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">{ar ? 'صفحات القرآن' : 'Quran Pages'}</span>
                    <p className="text-lg font-bold text-[#10213A] dark:text-white">{selectedDayOverview.quranPagesRead} {ar ? 'صفحة' : 'p'}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-1">
                    <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">{ar ? 'ساعات الدراسة' : 'Study Time'}</span>
                    <p className="text-lg font-bold text-[#10213A] dark:text-white">{(selectedDayOverview.studyDurationMinutes / 60).toFixed(1)} {ar ? 'س' : 'h'}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-1">
                    <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">{ar ? 'المحاضرات والكتب' : 'Learning'}</span>
                    <p className="text-lg font-bold text-[#10213A] dark:text-white">{selectedDayOverview.lecturesCount} {ar ? 'محاضرة' : 'lec'}</p>
                  </div>
                </div>

                {/* Day status badge */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#00B884] text-white flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
                    {selectedDayOverview.statusLabel}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION D — YOUR LIFE CATEGORIES («تفاصيل إنجازاتك»)                       */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#10213A] dark:text-white">
              {ar ? 'تفاصيل إنجازاتك' : 'Your Life Categories'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
              {ar ? 'عرض نوعي مخصص لكل فئة: العبادات، القرآن، الكتب، المحاضرات، والعادات' : 'Tailored editorial interfaces for worship, reading, lectures, and habit mastery'}
            </p>
          </div>

          <div className="space-y-6">
            {/* 1. PRAYER & WORSHIP (Featured 2-sided card) */}
            <div className="rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-8 shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Right: Prayer Metrics & Streaks */}
                <div className="lg:col-span-4 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#10213A] dark:text-white">
                        {ar ? 'الصلوات والعبادات' : 'Prayers & Worship'}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {ar ? 'مصفوفة الصلوات الخمس طوال أيام الأسبوع' : '5 daily prayers weekly matrix'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">{ar ? 'إجمالي الصلوات المؤداة' : 'Total Prayers'}</span>
                      <span className="text-2xl font-black text-[#10213A] dark:text-white">
                        {data.kpis.prayers.done} <span className="text-xs font-normal text-[#94A3B8]">/ {data.kpis.prayers.expected}</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00B884] rounded-full" style={{ width: `${data.kpis.prayers.percentage}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                      <span>{ar ? 'نسبة الالتزام' : 'Adherence'}: <strong>{data.kpis.prayers.percentage}%</strong></span>
                      <span>{ar ? 'أيام مكتملة (5/5)' : 'Full Days'}: <strong>{data.prayerMatrix.daysWithAllFive}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Left: Weekly Prayer Matrix (5 prayers x 7 days) */}
                <div className="lg:col-span-8 overflow-x-auto pb-2">
                  <table className="w-full text-center border-collapse text-xs min-w-[500px]">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                        <th className="py-2.5 px-3 text-start font-semibold text-[#64748B] dark:text-[#94A3B8]">
                          {ar ? 'الصلاة' : 'Prayer'}
                        </th>
                        {data.prayerMatrix.days.map((d) => (
                          <th key={d.date} className="py-2.5 px-2 font-bold text-[#10213A] dark:text-white">
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
                          <td className="py-3 px-3 text-start font-semibold text-[#10213A] dark:text-white">
                            {name}
                          </td>
                          {data.prayerMatrix.days.map((d) => {
                            const pStatus = d[key];
                            return (
                              <td key={d.date} className="py-3 px-2">
                                <div className="inline-flex items-center justify-center">
                                  {pStatus === 'done' ? (
                                    <span className="w-6 h-6 rounded-full bg-[#00B884]/15 text-[#00B884] flex items-center justify-center font-bold text-xs">
                                      ✓
                                    </span>
                                  ) : pStatus === 'not-done' ? (
                                    <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 flex items-center justify-center font-bold text-xs">
                                      ✕
                                    </span>
                                  ) : (
                                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs">
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
              </div>
            </div>

            {/* 2 & 3. QURAN READING & BOOK READING (2 Column Section) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Quran Reading Panel */}
              <div className="rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] flex items-center justify-center">
                        <BookmarkCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#10213A] dark:text-white">
                          {ar ? 'القرآن الكريم والورد اليومي' : 'Holy Quran & Daily Wird'}
                        </h3>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                          {data.quranDetail.readingDaysCount} {ar ? 'أيام تلاوة هذا الأسبوع' : 'active recitation days'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 pt-2">
                    <span className="text-4xl font-extrabold text-[#00B884]">{data.quranDetail.totalPages}</span>
                    <span className="text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">{ar ? 'صفحة مقروءة' : 'pages read'}</span>
                  </div>

                  {/* Daily reading mini bar chart */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
                      <span>{ar ? 'التوزيع اليومي لصفحات القرآن' : 'Daily Pages Distribution'}</span>
                      <span>{ar ? `المتوسط: ${data.quranDetail.avgPagesPerReadingDay.toFixed(1)} صفحة/يوم` : `Avg: ${data.quranDetail.avgPagesPerReadingDay.toFixed(1)} p/d`}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 items-end h-20 pt-2 border-b border-slate-100 dark:border-white/[0.06]">
                      {data.quranDetail.dailyPages.map((d) => {
                        const pages = d.pages;
                        const maxPages = Math.max(1, ...data.quranDetail.dailyPages.map((x) => x.pages));
                        const heightPct = Math.min(100, Math.round((pages / maxPages) * 100));
                        return (
                          <div key={d.date} className="flex flex-col items-center gap-1 h-full justify-end group">
                            <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] opacity-0 group-hover:opacity-100 transition">
                              {pages}
                            </span>
                            <div
                              className="w-full bg-[#00B884]/20 group-hover:bg-[#00B884] rounded-t-md transition-all duration-300"
                              style={{ height: `${Math.max(8, heightPct)}%` }}
                            />
                            <span className="text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                              {d.dayName.slice(0, 2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                  <span>{ar ? 'أيام القراءة' : 'Reading Days'}: <strong>{data.quranDetail.readingDaysCount}</strong></span>
                  <span>{ar ? 'أيام الاستراحة' : 'Rest Days'}: <strong>{data.quranDetail.restDaysCount}</strong></span>
                </div>
              </div>

              {/* Books & Reading Panel */}
              <div className="rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#4775E7] flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#10213A] dark:text-white">
                          {ar ? 'قراءة الكتب والمراجع' : 'Books & Literature'}
                        </h3>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                          {data.kpis.books.sessionsCount} {ar ? 'جلسة قراءة مسجلة' : 'reading sessions'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 pt-2">
                    <span className="text-4xl font-extrabold text-[#4775E7]">{data.booksDetail.totalPages}</span>
                    <span className="text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">{ar ? 'صفحة مقروءة' : 'pages read'}</span>
                  </div>

                  {/* Editorial Book List */}
                  <div className="space-y-2 pt-2">
                    {data.booksDetail.entries.length === 0 ? (
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] py-4 text-center">
                        {ar ? 'لم يتم توثيق قراءة كتب هذا الأسبوع' : 'No books logged this week'}
                      </p>
                    ) : (
                      data.booksDetail.entries.slice(0, 3).map((book, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#F7F9FC] dark:bg-[#0B111A]/50 border border-slate-100 dark:border-white/[0.04] flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-[#10213A] dark:text-white line-clamp-1">{book.title}</p>
                            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                              {book.sessionsCount} {ar ? 'جلسات' : 'sessions'}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#4775E7] px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                            {book.pagesRead} {ar ? 'ص' : 'p'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                  <span>{ar ? 'الكتب المقروءة' : 'Books'}: <strong>{data.booksDetail.entries.length}</strong></span>
                  <span>{ar ? 'إجمالي الدقائق' : 'Total Duration'}: <strong>{data.booksDetail.totalDurationMinutes} {ar ? 'د' : 'm'}</strong></span>
                </div>
              </div>

            </div>

            {/* 4 & 5. LECTURES & TASKS/HABITS (2 Column Section) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Lectures & Courses */}
              <div className="rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-[#8A6DE9] flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#10213A] dark:text-white">
                        {ar ? 'المحاضرات والدورات' : 'Lectures & Learning'}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {data.kpis.lectures.completedCount} {ar ? 'محاضرة مكتملة' : 'lectures completed'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {data.lecturesDetail.entries.length === 0 ? (
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] py-6 text-center">
                      {ar ? 'لم تسجل محاضرات خلال هذا الأسبوع' : 'No lectures completed this week'}
                    </p>
                  ) : (
                    data.lecturesDetail.entries.slice(0, 3).map((lec, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-[#F7F9FC] dark:bg-[#0B111A]/50 border border-slate-100 dark:border-white/[0.04] flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-[#10213A] dark:text-white line-clamp-1">{lec.title}</p>
                          <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                            {lec.dayName}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-semibold text-[#8A6DE9] shrink-0">
                          {lec.durationMinutes} {ar ? 'د' : 'm'}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                  <span>{ar ? 'إجمالي ساعات التعلم' : 'Total Learn Time'}: <strong>{data.lecturesDetail.totalHours.toFixed(1)} {ar ? 'ساعة' : 'hrs'}</strong></span>
                  <span>{ar ? 'نسبة الإنجاز' : 'Completion'}: <strong>{data.lecturesDetail.completionRate}%</strong></span>
                </div>
              </div>

              {/* Tasks & Habits Breakdown */}
              <div className="rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#F3A536] flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#10213A] dark:text-white">
                        {ar ? 'توزيع الفئات والمهام' : 'Categories Breakdown'}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {ar ? 'نسب الإنجاز المباشرة حسب مجالات حياتك' : 'Completion rates per life category'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {data.customCategoriesDetail.slice(0, 4).map((cat) => {
                    const theme = getCategoryTheme(cat.id);
                    return (
                      <div key={cat.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-[#10213A] dark:text-white">{cat.name}</span>
                          <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">
                            {cat.doneTasks} / {cat.totalTasks} ({cat.completionRate}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${cat.completionRate}%`,
                              backgroundColor: theme.hex,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                  <span>{ar ? 'العادات اليومية' : 'Habits'}: <strong>{data.kpis.habits.totalCompletions} {ar ? 'تكرار' : 'done'}</strong></span>
                  <span>{ar ? 'أفضل سلسلة عادة' : 'Top Streak'}: <strong>{data.kpis.habits.bestStreak} {ar ? 'أيام' : 'days'}</strong></span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION E — WEEKLY ACTIVITY & PERFORMANCE («كيف تحرك أسبوعك؟»)            */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#10213A] dark:text-white">
              {ar ? 'كيف تحرك أسبوعك؟' : 'Weekly Activity & Performance'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
              {ar ? 'تحليل عميق لكثافة النشاط، وأوقات الذروة، والخريطة الحرارية الكاملة' : 'In-depth analysis of daily volume, peak hours, and 7x24 activity heatmap'}
            </p>
          </div>

          {/* Asymmetric Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Large Chart Panel (Spans 8 cols) */}
            <div className="lg:col-span-8 rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-[#10213A] dark:text-white">
                    {ar ? 'الإنجاز اليومي (المنجز مقابل المخطط)' : 'Daily Completion Volume'}
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-[#00B884]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00B884]" />
                      {ar ? 'منجز' : 'Done'}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                      {ar ? 'مخطط' : 'Planned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="grid grid-cols-7 gap-3 items-end h-52 pt-6">
                {data.performanceChart.days.map((d) => {
                  const maxTasks = Math.max(5, ...data.performanceChart.days.map((x) => x.total));
                  const plannedHeight = Math.round((d.total / maxTasks) * 100);
                  const doneHeight = Math.round((d.done / maxTasks) * 100);

                  return (
                    <div key={d.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="relative w-full max-w-[42px] h-full flex items-end justify-center">
                        {/* Planned background bar */}
                        <div
                          className="w-full bg-slate-100 dark:bg-white/[0.04] rounded-t-xl absolute bottom-0 transition-all duration-300"
                          style={{ height: `${Math.max(10, plannedHeight)}%` }}
                        />
                        {/* Completed foreground bar */}
                        <div
                          className="w-full bg-[#00B884] rounded-t-xl relative z-10 transition-all duration-500 shadow-sm"
                          style={{ height: `${Math.max(6, doneHeight)}%` }}
                        />
                      </div>
                      <div className="text-center">
                        <span className="block text-xs font-bold text-[#10213A] dark:text-white">
                          {d.dayName.slice(0, 3)}
                        </span>
                        <span className="block text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                          {d.done}/{d.total}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                <span>{ar ? 'أكثر يوم إنتاجية' : 'Peak Day'}: <strong className="text-[#10213A] dark:text-white">{data.performanceChart.bestDayName}</strong></span>
                <span>{ar ? 'المتوسط اليومي للمهام' : 'Daily Task Avg'}: <strong className="text-[#10213A] dark:text-white">{data.performanceChart.averageDailyTasks.toFixed(1)} {ar ? 'مهمة' : 'tasks'}</strong></span>
              </div>
            </div>

            {/* Smaller Insights Panel (Spans 4 cols) */}
            <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#10213A] dark:text-white">
                  {ar ? 'مؤشرات الأداء السريعة' : 'Pacing & Insights'}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {ar ? 'حقائق تلخص وتيرة تحركك طوال الأسبوع' : 'Core takeaways from your weekly momentum'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#0B111A]/50 border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">{ar ? 'ساعة الذروة والإنتاجية' : 'Peak Active Hour'}</span>
                  <p className="text-base font-bold text-[#10213A] dark:text-white mt-0.5">
                    {data.heatmap.peakActiveTimeRange}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#0B111A]/50 border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">{ar ? 'الأيام المكتملة كليًا' : 'Perfect Days (80%+)'}</span>
                  <p className="text-base font-bold text-[#00B884] mt-0.5">
                    {data.days.filter((d) => d.completionRate >= 80).length} {ar ? 'أيام من 7' : 'of 7 days'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#0B111A]/50 border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">{ar ? 'التغير عن الأسبوع الماضي' : 'Weekly Velocity Delta'}</span>
                  <p className="text-base font-bold text-[#10213A] dark:text-white mt-0.5 flex items-center gap-1.5">
                    {data.kpis.tasks.diffFromLastWeek >= 0 ? (
                      <span className="text-[#00B884]">+{data.kpis.tasks.diffFromLastWeek}%</span>
                    ) : (
                      <span className="text-rose-500">{data.kpis.tasks.diffFromLastWeek}%</span>
                    )}
                    <span className="text-xs font-normal text-[#94A3B8]">{ar ? 'مقارنة بنفس الفترة' : 'compared to prev'}</span>
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs leading-relaxed">
                {ar
                  ? `أكثر ساعات نشاطك كانت في نافذة ${data.heatmap.peakActiveTimeRange}. رتّب مهامك الصعبة في هذا التوقيت.`
                  : `Your highest energy window was ${data.heatmap.peakActiveTimeRange}. Schedule deep work here.`}
              </div>
            </div>
          </div>

          {/* Full-Width 7x24 Heatmap */}
          <div className="rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#10213A] dark:text-white">
                  {ar ? 'الخريطة الحرارية لساعات الأسبوع (7 × 24)' : '7×24 Weekly Hourly Heatmap'}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {ar ? 'مرّر على أي خلية لمعرفة كثافة المهام والأنشطة في تلك الساعة' : 'Hover any cell to inspect activity density for that specific hour'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">{ar ? 'أقل' : 'Low'}</span>
                <span className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-white/[0.04]" />
                <span className="w-3 h-3 rounded-sm bg-[#00B884]/30" />
                <span className="w-3 h-3 rounded-sm bg-[#00B884]/60" />
                <span className="w-3 h-3 rounded-sm bg-[#00B884]" />
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">{ar ? 'أعلى' : 'High'}</span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[700px] space-y-1.5">
                {/* Hours Header (sampled) */}
                <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-1 text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono text-center">
                  <div />
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="truncate">
                      {h % 3 === 0 ? `${h}:00` : ''}
                    </div>
                  ))}
                </div>

                {/* Day rows */}
                {data.heatmap.days.map((day) => (
                  <div key={day.date} className="grid grid-cols-[80px_repeat(24,1fr)] gap-1 items-center">
                    <span className="text-xs font-bold text-[#10213A] dark:text-white truncate">
                      {day.dayName}
                    </span>
                    {day.hours.map((cell) => {
                      const intensity = cell.intensity;
                      const taskCount = cell.tasks.length;

                      let cellBg = 'bg-slate-100 dark:bg-white/[0.04]';
                      if (intensity === 1) cellBg = 'bg-[#00B884]/25';
                      if (intensity === 2) cellBg = 'bg-[#00B884]/55';
                      if (intensity === 3) cellBg = 'bg-[#00B884]/80 text-white';
                      if (intensity >= 4) cellBg = 'bg-[#00B884] text-white';

                      return (
                        <div
                          key={cell.hour}
                          onMouseEnter={() =>
                            setHoveredHeatmapCell({
                              dayName: day.dayName,
                              hourStr: `${cell.hour}:00 - ${cell.hour + 1}:00`,
                              tasksText:
                                taskCount > 0
                                  ? `${taskCount} ${ar ? 'مهام مسجلة' : 'activities logged'}`
                                  : (ar ? 'لا يوجد نشاط' : 'No activity'),
                            })
                          }
                          onMouseLeave={() => setHoveredHeatmapCell(null)}
                          className={`h-6 rounded-md ${cellBg} transition hover:scale-110 cursor-pointer flex items-center justify-center text-[10px] font-bold`}
                          title={`${day.dayName} ${cell.hour}:00 (${taskCount} ${ar ? 'نشاط' : 'tasks'})`}
                        >
                          {intensity >= 3 ? taskCount : ''}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Hover Tooltip / Live Bar */}
            {hoveredHeatmapCell && (
              <div className="pt-2 text-xs font-semibold text-[#00B884] flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>
                  {hoveredHeatmapCell.dayName} | {hoveredHeatmapCell.hourStr}: {hoveredHeatmapCell.tasksText}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION F — TIME & PROGRESS («وقتك وتقدمك»)                                */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#10213A] dark:text-white">
              {ar ? 'وقتك وتقدمك' : 'Time & Progress Audit'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
              {ar ? 'أين ذهبت ساعاتك المسجلة؟ ومقارنة رقمية شاملة مع الأسبوع الماضي' : 'Where did your logged hours go? Plus a direct metric-by-metric comparison with last week'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Time Distribution (Spans 6 cols) */}
            <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#10213A] dark:text-white">
                        {ar ? 'توزيع الوقت المسجل' : 'Logged Time Allocation'}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {(data.timeAudit.totalMinutes / 60).toFixed(1)} {ar ? 'ساعة مسجلة وموثقة في أنشطتك' : 'hours logged across your planner'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proportional Stacked Bar */}
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  {data.timeAudit.breakdown.map((cat, idx) => {
                    const theme = getCategoryTheme(cat.id);
                    return (
                      <div
                        key={idx}
                        title={`${cat.name}: ${cat.hoursFormatted} (${cat.percentage}%)`}
                        className="h-full transition-all duration-500 hover:opacity-90"
                        style={{
                          width: `${Math.max(2, cat.percentage)}%`,
                          backgroundColor: theme.hex,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Category Breakdown Table */}
                <div className="space-y-2.5 pt-2">
                  {data.timeAudit.breakdown.map((cat, idx) => {
                    const theme = getCategoryTheme(cat.id);
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#F7F9FC] dark:bg-[#0B111A]/50 border border-slate-100 dark:border-white/[0.04] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-3 h-3 rounded-full ${theme.dot}`} />
                          <span className="text-xs font-bold text-[#10213A] dark:text-white">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="font-semibold text-[#10213A] dark:text-white">{cat.hoursFormatted}</span>
                          <span className="text-[#64748B] dark:text-[#94A3B8] font-bold">({cat.percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                <span>{ar ? 'أعلى استثمار للوقت' : 'Primary Focus'}: <strong>{data.timeAudit.breakdown[0]?.name || '-'}</strong></span>
                <span>{ar ? 'المعدل اليومي' : 'Daily Avg'}: <strong>{((data.timeAudit.totalMinutes / 60) / 7).toFixed(1)} {ar ? 'ساعة/يوم' : 'h/d'}</strong></span>
              </div>
            </div>

            {/* Weekly Comparison Table (Spans 6 cols) */}
            <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#4775E7] flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#10213A] dark:text-white">
                        {ar ? 'المقارنة مع الأسبوع الماضي' : 'Weekly Comparative Table'}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {ar ? 'مقارنة دقيقة ومباشرة بين مؤشراتك الحالية والسابقة' : 'Direct variance and trend between current and previous week'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rows of comparison */}
                <div className="space-y-2 pt-4">
                  {(
                    [
                      {
                        name: ar ? 'نسبة الإنجاز الكلية' : 'Completion Rate',
                        prev: `${data.comparison.previous.completionRate}%`,
                        curr: `${data.comparison.current.completionRate}%`,
                        diff: `${data.comparison.diffs.completionRate.diff > 0 ? '+' : ''}${data.comparison.diffs.completionRate.diff}%`,
                        trend: data.comparison.diffs.completionRate.trend,
                      },
                      {
                        name: ar ? 'الصلوات المؤداة' : 'Prayers Done',
                        prev: `${data.comparison.previous.prayersDone}`,
                        curr: `${data.comparison.current.prayersDone}`,
                        diff: `${data.comparison.diffs.prayersDone.diff > 0 ? '+' : ''}${data.comparison.diffs.prayersDone.diff}`,
                        trend: data.comparison.diffs.prayersDone.trend,
                      },
                      {
                        name: ar ? 'صفحات القرآن' : 'Quran Pages',
                        prev: `${data.comparison.previous.quranPages}`,
                        curr: `${data.comparison.current.quranPages}`,
                        diff: `${data.comparison.diffs.quranPages.diff > 0 ? '+' : ''}${data.comparison.diffs.quranPages.diff}`,
                        trend: data.comparison.diffs.quranPages.trend,
                      },
                      {
                        name: ar ? 'صفحات الكتب' : 'Book Pages',
                        prev: `${data.comparison.previous.bookPages}`,
                        curr: `${data.comparison.current.bookPages}`,
                        diff: `${data.comparison.diffs.bookPages.diff > 0 ? '+' : ''}${data.comparison.diffs.bookPages.diff}`,
                        trend: data.comparison.diffs.bookPages.trend,
                      },
                      {
                        name: ar ? 'ساعات الدراسة' : 'Study Hours',
                        prev: `${data.comparison.previous.studyHours.toFixed(1)}h`,
                        curr: `${data.comparison.current.studyHours.toFixed(1)}h`,
                        diff: `${data.comparison.diffs.studyHours.diff > 0 ? '+' : ''}${data.comparison.diffs.studyHours.diff.toFixed(1)}h`,
                        trend: data.comparison.diffs.studyHours.trend,
                      },
                    ]
                  ).map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#0B111A]/50 border border-slate-100 dark:border-white/[0.04] flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-[#10213A] dark:text-white">{m.name}</span>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-[#64748B] dark:text-[#94A3B8]">{m.prev}</span>
                        <ArrowRight className={`w-3.5 h-3.5 text-slate-300 ${ar ? 'rotate-180' : ''}`} />
                        <span className="font-extrabold text-[#10213A] dark:text-white">{m.curr}</span>
                        <div
                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 ${
                            m.trend === 'up'
                              ? 'bg-emerald-50 text-[#00B884] dark:bg-emerald-950/40'
                              : m.trend === 'down'
                              ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/40'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                          }`}
                        >
                          {m.trend === 'up' && '↑'}
                          {m.trend === 'down' && '↓'}
                          {m.trend === 'same' && '–'}
                          <span>{m.diff}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                <span>{ar ? 'الأنشطة الإجمالية' : 'Total Activities'}: <strong className="text-[#00B884]">{data.comparison.current.totalActivities}</strong></span>
                <span>{ar ? 'السابق' : 'Prev Total'}: <strong>{data.comparison.previous.totalActivities}</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION G — SMART WEEKLY STORY («ماذا يقول أسبوعك عنك؟»)                  */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#10213A] dark:text-white">
              {ar ? 'ماذا يقول أسبوعك عنك؟' : 'What Your Week Says About You'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
              {ar ? 'قراءة ذكية مستخلصة من بياناتك الواقعية: نقاط القوة، ما يحتاج اهتمامك، وما تغيّر' : 'Intelligent editorial narrative synthesized from your logged actions'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Featured Wide Editorial Story Card */}
            <div className="rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-[#131C29] dark:via-[#131C29] dark:to-[#172333] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-8 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#00B884] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#10213A] dark:text-white">
                    {ar ? 'خلاصة الأسبوع في كلمات' : 'The Week’s Synthesis'}
                  </h3>
                  <p className="text-sm sm:text-base text-[#10213A] dark:text-slate-200 leading-relaxed font-normal">
                    {data.insights.narrativeParagraph}
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Secondary Editorial Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. What went well */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] shadow-xs space-y-3 hover:border-[#00B884]/40 transition">
                <div className="flex items-center gap-2.5 text-[#00B884]">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <h4 className="text-sm font-bold text-[#10213A] dark:text-white">{ar ? 'أجمل إنجازاتك' : 'What Went Well'}</h4>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  {data.insights.topStrength
                    ? `${data.insights.topStrength.title}: ${data.insights.topStrength.explanation} (${data.insights.topStrength.metric})`
                    : (ar ? 'أداء ثابت ومرن طوال أيام الأسبوع.' : 'Consistent and balanced weekly effort.')}
                </p>
                <div className="pt-2 text-xs font-semibold text-[#00B884]">
                  {ar ? 'نقطة قوة تستحق الحفاظ عليها' : 'Core strength to maintain'}
                </div>
              </div>

              {/* 2. What needs attention */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] shadow-xs space-y-3 hover:border-amber-300 dark:hover:border-amber-800 transition">
                <div className="flex items-center gap-2.5 text-[#F3A536]">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <h4 className="text-sm font-bold text-[#10213A] dark:text-white">{ar ? 'أشياء تستحق اهتمامك' : 'Needs Attention'}</h4>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  {data.insights.topWeakness
                    ? `${data.insights.topWeakness.title}: ${data.insights.topWeakness.explanation}`
                    : (ar ? 'لا توجد ثغرات كبيرة هذا الأسبوع، استمر بالتركيز.' : 'No major gaps observed this week.')}
                </p>
                <div className="pt-2 text-xs font-semibold text-[#F3A536]">
                  {ar ? 'فرصة تطوير واضحة للأسبوع القادم' : 'Actionable growth opportunity'}
                </div>
              </div>

              {/* 3. What changed */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] shadow-xs space-y-3 hover:border-blue-300 dark:hover:border-blue-800 transition">
                <div className="flex items-center gap-2.5 text-[#4775E7]">
                  <Activity className="w-5 h-5 shrink-0" />
                  <h4 className="text-sm font-bold text-[#10213A] dark:text-white">{ar ? 'ما الذي تغيّر؟' : 'What Changed'}</h4>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  {data.insights.biggestChange
                    ? `${data.insights.biggestChange.label}: ${data.insights.biggestChange.diffText}`
                    : (ar ? 'وتيرة أسبوعية متقاربة مع الأسبوع الماضي.' : 'Pacing aligned closely with last week.')}
                </p>
                <div className="pt-2 text-xs font-semibold text-[#4775E7]">
                  {ar ? 'أبرز تحول مقارنة بالأسبوع الماضي' : 'Notable weekly variance'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION H — ACHIEVEMENTS & UNFINISHED WORK («ما أنجزته... وما بقي»)         */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#10213A] dark:text-white">
              {ar ? 'ما أنجزته... وما بقي' : 'Achievements & Unfinished Follow-ups'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
              {ar ? 'احتفال بالشارات المستحقة ومتابعة المهام المعلقة مع إمكانية ترحيلها بنقرة واحدة' : 'Celebrate unlocked milestones and smoothly roll over open tasks to today'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Column 1: Achievements (Spans 6 cols) */}
            <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#10213A] dark:text-white">
                    {ar ? 'إنجازات وشارات الأسبوع' : 'Weekly Milestone Badges'}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    {data.achievements.filter((a) => a.unlocked).length} {ar ? 'شارات محققة بناءً على نشاطك الفعلي' : 'unlocked milestones based on actual activity'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {data.achievements.filter((a) => a.unlocked).length === 0 ? (
                  <p className="col-span-2 text-xs text-[#64748B] dark:text-[#94A3B8] py-8 text-center">
                    {ar ? 'واصل مهامك لفتح أول شارة لهذا الأسبوع!' : 'Keep going to unlock badges!'}
                  </p>
                ) : (
                  data.achievements.filter((a) => a.unlocked).map((ach) => (
                    <div
                      key={ach.id}
                      className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/20 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{ach.icon}</span>
                        <h4 className="text-xs font-bold text-[#10213A] dark:text-white">{ach.title}</h4>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                        {ach.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: Unfinished Work (Spans 6 cols) */}
            <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#F3A536] flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#10213A] dark:text-white">
                      {ar ? 'مهام تحتاج متابعة' : 'Unfinished Follow-ups'}
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {data.unfinishedTasks.length} {ar ? 'مهمة متبقية من هذا الأسبوع' : 'open tasks from this week'}
                    </p>
                  </div>
                </div>

                {data.unfinishedTasks.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRolloverAll}
                    className="text-xs font-bold text-[#00B884] hover:underline cursor-pointer"
                  >
                    {ar ? 'ترحيل الكل إلى اليوم' : 'Rollover All to Today'}
                  </button>
                )}
              </div>

              <div className="space-y-2 pt-2">
                {data.unfinishedTasks.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-[#00B884] mx-auto" />
                    <p className="text-sm font-bold text-[#10213A] dark:text-white">
                      {ar ? 'لا توجد مهام متأخرة أو معلقة!' : 'All scheduled tasks completed!'}
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {ar ? 'أغلقت كل المهام المخططة بنجاح باهر.' : 'You handled every single planned item.'}
                    </p>
                  </div>
                ) : (
                  data.unfinishedTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#0B111A]/50 border border-slate-100 dark:border-white/[0.04] flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-[#10213A] dark:text-white line-clamp-1">{task.title}</p>
                        <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          {task.category || (ar ? 'عام' : 'general')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRolloverTask(task)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#131C29] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-[#10213A] dark:text-white hover:border-[#00B884] hover:text-[#00B884] transition shadow-xs cursor-pointer shrink-0"
                      >
                        {ar ? 'ترحيل لليوم' : 'Rollover'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION I — NEXT WEEK RECOMMENDATIONS («خطوات صغيرة لأسبوع أفضل»)          */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#10213A] dark:text-white">
              {ar ? 'خطوات صغيرة لأسبوع أفضل' : 'Next Week Recommendations'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
              {ar ? '3 توصيات عملية مبنية على الأدلة الرقمية لأسبوعك لتطوير إيقاعك القادم' : '3 evidence-based action steps to elevate your next week’s momentum'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {data.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-6 rounded-3xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#00B884]/40 transition group"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00B884] flex items-center justify-center font-bold">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#10213A] dark:text-white">{rec.title}</h3>
                  <div className="space-y-1.5">
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                      <strong className="text-[#10213A] dark:text-white">{ar ? 'لماذا؟ ' : 'Why: '}</strong>
                      {rec.reason}
                    </p>
                    <p className="text-xs text-[#10213A] dark:text-slate-200 leading-relaxed font-semibold">
                      <strong className="text-[#00B884]">{ar ? 'الخطوة المقترحة: ' : 'Suggested Step: '}</strong>
                      {rec.suggestedStep}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                  <span className="text-[11px] font-semibold text-[#00B884] uppercase tracking-wider">
                    {ar ? 'توصية ذات أولوية' : 'High Priority Step'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION J — EMOTIONAL WEEKLY CLOSING («هذا كان أسبوعك... وكل خطوة محسوبة») */}
        {/* ========================================================================= */}
        <section className="rounded-3xl bg-gradient-to-br from-[#E8F8F1] via-white to-[#F7F9FC] dark:from-[#0C241E] dark:via-[#131C29] dark:to-[#0B111A] border border-emerald-200/60 dark:border-emerald-800/30 p-8 sm:p-12 shadow-sm space-y-8 relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00B884]/15 text-[#00B884] text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              {ar ? 'حصاد الأسبوع' : 'Weekly Milestone'}
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#10213A] dark:text-white leading-tight">
              {ar ? 'هذا كان أسبوعك... وكل خطوة محسوبة' : 'This was your week... and every step counted'}
            </h2>

            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              {data.closing.summaryText}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10 pt-2">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] text-xs sm:text-sm font-bold text-[#10213A] dark:text-white hover:border-[#00B884] hover:text-[#00B884] transition shadow-xs cursor-pointer"
            >
              {ar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{ar ? 'استعراض الأسبوع السابق' : 'Review Previous Week'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetToCurrentWeek}
              className="h-11 px-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00B884] text-white text-xs sm:text-sm font-bold hover:bg-[#009267] transition shadow-md shadow-[#00B884]/20 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>{ar ? 'الذهاب إلى الأسبوع الحالي' : 'Go to Current Week'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPDF}
              className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] text-xs sm:text-sm font-bold text-[#10213A] dark:text-white hover:border-[#00B884] transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{ar ? 'تحميل التقرير الكامل PDF' : 'Download Full PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportPNG}
              disabled={isExportingImage}
              className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-[#131C29] border border-[#E6ECF3] dark:border-white/[0.08] text-xs sm:text-sm font-bold text-[#10213A] dark:text-white hover:border-[#00B884] transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>{isExportingImage ? (ar ? 'جارٍ التصدير...' : 'Exporting...') : (ar ? 'تصدير كصورة عريضة' : 'Export as Image')}</span>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};
