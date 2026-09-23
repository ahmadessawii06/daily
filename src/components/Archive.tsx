import React, { useState } from 'react';
import { 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  History 
} from 'lucide-react';
import { DayRecord, Language } from '../types';
import { formatMonthYear, formatShortDate, getDateRelativeLabel, formatTime12h } from '../utils/date';
import { calculateStats } from '../utils/storage';

interface ArchiveProps {
  days: DayRecord[];
  onOpenInDaily: (date: string) => void;
  lang: Language;
}

export const Archive: React.FC<ArchiveProps> = ({
  days,
  onOpenInDaily,
  lang,
}) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(days[0]?.date || null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter days
  const filteredDays = days.filter((day) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchDate = day.date.includes(q);
    const matchTask = day.tasks.some(
      (t) => t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q)
    );
    return matchDate || matchTask;
  });

  // Group days by Month Year (e.g., "September 2026")
  const groupedDays = filteredDays.reduce<Record<string, DayRecord[]>>((acc, day) => {
    const monthKey = formatMonthYear(day.date, lang);
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(day);
    return acc;
  }, {});

  const toggleExpand = (date: string) => {
    setExpandedDate((prev) => (prev === date ? null : date));
  };

  return (
    <div className="space-y-6">
      
      {/* Header with strong branding */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.08] transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white flex items-center justify-center">
              <History className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              {lang === 'ar' ? 'الأرشيف الزمني' : 'Timeline Vault'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-['Alexandria','Cairo']">
            {lang === 'ar' ? 'سجل الأيام السابقة' : 'Your History'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium">
            {lang === 'ar' ? 'متابعة سجل إنجازاتك اليومية ونسب الالتزام السابقة.' : 'Review your past routines, consistency, and completed tasks.'}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none stroke-[2.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث في الأرشيف...' : 'Search history...'}
            className="bg-white dark:bg-[#10121a] border border-slate-200 dark:border-white/[0.1] rounded-xl ps-9 pe-3 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 shadow-2xs w-full sm:w-64 transition-colors"
          />
        </div>
      </div>

      {/* Grouped Month Lists */}
      {Object.keys(groupedDays).length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 dark:border-white/[0.1] rounded-3xl bg-white/70 dark:bg-white/[0.02]">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
            {lang === 'ar' ? 'لا توجد سجلات محفوظة مطابقة لبحثك.' : 'No history found matching your query.'}
          </p>
        </div>
      ) : (
        Object.entries(groupedDays).map(([monthTitle, monthDays]) => (
          <div key={monthTitle} className="space-y-3.5">
            
            {/* Month Badge */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-['Alexandria']">
                {monthTitle}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                {monthDays.length} {lang === 'ar' ? 'أيام' : 'days'}
              </span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {monthDays.map((record) => {
                const stats = calculateStats(record.tasks);
                const isExpanded = expandedDate === record.date;
                const relative = getDateRelativeLabel(record.date, lang);
                const shortDate = formatShortDate(record.date, lang);

                return (
                  <div
                    key={record.date}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'bg-white dark:bg-[#12141e] border-slate-300 dark:border-white/[0.18] shadow-lg md:col-span-2 lg:col-span-3 ring-1 ring-emerald-500/20'
                        : 'bg-white dark:bg-[#0d0e14] border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:bg-[#12141e] dark:hover:border-white/[0.14] shadow-2xs'
                    }`}
                  >
                    {/* Card Header */}
                    <div
                      onClick={() => toggleExpand(record.date)}
                      className="p-4 cursor-pointer flex flex-col justify-between gap-3 select-none"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white font-['Alexandria']">
                            {shortDate}
                          </span>
                          {relative && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 font-bold">
                              {relative}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4 stroke-[2.5]" /> : <ChevronDown className="w-4 h-4 stroke-[2.5]" />}
                        </div>
                      </div>

                      {/* Stats & Progress */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                          <span className="font-medium">
                            {stats.total} {lang === 'ar' ? 'مهام' : 'Tasks'} · <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{stats.done} {lang === 'ar' ? 'مكتملة' : 'Done'}</strong>
                          </span>
                          <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                            {stats.completionPercentage}%
                          </span>
                        </div>

                        <div className="w-full bg-slate-100 dark:bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            style={{ width: `${stats.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Tasks */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-black/30 space-y-2.5">
                        <div className="flex items-center justify-between py-1 text-xs text-slate-500 dark:text-zinc-400 font-bold">
                          <span>{lang === 'ar' ? 'قائمة مهام ذلك اليوم:' : "Tasks for this day:"}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenInDaily(record.date);
                            }}
                            className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                          >
                            <span>{lang === 'ar' ? 'عرض في Daily' : 'Open in Daily'}</span>
                            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {record.tasks.filter((t) => t.title && t.title.trim().length > 0).map((task) => {
                            const isDone = task.status === 'done';
                            const isNotDone = task.status === 'not-done';
                            const t12 = formatTime12h(task.time, lang);

                            const rowStyle = isDone
                              ? 'bg-emerald-500/[0.08] border-emerald-500/30 dark:bg-emerald-950/25 dark:border-emerald-500/30'
                              : isNotDone
                              ? 'bg-rose-500/[0.08] border-rose-500/30 dark:bg-rose-950/25 dark:border-rose-500/30'
                              : 'bg-amber-500/[0.08] border-amber-500/30 dark:bg-amber-950/25 dark:border-amber-500/30';

                            const stripStyle = isDone
                              ? 'bg-emerald-500 dark:bg-emerald-400'
                              : isNotDone
                              ? 'bg-rose-500 dark:bg-rose-400'
                              : 'bg-amber-500 dark:bg-amber-400';

                            return (
                              <div
                                key={task.id}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs shadow-2xs gap-2.5 overflow-hidden transition-colors ${rowStyle}`}
                              >
                                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                  <div className={`w-1 self-stretch rounded-full shrink-0 ${stripStyle}`} />
                                  <span className="font-mono font-bold text-slate-700 dark:text-zinc-300 tabular-nums shrink-0 bg-black/5 dark:bg-white/[0.06] px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    <span>{t12.time12}</span>
                                    <span className="text-[10px] font-['Alexandria'] font-bold opacity-80">{t12.period}</span>
                                  </span>
                                  <span className={`truncate font-['Alexandria'] ${isDone ? 'line-through text-slate-500 dark:text-zinc-500' : isNotDone ? 'text-rose-900 dark:text-rose-200 font-bold' : 'text-slate-900 dark:text-zinc-100 font-semibold'}`}>
                                    {task.title}
                                  </span>
                                  {task.notes && (
                                    <span className="hidden sm:inline text-[11px] text-amber-800 dark:text-amber-300 font-medium truncate">
                                      ({task.notes})
                                    </span>
                                  )}
                                </div>

                                <span
                                  className={`text-[10px] px-2.5 py-0.5 rounded-lg font-bold shrink-0 ms-2 ${
                                    isDone
                                      ? 'text-emerald-800 bg-emerald-100 border border-emerald-300 dark:text-emerald-300 dark:bg-emerald-500/20 dark:border-emerald-500/30'
                                      : isNotDone
                                      ? 'text-rose-800 bg-rose-100 border border-rose-300 dark:text-rose-300 dark:bg-rose-500/20 dark:border-rose-500/30'
                                      : 'text-amber-800 bg-amber-100 border border-amber-300 dark:text-amber-300 dark:bg-amber-500/20 dark:border-amber-500/30'
                                  }`}
                                >
                                  {isDone
                                    ? (lang === 'ar' ? '✓ مكتملة' : '✓ Done')
                                    : isNotDone
                                    ? (lang === 'ar' ? '✕ غير منجزة' : '✕ Not Done')
                                    : (lang === 'ar' ? '◷ انتظار' : '◷ Pending')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>
        ))
      )}

    </div>
  );
};
