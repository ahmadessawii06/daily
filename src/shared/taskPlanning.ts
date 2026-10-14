import type { Task } from '../types';
import { dailyPrayerId } from '../utils/prayerTasks';

export const MAX_FOCUS_TASKS = 3;

export function isFocusTaskEligible(task: Task): boolean {
  return Boolean(task.title.trim()) && !dailyPrayerId(task.title);
}

export function canMoveTask(task: Task): boolean {
  return isFocusTaskEligible(task) && task.status !== 'done';
}

// A deterministic projection also keeps concurrent pins from showing more than three.
export function getFocusTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => task.isTopFocus && isFocusTaskEligible(task))
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '') || a.id.localeCompare(b.id))
    .slice(0, MAX_FOCUS_TASKS);
}
