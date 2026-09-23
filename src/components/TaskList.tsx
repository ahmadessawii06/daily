import React, { useState } from 'react';
import { Plus, Search, CheckCircle2, Filter, Sparkles } from 'lucide-react';
import { Language, StatusFilter, Task, TaskStatus } from '../types';
import { TaskRow } from './TaskRow';

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onOpenAddTask: () => void;
  currentFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  lang: Language;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  onOpenAddTask,
  currentFilter,
  onFilterChange,
  lang,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (currentFilter !== 'all' && task.status !== currentFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchTime = task.time.toLowerCase().includes(q);
      const matchNote = task.notes?.toLowerCase().includes(q) || false;
      return matchTitle || matchTime || matchNote;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      
      {/* Section Header with Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight font-['Alexandria','Cairo']">
            {lang === 'ar' ? 'جدول مهام اليوم' : "Today's Schedule"}
          </h2>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex items-center gap-2">
          
          {/* Quick Filter tabs with bolder active states */}
          <div className="flex items-center p-1 bg-[#10121a] border border-white/[0.08] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                currentFilter === 'all'
                  ? 'bg-white text-slate-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {lang === 'ar' ? 'الكل' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('done')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                currentFilter === 'done'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-emerald-400'
              }`}
            >
              {lang === 'ar' ? 'مكتملة' : 'Done'}
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('pending')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                currentFilter === 'pending'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-amber-400'
              }`}
            >
              {lang === 'ar' ? 'انتظار' : 'Pending'}
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('not-done')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                currentFilter === 'not-done'
                  ? 'bg-rose-500 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-rose-400'
              }`}
            >
              {lang === 'ar' ? 'غير منجزة' : 'Not Done'}
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-zinc-500 pointer-events-none stroke-[2.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
              className="bg-[#10121a] border border-white/[0.08] rounded-xl ps-9 pe-3 py-1.5 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 w-28 sm:w-40 transition-all"
            />
          </div>

        </div>
      </div>

      {/* Task Rows List or Empty State */}
      {filteredTasks.length === 0 ? (
        <div className="py-16 px-4 text-center border border-dashed border-white/[0.1] rounded-3xl bg-gradient-to-b from-white/[0.02] to-transparent relative overflow-hidden">
          {tasks.length === 0 ? (
            <div className="max-w-sm mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-['Alexandria']">
                  {lang === 'ar' ? 'لا توجد مهام لليوم' : 'No tasks for today'}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
                  {lang === 'ar' ? 'خذ نفسًا عميقًا.. جدولك خالٍ اليوم.' : 'Take a breath. Your day is clear.'}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenAddTask}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-white hover:bg-zinc-200 rounded-xl transition-all shadow-lg hover:shadow-white/20 active:scale-98 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{lang === 'ar' ? '+ أضف مهمتك الأولى' : '+ Add your first task'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                {lang === 'ar' ? 'لا توجد مهام تطابق كلمة البحث أو التصفية الحالية.' : 'No tasks match your search or filter.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  onFilterChange('all');
                }}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                {lang === 'ar' ? 'إعادة ضبط الفلاتر' : 'Clear filters'}
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
              lang={lang}
            />
          ))}
        </div>
      )}

    </div>
  );
};
