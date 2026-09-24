import React from 'react';
import { Target, Trophy, Sparkles, CheckCircle2, Clock, XCircle, ListTodo } from 'lucide-react';
import { DayStats, Language, StatusFilter } from '../types';

interface TodayProgressProps {
  stats: DayStats;
  currentFilter?: StatusFilter;
  onFilterChange?: (filter: StatusFilter) => void;
  lang: Language;
}

interface StatCircleProps {
  label: string;
  value: number;
  total: number;
  percentage: number;
  color: 'emerald' | 'amber' | 'rose' | 'indigo';
  filterKey: StatusFilter;
  isActive: boolean;
  onClick: () => void;
  subLabel?: string;
}

const StatCircle: React.FC<StatCircleProps> = ({
  label,
  value,
  percentage,
  color,
  isActive,
  onClick,
  subLabel,
}) => {
  const radius = 23;
  const circumference = 2 * Math.PI * radius; // ≈ 144.51
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, percentage))) / 100;

  const colorConfig = {
    emerald: {
      stroke: '#10b981',
      bgGlow: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-600 dark:text-emerald-400',
      activeRing: 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-emerald-500/15 dark:text-emerald-500/10',
    },
    amber: {
      stroke: '#f59e0b',
      bgGlow: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-600 dark:text-amber-400',
      activeRing: 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-amber-500/15 dark:text-amber-500/10',
    },
    rose: {
      stroke: '#f43f5e',
      bgGlow: 'bg-rose-500/10 dark:bg-rose-500/15',
      text: 'text-rose-600 dark:text-rose-400',
      activeRing: 'ring-2 ring-rose-500 ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-rose-500/15 dark:text-rose-500/10',
    },
    indigo: {
      stroke: '#6366f1',
      bgGlow: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      text: 'text-indigo-600 dark:text-indigo-400',
      activeRing: 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-indigo-500/15 dark:text-indigo-500/10',
    },
  }[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center cursor-pointer transition-all duration-200 select-none active:scale-95 focus:outline-none ${
        isActive ? 'scale-105' : 'hover:scale-105 opacity-90 hover:opacity-100'
      }`}
      aria-label={`${label}: ${value}`}
    >
      {/* Circle Body */}
      <div
        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xs ${
          colorConfig.bgGlow
        } ${isActive ? colorConfig.activeRing : 'hover:shadow-xs'}`}
      >
        <svg
          viewBox="0 0 54 54"
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none transform-gpu"
        >
          {/* Background track */}
          <circle
            cx="27"
            cy="27"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            className={colorConfig.track}
          />
          {/* Active progress arc */}
          {percentage > 0 && (
            <circle
              cx="27"
              cy="27"
              r={radius}
              fill="none"
              stroke={colorConfig.stroke}
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          )}
        </svg>

        {/* Number inside Circle */}
        <span
          className={`font-numbers text-base sm:text-lg font-black tracking-tight ${colorConfig.text}`}
        >
          {value}
        </span>
      </div>

      {/* Label & Details underneath Circle */}
      <div className="flex flex-col items-center mt-1.5 leading-tight text-center max-w-[70px]">
        <span
          className={`text-[11px] sm:text-xs font-bold font-['Alexandria'] truncate ${
            isActive ? colorConfig.text : 'text-slate-700 dark:text-zinc-300'
          }`}
        >
          {label}
        </span>
        {subLabel && (
          <span className="text-[10px] font-numbers font-medium text-slate-400 dark:text-zinc-500 mt-0.5">
            {subLabel}
          </span>
        )}
      </div>
    </button>
  );
};

