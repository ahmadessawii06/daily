import React, { useState, useEffect, useId } from 'react';
import { X, AlertCircle, Trash2, Edit3 } from 'lucide-react';
import { Language, PlannerCategory, Task, TaskStatus } from '../types';
import { UNASSIGNED_CATEGORY } from '../shared/workspace';
import { formatTime12h } from '../utils/date';
import { getTaskContextIcon } from '../utils/taskIconHelper';

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
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const formId = useId();
  const fieldClass = 'task-input min-h-11 min-w-0 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-white/10 dark:placeholder:text-zinc-500 dark:focus:border-emerald-400/70';
  const labelClass = 'mb-2 block text-xs font-medium text-slate-600 dark:text-zinc-400';

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setTime(task.time);
      setStatus(task.status);
      setNotes(task.notes || '');
      setCategoryId(task.categoryId || task.category || UNASSIGNED_CATEGORY);
      setError(null);
    }
  }, [task]);

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
      notes: notes.trim() || undefined,
      categoryId,
    });

    onClose();
  };

  const handleDelete = () => {
    onDelete(task.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0d0e14] border border-slate-200 dark:border-white/[0.12] rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl relative overflow-hidden max-h-[88dvh] overflow-y-auto transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-heading`}
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400" />

        <button
          onClick={onClose}
          type="button"
          aria-label={lang === 'ar' ? 'إغلاق تعديل المهمة' : 'Close task editor'}
          className="absolute top-4 end-4 sm:top-5 sm:end-5 p-2 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="mb-6 flex items-center gap-3 pe-10">
          <div aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
            <Edit3 className="h-4 w-4" strokeWidth={1.8} />
          </div>
          <h2 id={`${formId}-heading`} className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-['Alexandria','Cairo']">
            {lang === 'ar' ? 'تعديل المهمة' : 'Edit task'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30 flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title */}
          <div>
            <label htmlFor={`${formId}-title`} className={labelClass}>
              {lang === 'ar' ? 'اسم المهمة' : 'Task name'}
            </label>
            <div className="relative flex items-center">
              <div className={`absolute start-2.5 w-7 h-7 rounded-lg flex items-center justify-center pointer-events-none transition-all ${getTaskContextIcon(title).bgClass}`}>
                {React.createElement(getTaskContextIcon(title).icon, {
                  className: `w-3.5 h-3.5 ${getTaskContextIcon(title).iconClass}`,
                })}
              </div>
              <input
                id={`${formId}-title`}
                type="text"
                value={title}
                aria-label={lang === 'ar' ? 'اسم المهمة' : 'Task name'}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError(null);
                }}
                className={`${fieldClass} ps-12 pe-4`}
              />
            </div>
          </div>

          <div>
            <label htmlFor={`${formId}-category`} className={labelClass}>{lang === 'ar' ? 'البطاقة' : 'Card'}</label>
            <select id={`${formId}-category`} value={categories.some(c => c.id === categoryId) ? categoryId : UNASSIGNED_CATEGORY} onChange={e => setCategoryId(e.target.value)} className={fieldClass}>
              <option value={UNASSIGNED_CATEGORY}>{lang === 'ar' ? 'غير مصنّف' : 'Unassigned'}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{lang === 'ar' ? c.name : c.nameEn || c.name}</option>)}
            </select>
          </div>
          {/* Time & Status */}
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label htmlFor={`${formId}-time`} className={labelClass}>
                {lang === 'ar' ? 'الوقت (اختياري)' : 'Time (optional)'}
              </label>
              <div className="relative" dir="ltr">
                <input
                  id={`${formId}-time`}
                  type="time"
                  value={time}
                  aria-label={lang === 'ar' ? 'الوقت (اختياري)' : 'Time (optional)'}
                  onChange={(e) => {
                    setTime(e.target.value);
                    if (error) setError(null);
                  }}
                  className={`${fieldClass} edit-task-time focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 dark:focus-within:border-emerald-400/70`}
                />
                <span aria-hidden="true" className={`edit-task-time-display pointer-events-none absolute inset-y-0 left-3 right-9 flex items-center whitespace-nowrap text-sm font-normal ${time ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-500'}`}>{time ? formatTime12h(time, lang).formatted : (lang === 'ar' ? 'اختر الوقت' : 'Choose time')}</span>
              </div>
            </div>

            <div className="min-w-0">
              <label htmlFor={`${formId}-status`} className={labelClass}>
                {lang === 'ar' ? 'حالة المهمة' : 'Status'}
              </label>
              <select
                id={`${formId}-status`}
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={fieldClass}
              >
                <option value="pending">{lang === 'ar' ? 'بدون حالة' : 'No status'}</option>
                <option value="done">{lang === 'ar' ? '✓ مكتملة' : 'Done'}</option>
                <option value="not-done">{lang === 'ar' ? '✕ غير منجزة' : 'Not Done'}</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor={`${formId}-notes`} className={labelClass}>
              {lang === 'ar' ? 'ملاحظة' : 'Note'}
            </label>
            <input
              id={`${formId}-notes`}
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'ar' ? 'أي ملاحظة إضافية...' : 'Optional notes...'}
              className={fieldClass}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="min-h-11 px-5 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200 rounded-xl transition-all shadow-sm cursor-pointer font-['Alexandria']"
            >
              {lang === 'ar' ? 'حفظ التعديل' : 'Save'}
            </button>
          </div>
          <div className="border-t border-slate-200 pt-3 dark:border-white/[0.08]">
            <button type="button" onClick={handleDelete} className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300">
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
              {lang === 'ar' ? 'حذف المهمة' : 'Delete'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
