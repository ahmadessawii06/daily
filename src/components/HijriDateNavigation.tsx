import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language } from '../types';
import { addDays, getTodayDateString, parseDate, toLatinDigits } from '../utils/date';
import { datePickerArrowClass, datePickerDayClass, datePickerGridClass, datePickerMonthButtonClass, datePickerMonthTitleClass, datePickerPopoverClass, datePickerShellClass, datePickerTodayClass, datePickerTriggerClass, datePickerWeekdayClass } from './datePickerStyles';
import { useDatePickerPlacement } from './useDatePickerPlacement';
import { Tooltip } from './Tooltip';

interface HijriDateNavigationProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  lang: Language;
}

type HijriParts = { year: number; month: number; day: number };
type HijriMonth = { year: number; month: number };

const hijriPartsFormatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
  day: 'numeric', month: 'numeric', year: 'numeric',
});

const toDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const hijriParts = (date: Date): HijriParts => {
  const parts = hijriPartsFormatter.formatToParts(date);
  return {
    year: Number(parts.find(part => part.type === 'year')?.value),
    month: Number(parts.find(part => part.type === 'month')?.value),
    day: Number(parts.find(part => part.type === 'day')?.value),
  };
};

const compareMonth = (a: HijriMonth, b: HijriMonth) => (a.year - b.year) * 12 + a.month - b.month;

const shiftMonth = (month: HijriMonth, amount: number): HijriMonth => {
  const index = month.year * 12 + month.month - 1 + amount;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
};

const findGregorianDate = (target: HijriParts, anchor: Date): Date | null => {
  const anchorHijri = hijriParts(anchor);
  const monthDistance = compareMonth({ year: target.year, month: target.month }, { year: anchorHijri.year, month: anchorHijri.month });
  const approximate = new Date(anchor);
  approximate.setDate(approximate.getDate() + monthDistance * 29.53059 + (target.day - anchorHijri.day));
  for (let offset = -45; offset <= 45; offset += 1) {
    const candidate = new Date(approximate);
    candidate.setDate(candidate.getDate() + offset);
    const parts = hijriParts(candidate);
    if (parts.year === target.year && parts.month === target.month && parts.day === target.day) return candidate;
  }
  return null;
};

const monthTitle = (month: HijriMonth, lang: Language) => {
  const anchor = findGregorianDate({ ...month, day: 1 }, new Date());
  if (!anchor) return `${month.month}/${month.year}`;
  return toLatinDigits(new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-islamic-umalqura' : 'en-US-u-ca-islamic-umalqura', {
    month: 'long', year: 'numeric',
  }).format(anchor));
};

const weekdays = (lang: Language) => lang === 'ar'
  ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const hijriWeekdaysArabic = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const hijriMonthsArabic = [
  'المحرّم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوّال', 'ذو القعدة', 'ذو الحجة',
];

const formatHijriHeader = (date: Date, lang: Language) => {
  const parts = hijriParts(date);
  if (lang === 'ar') {
    return toLatinDigits(`${hijriWeekdaysArabic[date.getDay()]}، ${parts.day} ${hijriMonthsArabic[parts.month - 1]}، ${parts.year} هـ`);
  }
  const locale = 'en-US-u-ca-islamic-umalqura';
  const options = { numberingSystem: 'latn' as const };
  const weekday = new Intl.DateTimeFormat(locale, { ...options, weekday: 'long' }).format(date);
  const day = new Intl.DateTimeFormat(locale, { ...options, day: 'numeric' }).format(date);
  const month = new Intl.DateTimeFormat(locale, { ...options, month: 'long' }).format(date);
  const year = new Intl.DateTimeFormat(locale, { ...options, year: 'numeric' }).format(date);
  return `${weekday}, ${day} ${month}, ${year} AH`;
};

