import { useId } from 'react';
import type { Language } from '../types';

export function NotDoneReasonField({ value, onChange, lang }: { value: string; onChange: (value: string) => void; lang: Language }) {
  const id = useId();
  const ar = lang === 'ar';
  const choices = ar ? ['ما في وقت', 'تعب أو قلة طاقة', 'ظرف طارئ', 'بانتظار شخص أو شيء', 'تغيّرت الأولويات'] : ['Not enough time', 'Low energy', 'Unexpected event', 'Waiting on someone or something', 'Priorities changed'];
  return <fieldset className="space-y-3">
    <legend className="mb-2 text-sm font-semibold">{ar ? 'سبب عدم الإنجاز' : 'Reason for not completing'}</legend>
    <p className="text-xs leading-6 text-slate-500 dark:text-zinc-400">{ar ? 'اختياري — لفهم يومك وتحسين التخطيط، بدون لوم.' : 'Optional — understand your day and plan better, without judgment.'}</p>
    <div className="flex flex-wrap gap-2">{choices.map(choice => <button key={choice} type="button" aria-pressed={value === choice} onClick={() => onChange(value === choice ? '' : choice)} className={`min-h-10 rounded-xl border px-3 py-2 text-xs ${value === choice ? 'border-rose-400 bg-rose-400/10 text-rose-600 dark:text-rose-300' : 'border-slate-200 text-slate-600 dark:border-white/10 dark:text-zinc-300'}`}>{choice}</button>)}</div>
    <label htmlFor={id} className="block text-xs text-slate-500 dark:text-zinc-400">{ar ? 'اكتب السبب أو عدّله' : 'Write or edit the reason'}</label>
    <input id={id} value={value} maxLength={200} onChange={event => onChange(event.target.value)} placeholder={ar ? 'سبب آخر…' : 'Another reason…'} className="task-input min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-rose-400 dark:border-white/10" />
  </fieldset>;
}
