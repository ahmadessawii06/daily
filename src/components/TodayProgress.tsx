import React from 'react';
import { Target, Trophy, Sparkles, CheckCircle2, Clock, XCircle, ListTodo } from 'lucide-react';
import { DayStats, Language, StatusFilter } from '../types';
import { StatCircle } from './StatCircle';

interface TodayProgressProps {
  stats: DayStats;
  currentFilter?: StatusFilter;
  onFilterChange?: (filter: StatusFilter) => void;
  lang: Language;
}

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

  // Motivational short phrase for badge (Quranic remembrance & encouragement)
  const getMotivationalHint = () => {
    if (stats.total === 0) {
      return lang === 'ar' ? '﴿بِسْمِ اللَّهِ﴾ • ابدأ يومك' : 'Begin in Allah\'s Name ✨';
    }
    if (isAllComplete) {
      return lang === 'ar' ? '﴿الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ﴾ 🏆' : 'Praise be to Allah! 🏆';
    }
    if (percentage >= 75) {
      return lang === 'ar' ? '﴿وَأَنَّ سَعْيَهُ سَوْفَ يُرَىٰ﴾ ⚡' : 'Effort shall be seen ⚡';
    }
    if (percentage >= 50) {
      return lang === 'ar' ? '﴿فَاسْتَبِقُوا الْخَيْرَاتِ﴾ 🎯' : 'Race to all good deeds 🎯';
    }
    if (percentage > 0) {
      return lang === 'ar' ? '﴿إِنَّ مَعَ الْعُسْرِ يُسْرًا﴾ ✨' : 'With hardship comes ease ✨';
    }
    return lang === 'ar' ? 'ابدأ أول مهمة اليوم' : 'Start your first task';
  };

  // Motivational title beside circular progress - Inspiring Quranic verses
  const getMotivationalTitle = () => {
    if (stats.total === 0) {
      return lang === 'ar'
        ? '﴿وَقُل رَّبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ﴾'
        : '“My Lord, grant me a sound entrance.”';
    }
    if (isAllComplete) {
      return lang === 'ar'
        ? '﴿إِنَّا لَا نُضِيعُ أَجْرَ مَنْ أَحْسَنَ عَمَلًا﴾'
        : '“We do not lose the reward of one who does good deeds.”';
    }
    if (percentage >= 75) {
      return lang === 'ar'
        ? '﴿وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ﴾'
        : '“And that man receives only that which he strives for.”';
    }
    if (percentage >= 50) {
      return lang === 'ar'
        ? '﴿فَاسْتَبِقُوا الْخَيْرَاتِ﴾'
        : '“So race forward to every good.”';
    }
    if (percentage > 0) {
      return lang === 'ar'
        ? '﴿وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ﴾'
        : '“And say: Work, for Allah will see your deeds.”';
    }
    return lang === 'ar'
      ? '﴿فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ﴾'
      : '“When you have decided, then rely upon Allah.”';
  };

  // Motivational subtitle beside circular progress - Inspiring Quranic verses
  const getMotivationalSubtitle = () => {
    if (stats.total === 0) {
      return lang === 'ar'
        ? '﴿فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ﴾'
        : '“Rely upon Allah; indeed, Allah loves those who rely upon Him.”';
    }
    if (isAllComplete) {
      return lang === 'ar'
        ? '﴿وَآخِرُ دَعْوَاهُمْ أَنِ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ﴾'
        : '“And their final call is: Praise be to Allah, Lord of the worlds.”';
    }
    if (percentage >= 75) {
      return lang === 'ar'
        ? '﴿وَأَنَّ سَعْيَهُ سَوْفَ يُرَىٰ • ثُمَّ يُجْزَاهُ الْجَزَاءَ الْأَوْفَىٰ﴾'
        : '“And that his effort is going to be seen, then rewarded fully.”';
    }
    if (percentage >= 50) {
      return lang === 'ar'
        ? '﴿وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ﴾'
        : '“And for this let the competitors compete.”';
    }
    if (percentage > 0) {
      return lang === 'ar'
        ? '﴿إِنَّ مَعَ الْعُسْرِ يُسْرًا • فَإِذَا فَرَغْتَ فَانصَبْ﴾'
        : '“Indeed, with hardship comes ease. So when you have finished, strive.”';
    }
    return lang === 'ar'
      ? '﴿وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ﴾'
      : '“And my success is not but through Allah; upon Him I have relied.”';
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

              {(stats.total === 0 || isAllComplete) && <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate font-medium">
                {stats.total === 0
                  ? (lang === 'ar' ? 'لا توجد مهام مسجلة لهذا اليوم' : 'No tasks scheduled for today')
                  : (lang === 'ar' ? `اكتملت جميع المهام بنجاح (${stats.done} من ${stats.total})` : `All ${stats.total} tasks completed successfully`)}
              </p>}
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
              <svg
                viewBox="0 0 100 100"
                className="w-24 h-24 sm:w-28 sm:h-28 -rotate-90 shrink-0 transform-gpu"
                aria-label={`Progress: ${percentage}%`}
              >
                {/* Background track (neutral dark/light) */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="7"
                  className="text-slate-100 dark:text-zinc-300/75"
                />

                {/* Active progress arc (pure green) */}
                {percentage > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="var(--theme-progress-main, #10e588)"
                    strokeWidth="7"
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
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[#10e588] mb-1 animate-pulse" />
                    <div className="flex items-baseline justify-center font-numbers">
                      <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        100
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold text-[#10e588] ms-0.5">
                        %
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center leading-none">
                    <div className="flex items-baseline justify-center font-numbers">
                      <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {percentage}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#10e588] ms-0.5">
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Motivational Title & Subtitle beside main circle */}
            <div className="flex flex-col justify-center min-w-0 max-w-[260px] sm:max-w-[300px]">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-['Alexandria'] leading-relaxed tracking-tight">
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
              percentage={stats.total > 0 ? (stats.done / stats.total) * 100 : 0}
              color="emerald"
              isActive={currentFilter === 'done'}
              onClick={() => onFilterChange?.(currentFilter === 'done' ? 'all' : 'done')}
              subLabel={stats.total > 0 ? `${Math.round((stats.done / stats.total) * 100)}%` : undefined}
            />

            {/* 2. Remaining (دائرة متبقية) */}
            <StatCircle
              label={lang === 'ar' ? 'متبقية' : 'Remaining'}
              value={remaining}
              percentage={stats.total > 0 ? (remaining / stats.total) * 100 : 0}
              color="amber"
              isActive={currentFilter === 'pending'}
              onClick={() => onFilterChange?.(currentFilter === 'pending' ? 'all' : 'pending')}
              subLabel={stats.total > 0 ? `${Math.round((remaining / stats.total) * 100)}%` : undefined}
            />

            {/* 3. Not Done (دائرة غير منجزة) */}
            <StatCircle
              label={lang === 'ar' ? 'غير منجزة' : 'Not Done'}
              value={stats.notDone}
              percentage={stats.total > 0 ? (stats.notDone / stats.total) * 100 : 0}
              color="rose"
              isActive={currentFilter === 'not-done'}
              onClick={() => onFilterChange?.(currentFilter === 'not-done' ? 'all' : 'not-done')}
              subLabel={stats.total > 0 && stats.notDone > 0 ? `${Math.round((stats.notDone / stats.total) * 100)}%` : undefined}
            />

            {/* 4. Total (دائرة الإجمالي) */}
            <StatCircle
              label={lang === 'ar' ? 'الإجمالي' : 'Total'}
              value={stats.total}
              percentage={stats.total > 0 ? 100 : 0}
              color="indigo"
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
