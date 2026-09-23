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
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: Progress info & bar */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              {lang === 'ar' ? 'إنجاز اليوم' : "Today's Progress"}
            </span>
            <span className="text-xs font-mono font-medium text-zinc-400 tabular-nums">
              {stats.total === 0 
                ? (lang === 'ar' ? 'لا توجد مهام' : '0 tasks')
                : `${stats.done} / ${stats.total} ${lang === 'ar' ? 'مهام منجزة' : 'tasks completed'} (${stats.completionPercentage}%)`}
            </span>
          </div>

          {/* Slim Modern Progress Bar */}
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Right: Inline Minimal Metrics */}
        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
          
          {/* Done */}
          <button
            type="button"
            onClick={() => onFilterChange(currentFilter === 'done' ? 'all' : 'done')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              currentFilter === 'done'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-emerald-400 hover:bg-white/[0.03]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>{lang === 'ar' ? 'مكتملة' : 'Done'}</span>
            <span className="font-mono tabular-nums text-zinc-300">{stats.done}</span>
          </button>

          {/* Pending */}
          <button
            type="button"
            onClick={() => onFilterChange(currentFilter === 'pending' ? 'all' : 'pending')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              currentFilter === 'pending'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-amber-400 hover:bg-white/[0.03]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span>{lang === 'ar' ? 'انتظار' : 'Pending'}</span>
            <span className="font-mono tabular-nums text-zinc-300">{stats.pending}</span>
          </button>

          {/* Not Done */}
          <button
            type="button"
            onClick={() => onFilterChange(currentFilter === 'not-done' ? 'all' : 'not-done')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              currentFilter === 'not-done'
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                : 'text-zinc-400 hover:text-rose-400 hover:bg-white/[0.03]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span>{lang === 'ar' ? 'غير منجزة' : 'Not Done'}</span>
            <span className="font-mono tabular-nums text-zinc-300">{stats.notDone}</span>
          </button>

        </div>

      </div>
    </div>
  );
};
