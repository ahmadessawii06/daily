import type { PlannerCategory, PlannerWorkspace, Task } from '../types';
import { activeCategories, groupTasksByCategory, UNASSIGNED_CATEGORY, WORKSPACE_EPOCH } from '../shared/workspace';
import { partitionPrayerTasks } from './prayerTasks';

// The daily prayer strip has five fixed slots; other worship tasks keep their own card.
export function getTaskCardCategories(tasks: Task[], workspace: PlannerWorkspace, includeUnassigned = false): PlannerCategory[] {
  const grouped = groupTasksByCategory(partitionPrayerTasks(tasks).otherTasks, workspace);
  const categories = activeCategories(workspace).filter(category => category.id !== 'worship' || Boolean(grouped.get(category.id)?.length));
  if (includeUnassigned || grouped.get(UNASSIGNED_CATEGORY)?.length || !categories.length) {
    categories.push({ id: UNASSIGNED_CATEGORY, name: 'غير مصنّف', nameEn: 'Unassigned', icon: 'dollar-sign', order: 0, updatedAt: WORKSPACE_EPOCH });
  }
  return categories;
}
