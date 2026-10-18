import React, { useId, useLayoutEffect, useRef } from 'react';
import { AlertCircle, Check, ChevronDown, Feather, PenLine } from 'lucide-react';
import type { Language } from '../types';
import { formatShortDate } from '../utils/date';

export function JournalNotebook({ date, lang, text, failed, expanded, onToggle, onSave }: {
  date: string; lang: Language; text: string; failed: boolean; expanded: boolean; onToggle: () => void; onSave: (text: string) => void;
}) {
  const ar = lang === 'ar';
  const fieldId = useId(), panelId = useId(), headingId = useId();
  const textarea = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const field = textarea.current;
    if (!field || !expanded) return;
    const fit = () => {
      field.style.height = 'auto';
      field.style.height = `${field.scrollHeight}px`;
    };
    fit();
    let width = field.clientWidth;
    const observer = new ResizeObserver(() => {
      if (field.clientWidth !== width) { width = field.clientWidth; fit(); }
    });
    observer.observe(field);
    return () => observer.disconnect();
  }, [text, expanded, lang]);
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  const prompts = ar ? ['لحظة حلوة اليوم…', 'شيء تعلّمته…', 'ممتنّ اليوم لـ…'] : ['A good moment today…', 'Something I learned…', 'Today I’m grateful for…'];
  return <section aria-labelledby={headingId} dir={ar ? 'rtl' : 'ltr'} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/[.08] dark:bg-[#111416]">
    <header className="flex flex-wrap items-center justify-between gap-4 px-5 pb-5 pt-6 sm:px-7">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-400/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-300"><Feather size={23} strokeWidth={1.5} aria-hidden="true" /></span>
        <div className="flex flex-wrap items-center gap-3">
          <h2 id={headingId} className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">{ar ? 'خلّي ليومك أثر' : 'Leave a trace of your day'}</h2>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-gradient-to-r from-emerald-400/15 to-emerald-400/5 py-1 pe-3 ps-1 text-emerald-700 dark:border-emerald-300/20 dark:text-emerald-200">
            <span className="flex min-w-7 items-center justify-center rounded-full bg-emerald-400 px-1.5 py-1 text-xs font-bold tabular-nums leading-5 text-emerald-950 shadow-sm">{words}</span>
            <span className="text-[10px] font-medium">{ar ? 'كلمة' : 'words'}</span>
          </span>
        </div>
      </div>
      <button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={onToggle} className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-emerald-600/15 bg-emerald-50/70 px-3 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:border-emerald-400/15 dark:bg-emerald-400/[.06] dark:text-emerald-300 dark:hover:bg-emerald-400/10">
        <PenLine size={14} aria-hidden="true" />{expanded ? (ar ? 'طيّ' : 'Collapse') : (ar ? 'افتح صفحات يومك' : 'Open your journal')}
        <ChevronDown size={15} aria-hidden="true" className={`text-slate-400 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </header>
    <div id={panelId} hidden={!expanded} className="px-4 pb-5 sm:px-7">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#fffdf8] transition-colors focus-within:border-emerald-500/35 dark:border-white/[.08] dark:bg-[#151a19] dark:focus-within:border-emerald-400/30">
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-6 w-px bg-emerald-500/15 sm:start-10" />
          <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 py-5 pe-5 ps-11 dark:border-white/[.05] sm:pe-8 sm:ps-16">
            <div><span className="mb-1.5 block text-[9px] font-semibold tracking-[.18em] text-emerald-700/60 dark:text-emerald-300/45">{ar ? 'من دفتر أيّامك' : 'FROM YOUR JOURNAL'}</span><label htmlFor={fieldId} className="cursor-text text-base font-semibold text-slate-700 dark:text-zinc-200">{ar ? 'بين سطور هذا اليوم' : 'Between the lines of today'}</label></div>
            <time dateTime={date} className="text-[10px] text-slate-400 dark:text-zinc-500">{formatShortDate(date, lang)}</time>
          </div>
          <div className="pe-4 ps-11 sm:pe-8 sm:ps-16">
            <textarea ref={textarea} id={fieldId} value={text} onChange={event => onSave(event.target.value)} rows={8} dir={ar ? 'rtl' : 'ltr'} spellCheck={false}
              placeholder={ar ? 'خذ نفس… واكتب على راحتك.\nشو صار معك؟ وكيف حسّيت؟' : 'Take a breath. Make yourself at home.\nWhat happened? How did it feel?'}
              style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 39px, rgba(148,163,184,0.14) 39px, rgba(148,163,184,0.14) 40px)', backgroundPosition: '0 8px' }}
              className="block min-h-80 w-full resize-none overflow-hidden border-0 bg-transparent px-0 pb-2 pt-2 text-start text-sm leading-10 text-slate-700 caret-emerald-500 placeholder:text-slate-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600 sm:text-[15px]" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-[10px] text-slate-400 dark:text-zinc-500 sm:px-8">
            <span role="status" className={`inline-flex items-center gap-1.5 ${failed ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-700/70 dark:text-emerald-300/60'}`}>{failed ? <AlertCircle size={13} aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}{failed ? (ar ? 'تعذّر الحفظ. كتابتك ما زالت هنا.' : 'Could not save. Your writing is still here.') : (ar ? 'سطورك محفوظة تلقائيًا' : 'Your words are autosaved')}</span>
            {failed && <button type="button" onClick={() => onSave(text)} className="min-h-9 cursor-pointer rounded-lg px-2 font-semibold text-emerald-700 hover:bg-emerald-500/10 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-emerald-300">{ar ? 'إعادة الحفظ' : 'Retry save'}</button>}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="me-1 text-[10px] text-slate-400 dark:text-zinc-500">{ar ? 'مش عارف من وين تبدأ؟' : 'Need a first line?'}</span>
          {prompts.map(prompt => <button key={prompt} type="button" onClick={() => { onSave(`${text}${text && !text.endsWith('\n') ? '\n' : ''}${prompt} `); textarea.current?.focus(); }} className="min-h-9 cursor-pointer rounded-full border border-slate-200 px-3 text-[10px] text-slate-500 transition-colors hover:border-emerald-400/40 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:border-white/[.07] dark:text-zinc-400 dark:hover:bg-emerald-400/[.06] dark:hover:text-emerald-300">{prompt}</button>)}
        </div>
    </div>
  </section>;
}
