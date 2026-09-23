import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Language, Task, TaskStatus } from '../types';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  lang: Language;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  lang,
}) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setTime(task.time);
      setStatus(task.status);
      setNotes(task.notes || '');
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

    if (!trimmedTime) {
      setError(lang === 'ar' ? 'يرجى إدخال الوقت' : 'Please enter time');
      return;
    }

    onUpdate(task.id, {
      title: trimmedTitle,
      time: trimmedTime,
      status,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const handleDelete = () => {
    onDelete(task.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-[#0d0e13] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 end-4 p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {lang === 'ar' ? 'تعديل المهمة' : 'Edit task'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              {lang === 'ar' ? 'اسم المهمة' : 'Task name'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition-colors"
            />
          </div>

          {/* Time & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                {lang === 'ar' ? 'الوقت' : 'Time'}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/[0.2] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                {lang === 'ar' ? 'الحالة' : 'Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-[#121319] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/[0.2]"
              >
                <option value="pending">{lang === 'ar' ? '◷ قيد الانتظار' : 'Pending'}</option>
                <option value="done">{lang === 'ar' ? '✓ مكتملة' : 'Done'}</option>
                <option value="not-done">{lang === 'ar' ? '✕ غير منجزة' : 'Not Done'}</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              {lang === 'ar' ? 'ملاحظة' : 'Note'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'ar' ? 'أي ملاحظة إضافية...' : 'Optional notes...'}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 py-1.5 px-2.5 rounded-lg hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'حذف' : 'Delete'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-xl transition-all shadow-sm"
              >
                {lang === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
