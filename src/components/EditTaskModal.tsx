import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Trash2, Edit3 } from 'lucide-react';
import { Language, Task, TaskCategory, TaskStatus } from '../types';
import { formatTime12h } from '../utils/date';
import { CATEGORIES, autoDetectCategory } from '../utils/categories';
import { minutesToTime, timeToMinutes } from '../utils/storage';

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
  const [duration, setDuration] = useState<number>(60);
  const [category, setCategory] = useState<TaskCategory>('general');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setTime(task.time);
      setDuration(task.duration || 60);
      setCategory(task.category || autoDetectCategory(task.title));
      setStatus(task.status);
      setNotes(task.notes || '');
      setError(null);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const calculatedEndTime = minutesToTime(timeToMinutes(time) + duration);

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
      endTime: calculatedEndTime,
      duration,
      category,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#11131a] border border-slate-200 dark:border-white/[0.1] rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto transition-colors"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 end-5 p-2 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="mb-4">
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            {lang === 'ar' ? 'تعديل المهمة' : 'Edit Task'}
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-['Alexandria','Cairo']">
            {lang === 'ar' ? 'تعديل بيانات المهمة' : 'Modify Task Details'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30 flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1.5 font-['Alexandria']">
              {lang === 'ar' ? 'اسم المهمة' : 'Task Name'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              className="w-full bg-slate-50 dark:bg-[#090a0f] border border-slate-300 dark:border-white/[0.1] rounded-xl px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1.5 font-['Alexandria']">
                {lang === 'ar' ? 'وقت البدء' : 'Start Time'}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full bg-slate-50 dark:bg-[#090a0f] border border-slate-300 dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1.5 font-['Alexandria']">
                {lang === 'ar' ? 'المدة' : 'Duration'}
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 dark:bg-[#090a0f] border border-slate-300 dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={30}>{lang === 'ar' ? '30 دقيقة' : '30 mins'}</option>
                <option value={60}>{lang === 'ar' ? 'ساعة واحدة (60د)' : '1 hour'}</option>
                <option value={90}>{lang === 'ar' ? 'ساعة ونصف (90د)' : '1.5 hours'}</option>
                <option value={120}>{lang === 'ar' ? 'ساعتان (120د)' : '2 hours'}</option>
                <option value={180}>{lang === 'ar' ? '3 ساعات' : '3 hours'}</option>
                <option value={240}>{lang === 'ar' ? '4 ساعات' : '4 hours'}</option>
                <option value={300}>{lang === 'ar' ? '5 ساعات' : '5 hours'}</option>
                <option value={420}>{lang === 'ar' ? '7 ساعات' : '7 hours'}</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold px-1">
            {lang === 'ar' ? `من ${time} حتى ${calculatedEndTime}` : `${time} to ${calculatedEndTime}`}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1.5 font-['Alexandria']">
              {lang === 'ar' ? 'التصنيف' : 'Category'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['study', 'worship', 'health', 'rest', 'sleep', 'work'] as TaskCategory[]).map((catKey) => {
                const meta = CATEGORIES[catKey];
                const isSelected = category === catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`px-2 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      isSelected
                        ? `${meta.badgeClass} ring-2 ring-emerald-500/30 font-extrabold`
                        : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-zinc-400 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                    <span>{lang === 'ar' ? meta.nameAr : meta.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1.5 font-['Alexandria']">
              {lang === 'ar' ? 'حالة المهمة' : 'Status'}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full bg-slate-50 dark:bg-[#090a0f] border border-slate-300 dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="pending">{lang === 'ar' ? 'عادية (مجدولة بدون حالة)' : 'Scheduled / Normal'}</option>
              <option value="done">{lang === 'ar' ? '✓ مكتملة' : 'Done'}</option>
              <option value="not-done">{lang === 'ar' ? '✕ غير منجزة' : 'Not Done'}</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 font-['Alexandria']">
              {lang === 'ar' ? 'ملاحظة (اختياري)' : 'Notes'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'ar' ? 'أي ملاحظة...' : 'Notes...'}
              className="w-full bg-slate-50 dark:bg-[#090a0f] border border-slate-300 dark:border-white/[0.1] rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 py-1.5 px-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'حذف المهمة' : 'Delete'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-xs cursor-pointer font-['Alexandria']"
              >
                {lang === 'ar' ? 'حفظ التعديل' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
