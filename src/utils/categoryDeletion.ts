import type { DayRecord, PlannerWorkspace } from '../types';
import { timestamp, nextRecordTimestamp } from '../shared/merge';
import { enqueue, enqueueDays, getQueue, saveQueue } from '../services/syncQueue';
import { getPlannerWorkspace, markPlannerCategoryDeleted, storePlannerWorkspaceForDate, storeWorkspace } from './workspace';
import { loadAllDays, saveAllDays } from './storage';

function taskBelongsToCategory(task: DayRecord['tasks'][number], categoryId: string): boolean {
  return task.categoryId === categoryId || task.category === categoryId;
}

export interface CategoryDeletionSnapshot {
  categoryId: string;
  date?: string;
  categoryName: string;
  previousWorkspace: PlannerWorkspace;
  previousDays: Record<string, DayRecord>;
  affectedDates: string[];
  expectedWorkspace: PlannerWorkspace;
  expectedDays: Record<string, DayRecord>;
}

/** Removes a card from one selected day; legacy calls without a date retain the older task-cleanup behavior. */
export function deletePlannerCategoryAndTasks(categoryId: string, date?: string): CategoryDeletionSnapshot {
  const workspace = getPlannerWorkspace(date);
  if (!workspace.categories.some(category => category.id === categoryId && !category.deletedAt)) {
    throw new Error('Category not found');
  }

  const previousDays = loadAllDays();
  const previousWorkspace = workspace;
  const previousQueue = getQueue();
  const changedAt = new Date(Math.max(Date.now(), timestamp(workspace.viewUpdatedAt) + 1, ...workspace.categories.map(category => timestamp(category.updatedAt) + 1))).toISOString();
  const updatedWorkspace = markPlannerCategoryDeleted(workspace, categoryId, changedAt);
  if (date) {
    const savedWorkspace = storePlannerWorkspaceForDate(date, updatedWorkspace);
    return {
      categoryId,
      date,
      categoryName: workspace.categories.find(category => category.id === categoryId)?.name || categoryId,
      previousWorkspace: workspace,
      previousDays: {},
      affectedDates: [],
      expectedWorkspace: savedWorkspace,
      expectedDays: {},
    };
  }
  const updatedDays: Record<string, DayRecord> = { ...previousDays };
  const affectedDays: DayRecord[] = [];
  const previousAffectedDays: Record<string, DayRecord> = {};

  for (const [date, record] of Object.entries(previousDays)) {
    const removed = record.tasks.filter(task => taskBelongsToCategory(task, categoryId));
    if (!removed.length) continue;
    previousAffectedDays[date] = record;
    const deletedAt = nextRecordTimestamp(record);
    const updated: DayRecord = {
      ...record,
      tasks: record.tasks.filter(task => !taskBelongsToCategory(task, categoryId)),
      deletedTaskIds: { ...record.deletedTaskIds, ...Object.fromEntries(removed.map(task => [task.id, deletedAt])) },
      updatedAt: deletedAt,
    };
    updatedDays[date] = updated;
    affectedDays.push(updated);
  }

  try {
    if (affectedDays.length && !saveAllDays(updatedDays)) throw new Error('Could not save deleted tasks');
    storeWorkspace(updatedWorkspace);
    if (affectedDays.length) enqueueDays(affectedDays);
    enqueue('workspace', updatedWorkspace);
    window.dispatchEvent(new Event('mizan:workspace-changed'));
    return {
      categoryId,
      categoryName: workspace.categories.find(category => category.id === categoryId)?.name || categoryId,
      previousWorkspace,
      previousDays: previousAffectedDays,
      affectedDates: affectedDays.map(record => record.date),
      expectedWorkspace: updatedWorkspace,
      expectedDays: Object.fromEntries(affectedDays.map(record => [record.date, record])),
    };
  } catch (error) {
    saveAllDays(previousDays);
    storeWorkspace(previousWorkspace);
    saveQueue(previousQueue);
    throw error;
  }
}

export function restorePlannerCategoryAndTasks(snapshot: CategoryDeletionSnapshot, date = snapshot.date): boolean {
  if (date) {
    const currentWorkspace = getPlannerWorkspace(date);
    if (JSON.stringify(currentWorkspace) !== JSON.stringify(snapshot.expectedWorkspace)) return false;
    storePlannerWorkspaceForDate(date, snapshot.previousWorkspace);
    return true;
  }
  const currentWorkspace = getPlannerWorkspace();
  if (JSON.stringify(currentWorkspace) !== JSON.stringify(snapshot.expectedWorkspace)) return false;
  const currentDays = loadAllDays();
  if (snapshot.affectedDates.some(date => JSON.stringify(currentDays[date]) !== JSON.stringify(snapshot.expectedDays[date]))) return false;

  const restoredDays = { ...currentDays, ...snapshot.previousDays };
  const previousQueue = getQueue();
  try {
    if (snapshot.affectedDates.length && !saveAllDays(restoredDays)) throw new Error('Could not restore deleted tasks');
    storeWorkspace(snapshot.previousWorkspace);
    if (snapshot.affectedDates.length) enqueueDays(snapshot.affectedDates.map(date => snapshot.previousDays[date]));
    enqueue('workspace', snapshot.previousWorkspace);
    window.dispatchEvent(new Event('mizan:workspace-changed'));
    return true;
  } catch {
    saveAllDays(currentDays);
    storeWorkspace(currentWorkspace);
    saveQueue(previousQueue);
    return false;
  }
}
