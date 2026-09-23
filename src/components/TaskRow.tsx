import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  X, 
  Edit2, 
  Trash2, 
  StickyNote,
  MoreHorizontal
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

  // Status configuration
  const statusConfig = {
    done: {
      label: lang === 'ar' ? 'مكتملة' : 'Done',
      symbol: '✓',
      badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
      titleClass: 'line-through text-zinc-500 font-normal',
      dotClass: 'bg-emerald-400',
    },
    pending: {
      label: lang === 'ar' ? 'قيد الانتظار' : 'Pending',
      symbol: '◷',
      badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20',
      titleClass: 'text-zinc-200 font-medium',
      dotClass: 'bg-amber-400',
    },
    'not-done': {
      label: lang === 'ar' ? 'غير منجزة' : 'Not Done',
      symbol: '✕',
      badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20',
      titleClass: 'text-rose-200/90 font-medium',
      dotClass: 'bg-rose-400',
    },
  }[task.status];

  // Fast cycle on single click
  const handleCycleStatus = () => {
    const cycleMap: Record<TaskStatus, TaskStatus> = {
      pending: 'done',
      done: 'not-done',
      'not-done': 'pending',
    };
    onStatusChange(task.id, cycleMap[task.status]);
  };

  return (
    <div className="group relative flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-transparent hover:border-white/[0.06] hover:bg-white/[0.03] transition-all duration-150">
      
      {/* Left/Start: Time & Task Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        
        {/* Time */}
        <span className="font-mono text-xs text-zinc-400 tabular-nums shrink-0 w-12 font-medium">
          {task.time}
        </span>

        {/* Status dot / trigger */}
        <button
          type="button"
          onClick={handleCycleStatus}
          title={lang === 'ar' ? 'انقر لتغيير الحالة' : 'Click to cycle status'}
          className="w-4 h-4 rounded-full border border-white/[0.1] hover:border-white/[0.3] flex items-center justify-center shrink-0 transition-colors"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
        </button>

        {/* Title & Note */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span className={`text-xs sm:text-sm truncate select-text ${statusConfig.titleClass}`}>
            {task.title}
          </span>

          {task.notes && (
            <span 
              title={task.notes}
              className="inline-flex items-center gap-1 text-[11px] text-amber-400/80 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 shrink-0 max-w-[200px] truncate"
            >
              <StickyNote className="w-3 h-3 shrink-0" />
              <span className="truncate">{task.notes}</span>
            </span>
          )}
        </div>

      </div>

      {/* Right/End: Status Badge + Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        
        {/* Status Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={handleCycleStatus}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowStatusMenu(!showStatusMenu);
            }}
            title={lang === 'ar' ? 'انقر للتبديل، أو زر يمين للخيارات' : 'Click to cycle, right click for menu'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${statusConfig.badgeClass}`}
          >
            <span className="font-bold text-[11px]">{statusConfig.symbol}</span>
            <span>{statusConfig.label}</span>
          </button>

          {/* Quick status selector dropdown */}
          {showStatusMenu && (
            <div 
              className="absolute end-0 top-full mt-1.5 z-20 w-32 bg-[#12131a] border border-white/[0.1] rounded-xl p-1 shadow-xl text-xs space-y-0.5"
              onMouseLeave={() => setShowStatusMenu(false)}
            >
              <button
                type="button"
                onClick={() => {
                  onStatusChange(task.id, 'done');
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
              >
                <span>✓</span>
                <span>{lang === 'ar' ? 'مكتملة' : 'Done'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onStatusChange(task.id, 'pending');
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10"
              >
                <span>◷</span>
                <span>{lang === 'ar' ? 'قيد الانتظار' : 'Pending'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onStatusChange(task.id, 'not-done');
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
              >
                <span>✕</span>
                <span>{lang === 'ar' ? 'غير منجزة' : 'Not Done'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Hover Actions: Edit / Delete */}
        <div className="flex items-center opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(task)}
            title={lang === 'ar' ? 'تعديل' : 'Edit'}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            title={lang === 'ar' ? 'حذف' : 'Delete'}
            className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
