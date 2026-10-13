import type { DayStats, Task } from '../types';
import { partitionPrayerTasks } from './prayerTasks';
import { calculateStats } from './storage';

// Include the five prayer slots without generating persisted task records.
export function calculateDailyProgress(tasks: Task[]): DayStats {
  const namedTasks = tasks.filter(task => task.title.trim());
  const stats = calculateStats(namedTasks);
  const missingPrayers = partitionPrayerTasks(namedTasks).slots.filter(slot => !slot.task).length;
  const total = stats.total + missingPrayers;
  return {
    ...stats,
    total,
    pending: stats.pending + missingPrayers,
    completionPercentage: Math.round(stats.done / total * 100),
  };
}
