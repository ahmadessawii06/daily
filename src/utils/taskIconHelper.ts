import { Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { resolveTaskIcon } from './taskIconRules';

export interface TaskContextIconInfo {
  icon: LucideIcon;
  bgClass: string;
  iconClass: string;
}

// Unified theme styling matching Daily Track's signature emerald & dark palette
const UNIFIED_THEME_STYLE = {
  bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 dark:border-emerald-500/30 shadow-2xs',
  iconClass: 'text-emerald-700 dark:text-emerald-300 stroke-[2.2]',
};

const EMPTY_SLOT_STYLE = {
  bgClass: 'bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08]',
  iconClass: 'text-slate-400 dark:text-zinc-500 stroke-[2]',
};

// Resolve from the current title; no icon field or migration is needed in saved tasks.
export function getTaskContextIcon(title?: string): TaskContextIconInfo {
  if (!title?.trim()) return { icon: Clock, ...EMPTY_SLOT_STYLE };
  return { icon: resolveTaskIcon(title), ...UNIFIED_THEME_STYLE };
}