export const TodayProgress: React.FC<TodayProgressProps> = ({
  stats,
  currentFilter,
  onFilterChange,
  lang,
}) => {
  const percentage = Math.min(100, Math.max(0, stats.completionPercentage || 0));
  const isAllComplete = stats.total > 0 && stats.done === stats.total;
  const remaining = Math.max(0, stats.total - stats.done - stats.notDone);

  // SVG circular calculation for the main gauge (r = 40 => circumference ≈ 251.327)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  // Motivational short phrase for badge
  const getMotivationalHint = () => {
    if (stats.total === 0) {
      return lang === 'ar' ? 'أضف مهامك لتبدأ تتبع إنجازك ✨' : 'Add tasks to start tracking ✨';
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

  // Motivational title replacing "نسبة الإنجاز الكلية"
  const getMotivationalTitle = () => {
    if (stats.total === 0) {
      return lang === 'ar' ? 'اصنع يومك المميز الآن 💫' : 'Shape your extraordinary day 💫';
    }
    if (isAllComplete) {
      return lang === 'ar' ? 'قمة الإنجاز والتميز! 🏆' : 'Peak of achievement! 🏆';
    }
    if (percentage >= 75) {
      return lang === 'ar' ? 'طاقة حماسية تقترب من القمة! ⚡' : 'Unstoppable momentum! ⚡';
    }
    if (percentage >= 50) {
      return lang === 'ar' ? 'زخم رائع.. أنت تصنع الفارق! 🔥' : 'Great momentum, keep going! 🔥';
    }
    if (percentage > 0) {
      return lang === 'ar' ? 'خطواتك اليوم تبني مستقبلك! 🚀' : 'Every step builds your future! 🚀';
    }
    return lang === 'ar' ? 'انطلق بعزيمة واصنع إنجازك! 💪' : 'Ignite your drive and achieve! 💪';
  };

  // Motivational subtitle replacing "انقر على أي دائرة للتصفية"
  const getMotivationalSubtitle = () => {
    if (isAllComplete) {
      return lang === 'ar'
        ? 'أثبتت أنك قادر على كل شيء • استمتع بثمرة مجهودك 🌟'
        : 'You proved you can conquer anything • celebrate your win 🌟';
    }
    if (percentage >= 50) {
      return lang === 'ar'
        ? 'واصل التألق، كل مهمة تنهيها فوز جديد لك 🎯'
        : 'Keep shining, every task finished is another win 🎯';
    }
    if (percentage > 0) {
      return lang === 'ar'
        ? 'كل خطوة تقربك من هدفك • اضغط الدوائر وتابع شغفك ✨'
        : 'Every step brings you closer • tap circles to explore ✨';
    }
    return lang === 'ar'
      ? 'طاقتك اليوم تصنع الفرق • المس أي دائرة لمتابعة مهامك 🎯'
      : 'Your energy makes the difference • tap circles to start 🎯';
  };

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-[#11131a] border rounded-2xl p-4 sm:p-5 shadow-xs transition-all duration-300 ${
        isAllComplete
          ? 'border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.12)] dark:border-emerald-500/30'
          : 'border-slate-200/90 dark:border-white/[0.08]'
      }`}
    >
      <div className="flex flex-col gap-4">
        
        {/* Top Row: Title, Subtitle, and Motivational Hint Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-white/[0.05]">
          
          {/* Icon + Title + Task Summary */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
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
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-['Alexandria'] truncate">
                  {lang === 'ar' ? 'مؤشر إنجاز اليوم' : "Today's Progress"}
                </h2>
                {isAllComplete && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{lang === 'ar' ? 'مكتمل' : 'Completed'}</span>
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate font-medium">
                {stats.total === 0
                  ? (lang === 'ar' ? 'لا توجد مهام مسجلة لهذا اليوم' : 'No tasks scheduled for today')
                  : isAllComplete
                  ? (lang === 'ar' ? `اكتملت جميع المهام بنجاح (${stats.done} من ${stats.total})` : `All ${stats.total} tasks completed successfully`)
                  : (lang === 'ar' ? `تم إنجاز ${stats.done} من أصل ${stats.total} مهام` : `${stats.done} of ${stats.total} tasks completed`)}
              </p>
            </div>
          </div>

          {/* Motivational Hint Badge */}
          <div className="self-start sm:self-center shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-['Alexandria']">{getMotivationalHint()}</span>
            </div>
          </div>

        </div>

        {/* Main Section: Circular Progress Gauge + 4 Circular Metric Gauges (دوائر تفاعلية بدلاً من البطاقات) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 pt-0.5">
          
          {/* Main Circular Progress Gauge */}
          <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto justify-center md:justify-start shrink-0">
            <div className="relative shrink-0 flex items-center justify-center">
              {/* Subtle ambient energetic glow */}
              <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-cyan-500/20 blur-md pointer-events-none" />

              <svg
                viewBox="0 0 100 100"
                className="w-24 h-24 sm:w-28 sm:h-28 -rotate-90 shrink-0 transform-gpu"
                aria-label={`Progress: ${percentage}%`}
              >
                <defs>
                  <linearGradient id="todayProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="todayProgressCompleteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>

                {/* Background ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100 dark:text-white/[0.07]"
                />

                {/* Active progress arc */}
                {percentage > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={isAllComplete ? 'url(#todayProgressCompleteGrad)' : 'url(#todayProgressGrad)'}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                )}
              </svg>

              {/* Inner Content inside Circle */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                {isAllComplete ? (
                  <div className="flex flex-col items-center justify-center leading-none">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 drop-shadow-xs mb-1 animate-pulse" />
                    <div className="flex items-baseline justify-center font-numbers">
                      <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 bg-clip-text text-transparent">
                        100
                      </span>
                      <span className="text-[11px] sm:text-xs font-black text-amber-500 ms-0.5">
                        %
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center leading-none">
                    <div className="flex items-baseline justify-center font-numbers">
                      <span className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent drop-shadow-xs">
                        {percentage}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-cyan-600 dark:text-cyan-400 ms-0.5">
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Motivational Title & Subtitle beside main circle */}
            <div className="flex flex-col justify-center min-w-0 max-w-[220px]">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-['Alexandria'] leading-snug">
                {getMotivationalTitle()}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium leading-relaxed font-['Alexandria']">
                {getMotivationalSubtitle()}
              </span>
            </div>
          </div>

          {/* 4 Circular Metric Gauges (دوائر الإحصائيات الأربعة) - بدون بطاقات */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full md:w-auto justify-items-center pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/[0.05]">
            
            {/* 1. Completed (دائرة مكتملة) */}
            <StatCircle
              label={lang === 'ar' ? 'مكتملة' : 'Done'}
              value={stats.done}
              total={stats.total}
              percentage={stats.total > 0 ? (stats.done / stats.total) * 100 : 0}
              color="emerald"
              filterKey="done"
              isActive={currentFilter === 'done'}
              onClick={() => onFilterChange?.(currentFilter === 'done' ? 'all' : 'done')}
              subLabel={stats.total > 0 ? `${Math.round((stats.done / stats.total) * 100)}%` : undefined}
            />

            {/* 2. Remaining (دائرة متبقية) */}
            <StatCircle
              label={lang === 'ar' ? 'متبقية' : 'Remaining'}
              value={remaining}
              total={stats.total}
              percentage={stats.total > 0 ? (remaining / stats.total) * 100 : 0}
              color="amber"
              filterKey="pending"
              isActive={currentFilter === 'pending'}
              onClick={() => onFilterChange?.(currentFilter === 'pending' ? 'all' : 'pending')}
              subLabel={stats.total > 0 ? `${Math.round((remaining / stats.total) * 100)}%` : undefined}
            />

            {/* 3. Not Done (دائرة غير منجزة) */}
            <StatCircle
              label={lang === 'ar' ? 'غير منجزة' : 'Not Done'}
              value={stats.notDone}
              total={stats.total}
              percentage={stats.total > 0 ? (stats.notDone / stats.total) * 100 : 0}
              color="rose"
              filterKey="not-done"
              isActive={currentFilter === 'not-done'}
              onClick={() => onFilterChange?.(currentFilter === 'not-done' ? 'all' : 'not-done')}
              subLabel={stats.total > 0 && stats.notDone > 0 ? `${Math.round((stats.notDone / stats.total) * 100)}%` : undefined}
            />

            {/* 4. Total (دائرة الإجمالي) */}
            <StatCircle
              label={lang === 'ar' ? 'الإجمالي' : 'Total'}
              value={stats.total}
              total={stats.total}
              percentage={stats.total > 0 ? 100 : 0}
              color="indigo"
              filterKey="all"
              isActive={currentFilter === 'all'}
              onClick={() => onFilterChange?.('all')}
              subLabel={lang === 'ar' ? 'مهمة' : 'tasks'}
            />

          </div>

        </div>

      </div>
    </div>
  );
};
