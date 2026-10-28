import type { CategoryIcon, PlannerCategory, PlannerView, PlannerWorkspace, Task } from '../types';
import { timestamp } from './merge.js';

export const CATEGORY_ICONS: CategoryIcon[] = ['book', 'briefcase', 'heart', 'leaf', 'moon', 'dollar-sign'];
export const WORKSPACE_EPOCH = '1970-01-01T00:00:00.000Z';
export const UNASSIGNED_CATEGORY = '__unassigned';

export function createWorkspace(view: PlannerView = 'timeline', updatedAt = WORKSPACE_EPOCH): PlannerWorkspace {
  const seeds: [string, string, string, CategoryIcon][] = [
    ['study', 'الدراسة', 'Study', 'book'],
    ['work', 'العمل والمشاريع', 'Work & projects', 'briefcase'],
    ['worship', 'العبادة', 'Worship', 'moon'],
    ['health', 'الصحة والنشاط', 'Health & fitness', 'heart'],
    ['rest', 'الحياة الشخصية', 'Personal life', 'leaf'],
    ['general', 'مساحة مفتوحة', 'Open space', 'layers'],
  ];
  return { view, viewUpdatedAt: updatedAt, categories: seeds.map(([id, name, nameEn, icon], order) => ({ id, name, nameEn, icon, order, updatedAt })) };
}

// Workspace merging only handles category metadata; composite deletion removes tasks separately.
export function mergeWorkspace(local: PlannerWorkspace | undefined, incoming: PlannerWorkspace): PlannerWorkspace {
  if (!local) return structuredClone(incoming);
  const categories = new Map(local.categories.map(category => [category.id, category]));
  for (const category of incoming.categories) {
    const previous = categories.get(category.id);
    if (!previous || (category.deletedAt && !previous.deletedAt) ||
      (Boolean(category.deletedAt) === Boolean(previous.deletedAt) && timestamp(category.updatedAt) >= timestamp(previous.updatedAt))) {
      categories.set(category.id, category);
    }
  }
  const view = timestamp(incoming.viewUpdatedAt) >= timestamp(local.viewUpdatedAt) ? incoming : local;
  return { view: view.view, viewUpdatedAt: view.viewUpdatedAt, categories: [...categories.values()].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)) };
}

export function activeCategories(workspace: PlannerWorkspace): PlannerCategory[] {
  return workspace.categories.filter(category => !category.deletedAt).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function taskCategoryId(task: Task, workspace: PlannerWorkspace): string {
  const id = task.categoryId || task.category || 'general';
  return workspace.categories.some(category => category.id === id && !category.deletedAt) ? id : UNASSIGNED_CATEGORY;
}

export function groupTasksByCategory(tasks: Task[], workspace: PlannerWorkspace): Map<string, Task[]> {
  const ids = new Set(activeCategories(workspace).map(category => category.id));
  const grouped = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.title.trim()) continue;
    const id = task.categoryId || task.category || 'general';
    const key = ids.has(id) ? id : UNASSIGNED_CATEGORY;
    const group = grouped.get(key) || [];
    group.push(task);
    grouped.set(key, group);
  }
  return grouped;
}

export function parseWorkspace(value: unknown): PlannerWorkspace {
  const invalid = (): never => { throw Object.assign(new Error('Invalid planner workspace'), { status: 400 }); };
  if (!value || typeof value !== 'object') return invalid();
  // Older stored workspaces predate the sync timestamps and category metadata.
  // Fill only absent metadata, retaining IDs, names, order and deletion markers.
  const raw = value as PlannerWorkspace;
  const data = { ...raw, viewUpdatedAt: raw.viewUpdatedAt ?? WORKSPACE_EPOCH,
    categories: Array.isArray(raw.categories) ? raw.categories.map((category, index) => {
      if (!category || typeof category !== 'object') return category;
      const seed = createWorkspace().categories.find(seed => seed.id === category.id);
      return { ...category, icon: category.icon ?? seed?.icon ?? 'layers',
        order: category.order ?? index, updatedAt: category.updatedAt ?? WORKSPACE_EPOCH,
        nameEn: category.nameEn ?? undefined, collapsed: category.collapsed ?? undefined,
        deletedAt: category.deletedAt ?? undefined };
    }) : raw.categories };
  if (!['cards', 'timeline'].includes(data.view) || typeof data.viewUpdatedAt !== 'string' || !Number.isFinite(Date.parse(data.viewUpdatedAt)) ||
    !Array.isArray(data.categories) || data.categories.length > 1000) return invalid();
  const seen = new Set<string>();
  const categories = data.categories.map(category => {
    if (!category || typeof category.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(category.id) ||
      category.id === UNASSIGNED_CATEGORY || seen.has(category.id) || typeof category.name !== 'string' ||
      !category.name.trim() || category.name.length > 80 || !CATEGORY_ICONS.includes(category.icon) && category.icon !== 'layers' ||
      !Number.isFinite(category.order) || category.order < 0 || category.order > 1000000 ||
      typeof category.updatedAt !== 'string' || !Number.isFinite(Date.parse(category.updatedAt)) ||
      (category.nameEn !== undefined && (typeof category.nameEn !== 'string' || category.nameEn.length > 80)) ||
      (category.collapsed !== undefined && typeof category.collapsed !== 'boolean') ||
      (category.deletedAt !== undefined && (typeof category.deletedAt !== 'string' || !Number.isFinite(Date.parse(category.deletedAt))))) return invalid();
    seen.add(category.id);
    return { id: category.id, name: category.name.trim(), nameEn: category.nameEn, icon: category.icon,
      order: category.order, collapsed: category.collapsed, updatedAt: category.updatedAt, deletedAt: category.deletedAt };
  });
  return { categories, view: data.view, viewUpdatedAt: data.viewUpdatedAt };
}
