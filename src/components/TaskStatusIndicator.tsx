import { Check, Plus, X } from 'lucide-react';
import type { TaskStatus } from '../types';

interface TaskStatusIndicatorProps {
  status: TaskStatus;
  isEmptySlot?: boolean;
}

// The same visual control is used inside each view's accessible action button.
export function TaskStatusIndicator({ status, isEmptySlot = false }: TaskStatusIndicatorProps) {
  const appearance = isEmptySlot
    ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10'
    : {
        done: 'bg-[#10e588] text-slate-950 font-black shadow-xs hover:bg-[#0fd07b]',
        pending: 'border-2 border-slate-300 dark:border-white/20 hover:border-[#10e588] text-transparent hover:text-[#10e588] bg-slate-50/40 dark:bg-white/[0.02]',
        'not-done': 'bg-[#ff6b81] text-white font-black shadow-xs hover:bg-[#ff526c]',
      }[status];

  return (
    <span aria-hidden="true" data-task-status-indicator={isEmptySlot ? 'empty' : status}
      className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-all duration-150 motion-safe:group-active/status:scale-90 motion-reduce:transition-none sm:h-6 sm:w-6 ${appearance}`}>
      {isEmptySlot ? <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
        : status === 'done' ? <Check className="h-3.5 w-3.5 stroke-[3.5]" />
        : status === 'not-done' ? <X className="h-3.5 w-3.5 stroke-[3.5]" />
        : <Check className="h-3 w-3 stroke-[2.5] opacity-0 group-hover:opacity-40 transition-opacity motion-reduce:transition-none text-slate-500 dark:text-zinc-400" />}
    </span>
  );
}
