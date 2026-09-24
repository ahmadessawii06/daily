import React, { useState, useRef, useMemo } from 'react';
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
  Layers,
  Calendar,
  Zap,
  Info
} from 'lucide-react';
import { Language, Task } from '../types';
import { analyzeWeek, WeeklyAnalysisResult, CategoryStat } from '../utils/weeklyAnalytics';
import { addDays, getTodayDateString, formatHeaderDate } from '../utils/date';
import { toPng } from 'html-to-image';

interface WeeklyReviewProps {
  lang: Language;
  onNavigateToDay: (dateStr: string) => void;
}

export const WeeklyReview: React.FC<WeeklyReviewProps> = ({
  lang,
  onNavigateToDay,
}) => {
  // Reference date for the week (defaults to today)
  const [weekEndDate, setWeekEndDate] = useState<string>(() => getTodayDateString());
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ dayName: string; time: string; title?: string; status?: string } | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  // Compute analytics memoized
  const data: WeeklyAnalysisResult = useMemo(() => {
    return analyzeWeek(weekEndDate, lang);
  }, [weekEndDate, lang]);

  const handlePrevWeek = () => {
    setWeekEndDate((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setWeekEndDate((prev) => addDays(prev, 7));
  };

  const handleResetToCurrentWeek = () => {
    setWeekEndDate(getTodayDateString());
  };

  // Export weekly review card as PNG
  const handleExportImage = async () => {
    if (!reportRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#090a0f',
      });
      const link = document.createElement('a');
      link.download = `daily-track-weekly-${data.startDate}-to-${data.endDate}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export weekly report error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Helper for Category icons
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'worship':
        return MoonStar;
      case 'study':
        return BookOpen;
      case 'work_dev':
        return Code2;
      case 'fitness':
        return Flame;
      case 'health_nutrition':
        return HeartPulse;
      case 'sleep_rest':
        return Bed;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 transition-colors">
      
      {/* 1. Header & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#11131a] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
        
        {/* Title & Badge */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Alexandria']">
              {lang === 'ar' ? 'التراك الأسبوعي' : 'Weekly Track'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <Sparkles className="w-3 h-3 stroke-[2.5]" />
              {lang === 'ar' ? 'تحليل ذكي' : 'Smart Insights'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium font-['Alexandria']">
            {data.rangeLabel}
          </p>
        </div>

        {/* Navigation & Export Actions */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          
          {/* Week Navigation Buttons */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-white/[0.06] rounded-xl p-1 border border-slate-200/80 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={handlePrevWeek}
              title={lang === 'ar' ? 'الأسبوع السابق' : 'Previous Week'}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
            <button
              type="button"
              onClick={handleResetToCurrentWeek}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-['Alexandria'] cursor-pointer"
            >
              {lang === 'ar' ? 'هذا الأسبوع' : 'This Week'}
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              title={lang === 'ar' ? 'الأسبوع التالي' : 'Next Week'}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>

          {/* Export button */}
          <button
            type="button"
            onClick={handleExportImage}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-800 dark:text-zinc-200 border border-slate-200/80 dark:border-white/[0.08] transition-all cursor-pointer font-['Alexandria']"
          >
            <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
            <span className="hidden sm:inline">{isExporting ? (lang === 'ar' ? 'جاري التصدير...' : 'Exporting...') : (lang === 'ar' ? 'تصدير التقرير' : 'Export')}</span>
          </button>

        </div>
      </div>

      {/* Main Report Container for Visualization & Export */}
      <div ref={reportRef} className="space-y-6">
        
        {/* 2. شريط ملخص علوي (Summary Bar & Key Metrics) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: نسبة الإنجاز الإجمالية للأسبوع */}
          <div className="bg-white dark:bg-[#11131a] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 font-['Alexandria']">
              {lang === 'ar' ? 'نسبة إنجاز الأسبوع' : 'Weekly Completion'}
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {data.overallPercentage}%
              </span>
              <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">
                ({data.totalDoneCount}/{data.totalTasksCount})
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1.5 mt-3 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${data.overallPercentage}%` }} 
              />
            </div>
          </div>

          {/* Card 2: مقارنة مع الأسبوع السابق */}
          <div className="bg-white dark:bg-[#11131a] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 font-['Alexandria']">
              {lang === 'ar' ? 'مقارنة بالأسبوع السابق' : 'Vs. Last Week'}
            </span>
            <div className="flex items-center gap-2 mt-2">
              {data.diffFromLastWeek >= 0 ? (
                <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-2xl sm:text-3xl font-black font-mono">
                  <ArrowUpRight className="w-6 h-6 stroke-[3]" />
                  <span>+{data.diffFromLastWeek}%</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 text-2xl sm:text-3xl font-black font-mono">
                  <ArrowDownRight className="w-6 h-6 stroke-[3]" />
                  <span>{data.diffFromLastWeek}%</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-2 font-medium font-['Alexandria']">
              {lang === 'ar' ? `الأسبوع الماضي كان: ${data.previousWeekPercentage}%` : `Last week was ${data.previousWeekPercentage}%`}
            </p>
          </div>

          {/* Card 3: الأيام المكتملة (High Output Days) */}
          <div className="bg-white dark:bg-[#11131a] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 font-['Alexandria']">
              {lang === 'ar' ? 'أيام مكتملة (≥85%)' : 'High Focus Days'}
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white">
                {data.completedDaysCount}
              </span>
              <span className="text-xs text-slate-400 dark:text-zinc-500 font-['Alexandria']">
                {lang === 'ar' ? 'من أصل 7 أيام' : 'of 7 days'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium font-['Alexandria'] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              {lang === 'ar' ? 'استمرارية ممتازة' : 'Great consistency'}
            </p>
          </div>

          {/* Card 4: الأيام الضعيفة (<50%) */}
          <div className="bg-white dark:bg-[#11131a] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 font-['Alexandria']">
              {lang === 'ar' ? 'أيام منخفضة (<50%)' : 'Low Output Days'}
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-amber-600 dark:text-amber-400">
                {data.weakDaysCount}
              </span>
              <span className="text-xs text-slate-400 dark:text-zinc-500 font-['Alexandria']">
                {lang === 'ar' ? 'من أصل 7 أيام' : 'of 7 days'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 font-medium font-['Alexandria']">
              {data.weakDaysCount === 0 
                ? (lang === 'ar' ? 'أسبوع متوازن بدون تعثر' : 'Clean week without dips')
                : (lang === 'ar' ? 'فرصة للتعويض الأسبوع القادم' : 'Room to bounce back')}
            </p>
          </div>

        </div>

        {/* 3. الشارتات التحليلية الرئيسية (Charts Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Bar Chart أسبوعي: نسبة الإنجاز لكل يوم من أيام الأسبوع الـ 7 */}
          <div className="lg:col-span-7 bg-white dark:bg-[#11131a] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Alexandria']">
                  {lang === 'ar' ? 'الأداء اليومي عبر الأسبوع' : 'Daily Performance'}
                </h3>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-['Alexandria']">
                  {lang === 'ar' ? 'انقر على أي يوم لفتح جدوله بالتفصيل' : 'Click any day to jump to its schedule'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400">
                7 Days
              </span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="flex items-end justify-between gap-2 sm:gap-4 h-48 pt-6 pb-2 px-1 border-b border-slate-100 dark:border-white/[0.06]">
              {data.days.map((day) => {
                let barColor = 'bg-emerald-500';
                if (day.percentage < 50) barColor = 'bg-rose-500';
                else if (day.percentage < 75) barColor = 'bg-amber-500';

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => onNavigateToDay(day.date)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Value Badge above bar */}
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {day.percentage}%
                    </span>

                    {/* Bar Pillar */}
                    <div className="w-full max-w-[36px] bg-slate-100 dark:bg-white/[0.05] rounded-t-lg h-full flex items-end overflow-hidden p-0.5">
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 group-hover:brightness-110 ${barColor}`}
                        style={{ height: `${Math.max(day.percentage, 6)}%` }}
                      />
                    </div>

                    {/* Day Name */}
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-zinc-300 mt-2 font-['Alexandria'] truncate">
                      {day.dayName}
                    </span>
                    {/* Day Date */}
                    <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500">
                      {day.date.slice(8)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Color threshold legend */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 text-[11px] font-medium text-slate-500 dark:text-zinc-400 font-['Alexandria']">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {lang === 'ar' ? 'ممتاز (≥75%)' : 'High (≥75%)'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                {lang === 'ar' ? 'متوسط (50-74%)' : 'Medium (50-74%)'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                {lang === 'ar' ? 'ضعيف (<50%)' : 'Low (<50%)'}
              </span>
            </div>
          </div>

          {/* Bar أفقي لفئات المهام (Category Breakdown) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#11131a] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Alexandria']">
                  {lang === 'ar' ? 'إنجاز فئات المهام' : 'Category Breakdown'}
                </h3>
                <span className="text-xs text-slate-400 dark:text-zinc-500 font-['Alexandria']">
                  {lang === 'ar' ? 'طوال الأسبوع' : 'Full Week'}
                </span>
              </div>

              {/* Category bars list */}
              <div className="space-y-3">
                {data.categories.map((cat) => {
                  const CatIcon = getCategoryIcon(cat.id);
                  let barColor = 'bg-emerald-500';
                  if (cat.percentage < 50) barColor = 'bg-rose-500';
                  else if (cat.percentage < 70) barColor = 'bg-amber-500';

                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CatIcon className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate font-['Alexandria']">
                            {lang === 'ar' ? cat.name : cat.nameEn}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono">
                          <span className="text-slate-400 dark:text-zinc-500 text-[11px]">
                            {cat.done}/{cat.total}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-white text-xs">
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-4 font-['Alexandria']">
              {lang === 'ar' 
                ? 'يتم تصنيف المهام آلياً استناداً إلى اسم المهمة وطبيعتها اليومية.'
                : 'Tasks are automatically classified according to title keywords and context.'}
            </p>
          </div>

        </div>

        {/* 4. Heatmap مصغر: شبكة 7 أيام × 24 ساعة */}
        <div className="bg-white dark:bg-[#11131a] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Alexandria'] flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                <span>{lang === 'ar' ? 'الخريطة الحرارية لساعات اليوم (Heatmap 7x24)' : 'Weekly 24h Heatmap'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-['Alexandria'] mt-0.5">
                {lang === 'ar' 
                  ? 'اكتشف بصرياً أي فترات اليوم تكون فيها أكثر إنتاجية وتفويتاً للمهام'
                  : 'Visually detect peak productivity hours and drop-off periods'}
              </p>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-zinc-400 font-['Alexandria']">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                {lang === 'ar' ? 'منجزة' : 'Done'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                {lang === 'ar' ? 'انتظار' : 'Pending'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                {lang === 'ar' ? 'غير منجزة' : 'Not Done'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-white/[0.08]" />
                {lang === 'ar' ? 'فارغ' : 'Empty'}
              </span>
            </div>
          </div>

          {/* Grid Container */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[680px]">
              
              {/* Hour Labels Header (00 to 23) */}
              <div className="flex items-center ms-20 sm:ms-24 mb-1">
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="flex-1 text-center text-[9px] font-mono text-slate-400 dark:text-zinc-500">
                    {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
                  </div>
                ))}
              </div>

              {/* 7 Days Rows */}
              <div className="space-y-1.5">
                {data.days.map((day) => (
                  <div key={day.date} className="flex items-center gap-2">
                    
                    {/* Day Label on the left/start */}
                    <div 
                      onClick={() => onNavigateToDay(day.date)}
                      className="w-18 sm:w-22 text-xs font-bold text-slate-700 dark:text-zinc-300 font-['Alexandria'] truncate cursor-pointer hover:text-emerald-500 shrink-0"
                    >
                      {day.dayName} <span className="text-[10px] font-mono text-slate-400 font-normal">{day.date.slice(8)}</span>
                    </div>

                    {/* 24 Cells */}
                    <div className="flex-1 flex items-center gap-1">
                      {Array.from({ length: 24 }).map((_, h) => {
                        const timeStr = `${String(h).padStart(2, '0')}:00`;
                        const foundTask = day.tasks.find((t) => t.time && t.time.startsWith(String(h).padStart(2, '0')));

                        let cellClass = 'bg-slate-100 dark:bg-white/[0.04] border-transparent';
                        if (foundTask && foundTask.title && foundTask.title.trim()) {
                          if (foundTask.status === 'done') {
                            cellClass = 'bg-emerald-500 hover:brightness-110';
                          } else if (foundTask.status === 'pending') {
                            cellClass = 'bg-amber-500 hover:brightness-110';
                          } else if (foundTask.status === 'not-done') {
                            cellClass = 'bg-rose-500 hover:brightness-110';
                          }
                        }

                        return (
                          <div
                            key={h}
                            onMouseEnter={() => {
                              setHoveredCell({
                                dayName: day.dayName,
                                time: timeStr,
                                title: foundTask?.title,
                                status: foundTask?.status,
                              });
                            }}
                            onMouseLeave={() => setHoveredCell(null)}
                            title={`${day.dayName} ${timeStr}: ${foundTask?.title || (lang === 'ar' ? 'لا توجد مهمة' : 'No task')}`}
                            className={`flex-1 h-5 sm:h-6 rounded-xs transition-colors cursor-pointer border ${cellClass}`}
                          />
                        );
                      })}
                    </div>

                  </div>
                ))}
              </div>

              {/* Hover Preview Bar */}
              <div className="min-h-[24px] mt-2 text-xs font-medium text-slate-600 dark:text-zinc-400 font-['Alexandria'] flex items-center gap-2">
                {hoveredCell ? (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{hoveredCell.dayName} ({hoveredCell.time}):</span>
                    <span>{hoveredCell.title || (lang === 'ar' ? 'فترة فراغ / غير مسجلة' : 'Free slot')}</span>
                    {hoveredCell.status && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-white/[0.1]">
                        {hoveredCell.status}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 dark:text-zinc-500 text-[11px]">
                    {lang === 'ar' ? 'مرّر مؤشر الفأرة فوق أي مربع لرؤية تفاصيل المهمة وتوقيتها' : 'Hover over any cell to see task details'}
                  </span>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* 5. بطاقات التحليل الذكي الثلاث: الأقوى، الأضعف، وتحتاج تطوير */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Card 1: أقوى نقطة (Top Strength) */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-900/10 dark:to-transparent p-5 rounded-2xl border border-emerald-500/30 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-['Alexandria']">
                  <Award className="w-3.5 h-3.5 stroke-[2.5]" />
                  {lang === 'ar' ? 'أقوى نقطة هذا الأسبوع' : 'Top Strength'}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  #1
                </span>
              </div>

              {data.topStrength ? (
                <>
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-white font-['Alexandria'] flex items-center gap-2">
                    <span>{lang === 'ar' ? data.topStrength.name : data.topStrength.nameEn}</span>
                  </h4>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {data.topStrength.percentage}%
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 font-['Alexandria']">
                      ({data.topStrength.done} {lang === 'ar' ? 'من أصل' : 'of'} {data.topStrength.total})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 mt-3 font-medium font-['Alexandria'] leading-relaxed">
                    {lang === 'ar'
                      ? `أداء استثنائي والتزام رائع بنسبة ${data.topStrength.percentage}%! هذا الركن هو صمام أمان إنتاجيتك واستمراره يعطيك دافعاً لبقية المهام.`
                      : `Exceptional consistency at ${data.topStrength.percentage}%! This is your strongest foundation this week.`}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 font-['Alexandria']">
                  {lang === 'ar' ? 'سجل مهامك لـ 3 أيام على الأقل لعرض أقوى نقطة.' : 'Record tasks for at least 3 days to reveal strengths.'}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold font-['Alexandria']">
              <Flame className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{lang === 'ar' ? 'الأفضل إنجازاً والأكثر ثباتاً' : 'Highest consistency'}</span>
            </div>
          </div>

          {/* Card 2: أضعف نقطة (Top Weakness) */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-amber-900/10 dark:to-transparent p-5 rounded-2xl border border-amber-500/30 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-800 dark:text-amber-300 font-['Alexandria']">
                  <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                  {lang === 'ar' ? 'أضعف نقطة هذا الأسبوع' : 'Top Weakness'}
                </span>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  Attention
                </span>
              </div>

              {data.topWeakness ? (
                <>
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-white font-['Alexandria']">
                    {lang === 'ar' ? data.topWeakness.name : data.topWeakness.nameEn}
                  </h4>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                      {data.topWeakness.percentage}%
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 font-['Alexandria']">
                      ({data.topWeakness.done} {lang === 'ar' ? 'من أصل' : 'of'} {data.topWeakness.total})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 mt-3 font-medium font-['Alexandria'] leading-relaxed">
                    {lang === 'ar'
                      ? `تم تفويت ${data.topWeakness.notDone + data.topWeakness.pending} مرات هذا الأسبوع. لا داعي للإحباط؛ التركيز عليها كأولوية في بداية اليوم سيرفع معدلها سريعاً.`
                      : `Missed ${data.topWeakness.notDone + data.topWeakness.pending} times this week. Prioritizing it earlier in your day will yield quick improvements.`}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 font-['Alexandria']">
                  {lang === 'ar' ? 'لا توجد نقاط ضعف واضحة؛ جميع الفئات فوق المعدل!' : 'No major weaknesses detected!'}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 font-bold font-['Alexandria']">
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{lang === 'ar' ? 'تحتاج ضبط التوقيت وإعادة الجدولة' : 'Needs time adjustment'}</span>
            </div>
          </div>

          {/* Card 3: سكشن "نقاط تحتاج تطوير" (Areas to Improve) */}
          <div className="bg-white dark:bg-[#11131a] p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-zinc-200 font-['Alexandria'] border border-slate-200 dark:border-white/[0.08]">
                  <Zap className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
                  {lang === 'ar' ? 'نقاط تحتاج تطوير' : 'Areas to Improve'}
                </span>
                <span className="text-xs text-slate-400 dark:text-zinc-500 font-['Alexandria']">
                  {data.improvements.length} {lang === 'ar' ? 'اقتراحات' : 'items'}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 mt-3">
                {data.improvements.length > 0 ? (
                  data.improvements.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white font-['Alexandria']">
                          {item.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          {item.percentage}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-white/[0.08] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-['Alexandria'] leading-relaxed">
                        {lang === 'ar' ? item.advice : item.adviceEn}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-['Alexandria']">
                    {lang === 'ar' 
                      ? 'جميع فئات مهامك تعمل بكفاءة متوازنة هذا الأسبوع!' 
                      : 'All task categories performed smoothly this week!'}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] text-[11px] text-slate-400 dark:text-zinc-500 font-['Alexandria']">
              {lang === 'ar' ? 'النصائح مبنية على تحليل أوقات تفويت المهام' : 'Calculated based on missed time patterns'}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
