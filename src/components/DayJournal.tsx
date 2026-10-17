import React, { useEffect, useState } from 'react';
import { BookOpen, Check, AlertCircle, ChevronDown, PenLine } from 'lucide-react';
import type { Language } from '../types';
import { getDayRecord, saveDayJournal } from '../utils/storage';
import { formatShortDate } from '../utils/date';

export function DayJournal({ date, lang, onSaved, initiallyExpanded = false }: { date: string; lang: Language; onSaved: () => void; initiallyExpanded?: boolean }) {
  const [text, setText] = useState(() => getDayRecord(date).notes || '');
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const ar = lang === 'ar';
  useEffect(() => {
    const refresh = () => { if (!failed) setText(getDayRecord(date).notes || ''); };
    window.addEventListener('mizan:data-synced', refresh);
    return () => window.removeEventListener('mizan:data-synced', refresh);
  }, [date, failed]);
  const save = (value: string) => {
    setText(value);
    const saved = saveDayJournal(date, value);
    setFailed(!saved);
    if (saved) onSaved();
  };
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  return <section aria-labelledby="day-journal-title" dir={ar ? 'rtl' : 'ltr'} className="relative isolate overflow-hidden rounded-2xl border border-emerald-600/15 bg-white shadow-2xs dark:border-emerald-400/15 dark:bg-[#101416]">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.07),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(52,211,153,0.06),transparent_65%)]" />
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-5 start-0 w-0.5 rounded-full bg-gradient-to-b from-emerald-500/10 via-emerald-500/60 to-emerald-500/10 dark:via-emerald-400/50" />
    <div className="flex items-center gap-3 px-4 pb-3 pt-4 sm:px-5">
      <span className="flex size-10 shrink-0 -rotate-6 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/10 dark:bg-emerald-400/[.08] dark:text-emerald-400 dark:ring-emerald-400/15"><BookOpen aria-hidden="true" size={19} strokeWidth={1.7} /></span>
      <div className="min-w-0 flex-1">
    <h2 id="day-journal-title">
        <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{ar ? 'خلّي ليومك أثر' : 'Leave a trace of your day'}</span>
    </h2>
        <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-zinc-400">{ar ? 'دوّن لحظة، فكرة، أو شعور يستحق تتذكّره.' : 'Capture a moment, a thought, or a feeling worth remembering.'}</p>
        <p className="mt-1 text-[10px] text-slate-400 dark:text-zinc-500">{formatShortDate(date, lang)}{text.trim() && <> · {words} {ar ? 'كلمة' : 'words'}</>}</p>
      </div>
      <button type="button" aria-expanded={expanded} aria-controls="day-journal-panel" onClick={() => setExpanded(value => !value)} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl border border-emerald-600/15 bg-emerald-50/70 px-3 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:border-emerald-400/15 dark:bg-emerald-400/[.06] dark:text-emerald-300 dark:hover:bg-emerald-400/10">
        <PenLine aria-hidden="true" size={13} />
        {expanded ? (ar ? 'طيّ' : 'Close') : text.trim() ? (ar ? 'تعديل' : 'Edit') : (ar ? 'اكتب يومك' : 'Write')}
        <ChevronDown aria-hidden="true" size={15} className={`shrink-0 text-slate-400 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
    <div id="day-journal-panel">
    {!expanded && <button type="button" aria-label={ar ? 'اكتب أثر يومك' : 'Open journal to write'} onClick={() => setExpanded(true)} className="block w-full px-4 pb-4 text-start focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-500 sm:px-5">
      <span dir="auto" className={`block rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-xs leading-7 dark:border-white/[.04] dark:bg-black/15 ${text.trim() ? 'text-slate-600 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-500'}`}>
        <span className="line-clamp-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{text.trim() || (ar ? 'كيف كان يومك؟ دوّن فكرة، شعور، أو لحظة حابّ تتذكّرها…' : 'How was your day? Keep a thought, a feeling, or a moment to remember…')}</span>
      </span>
    </button>}
    {expanded && <div className="border-t border-slate-100 px-4 pb-4 pt-5 dark:border-white/[.06] sm:px-6 sm:pb-5">
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
      <label htmlFor="day-journal" className="text-base font-semibold tracking-tight text-slate-800 dark:text-zinc-100">{ar ? 'بين سطور هذا اليوم' : 'Between the lines of today'}</label>
      <span className="text-[10px] text-slate-400 dark:text-zinc-500">{formatShortDate(date, lang)}</span>
    </div>
    <textarea id="day-journal" value={text} onChange={event => save(event.target.value)} rows={7} dir="auto" autoFocus spellCheck={false}
      placeholder={ar ? 'شو صار معك اليوم؟\nفكرة، شعور، أو لحظة حابّ تتذكّرها…' : 'What happened today?\nA thought, a feeling, or a moment to remember…'}
      style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 35px, rgba(148,163,184,0.13) 35px, rgba(148,163,184,0.13) 36px)', backgroundPosition: '0 1px' }}
      className="block min-h-54 w-full resize-y border-0 bg-transparent px-1 text-sm leading-9 text-slate-700 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 dark:text-zinc-200 dark:placeholder:text-zinc-600" />
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-zinc-500">
      <span>{words} {ar ? 'كلمة' : 'words'}</span>
      <span role="status" className={`inline-flex items-center gap-1.5 ${failed ? 'text-amber-600 dark:text-amber-300' : ''}`}>
        {failed ? <AlertCircle aria-hidden="true" size={13} /> : <Check aria-hidden="true" size={13} />}
        {failed ? (ar ? 'تعذّر الحفظ. كتابتك ما زالت هنا.' : 'Could not save. Your writing is still here.') : (ar ? 'حفظ تلقائي' : 'Autosaved')}
      </span>
      {failed && <button type="button" onClick={() => save(text)} className="min-h-9 px-2 font-semibold text-emerald-700 dark:text-emerald-300">{ar ? 'إعادة الحفظ' : 'Retry save'}</button>}
    </div>
    </div>}
    </div>
  </section>;
}
