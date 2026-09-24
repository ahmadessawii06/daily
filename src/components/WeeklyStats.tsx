import React, { useState } from 'react';
import { 
  Flame, 
  Trophy, 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  Plus, 
  BookOpen, 
  MoonStar, 
  Activity, 
  Check 
} from 'lucide-react';
import { HabitStreak, Language, WeeklyDayData } from '../types';
import { getCategoryMeta } from '../utils/categories';
import { ProgressRing } from './ProgressRing';

interface WeeklyStatsProps {
  weeklyData: WeeklyDayData[];
  habits: HabitStreak[];
  onToggleHabit: (habitId: string) => void;
  onOpenDate: (date: string) => void;
  currentDate: string;
  lang: Language;
}

export const WeeklyStats: React.FC<WeeklyStatsProps> = ({
  weeklyData,
  habits,
  onToggleHabit,
  onOpenDate,
  currentDate,
  lang,
}) => {
  // Compute overall weekly metrics
  const totalWeeklyTasks = weeklyData.reduce((acc, d) => acc + d.total, 0);
  const totalWeeklyDone = weeklyData.reduce((acc, d) => acc + d.done, 0);
  const overallPercentage = totalWeeklyTasks > 0 ? Math.round((totalWeeklyDone / totalWeeklyTasks) * 100) : 0;

  // Find most active day
  const bestDay = [...weeklyData].sort((a, b) => b.percentage - a.percentage)[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Weekly Completion Rate Card */}
        <div className="bg-white dark:bg-[#10121a] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <ProgressRing percentage={overallPercentage} size={64} strokeWidth={6} />
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 font-['Alexandria']">
              {lang === 'ar' ? 'معدل الإنجاز الأسبوعي' : 'Weekly Completion'}
            </span>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
              {overallPercentage}%
            </div>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
              {totalWeeklyDone} {lang === 'ar' ? 'من' : 'of'} {totalWeeklyTasks} {lang === 'ar' ? 'مهمة' : 'tasks'}
            </span>
          </div>
        </div>

        {/* Best Performing Day Card */}
        <div className="bg-white dark:bg-[#10121a] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 font-['Alexandria']">
              {lang === 'ar' ? 'اليوم الأكثر إنتاجية' : 'Most Productive Day'}
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white font-['Alexandria'] mt-0.5">
              {bestDay ? (lang === 'ar' ? bestDay.dayNameAr : bestDay.dayNameEn) : '-'}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              {bestDay ? `${bestDay.percentage}% إنجاز` : '-'}
            </span>
          </div>
        </div>

        {/* Active Habit Streaks Summary Card */}
        <div className="bg-white dark:bg-[#10121a] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 stroke-[2.4]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 font-['Alexandria']">
              {lang === 'ar' ? 'العادات المتكررة النشطة' : 'Active Habit Streaks'}
            </span>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
              {habits.length} {lang === 'ar' ? 'عادات' : 'habits'}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
              {lang === 'ar' ? 'متابعة يومية متواصلة' : 'Daily continuous track'}
            </span>
          </div>
        </div>

      </div>

      {/* Weekly Daily Completion Bar Chart */}
      <div className="bg-white dark:bg-[#10121a] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-['Alexandria']">
              {lang === 'ar' ? 'رسم بياني للإنجاز اليومي خلال الأسبوع' : 'Weekly Daily Progress Chart'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {lang === 'ar' ? 'نسبة إنجاز المهام لكل يوم من أيام الأسبوع' : 'Task completion percentage for each day'}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.05]">
            {weeklyData[0]?.shortDate} - {weeklyData[weeklyData.length - 1]?.shortDate}
          </span>
        </div>

        {/* Bars Container */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 sm:h-56 pt-6 border-b border-slate-100 dark:border-white/[0.06] pb-2">
          {weeklyData.map((day) => {
            const isToday = day.isToday;
            const barHeightPercent = Math.max(8, day.percentage);

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onOpenDate(day.date)}
                className="group flex flex-col items-center justify-end h-full cursor-pointer focus:outline-none"
              >
                {/* Value tooltip label */}
                <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 mb-1 opacity-80 group-hover:opacity-100 tabular-nums">
                  {day.percentage}%
                </span>

                {/* Bar */}
                <div className="w-full max-w-[48px] bg-slate-100 dark:bg-white/[0.06] rounded-xl overflow-hidden h-full flex flex-col justify-end p-0.5">
                  <div
                    style={{ height: `${barHeightPercent}%` }}
                    className={`w-full rounded-lg transition-all duration-500 ease-out ${
                      isToday
                        ? 'bg-emerald-500 dark:bg-emerald-400 shadow-md shadow-emerald-500/20'
                        : day.percentage > 70
                        ? 'bg-emerald-500/80'
                        : day.percentage > 40
                        ? 'bg-teal-500/70'
                        : 'bg-slate-300 dark:bg-zinc-600'
                    }`}
                  />
                </div>

                {/* Day Name */}
                <span className={`text-[11px] sm:text-xs font-bold mt-2 font-['Alexandria'] ${
                  isToday 
                    ? 'text-emerald-600 dark:text-emerald-400 underline underline-offset-4' 
                    : 'text-slate-600 dark:text-zinc-400'
                }`}>
                  {lang === 'ar' ? day.dayNameAr : day.dayNameEn}
                </span>

                {/* Short date */}
                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                  {day.shortDate}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Habit Streaks Section */}
      <div className="bg-white dark:bg-[#10121a] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 stroke-[2.5]" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-['Alexandria']">
              {lang === 'ar' ? 'سلسلة العادات المتكررة (Streaks)' : 'Habit Streaks Tracker'}
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            {lang === 'ar' ? 'انقر لتسجيل إنجاز اليوم' : 'Click check to log today'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {habits.map((habit) => {
            const catMeta = getCategoryMeta(habit.category);
            const isCompletedToday = habit.lastCompletedDate === currentDate;

            return (
              <div
                key={habit.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isCompletedToday
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                    : 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.06]'
                } ${catMeta.borderClass}`}
              >
                <div className="flex items-center justify-between gap-3">
                  
                  {/* Habit Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${catMeta.badgeClass}`}>
                        {lang === 'ar' ? catMeta.nameAr : catMeta.nameEn}
                      </span>
                      {isCompletedToday && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-['Alexandria']">
                          {lang === 'ar' ? '✓ أُنجزت اليوم' : '✓ Done today'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1.5 truncate">
                      {habit.title}
                    </h4>

                    {/* Streak counters */}
                    <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                      <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                        <Flame className="w-3.5 h-3.5 fill-amber-500 stroke-[2]" />
                        <span>{habit.currentStreak} {lang === 'ar' ? 'أيام متتالية' : 'days streak'}</span>
                      </span>
                      <span className="text-slate-400 dark:text-zinc-500">
                        {lang === 'ar' ? 'أفضل:' : 'Best:'} {habit.bestStreak}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Checkmark Button */}
                  <button
                    type="button"
                    onClick={() => onToggleHabit(habit.id)}
                    title={lang === 'ar' ? 'تسجيل إنجاز العادة لليوم' : 'Toggle habit completion for today'}
                    className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isCompletedToday
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                        : 'bg-white dark:bg-zinc-800 text-slate-400 hover:text-emerald-600 border border-slate-200 dark:border-white/[0.1]'
                    }`}
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
