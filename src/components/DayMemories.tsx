import React, { useEffect, useRef, useState } from 'react';
import { Check, Images, NotebookPen, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { Language } from '../types';
import { DayJournal } from './DayJournal';
import { DayPhoto } from './DayPhoto';
import { getDayRecord } from '../utils/storage';
import { Tooltip } from './Tooltip';

export function DayMemories({ date, lang, onSaved }: { date: string; lang: Language; onSaved: () => void }) {
  const [open, setOpen] = useState<'journal' | 'photo' | null>(null);
  const [, refresh] = useState(0);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const triggerButton = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const update = () => refresh(value => value + 1);
    window.addEventListener('mizan:data-synced', update);
    return () => window.removeEventListener('mizan:data-synced', update);
  }, [date]);
  const record = getDayRecord(date);
  const photoCount = record.dayPhotos?.length ?? (record.dayPhoto ? 1 : 0);
  const hasJournal = Boolean(record.notes?.trim());
  const saved = () => { refresh(value => value + 1); onSaved(); };
  const ar = lang === 'ar';
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(null); };
    document.addEventListener('keydown', closeOnEscape);
    requestAnimationFrame(() => closeButton.current?.focus());
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
      requestAnimationFrame(() => (activeElement || triggerButton.current)?.focus());
    };
  }, [open]);
  const activeLabel = open === 'journal'
    ? (ar ? 'يوميات اليوم' : 'Today journal')
    : (ar ? 'صور اليوم' : 'Today photos');
  const trapFocus = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab' || !dialog.current) return;
    const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  return <div className="contents">
    <div id="header-day-memories" role="group" aria-label={ar ? 'ذكريات اليوم' : 'Day memories'} className="contents">
      {(['journal', 'photo'] as const).map(kind => {
        const Icon = kind === 'journal' ? NotebookPen : Images;
        const label = kind === 'journal' ? (ar ? 'خلّي ليومك أثر' : 'Leave a trace of your day') : (ar ? 'صورة اليوم' : 'Photo of the day');
        const active = open === kind;
        const hasContent = kind === 'journal' ? hasJournal : photoCount > 0;
        const badgeLabel = kind === 'journal' ? (ar ? 'في هذا اليوم يوميات مكتوبة' : 'This day has a journal entry') : (ar ? `صور هذا اليوم: ${photoCount}` : `Photos for this day: ${photoCount}`);
        const tooltipText = kind === 'journal'
          ? (ar ? (hasJournal ? 'ذكريات اليوم (يوجد تدوين)' : 'ذكريات اليوم') : (hasJournal ? "Today's memories (written)" : "Today's memories"))
          : (ar ? (photoCount > 0 ? `صورة اليوم (${photoCount})` : 'صورة اليوم') : (photoCount > 0 ? `Today's photo (${photoCount})` : 'Photo of the day'));
        return <Tooltip key={kind} text={tooltipText}>
          <button id={`header-day-${kind}-btn`} ref={node => { if (node && active) triggerButton.current = node; }} type="button" aria-label={hasContent ? `${label} — ${badgeLabel}` : label} aria-haspopup="dialog" aria-expanded={active} aria-controls={`memory-${kind}`} onClick={() => { triggerButton.current = document.getElementById(`header-day-${kind}-btn`) as HTMLButtonElement | null; setOpen(active ? null : kind); }}
          className={`group relative flex h-control min-w-control cursor-pointer items-center justify-center rounded-2xl border border-white/35 bg-slate-100/70 px-2 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_8px_rgba(38,63,48,0.06)] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 ${kind === 'journal' ? 'hover:border-emerald-400/60 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-[0_6px_20px_-6px_rgba(16,185,129,0.4)] focus-visible:outline-emerald-500 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300' : 'hover:border-amber-400/60 hover:bg-amber-50 hover:text-amber-700 hover:shadow-[0_6px_20px_-6px_rgba(245,158,11,0.4)] focus-visible:outline-amber-500 dark:hover:border-amber-400/40 dark:hover:bg-amber-400/10 dark:hover:text-amber-300'} ${active ? (kind === 'journal' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300') : 'dark:border-white/[.08] dark:bg-white/[.04] dark:text-zinc-300'}`}>
          <Icon size={20} strokeWidth={2} aria-hidden="true" className={`motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${kind === 'journal' ? 'motion-safe:group-hover:-rotate-12 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:-rotate-12 motion-safe:group-focus-visible:scale-110' : 'motion-safe:group-hover:rotate-6 motion-safe:group-hover:scale-125 motion-safe:group-focus-visible:rotate-6 motion-safe:group-focus-visible:scale-125'}`} />
          {hasContent && <span aria-hidden="true" className={`absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums shadow-sm ring-2 ring-white dark:ring-[#111416] ${kind === 'journal' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'}`}>
            {kind === 'journal' ? <Check size={12} strokeWidth={1.8} /> : photoCount}
          </span>}
        </button>
        </Tooltip>;
      })}
    </div>
    {open && createPortal(
      <div className="fixed inset-0 z-[200] flex items-end justify-center p-3 sm:items-center sm:p-6" dir={ar ? 'rtl' : 'ltr'}>
        <button type="button" aria-label={ar ? 'إغلاق النافذة' : 'Close dialog'} onClick={() => setOpen(null)} className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-[2px] dark:bg-black/60" />
        <section ref={dialog} id={`memory-${open}`} role="dialog" aria-modal="true" aria-labelledby="memory-dialog-title" onKeyDown={trapFocus} className="relative flex max-h-[min(900px,calc(100dvh-1.5rem))] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/35 bg-[rgba(250,248,239,0.98)] shadow-2xl shadow-slate-950/25 dark:border-white/[0.14] dark:bg-[#10251f] dark:shadow-black/50">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3 dark:border-white/[0.08] sm:px-5">
            <h2 id="memory-dialog-title" className="text-sm font-bold text-slate-900 dark:text-white">{activeLabel}</h2>
          <button ref={closeButton} type="button" onClick={() => setOpen(null)} aria-label={ar ? 'إغلاق النافذة' : 'Close dialog'} className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:border-white/[0.1] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-white"><X size={17} strokeWidth={1.8} aria-hidden="true" /></button>
          </header>
          <div className="min-h-0 overflow-y-auto p-3 sm:p-5">
            {open === 'journal' ? <DayJournal date={date} lang={lang} onSaved={saved} initiallyExpanded /> : <DayPhoto date={date} lang={lang} onSaved={saved} />}
          </div>
        </section>
      </div>,
      document.body,
    )}
  </div>;
}
