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
    <nav aria-label={lang === 'ar' ? 'التنقل بين الأيام' : 'Day navigation'} dir={lang === 'ar' ? 'rtl' : 'ltr'} className="inline-flex max-w-full items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-1 text-xs select-none dark:border-white/[.08] dark:bg-white/[.03]">
      
      {/* Previous Day */}
      <button
        type="button"
        onClick={handlePrev} aria-label={lang === 'ar' ? 'اليوم السابق' : 'Previous day'} title={lang === 'ar' ? 'اليوم السابق' : 'Previous day'}
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-white hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-emerald-300"
      >
        {lang === 'ar' ? <ChevronRight className="w-4 h-4 stroke-[2.8]" /> : <ChevronLeft className="w-4 h-4 stroke-[2.8]" />}
      </button>

      {/* Center: Selected date / Today */}
      <div className="flex items-center gap-1 min-w-0">
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
          aria-label={lang === 'ar' ? 'اختر يومًا' : 'Choose a day'} className="sr-only"
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
        onClick={handleNext} aria-label={lang === 'ar' ? 'اليوم التالي' : 'Next day'} title={lang === 'ar' ? 'اليوم التالي' : 'Next day'}
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-white hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-emerald-300"
      >
        {lang === 'ar' ? <ChevronLeft className="w-4 h-4 stroke-[2.8]" /> : <ChevronRight className="w-4 h-4 stroke-[2.8]" />}
      </button>

    </nav>
  );
};
