import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  X, 
  Edit3, 
  Trash2, 
  StickyNote, 
  Flame, 
  Sparkles, 
  BookOpen, 
  Briefcase, 
  CheckSquare2 
} from 'lucide-react';
import { Language, Task, TaskStatus } from '../types';

interface TaskRowProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  lang: Language;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  lang,
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Smart context icon helper based on keywords
  const getContextIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('صلاة') || t.includes('قرآن') || t.includes('أذكار') || t.includes('prayer') || t.includes('fajr')) {
      return Sparkles;
    }
    if (t.includes('تمرين') || t.includes('نادي') || t.includes('جيم') || t.includes('رياضة') || t.includes('workout') || t.includes('gym')) {
      return Flame;
    }
    if (t.includes('جامعة') || t.includes('دراسة') || t.includes('مذاكرة') || t.includes('امتحان') || t.includes('study') || t.includes('exam')) {
      return BookOpen;
    }
    if (t.includes('عمل') || t.includes('مشروع') || t.includes('دوام') || t.includes('work') || t.includes('project')) {
      return Briefcase;
    }
    return CheckSquare2;
  };

  const ContextIcon = getContextIcon(task.title);

  // Status visual configuration
  const statusConfig = {
    done: {
      label: lang === 'ar' ? 'مكتملة' : 'Done',
      shortLabel: lang === 'ar' ? 'تم' : 'Done',
      symbol: '✓',
      triggerBg: 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/40 shadow-sm',
      badgeClass: 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:hover:bg-emerald-500/30 shadow-2xs',
      titleClass: 'line-through text-slate-400 dark:text-zinc-500 font-medium',
      timeClass: 'text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.04]',
    },
    pending: {
      label: lang === 'ar' ? 'قيد الانتظار' : 'Pending',
      shortLabel: lang === 'ar' ? 'انتظار' : 'Pending',
      symbol: '◷',
      triggerBg: 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40 dark:hover:bg-amber-500/30 ring-1 ring-amber-500/20',
      badgeClass: 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-500/20 dark:border-amber-500/40 dark:hover:bg-amber-500/30 shadow-2xs',
      titleClass: 'text-slate-900 dark:text-zinc-100 font-bold',
      timeClass: 'text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20',
    },
    'not-done': {
      label: lang === 'ar' ? 'غير منجزة' : 'Not Done',
      shortLabel: lang === 'ar' ? 'لم تنجز' : 'Not Done',
      symbol: '✕',
      triggerBg: 'bg-rose-500 text-white ring-2 ring-rose-500/40 shadow-sm',
      badgeClass: 'text-rose-800 bg-rose-50 border-rose-200 hover:bg-rose-100 dark:text-rose-300 dark:bg-rose-500/20 dark:border-rose-500/40 dark:hover:bg-rose-500/30 shadow-2xs',
      titleClass: 'text-rose-700 dark:text-rose-200/90 font-bold',
      timeClass: 'text-rose-800 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20',
    },
  }[task.status];

  // Quick cycle between the 3 status states
  const handleCycleStatus = () => {
    const cycleMap: Record<TaskStatus, TaskStatus> = {
      pending: 'done',
      done: 'not-done',
      'not-done': 'pending',
    };
    onStatusChange(task.id, cycleMap[task.status]);
  };

  return (
    <div className="group relative flex items-center justify-between gap-2.5 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200/90 dark:border-white/[0.06] bg-white dark:bg-[#0c0e14]/80 hover:bg-slate-50/80 dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.14] transition-all duration-200 shadow-2xs">
      
      {/* Left / Task identity */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        
        {/* Tactile Action Trigger (Round Button) */}
        <button
          type="button"
          onClick={handleCycleStatus}
          title={lang === 'ar' ? 'انقر لتغيير حالة المهمة' : 'Click to toggle status'}
          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer active:scale-90 ${statusConfig.triggerBg}`}
        >
          {task.status === 'done' && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
          {task.status === 'pending' && <Clock className="w-3.5 h-3.5 stroke-[2.8]" />}
          {task.status === 'not-done' && <X className="w-3.5 h-3.5 stroke-[3.5]" />}
        </button>

        {/* Time Badge */}
        <div className={`font-mono text-[11px] sm:text-xs font-bold tabular-nums shrink-0 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border flex items-center gap-1 ${statusConfig.timeClass}`}>
          <span>{task.time}</span>
        </div>

        {/* Title & Notes */}
        <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Contextual type icon */}
            <div className="hidden sm:flex w-5 h-5 rounded-md bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-zinc-400 items-center justify-center shrink-0">
              <ContextIcon className="w-3 h-3 stroke-[2.2]" />
            </div>

            <span className={`text-xs sm:text-sm truncate select-text font-['Alexandria'] ${statusConfig.titleClass}`}>
              {task.title}
            </span>
          </div>

          {task.notes && (
            <span 
              title={task.notes}
              className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-amber-800 dark:text-amber-300 font-semibold bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 px-1.5 py-0.2 rounded shrink-0 max-w-[150px] sm:max-w-[180px] truncate"
            >
              <StickyNote className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate">{task.notes}</span>
            </span>
          )}
        </div>

      </div>

      {/* Right / Status Badge & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        
        {/* Status Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={handleCycleStatus}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowStatusMenu(!showStatusMenu);
            }}
            title={lang === 'ar' ? 'انقر للتبديل، أو زر يمين للقائمة' : 'Click to cycle, right click for menu'}
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer min-h-[30px] ${statusConfig.badgeClass}`}
          >
            <span className="font-black text-[11px] sm:text-xs">{statusConfig.symbol}</span>
            <span className="hidden sm:inline">{statusConfig.label}</span>
            <span className="sm:hidden">{statusConfig.shortLabel}</span>
          </button>

          {/* Quick status selector */}
          {showStatusMenu && (
            <div 
              className="absolute end-0 top-full mt-2 z-40 w-36 bg-white dark:bg-[#13151f] border border-slate-200 dark:border-white/[0.15] rounded-xl p-1.5 shadow-2xl text-xs space-y-1 backdrop-blur-xl"
              onMouseLeave={() => setShowStatusMenu(false)}
            >
              <button
                type="button"
                onClick={() => {
                  onStatusChange(task.id, 'done');
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-500/20"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{lang === 'ar' ? 'مكتملة' : 'Done'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onStatusChange(task.id, 'pending');
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-800 dark:text-amber-300 font-bold hover:bg-amber-50 dark:hover:bg-amber-500/20"
              >
                <Clock className="w-3.5 h-3.5 stroke-[2.8]" />
                <span>{lang === 'ar' ? 'قيد الانتظار' : 'Pending'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onStatusChange(task.id, 'not-done');
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-800 dark:text-rose-300 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/20"
              >
                <X className="w-3.5 h-3.5 stroke-[3]" />
                <span>{lang === 'ar' ? 'غير منجزة' : 'Not Done'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Actions (Edit / Delete) - accessible on touch and hover */}
        <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(task)}
            title={lang === 'ar' ? 'تعديل المهمة' : 'Edit'}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer min-w-[30px] min-h-[30px] flex items-center justify-center"
          >
            <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
          
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            title={lang === 'ar' ? 'حذف المهمة' : 'Delete'}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-300 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors cursor-pointer min-w-[30px] min-h-[30px] flex items-center justify-center"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>

      </div>

    </div>
  );
};
