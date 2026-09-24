import React from 'react';
import { DayStats, Language, StatusFilter } from '../types';

interface TodayProgressProps {
  stats: DayStats;
  currentFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  lang: Language;
}

export const TodayProgress: React.FC<TodayProgressProps> = ({
  stats,
  currentFilter,
  onFilterChange,
  lang,
}) => {
  return (
    <div className="bg-white dark:bg-[#11131a] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-4 shadow-2xs transition-colors">
      <div className="flex flex-col gap-2.5 sm:gap-3">
        
        {/* الصف العلوي: العنوان والنسبة المئوية في اليمين، وتفاصيل الأعداد الهادئة في اليسار */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          {/* يمين: عنوان "مؤشر إنجاز اليوم" مع النسبة المئوية والعدد الكلي */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-['Alexandria']">
              {lang === 'ar' ? 'مؤشر إنجاز اليوم' : "Today's Progress"}
            </span>
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-zinc-400">
              {stats.completionPercentage}% ({stats.done}/{stats.total})
            </span>
          </div>

          {/* اليسار: تفاصيل أعداد المهام بخط صغير وألوان هادئة ونقط صغيرة (Color Indicators) */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium">
            
            {/* مكتملة */}
            <button
              type="button"
              onClick={() => onFilterChange(currentFilter === 'done' ? 'all' : 'done')}
              className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer py-0.5 px-2 rounded-md ${
                currentFilter === 'done'
                  ? 'text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-500/10'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
              title={lang === 'ar' ? 'تصفية المهام المكتملة' : 'Filter done tasks'}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>{stats.done} {lang === 'ar' ? 'مكتملة' : 'Done'}</span>
            </button>

            {/* غير منجزة */}
            <button
              type="button"
              onClick={() => onFilterChange(currentFilter === 'not-done' ? 'all' : 'not-done')}
              className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer py-0.5 px-2 rounded-md ${
                currentFilter === 'not-done'
                  ? 'text-rose-700 dark:text-rose-300 font-bold bg-rose-500/10'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
              title={lang === 'ar' ? 'تصفية المهام غير المنجزة' : 'Filter not done tasks'}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{stats.notDone} {lang === 'ar' ? 'غير منجزة' : 'Not Done'}</span>
            </button>

          </div>

        </div>

        {/* الوسط: شريط تقدم أفقي ناعم يكتمل باللون الأخضر كلما أنجزت مهمة */}
        <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${stats.completionPercentage}%` }}
          />
        </div>

      </div>
    </div>
  );
};
