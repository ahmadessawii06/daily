import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language } from '../types';
import { addDays, formatHeaderDate, getTodayDateString, isToday, parseDate } from '../utils/date';
import { loadAllDays } from '../utils/storage';

interface DateNavigationProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  lang: Language;
}

const toDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const monthTitle = (date: Date, lang: Language) => new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en-US', {
  month: 'long',
  year: 'numeric',
}).format(date);

const weekdays = (lang: Language) => lang === 'ar'
  ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DateNavigation: React.FC<DateNavigationProps> = ({ currentDate, onDateChange, lang }) => {
  const ar = lang === 'ar';
  const today = getTodayDateString();
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parseDate(currentDate)));
  const [focusedDate, setFocusedDate] = useState(currentDate);
  const calendarRef = useRef<HTMLDivElement>(null);
  const dateButtons = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const selectedMonth = startOfMonth(parseDate(currentDate));
    setViewMonth(selectedMonth);
    setFocusedDate(currentDate);
  }, [currentDate]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!calendarRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const step = event.key === 'ArrowUp' ? -7 : event.key === 'ArrowDown' ? 7
        : event.key === 'ArrowLeft' ? (ar ? 1 : -1) : (ar ? -1 : 1);
      const nextDate = addDays(focusedDate, step);
      setFocusedDate(nextDate);
      const nextMonth = startOfMonth(parseDate(nextDate));
      if (nextMonth.getTime() !== viewMonth.getTime()) setViewMonth(nextMonth);
      window.requestAnimationFrame(() => dateButtons.current[nextDate]?.focus());
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ar, focusedDate, open, viewMonth]);

  const calendarDays = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const weekStart = 0;
    const offset = (first.getDay() - weekStart + 7) % 7;
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    // Keep six calendar rows so the transition into the next month is always visible.
    const totalCells = 42;
    return Array.from({ length: totalCells }, (_, index) => {
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index - offset + 1);
      return { value: toDateValue(date), date, inMonth: date.getMonth() === viewMonth.getMonth() };
    });
  }, [ar, viewMonth]);

  const moveMonth = (amount: number) => {
    setViewMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const chooseDate = (value: string) => {
    onDateChange(value);
    setOpen(false);
  };

  const handleToday = () => chooseDate(today);
  const isCurrentToday = isToday(currentDate);
  const allDays = loadAllDays();

  return (
    <nav
      id="onboarding-date-navigation"
      aria-label={ar ? 'التنقل بين الأيام' : 'Day navigation'}
      dir={ar ? 'rtl' : 'ltr'}
      className="relative z-20 inline-flex max-w-full items-center gap-1 rounded-2xl border border-white/70 bg-white/55 p-1.5 text-xs shadow-sm backdrop-blur-md select-none dark:border-white/[.1] dark:bg-white/[.06]"
      ref={calendarRef}
    >
      <button type="button" onClick={() => onDateChange(addDays(currentDate, -1))} aria-label={ar ? 'اليوم السابق' : 'Previous day'} title={ar ? 'اليوم السابق' : 'Previous day'} className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-[background-color,color,transform] hover:bg-white/70 hover:text-emerald-700 active:scale-95 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-emerald-300">
        {ar ? <ChevronRight className="size-4 stroke-[2.8]" /> : <ChevronLeft className="size-4 stroke-[2.8]" />}
      </button>

      <div className="flex min-w-0 items-center gap-1">
        <button type="button" onClick={() => { setViewMonth(startOfMonth(parseDate(currentDate))); setFocusedDate(currentDate); setOpen(value => !value); }} aria-haspopup="dialog" aria-expanded={open} className="flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-3 text-center font-bold text-slate-900 transition-[background-color,transform] hover:bg-white/60 active:scale-95 focus-visible:outline-2 focus-visible:outline-emerald-500 cursor-pointer font-['Alexandria'] text-xs sm:px-4 sm:text-sm dark:text-white dark:hover:bg-white/10">
          <Calendar className="size-3.5 shrink-0 text-emerald-700 dark:text-emerald-300 sm:size-4" strokeWidth={2.4} />
          <span className="truncate">{formatHeaderDate(currentDate, lang)}</span>
        </button>
        {!isCurrentToday && <button type="button" onClick={handleToday} className="flex min-h-9 shrink-0 items-center rounded-lg border border-emerald-300/70 bg-emerald-100/70 px-2 text-[10px] font-extrabold text-emerald-800 shadow-sm transition-[background-color,transform] hover:bg-emerald-100 active:scale-95 focus-visible:outline-2 focus-visible:outline-emerald-500 sm:px-2.5 sm:text-[11px] dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25">{ar ? 'اليوم' : 'Today'}</button>}
      </div>

      <button type="button" onClick={() => onDateChange(addDays(currentDate, 1))} aria-label={ar ? 'اليوم التالي' : 'Next day'} title={ar ? 'اليوم التالي' : 'Next day'} className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-[background-color,color,transform] hover:bg-white/70 hover:text-emerald-700 active:scale-95 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-emerald-300">
        {ar ? <ChevronLeft className="size-4 stroke-[2.8]" /> : <ChevronRight className="size-4 stroke-[2.8]" />}
      </button>

      {open && <div role="dialog" aria-label={ar ? 'اختيار التاريخ' : 'Choose a date'} aria-modal="false" onPointerDown={event => event.stopPropagation()} className="pointer-events-auto absolute start-0 top-[calc(100%+0.55rem)] z-[100] w-[340px] max-w-[calc(100vw-2rem)] origin-top rounded-[1rem] border border-white/70 bg-[#f7f4e9]/95 p-3 text-slate-700 shadow-[0_16px_38px_-22px_rgba(38,63,48,0.5)] backdrop-blur-xl animate-[calendar-in_180ms_ease-out] dark:border-white/10 dark:bg-[#10251f]/95 dark:text-zinc-100 sm:p-3.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <button type="button" onClick={() => moveMonth(-1)} aria-label={ar ? 'الشهر السابق' : 'Previous month'} title={ar ? 'الشهر السابق' : 'Previous month'} className="flex size-9 items-center justify-center rounded-xl text-slate-500 transition-[background-color,color,transform] hover:bg-emerald-500/10 hover:text-emerald-700 active:scale-90 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-zinc-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200">{ar ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</button>
          <h2 className="text-sm font-extrabold tracking-tight text-emerald-950 dark:text-emerald-50">{monthTitle(viewMonth, lang)}</h2>
          <button type="button" onClick={() => moveMonth(1)} aria-label={ar ? 'الشهر التالي' : 'Next month'} title={ar ? 'الشهر التالي' : 'Next month'} className="flex size-9 items-center justify-center rounded-xl text-slate-500 transition-[background-color,color,transform] hover:bg-emerald-500/10 hover:text-emerald-700 active:scale-90 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-zinc-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200">{ar ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}</button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 px-1 text-center text-[10px] font-bold text-emerald-800/60 dark:text-emerald-200/60">{weekdays(lang).map(day => <span key={day} className="py-0.5">{day}</span>)}</div>
        <div role="grid" aria-label={monthTitle(viewMonth, lang)} className="grid grid-cols-7 justify-items-center gap-0.5">
          {calendarDays.map(({ value, date, inMonth }) => {
            const selected = value === currentDate;
            const current = value === today;
            const tasks = allDays[value]?.tasks.filter(task => task.title.trim()) || [];
            const hasTasks = tasks.length > 0;
            const taskLabel = hasTasks ? ar ? `${tasks.length} مهام` : `${tasks.length} tasks` : '';
            return <button key={value} ref={button => { dateButtons.current[value] = button; }} type="button" role="gridcell" tabIndex={value === (focusedDate || currentDate) ? 0 : -1} aria-label={`${new Intl.DateTimeFormat(ar ? 'ar' : 'en-US', { dateStyle: 'full' }).format(date)}${taskLabel ? ` — ${taskLabel}` : ''}`} aria-selected={selected} aria-current={current ? 'date' : undefined} onFocus={() => setFocusedDate(value)} onClick={() => chooseDate(value)} className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-[background-color,color,box-shadow,transform] hover:bg-emerald-500/10 hover:text-emerald-800 active:scale-90 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-100 sm:h-10 sm:w-10 ${!inMonth ? 'text-slate-400/55 dark:text-zinc-500/60' : 'text-slate-700 dark:text-zinc-200'} ${selected ? '!rounded-full !bg-emerald-700 !text-white shadow-[0_6px_14px_-7px_rgba(4,120,87,0.9)] dark:!bg-emerald-500' : ''} ${current && !selected ? 'ring-1 ring-emerald-600/70 ring-offset-1 ring-offset-[#f7f4e9] dark:ring-emerald-300/60 dark:ring-offset-[#10251f]' : ''}`}>
              {date.getDate()}
              {hasTasks && <span aria-hidden="true" className="absolute bottom-0.5 size-[5px] rounded-full bg-emerald-500 dark:bg-emerald-300" />}
            </button>;
          })}
        </div>
      </div>}
    </nav>
  );
};
