import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Language } from '../types';
import { addDays, isToday, formatShortDate, getDateRelativeLabel } from '../utils/date';

interface DateNavigationProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  lang: Language;
}

export const DateNavigation: React.FC<DateNavigationProps> = ({
  currentDate,
  onDateChange,
  lang,
}) => {
  const datePickerRef = useRef<HTMLInputElement>(null);

  const handlePrev = () => {
    onDateChange(addDays(currentDate, -1));
  };

  const handleNext = () => {
    onDateChange(addDays(currentDate, 1));
  };

  const handleToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${d}`);
  };

  const isCurrentToday = isToday(currentDate);
  const relativeLabel = getDateRelativeLabel(currentDate, lang);
  const shortDate = formatShortDate(currentDate, lang);

  return (
    <div className="flex items-center justify-between py-1 px-0.5 text-xs gap-1.5 sm:gap-2 select-none">
      
      {/* Previous Day */}
      <button
        type="button"
        onClick={handlePrev}
        className="flex items-center gap-1 sm:gap-1.5 text-slate-700 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white font-semibold transition-all py-2 px-2 sm:px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs dark:bg-white/[0.03] dark:hover:bg-white/[0.07] dark:border-white/[0.06] cursor-pointer min-h-[40px] active:scale-95 shrink-0"
      >
        {lang === 'ar' ? <ChevronRight className="w-4 h-4 stroke-[2.8]" /> : <ChevronLeft className="w-4 h-4 stroke-[2.8]" />}
        <span className="hidden sm:inline">{lang === 'ar' ? 'اليوم السابق' : 'Previous Day'}</span>
        <span className="sm:hidden text-[11px]">{lang === 'ar' ? 'السابق' : 'Prev'}</span>
      </button>

      {/* Center: Selected date / Today */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <button
          type="button"
          onClick={() => datePickerRef.current?.showPicker ? datePickerRef.current.showPicker() : datePickerRef.current?.click()}
          className="flex items-center gap-1.5 sm:gap-2 font-bold text-slate-900 dark:text-white py-2 px-2.5 sm:px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs dark:bg-white/[0.05] dark:hover:bg-white/[0.09] dark:border-white/[0.08] transition-all cursor-pointer font-['Alexandria'] text-[11px] sm:text-xs min-h-[40px] active:scale-95 truncate"
        >
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5] shrink-0" />
          <span className="truncate">{relativeLabel ? `${relativeLabel} (${shortDate})` : shortDate}</span>
        </button>

        <input
          ref={datePickerRef}
          type="date"
          value={currentDate}
          onChange={(e) => e.target.value && onDateChange(e.target.value)}
          className="sr-only"
        />

        {!isCurrentToday && (
          <button
            type="button"
            onClick={handleToday}
            className="text-[10px] sm:text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 py-1.5 px-2 sm:px-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 transition-all cursor-pointer min-h-[36px] flex items-center shadow-2xs active:scale-95 shrink-0"
          >
            {lang === 'ar' ? 'اليوم' : 'Today'}
          </button>
        )}
      </div>

      {/* Next Day */}
      <button
        type="button"
        onClick={handleNext}
        className="flex items-center gap-1 sm:gap-1.5 text-slate-700 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white font-semibold transition-all py-2 px-2 sm:px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs dark:bg-white/[0.03] dark:hover:bg-white/[0.07] dark:border-white/[0.06] cursor-pointer min-h-[40px] active:scale-95 shrink-0"
      >
        <span className="hidden sm:inline">{lang === 'ar' ? 'اليوم التالي' : 'Next Day'}</span>
        <span className="sm:hidden text-[11px]">{lang === 'ar' ? 'التالي' : 'Next'}</span>
        {lang === 'ar' ? <ChevronLeft className="w-4 h-4 stroke-[2.8]" /> : <ChevronRight className="w-4 h-4 stroke-[2.8]" />}
      </button>

    </div>
  );
};
