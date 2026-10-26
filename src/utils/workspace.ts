import type { CategoryIcon, PlannerCategory, PlannerView, PlannerWorkspace } from '../types';
import { activeCategories, createWorkspace, parseWorkspace } from '../shared/workspace';
import { timestamp } from '../shared/merge';
import { userStorage } from './scopedStorage';
import { enqueue } from '../services/syncQueue';

export const WORKSPACE_KEY = 'mizan_planner_workspace_v1';

export function readStoredWorkspace(): PlannerWorkspace | undefined {
  try {
    const raw = userStorage.getItem(WORKSPACE_KEY);
    return raw ? parseWorkspace(JSON.parse(raw)) : undefined;
  } catch { return undefined; }
}

// Missing metadata identifies legacy accounts, including accounts opened on a new device.
export function getPlannerWorkspace(): PlannerWorkspace {
  return readStoredWorkspace() || createWorkspace('timeline');
}

export function storeWorkspace(workspace: PlannerWorkspace): void {
  userStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
}

function saveWorkspace(workspace: PlannerWorkspace): PlannerWorkspace {
  const valid = parseWorkspace(workspace);
  storeWorkspace(valid);
  enqueue('workspace', valid);
  window.dispatchEvent(new Event('mizan:workspace-changed'));
  return valid;
}

export function nextWorkspaceTimestamp(workspace: PlannerWorkspace): string {
  return new Date(Math.max(Date.now(), timestamp(workspace.viewUpdatedAt) + 1, ...workspace.categories.map(c => timestamp(c.updatedAt) + 1))).toISOString();
}

export function markPlannerCategoryDeleted(workspace: PlannerWorkspace, id: string, changedAt = nextWorkspaceTimestamp(workspace)): PlannerWorkspace {
  return { ...workspace, categories: workspace.categories.map(c => c.id === id && !c.deletedAt
    ? { ...c, deletedAt: changedAt, updatedAt: changedAt } : c) };
}

export function setPlannerView(view: PlannerView): PlannerWorkspace {
  const workspace = getPlannerWorkspace();
  return saveWorkspace({ ...workspace, view, viewUpdatedAt: nextWorkspaceTimestamp(workspace) });
}

export function createPlannerCategory(name: string, icon: CategoryIcon): PlannerWorkspace {
  const workspace = getPlannerWorkspace();
  if (activeCategories(workspace).length >= 100) throw new Error('Category limit reached');
  const category: PlannerCategory = { id: `category_${crypto.randomUUID()}`, name: name.trim(), icon,
    order: Math.max(-1, ...workspace.categories.map(c => c.order)) + 1, updatedAt: nextWorkspaceTimestamp(workspace) };
  return saveWorkspace({ ...workspace, categories: [...workspace.categories, category] });
}

export function updatePlannerCategory(id: string, updates: { name?: string; icon?: CategoryIcon; collapsed?: boolean }): PlannerWorkspace {
  const workspace = getPlannerWorkspace();
  const changedAt = nextWorkspaceTimestamp(workspace);
  return saveWorkspace({ ...workspace, categories: workspace.categories.map(c => c.id === id && !c.deletedAt
    ? { ...c, ...updates, ...(updates.name !== undefined ? { nameEn: undefined } : {}), updatedAt: changedAt } : c) });
}

export function deletePlannerCategory(id: string): PlannerWorkspace {
  const workspace = getPlannerWorkspace();
  return saveWorkspace(markPlannerCategoryDeleted(workspace, id));
}
