import React from 'react';
import { CheckCheck, Clock, XCircle, Target } from 'lucide-react';
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
    <div className="bg-white dark:bg-gradient-to-b dark:from-[#11131b] dark:to-[#0d0e14] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-5 shadow-xs dark:shadow-xl dark:shadow-black/40 relative overflow-hidden transition-colors">
      
      {/* Subtle top glow line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        
        {/* Left: Progress info & luminous bar */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 tracking-wider font-['Alexandria']">
                {lang === 'ar' ? 'مؤشر إنجاز اليوم' : "Today's Progress"}
              </span>
            </div>

            <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] px-2 py-0.5 rounded-lg">
              {stats.total === 0 
                ? (lang === 'ar' ? '0 مهام مجدولة' : '0 scheduled')
                : `${stats.done} / ${stats.total} (${stats.completionPercentage}%)`}
            </span>
          </div>

          {/* Luminous Glow Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-zinc-950 rounded-full h-2 sm:h-2.5 overflow-hidden p-0.5 border border-slate-200 dark:border-white/[0.08]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-400 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Right: Tactile Filter Metrics (Responsive 3-col grid on mobile, flex on desktop) */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/[0.06]">
          
          {/* Done */}
          <button
            type="button"
            onClick={() => onFilterChange(currentFilter === 'done' ? 'all' : 'done')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 cursor-pointer min-h-[36px] ${
              currentFilter === 'done'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs dark:bg-emerald-500/25 dark:text-emerald-300 dark:border-emerald-500/50 dark:shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-transparent'
            }`}
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
            </div>
            <span className="truncate">{lang === 'ar' ? 'مكتملة' : 'Done'}</span>
            <span className="font-mono tabular-nums text-emerald-800 dark:text-emerald-300 bg-emerald-500/20 px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px]">
              {stats.done}
            </span>
          </button>

          {/* Pending */}
          <button
            type="button"
            onClick={() => onFilterChange(currentFilter === 'pending' ? 'all' : 'pending')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 cursor-pointer min-h-[36px] ${
              currentFilter === 'pending'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs dark:bg-amber-500/25 dark:text-amber-300 dark:border-amber-500/50 dark:shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-transparent'
            }`}
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.8]" />
            </div>
            <span className="truncate">{lang === 'ar' ? 'انتظار' : 'Pending'}</span>
            <span className="font-mono tabular-nums text-amber-800 dark:text-amber-300 bg-amber-500/20 px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px]">
              {stats.pending}
            </span>
          </button>

          {/* Not Done */}
          <button
            type="button"
            onClick={() => onFilterChange(currentFilter === 'not-done' ? 'all' : 'not-done')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 cursor-pointer min-h-[36px] ${
              currentFilter === 'not-done'
                ? 'bg-rose-100 text-rose-900 border border-rose-300 shadow-xs dark:bg-rose-500/25 dark:text-rose-300 dark:border-rose-500/50 dark:shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent'
            }`}
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.8]" />
            </div>
            <span className="truncate">{lang === 'ar' ? 'غير منجزة' : 'Not Done'}</span>
            <span className="font-mono tabular-nums text-rose-800 dark:text-rose-300 bg-rose-500/20 px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px]">
              {stats.notDone}
            </span>
          </button>

        </div>

      </div>
    </div>
  );
};
