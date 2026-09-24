import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Language } from '../types';

interface MiniCalendarProps {
  currentDate: string; // "YYYY-MM-DD"
  onDateChange: (date: string) => void;
  lang: Language;
  hasTasksDates?: string[];
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  currentDate,
  onDateChange,
  lang,
  hasTasksDates = [],
}) => {
  const currentObj = new Date(currentDate);
  const [viewYear, setViewYear] = useState(currentObj.getFullYear());
  const [viewMonth, setViewMonth] = useState(currentObj.getMonth()); // 0-11

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];

  const englishMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const arabicDayHeaders = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
  const englishDayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="p-3 bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 font-['Alexandria']">
          {lang === 'ar' ? `${arabicMonths[viewMonth]} ${viewYear}` : `${englishMonths[viewMonth]} ${viewYear}`}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={lang === 'ar' ? handleNextMonth : handlePrevMonth}
            aria-label="Previous Month"
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-400 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={lang === 'ar' ? handlePrevMonth : handleNextMonth}
            aria-label="Next Month"
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-400 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {(lang === 'ar' ? arabicDayHeaders : englishDayHeaders).map((header, idx) => (
          <span key={idx} className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
            {header}
          </span>
        ))}
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Empty cells before month start */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-6" />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const formattedDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isSelected = formattedDate === currentDate;
          const isToday = formattedDate === todayStr;
          const hasTasks = hasTasksDates.includes(formattedDate);

          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => onDateChange(formattedDate)}
              className={`h-6 text-[11px] font-mono font-medium rounded-lg flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500 text-white font-bold shadow-xs'
                  : isToday
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10'
                  : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
              }`}
            >
              <span>{dayNum}</span>
              {hasTasks && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400 absolute bottom-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
