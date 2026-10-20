import React, { useState, useEffect, useId, useRef } from 'react';
import { X, AlertCircle, Trash2, Check, Circle, Layers3, Clock3, ChevronDown } from 'lucide-react';
import { Language, PlannerCategory, Task, TaskStatus } from '../types';
import { UNASSIGNED_CATEGORY } from '../shared/workspace';
import { formatTime12h } from '../utils/date';
import { getTaskContextIcon } from '../utils/taskIconHelper';
import { NotDoneReasonField } from './NotDoneReasonField';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  lang: Language;
  categories?: PlannerCategory[];
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  lang,
  categories = [],
}) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [notDoneReason, setNotDoneReason] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const formId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const ar = lang === 'ar';
  const fieldClass = 'task-input min-h-11 min-w-0 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-white/10 dark:placeholder:text-zinc-500 dark:focus:border-emerald-400/70';
  const labelClass = 'mb-2 block text-xs font-medium text-slate-600 dark:text-zinc-400';

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setTime(task.time);
      setStatus(task.status);
      setNotDoneReason(task.notDoneReason || '');
      setCategoryId(task.categoryId || task.category || UNASSIGNED_CATEGORY);
      setError(null);
    }
  }, [task]);

  useEffect(() => {
    if (!isOpen || !task) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen, task?.id]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedTime = time.trim();

    if (!trimmedTitle) {
      setError(lang === 'ar' ? 'يرجى كتابة اسم المهمة' : 'Please enter a task name');
      return;
    }

    onUpdate(task.id, {
      title: trimmedTitle,
      time: trimmedTime,
      status,
      notDoneReason: status === 'not-done' ? notDoneReason.trim() : '',
      categoryId,
    });

    onClose();
  };

  const handleDelete = () => {
    onDelete(task.id);
    onClose();
  };

  const ContextIcon = getTaskContextIcon(title).icon;
  const selectedCategory = categories.find(category => category.id === categoryId);
  const states = [
    { value: 'pending', label: ar ? 'متبقية' : 'Remaining', icon: Circle, active: 'border-amber-300/70 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/[0.08] dark:text-amber-300' },
    { value: 'done', label: ar ? 'مكتملة' : 'Complete', icon: Check, active: 'border-emerald-400/60 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300' },
    { value: 'not-done', label: ar ? 'غير منجزة' : 'Not done', icon: X, active: 'border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-400/35 dark:bg-rose-400/10 dark:text-rose-300' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-md sm:p-6">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={`${formId}-heading`} tabIndex={-1}
        className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl outline-none dark:border-white/10 dark:bg-[#101218] dark:text-zinc-100"
        onKeyDown={event => {
          if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); onClose(); }
          if (event.key !== 'Tab') return;
          const elements = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)')];
          const first = elements[0], last = elements[elements.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last?.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}>
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-5 dark:border-white/[0.07] sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/70 bg-emerald-50 text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"><ContextIcon className="h-[18px] w-[18px]" strokeWidth={1.7} /></div>
            <h2 id={`${formId}-heading`} className="text-lg font-semibold tracking-tight">{ar ? 'تعديل المهمة' : 'Edit task'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={ar ? 'إغلاق تعديل المهمة' : 'Close task editor'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-emerald-400 dark:text-zinc-500 dark:hover:bg-white/5 dark:hover:text-zinc-200"><X aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} /></button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div data-editor-body className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="min-w-0 space-y-6 p-5 sm:p-6">
              <div>
                <label htmlFor={`${formId}-title`} className={labelClass}>{ar ? 'اسم المهمة' : 'Task name'}</label>
                <input id={`${formId}-title`} type="text" value={title} aria-label={ar ? 'اسم المهمة' : 'Task name'} aria-invalid={Boolean(error)} aria-describedby={error ? `${formId}-error` : undefined}
                  onChange={event => { setTitle(event.target.value); if (error) setError(null); }}
                  className={`${fieldClass} min-h-12 px-4 text-base`} />
                {error && <p id={`${formId}-error`} role="alert" className="mt-2 flex items-center gap-2 text-xs leading-5 text-rose-600 dark:text-rose-300"><AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />{error}</p>}
              </div>

              <fieldset>
                <legend className={labelClass}>{ar ? 'حالة المهمة' : 'Task status'}</legend>
                <div className="grid grid-cols-3 gap-2">
                  {states.map(({ value, label, icon: Icon, active }) => <label key={value} className="relative min-w-0 cursor-pointer">
                    <input type="radio" name={`${formId}-status`} value={value} checked={status === value} onChange={() => setStatus(value)} className="peer sr-only" />
                    <span className={`flex min-h-[68px] flex-col items-center justify-center gap-2 rounded-xl border px-1 py-2 text-[11px] font-medium transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-400 sm:text-xs ${status === value ? active : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.08] dark:text-zinc-400 dark:hover:border-white/20 dark:hover:bg-white/[0.03]'}`}><Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} /><span className="whitespace-nowrap">{label}</span></span>
                  </label>)}
                </div>
              </fieldset>
              {status === 'not-done' && <NotDoneReasonField value={notDoneReason} onChange={setNotDoneReason} lang={lang} />}

              <div data-editor-details className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/[0.07] dark:bg-white/[0.02] min-[520px]:grid-cols-2">
                <div className="min-w-0">
                  <label htmlFor={`${formId}-category`} className={`${labelClass} flex items-center gap-2`}><Layers3 aria-hidden="true" className="h-3.5 w-3.5" />{ar ? 'البطاقة' : 'Card'}</label>
                  <div className="group/category relative">
                    <select id={`${formId}-category`} title={selectedCategory ? (ar ? selectedCategory.name : selectedCategory.nameEn || selectedCategory.name) : (ar ? 'غير مصنّف' : 'Unassigned')} value={selectedCategory?.id || UNASSIGNED_CATEGORY} onChange={event => setCategoryId(event.target.value)} className={`${fieldClass} edit-task-category cursor-pointer appearance-none pe-10 hover:border-slate-400 dark:hover:border-white/20`}>
                      <option value={UNASSIGNED_CATEGORY}>{ar ? 'غير مصنّف' : 'Unassigned'}</option>
                      {categories.map(category => <option key={category.id} value={category.id}>{ar ? category.name : category.nameEn || category.name}</option>)}
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within/category:text-emerald-600 dark:text-zinc-500 dark:group-focus-within/category:text-emerald-300" strokeWidth={1.8} />
                  </div>
                </div>
                <div className="min-w-0">
                  <label htmlFor={`${formId}-time`} className={`${labelClass} flex items-center gap-2`}><Clock3 aria-hidden="true" className="h-3.5 w-3.5" />{ar ? 'الوقت' : 'Time'}<span className="ms-auto text-[10px] font-normal text-slate-400 dark:text-zinc-500">{ar ? 'اختياري' : 'Optional'}</span></label>
                  <div className="relative" dir="ltr">
                    <input id={`${formId}-time`} type="time" value={time} aria-label={ar ? 'الوقت (اختياري)' : 'Time (optional)'} onChange={event => setTime(event.target.value)} className={`${fieldClass} edit-task-time focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 dark:focus-within:border-emerald-400/70`} />
                    <span aria-hidden="true" className={`edit-task-time-display pointer-events-none absolute inset-y-0 left-3 right-9 flex items-center whitespace-nowrap text-xs font-normal ${time ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-500'}`}>{time ? formatTime12h(time, lang).formatted : (ar ? 'اختر الوقت' : 'Choose time')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200/80 bg-white px-4 py-4 dark:border-white/[0.07] dark:bg-[#11131a] sm:px-6">
            <button type="button" onClick={handleDelete} aria-label={ar ? 'حذف المهمة' : 'Delete task'} title={ar ? 'حذف المهمة' : 'Delete task'} className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-normal text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-rose-400 dark:text-zinc-500 dark:hover:bg-rose-400/10 dark:hover:text-rose-300"><Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} /><span className="hidden sm:inline">{ar ? 'حذف' : 'Delete'}</span></button>
            <div className="flex items-center gap-2 border-s border-slate-200/70 ps-3 dark:border-white/[0.08] sm:gap-3 sm:ps-5">
              <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-emerald-400 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5 sm:px-4">{ar ? 'إلغاء' : 'Cancel'}</button>
              <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#10e588] px-3 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-[#0fd07b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:px-5"><Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.2} />{ar ? 'حفظ التعديل' : 'Save changes'}</button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};
