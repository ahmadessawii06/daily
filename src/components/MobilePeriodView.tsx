import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Sun, 
  Sunrise, 
  Sunset, 
  Moon, 
  Check, 
  X, 
  Edit3, 
  Trash2,
  Clock
} from 'lucide-react';
import { Language, StatusFilter, Task, TaskStatus } from '../types';
import { timeToMinutes } from '../utils/storage';
import { getCategoryMeta } from '../utils/categories';

interface MobilePeriodViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  currentFilter: StatusFilter;
  lang: Language;
}

interface PeriodDef {
  id: 'morning' | 'afternoon' | 'evening' | 'night';
  titleAr: string;
  titleEn: string;
  timeRangeAr: string;
  timeRangeEn: string;
  icon: React.ReactNode;
  isInPeriod: (startMinutes: number) => boolean;
}

const PERIODS: PeriodDef[] = [
  {
    id: 'morning',
    titleAr: 'فترة الصباح',
    titleEn: 'Morning Period',
    timeRangeAr: '05:00 ص - 11:59 ص',
    timeRangeEn: '05:00 AM - 11:59 AM',
    icon: <Sunrise className="w-4 h-4 text-amber-500 stroke-[2.5]" />,
    isInPeriod: (m) => m >= 5 * 60 && m < 12 * 60,
  },
  {
    id: 'afternoon',
    titleAr: 'فترة الظهيرة والعصر',
    titleEn: 'Afternoon Period',
    timeRangeAr: '12:00 م - 04:59 م',
    timeRangeEn: '12:00 PM - 04:59 PM',
    icon: <Sun className="w-4 h-4 text-orange-500 stroke-[2.5]" />,
    isInPeriod: (m) => m >= 12 * 60 && m < 17 * 60,
  },
  {
    id: 'evening',
    titleAr: 'فترة المساء',
    titleEn: 'Evening Period',
    timeRangeAr: '05:00 م - 09:59 م',
    timeRangeEn: '05:00 PM - 09:59 PM',
    icon: <Sunset className="w-4 h-4 text-indigo-500 stroke-[2.5]" />,
    isInPeriod: (m) => m >= 17 * 60 && m < 22 * 60,
  },
  {
    id: 'night',
    titleAr: 'فترة الليل والفجر',
    titleEn: 'Night & Dawn Period',
    timeRangeAr: '10:00 م - 04:59 ص',
    timeRangeEn: '10:00 PM - 04:59 AM',
    icon: <Moon className="w-4 h-4 text-purple-500 stroke-[2.5]" />,
    isInPeriod: (m) => m >= 22 * 60 || m < 5 * 60,
  },
];

