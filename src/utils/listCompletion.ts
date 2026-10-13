import type { PlannerView, PlannerWorkspace, Task } from '../types';
import { groupTasksByCategory } from '../shared/workspace';
import { partitionPrayerTasks } from './prayerTasks';

function completedLists(tasks: Task[], workspace: PlannerWorkspace, view: PlannerView): Set<string> {
  const named = tasks.filter(task => task.title.trim());
  const prayers = partitionPrayerTasks(named);
  const completed = new Set<string>();
  const allPrayersDone = prayers.slots.every(slot => slot.task?.status === 'done');
  if (allPrayersDone) completed.add('prayers');
  if (view === 'timeline') {
    // Match daily progress: all named tasks and all five daily prayer slots count.
    if (allPrayersDone && named.length > 0 && named.every(task => task.status === 'done')) completed.add('timeline');
  } else {
    for (const [categoryId, group] of groupTasksByCategory(prayers.otherTasks, workspace)) {
      if (group.length > 0 && group.every(task => task.status === 'done')) completed.add(`card:${categoryId}`);
    }
  }
  return completed;
}

// Called by local completion actions only, never by rendering, filters or synchronization.
export function shouldPlayListCompletionSound(before: Task[], after: Task[], workspace: PlannerWorkspace, view: PlannerView, taskId: string): boolean {
  const task = after.find(item => item.id === taskId);
  if (!task?.title.trim() || task.status !== 'done' || before.find(item => item.id === taskId)?.status === 'done') return false;
  const previous = completedLists(before, workspace, view);
  return [...completedLists(after, workspace, view)].some(key => !previous.has(key));
}
