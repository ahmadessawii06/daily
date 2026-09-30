import React, { useState } from 'react';
import { Plus, Zap, Clock, Flag, Calendar, Sparkles, ChevronDown, Check } from 'lucide-react';
import { Language, TaskCategory, TaskPriority } from '../types';
import { autoDetectCategory } from '../utils/categories';
import { getTodayDateString } from '../utils/date';

interface QuickAddBarProps {
  currentDate: string;
  onAddTask: (taskInput: {
    title: string;
    duration?: number;
    priority?: TaskPriority;
    category?: TaskCategory;
    deadline?: string;
    isTopFocus?: boolean;
    notes?: string;
    time?: string;
  }) => void;
  lang: Language;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  currentDate,
  onAddTask,
  lang,
}) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number>(45);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [isTopFocus, setIsTopFocus] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [deadline, setDeadline] = useState<string>('');
  const [notes, setNotes] = useState('');

  const quickDurations = [15, 30, 45, 60, 90];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      duration,
      priority,
      category: autoDetectCategory(title.trim()),
      deadline: deadline || undefined,
      isTopFocus,
      notes: notes.trim() || undefined,
      time: '', // non-rigid, flexible
    });

    // Reset
    setTitle('');
    setShowOptions(false);
    setNotes('');
    setDeadline('');
  };

  return (
    <div className="bg-white dark:bg-[#11131a] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Main Quick Input Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === 'ar' ? '⚡ إضافة سريعة: مثلاً "دراسة Database" أو "حل واجب Web"...' : '⚡ Quick add: e.g. "Study Database" or "Web Assignment"...'}
              className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500 dark:focus:border-emerald-500 rounded-xl py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none transition-all font-['Alexandria']"
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 sm:px-5 rounded-xl shadow-xs active:scale-95 transition-all text-xs sm:text-sm cursor-pointer shrink-0 font-['Alexandria']"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'ar' ? 'إضافة' : 'Add'}</span>
          </button>
        </div>

        {/* Quick Chips & Modifiers */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1">
          {/* Quick Duration selector */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-slate-500 dark:text-zinc-400 text-[10px] hidden sm:inline shrink-0">
              <Clock className="w-3 h-3 inline me-1" />
              {lang === 'ar' ? 'المدة:' : 'Duration:'}
            </span>
            {quickDurations.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`py-1 px-2 sm:px-2.5 rounded-lg font-medium transition-all cursor-pointer shrink-0 ${
                  duration === d
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] text-slate-600 dark:text-zinc-400 border border-transparent'
                }`}
              >
                {d} {lang === 'ar' ? 'د' : 'm'}
              </button>
            ))}
          </div>

          {/* Quick Priority & More Options */}
          <div className="flex items-center gap-1.5 shrink-0 ms-auto">
            {/* Priority quick selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.03] p-0.5 rounded-lg border border-slate-200 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setPriority('high')}
                title={lang === 'ar' ? 'أولوية عالية' : 'High Priority'}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  priority === 'high' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 hover:text-rose-500'
                }`}
              >
                {lang === 'ar' ? 'عالية' : 'High'}
              </button>
              <button
                type="button"
                onClick={() => setPriority('medium')}
                title={lang === 'ar' ? 'أولوية متوسطة' : 'Medium Priority'}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  priority === 'medium' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-amber-500'
                }`}
              >
                {lang === 'ar' ? 'متوسطة' : 'Med'}
              </button>
            </div>

            {/* Top 3 Toggle */}
            <button
              type="button"
              onClick={() => setIsTopFocus(!isTopFocus)}
              className={`flex items-center gap-1 py-1 px-2.5 rounded-lg font-semibold text-[10px] transition-all cursor-pointer border ${
                isTopFocus
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-white/[0.06]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{lang === 'ar' ? 'أهم 3' : 'Top 3'}</span>
            </button>

            {/* Expand Extra Details (Optional) */}
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Optional Collapsible Extra Fields */}
        {showOptions && (
          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                {lang === 'ar' ? 'موعد نهائي (اختياري)' : 'Deadline (Optional)'}
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-lg py-1.5 px-2.5 text-xs text-slate-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                {lang === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={lang === 'ar' ? 'تفاصيل إضافية...' : 'Additional notes...'}
                className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-lg py-1.5 px-2.5 text-xs text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
