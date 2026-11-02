import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronLeft,
  Award,
  AlertTriangle,
  Sparkles,
  Camera,
  CheckCircle2,
  Clock,
  XCircle,
  Flame,
  BookOpen,
  Code2,
  HeartPulse,
  Bed,
  MoonStar,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Zap,
  Info,
  X,
  Share2,
  Printer,
  ChevronDown,
  ChevronUp,
  Check,
  Activity,
  Layers,
  GraduationCap,
  Book,
  MoveRight,
  ArrowRight,
  RefreshCw,
  Sun,
  ShieldCheck,
  CircleDot,
  FileText,
  CalendarCheck,
  Star,
  Compass,
} from 'lucide-react';
import { Language, Task, TaskCategory } from '../types';
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

  // Selected Day for Section 03 "Story of My Week" detail panel (defaults to today or last day)
  const [selectedDayDate, setSelectedDayDate] = useState<string>(todayStr);

  // Heatmap filtering and selection
  const [heatmapCategoryFilter, setHeatmapCategoryFilter] = useState<string>('all');
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<HeatmapCell | null>(null);
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState<{ dayName: string; hourStr: string; tasksText: string } | null>(null);

  // Expandable sections in Section 04
  const [expandedCategoryTabs, setExpandedCategoryTabs] = useState<Record<string, boolean>>({
    prayers: true,
    quran: true,
    books: true,
    lectures: true,
    custom: true,
  });

  // Export & copy states
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Compute the comprehensive 13-section analytics memoized
  const data: WeeklyLifeDashboardData = useMemo(() => {
    return computeComprehensiveWeeklyReview(referenceDate, lang, weekStartPreference);
  }, [referenceDate, lang, weekStartPreference]);

  // Keep selectedDayDate within current week
  useEffect(() => {
    if (!data.days.some((d) => d.date === selectedDayDate)) {
      // Default to today if in range, otherwise the most recent day of the week
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
    setSelectedHeatmapCell(null);
  };

  const handleNextWeek = () => {
    setReferenceDate((prev) => addDays(prev, 7));
    setSelectedHeatmapCell(null);
  };

  const handleResetToCurrentWeek = () => {
    setReferenceDate(todayStr);
    setSelectedDayDate(todayStr);
    setSelectedHeatmapCell(null);
  };

  const handleWeekStartChange = (start: WeekStartDay) => {
    setWeekStartPreference(start);
    try {
      userStorage.setItem('week_start', start);
    } catch {}
  };

  // Rollover unfinished task to today
  const handleRolloverTask = (taskTitle: string, taskCategory: string) => {
    try {
      addTaskToDay(todayStr, {
        title: taskTitle,
        time: '',
        status: 'pending',
        category: (taskCategory as TaskCategory) || 'general',
        notes: ar ? `مرحّلة من أسبوع ${data.rangeLabel}` : `Rolled over from ${data.rangeLabel}`,
      });
      setToastMessage(ar ? `تم ترحيل «${taskTitle}» إلى اليوم بنجاح ✓` : `Moved "${taskTitle}" to today ✓`);
    } catch {
      setToastMessage(ar ? 'تعذر ترحيل المهمة' : 'Failed to move task');
    }
  };

  // Export full page as image
  const handleExportImage = async () => {
    if (!reportRef.current) return;
    try {
      setIsExportingImage(true);
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(reportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f8fafc',
      });
      const link = document.createElement('a');
      link.download = `mizan-weekly-review-${data.startDate}-to-${data.endDate}.png`;
      link.href = dataUrl;
      link.click();
      setToastMessage(ar ? 'تم تصدير صورة التقرير الأسبوعي بنجاح' : 'Weekly review image exported successfully');
    } catch (err) {
      console.error('Export weekly image error:', err);
      setToastMessage(ar ? 'حدث خطأ أثناء تصدير الصورة' : 'Failed to export image');
    } finally {
      setIsExportingImage(false);
    }
  };

  // Print / PDF Export
  const handlePrintPdf = () => {
    window.print();
  };

  // Share / Copy summary to clipboard
  const handleCopySummary = async () => {
    const summary = [
      ar ? `📊 ملخص حصاد أسبوعي (${data.rangeLabel}):` : `📊 My Weekly Summary (${data.rangeLabel}):`,
      ar ? `• المهام المنجزة: ${data.kpis.tasks.done} من ${data.kpis.tasks.total} (${data.kpis.tasks.percentage}%)` : `• Completed tasks: ${data.kpis.tasks.done}/${data.kpis.tasks.total} (${data.kpis.tasks.percentage}%)`,
      ar ? `• الصلوات المؤداة: ${data.kpis.prayers.done} من 35 صلاة مسجلة` : `• Prayers completed: ${data.kpis.prayers.done}/35`,
      data.kpis.quran.totalPages > 0 ? (ar ? `• صفحات القرآن الكريم: ${data.kpis.quran.totalPages} صفحة` : `• Quran pages: ${data.kpis.quran.totalPages}`) : null,
      data.kpis.books.totalPages > 0 ? (ar ? `• قراءة الكتب: ${data.kpis.books.totalPages} صفحة` : `• Book reading: ${data.kpis.books.totalPages} pages`) : null,
      data.kpis.study.durationMinutes > 0 ? (ar ? `• ساعات الدراسة: ${(data.kpis.study.durationMinutes / 60).toFixed(1)} ساعة` : `• Study time: ${(data.kpis.study.durationMinutes / 60).toFixed(1)} hrs`) : null,
      ar ? `• أكثر أيام الأسبوع إنتاجية: يوم ${data.insights.mostProductiveDay.dayName}` : `• Most productive day: ${data.insights.mostProductiveDay.dayName}`,
      '',
      ar ? `«${data.closing.summaryText}»` : `"${data.closing.summaryText}"`,
      '',
      ar ? 'تم الإنشاء بواسطة ميزان - المخطط اليومي' : 'Generated via Mizan Daily Planner',
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setToastMessage(ar ? 'تم نسخ ملخص أسبوعك إلى الحافظة بنجاح ✓' : 'Weekly summary copied to clipboard ✓');
    } catch {
      setToastMessage(ar ? 'تعذر نسخ النص' : 'Failed to copy summary');
    }
  };

  const toggleCategoryTab = (key: string) => {
    setExpandedCategoryTabs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="weekly-review-dashboard space-y-8 max-w-7xl mx-auto pb-20 px-3 sm:px-6 transition-colors">
      
      {/* Toast Notification */}
      {toastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white dark:bg-emerald-600 dark:text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 dark:border-emerald-500 flex items-center gap-2.5 text-xs sm:text-sm font-bold font-['Alexandria'] animate-fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-[#00C896] dark:text-white" />
          <span>{toastMessage}</span>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* SECTION 01 — Weekly Header (رأس الأسبوع وأدوات التحكم)                    */}
      {/* ========================================================================= */}
      <header className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs dark:border-white/[0.08] dark:bg-[#111622]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Title, Subtitle & Status Badge */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00C896]/10 text-[#008f6b] dark:text-[#00C896] border border-[#00C896]/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{ar ? 'أسبوعك أمام عينيك' : 'Your Week at a Glance'}</span>
              </span>
              
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                data.isCurrentWeek
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
              }`}>
                <CircleDot className="w-3 h-3 animate-pulse" />
                <span>{data.isCurrentWeek ? (ar ? 'الأسبوع جاري' : 'In Progress') : (ar ? 'أسبوع مكتمل' : 'Completed Week')}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif]">
              {ar ? 'أسبوعك بالأرقام والتفاصيل' : 'Your Week in Numbers & Details'}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl">
              {ar
                ? 'كل صلاة صليتها، وكل صفحة قرأتها، وكل مهمة أنجزتها... هذا هو حصاد أسبوعك الحقيقي أمامك.'
                : 'Every prayer performed, page read, and task completed—this is your actual weekly harvest.'}
            </p>

            <div className="flex items-center gap-2 pt-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-[#00C896]" />
              <span className="font-mono">{data.rangeLabel}</span>
            </div>
          </div>

          {/* Controls: Navigation, Week Start Preference, Export Actions */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
            
            {/* Week Stepper Buttons */}
            <div className="inline-flex items-center justify-between bg-slate-100 dark:bg-white/[0.05] rounded-2xl p-1 border border-slate-200/80 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={handlePrevWeek}
                title={ar ? 'الأسبوع السابق' : 'Previous Week'}
                className="p-2 rounded-xl hover:bg-white dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
              </button>
              
              <button
                type="button"
                onClick={handleResetToCurrentWeek}
                className="px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white hover:text-[#00C896] dark:hover:text-[#00C896] transition-colors font-['Alexandria'] cursor-pointer"
              >
                {ar ? 'هذا الأسبوع' : 'This Week'}
              </button>
              
              <button
                type="button"
                onClick={handleNextWeek}
                title={ar ? 'الأسبوع التالي' : 'Next Week'}
                className="p-2 rounded-xl hover:bg-white dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
              </button>
            </div>

            {/* Week Start Day Selector */}
            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/[0.05] rounded-2xl p-1 border border-slate-200/80 dark:border-white/[0.08] text-xs">
              <span className="px-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                {ar ? 'البداية:' : 'Starts:'}
              </span>
              {(['saturday', 'sunday', 'monday'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleWeekStartChange(s)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-all text-[11px] cursor-pointer ${
                    weekStartPreference === s
                      ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {s === 'saturday' ? (ar ? 'السبت' : 'Sat') : s === 'sunday' ? (ar ? 'الأحد' : 'Sun') : (ar ? 'الاثنين' : 'Mon')}
                </button>
              ))}
            </div>

            {/* Export & Share Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintPdf}
                title={ar ? 'تصدير كتقرير PDF أو طباعة' : 'Export as PDF or print'}
                className="flex-1 sm:flex-initial inline-flex min-h-11 items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-white/10 hover:border-[#00C896]/50 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>{ar ? 'تصدير PDF' : 'Export PDF'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportImage}
                disabled={isExportingImage}
                title={ar ? 'تصدير كصورة كاملة' : 'Export as image'}
                className="flex-1 sm:flex-initial inline-flex min-h-11 items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-white/10 hover:border-[#00C896]/50 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <Camera className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>{isExportingImage ? (ar ? 'جارٍ التصدير…' : 'Exporting…') : (ar ? 'صورة' : 'Image')}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                title={ar ? 'نسخ ملخص الأسبوع للمشاركة' : 'Copy weekly summary text'}
                className="inline-flex min-h-11 items-center justify-center p-2.5 rounded-xl text-xs font-bold bg-[#00C896] hover:bg-[#00b587] text-slate-950 transition-all cursor-pointer shadow-sm shadow-[#00C896]/20"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Main Full-Page Printable/Exportable Body */}
      <div ref={reportRef} className="space-y-8">
        
        {/* ========================================================================= */}
        {/* SECTION 02 — My Week in One Glance (أسبوعك في لمحة واحدة)                 */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-02-heading" className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 id="section-02-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif] flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#00C896]" />
              <span>{ar ? 'أسبوعك في لمحة واحدة' : 'My Week in One Glance'}</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {ar ? '8 مؤشرات حيوية مستخرجة من واقع نشاطك' : '8 core vital indicators'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Card 1: الصلوات (Prayers) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">{ar ? 'الصلوات التي أديتها' : 'Prayers Performed'}</span>
                  <MoonStar className="w-4 h-4 text-emerald-600 dark:text-[#00C896]" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 dark:text-[#00C896]">
                    {data.kpis.prayers.done}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    / {data.kpis.prayers.expected}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(data.kpis.prayers.percentage, 100)}%` }} />
                </div>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {ar
                  ? `أديت ${data.kpis.prayers.done} من 35 صلاة (${data.kpis.prayers.percentage}%) في ${data.kpis.prayers.daysAllCompleted} أيام كاملة`
                  : `${data.kpis.prayers.done} of 35 prayers completed in ${data.kpis.prayers.daysAllCompleted} full days`}
              </p>
            </div>

            {/* Card 2: القرآن الكريم (Holy Quran) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">{ar ? 'القرآن الكريم' : 'Holy Quran'}</span>
                  <BookOpen className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                    {data.kpis.quran.totalPages}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 font-['Alexandria']">
                    {ar ? 'صفحة' : 'pages'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(data.kpis.quran.targetPercentage, 100)}%` }} />
                </div>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {ar
                  ? `${data.kpis.quran.daysRead} أيام قراءة · معدل ${data.kpis.quran.averagePagesPerSession} صفحة/جلسة`
                  : `${data.kpis.quran.daysRead} days read · ${data.kpis.quran.averagePagesPerSession} p/session`}
              </p>
            </div>

            {/* Card 3: قراءة الكتب (Book Reading) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">{ar ? 'قراءة الكتب' : 'Book Reading'}</span>
                  <Book className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                    {data.kpis.books.totalPages}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 font-['Alexandria']">
                    {ar ? 'صفحة' : 'pages'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min((data.kpis.books.totalPages / 50) * 100, 100)}%` }} />
                </div>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                {data.kpis.books.titles.length > 0
                  ? data.kpis.books.titles.join('، ')
                  : (ar ? 'جلسات قراءة متنوعة' : 'General reading')}
              </p>
            </div>

            {/* Card 4: المحاضرات والدروس (Lectures) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">{ar ? 'المحاضرات والدروس' : 'Lectures & Classes'}</span>
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
                    {data.kpis.lectures.completedCount}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    / {data.kpis.lectures.totalCount} {ar ? 'محاضرة' : 'classes'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(data.kpis.lectures.percentage, 100)}%` }} />
                </div>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {ar
                  ? `${(data.kpis.lectures.durationMinutes / 60).toFixed(1)} ساعة مسجلة في المحاضرات`
                  : `${(data.kpis.lectures.durationMinutes / 60).toFixed(1)} hrs in lectures`}
              </p>
            </div>

            {/* Card 5: الدراسة والتعلم (Study & Learning) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">{ar ? 'الدراسة والتعلم' : 'Study & Learning'}</span>
                  <FileText className="w-4 h-4 text-teal-500" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-teal-600 dark:text-teal-400">
                    {(data.kpis.study.durationMinutes / 60).toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 font-['Alexandria']">
                    {ar ? 'ساعة' : 'hours'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: `${Math.min((data.kpis.study.durationMinutes / 600) * 100, 100)}%` }} />
                </div>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {ar ? `${data.kpis.study.sessionsCount} جلسات دراسية مسجلة` : `${data.kpis.study.sessionsCount} study sessions`}
              </p>
            </div>

            {/* Card 6: المهام اليومية (Tasks) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">{ar ? 'المهام اليومية' : 'Daily Tasks'}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                    {data.kpis.tasks.percentage}%
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ({data.kpis.tasks.done}/{data.kpis.tasks.total})
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div className="bg-[#00C896] h-full rounded-full" style={{ width: `${data.kpis.tasks.percentage}%` }} />
                </div>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {ar ? `${data.kpis.tasks.pending} متبقية · ${data.kpis.tasks.notDone} غير منجزة` : `${data.kpis.tasks.pending} pending · ${data.kpis.tasks.notDone} missed`}
              </p>
            </div>

            {/* Card 7: العادات (Habits) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">{ar ? 'العادات والاستمرارية' : 'Habit Consistency'}</span>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                    {data.kpis.habits.totalCompletions}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 font-['Alexandria']">
                    {ar ? 'مرة تنفيذ' : 'checks'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min((data.kpis.habits.bestStreak / 7) * 100, 100)}%` }} />
                </div>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                {ar ? `أفضل سلسلة: ${data.kpis.habits.bestStreak} أيام متتالية` : `Best streak: ${data.kpis.habits.bestStreak} days`}
              </p>
            </div>

            {/* Card 8: النشاط العام (Overall Activity) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">{ar ? 'النشاط العام' : 'Overall Activity'}</span>
                  <Activity className="w-4 h-4 text-[#00C896]" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                    {data.kpis.activity.activeDaysCount}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    / 7 {ar ? 'أيام نشطة' : 'active days'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div className="bg-[#00C896] h-full rounded-full" style={{ width: `${(data.kpis.activity.activeDaysCount / 7) * 100}%` }} />
                </div>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {ar ? `${(data.kpis.activity.totalDurationMinutes / 60).toFixed(1)} ساعة إجمالي الأنشطة المسجلة` : `${(data.kpis.activity.totalDurationMinutes / 60).toFixed(1)} hrs recorded activity`}
              </p>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 03 — The Story of My Week (حكاية أسبوعك)                           */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-03-heading" className="space-y-4">
          <div className="space-y-1">
            <h2 id="section-03-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif] flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#00C896]" />
              <span>{ar ? 'حكاية أسبوعك' : 'The Story of My Week'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              {ar ? 'سبعة أيام، ولكل يوم قصة. انقر على أي يوم لاستعراض تفاصيله وجدوله الزمني الكامل.' : 'Seven days, each with a story. Select any day to explore its detailed timeline.'}
            </p>
          </div>

          {/* 7 Days Horizontal Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
            {data.days.map((day) => {
              const isSelected = selectedDayDate === day.date;
              const qualityBadge = day.statusQuality === 'excellent'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-[#00C896] border-emerald-500/20'
                : day.statusQuality === 'good'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                  : day.statusQuality === 'low'
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                    : 'bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-400 border-transparent';

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDayDate(day.date)}
                  className={`flex flex-col justify-between p-3.5 rounded-2xl border text-start transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-[#00C896] ring-2 ring-[#00C896]/30 bg-white dark:bg-[#151c2a] shadow-sm'
                      : 'border-slate-200/90 bg-white hover:border-[#00C896]/40 dark:border-white/[0.08] dark:bg-[#111622]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white font-['Alexandria']">
                        {day.dayName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {day.dayShortDate}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                        {day.completionRate}%
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ({day.doneTasks}/{day.totalTasks})
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          day.completionRate >= 80 ? 'bg-[#00C896]' : day.completionRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${day.completionRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.05] space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{ar ? 'صلوات' : 'Prayers'}: {day.prayersDone}/5</span>
                      {day.quranPagesRead > 0 && <span>{day.quranPagesRead} ص</span>}
                    </div>

                    <span className={`block text-center text-[10px] font-bold py-0.5 rounded-md border ${qualityBadge}`}>
                      {day.statusLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Day Detail Panel */}
          {selectedDayOverview && (
            <div className="rounded-3xl border border-[#00C896]/30 bg-slate-50/70 dark:bg-[#0c121d] p-5 sm:p-6 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/[0.08] pb-4">
                <div>
                  <span className="text-xs font-bold text-[#008f6b] dark:text-[#00C896] uppercase tracking-wider">
                    {ar ? 'تفاصيل اليوم المختار' : 'Selected Day Detailed Log'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif]">
                    {selectedDayOverview.dayName} — {ar ? 'ماذا فعلت في هذا اليوم؟' : `What did you do on this day?`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {selectedDayOverview.date} · {selectedDayOverview.totalTasks} {ar ? 'أنشطة مسجلة' : 'activities recorded'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateToDay(selectedDayOverview.date)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#00C896] hover:bg-[#00b587] text-slate-950 transition-all cursor-pointer shadow-sm"
                >
                  <span>{ar ? 'فتح اليوم في المخطط الرئيسي' : 'Open in Planner'}</span>
                  <ArrowUpRight className="w-4 h-4 rtl:rotate-[-90deg] ltr:rotate-0" />
                </button>
              </div>

              {/* Chronological Activity Feed */}
              {selectedDayOverview.activities.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedDayOverview.activities.map((act) => {
                    const statusBadge = act.status === 'done'
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-[#00C896]'
                      : act.status === 'not-done'
                        ? 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                        : 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300';

                    return (
                      <div
                        key={act.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#141b29] border border-slate-200/80 dark:border-white/[0.06] shadow-2xs hover:border-[#00C896]/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 font-bold">
                            {act.status === 'done' ? (
                              <CheckCircle2 className="w-5 h-5 text-[#00C896]" />
                            ) : act.status === 'not-done' ? (
                              <XCircle className="w-5 h-5 text-rose-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-amber-500" />
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {act.title}
                              </span>
                              {act.quantityLabel && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                  {act.quantityLabel}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                {act.categoryName}
                              </span>
                              {act.time && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">{formatTime12h(act.time, lang).formatted}</span>
                                </>
                              )}
                              {act.durationMinutes > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{act.durationMinutes} {ar ? 'دقيقة' : 'min'}</span>
                                </>
                              )}
                              {act.notes && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-xs italic text-slate-400">{act.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${statusBadge}`}>
                            {act.status === 'done' ? (ar ? 'مكتملة ✓' : 'Done ✓') : act.status === 'not-done' ? (ar ? 'غير منجزة' : 'Not Done') : (ar ? 'متبقية' : 'Pending')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  {ar ? 'لا توجد أنشطة مسجلة في هذا اليوم. يمكنك إضافة مهام في المخطط اليومي.' : 'No activities recorded on this day.'}
                </div>
              )}

              {/* Day Summary Footer */}
              <div className="rounded-2xl bg-white dark:bg-[#141b29] p-4 border border-slate-200/80 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-200 font-bold font-['Alexandria']">
                  {ar ? 'ملخص يومك:' : 'Day Summary:'}
                </span>
                <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-300 font-medium">
                  <span>{selectedDayOverview.prayersDone}/5 {ar ? 'صلوات' : 'prayers'}</span>
                  <span>•</span>
                  <span>{selectedDayOverview.quranPagesRead} {ar ? 'صفحة قرآن' : 'quran pages'}</span>
                  <span>•</span>
                  <span>{selectedDayOverview.doneTasks} {ar ? 'من' : 'of'} {selectedDayOverview.totalTasks} {ar ? 'مهام مكتملة' : 'tasks done'}</span>
                  <span>•</span>
                  <span>{(selectedDayOverview.totalDurationMinutes / 60).toFixed(1)} {ar ? 'ساعة مسجلة' : 'hrs logged'}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION 04 — Detailed Weekly Achievements (ماذا أنجزت بالتفصيل؟)           */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-04-heading" className="space-y-4">
          <div className="space-y-1">
            <h2 id="section-04-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#00C896]" />
              <span>{ar ? 'ماذا أنجزت هذا الأسبوع بالتفصيل؟' : 'Detailed Weekly Achievements'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              {ar ? 'جداول تفصيلية قابلة للتوسيع توثق التزامك بالصلوات، والقرآن، والكتب، والمحاضرات، والأنشطة.' : 'Expandable deep-dive sections documenting prayers, Quran, books, lectures, and activities.'}
            </p>
          </div>

          <div className="space-y-4">
            
            {/* 1. الصلاة والعبادات (Weekly Prayer Grid) */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] space-y-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCategoryTab('prayers')}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-[#00C896]">
                    <MoonStar className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-['Alexandria']">
                      {ar ? 'الصلاة والعبادات (جدول الصلوات الخمس الأسبوعي)' : 'Prayers & Worship Grid'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {ar ? `أديت ${data.prayerMatrix.totalDone} من ${data.prayerMatrix.totalExpected} صلاة مسجلة` : `${data.prayerMatrix.totalDone} of ${data.prayerMatrix.totalExpected} prayers`}
                    </p>
                  </div>
                </div>
                <button type="button" className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  {expandedCategoryTabs.prayers ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {expandedCategoryTabs.prayers && (
                <div className="space-y-4 pt-2">
                  <div className="overflow-x-auto pb-2">
                    <table className="w-full min-w-[500px] text-xs font-semibold text-slate-700 dark:text-slate-200 text-center border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/80 dark:border-white/[0.08]">
                          <th className="py-2.5 px-3 text-start text-slate-500 dark:text-slate-400">{ar ? 'الصلاة' : 'Prayer'}</th>
                          {data.prayerMatrix.days.map((d) => (
                            <th key={d.date} className="py-2.5 px-2">
                              <div>{d.dayName}</div>
                              <div className="text-[10px] font-mono font-normal text-slate-400">{d.date.slice(8)}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                        {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map((prayerKey) => {
                          const pNames = {
                            fajr: ar ? 'الفجر' : 'Fajr',
                            dhuhr: ar ? 'الظهر' : 'Dhuhr',
                            asr: ar ? 'العصر' : 'Asr',
                            maghrib: ar ? 'المغرب' : 'Maghrib',
                            isha: ar ? 'العشاء' : 'Isha',
                          };
                          return (
                            <tr key={prayerKey}>
                              <td className="py-3 px-3 text-start font-bold text-slate-900 dark:text-white">
                                {pNames[prayerKey]}
                              </td>
                              {data.prayerMatrix.days.map((d) => {
                                const st = d[prayerKey];
                                return (
                                  <td key={d.date} className="py-3 px-2">
                                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                                      st === 'done'
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-[#00C896]'
                                        : st === 'not-done'
                                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                                          : 'bg-slate-100 text-slate-400 dark:bg-white/[0.05]'
                                    }`}>
                                      {st === 'done' ? '✓' : st === 'not-done' ? '✕' : '—'}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Prayer Summary Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06] text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                      <span className="text-slate-500 block text-[11px]">{ar ? 'أكثر صلاة انتظاماً' : 'Most Consistent'}</span>
                      <span className="font-bold text-emerald-600 dark:text-[#00C896] mt-0.5 block">{data.prayerMatrix.mostConsistentPrayer.name} ({data.prayerMatrix.mostConsistentPrayer.count}/7)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                      <span className="text-slate-500 block text-[11px]">{ar ? 'أقل صلاة انتظاماً' : 'Least Consistent'}</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">{data.prayerMatrix.leastConsistentPrayer.name} ({data.prayerMatrix.leastConsistentPrayer.count}/7)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                      <span className="text-slate-500 block text-[11px]">{ar ? 'أيام الصلوات كاملة' : 'Full Prayer Days'}</span>
                      <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{data.prayerMatrix.daysWithAllFive} {ar ? 'من 7 أيام' : 'of 7 days'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                      <span className="text-slate-500 block text-[11px]">{ar ? 'السنن والأذكار' : 'Sunnah & Adhkar'}</span>
                      <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{data.prayerMatrix.morningAdhkarDoneDays} {ar ? 'صباح' : 'morning'} · {data.prayerMatrix.eveningAdhkarDoneDays} {ar ? 'مساء' : 'evening'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. القرآن الكريم (Holy Quran) */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] space-y-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCategoryTab('quran')}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <BookOpen className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-['Alexandria']">
                      {ar ? 'القرآن الكريم والورد اليومي' : 'Holy Quran & Daily Wird'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {ar ? `إجمالي ${data.quranDetail.totalPages} صفحة مقروءة في ${data.quranDetail.readingDaysCount} أيام` : `${data.quranDetail.totalPages} pages in ${data.quranDetail.readingDaysCount} days`}
                    </p>
                  </div>
                </div>
                <button type="button" className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  {expandedCategoryTabs.quran ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {expandedCategoryTabs.quran && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                    {data.quranDetail.dailyPages.map((dp) => (
                      <div key={dp.date} className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] text-center space-y-1">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">{dp.dayName}</span>
                        <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 block">{dp.pages}</span>
                        <span className="text-[10px] text-slate-400 block">{ar ? 'صفحة' : 'pages'}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-amber-900 dark:text-amber-200">
                      {ar ? 'التقدم نحو الختمة المباركة:' : 'Khatmah progress:'}
                    </span>
                    <span className="font-mono font-bold text-amber-800 dark:text-amber-300">
                      {data.quranDetail.totalPages} / 604 {ar ? 'صفحة' : 'pages'} ({data.quranDetail.estimatedKhatmahProgressPercent}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. قراءة الكتب والمحاضرات (Books & Lectures) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Books */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Book className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Alexandria']">
                      {ar ? 'قراءة الكتب والمراجع' : 'Book Reading'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {data.booksDetail.totalPages} {ar ? 'صفحة مقروءة' : 'pages read'}
                    </p>
                  </div>
                </div>

                {data.booksDetail.entries.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    {data.booksDetail.entries.map((bk, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-white truncate">{bk.title}</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">{bk.pagesRead} {ar ? 'ص' : 'p'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3">{ar ? 'لم يتم تسجيل كتب محددة هذا الأسبوع.' : 'No books logged.'}</p>
                )}
              </div>

              {/* Lectures */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <GraduationCap className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Alexandria']">
                      {ar ? 'المحاضرات والدورات' : 'Lectures & Courses'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {data.lecturesDetail.totalHours} {ar ? 'ساعات حضور' : 'hours logged'}
                    </p>
                  </div>
                </div>

                {data.lecturesDetail.entries.length > 0 ? (
                  <div className="space-y-2 pt-2 max-h-48 overflow-y-auto">
                    {data.lecturesDetail.entries.map((lec) => (
                      <div key={lec.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] flex items-center justify-between text-xs">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-800 dark:text-white truncate block">{lec.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{lec.dayName} · {lec.durationMinutes} دقيقة</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                          lec.status === 'done' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {lec.status === 'done' ? (ar ? 'مكتملة' : 'Done') : (ar ? 'متبقية' : 'Pending')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3">{ar ? 'لم يتم تسجيل محاضرات هذا الأسبوع.' : 'No lectures logged.'}</p>
                )}
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 05 — Weekly Activity Timeline Heatmap (خريطة أسبوعك الزمنية)       */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-05-heading" className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 id="section-05-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#00C896]" />
                <span>{ar ? 'خريطة أسبوعك الزمنية (24h Heatmap)' : 'Weekly Activity Timeline'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {ar ? 'توزيع الأنشطة حسب ساعات اليوم الـ 24 عبر الأيام السبعة.' : 'Hourly distribution of activities throughout the week.'}
              </p>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>{ar ? 'مكتملة' : 'Done'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>{ar ? 'متبقية' : 'Pending'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span>{ar ? 'غير منجزة' : 'Missed'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-100 dark:bg-white/[0.05]" />
                <span>{ar ? 'فارغ' : 'Empty'}</span>
              </span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[660px] space-y-1.5">
              
              {/* Hour header */}
              <div className="flex items-center ms-20 sm:ms-24 mb-1">
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="flex-1 text-center text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
                  </div>
                ))}
              </div>

              {/* 7 Days Rows */}
              {data.heatmap.days.map((row) => (
                <div key={row.date} className="flex items-center gap-2">
                  <div
                    onClick={() => setSelectedDayDate(row.date)}
                    className="w-18 sm:w-22 text-xs font-bold text-slate-700 dark:text-slate-300 font-['Alexandria'] truncate cursor-pointer hover:text-[#00C896] shrink-0"
                  >
                    {row.dayName} <span className="text-[10px] font-mono text-slate-400 font-normal">{row.date.slice(8)}</span>
                  </div>

                  <div className="flex-1 flex items-center gap-1">
                    {row.hours.map((cell) => {
                      const hourStr = `${String(cell.hour).padStart(2, '0')}:00`;
                      let cellClass = 'bg-slate-100 dark:bg-white/[0.04] border-transparent';
                      if (cell.tasks.length > 0) {
                        if (cell.doneCount === cell.tasks.length) cellClass = 'bg-emerald-500 hover:brightness-110';
                        else if (cell.doneCount > 0) cellClass = 'bg-amber-500 hover:brightness-110';
                        else if (cell.notDoneCount > 0) cellClass = 'bg-rose-500 hover:brightness-110';
                        else cellClass = 'bg-amber-500 hover:brightness-110';
                      }

                      return (
                        <button
                          key={cell.hour}
                          type="button"
                          onClick={() => setSelectedHeatmapCell(cell)}
                          onMouseEnter={() => {
                            setHoveredHeatmapCell({
                              dayName: row.dayName,
                              hourStr,
                              tasksText: cell.tasks.map((t) => t.title).join('، ') || (ar ? 'لا توجد مهام' : 'No tasks'),
                            });
                          }}
                          onMouseLeave={() => setHoveredHeatmapCell(null)}
                          className={`flex-1 h-6 rounded-xs transition-colors cursor-pointer border ${cellClass}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap Tooltip & Conclusion */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="text-slate-600 dark:text-slate-300 font-medium">
              {hoveredHeatmapCell ? (
                <span className="font-bold text-slate-900 dark:text-white">
                  {hoveredHeatmapCell.dayName} ({hoveredHeatmapCell.hourStr}): {hoveredHeatmapCell.tasksText}
                </span>
              ) : (
                <span>{ar ? 'مرر الفأرة فوق أي ساعة لمشاهدة تفاصيل أنشطتها.' : 'Hover over any hour to see activity.'}</span>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-[#00C896] shrink-0">
              <Zap className="w-4 h-4" />
              <span>{ar ? `ذروة نشاطك: ${data.heatmap.peakActiveTimeRange}` : `Peak hours: ${data.heatmap.peakActiveTimeRange}`}</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 06 — Weekly Performance Analytics (الأداء عبر الأيام السبعة)        */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-06-heading" className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="section-06-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00C896]" />
                <span>{ar ? 'كيف كان أداؤك خلال الأيام السبعة؟' : 'Weekly Performance Analytics'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {ar ? 'نسبة الإنجاز اليومية مع تمييز الأيام المكتملة والجزئية.' : 'Daily task completion rate vs scheduled goals.'}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
              {ar ? `المتوسط اليومي: ${data.performanceChart.averageDailyTasks} مهام` : `Avg: ${data.performanceChart.averageDailyTasks} tasks/day`}
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 sm:gap-4 h-48 pt-6 pb-2 px-1 border-b border-slate-100 dark:border-white/[0.06]">
            {data.performanceChart.days.map((d) => {
              const barColor = d.percentage >= 80 ? 'bg-[#00C896]' : d.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <div
                  key={d.date}
                  onClick={() => setSelectedDayDate(d.date)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {d.percentage}%
                  </span>
                  <div className="w-full max-w-[38px] bg-slate-100 dark:bg-white/[0.05] rounded-t-xl h-full flex items-end overflow-hidden p-0.5">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${barColor}`}
                      style={{ height: `${Math.max(d.percentage, 6)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 font-['Alexandria'] truncate">
                    {d.dayName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {d.done}/{d.total}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 07 — Where Did My Time Go? (أين ذهب وقتك هذا الأسبوع؟)             */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-07-heading" className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 id="section-07-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif] flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <span>{ar ? 'أين ذهب وقتك هذا الأسبوع؟' : 'Where Did My Time Go?'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {ar ? 'تحليل توزيع الساعات المسجلة عبر مختلف جوانب حياتك.' : 'Audit of recorded hours distributed across activities.'}
              </p>
            </div>
            <div className="text-end">
              <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {(data.timeAudit.totalMinutes / 60).toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-500 ms-1 font-['Alexandria']">
                {ar ? 'ساعة مسجلة' : 'hours logged'}
              </span>
            </div>
          </div>

          {/* Proportional Stacked Bar */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-white/[0.05]">
            {data.timeAudit.breakdown.map((item) => (
              <div
                key={item.id}
                title={`${item.name}: ${item.hoursFormatted} (${item.percentage}%)`}
                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                className="h-full transition-all duration-500 hover:opacity-80"
              />
            ))}
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            {data.timeAudit.breakdown.map((item) => (
              <div key={item.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                </div>
                <div className="flex items-baseline justify-between text-xs font-mono font-bold mt-1">
                  <span className="text-slate-900 dark:text-white">{item.hoursFormatted}</span>
                  <span className="text-slate-400">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            {ar ? 'ملاحظة: يتم احتساب الأوقات بناءً على المهام والجلسات المحددة بمدة زمنية؛ والوقت غير المسجل لا يُحتسب كفراغ.' : 'Note: Calculations reflect activities with recorded durations; untracked time is not assumed idle.'}
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 08 — Weekly Comparison (هذا الأسبوع مقارنة بالأسبوع الماضي)        */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-08-heading" className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] space-y-4">
          <div>
            <h2 id="section-08-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>{ar ? 'هذا الأسبوع مقارنة بالأسبوع الماضي' : 'Weekly Comparison'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {ar ? 'مقارنة إحصائية دقيقة تكشف وتيرة تطورك أو تراجعك.' : 'Statistical comparison revealing growth or dip trends.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            
            {/* 1. نسبة إنجاز المهام */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">{ar ? 'نسبة إنجاز المهام' : 'Completion Rate'}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{data.comparison.current.completionRate}%</span>
                <span className={`text-xs font-mono font-bold flex items-center ${data.comparison.diffs.completionRate.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {data.comparison.diffs.completionRate.diff >= 0 ? '+' : ''}{data.comparison.diffs.completionRate.diff}%
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">{ar ? `السابق: ${data.comparison.previous.completionRate}%` : `Prev: ${data.comparison.previous.completionRate}%`}</span>
            </div>

            {/* 2. الصلوات المؤداة */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">{ar ? 'الصلوات المؤداة' : 'Prayers'}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{data.comparison.current.prayersDone}</span>
                <span className={`text-xs font-mono font-bold flex items-center ${data.comparison.diffs.prayersDone.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {data.comparison.diffs.prayersDone.diff >= 0 ? '+' : ''}{data.comparison.diffs.prayersDone.diff}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">{ar ? `السابق: ${data.comparison.previous.prayersDone}` : `Prev: ${data.comparison.previous.prayersDone}`}</span>
            </div>

            {/* 3. صفحات القرآن */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">{ar ? 'صفحات القرآن' : 'Quran Pages'}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{data.comparison.current.quranPages}</span>
                <span className={`text-xs font-mono font-bold flex items-center ${data.comparison.diffs.quranPages.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {data.comparison.diffs.quranPages.diff >= 0 ? '+' : ''}{data.comparison.diffs.quranPages.diff}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">{ar ? `السابق: ${data.comparison.previous.quranPages}` : `Prev: ${data.comparison.previous.quranPages}`}</span>
            </div>

            {/* 4. ساعات الدراسة */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">{ar ? 'ساعات الدراسة' : 'Study Hours'}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{data.comparison.current.studyHours}h</span>
                <span className={`text-xs font-mono font-bold flex items-center ${data.comparison.diffs.studyHours.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {data.comparison.diffs.studyHours.diff >= 0 ? '+' : ''}{data.comparison.diffs.studyHours.diff}h
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">{ar ? `السابق: ${data.comparison.previous.studyHours}h` : `Prev: ${data.comparison.previous.studyHours}h`}</span>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 09 — Smart Weekly Insights (ماذا يقول أسبوعك عنك؟)                 */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-09-heading" className="space-y-4">
          <div className="space-y-1">
            <h2 id="section-09-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>{ar ? 'ماذا يقول أسبوعك عنك؟ (تحليلات ذكية)' : 'Smart Weekly Insights'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              {ar ? 'استنتاجات شخصية دقيقة مبنية على أرقامك وسلوكك الفعلي هذا الأسبوع.' : 'Objective takeaways derived from your recorded weekly habits and outputs.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. أقوى إنجاز */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] p-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span>{ar ? 'أقوى إنجاز هذا الأسبوع' : 'Top Strength'}</span>
                </span>
                <span className="font-mono text-emerald-700 dark:text-[#00C896] font-bold">#1</span>
              </div>
              {data.insights.topStrength ? (
                <>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white font-['Alexandria']">
                    {data.insights.topStrength.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {data.insights.topStrength.explanation} ({data.insights.topStrength.metric})
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500">{ar ? 'سجل المزيد من الأنشطة لاكتشاف أقوى ركائزك.' : 'Keep logging to reveal strengths.'}</p>
              )}
            </div>

            {/* 2. نقطة تحتاج اهتمام */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>{ar ? 'أكبر نقطة تحتاج اهتمام' : 'Area for Focus'}</span>
                </span>
                <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">Attention</span>
              </div>
              {data.insights.topWeakness ? (
                <>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white font-['Alexandria']">
                    {data.insights.topWeakness.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {data.insights.topWeakness.explanation} ({data.insights.topWeakness.metric})
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500">{ar ? 'أداء متوازن جداً دون تعثر ملحوظ!' : 'Balanced performance across all domains!'}</p>
              )}
            </div>

            {/* 3. أكثر يوم إنتاجية */}
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/[0.04] p-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-blue-500" />
                  <span>{ar ? 'أكثر يوم إنتاجية' : 'Peak Day'}</span>
                </span>
                <span className="font-mono text-blue-700 dark:text-blue-400 font-bold">{data.insights.mostProductiveDay.doneCount} {ar ? 'مهمة' : 'done'}</span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white font-['Alexandria']">
                {ar ? `يوم ${data.insights.mostProductiveDay.dayName}` : data.insights.mostProductiveDay.dayName}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                {ar
                  ? `أنجزت فيه ${data.insights.mostProductiveDay.doneCount} مهام بنسبة نجاح ${data.insights.mostProductiveDay.percentage}%.`
                  : `${data.insights.mostProductiveDay.doneCount} tasks finished with ${data.insights.mostProductiveDay.percentage}% completion.`}
              </p>
            </div>

          </div>

          {/* Narrative Paragraph Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#00C896]/10 text-[#008f6b] dark:text-[#00C896] mt-1">
              <Star className="w-5 h-5" />
            </span>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Alexandria']">
                {ar ? 'مراجعة الأسبوع بأسلوب إنساني' : 'Human Narrative Review'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed font-['Alexandria','Cairo',sans-serif]">
                «{data.insights.narrativeParagraph}»
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 10 — My Weekly Achievements (إنجازات تستحق أن تفتخر بها)          */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-10-heading" className="space-y-3.5">
          <div>
            <h2 id="section-10-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif] flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>{ar ? 'إنجازات تستحق أن تفتخر بها' : 'My Weekly Achievements'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {ar ? 'أوسمة ونقاط مضيئة تحققت بفضل ثباتك واجتهادك هذا الأسبوع.' : 'Milestones and badges unlocked by your actual effort.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all ${
                  ach.unlocked
                    ? 'border-emerald-500/30 bg-emerald-500/[0.04] dark:bg-emerald-950/20 shadow-2xs'
                    : 'border-slate-200/60 bg-slate-50/60 dark:border-white/[0.04] dark:bg-white/[0.02] opacity-60'
                }`}
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  ach.unlocked ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 text-slate-400 dark:bg-white/[0.08]'
                }`}>
                  <Award className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate font-['Alexandria']">
                      {ach.title}
                    </h4>
                    {ach.metricValue && (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-[#00C896] shrink-0">
                        {ach.metricValue}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-0.5">
                    {ach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 11 — Unfinished Business (ما الذي لم يكتمل هذا الأسبوع؟)           */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-11-heading" className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="section-11-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>{ar ? 'ما الذي لم يكتمل هذا الأسبوع؟' : 'Unfinished Business'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {ar ? 'مراجعة هادئة للمهام غير المكتملة دون إحباط، مع خيار ترحيلها إلى اليوم بضغطة واحدة.' : 'Constructive review of incomplete tasks with one-click rollover to today.'}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
              {data.unfinishedTasks.length} {ar ? 'مهام متبقية' : 'tasks'}
            </span>
          </div>

          {data.unfinishedTasks.length > 0 ? (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pe-1">
              {data.unfinishedTasks.slice(0, 15).map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {t.title}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>{t.dayName} ({t.date.slice(8)})</span>
                      <span>•</span>
                      <span>{t.category}</span>
                      {t.notDoneReason && (
                        <>
                          <span>•</span>
                          <span className="text-amber-700 dark:text-amber-300 italic">{t.notDoneReason}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRolloverTask(t.title, t.category)}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-[#00C896] text-slate-700 dark:text-slate-200 hover:text-[#00C896] transition-all cursor-pointer shrink-0 shadow-2xs"
                  >
                    <span>{ar ? 'ترحيل إلى اليوم' : 'Rollover to today'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-emerald-600 dark:text-[#00C896] font-bold">
              {ar ? 'أحسنت! لا توجد مهام عالقة أو غير مكتملة هذا الأسبوع.' : 'Brilliant! All tasks were accomplished.'}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION 12 — Next Week, Better (كيف تجعل أسبوعك القادم أفضل؟)              */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-12-heading" className="space-y-4">
          <div className="space-y-1">
            <h2 id="section-12-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif] flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#00C896]" />
              <span>{ar ? 'كيف تجعل أسبوعك القادم أفضل؟ (3 توصيات عملية)' : 'Next Week, Better'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              {ar ? 'توصيات واقعية وقابلة للتطبيق مستخرجة مباشرة من نقاط القوة والضعف في أسبوعك.' : 'Realistic recommendations tailored directly to your weekly habits.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#111622] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#00C896]/10 text-[#008f6b] dark:text-[#00C896] border border-[#00C896]/20 font-['Alexandria']">
                    <Zap className="w-3 h-3" />
                    <span>{ar ? 'توصية مخصصة' : 'Recommendation'}</span>
                  </span>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-['Alexandria'] leading-snug">
                    {rec.title}
                  </h3>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    <p><strong className="text-slate-800 dark:text-white">{ar ? 'السبب:' : 'Reason:'}</strong> {rec.reason}</p>
                    <p><strong className="text-slate-800 dark:text-white">{ar ? 'الخطوة المقترحة:' : 'Step:'}</strong> {rec.suggestedStep}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] text-[11px] font-semibold text-emerald-700 dark:text-[#00C896]">
                  {ar ? 'الفائدة المتوقعة: ' : 'Benefit: '}{rec.expectedBenefit}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 13 — Weekly Closing Summary (الخاتمة وحصاد الأسبوع)                 */}
        {/* ========================================================================= */}
        <footer aria-labelledby="section-13-heading" className="rounded-3xl border border-[#00C896]/40 bg-gradient-to-br from-emerald-500/10 via-white to-amber-500/5 dark:from-[#0e1920] dark:via-[#111622] dark:to-[#171b1e] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#008f6b] dark:text-[#00C896]">
              {ar ? 'حصاد أسبوعك الكامل' : 'Full Harvest Summary'}
            </span>
            <h2 id="section-13-heading" className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif]">
              {ar ? 'هذا كان أسبوعك... وكل خطوة محسوبة' : 'This Was Your Week... Every Step Counts'}
            </h2>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 font-medium leading-relaxed max-w-3xl">
              {data.closing.summaryText}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] space-y-1">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">{ar ? 'أبرز إنجازاتك:' : 'Highlight:'}</span>
              <p className="text-slate-700 dark:text-slate-300">{data.closing.topHighlight}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] space-y-1">
              <span className="font-bold text-amber-800 dark:text-amber-300 block">{ar ? 'أهم فرصة للتحسين:' : 'Growth Area:'}</span>
              <p className="text-slate-700 dark:text-slate-300">{data.closing.growthOpportunity}</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic">
            «{data.closing.encouragingMessage}»
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-white/10 hover:border-[#00C896] text-slate-800 dark:text-white transition-all cursor-pointer shadow-2xs"
            >
              <span>{ar ? 'استعراض الأسبوع السابق' : 'Browse Previous Week'}</span>
              <ChevronRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            </button>

            <button
              type="button"
              onClick={handleResetToCurrentWeek}
              className="inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#00C896] hover:bg-[#00b587] text-slate-950 transition-all cursor-pointer shadow-sm"
            >
              <span>{ar ? 'جدول اليوم في المخطط' : 'Go to Today in Planner'}</span>
              <ArrowUpRight className="w-4 h-4 rtl:rotate-[-90deg] ltr:rotate-0" />
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-white/10 hover:border-[#00C896] text-slate-800 dark:text-white transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>{ar ? 'تصدير التقرير الكامل' : 'Export Full Report'}</span>
            </button>
          </div>
        </footer>

      </div>

    </div>
  );
};
