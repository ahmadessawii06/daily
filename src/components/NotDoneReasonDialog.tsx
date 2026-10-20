import { useEffect, useRef, useState } from 'react';
import type { Language, Task } from '../types';
import { NotDoneReasonField } from './NotDoneReasonField';

export function NotDoneReasonDialog({ task, lang, onClose, onSave }: { task: Task; lang: Language; onClose: () => void; onSave: (reason: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState(task.notDoneReason || '');
  const ar = lang === 'ar';
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} onCancel={onClose} aria-labelledby="not-done-title" dir={ar ? 'rtl' : 'ltr'} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl backdrop:bg-black/70 dark:border-white/10 dark:bg-[#101218] dark:text-zinc-100">
    <h2 id="not-done-title" className="mb-1 text-base font-bold">{ar ? 'ما الذي منع إنجازها؟' : 'What got in the way?'}</h2>
    <p className="mb-5 break-words text-sm text-slate-500 dark:text-zinc-400">{task.title}</p>
    <form onSubmit={event => { event.preventDefault(); onSave(reason.trim()); }}>
      <NotDoneReasonField value={reason} onChange={setReason} lang={lang} />
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-4 text-xs dark:border-white/10">{ar ? 'تخطي' : 'Skip'}</button><button type="submit" className="min-h-11 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white">{ar ? 'حفظ السبب' : 'Save reason'}</button></div>
    </form>
  </dialog>;
}
