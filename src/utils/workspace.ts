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

function createDefaultDayCategories(updatedAt = new Date().toISOString()): PlannerCategory[] {
  return DEFAULT_CANONICAL_SPACES.map((space, order) => ({ ...space, order, updatedAt }));
}

function dateWorkspace(base: PlannerWorkspace, date: string): PlannerWorkspace {
  const existing = base.dailyCategories?.[date];
  if (existing) return { ...base, categories: structuredClone(existing) };

  // A legacy global workspace is migrated once to the first selected date. Every
  // other date gets a clean canonical template, never a copy of that legacy state.
  const dailyCategories = { ...(base.dailyCategories || {}) };
  const legacySeedIds = new Set(['study', 'work', 'worship', 'health', 'rest', 'general']);
  const isFreshSeed = base.categories.length === legacySeedIds.size && base.categories.every(category => legacySeedIds.has(category.id));
  const categories = Object.keys(dailyCategories).length || isFreshSeed
    ? createDefaultDayCategories(base.viewUpdatedAt)
    : structuredClone(base.categories);
  dailyCategories[date] = categories;
  const migrated = { ...base, categories: createDefaultDayCategories(base.viewUpdatedAt), dailyCategories };
  storeWorkspace(migrated);
  enqueue('workspace', migrated);
  return { ...migrated, categories: structuredClone(categories) };
}

function saveDateWorkspace(date: string, workspace: PlannerWorkspace): PlannerWorkspace {
  const base = readStoredWorkspace() || workspace;
  const dailyCategories = { ...(base.dailyCategories || {}), [date]: structuredClone(workspace.categories) };
  const saved = saveWorkspace({ ...base, dailyCategories });
  return { ...saved, categories: structuredClone(dailyCategories[date]) };
}

export function storePlannerWorkspaceForDate(date: string, workspace: PlannerWorkspace): PlannerWorkspace {
  return saveDateWorkspace(date, workspace);
}

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

export function getPlannerWorkspace(date?: string): PlannerWorkspace {
  const ws = readStoredWorkspace();
  if (ws) {
    // A legacy global workspace may already contain intentional omissions.
    // Migrate it as-is to the first selected date before any canonical repair;
    // otherwise the old migration could resurrect cards the user removed.
    if (date && !ws.dailyCategories) return dateWorkspace(ws, date);
    const canonical = ensureCanonicalSpaces(ws);
    if (canonical !== ws) {
      storeWorkspace(canonical);
      return date ? dateWorkspace(canonical, date) : canonical;
    }
    return date ? dateWorkspace(ws, date) : ws;
  }
  const fresh = createWorkspace('timeline');
  const canonical = ensureCanonicalSpaces(fresh);
  return date ? dateWorkspace(canonical, date) : canonical;
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

export function setPlannerView(view: PlannerView, date?: string): PlannerWorkspace {
  const selected = getPlannerWorkspace(date);
  const workspace = readStoredWorkspace() || selected;
  const saved = saveWorkspace({ ...workspace, view, viewUpdatedAt: nextWorkspaceTimestamp(workspace) });
  return date ? { ...saved, categories: structuredClone(selected.categories) } : saved;
}

export function createPlannerCategory(name: string, icon: CategoryIcon, date?: string): PlannerWorkspace {
  const workspace = getPlannerWorkspace(date);
  if (activeCategories(workspace).length >= 100) throw new Error('Category limit reached');
  const category: PlannerCategory = { id: `category_${crypto.randomUUID()}`, name: name.trim(), icon,
    order: Math.max(-1, ...workspace.categories.map(c => c.order)) + 1, updatedAt: nextWorkspaceTimestamp(workspace) };
  return date ? saveDateWorkspace(date, { ...workspace, categories: [...workspace.categories, category] })
    : saveWorkspace({ ...workspace, categories: [...workspace.categories, category] });
}

export function updatePlannerCategory(id: string, updates: { name?: string; icon?: CategoryIcon; collapsed?: boolean }, date?: string): PlannerWorkspace {
  const workspace = getPlannerWorkspace(date);
  const changedAt = nextWorkspaceTimestamp(workspace);
  const updated = { ...workspace, categories: workspace.categories.map(c => c.id === id && !c.deletedAt
    ? { ...c, ...updates, ...(updates.name !== undefined ? { nameEn: undefined } : {}), updatedAt: changedAt } : c) };
  return date ? saveDateWorkspace(date, updated) : saveWorkspace(updated);
}

export function deletePlannerCategory(id: string, date?: string): PlannerWorkspace {
  const workspace = getPlannerWorkspace(date);
  const updated = markPlannerCategoryDeleted(workspace, id);
  return date ? saveDateWorkspace(date, updated) : saveWorkspace(updated);
}
