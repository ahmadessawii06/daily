import React from 'react';
import { Clock, LayoutTemplate, Filter, X } from 'lucide-react';
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
  onOpenExportModal?: () => void;
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
  onApply24HourTemplate,
  currentFilter,
  onFilterChange,
  lang,
}) => {
  // Filter tasks based on the active filter selected via TodayProgress circles
  const filteredTasks = tasks.filter((task) => {
    const hasTitle = Boolean(task.title && task.title.trim().length > 0);

    if (currentFilter === 'scheduled') {
      return hasTitle;
    } else if (currentFilter === 'done' || currentFilter === 'pending' || currentFilter === 'not-done') {
      return task.status === currentFilter;
    }
    return true;
  });

  const getFilterLabel = () => {
    switch (currentFilter) {
      case 'done':
        return lang === 'ar' ? 'المهام المكتملة' : 'Done tasks';
      case 'pending':
        return lang === 'ar' ? 'المهام المتبقية' : 'Remaining tasks';
      case 'not-done':
        return lang === 'ar' ? 'المهام غير المنجزة' : 'Not done tasks';
      case 'scheduled':
        return lang === 'ar' ? 'المهام المحددة' : 'Scheduled tasks';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Active filter notification bar (only displayed when a circle is clicked to filter) */}
      {currentFilter !== 'all' && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
            <span className="text-slate-500 dark:text-zinc-400 font-medium">
              {lang === 'ar' ? 'عرض:' : 'Showing:'}
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-['Alexandria']">
              {getFilterLabel()}
            </span>
            <span className="font-numbers text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-md">
              {filteredTasks.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline cursor-pointer active:scale-95"
          >
            <X className="w-3 h-3 stroke-[2.5]" />
            <span>{lang === 'ar' ? 'عرض جميع الساعات' : 'Show all'}</span>
          </button>
        </div>
      )}

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
                {lang === 'ar' ? 'لا توجد ساعات أو مهام تطابق هذا التصنيف.' : 'No tasks match this category.'}
              </p>
              <button
                type="button"
                onClick={() => onFilterChange('all')}
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
