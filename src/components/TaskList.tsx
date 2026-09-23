import React, { useState } from 'react';
import { Plus, Search, CheckCircle } from 'lucide-react';
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
    <div className="space-y-3">
      
      {/* Section Header with Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {lang === 'ar' ? 'مهام اليوم' : "Today's Tasks"}
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            ({tasks.length})
          </span>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2">
          
          {/* Quick Filter tabs */}
          <div className="flex items-center p-0.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs">
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentFilter === 'all'
                  ? 'bg-white/[0.08] text-white font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {lang === 'ar' ? 'الكل' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('done')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentFilter === 'done'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                  : 'text-zinc-400 hover:text-emerald-400'
              }`}
            >
              {lang === 'ar' ? 'مكتملة' : 'Done'}
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('pending')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentFilter === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 font-medium'
                  : 'text-zinc-400 hover:text-amber-400'
              }`}
            >
              {lang === 'ar' ? 'انتظار' : 'Pending'}
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('not-done')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentFilter === 'not-done'
                  ? 'bg-rose-500/20 text-rose-300 font-medium'
                  : 'text-zinc-400 hover:text-rose-400'
              }`}
            >
              {lang === 'ar' ? 'غير منجزة' : 'Not Done'}
            </button>
          </div>

          {/* Search toggle / input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 start-2.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg ps-8 pe-3 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] w-28 sm:w-36 transition-all"
            />
          </div>

        </div>
      </div>

      {/* Task Rows List or Empty State */}
      {filteredTasks.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-white/[0.06] rounded-2xl bg-white/[0.01]">
          {tasks.length === 0 ? (
            <div className="max-w-xs mx-auto space-y-3">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto text-zinc-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                {lang === 'ar' ? 'لا توجد مهام اليوم' : 'No tasks for today'}
              </h3>
              <p className="text-xs text-zinc-400">
                {lang === 'ar' ? 'خذ نفسًا عميقًا.. جدولك خالٍ اليوم.' : 'Take a breath. Your day is clear.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenAddTask}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{lang === 'ar' ? '+ أضف مهمتك الأولى' : '+ Add your first task'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-zinc-400">
                {lang === 'ar' ? 'لا توجد مهام تطابق البحث أو الفلتر.' : 'No tasks match your search or filter.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  onFilterChange('all');
                }}
                className="text-xs text-emerald-400 hover:underline"
              >
                {lang === 'ar' ? 'مسح الفلاتر' : 'Clear filters'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-white/[0.03] border border-white/[0.06] rounded-2xl bg-[#0b0c10]/40 overflow-hidden">
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
