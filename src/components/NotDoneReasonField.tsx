import { useId, useState } from 'react';
import type { Language } from '../types';
import { Check } from 'lucide-react';

export function NotDoneReasonField({ value, onChange, lang }: { value: string; onChange: (value: string) => void; lang: Language }) {
  const id = useId();
  const ar = lang === 'ar';
  const choices = ar
    ? ['ما في وقت', 'تعب أو قلة طاقة', 'ظرف طارئ', 'بانتظار شخص أو شيء', 'تغيّرت الأولويات']
    : ['Not enough time', 'Low energy', 'Unexpected event', 'Waiting on someone or something', 'Priorities changed'];
  const otherChoice = ar ? 'سبب آخر' : 'Other reason';
  const initialChoice = choices.includes(value) ? value : value ? otherChoice : '';
  const [selectedChoice, setSelectedChoice] = useState(initialChoice);
  const [customReason, setCustomReason] = useState(initialChoice === otherChoice ? value : '');
  const selectChoice = (choice: string) => {
    const nextChoice = selectedChoice === choice ? '' : choice;
    setSelectedChoice(nextChoice);
    onChange(nextChoice === otherChoice ? customReason : choices.includes(nextChoice) ? nextChoice : '');
  };
  return <fieldset className="space-y-3">
    <legend className="sr-only">{ar ? 'سبب عدم أداء الصلاة' : 'Reason for not performing prayer'}</legend>
    <p className="text-sm leading-6 text-slate-600 dark:text-zinc-300">{ar ? 'دوّن السبب إن أحببت، لتفهم ظروف يومك بشكل أفضل' : 'Add a reason if you wish, to better understand your day.'}</p>
    <div className="grid grid-cols-2 gap-2.5">
      {[...choices, otherChoice].map(choice => {
        const selected = selectedChoice === choice;
        return <button key={choice} type="button" aria-pressed={selected} onClick={() => selectChoice(choice)} className={`relative flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-center text-sm leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 ${selected ? 'border-teal-300/70 bg-teal-500/15 text-teal-800 dark:bg-teal-400/15 dark:text-teal-100' : 'border-slate-200 text-slate-600 hover:border-teal-300/50 hover:bg-teal-50/60 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.04]'}`}>
          {selected && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}
          <span>{choice}</span>
        </button>;
      })}
    </div>
    {selectedChoice === otherChoice && <>
      <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-zinc-300">{ar ? 'اكتب السبب (اختياري)' : 'Add a reason (optional)'}</label>
      <textarea id={id} value={customReason} maxLength={200} rows={3} onChange={event => { setCustomReason(event.target.value); onChange(event.target.value); }} placeholder={ar ? 'اكتب هنا إن أحببت…' : 'Write here if you wish…'} className="task-input min-h-20 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-teal-400 dark:border-white/10 dark:focus:border-teal-300" />
    </>}
  </fieldset>;
}
