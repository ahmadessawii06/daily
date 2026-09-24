import React, { useState } from 'react';
import { X, Clock, AlertCircle, Sparkles, BookOpen, Flame, Briefcase } from 'lucide-react';
import { Language, TaskStatus } from '../types';
import { formatTime12h } from '../utils/date';
import { getTaskContextIcon } from '../utils/taskIconHelper';

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
  const [time, setTime] = useState('08:00');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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

    onAdd({
      title: trimmedTitle,
      time: trimmedTime,
      status,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setTitle('');
    setTime('08:00');
    setStatus('pending');
    setNotes('');
    setError(null);
    onClose();
  };

  // Quick preset shortcuts
  const presets = [
    { title: lang === 'ar' ? 'صلاة الفجر' : 'Fajr Prayer', time: '05:00', icon: Sparkles },
    { title: lang === 'ar' ? 'الجامعة' : 'University', time: '08:00', icon: BookOpen },
    { title: lang === 'ar' ? 'دراسة ومذاكرة' : 'Study Session', time: '12:00', icon: BookOpen },
    { title: lang === 'ar' ? 'تمرين ونادي' : 'Workout', time: '16:00', icon: Flame },
    { title: lang === 'ar' ? 'مراجعة خفيفة' : 'Review & Planning', time: '20:00', icon: Briefcase },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setTitle(preset.title);
    setTime(preset.time);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0d0e14] border border-slate-200 dark:border-white/[0.12] rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl relative overflow-hidden max-h-[88dvh] overflow-y-auto transition-colors"
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400" />

        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 end-4 sm:top-5 sm:end-5 p-2 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {lang === 'ar' ? 'مهمة جديدة' : 'New Task'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Alexandria','Cairo']">
            {lang === 'ar' ? 'إضافة مهمة لجدول اليوم' : 'Add daily task'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30 flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Presets */}
        <div className="mb-5">
          <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-2 font-['Alexandria']">
            {lang === 'ar' ? 'اقتراحات سريعة بنقرة واحدة:' : 'Quick templates:'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p, idx) => {
              const Icon = p.icon;
              const p12 = formatTime12h(p.time, lang);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-zinc-300 dark:hover:text-white dark:border-white/[0.06] transition-all cursor-pointer"
                >
                  <Icon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{p.title}</span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 font-bold">{p12.time12} {p12.periodShort}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Task Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1.5 font-['Alexandria']">
              {lang === 'ar' ? 'اسم المهمة' : 'Task name'} *
            </label>
            <div className="relative flex items-center">
              <div className={`absolute start-2.5 w-7 h-7 rounded-lg flex items-center justify-center pointer-events-none transition-all ${getTaskContextIcon(title).bgClass}`}>
                {React.createElement(getTaskContextIcon(title).icon, {
                  className: `w-3.5 h-3.5 ${getTaskContextIcon(title).iconClass}`,
                })}
              </div>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={lang === 'ar' ? 'مثال: صلاة الفجر، تمرين رياضي، عمل...' : 'e.g. Study, Gym, Meeting...'}
                className="w-full bg-slate-50 dark:bg-[#08090d] border border-slate-300 dark:border-white/[0.1] rounded-xl ps-12 pe-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400/80 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Time & Initial Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 font-['Alexandria']">
                  {lang === 'ar' ? 'الوقت' : 'Time'} *
                </label>
                {time && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-['Alexandria']">
                    {formatTime12h(time, lang).formatted}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-[#08090d] border border-slate-300 dark:border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400/80 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1.5 font-['Alexandria']">
                {lang === 'ar' ? 'الحالة المبدئية' : 'Initial status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-50 dark:bg-[#08090d] border border-slate-300 dark:border-white/[0.1] rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400/80"
              >
                <option value="pending">{lang === 'ar' ? 'عادية (بدون حالة)' : 'Normal (No status)'}</option>
                <option value="done">{lang === 'ar' ? '✓ مكتملة' : 'Done'}</option>
                <option value="not-done">{lang === 'ar' ? '✕ غير منجزة' : 'Not Done'}</option>
              </select>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 font-['Alexandria']">
              {lang === 'ar' ? 'ملاحظة أو تفاصيل (اختياري)' : 'Optional notes'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: مراجعة الشابتر الأول...' : 'Any details...'}
              className="w-full bg-slate-50 dark:bg-[#08090d] border border-slate-300 dark:border-white/[0.1] rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400/80 focus:bg-white transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:opacity-95 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer font-['Alexandria']"
            >
              {lang === 'ar' ? 'إضافة المهمة' : 'Add Task'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
