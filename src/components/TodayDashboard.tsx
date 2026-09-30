import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flame, 
  Play, 
  Repeat, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2,
  ChevronRight,
  ChevronLeft,
  Check,
  ListTodo,
  Layers
} from 'lucide-react';
import { Language, RecurringItem, Task, TaskPriority, TaskStatus } from '../types';
import { isRecurringDueOnDate, getFrequencyLabel } from '../utils/recurring';
import { QuickAddBar } from './QuickAddBar';
import { formatHeaderDate, isToday } from '../utils/date';

interface TodayDashboardProps {
  currentDate: string;
  tasks: Task[];
  recurringItems: RecurringItem[];
  onToggleTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onToggleRecurringStatus: (itemId: string) => void;
  onAddTask: (taskInput: {
    title: string;
    duration?: number;
    priority?: TaskPriority;
    deadline?: string;
    isTopFocus?: boolean;
    notes?: string;
    time?: string;
  }) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenRecurringManager: () => void;
  onStartFocusTask?: (task: Task | { title: string; duration?: number }) => void;
  lang: Language;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  currentDate,
  tasks,
  recurringItems,
  onToggleTaskStatus,
  onToggleRecurringStatus,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onOpenRecurringManager,
  onStartFocusTask,
  lang,
}) => {
  // Filter valid user-defined tasks (excluding empty placeholder slots)
  const validTasks = tasks.filter((t) => t.title && t.title.trim().length > 0);

  // 1. Top 3 Focus Tasks for today
  // Prioritize explicitly marked isTopFocus, then high priority, then pending tasks
  const topFocusTasks = validTasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => {
      if (a.isTopFocus && !b.isTopFocus) return -1;
      if (!a.isTopFocus && b.isTopFocus) return 1;
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return 0;
    })
    .slice(0, 3);

  // 2. Due Recurring Items for today
  const dueRecurring = recurringItems.filter((item) => isRecurringDueOnDate(item, currentDate));

  // 3. Overdue Tasks (tasks with deadline < currentDate and status !== 'done')
  const overdueTasks = validTasks.filter(
    (t) => t.deadline && t.deadline < currentDate && t.status !== 'done'
  );

  // 4. Other tasks today (not in top 3, not overdue)
  const topTaskIds = new Set(topFocusTasks.map((t) => t.id));
  const otherTasks = validTasks.filter((t) => !topTaskIds.has(t.id));

  // The next immediate task to start
  const immediateTask = topFocusTasks[0] || otherTasks.find((t) => t.status !== 'done') || dueRecurring.find((r) => !r.completionHistory?.[currentDate]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200 font-['Alexandria']">
      
      {/* 1. Instant Quick Add Bar */}
      <QuickAddBar currentDate={currentDate} onAddTask={onAddTask} lang={lang} />

      {/* 2. "Start Now" Hero Card (if there's an active focus item) */}
      {immediateTask && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-emerald-100 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{lang === 'ar' ? 'التركيز المقترح الآن' : 'Suggested Next Focus'}</span>
              </div>
              <h3 className="font-extrabold text-base sm:text-xl truncate text-white">
                {immediateTask.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-emerald-100/90 mt-1">
                <span className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-md text-[11px]">
                  <Clock className="w-3 h-3" />
                  {'duration' in immediateTask && typeof immediateTask.duration === 'number'
                    ? immediateTask.duration
                    : ('targetDuration' in immediateTask && typeof (immediateTask as any).targetDuration === 'number'
                      ? (immediateTask as any).targetDuration
                      : 30)}{' '}
                  {lang === 'ar' ? 'دقيقة' : 'min'}
                </span>
                {'priority' in immediateTask && immediateTask.priority === 'high' && (
                  <span className="bg-rose-500/80 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                    {lang === 'ar' ? 'أولوية عالية' : 'High Priority'}
                  </span>
                )}
              </div>

            </div>

            <button
              type="button"
              onClick={() => onStartFocusTask?.(immediateTask)}
              className="w-full sm:w-auto bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 font-extrabold py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shrink-0"
            >
              <Play className="w-4 h-4 fill-emerald-800" />
              <span>{lang === 'ar' ? 'ابدأ الآن' : 'Start Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Top 3 Focus Tasks Section */}
      <div className="bg-white dark:bg-[#11131a] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {lang === 'ar' ? '🎯 أهم 3 مهام اليوم' : '🎯 Top 3 Focus Tasks'}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                {lang === 'ar' ? 'المهام ذات الأولوية القصوى لإنجازها اليوم' : 'High priority key objectives for today'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-white/[0.05] px-2 py-0.5 rounded-md">
            {topFocusTasks.length} / 3
          </span>
        </div>

        {topFocusTasks.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 dark:border-white/[0.06] rounded-2xl text-xs text-slate-400">
            {lang === 'ar' ? 'لا يوجد مهام رئيسية متبقية لليوم 🎉' : 'No top focus tasks remaining today 🎉'}
          </div>
        ) : (
          <div className="space-y-2">
            {topFocusTasks.map((task) => {
              const isDone = task.status === 'done';
              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30'
                      : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.06] hover:border-amber-400/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleTaskStatus(task.id, isDone ? 'pending' : 'done')}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        isDone
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border-2 border-slate-300 dark:border-zinc-600 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="min-w-0">
                      <h5 className={`font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate ${isDone ? 'line-through text-slate-400 dark:text-zinc-500' : ''}`}>
                        {task.title}
                      </h5>
                      <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {task.duration || 45} {lang === 'ar' ? 'دقيقة' : 'min'}
                        </span>
                        {task.time && task.time.trim() !== '' && (
                          <>
                            <span>•</span>
                            <span>{task.time}</span>
                          </>
                        )}
                        {task.priority && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            task.priority === 'high' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {task.priority === 'high' ? (lang === 'ar' ? 'عالية' : 'High') : (lang === 'ar' ? 'متوسطة' : 'Med')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Today's Due Recurring Tasks & Habits */}
      <div className="bg-white dark:bg-[#11131a] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Repeat className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {lang === 'ar' ? '🔁 عادات ومهام اليوم المتكررة' : '🔁 Today’s Recurring Routine'}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                {lang === 'ar' ? 'تتولد تلقائياً حسب جدول تكرارها' : 'Auto-generated based on frequency'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenRecurringManager}
            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            {lang === 'ar' ? 'إدارة العادات' : 'Manage'}
          </button>
        </div>

        {dueRecurring.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 dark:border-white/[0.06] rounded-2xl text-xs text-slate-400">
            {lang === 'ar' ? 'لا يوجد عادات متكررة مجدولة لهذا اليوم' : 'No recurring routines scheduled for today'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {dueRecurring.map((item) => {
              const isCompleted = !!item.completionHistory?.[currentDate];
              const freqLabel = getFrequencyLabel(item, lang);

              return (
                <div
                  key={item.id}
                  onClick={() => onToggleRecurringStatus(item.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                    isCompleted
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30'
                      : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border-2 border-slate-300 dark:border-zinc-600 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{item.icon || '🔁'}</span>
                        <h5 className={`font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate ${isCompleted ? 'line-through text-slate-400 dark:text-zinc-500' : ''}`}>
                          {item.title}
                        </h5>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{freqLabel}</span>
                        <span>•</span>
                        <span>{item.targetDuration} {lang === 'ar' ? 'د' : 'm'}</span>
                      </div>
                    </div>
                  </div>

                  {item.currentStreak && item.currentStreak > 0 ? (
                    <div className="flex items-center gap-0.5 text-amber-500 text-[11px] font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-lg shrink-0">
                      <Flame className="w-3 h-3 fill-amber-500" />
                      <span>{item.currentStreak}</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Overdue Tasks (if any) */}
      {overdueTasks.length > 0 && (
        <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h4 className="font-extrabold text-xs sm:text-sm text-rose-900 dark:text-rose-300">
              {lang === 'ar' ? `⚠️ مهام متأخرة تجاوزت موعدها (${overdueTasks.length})` : `⚠️ Overdue Tasks (${overdueTasks.length})`}
            </h4>
          </div>

          <div className="space-y-1.5">
            {overdueTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-rose-200/80 dark:border-rose-500/20 text-xs"
              >
                <span className="font-bold text-slate-800 dark:text-white truncate">{t.title}</span>
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  {lang === 'ar' ? `استحقاق: ${t.deadline}` : `Due: ${t.deadline}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. All Other Scheduled Tasks for the Day */}
      {otherTasks.length > 0 && (
        <div className="bg-white dark:bg-[#11131a] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <ListTodo className="w-4 h-4 text-slate-500" />
              <span>{lang === 'ar' ? `باقي مهام اليوم (${otherTasks.length})` : `Other Tasks Today (${otherTasks.length})`}</span>
            </h4>
          </div>

          <div className="space-y-2">
            {otherTasks.map((task) => {
              const isDone = task.status === 'done';
              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleTaskStatus(task.id, isDone ? 'pending' : 'done')}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 dark:border-zinc-600 text-transparent hover:text-emerald-500'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>

                    <div className="min-w-0">
                      <h5 className={`font-semibold text-xs text-slate-800 dark:text-zinc-200 truncate ${isDone ? 'line-through text-slate-400 dark:text-zinc-500' : ''}`}>
                        {task.title}
                      </h5>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-zinc-400">
                        {task.time && <span>{task.time}</span>}
                        {task.duration && (
                          <span>{task.duration} {lang === 'ar' ? 'دقيقة' : 'min'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
