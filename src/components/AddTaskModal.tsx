import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, AlertCircle, Plus, Sparkles, Tag } from 'lucide-react';
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
      setError(lang === 'ar' ? 'يرجى كتابة اسم المهمة أولاً' : 'Please enter a task name');
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

  const quickPresets = [
    { label: lang === 'ar' ? '05:00 صلاة الفجر' : '05:00 Fajr', time: '05:00', title: lang === 'ar' ? 'صلاة الفجر وقراءة أذكار' : 'Fajr Prayer' },
    { label: lang === 'ar' ? '08:00 الجامعة' : '08:00 University', time: '08:00', title: lang === 'ar' ? 'الجامعة والدوام' : 'University' },
    { label: lang === 'ar' ? '12:00 دراسة' : '12:00 Study', time: '12:00', title: lang === 'ar' ? 'جلسة دراسة ومذاكرة' : 'Study Session' },
    { label: lang === 'ar' ? '16:00 تمرين' : '16:00 Workout', time: '16:00', title: lang === 'ar' ? 'تمرين ونادي رياضي' : 'Workout' },
    { label: lang === 'ar' ? '20:00 مراجعة' : '20:00 Review', time: '20:00', title: lang === 'ar' ? 'مراجعة وتخطيط الغد' : 'Evening Review' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-gradient-to-b from-[#13151f] to-[#0d0e14] border border-white/[0.12] rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/80 relative overflow-hidden max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle accent highlight on top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 end-5 p-2 text-zinc-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              {lang === 'ar' ? 'مهمة جديدة' : 'New Schedule Item'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight font-['Alexandria','Cairo']">
            {lang === 'ar' ? 'إضافة مهمة جديدة' : 'Add new task'}
          </h2>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Task Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-['Alexandria']">
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
              placeholder={lang === 'ar' ? 'مثال: صلاة الفجر، دراسة، تمرين...' : 'e.g., Study session, Workout...'}
              className="w-full bg-[#08090d] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400/80 focus:ring-1 focus:ring-emerald-400/30 transition-all"
            />
          </div>

          {/* Time with Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-['Alexandria'] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
              <span>{lang === 'ar' ? 'الوقت' : 'Time'}</span>
            </label>
            
            <input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                if (error) setError(null);
              }}
              className="w-full bg-[#08090d] border border-white/[0.1] rounded-xl px-4 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-400/80 focus:ring-1 focus:ring-emerald-400/30 transition-all"
            />

            {/* Quick Preset Pills */}
            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{lang === 'ar' ? 'اختصارات سريعة بنقرة واحدة:' : 'One-click quick presets:'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTime(preset.time);
                      setTitle(preset.title);
                      setError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/[0.04] hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-300 border border-white/[0.06] hover:border-emerald-500/30 transition-all cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5 font-['Alexandria']">
              {lang === 'ar' ? 'ملاحظة (اختياري)' : 'Note (Optional)'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'ar' ? 'أي تفاصيل أو سبب مثل: مراجعة السلايدات...' : 'Optional details...'}
              className="w-full bg-[#08090d] border border-white/[0.1] rounded-xl px-4 py-2 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400/80 focus:ring-1 focus:ring-emerald-400/30 transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-98 cursor-pointer font-['Alexandria']"
            >
              {lang === 'ar' ? 'إضافة المهمة' : 'Add Task'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
