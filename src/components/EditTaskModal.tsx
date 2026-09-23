import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, Trash2, Edit3, Check } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-gradient-to-b from-[#13151f] to-[#0d0e14] border border-white/[0.12] rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400" />

        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 end-5 p-2 text-zinc-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              {lang === 'ar' ? 'تعديل السجل' : 'Modify Item'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight font-['Alexandria','Cairo']">
            {lang === 'ar' ? 'تعديل بيانات المهمة' : 'Edit task'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-['Alexandria']">
              {lang === 'ar' ? 'اسم المهمة' : 'Task name'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              className="w-full bg-[#08090d] border border-white/[0.1] rounded-xl px-4 py-2 text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400/80 transition-colors"
            />
          </div>

          {/* Time & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-['Alexandria']">
                {lang === 'ar' ? 'الوقت' : 'Time'}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full bg-[#08090d] border border-white/[0.1] rounded-xl px-3.5 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-400/80 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-['Alexandria']">
                {lang === 'ar' ? 'حالة المهمة' : 'Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-[#08090d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-400/80"
              >
                <option value="pending">{lang === 'ar' ? '◷ قيد الانتظار' : 'Pending'}</option>
                <option value="done">{lang === 'ar' ? '✓ مكتملة' : 'Done'}</option>
                <option value="not-done">{lang === 'ar' ? '✕ غير منجزة' : 'Not Done'}</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5 font-['Alexandria']">
              {lang === 'ar' ? 'ملاحظة' : 'Note'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'ar' ? 'أي ملاحظة إضافية...' : 'Optional notes...'}
              className="w-full bg-[#08090d] border border-white/[0.1] rounded-xl px-4 py-2 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400/80 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 py-2 px-3 rounded-xl hover:bg-rose-500/15 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 stroke-[2.2]" />
              <span>{lang === 'ar' ? 'حذف المهمة' : 'Delete'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-black text-slate-950 bg-white hover:bg-zinc-200 rounded-xl transition-all shadow-md cursor-pointer font-['Alexandria']"
              >
                {lang === 'ar' ? 'حفظ التعديل' : 'Save'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
