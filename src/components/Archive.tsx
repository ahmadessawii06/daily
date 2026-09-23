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
  Search
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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {lang === 'ar' ? 'سجل الأيام السابقة' : 'Your History'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {lang === 'ar' ? 'متابعة سجل إنجازاتك اليومية ونسب الالتزام.' : 'Review your past consistency and completed routines.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 start-3 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث في الأرشيف...' : 'Search history...'}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl ps-8 pe-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] w-full sm:w-56"
          />
        </div>
      </div>

      {/* Grouped Month Lists */}
      {Object.keys(groupedDays).length === 0 ? (
        <div className="py-16 text-center border border-dashed border-white/[0.06] rounded-2xl bg-white/[0.01]">
          <p className="text-xs text-zinc-400">
            {lang === 'ar' ? 'لا توجد سجلات محفوظة مطابقة لبحثك.' : 'No history found matching your query.'}
          </p>
        </div>
      ) : (
        Object.entries(groupedDays).map(([monthTitle, monthDays]) => (
          <div key={monthTitle} className="space-y-3">
            
            {/* Month Header */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {monthTitle}
              </span>
              <span className="text-[11px] font-mono text-zinc-600">
                ({monthDays.length} {lang === 'ar' ? 'أيام' : 'days'})
              </span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                        ? 'bg-white/[0.04] border-white/[0.12] shadow-lg md:col-span-2 lg:col-span-3'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.03] hover:border-white/[0.1]'
                    }`}
                  >
                    {/* Card Header */}
                    <div
                      onClick={() => toggleExpand(record.date)}
                      className="p-4 cursor-pointer flex flex-col justify-between gap-3 select-none"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {shortDate}
                          </span>
                          {relative && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              {relative}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-zinc-500">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {/* Stats & Progress */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <span>
                            {stats.total} {lang === 'ar' ? 'مهام' : 'Tasks'} · <strong className="text-zinc-200">{stats.done} {lang === 'ar' ? 'مكتملة' : 'Completed'}</strong>
                          </span>
                          <span className="font-mono tabular-nums text-emerald-400 font-semibold text-[11px]">
                            {stats.completionPercentage}%
                          </span>
                        </div>

                        <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${stats.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Task List for This Day */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-white/[0.04] space-y-2">
                        <div className="flex items-center justify-between py-1 text-[11px] text-zinc-500">
                          <span>{lang === 'ar' ? 'تفاصيل مهام اليوم:' : "Today's Task Details:"}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenInDaily(record.date);
                            }}
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
                          >
                            <span>{lang === 'ar' ? 'عرض في Daily' : 'Open in Daily'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          {record.tasks.map((task) => {
                            const isDone = task.status === 'done';
                            const isNotDone = task.status === 'not-done';

                            return (
                              <div
                                key={task.id}
                                className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/20 border border-white/[0.04] text-xs"
                              >
                                <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                                  <span className="font-mono text-zinc-500 tabular-nums shrink-0">
                                    {task.time}
                                  </span>
                                  <span className={`truncate ${isDone ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                                    {task.title}
                                  </span>
                                  {task.notes && (
                                    <span className="hidden sm:inline text-[10px] text-amber-400/80 truncate">
                                      ({task.notes})
                                    </span>
                                  )}
                                </div>

                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ms-2 ${
                                    isDone
                                      ? 'text-emerald-400 bg-emerald-500/10'
                                      : isNotDone
                                      ? 'text-rose-400 bg-rose-500/10'
                                      : 'text-amber-400 bg-amber-500/10'
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
