import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import { Check, ChevronDown, Clock, MoreHorizontal, Plus, StickyNote, Pencil, Trash2, X } from 'lucide-react';
import type { Language, PlannerCategory, PlannerWorkspace, StatusFilter, Task, TaskStatus } from '../types';
import { activeCategories, groupTasksByCategory, UNASSIGNED_CATEGORY, WORKSPACE_EPOCH } from '../shared/workspace';
import { createPlannerCategory, deletePlannerCategory, updatePlannerCategory } from '../utils/workspace';
import { formatTime12h } from '../utils/date';
import { nextTaskStatus } from '../utils/taskStatus';
import { CARD_ICONS, CategoryEditor } from './CategoryEditor';

interface CardsDashboardProps {
  tasks: Task[];
  workspace: PlannerWorkspace;
  filter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  lang: Language;
  onAdd: (title: string, categoryId: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function CardsDashboard(props: CardsDashboardProps) {
  const { tasks, workspace, filter, lang, onFilterChange } = props;
  const ar = lang === 'ar';
  const [editor, setEditor] = useState<PlannerCategory | 'new' | null>(null);
  const categories = activeCategories(workspace);
  const grouped = groupTasksByCategory(tasks, workspace);
  const unassigned = grouped.get(UNASSIGNED_CATEGORY) || [];
  const fallback: PlannerCategory = { id: UNASSIGNED_CATEGORY, name: 'غير مصنّف', nameEn: 'Unassigned', icon: 'layers', order: 0, updatedAt: WORKSPACE_EPOCH };
  const cards = unassigned.length || !categories.length ? [...categories, fallback] : categories;
  const filterName = { all: '', scheduled: ar ? 'المهام المحددة' : 'Named tasks', pending: ar ? 'المتبقية' : 'Remaining', done: ar ? 'المكتملة' : 'Completed', 'not-done': ar ? 'غير المنجزة' : 'Not done' }[filter];

  return (
    <section aria-label={ar ? 'لوحة بطاقات اليوم' : 'Daily cards dashboard'} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold tracking-tight">{ar ? 'مساحتك اليومية' : 'Your daily workspace'}</h2><p className="mt-1 text-xs leading-6 text-slate-500 dark:text-zinc-400">{ar ? 'خطوة واحدة في كل مرة. الوقت اختياري.' : 'One step at a time. Scheduling is optional.'}</p></div>
        <button type="button" onClick={() => setEditor('new')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold transition-colors hover:border-emerald-400 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-emerald-400/40"><Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />{ar ? 'بطاقة جديدة' : 'New card'}</button>
      </div>
      {filter !== 'all' && <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs"><span>{ar ? 'عرض: ' : 'Showing: '}{filterName}</span><button type="button" onClick={() => onFilterChange('all')} className="inline-flex min-h-9 items-center gap-1 font-semibold"><X className="h-3 w-3" />{ar ? 'عرض الكل' : 'Show all'}</button></div>}
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(category => <CategoryCard key={category.id} {...props} category={category}
          tasks={grouped.get(category.id) || []}
          onCustomize={category.id === UNASSIGNED_CATEGORY ? undefined : () => setEditor(category)} />)}
      </div>
      {editor && <CategoryEditor key={editor === 'new' ? 'new' : editor.id} category={editor === 'new' ? null : editor} lang={lang}
        onClose={() => setEditor(null)} onSave={(name, icon) => { if (editor === 'new') createPlannerCategory(name, icon); else updatePlannerCategory(editor.id, { name, icon }); setEditor(null); }}
        onDelete={() => { if (editor !== 'new') deletePlannerCategory(editor.id); setEditor(null); }} />}
    </section>
  );
}

function CategoryCard({ category, tasks, filter, lang, onAdd, onEdit, onDelete, onStatusChange, onCustomize }: CardsDashboardProps & { category: PlannerCategory; onCustomize?: () => void }) {
  const ar = lang === 'ar';
  const name = ar ? category.name : category.nameEn || category.name;
  const Icon = CARD_ICONS[category.icon];
  const regionId = useId();
  const [title, setTitle] = useState('');
  const [notice, setNotice] = useState('');
  const completed = tasks.filter(task => task.status === 'done').length;
  const visible = tasks.filter(task => filter === 'all' || filter === 'scheduled' || task.status === filter);
  const collapsed = Boolean(category.collapsed);
  const statusLabels = ar
    ? { pending: 'متبقية', done: 'مكتملة', 'not-done': 'غير منجزة' }
    : { pending: 'Remaining', done: 'Completed', 'not-done': 'Not done' };
  // Use stored order rather than visible position so renaming/deleting cards never recolors their neighbors.
  const hues = [215, 35, 270, 345, 155, 190];
  const hue = hues[category.order] ?? (215 + category.order * 137.508) % 360;
  const colorStyle = { '--card-hue': hue, '--card-saturation': category.id === UNASSIGNED_CATEGORY ? '0%' : '65%' } as CSSProperties;
  return (
    <article aria-label={name} style={colorStyle} className="planner-card min-w-0 rounded-2xl border border-t-[3px] shadow-2xs">
      <div className="flex items-center gap-3 p-4">
        <div aria-hidden="true" className="planner-card-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"><Icon className="h-[18px] w-[18px]" strokeWidth={1.8} /></div>
        <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-bold leading-6">{name}</h3><p className="text-[11px] text-slate-500 dark:text-zinc-400">{tasks.length ? (ar ? `${completed} من ${tasks.length} مكتملة` : `${completed} of ${tasks.length} complete`) : (ar ? 'مساحة لما يهمك' : 'Room for what matters')}</p></div>
        {onCustomize && <><button type="button" aria-label={ar ? `تخصيص ${name}` : `Customize ${name}`} onClick={onCustomize} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"><MoreHorizontal className="h-4 w-4" /></button><button type="button" aria-label={ar ? (collapsed ? `توسيع ${name}` : `طي ${name}`) : (collapsed ? `Expand ${name}` : `Collapse ${name}`)} aria-expanded={!collapsed} aria-controls={regionId} onClick={() => updatePlannerCategory(category.id, { collapsed: !collapsed })} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"><ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${collapsed ? '-rotate-90 rtl:rotate-90' : ''}`} /></button></>}
      </div>
      {tasks.length > 0 && <div aria-hidden="true" className="mx-4 h-0.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5"><div className="planner-card-progress h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${completed / tasks.length * 100}%` }} /></div>}
      <div id={regionId} data-planner-card-content hidden={collapsed} className="p-3 pt-2">
        <div className="space-y-1">
          {visible.length === 0 && <p className="px-2 py-5 text-xs leading-6 text-slate-500 dark:text-zinc-400">{tasks.length ? (ar ? 'لا توجد مهام تطابق هذا الفلتر.' : 'No tasks match this filter.') : (ar ? 'ابدأ بمهمة صغيرة، وأكملها على إيقاعك.' : 'Start with something small. Make it your own.')}</p>}
          {visible.map(task => <div key={task.id} className="group flex items-start gap-2 rounded-xl px-1 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
            <button type="button" data-task-status={task.status}
              aria-label={ar ? `تغيير حالة ${task.title}: ${statusLabels[task.status]}. التالي: ${statusLabels[nextTaskStatus(task.status)]}` : `Change status of ${task.title}: ${statusLabels[task.status]}. Next: ${statusLabels[nextTaskStatus(task.status)]}`}
              title={ar ? 'انقر للتبديل: متبقية ← مكتملة ← غير منجزة ← متبقية' : 'Click to cycle: Remaining → Completed → Not done → Remaining'}
              onClick={() => onStatusChange(task.id, nextTaskStatus(task.status))}
              className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-emerald-400"><span aria-hidden="true" className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${task.status === 'done' ? 'border-emerald-400 bg-emerald-400 text-slate-950' : task.status === 'not-done' ? 'border-rose-500 bg-rose-500 text-white dark:border-rose-400 dark:bg-rose-400 dark:text-slate-950' : 'border-slate-500 dark:border-zinc-500'}`}>{task.status === 'done' ? <Check className="h-3.5 w-3.5" /> : task.status === 'not-done' ? <X className="h-3.5 w-3.5" /> : null}</span></button>
            <button type="button" onClick={() => onEdit(task)} aria-label={ar ? `تعديل ${task.title}` : `Edit ${task.title}`} className="min-h-11 min-w-0 flex-1 py-2 text-start">
              <span className={`block break-words text-xs font-medium leading-6 ${task.status === 'done' ? 'text-slate-400 line-through dark:text-zinc-500' : task.status === 'not-done' ? 'text-rose-600 dark:text-rose-300' : ''}`}>{task.title}</span>
              {(task.time || task.notes || task.status === 'not-done') && <span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-zinc-400">{task.time && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime12h(task.time, lang).formatted}</span>}{task.notes && <StickyNote className="h-3 w-3" aria-label={ar ? 'توجد ملاحظة' : 'Has notes'} />}{task.status === 'not-done' && <span>{ar ? 'غير منجزة' : 'Not done'}</span>}</span>}
            </button>
            <button type="button" onClick={() => onEdit(task)} aria-label={ar ? `تفاصيل ${task.title}` : `Details for ${task.title}`} className="flex h-11 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => onDelete(task.id)} aria-label={ar ? `حذف ${task.title}` : `Delete ${task.title}`} className="flex h-11 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:text-rose-500 dark:text-zinc-600 dark:hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>)}
        </div>
        <form className="planner-card-form mt-2 flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/60 dark:border-white/[0.07] dark:bg-white/[0.02]" onSubmit={e => { e.preventDefault(); if (!title.trim()) return; onAdd(title.trim(), category.id); setTitle(''); setNotice(ar ? 'تمت إضافة المهمة' : 'Task added'); }}>
          <input aria-label={ar ? `مهمة جديدة في ${name}` : `New task in ${name}`} maxLength={300} value={title} onChange={e => { setTitle(e.target.value); setNotice(''); }} onKeyDown={e => { if (e.nativeEvent.isComposing && e.key === 'Enter') e.preventDefault(); }} placeholder={ar ? 'أضف مهمة…' : 'Add a task…'} className="min-h-11 min-w-0 flex-1 rounded-xl bg-transparent px-3 text-xs outline-none placeholder:text-slate-500 dark:placeholder:text-zinc-400" />
          <button type="submit" disabled={!title.trim()} aria-label={ar ? `إضافة مهمة إلى ${name}` : `Add task to ${name}`} className="planner-card-add m-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg disabled:bg-transparent disabled:text-slate-400 dark:disabled:text-zinc-600"><Plus className="h-4 w-4" /></button>
        </form>
        <p role="status" aria-live="polite" className="sr-only">{notice}</p>
      </div>
    </article>
  );
}
