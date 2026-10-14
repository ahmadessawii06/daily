import { useEffect, useId, useRef, useState } from 'react';
import { Check, Pin, PinOff, Plus, X } from 'lucide-react';
import type { Language, Task, TaskStatus } from '../types';
import { getFocusTasks, isFocusTaskEligible, MAX_FOCUS_TASKS } from '../shared/taskPlanning';
import { nextTaskStatus } from '../utils/taskStatus';
import { TaskStatusIndicator } from './TaskStatusIndicator';

interface TopFocusProps {
  tasks: Task[];
  lang: Language;
  onToggleFocus: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  readOnly?: boolean;
}

export function TopFocus({ tasks, lang, onToggleFocus, onStatusChange, readOnly = false }: TopFocusProps) {
  const ar = lang === 'ar', focus = getFocusTasks(tasks);
  const [choosing, setChoosing] = useState(false);
  const [query, setQuery] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null), openerRef = useRef<HTMLElement | null>(null);
  const headingId = useId(), sectionId = useId();
  useEffect(() => {
    if (!choosing) return;
    const previousOverflow = document.body.style.overflow;
    openerRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    return () => { document.body.style.overflow = previousOverflow; if (openerRef.current?.isConnected) openerRef.current.focus({ preventScroll: true }); };
  }, [choosing]);
  const eligible = tasks.filter(isFocusTaskEligible).filter(task => task.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <section data-top-focus aria-labelledby={sectionId} className="mb-4 rounded-2xl border border-emerald-500/15 bg-white px-4 py-4 dark:border-emerald-400/15 dark:bg-[#0e1717] sm:px-5">
    <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Pin aria-hidden="true" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /><h2 id={sectionId} className="text-sm font-semibold">{ar ? 'أهم 3 مهام' : 'Your top 3'}</h2><span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] tabular-nums text-slate-500 dark:bg-white/5 dark:text-zinc-400" dir="ltr">{focus.length}/3</span></div>{!readOnly && <button type="button" onClick={() => { setQuery(''); setChoosing(true); }} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-emerald-700 hover:bg-emerald-500/10 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-emerald-300"><Plus aria-hidden="true" className="h-3.5 w-3.5" />{ar ? 'اختيار المهام' : 'Choose tasks'}</button>}</div>
    {focus.length ? <div className="mt-3 grid gap-2 md:grid-cols-3">{focus.map((task, index) => <div key={task.id} data-focus-task={task.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-2 py-2 dark:border-white/[.07] dark:bg-white/[.02]"><span aria-hidden="true" className="px-1 text-[10px] tabular-nums text-slate-400 dark:text-zinc-500">0{index + 1}</span><button type="button" disabled={readOnly} onClick={() => onStatusChange(task.id, nextTaskStatus(task.status))} aria-label={ar ? `تغيير حالة ${task.title}` : `Change status of ${task.title}`} className="flex h-9 w-7 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-emerald-500"><TaskStatusIndicator status={task.status} /></button><span title={task.title} className={`line-clamp-2 min-w-0 flex-1 break-words text-xs leading-6 ${task.status === 'done' ? 'text-slate-500 dark:text-zinc-400' : ''}`}>{task.title}</span>{!readOnly && <button type="button" onClick={() => onToggleFocus(task.id)} aria-label={ar ? `إلغاء تثبيت ${task.title}` : `Unpin ${task.title}`} className="flex h-9 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:hover:text-emerald-300"><PinOff aria-hidden="true" className="h-3.5 w-3.5" /></button>}</div>)}</div> : <p className="mt-2 text-[11px] leading-6 text-slate-500 dark:text-zinc-400">{ar ? 'اختَر حتى ثلاث مهام يضل تركيزك عليها اليوم.' : 'Choose up to three tasks to keep in focus today.'}</p>}
    {choosing && !readOnly && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm" onPointerDown={event => { if (event.target === event.currentTarget) setChoosing(false); }}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={headingId} className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-[#11131a]" onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); setChoosing(false); }
      if (event.key !== 'Tab') return;
      const elements = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input')];
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}><div className="mb-3 flex items-center justify-between gap-3"><h2 id={headingId} className="text-base font-semibold">{ar ? 'اختَر أهم 3 مهام' : 'Choose your top 3'}</h2><button type="button" onClick={() => setChoosing(false)} aria-label={ar ? 'إغلاق اختيار المهام' : 'Close task picker'} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 focus-visible:outline-2 focus-visible:outline-emerald-500"><X aria-hidden="true" className="h-4 w-4" /></button></div><p role="status" className="mb-3 text-[11px] leading-6 text-slate-500 dark:text-zinc-400">{ar ? `${focus.length} من 3 محددة. التغيير يُحفظ مباشرة.` : `${focus.length} of 3 selected. Changes save immediately.`}</p><input value={query} onChange={event => setQuery(event.target.value)} aria-label={ar ? 'البحث في مهام اليوم' : 'Search today’s tasks'} placeholder={ar ? 'ابحث عن مهمة…' : 'Find a task…'} className="task-input mb-3 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-500 dark:border-white/10" /><div className="min-h-0 space-y-1 overflow-y-auto">{eligible.map(task => <button key={task.id} type="button" role="checkbox" aria-checked={Boolean(task.isTopFocus)} disabled={!task.isTopFocus && focus.length >= MAX_FOCUS_TASKS} onClick={() => onToggleFocus(task.id)} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-xs leading-6 hover:bg-slate-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-40 dark:hover:bg-white/5"><span aria-hidden="true" className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${task.isTopFocus ? 'border-emerald-500 bg-emerald-500 text-white dark:text-[#08140f]' : 'border-slate-300 dark:border-zinc-600'}`}>{task.isTopFocus && <Check className="h-3 w-3" />}</span><span className="min-w-0 break-words">{task.title}</span></button>)}{!eligible.length && <p className="py-6 text-center text-xs leading-6 text-slate-500 dark:text-zinc-400">{ar ? 'لا توجد مهام مطابقة. أضف مهمة أولًا من البطاقات أو الجدول.' : 'No matching tasks. Add a task in Cards or Timeline first.'}</p>}</div><button type="button" onClick={() => setChoosing(false)} className="mt-4 min-h-10 rounded-xl bg-emerald-500 px-4 text-xs font-semibold text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">{ar ? 'تم' : 'Done'}</button></div></div>}
  </section>;
}