export const HijriDateNavigation: React.FC<HijriDateNavigationProps> = ({ currentDate, onDateChange, lang }) => {
  const ar = lang === 'ar';
  const today = getTodayDateString();
  const selectedDate = parseDate(currentDate);
  const selectedHijri = hijriParts(selectedDate);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<HijriMonth>({ year: selectedHijri.year, month: selectedHijri.month });
  const [focusedDate, setFocusedDate] = useState(currentDate);
  const calendarRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dateButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const { style: popoverStyle } = useDatePickerPlacement(calendarRef, popoverRef, open);

  useEffect(() => {
    setViewMonth({ year: selectedHijri.year, month: selectedHijri.month });
    setFocusedDate(currentDate);
  }, [currentDate, selectedHijri.month, selectedHijri.year]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!calendarRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); return; }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const step = event.key === 'ArrowUp' ? -7 : event.key === 'ArrowDown' ? 7 : event.key === 'ArrowLeft' ? (ar ? 1 : -1) : (ar ? -1 : 1);
      const nextDate = addDays(focusedDate, step);
      setFocusedDate(nextDate);
      const nextHijri = hijriParts(parseDate(nextDate));
      setViewMonth({ year: nextHijri.year, month: nextHijri.month });
      window.requestAnimationFrame(() => dateButtons.current[nextDate]?.focus());
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('pointerdown', handlePointerDown); document.removeEventListener('keydown', handleKeyDown); };
  }, [ar, focusedDate, open]);

  const calendarDays = useMemo(() => {
    const first = findGregorianDate({ ...viewMonth, day: 1 }, selectedDate);
    if (!first) return [];
    const next = findGregorianDate({ ...shiftMonth(viewMonth, 1), day: 1 }, first);
    if (!next) return [];
    const daysInMonth = Math.round((next.getTime() - first.getTime()) / 86400000);
    const offset = first.getDay();
    const totalWeeks = Math.min(6, Math.ceil((offset + daysInMonth) / 7) + 1);
    return Array.from({ length: totalWeeks * 7 }, (_, index) => {
      const date = new Date(first);
      date.setDate(first.getDate() + index - offset);
      const value = toDateValue(date);
      const parts = hijriParts(date);
      return { value, date, day: parts.day, inMonth: parts.year === viewMonth.year && parts.month === viewMonth.month };
    });
  }, [selectedDate, viewMonth]);

  const chooseDate = (value: string) => { onDateChange(value); setOpen(false); };
  const isCurrentToday = currentDate === today;
  const headerText = formatHijriHeader(selectedDate, lang);

  return (
    <nav ref={calendarRef} dir={ar ? 'rtl' : 'ltr'} aria-label={ar ? 'التنقل بالتاريخ الهجري' : 'Hijri date navigation'} className={datePickerShellClass}>
      <Tooltip text={ar ? 'اليوم الهجري السابق' : 'Previous Hijri day'} className="shrink-0">
        <button type="button" onClick={() => onDateChange(addDays(currentDate, -1))} aria-label={ar ? 'اليوم الهجري السابق' : 'Previous Hijri day'} className={datePickerArrowClass}>{ar ? <ChevronRight className="size-4 stroke-[2.8]" /> : <ChevronLeft className="size-4 stroke-[2.8]" />}</button>
      </Tooltip>
      <button type="button" onClick={() => { setViewMonth({ year: selectedHijri.year, month: selectedHijri.month }); setFocusedDate(currentDate); setOpen(value => !value); }} aria-haspopup="dialog" aria-expanded={open} aria-label={ar ? `اختيار التاريخ الهجري: ${headerText}` : `Choose Hijri date: ${headerText}`} className={datePickerTriggerClass}><Calendar className="size-3.5 shrink-0 text-emerald-700 dark:text-emerald-300 sm:size-4" strokeWidth={2.4} /><span className="whitespace-nowrap">{headerText}</span></button>
      <Tooltip text={ar ? 'اليوم الهجري التالي' : 'Next Hijri day'} className="shrink-0">
        <button type="button" onClick={() => onDateChange(addDays(currentDate, 1))} aria-label={ar ? 'اليوم الهجري التالي' : 'Next Hijri day'} className={datePickerArrowClass}>{ar ? <ChevronLeft className="size-4 stroke-[2.8]" /> : <ChevronRight className="size-4 stroke-[2.8]" />}</button>
      </Tooltip>
      {!isCurrentToday && <button type="button" onClick={() => chooseDate(today)} className="sr-only">{ar ? 'اليوم' : 'Today'}</button>}
      {open && <div ref={popoverRef} data-date-picker-popover="hijri" role="dialog" aria-label={ar ? 'اختيار التاريخ الهجري' : 'Choose Hijri date'} aria-modal="false" onPointerDown={event => event.stopPropagation()} style={popoverStyle} className={datePickerPopoverClass}>
        <div className="mb-1 flex items-center justify-between gap-2"><button type="button" onClick={() => setViewMonth(current => shiftMonth(current, -1))} aria-label={ar ? 'الشهر الهجري السابق' : 'Previous Hijri month'} className={datePickerMonthButtonClass}>{ar ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</button><h2 className={datePickerMonthTitleClass}>{monthTitle(viewMonth, lang)}</h2><button type="button" onClick={() => setViewMonth(current => shiftMonth(current, 1))} aria-label={ar ? 'الشهر الهجري التالي' : 'Next Hijri month'} className={datePickerMonthButtonClass}>{ar ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}</button></div>
        <div className={datePickerWeekdayClass}>{weekdays(lang).map(day => <span key={day}>{day}</span>)}</div>
        <div role="grid" aria-label={monthTitle(viewMonth, lang)} className={datePickerGridClass}>{calendarDays.map(({ value, day, inMonth }) => { const selected = value === currentDate; const current = value === today; return <button key={value} ref={button => { dateButtons.current[value] = button; }} type="button" role="gridcell" tabIndex={value === (focusedDate || currentDate) ? 0 : -1} aria-selected={selected} aria-current={current ? 'date' : undefined} onFocus={() => setFocusedDate(value)} onClick={() => chooseDate(value)} className={`${datePickerDayClass} ${!inMonth ? 'text-slate-400/55 dark:text-zinc-500/60' : 'text-slate-700 dark:text-zinc-200'} ${selected ? '!rounded-full !bg-emerald-700 !text-white shadow-[0_6px_14px_-7px_rgba(4,120,87,0.9)] dark:!bg-emerald-500' : ''} ${current && !selected ? 'ring-1 ring-emerald-600/70 ring-offset-1 ring-offset-[#f7f4e9] dark:ring-emerald-300/60 dark:ring-offset-[#10251f]' : ''}`}>{day}</button>; })}</div>
        <button type="button" onClick={() => chooseDate(today)} className={datePickerTodayClass}>{ar ? 'العودة إلى اليوم' : 'Back to today'}</button>
      </div>}
    </nav>
  );
};
