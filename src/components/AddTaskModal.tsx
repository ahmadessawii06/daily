import React, { useState } from 'react';
import { X, Clock, AlertCircle, Sparkles, BookOpen, Flame, Briefcase } from 'lucide-react';
import { Language, TaskCategory, TaskStatus } from '../types';
import { formatTime12h } from '../utils/date';
import { CATEGORIES, autoDetectCategory } from '../utils/categories';
import { minutesToTime, timeToMinutes } from '../utils/storage';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: { 
    title: string; 
    time: string; 
    endTime?: string;
    duration?: number;
    status: TaskStatus; 
    notes?: string;
    category?: TaskCategory;
  }) => void;
  initialStartTime?: string;
  lang: Language;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  initialStartTime = '08:00',
  lang,
}) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState(initialStartTime);
  const [duration, setDuration] = useState<number>(60);
  const [category, setCategory] = useState<TaskCategory>('general');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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

    const finalCategory = category !== 'general' ? category : autoDetectCategory(trimmedTitle);

    onAdd({
      title: trimmedTitle,
      time: trimmedTime,
      endTime: calculatedEndTime,
      duration,
      status,
      notes: notes.trim() || undefined,
      category: finalCategory,
    });

    // Reset
    setTitle('');
    setTime('08:00');
    setDuration(60);
    setCategory('general');
    setStatus('pending');
    setNotes('');
    setError(null);
    onClose();
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (error) setError(null);
    // Auto-suggest category
    const detected = autoDetectCategory(val);
    if (detected !== 'general') {
      setCategory(detected);
    }
  };

  // Quick preset shortcuts
  const presets = [
    { title: lang === 'ar' ? 'نوم واستراحة' : 'Sleep', time: '00:00', duration: 300, cat: 'sleep' as TaskCategory },
    { title: lang === 'ar' ? 'صلاة الفجر + أذكار' : 'Fajr Prayer', time: '05:00', duration: 60, cat: 'worship' as TaskCategory },
    { title: lang === 'ar' ? 'محاضرة استرجاع' : 'Study Lecture', time: '08:00', duration: 120, cat: 'study' as TaskCategory },
    { title: lang === 'ar' ? 'تمرين ونادي' : 'Workout', time: '16:00', duration: 60, cat: 'health' as TaskCategory },
    { title: lang === 'ar' ? 'برمجة وتطوير' : 'Coding & Dev', time: '19:00', duration: 120, cat: 'work' as TaskCategory },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
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
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {lang === 'ar' ? 'Daily Track • كتلة زمنية' : 'Daily Track • Time Block'}
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-['Alexandria','Cairo']">
            {lang === 'ar' ? 'إضافة مهمة جديدة' : 'Add New Task'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30 flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Presets */}
        <div className="mb-4">
          <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 font-['Alexandria']">
            {lang === 'ar' ? 'اقتراحات سريعة بنقرة واحدة:' : 'Quick Presets:'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTitle(p.title);
                  setTime(p.time);
                  setDuration(p.duration);
                  setCategory(p.cat);
                  setError(null);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                <span>{p.title}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Task Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1.5 font-['Alexandria']">
              {lang === 'ar' ? 'اسم المهمة' : 'Task Name'} *
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: نوم، دراسة الذكاء الاصطناعي، صلاة...' : 'e.g. Sleep, Study AI, Workout...'}
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
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#090a0f] border border-slate-300 dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1.5 font-['Alexandria']">
                {lang === 'ar' ? 'المدة الزمنية' : 'Duration'}
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
                <option value={240}>{lang === 'ar' ? '4 ساعات (مثل النوم)' : '4 hours'}</option>
                <option value={300}>{lang === 'ar' ? '5 ساعات' : '5 hours'}</option>
                <option value={420}>{lang === 'ar' ? '7 ساعات' : '7 hours'}</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold px-1">
            {lang === 'ar' ? `النطاق: من ${time} حتى ${calculatedEndTime}` : `Time: ${time} to ${calculatedEndTime}`}
          </div>

          {/* Category Selection */}
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
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
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

          {/* Initial Status */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1.5 font-['Alexandria']">
              {lang === 'ar' ? 'الحالة المبدئية' : 'Initial Status'}
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
              {lang === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Notes (Optional)'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'ar' ? 'أي تفاصيل عن المهمة...' : 'Details...'}
              className="w-full bg-slate-50 dark:bg-[#090a0f] border border-slate-300 dark:border-white/[0.1] rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-xs cursor-pointer font-['Alexandria']"
            >
              {lang === 'ar' ? 'حفظ المهمة' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
