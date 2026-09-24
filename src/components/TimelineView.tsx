import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  MoreVertical,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Language, StatusFilter, Task, TaskStatus } from '../types';
import { timeToMinutes, minutesToTime } from '../utils/storage';
import { getCategoryMeta } from '../utils/categories';

interface TimelineViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onQuickAddTask: (startTime: string) => void;
  onResizeTask: (taskId: string, newDuration: number) => void;
  currentFilter: StatusFilter;
  lang: Language;
}

const HOUR_HEIGHT = 64; // pixels per 60 minutes
const TOTAL_HOURS = 24;

export const TimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  onQuickAddTask,
  onResizeTask,
  currentFilter,
  lang,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Track live current time every 30 seconds
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const hasTitle = Boolean(task.title && task.title.trim().length > 0);
    if (currentFilter === 'scheduled' && !hasTitle) return false;
    if (currentFilter === 'done' && task.status !== 'done') return false;
    if (currentFilter === 'not-done' && task.status !== 'not-done') return false;
    if (currentFilter === 'pending' && task.status !== 'pending') return false;
    return true;
  });

  // Auto-scroll to near current time on first mount
  useEffect(() => {
    if (containerRef.current) {
      const targetScroll = Math.max(0, (currentTimeMinutes / 60) * HOUR_HEIGHT - 120);
      containerRef.current.scrollTop = targetScroll;
    }
  }, []);

  // Format hour label in Arabic or English (12-hour format with AM/PM)
  const formatHourLabel = (hour: number): string => {
    if (lang === 'ar') {
      if (hour === 0) return '12:00 ص';
      if (hour < 12) return `${hour}:00 ص`;
      if (hour === 12) return '12:00 م';
      return `${hour - 12}:00 م`;
    } else {
      if (hour === 0) return '12:00 AM';
      if (hour < 12) return `${hour}:00 AM`;
      if (hour === 12) return '12:00 PM';
      return `${hour - 12}:00 PM`;
    }
  };

  // Resize drag handling
  const [resizingTaskId, setResizingTaskId] = useState<string | null>(null);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [initialDuration, setInitialDuration] = useState<number>(60);

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, task: Task) => {
    e.stopPropagation();
    setResizingTaskId(task.id);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setInitialDuration(task.duration || 60);
  };

  useEffect(() => {
    if (!resizingTaskId) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = clientY - dragStartY;
      const deltaMinutes = Math.round((deltaY / HOUR_HEIGHT) * 60 / 15) * 15; // snap to 15 min
      const newDuration = Math.max(30, Math.min(600, initialDuration + deltaMinutes));
      onResizeTask(resizingTaskId, newDuration);
    };

    const handleMouseUp = () => {
      setResizingTaskId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [resizingTaskId, dragStartY, initialDuration, onResizeTask]);

  // Current time position
  const currentTimeTop = (currentTimeMinutes / 60) * HOUR_HEIGHT;
  const currentFormattedTime = `${String(Math.floor(currentTimeMinutes / 60)).padStart(2, '0')}:${String(currentTimeMinutes % 60).padStart(2, '0')}`;

  return (
    <div className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-sm flex flex-col transition-colors">
      
      {/* Timeline Header bar */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
          <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-zinc-200 font-['Alexandria']">
            {lang === 'ar' ? 'المخطط الزمني الكامل (24 ساعة)' : 'Full 24-Hour Timeline'}
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-white/[0.05]">
            {filteredTasks.length} {lang === 'ar' ? 'كتلة' : 'blocks'}
          </span>
        </div>

        {/* Current Time Indicator badge */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2.5 py-1 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>{lang === 'ar' ? 'الآن:' : 'Now:'}</span>
          <span>{currentFormattedTime}</span>
        </div>
      </div>

      {/* Scrollable Timeline Viewport */}
      <div 
        ref={containerRef}
        className="relative overflow-y-auto max-h-[680px] select-none"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="relative flex" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
          
          {/* Time Gutter Column (Left/Start) */}
          <div className="w-16 sm:w-20 shrink-0 border-e border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01] flex flex-col">
            {Array.from({ length: TOTAL_HOURS }).map((_, hour) => (
              <div
                key={hour}
                className="relative text-[11px] font-mono font-medium text-slate-400 dark:text-zinc-500 flex items-start justify-center pt-1"
                style={{ height: HOUR_HEIGHT }}
              >
                <span>{formatHourLabel(hour)}</span>
              </div>
            ))}
          </div>

          {/* Timeline Grid & Content Area */}
          <div className="flex-1 relative bg-white dark:bg-[#0c0d12]">
            
            {/* Horizontal Grid lines */}
            {Array.from({ length: TOTAL_HOURS }).map((_, hour) => (
              <div
                key={hour}
                onClick={() => onQuickAddTask(`${String(hour).padStart(2, '0')}:00`)}
                title={lang === 'ar' ? `انقر لإضافة مهمة في الساعة ${hour}:00` : `Click to add task at ${hour}:00`}
                className="absolute inset-x-0 border-t border-slate-100 dark:border-white/[0.04] group hover:bg-emerald-500/[0.03] transition-colors cursor-pointer flex items-center justify-end px-3"
                style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              >
                <span className="hidden group-hover:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>{lang === 'ar' ? 'إضافة مهمة' : 'Add task'}</span>
                </span>
              </div>
            ))}

            {/* Current Time Horizontal Line */}
            {currentTimeTop >= 0 && currentTimeTop <= TOTAL_HOURS * HOUR_HEIGHT && (
              <div
                className="absolute inset-x-0 z-30 pointer-events-none flex items-center"
                style={{ top: currentTimeTop }}
              >
                <div className="w-3 h-3 -ms-1.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20 shadow-sm" />
                <div className="flex-1 h-[2px] bg-rose-500 shadow-xs" />
                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-mono font-bold shadow-xs">
                  {currentFormattedTime}
                </span>
              </div>
            )}

            {/* Render Task Blocks */}
            {filteredTasks.map((task) => {
              const startMinutes = timeToMinutes(task.time);
              const duration = task.duration || 60;
              const topPos = (startMinutes / 60) * HOUR_HEIGHT;
              const heightPos = Math.max(44, (duration / 60) * HOUR_HEIGHT - 4); // Leave 4px gap between blocks

              const catMeta = getCategoryMeta(task.category);
              const isDone = task.status === 'done';
              const isNotDone = task.status === 'not-done';

              // Visual styling: Calm palette with fixed category edge accent
              // If done: emerald tint, if not-done: soft rose tint, if pending/scheduled: pure clean white/dark card with category border!
              let cardBgClass = 'bg-white dark:bg-[#13151f] shadow-xs';
              let borderClass = 'border border-slate-200/90 dark:border-white/[0.1]';
              
              if (isDone) {
                cardBgClass = 'bg-emerald-50/70 dark:bg-emerald-950/30 shadow-xs';
                borderClass = 'border border-emerald-300 dark:border-emerald-800/60';
              } else if (isNotDone) {
                cardBgClass = 'bg-rose-50/70 dark:bg-rose-950/30 shadow-xs';
                borderClass = 'border border-rose-300 dark:border-rose-800/60';
              }

              const endTimeDisplay = task.endTime || minutesToTime(startMinutes + duration);

              // Calculate duration label
              const durHours = Math.floor(duration / 60);
              const durMins = duration % 60;
              let durLabel = '';
              if (durHours > 0 && durMins > 0) {
                durLabel = `${durHours}س ${durMins}د`;
              } else if (durHours > 0) {
                durLabel = `${durHours} ${lang === 'ar' ? (durHours === 1 ? 'ساعة' : 'ساعات') : 'h'}`;
              } else {
                durLabel = `${durMins} ${lang === 'ar' ? 'دقيقة' : 'm'}`;
              }

              return (
                <div
                  key={task.id}
                  onClick={() => onEdit(task)}
                  className={`absolute start-1 end-2 rounded-xl transition-all select-none group cursor-pointer overflow-hidden ${cardBgClass} ${borderClass} ${catMeta.borderClass}`}
                  style={{
                    top: topPos,
                    height: heightPos,
                    zIndex: resizingTaskId === task.id ? 40 : 10,
                  }}
                >
                  <div className="h-full p-2 sm:p-2.5 flex flex-col justify-between">
                    
                    {/* Top Row: Time Range, Title, Status Toggle */}
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      
                      {/* Left/Start: Time range & Title */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono font-medium text-slate-500 dark:text-zinc-400 leading-none">
                          <span className="font-semibold text-slate-700 dark:text-zinc-300">{task.time} - {endTimeDisplay}</span>
                          <span className="opacity-40">·</span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">({durLabel})</span>
                          <span className="opacity-40">·</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${catMeta.badgeClass}`}>
                            {lang === 'ar' ? catMeta.nameAr : catMeta.nameEn}
                          </span>
                        </div>

                        <h4 className={`text-xs sm:text-sm font-bold mt-1 truncate ${
                          isDone 
                            ? 'line-through text-slate-500 dark:text-zinc-400' 
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {task.title || (lang === 'ar' ? '(فترة شاغرة - انقر للتسمية)' : '(Unassigned - Click to name)')}
                        </h4>

                        {task.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5 font-normal">
                            {task.notes}
                          </p>
                        )}
                      </div>

                      {/* Right/End: Quick Status Controls (min 44px touch target) */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Done Toggle Button */}
                        <button
                          type="button"
                          onClick={() => onStatusChange(task.id, isDone ? 'pending' : 'done')}
                          title={lang === 'ar' ? (isDone ? 'إلغاء الإنجاز' : 'تحديد كمكتمل') : (isDone ? 'Undo done' : 'Mark done')}
                          className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            isDone
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-emerald-100 dark:bg-white/[0.06] dark:hover:bg-emerald-950/40 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>

                        {/* Not-Done Toggle Button */}
                        <button
                          type="button"
                          onClick={() => onStatusChange(task.id, isNotDone ? 'pending' : 'not-done')}
                          title={lang === 'ar' ? (isNotDone ? 'إلغاء' : 'تحديد كغير منجز') : (isNotDone ? 'Undo' : 'Mark not done')}
                          className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            isNotDone
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-rose-100 dark:bg-white/[0.06] dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                          }`}
                        >
                          <X className="w-4 h-4 stroke-[3]" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => onDelete(task.id)}
                          title={lang === 'ar' ? 'حذف المهمة' : 'Delete task'}
                          className="w-8 h-8 rounded-lg hidden group-hover:flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                    {/* Bottom Resize Handle - User can drag to extend or shorten block duration! */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, task)}
                      onTouchStart={(e) => handleResizeStart(e, task)}
                      title={lang === 'ar' ? 'اسحب لتعديل مدة المهمة' : 'Drag to resize task duration'}
                      className="w-full h-3 -mb-1 flex items-center justify-center cursor-row-resize hover:bg-emerald-500/10 rounded transition-colors group/handle"
                    >
                      <div className="w-8 h-1 rounded-full bg-slate-300 dark:bg-zinc-700 group-hover/handle:bg-emerald-500 transition-colors" />
                    </div>

                  </div>
                </div>
              );
            })}

          </div>

        </div>
      </div>

    </div>
  );
};
