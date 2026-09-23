import React, { useState } from 'react';
import { Plus, Search, CheckCircle2, Clock, Sparkles, LayoutTemplate } from 'lucide-react';
import { Language, StatusFilter, Task, TaskStatus } from '../types';
import { TaskRow } from './TaskRow';

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onUpdateTitle: (taskId: string, newTitle: string) => void;
  onOpenAddTask: () => void;
  onApply24HourTemplate: () => void;
  currentFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  lang: Language;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  onUpdateTitle,
  onOpenAddTask,
  onApply24HourTemplate,
  currentFilter,
  onFilterChange,
  lang,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Count scheduled tasks (tasks with titles)
  const scheduledCount = tasks.filter((t) => t.title && t.title.trim().length > 0).length;

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const hasTitle = Boolean(task.title && task.title.trim().length > 0);

    if (currentFilter === 'scheduled') {
      if (!hasTitle) return false;
    } else if (currentFilter === 'done' || currentFilter === 'pending' || currentFilter === 'not-done') {
      if (task.status !== currentFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (task.title || '').toLowerCase().includes(q);
      const matchTime = task.time.toLowerCase().includes(q);
      const matchNote = task.notes?.toLowerCase().includes(q) || false;
      return matchTitle || matchTime || matchNote;
    }
    return true;
  });

  return (
    <div className="space-y-3.5">
      
      {/* Section Header with Responsive Filters, 24h Template Button & Search */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-['Alexandria','Cairo']">
              {lang === 'ar' ? 'جدول مهام وساعات اليوم' : "Daily Hourly Schedule"}
            </h2>
            <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded-full">
              {scheduledCount} / {tasks.length}
            </span>
          </div>

          {/* 24-Hour Hourly Template Button */}
          <button
            type="button"
            onClick={onApply24HourTemplate}
            title={lang === 'ar' ? 'تجهيز قالب الـ 24 ساعة لليوم بالكامل' : 'Generate/Complete 24-Hour template for today'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all cursor-pointer shadow-2xs font-['Alexandria']"
          >
            <LayoutTemplate className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'قالب الـ 24 ساعة' : '24h Template'}</span>
            <span className="sm:hidden">{lang === 'ar' ? '24 ساعة' : '24h'}</span>
          </button>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
          
          {/* Quick Filter tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-[#10121a] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap min-h-[30px] flex items-center gap-1 ${
                currentFilter === 'all'
                  ? 'bg-white text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <span>{lang === 'ar' ? 'كل الساعات' : 'All Hours'}</span>
              <span className="text-[10px] font-mono opacity-70">({tasks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => onFilterChange('scheduled')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap min-h-[30px] flex items-center gap-1 ${
                currentFilter === 'scheduled'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{lang === 'ar' ? 'المحددة فقط' : 'Scheduled'}</span>
              <span className="text-[10px] font-mono opacity-80">({scheduledCount})</span>
            </button>

            <button
              type="button"
              onClick={() => onFilterChange('done')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap min-h-[30px] flex items-center ${
                currentFilter === 'done'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400'
              }`}
            >
              {lang === 'ar' ? 'مكتملة' : 'Done'}
            </button>

            <button
              type="button"
              onClick={() => onFilterChange('pending')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap min-h-[30px] flex items-center ${
                currentFilter === 'pending'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-amber-700 dark:text-zinc-400 dark:hover:text-amber-400'
              }`}
            >
              {lang === 'ar' ? 'انتظار' : 'Pending'}
            </button>

            <button
              type="button"
              onClick={() => onFilterChange('not-done')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap min-h-[30px] flex items-center ${
                currentFilter === 'not-done'
                  ? 'bg-rose-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-rose-700 dark:text-zinc-400 dark:hover:text-rose-400'
              }`}
            >
              {lang === 'ar' ? 'غير منجزة' : 'Not Done'}
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400 dark:text-zinc-500 pointer-events-none stroke-[2.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث عن مهمة أو وقت...' : 'Search task or hour...'}
              className="bg-white dark:bg-[#10121a] border border-slate-200 dark:border-white/[0.08] rounded-xl ps-8 pe-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 shadow-2xs w-full sm:w-44 transition-all min-h-[34px]"
            />
          </div>

        </div>
      </div>

      {/* Task Rows List or Empty State */}
      {filteredTasks.length === 0 ? (
        <div className="py-12 sm:py-14 px-4 text-center border border-dashed border-slate-200 dark:border-white/[0.1] rounded-3xl bg-white/70 dark:bg-gradient-to-b dark:from-white/[0.02] dark:to-transparent relative overflow-hidden shadow-2xs">
          {tasks.length === 0 ? (
            <div className="max-w-sm mx-auto space-y-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/10">
                <Clock className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Alexandria']">
                  {lang === 'ar' ? 'قالب اليوم جاهز للتعبئة' : 'Ready for your tasks'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium leading-relaxed">
                  {lang === 'ar' 
                    ? 'اضغط زر قالب الـ 24 ساعة لإنشاء جدول الساعات بالكامل، وابدأ بتسجيل مهامك فورًا.' 
                    : 'Click 24h Template to generate all hourly slots and start naming your tasks.'}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onApply24HourTemplate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer font-['Alexandria']"
                >
                  <LayoutTemplate className="w-4 h-4 stroke-[2.5]" />
                  <span>{lang === 'ar' ? 'توليد قالب 24 ساعة' : 'Generate 24h Template'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
                {lang === 'ar' ? 'لا توجد ساعات أو مهام تطابق هذا الفلتر أو البحث.' : 'No tasks match this filter or search.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  onFilterChange('all');
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {lang === 'ar' ? 'عرض جميع الساعات (24 ساعة)' : 'Show all 24 hours'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdateTitle={onUpdateTitle}
              lang={lang}
            />
          ))}
        </div>
      )}

    </div>
  );
};
