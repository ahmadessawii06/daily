import React, { useState } from 'react';
import { BookOpenText, Image } from 'lucide-react';
import type { Language } from '../types';
import { DayJournal } from './DayJournal';
import { DayPhoto } from './DayPhoto';

export function DayMemories({ date, lang, onSaved }: { date: string; lang: Language; onSaved: () => void }) {
  const [open, setOpen] = useState<'journal' | 'photo' | null>(null);
  const [visited, setVisited] = useState({ journal: false, photo: false });
  const ar = lang === 'ar';
  return <div className="space-y-3">
    <div role="group" aria-label={ar ? 'ذكريات اليوم' : 'Day memories'} className="flex items-center gap-2">
      {(['journal', 'photo'] as const).map(kind => {
        const Icon = kind === 'journal' ? BookOpenText : Image;
        const label = kind === 'journal' ? (ar ? 'خلّي ليومك أثر' : 'Leave a trace of your day') : (ar ? 'صورة اليوم' : 'Photo of the day');
        const active = open === kind;
        return <button key={kind} type="button" title={label} aria-label={label} aria-expanded={active} aria-controls={`memory-${kind}`} onClick={() => { setVisited(prev => ({ ...prev, [kind]: true })); setOpen(active ? null : kind); }}
          className={`group flex size-11 cursor-pointer items-center justify-center rounded-xl border transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 ${kind === 'journal' ? 'hover:border-emerald-400/60 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-[0_6px_20px_-6px_rgba(16,185,129,0.4)] focus-visible:outline-emerald-500 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300' : 'hover:border-amber-400/60 hover:bg-amber-50 hover:text-amber-700 hover:shadow-[0_6px_20px_-6px_rgba(245,158,11,0.4)] focus-visible:outline-amber-500 dark:hover:border-amber-400/40 dark:hover:bg-amber-400/10 dark:hover:text-amber-300'} ${active ? (kind === 'journal' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300') : 'border-slate-200/80 bg-slate-100/70 text-slate-600 dark:border-white/[.08] dark:bg-white/[.04] dark:text-zinc-300'}`}>
          <Icon size={19} strokeWidth={1.8} aria-hidden="true" className={`motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${kind === 'journal' ? 'motion-safe:group-hover:-rotate-12 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:-rotate-12 motion-safe:group-focus-visible:scale-110' : 'motion-safe:group-hover:rotate-6 motion-safe:group-hover:scale-125 motion-safe:group-focus-visible:rotate-6 motion-safe:group-focus-visible:scale-125'}`} />
        </button>;
      })}
    </div>
    <div id="memory-journal" hidden={open !== 'journal'}>{visited.journal && <DayJournal date={date} lang={lang} onSaved={onSaved} initiallyExpanded />}</div>
    <div id="memory-photo" hidden={open !== 'photo'}>{visited.photo && <DayPhoto date={date} lang={lang} onSaved={onSaved} />}</div>
  </div>;
}
