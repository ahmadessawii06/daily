import { useEffect, useRef, useState } from 'react';
import type { Language, Task } from '../types';
import { NotDoneReasonField } from './NotDoneReasonField';

export function NotDoneReasonDialog({ task, lang, onClose, onSave }: { task: Task; lang: Language; onClose: () => void; onSave: (reason: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState(task.notDoneReason || '');
  const ar = lang === 'ar';
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} onCancel={onClose} aria-labelledby="not-done-title" dir={ar ? 'rtl' : 'ltr'} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-teal-300/15 bg-white p-5 text-slate-900 shadow-xl backdrop:bg-black/70 dark:border-teal-200/10 dark:bg-[#101713] dark:text-zinc-100 sm:p-6">
    <h2 id="not-done-title" className="text-lg font-bold">{ar ? 'ما سبب عدم أداء الصلاة؟' : 'Why was the prayer not performed?'}</h2>
    <p className="mt-1 mb-4 break-words text-sm font-medium text-teal-700 dark:text-teal-200">{task.title}</p>
    <form onSubmit={event => { event.preventDefault(); onSave(reason.trim()); }}>
      <NotDoneReasonField value={reason} onChange={setReason} lang={lang} />
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">{ar ? 'تخطي' : 'Skip'}</button>
        <button type="submit" className="min-h-11 rounded-xl bg-teal-500 px-4 text-sm font-semibold text-[#06221d] transition-colors hover:bg-teal-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300">{ar ? 'حفظ السبب' : 'Save reason'}</button>
      </div>
    </form>
  </dialog>;
}
