import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, FileText, AlertCircle } from 'lucide-react';
import { Language, TaskStatus } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: { title: string; time: string; status: TaskStatus; notes?: string }) => void;
  lang: Language;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  lang,
}) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const currentHour = String((now.getHours() + 1) % 24).padStart(2, '0');
      setTime(`${currentHour}:00`);
      setTitle('');
      setNotes('');
      setError(null);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedTime = time.trim();

    if (!trimmedTitle) {
      setError(lang === 'ar' ? 'يرجى كتابة اسم المهمة' : 'Please enter a task name');
      titleInputRef.current?.focus();
      return;
    }

    if (!trimmedTime) {
      setError(lang === 'ar' ? 'يرجى تحديد وقت المهمة' : 'Please specify a time');
      return;
    }

    onAdd({
      title: trimmedTitle,
      time: trimmedTime,
      status: 'pending',
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const presetTimes = ['05:00', '08:00', '10:00', '12:00', '16:00', '20:00'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-[#0d0e13] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 end-4 p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="mb-5">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {lang === 'ar' ? 'إضافة مهمة جديدة' : 'Add new task'}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {lang === 'ar' ? 'حدد اسم المهمة ووقتها لإضافتها لجدول اليوم' : 'Enter the task details and time'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Task Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              {lang === 'ar' ? 'اسم المهمة' : 'Task name'}
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder={lang === 'ar' ? 'مثال: صلاة الفجر، دراسة، تمرين...' : 'e.g., Study, Workout, Review...'}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition-colors"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              {lang === 'ar' ? 'الوقت' : 'Time'}
            </label>
            <div className="flex items-center gap-2">
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

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              <span className="text-[11px] text-zinc-500 shrink-0">
                {lang === 'ar' ? 'أوقات سريعة:' : 'Quick:'}
              </span>
              {presetTimes.map((pTime) => (
                <button
                  key={pTime}
                  type="button"
                  onClick={() => setTime(pTime)}
                  className={`px-2 py-0.5 rounded text-xs font-mono tabular-nums transition-colors ${
                    time === pTime
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                      : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                  }`}
                >
                  {pTime}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              {lang === 'ar' ? 'ملاحظة (اختياري)' : 'Note (Optional)'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'ar' ? 'أي تفاصيل إضافية...' : 'Any extra details...'}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition-colors"
            />
          </div>

          {/* Buttons: Cancel & Add Task */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-xl transition-all shadow-sm"
            >
              {lang === 'ar' ? 'إضافة المهمة' : 'Add Task'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
