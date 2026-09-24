import React from 'react';
import { Target, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';
import { DayStats, Language, StatusFilter } from '../types';

interface TodayProgressProps {
  stats: DayStats;
  currentFilter?: StatusFilter;
  onFilterChange?: (filter: StatusFilter) => void;
  lang: Language;
}

export const TodayProgress: React.FC<TodayProgressProps> = ({
  stats,
  lang,
}) => {
  const percentage = Math.min(100, Math.max(0, stats.completionPercentage || 0));
  const isAllComplete = stats.total > 0 && stats.done === stats.total;
  const remaining = Math.max(0, stats.total - stats.done - stats.notDone);

  // Motivational short phrase
  const getMotivationalHint = () => {
    if (stats.total === 0) {
      return lang === 'ar' ? 'أضف مهامك لتبدأ تتبع إنجازك' : 'Add tasks to start tracking';
    }
    if (isAllComplete) {
      return lang === 'ar' ? 'إنجاز رائع لليوم! 🏆' : 'Awesome achievement today! 🏆';
    }
    if (percentage >= 75) {
      return lang === 'ar' ? 'أوشكت على خط النهاية! ⚡' : 'Almost at the finish line! ⚡';
    }
    if (percentage >= 50) {
      return lang === 'ar' ? 'تجاوزت المنتصف، استمر! 💪' : 'Over halfway, keep going! 💪';
    }
    if (percentage > 0) {
      return lang === 'ar' ? 'بداية موفقة، خطوة بخطوة ✨' : 'Great start, step by step ✨';
    }
    return lang === 'ar' ? 'انطلق وابدأ أول مهمة لليوم 🚀' : 'Start with your first task 🚀';
  };

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-[#11131a] border rounded-2xl p-4 sm:p-5 shadow-xs transition-all duration-300 ${
        isAllComplete
          ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)] dark:border-emerald-500/30'
          : 'border-slate-200/90 dark:border-white/[0.08]'
      }`}
    >
      <div className="flex flex-col gap-3.5">
        
        {/* Top Row: Title, Subtitle, and Clean Percentage Display */}
        <div className="flex items-center justify-between gap-3">
          
          {/* Icon + Title + Task Count */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isAllComplete
                  ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30'
                  : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isAllComplete ? (
                <Trophy className="w-5 h-5 stroke-[2.5]" />
              ) : percentage > 0 ? (
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <Target className="w-5 h-5 stroke-[2.5]" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-['Alexandria'] truncate">
                  {lang === 'ar' ? 'مؤشر إنجاز اليوم' : "Today's Progress"}
                </h2>
                {isAllComplete && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    <Sparkles className="w-3 h-3" />
                    <span>{lang === 'ar' ? 'مكتمل بالكامل' : 'Completed'}</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 truncate font-medium">
                {stats.total === 0
                  ? (lang === 'ar' ? 'لا توجد مهام مسجلة لهذا اليوم' : 'No tasks scheduled for today')
                  : isAllComplete
                  ? (lang === 'ar' ? `اكتملت جميع المهام بنجاح (${stats.done} من ${stats.total})` : `All ${stats.total} tasks completed successfully`)
                  : (lang === 'ar' ? `تم إنجاز ${stats.done} من أصل ${stats.total} مهام` : `${stats.done} of ${stats.total} tasks completed`)}
              </p>
            </div>
          </div>

          {/* Clean Percentage Display */}
          <div className="flex items-baseline gap-1 shrink-0 text-end">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {percentage}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-zinc-400">
              %
            </span>
          </div>

        </div>

        {/* Clean, Pristine Progress Bar (شريط إنجاز نظيف بدون تصنيفات) */}
        <div className="relative w-full h-3 sm:h-3.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isAllComplete
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                : percentage > 0
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'w-0'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Bottom Row: Neat, Organized Micro-Metrics & Status */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-0.5">
          <div className="flex items-center gap-3.5 sm:gap-5 flex-wrap">
            
            {/* Completed */}
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-medium text-slate-500 dark:text-zinc-400">
                {lang === 'ar' ? 'مكتملة:' : 'Done:'}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {stats.done}
              </span>
            </div>

            {/* Remaining */}
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="font-medium text-slate-500 dark:text-zinc-400">
                {lang === 'ar' ? 'متبقية:' : 'Remaining:'}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {remaining}
              </span>
            </div>

            {/* Not Done (if any) */}
            {stats.notDone > 0 && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="font-medium text-slate-500 dark:text-zinc-400">
                  {lang === 'ar' ? 'غير منجزة:' : 'Not Done:'}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {stats.notDone}
                </span>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-600 shrink-0" />
              <span className="font-medium">
                {lang === 'ar' ? 'الإجمالي:' : 'Total:'}
              </span>
              <span className="font-mono font-semibold text-slate-700 dark:text-zinc-300">
                {stats.total}
              </span>
            </div>

          </div>

          {/* Motivational Hint */}
          <span className="text-[11px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 ms-auto">
            {getMotivationalHint()}
          </span>
        </div>

      </div>
    </div>
  );
};

