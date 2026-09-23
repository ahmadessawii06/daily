import React from 'react';
import { CheckCheck, Clock, XCircle, Flame, Target } from 'lucide-react';
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
    <div className="bg-gradient-to-b from-[#11131b] to-[#0d0e14] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl shadow-black/40 relative overflow-hidden">
      
      {/* Subtle top glow line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: Progress info & luminous bar */}
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Target className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-zinc-200 tracking-wider font-['Alexandria']">
                {lang === 'ar' ? 'مؤشر إنجاز اليوم' : "Today's Progress"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white tabular-nums bg-white/[0.06] border border-white/[0.08] px-2.5 py-0.5 rounded-lg">
                {stats.total === 0 
                  ? (lang === 'ar' ? '0 مهام' : '0 tasks')
                  : `${stats.done} / ${stats.total} (${stats.completionPercentage}%)`}
              </span>
            </div>
          </div>

          {/* Luminous Glow Progress Bar */}
          <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/[0.08]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-400 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Right: Tactile Filter Metrics with Strong Icons */}
        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
          
          {/* Done */}
          <button
            type="button"
            onClick={() => onFilterChange(currentFilter === 'done' ? 'all' : 'done')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              currentFilter === 'done'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/30'
                : 'text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent'
            }`}
          >
            <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCheck className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>{lang === 'ar' ? 'مكتملة' : 'Done'}</span>
            <span className="font-mono tabular-nums text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded text-[11px]">
              {stats.done}
            </span>
          </button>

          {/* Pending */}
          <button
            type="button"
            onClick={() => onFilterChange(currentFilter === 'pending' ? 'all' : 'pending')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              currentFilter === 'pending'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-950/50 ring-1 ring-amber-500/30'
                : 'text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent'
            }`}
          >
            <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 stroke-[2.8]" />
            </div>
            <span>{lang === 'ar' ? 'انتظار' : 'Pending'}</span>
            <span className="font-mono tabular-nums text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded text-[11px]">
              {stats.pending}
            </span>
          </button>

          {/* Not Done */}
          <button
            type="button"
            onClick={() => onFilterChange(currentFilter === 'not-done' ? 'all' : 'not-done')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              currentFilter === 'not-done'
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-md shadow-rose-950/50 ring-1 ring-rose-500/30'
                : 'text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent'
            }`}
          >
            <div className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5 stroke-[2.8]" />
            </div>
            <span>{lang === 'ar' ? 'غير منجزة' : 'Not Done'}</span>
            <span className="font-mono tabular-nums text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded text-[11px]">
              {stats.notDone}
            </span>
          </button>

        </div>

      </div>
    </div>
  );
};