export const MobilePeriodView: React.FC<MobilePeriodViewProps> = ({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  currentFilter,
  lang,
}) => {
  // Collapsed periods state (default all open)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const togglePeriod = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Swipe gesture state for items
  const [swipedTaskId, setSwipedTaskId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const touchStartX = React.useRef<number>(0);

  const handleTouchStart = (taskId: string, e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setSwipedTaskId(taskId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    // Bound swipe to +/- 90px
    setSwipeOffset(Math.max(-90, Math.min(90, diff)));
  };

  const handleTouchEnd = (task: Task) => {
    if (Math.abs(swipeOffset) > 60) {
      if (swipeOffset > 0) {
        // Swiped right: toggle complete
        onStatusChange(task.id, task.status === 'done' ? 'pending' : 'done');
      } else {
        // Swiped left: delete
        onDelete(task.id);
      }
    }
    setSwipeOffset(0);
    setSwipedTaskId(null);
  };

  return (
    <div className="space-y-4">
      {PERIODS.map((period) => {
        // Find tasks in this period
        const periodTasks = tasks.filter((t) => {
          const m = timeToMinutes(t.time);
          if (!period.isInPeriod(m)) return false;

          const hasTitle = Boolean(t.title && t.title.trim().length > 0);
          if (currentFilter === 'scheduled' && !hasTitle) return false;
          if (currentFilter === 'done' && t.status !== 'done') return false;
          if (currentFilter === 'not-done' && t.status !== 'not-done') return false;
          if (currentFilter === 'pending' && t.status !== 'pending') return false;
          return true;
        });

        const isCollapsed = Boolean(collapsed[period.id]);
        const doneCount = periodTasks.filter((t) => t.status === 'done').length;
        const totalCount = periodTasks.length;

        return (
          <div
            key={period.id}
            className="bg-white dark:bg-[#0f1118] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-xs transition-colors"
          >
            {/* Collapsible Period Header (min 44px touch height) */}
            <button
              type="button"
              onClick={() => togglePeriod(period.id)}
              className="w-full min-h-[48px] px-4 py-3 bg-slate-50/90 dark:bg-white/[0.02] flex items-center justify-between border-b border-slate-100 dark:border-white/[0.05] cursor-pointer hover:bg-slate-100/70 dark:hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                  {period.icon}
                </div>
                <div className="text-start">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-['Alexandria']">
                    {lang === 'ar' ? period.titleAr : period.titleEn}
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                    {lang === 'ar' ? period.timeRangeAr : period.timeRangeEn}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {totalCount > 0 && (
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold tabular-nums ${
                    doneCount === totalCount && totalCount > 0
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200/70 dark:bg-white/[0.08] text-slate-700 dark:text-zinc-300'
                  }`}>
                    {doneCount}/{totalCount}
                  </span>
                )}
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Tasks in Period */}
            {!isCollapsed && (
              <div className="p-2 sm:p-3 space-y-2">
                {periodTasks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                    {lang === 'ar' ? 'لا توجد مهام مجدولة في هذه الفترة' : 'No tasks scheduled in this period'}
                  </div>
                ) : (
                  periodTasks.map((task) => {
                    const catMeta = getCategoryMeta(task.category);
                    const isDone = task.status === 'done';
                    const isNotDone = task.status === 'not-done';
                    const isCurrentSwipe = swipedTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className="relative overflow-hidden rounded-xl"
                      >
                        {/* Swipe background action hints */}
                        <div className="absolute inset-0 flex items-center justify-between px-4 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-bold">
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>{lang === 'ar' ? 'إنجاز' : 'Done'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                            <Trash2 className="w-4 h-4" />
                            <span>{lang === 'ar' ? 'حذف' : 'Delete'}</span>
                          </div>
                        </div>

                        {/* Swipeable Foreground Card */}
                        <div
                          onTouchStart={(e) => handleTouchStart(task.id, e)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={() => handleTouchEnd(task)}
                          style={{
                            transform: isCurrentSwipe ? `translateX(${swipeOffset}px)` : 'translateX(0px)',
                            transition: isCurrentSwipe ? 'none' : 'transform 0.2s ease-out',
                          }}
                          className={`relative z-10 p-3 bg-white dark:bg-[#12141c] border border-slate-200/80 dark:border-white/[0.08] rounded-xl flex items-center justify-between gap-2 shadow-2xs ${catMeta.borderClass}`}
                        >
                          {/* Main Task Info */}
                          <div 
                            onClick={() => onEdit(task)}
                            className="flex-1 min-w-0 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                              <span className="font-bold text-slate-800 dark:text-zinc-200">{task.time}</span>
                              {task.endTime && (
                                <>
                                  <span className="opacity-40">-</span>
                                  <span>{task.endTime}</span>
                                </>
                              )}
                              <span className="opacity-40">·</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${catMeta.badgeClass}`}>
                                {lang === 'ar' ? catMeta.nameAr : catMeta.nameEn}
                              </span>
                            </div>

                            <h4 className={`text-xs sm:text-sm font-bold mt-1 truncate ${
                              isDone
                                ? 'line-through text-slate-400 dark:text-zinc-500'
                                : 'text-slate-900 dark:text-white'
                            }`}>
                              {task.title || (lang === 'ar' ? '(فترة شاغرة)' : '(Empty slot)')}
                            </h4>

                            {task.notes && (
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                                {task.notes}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons (min 44px touch targets) */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Done Button (44px target) */}
                            <button
                              type="button"
                              onClick={() => onStatusChange(task.id, isDone ? 'pending' : 'done')}
                              aria-label="Toggle Done"
                              className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                isDone
                                  ? 'bg-emerald-500 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-400 hover:text-emerald-600'
                              }`}
                            >
                              <Check className="w-5 h-5 stroke-[3]" />
                            </button>

                            {/* Not-Done Button (44px target) */}
                            <button
                              type="button"
                              onClick={() => onStatusChange(task.id, isNotDone ? 'pending' : 'not-done')}
                              aria-label="Toggle Not Done"
                              className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                isNotDone
                                  ? 'bg-rose-500 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-400 hover:text-rose-600'
                              }`}
                            >
                              <X className="w-5 h-5 stroke-[3]" />
                            </button>

                            {/* Edit Button (44px target) */}
                            <button
                              type="button"
                              onClick={() => onEdit(task)}
                              aria-label="Edit Task"
                              className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4 stroke-[2]" />
                            </button>
                          </div>

                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
