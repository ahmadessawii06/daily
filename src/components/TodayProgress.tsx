import React from 'react';
import { Target, Trophy, Sparkles, CheckCircle2, Clock, XCircle, ListTodo } from 'lucide-react';
import { DayStats, Language, StatusFilter, Theme } from '../types';
import { StatCircle } from './StatCircle';

const progressBackgrounds: Record<Theme, string> = {
  dark: new URL('../assets/images/home/daily-progress-abstract-dark.png', import.meta.url).href,
  light: new URL('../assets/images/home/daily-progress-abstract-light.png', import.meta.url).href,
};

interface TodayProgressProps {
  stats: DayStats;
  currentFilter?: StatusFilter;
  onFilterChange?: (filter: StatusFilter) => void;
  lang: Language;
  theme: Theme;
  compact?: boolean;
}

export const TodayProgress: React.FC<TodayProgressProps> = ({
  stats,
  currentFilter,
  onFilterChange,
  lang,
  theme,
  compact = false,
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

  // Match the existing verse branches, including excerpts and multi-verse passages.
  const verseSources = stats.total === 0
    ? [['الإسراء', 'Al-Isra', '٨٠', '80'], ['آل عمران', 'Ali Imran', '١٥٩', '159']]
    : isAllComplete
      ? [['الكهف', 'Al-Kahf', '٣٠', '30'], ['يونس', 'Yunus', '١٠', '10']]
      : percentage >= 75
        ? [['النجم', 'An-Najm', '٣٩', '39'], ['النجم', 'An-Najm', '٤٠–٤١', '40–41']]
        : percentage >= 50
          ? [['البقرة', 'Al-Baqarah', '١٤٨', '148'], ['المطففين', 'Al-Mutaffifin', '٢٦', '26']]
          : percentage > 0
            ? [['التوبة', 'At-Tawbah', '١٠٥', '105'], ['الشرح', 'Ash-Sharh', '٦–٧', '6–7']]
            : [['آل عمران', 'Ali Imran', '١٥٩', '159'], ['هود', 'Hud', '٨٨', '88']];
  const renderVerseSource = (index: number) => {
    const [arName, enName, arNumber, enNumber] = verseSources[index];
    const sourceText = lang === 'ar'
      ? `سورة ${arName} • ${arNumber.includes('–') ? 'الآيات' : 'الآية'} ${arNumber}`
      : `Surah ${enName} • ${enNumber.includes('–') ? 'Verses' : 'Verse'} ${enNumber}`;
    return (
      <p className="mt-2 flex items-center justify-center gap-2 text-[15px] font-medium leading-5 text-[#8b6d2a] dark:text-[#D5B779]">
        <span aria-hidden="true" className="h-px w-5 bg-[#8b6d2a]/35 dark:bg-[#D5B779]/35" />
        <span>{sourceText}</span>
        <span aria-hidden="true" className="h-px w-5 bg-[#8b6d2a]/35 dark:bg-[#D5B779]/35" />
      </p>
    );
  };

  return (
    <div
      data-today-progress
      style={{ backgroundColor: compact ? 'transparent' : theme === 'dark' ? '#071714' : 'rgba(255, 255, 255, 0.88)' }}
      className={`${compact ? 'relative w-full p-0' : 'relative overflow-hidden rounded-2xl border p-3 shadow-xs sm:p-4'} transition-all duration-300 ${
        isAllComplete
          ? compact ? '' : 'border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.12)] dark:border-emerald-500/30'
          : compact ? '' : 'border-slate-200/90 dark:border-white/[0.08]'
      }`}
    >
      <div aria-hidden="true" className={`${compact ? 'hidden' : 'pointer-events-none absolute inset-0'}`}>
        <img src={progressBackgrounds[theme]} alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-35 dark:opacity-30" />
        <div className="absolute inset-0 bg-white/65 dark:bg-[#07120f]/75" />
      </div>
      <div className={`relative z-10 flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
        
        {/* Top Row: Title, Subtitle, and Motivational Hint Badge */}
        <div className={`${compact ? 'hidden' : 'flex flex-col sm:flex-row sm:items-center'} justify-between gap-2 ${compact ? '' : 'border-b border-slate-100 pb-2 dark:border-white/[0.05]'}`}>
          
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

              {(stats.total === 0 || isAllComplete) && <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5 truncate font-medium">
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

        {/* Motivational Quran Verse (placed at top: nothing rises above the Quran) */}
        {compact && (
          <div
            data-progress-verse
            lang={lang}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="mx-auto w-full min-w-0 max-w-3xl rounded-[14px] border border-[rgba(190,155,85,0.24)] bg-[rgba(5,20,18,0.72)] px-3 py-2 text-center text-[#F8EBCD] sm:px-4"
          >
            <p className={lang === 'ar' ? 'quran-verse-text' : 'text-lg leading-relaxed'}>{getMotivationalTitle()}</p>
            {renderVerseSource(0)}
          </div>
        )}

        {/* Main Section: Circular Progress Gauge + 4 Circular Metric Gauges (دوائر تفاعلية بدلاً من البطاقات) */}
        <div data-progress-layout={compact ? 'compact' : undefined} className={`flex items-center pt-0 ${compact ? 'mx-auto grid w-full max-w-3xl grid-cols-5 items-center gap-1 rounded-2xl border border-slate-200/60 bg-white/10 px-1 py-1 shadow-[0_10px_28px_rgba(15,23,42,0.04)] backdrop-blur-[2px] dark:border-teal-400/25 dark:bg-[#06221d]/70 dark:shadow-[0_10px_32px_rgba(0,0,0,0.35)] dark:backdrop-blur-md' : 'flex-col md:flex-row md:justify-between'} ${compact ? 'md:gap-4' : 'gap-3 md:gap-4 lg:gap-6'}`}>
          
          {/* Main Circular Progress Gauge */}
          <div data-progress-main className={`${compact ? 'col-start-3 row-start-1 w-auto justify-self-center' : 'w-full justify-center gap-3 sm:gap-4 md:w-auto md:flex-1 md:justify-start'} flex min-w-0 shrink-0 items-center`}>
            <div className={`${compact ? 'rounded-full bg-white/25 p-1 shadow-[0_8px_20px_rgba(16,185,129,0.14)] ring-1 ring-emerald-400/20 dark:bg-white/[0.03] dark:shadow-[0_8px_20px_rgba(0,0,0,0.28)] dark:ring-emerald-300/15' : ''} relative flex shrink-0 items-center justify-center`}>
              <svg
                viewBox="0 0 100 100"
                className={`${compact ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-24 w-24 sm:h-28 sm:w-28'} -rotate-90 shrink-0 transform-gpu`}
                aria-label={`Progress: ${percentage}%`}
              >
                {/* Background track (neutral dark/light) */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={compact ? '8' : '7'}
                  className="text-slate-200 dark:text-zinc-300/75"
                />

                {/* Active progress arc (pure green) */}
                {percentage > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="var(--theme-progress-main, #10e588)"
                    strokeWidth={compact ? '8' : '7'}
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
                      <span className={`${compact ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} font-black tracking-tight text-slate-900 dark:text-white`}>
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
                      <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        {percentage}
                      </span>
                      <span className={`${compact ? 'text-[10px]' : 'text-xs sm:text-sm'} font-bold text-[#10e588] ms-0.5`}>
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Motivational Title & Subtitle beside main circle */}
            <div className={`${compact ? 'hidden' : 'flex'} min-w-0 max-w-[240px] flex-col justify-center sm:max-w-[280px]`}>
              <span className={`${compact ? 'text-[11px]' : 'text-xs sm:text-sm'} font-bold leading-relaxed tracking-tight text-slate-900 dark:text-white font-['Alexandria']`}>
                {getMotivationalTitle()}
              </span>
              <span className="mt-1 text-xs font-medium leading-relaxed text-slate-600 dark:text-zinc-300 font-['Alexandria']">
                {getMotivationalSubtitle()}
              </span>
            </div>
          </div>

          {/* 4 Circular Metric Gauges (دوائر الإحصائيات الأربعة) - بدون بطاقات */}
          <div
            data-progress-stats
            className={`grid grid-cols-4 justify-items-center ${compact
              ? 'contents'
              : 'w-full gap-1 border-t border-slate-100 pt-2 sm:gap-3 md:w-auto md:flex-1 md:border-s-0 md:border-t-0 md:ps-4 md:pt-0 lg:ps-6 dark:border-white/[0.05]'}`}
            style={compact ? { display: 'contents' } : undefined}
          >
            
            {/* 1. Completed (دائرة مكتملة) */}
            <StatCircle
              label={lang === 'ar' ? 'مكتملة' : 'Done'}
              value={stats.done}
              percentage={stats.total > 0 ? (stats.done / stats.total) * 100 : 0}
              color="emerald"
              isActive={currentFilter === 'done'}
              onClick={() => onFilterChange?.(currentFilter === 'done' ? 'all' : 'done')}
              compact={compact}
              subLabel={stats.total > 0 ? `${Math.round((stats.done / stats.total) * 100)}%` : '0%'}
            />

            {/* 2. Remaining (دائرة متبقية) */}
            <StatCircle
              label={lang === 'ar' ? 'متبقية' : 'Remaining'}
              value={remaining}
              percentage={stats.total > 0 ? (remaining / stats.total) * 100 : 0}
              color="amber"
              isActive={currentFilter === 'pending'}
              onClick={() => onFilterChange?.(currentFilter === 'pending' ? 'all' : 'pending')}
              compact={compact}
              subLabel={stats.total > 0 ? `${Math.round((remaining / stats.total) * 100)}%` : '0%'}
            />

            {/* 3. Not Done (دائرة غير منجزة) */}
            <StatCircle
              label={lang === 'ar' ? 'غير منجزة' : 'Not Done'}
              value={stats.notDone}
              percentage={stats.total > 0 ? (stats.notDone / stats.total) * 100 : 0}
              color="rose"
              isActive={currentFilter === 'not-done'}
              onClick={() => onFilterChange?.(currentFilter === 'not-done' ? 'all' : 'not-done')}
              compact={compact}
              subLabel={stats.total > 0 ? `${Math.round((stats.notDone / stats.total) * 100)}%` : '0%'}
            />

            {/* 4. Total (دائرة الإجمالي) */}
            <StatCircle
              label={lang === 'ar' ? 'الإجمالي' : 'Total'}
              value={stats.total}
              percentage={stats.total > 0 ? 100 : 0}
              color="indigo"
              isActive={currentFilter === 'all'}
              onClick={() => onFilterChange?.('all')}
              compact={compact}
              subLabel={lang === 'ar' ? 'مهمة' : 'tasks'}
            />

          </div>

        </div>

      </div>
    </div>
  );
};
