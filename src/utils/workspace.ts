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
export function resetPlannerWorkspace(): PlannerWorkspace {
  const ws = createWorkspace('cards');
  return saveWorkspace(ws);
}

export const DEFAULT_CANONICAL_SPACES: Array<{ id: string; name: string; nameEn: string; icon: CategoryIcon }> = [
  { id: 'work', name: 'العمل والمشاريع', nameEn: 'Work & projects', icon: 'briefcase' },
  { id: 'study', name: 'الجامعة والدراسة', nameEn: 'University & Study', icon: 'book' },
  { id: 'health', name: 'الصحة والنشاط', nameEn: 'Health & fitness', icon: 'heart' },
  { id: 'rest', name: 'الحياة الشخصية', nameEn: 'Personal life', icon: 'leaf' },
  { id: 'ideas', name: 'الأفكار والمساعدات', nameEn: 'Ideas & Assistance', icon: 'moon' },
  { id: 'expenses', name: 'المصاريف اليومية', nameEn: 'Daily Expenses', icon: 'dollar-sign' },
];

export function ensureCanonicalSpaces(workspace: PlannerWorkspace): PlannerWorkspace {
  const categories = [...workspace.categories];
  let changed = false;
  const now = new Date().toISOString();

  // 1. Upgrade legacy study name if unchanged by user
  const studyCat = categories.find(c => c.id === 'study' && !c.deletedAt);
  if (studyCat && (studyCat.name === 'الدراسة' || studyCat.name === 'Study')) {
    studyCat.name = 'الجامعة والدراسة';
    studyCat.nameEn = 'University & Study';
    studyCat.updatedAt = now;
    changed = true;
  }

  // 2. Ensure each canonical category exists
  for (let i = 0; i < DEFAULT_CANONICAL_SPACES.length; i++) {
    const canonical = DEFAULT_CANONICAL_SPACES[i];
    const existing = categories.find(c => c.id === canonical.id);
    if (!existing) {
      categories.push({
        id: canonical.id,
        name: canonical.name,
        nameEn: canonical.nameEn,
        icon: canonical.icon,
        order: i,
        updatedAt: now,
      });
      changed = true;
    }
  }

  // 3. Retire legacy 'general' (مساحة مفتوحة) if present
  const generalCat = categories.find(c => c.id === 'general' && !c.deletedAt);
  if (generalCat && (generalCat.name === 'مساحة مفتوحة' || generalCat.name === 'Open space')) {
    generalCat.deletedAt = now;
    generalCat.updatedAt = now;
    changed = true;
  }

  if (!changed) return workspace;

  return {
    ...workspace,
    categories,
  };
}

export function getPlannerWorkspace(): PlannerWorkspace {
  const ws = readStoredWorkspace();
  if (ws) {
    const canonical = ensureCanonicalSpaces(ws);
    if (canonical !== ws) {
      storeWorkspace(canonical);
      return canonical;
    }
    return ws;
  }
  const fresh = createWorkspace('timeline');
  return ensureCanonicalSpaces(fresh);
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
