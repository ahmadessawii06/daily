import React, { useState } from 'react';
import { 
  Calendar, 
  ExternalLink, 
  Check, 
  X, 
  Clock, 
  StickyNote, 
  ChevronDown, 
  ChevronUp,
  Search,
  History,
  Sparkles,
  Trophy
} from 'lucide-react';
import { DayRecord, Language } from '../types';
import { formatMonthYear, formatShortDate, getDateRelativeLabel } from '../utils/date';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <History className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              {lang === 'ar' ? 'الأرشيف الزمني' : 'Timeline Vault'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-['Alexandria','Cairo']">
            {lang === 'ar' ? 'سجل الأيام السابقة' : 'Your History'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
            {lang === 'ar' ? 'متابعة سجل إنجازاتك اليومية ونسب الالتزام السابقة.' : 'Review your past routines, consistency, and completed tasks.'}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 text-zinc-500 pointer-events-none stroke-[2.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث في الأرشيف...' : 'Search history...'}
            className="bg-[#10121a] border border-white/[0.1] rounded-xl ps-9 pe-3 py-2 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400/80 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Grouped Month Lists */}
      {Object.keys(groupedDays).length === 0 ? (
        <div className="py-16 text-center border border-dashed border-white/[0.1] rounded-3xl bg-white/[0.02]">
          <p className="text-xs sm:text-sm text-zinc-400 font-medium">
            {lang === 'ar' ? 'لا توجد سجلات محفوظة مطابقة لبحثك.' : 'No history found matching your query.'}
          </p>
        </div>
      ) : (
        Object.entries(groupedDays).map(([monthTitle, monthDays]) => (
          <div key={monthTitle} className="space-y-3.5">
            
            {/* Month Badge */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider font-['Alexandria']">
                {monthTitle}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
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
                        ? 'bg-[#12141e] border-white/[0.18] shadow-2xl md:col-span-2 lg:col-span-3'
                        : 'bg-[#0d0e14] border-white/[0.08] hover:bg-[#12141e] hover:border-white/[0.14]'
                    }`}
                  >
                    {/* Card Header */}
                    <div
                      onClick={() => toggleExpand(record.date)}
                      className="p-4 cursor-pointer flex flex-col justify-between gap-3 select-none"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-white font-['Alexandria']">
                            {shortDate}
                          </span>
                          {relative && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                              {relative}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-zinc-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4 stroke-[2.5]" /> : <ChevronDown className="w-4 h-4 stroke-[2.5]" />}
                        </div>
                      </div>

                      {/* Stats & Progress */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <span className="font-medium">
                            {stats.total} {lang === 'ar' ? 'مهام' : 'Tasks'} · <strong className="text-emerald-300 font-bold">{stats.done} {lang === 'ar' ? 'مكتملة' : 'Done'}</strong>
                          </span>
                          <span className="font-mono tabular-nums text-emerald-400 font-bold text-xs">
                            {stats.completionPercentage}%
                          </span>
                        </div>

                        <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            style={{ width: `${stats.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Tasks */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] bg-black/30 space-y-2.5">
                        <div className="flex items-center justify-between py-1 text-xs text-zinc-400 font-bold">
                          <span>{lang === 'ar' ? 'قائمة مهام ذلك اليوم:' : "Tasks for this day:"}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenInDaily(record.date);
                            }}
                            className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                          >
                            <span>{lang === 'ar' ? 'عرض في Daily' : 'Open in Daily'}</span>
                            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {record.tasks.map((task) => {
                            const isDone = task.status === 'done';
                            const isNotDone = task.status === 'not-done';

                            return (
                              <div
                                key={task.id}
                                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs"
                              >
                                <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                                  <span className="font-mono font-bold text-zinc-400 tabular-nums shrink-0 bg-white/[0.04] px-2 py-0.5 rounded">
                                    {task.time}
                                  </span>
                                  <span className={`truncate font-['Alexandria'] ${isDone ? 'line-through text-zinc-500' : 'text-zinc-100 font-semibold'}`}>
                                    {task.title}
                                  </span>
                                  {task.notes && (
                                    <span className="hidden sm:inline text-[11px] text-amber-300 font-medium truncate">
                                      ({task.notes})
                                    </span>
                                  )}
                                </div>

                                <span
                                  className={`text-[10px] px-2.5 py-0.5 rounded-lg font-bold shrink-0 ms-2 ${
                                    isDone
                                      ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30'
                                      : isNotDone
                                      ? 'text-rose-300 bg-rose-500/20 border border-rose-500/30'
                                      : 'text-amber-300 bg-amber-500/20 border border-amber-500/30'
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
