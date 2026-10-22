import React, { useEffect, useState } from 'react';
import { BookOpenText, Check, Image } from 'lucide-react';
import type { Language } from '../types';
import { DayJournal } from './DayJournal';
import { DayPhoto } from './DayPhoto';
import { getDayRecord } from '../utils/storage';

export function DayMemories({ date, lang, onSaved }: { date: string; lang: Language; onSaved: () => void }) {
  const [open, setOpen] = useState<'journal' | 'photo' | null>(null);
  const [visited, setVisited] = useState({ journal: false, photo: false });
  const [, refresh] = useState(0);
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
  return <div className="space-y-3">
    <div id="header-day-memories" role="group" aria-label={ar ? 'ذكريات اليوم' : 'Day memories'} className="flex items-center gap-2">
      {(['journal', 'photo'] as const).map(kind => {
        const Icon = kind === 'journal' ? BookOpenText : Image;
        const label = kind === 'journal' ? (ar ? 'خلّي ليومك أثر' : 'Leave a trace of your day') : (ar ? 'صورة اليوم' : 'Photo of the day');
        const active = open === kind;
        const hasContent = kind === 'journal' ? hasJournal : photoCount > 0;
        const badgeLabel = kind === 'journal' ? (ar ? 'في هذا اليوم يوميات مكتوبة' : 'This day has a journal entry') : (ar ? `صور هذا اليوم: ${photoCount}` : `Photos for this day: ${photoCount}`);
        return <button key={kind} id={`header-day-${kind}-btn`} type="button" title={hasContent ? `${label} — ${badgeLabel}` : label} aria-label={hasContent ? `${label} — ${badgeLabel}` : label} aria-expanded={active} aria-controls={`memory-${kind}`} onClick={() => { setVisited(prev => ({ ...prev, [kind]: true })); setOpen(active ? null : kind); }}
          className={`group relative flex size-11 cursor-pointer items-center justify-center rounded-xl border transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 ${kind === 'journal' ? 'hover:border-emerald-400/60 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-[0_6px_20px_-6px_rgba(16,185,129,0.4)] focus-visible:outline-emerald-500 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300' : 'hover:border-amber-400/60 hover:bg-amber-50 hover:text-amber-700 hover:shadow-[0_6px_20px_-6px_rgba(245,158,11,0.4)] focus-visible:outline-amber-500 dark:hover:border-amber-400/40 dark:hover:bg-amber-400/10 dark:hover:text-amber-300'} ${active ? (kind === 'journal' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300') : 'border-slate-200/80 bg-slate-100/70 text-slate-600 dark:border-white/[.08] dark:bg-white/[.04] dark:text-zinc-300'}`}>
          <Icon size={19} strokeWidth={1.8} aria-hidden="true" className={`motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${kind === 'journal' ? 'motion-safe:group-hover:-rotate-12 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:-rotate-12 motion-safe:group-focus-visible:scale-110' : 'motion-safe:group-hover:rotate-6 motion-safe:group-hover:scale-125 motion-safe:group-focus-visible:rotate-6 motion-safe:group-focus-visible:scale-125'}`} />
          {hasContent && <span aria-hidden="true" className={`absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums shadow-sm ring-2 ring-white dark:ring-[#111416] ${kind === 'journal' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'}`}>
            {kind === 'journal' ? <Check size={12} strokeWidth={3} /> : photoCount}
          </span>}
        </button>;
      })}
    </div>
    <div id="memory-journal" hidden={open !== 'journal'}>{visited.journal && <DayJournal date={date} lang={lang} onSaved={saved} initiallyExpanded />}</div>
    <div id="memory-photo" hidden={open !== 'photo'}>{visited.photo && <DayPhoto date={date} lang={lang} onSaved={saved} />}</div>
  </div>;
}
