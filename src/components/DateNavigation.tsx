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
    // If Arabic/RTL, ChevronRight visually points backward, but logically subtract 1 day
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
    <div className="flex items-center justify-between py-2 px-1 text-xs">
      
      {/* Previous Day */}
      <button
        type="button"
        onClick={handlePrev}
        className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/[0.04]"
      >
        {lang === 'ar' ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        <span>{lang === 'ar' ? 'اليوم السابق' : 'Previous Day'}</span>
      </button>

      {/* Center: Selected date / Today */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => datePickerRef.current?.showPicker ? datePickerRef.current.showPicker() : datePickerRef.current?.click()}
          className="flex items-center gap-1.5 font-medium text-zinc-200 hover:text-white py-1 px-2.5 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span>{relativeLabel ? `${relativeLabel} (${shortDate})` : shortDate}</span>
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
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 py-0.5 px-2 rounded bg-emerald-500/10 border border-emerald-500/20"
          >
            {lang === 'ar' ? 'اليوم' : 'Today'}
          </button>
        )}
      </div>

      {/* Next Day */}
      <button
        type="button"
        onClick={handleNext}
        className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/[0.04]"
      >
        <span>{lang === 'ar' ? 'اليوم التالي' : 'Next Day'}</span>
        {lang === 'ar' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

    </div>
  );
};
