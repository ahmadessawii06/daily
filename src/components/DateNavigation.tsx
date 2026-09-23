import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';
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
    <div className="flex items-center justify-between py-1 px-1 text-xs">
      
      {/* Previous Day */}
      <button
        type="button"
        onClick={handlePrev}
        className="flex items-center gap-2 text-zinc-300 hover:text-white font-semibold transition-all py-1.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] cursor-pointer"
      >
        {lang === 'ar' ? <ChevronRight className="w-4 h-4 stroke-[2.8]" /> : <ChevronLeft className="w-4 h-4 stroke-[2.8]" />}
        <span>{lang === 'ar' ? 'اليوم السابق' : 'Previous Day'}</span>
      </button>

      {/* Center: Selected date / Today */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => datePickerRef.current?.showPicker ? datePickerRef.current.showPicker() : datePickerRef.current?.click()}
          className="flex items-center gap-2 font-bold text-white py-1.5 px-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] transition-all cursor-pointer font-['Alexandria']"
        >
          <Calendar className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
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
            className="text-[11px] font-extrabold text-emerald-300 hover:text-emerald-200 py-1 px-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer"
          >
            {lang === 'ar' ? 'العودة لليوم' : 'Today'}
          </button>
        )}
      </div>

      {/* Next Day */}
      <button
        type="button"
        onClick={handleNext}
        className="flex items-center gap-2 text-zinc-300 hover:text-white font-semibold transition-all py-1.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] cursor-pointer"
      >
        <span>{lang === 'ar' ? 'اليوم التالي' : 'Next Day'}</span>
        {lang === 'ar' ? <ChevronLeft className="w-4 h-4 stroke-[2.8]" /> : <ChevronRight className="w-4 h-4 stroke-[2.8]" />}
      </button>

    </div>
  );
};
