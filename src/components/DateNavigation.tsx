import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language } from '../types';
import { addDays, formatHeaderDate, getTodayDateString, parseDate, toLatinDigits } from '../utils/date';
import { loadAllDays } from '../utils/storage';
import { datePickerArrowClass, datePickerDayClass, datePickerGridClass, datePickerMonthButtonClass, datePickerMonthTitleClass, datePickerPopoverClass, datePickerShellClass, datePickerTodayClass, datePickerTriggerClass, datePickerWeekdayClass } from './datePickerStyles';
import { useDatePickerPlacement } from './useDatePickerPlacement';
import { Tooltip } from './Tooltip';

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

const monthTitle = (date: Date, lang: Language) => toLatinDigits(new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en-US', {
  month: 'long',
  year: 'numeric',
}).format(date));

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
  const popoverRef = useRef<HTMLDivElement>(null);
  const dateButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const { style: popoverStyle } = useDatePickerPlacement(calendarRef, popoverRef, open);

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
    const totalWeeks = Math.min(6, Math.ceil((offset + daysInMonth) / 7) + 1);
    const totalCells = totalWeeks * 7;
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
  const allDays = loadAllDays();

  return (
    <nav
      id="onboarding-date-navigation"
      aria-label={ar ? 'التنقل بين الأيام' : 'Day navigation'}
      dir={ar ? 'rtl' : 'ltr'}
      className={datePickerShellClass}
      ref={calendarRef}
    >
      <Tooltip text={ar ? 'اليوم السابق' : 'Previous day'} className="shrink-0">
        <button type="button" onClick={() => onDateChange(addDays(currentDate, -1))} aria-label={ar ? 'اليوم السابق' : 'Previous day'} className={datePickerArrowClass}>
          {ar ? <ChevronRight className="size-4 stroke-[2.8]" /> : <ChevronLeft className="size-4 stroke-[2.8]" />}
        </button>
      </Tooltip>

      <div className="flex min-w-0 flex-1 items-center gap-1">
        <button type="button" onClick={() => { setViewMonth(startOfMonth(parseDate(currentDate))); setFocusedDate(currentDate); setOpen(value => !value); }} aria-haspopup="dialog" aria-expanded={open} className={datePickerTriggerClass}>
          <Calendar className="size-3.5 shrink-0 text-emerald-700 dark:text-emerald-300 sm:size-4" strokeWidth={2.4} />
          <span className="whitespace-nowrap">{formatHeaderDate(currentDate, lang)}</span>
        </button>
      </div>

      <Tooltip text={ar ? 'اليوم التالي' : 'Next day'} className="shrink-0">
        <button type="button" onClick={() => onDateChange(addDays(currentDate, 1))} aria-label={ar ? 'اليوم التالي' : 'Next day'} className={datePickerArrowClass}>
          {ar ? <ChevronLeft className="size-4 stroke-[2.8]" /> : <ChevronRight className="size-4 stroke-[2.8]" />}
        </button>
      </Tooltip>

      {open && <div ref={popoverRef} data-date-picker-popover="gregorian" role="dialog" aria-label={ar ? 'اختيار التاريخ' : 'Choose a date'} aria-modal="false" onPointerDown={event => event.stopPropagation()} style={popoverStyle} className={datePickerPopoverClass}>
        <div className="mb-1 flex items-center justify-between gap-2">
          <button type="button" onClick={() => moveMonth(-1)} aria-label={ar ? 'الشهر السابق' : 'Previous month'} title={ar ? 'الشهر السابق' : 'Previous month'} className={datePickerMonthButtonClass}>{ar ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</button>
          <h2 className={datePickerMonthTitleClass}>{monthTitle(viewMonth, lang)}</h2>
          <button type="button" onClick={() => moveMonth(1)} aria-label={ar ? 'الشهر التالي' : 'Next month'} title={ar ? 'الشهر التالي' : 'Next month'} className={datePickerMonthButtonClass}>{ar ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}</button>
        </div>

        <div className={datePickerWeekdayClass}>{weekdays(lang).map(day => <span key={day}>{day}</span>)}</div>
        <div role="grid" aria-label={monthTitle(viewMonth, lang)} className={datePickerGridClass}>
          {calendarDays.map(({ value, date, inMonth }) => {
            const selected = value === currentDate;
            const current = value === today;
            const tasks = allDays[value]?.tasks.filter(task => task.title.trim()) || [];
            const hasTasks = tasks.length > 0;
            const taskLabel = hasTasks ? ar ? `${tasks.length} مهام` : `${tasks.length} tasks` : '';
            return <button key={value} ref={button => { dateButtons.current[value] = button; }} type="button" role="gridcell" tabIndex={value === (focusedDate || currentDate) ? 0 : -1} aria-label={`${new Intl.DateTimeFormat(ar ? 'ar' : 'en-US', { dateStyle: 'full' }).format(date)}${taskLabel ? ` — ${taskLabel}` : ''}`} aria-selected={selected} aria-current={current ? 'date' : undefined} onFocus={() => setFocusedDate(value)} onClick={() => chooseDate(value)} className={`${datePickerDayClass} ${!inMonth ? 'text-slate-400/55 dark:text-zinc-500/60' : 'text-slate-700 dark:text-zinc-200'} ${selected ? '!rounded-full !bg-emerald-700 !text-white shadow-[0_6px_14px_-7px_rgba(4,120,87,0.9)] dark:!bg-emerald-500' : ''} ${current && !selected ? 'ring-1 ring-emerald-600/70 ring-offset-1 ring-offset-[#f7f4e9] dark:ring-emerald-300/60 dark:ring-offset-[#10251f]' : ''}`}>
              {date.getDate()}
              {hasTasks && <span aria-hidden="true" className="absolute bottom-0.5 size-[5px] rounded-full bg-emerald-500 dark:bg-emerald-300" />}
            </button>;
          })}
        </div>
        <button type="button" onClick={handleToday} className={datePickerTodayClass}>{ar ? 'العودة إلى اليوم' : 'Back to today'}</button>
      </div>}
    </nav>
  );
};
