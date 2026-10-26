import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { CheckCheck, ChevronDown, Clock, MoreHorizontal, Plus, StickyNote, X } from 'lucide-react';
import type { DayRecord, Language, PlannerCategory, PlannerWorkspace, StatusFilter, Task, TaskStatus, Theme } from '../types';
import { groupTasksByCategory, UNASSIGNED_CATEGORY } from '../shared/workspace';
import { getTaskCardCategories } from '../utils/cardCategories';
import { createPlannerCategory, updatePlannerCategory } from '../utils/workspace';
import { formatTime12h } from '../utils/date';
import { nextTaskStatus } from '../utils/taskStatus';
import { CARD_ICONS, CategoryEditor } from './CategoryEditor';
import { TaskStatusIndicator } from './TaskStatusIndicator';
import { TaskActions } from './TaskActions';
import { StatCircle } from './StatCircle';
import { calculateStats } from '../utils/storage';
import { partitionPrayerTasks } from '../utils/prayerTasks';
import { PrayerCard } from './PrayerCard';

const emptySpaceTextures: Record<Theme, string> = {
  dark: new URL('../assets/images/home/dashboard-negative-space-dark.png', import.meta.url).href,
  light: new URL('../assets/images/home/dashboard-negative-space-light.png', import.meta.url).href,
};
const categoryBanners: Record<string, Record<Language, string>> = {
  study: {
    ar: new URL('../assets/images/cards/study-rtl.png', import.meta.url).href,
    en: new URL('../assets/images/cards/study-ltr.png', import.meta.url).href,
  },
  work: {
    ar: new URL('../assets/images/cards/work-rtl.png', import.meta.url).href,
    en: new URL('../assets/images/cards/work-ltr.png', import.meta.url).href,
  },
  ideas: {
    ar: new URL('../assets/images/cards/ideas-rtl.png', import.meta.url).href,
    en: new URL('../assets/images/cards/ideas-ltr.png', import.meta.url).href,
  },
  money: {
    ar: new URL('../assets/images/cards/money-rtl.png', import.meta.url).href,
    en: new URL('../assets/images/cards/money-ltr.png', import.meta.url).href,
  },
  health: {
    ar: new URL('../assets/images/cards/health-rtl.png', import.meta.url).href,
    en: new URL('../assets/images/cards/health-ltr.png', import.meta.url).href,
  },
  rest: {
    ar: new URL('../assets/images/cards/personal-rtl.png', import.meta.url).href,
    en: new URL('../assets/images/cards/personal-ltr.png', import.meta.url).href,
  },
};

function balancedGrid(count: number, columns: number) {
  if (!count) return { units: 1, itemSpan: 1, tailSpan: 1, tailStart: 0 };
  // Balance every row: seven cards at three columns become 3 / 2 / 2.
  const rows = Math.ceil(count / columns);
  const smallerRow = Math.floor(count / rows);
  const largerRows = count % rows;
  if (!largerRows) return { units: smallerRow, itemSpan: 1, tailSpan: 1, tailStart: count };
  const largerRow = smallerRow + 1;
  const divisor = (left: number, right: number): number => right ? divisor(right, left % right) : left;
  const units = largerRow * smallerRow / divisor(largerRow, smallerRow);
  return { units, itemSpan: units / largerRow, tailSpan: units / smallerRow, tailStart: largerRows * largerRow };
}

interface CardsDashboardProps {
  cardColumns?: 2 | 3 | 4;
  currentDate: string;
  archiveDays: DayRecord[];
  tasks: Task[];
  workspace: PlannerWorkspace;
  filter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  lang: Language;
  theme?: Theme;
  onAdd: (title: string, categoryId: string) => void;
  onAddPrayer: (title: string, time: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDeleteCategory?: (id: string) => void | Promise<void>;
  onMove?: (id: string) => void;
  onToggleFocus?: (id: string) => void;
  creationTarget?: { categoryId: string; requestId: number } | null;
  onOpenAddTask?: () => void;
}

export function CardsDashboard(props: CardsDashboardProps) {
  const { tasks, workspace, filter, lang, theme = 'dark', onFilterChange } = props;
  const ar = lang === 'ar';
  const [editor, setEditor] = useState<PlannerCategory | 'new' | null>(null);
  const prayerTasks = partitionPrayerTasks(tasks);
  const grouped = groupTasksByCategory(prayerTasks.otherTasks, workspace);
  const cards = getTaskCardCategories(tasks, workspace, props.creationTarget?.categoryId === UNASSIGNED_CATEGORY);
  const cardColumns = props.cardColumns ?? 4;
  const mediumGrid = balancedGrid(cards.length, 2);
  const largeGrid = balancedGrid(cards.length, cardColumns === 2 ? 2 : 3);
  const wideGrid = balancedGrid(cards.length, cardColumns);
  const filterName = { all: '', scheduled: ar ? 'المهام المحددة' : 'Named tasks', pending: ar ? 'المتبقية' : 'Remaining', done: ar ? 'المكتملة' : 'Completed', 'not-done': ar ? 'غير المنجزة' : 'Not done' }[filter];

  return (
    <section data-cards-dashboard aria-label={ar ? 'لوحة بطاقات اليوم' : 'Daily cards dashboard'} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold tracking-tight">{ar ? 'مساحتك اليومية' : 'Your daily workspace'}</h2></div>
        <button type="button" aria-label={ar ? 'إنشاء مساحة جديدة' : 'Create a new space'} title={ar ? 'إنشاء مساحة لتنظيم مهامك' : 'Create a space to organize your tasks'} onClick={() => setEditor('new')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold transition-colors hover:border-emerald-400 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-emerald-400/40"><Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />{ar ? 'مساحة جديدة' : 'New space'}</button>
      </div>
      {filter !== 'all' && <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs"><span>{ar ? 'عرض: ' : 'Showing: '}{filterName}</span><button type="button" onClick={() => onFilterChange('all')} className="inline-flex min-h-9 items-center gap-1 font-semibold"><X className="h-3 w-3" />{ar ? 'عرض الكل' : 'Show all'}</button></div>}
      <PrayerCard currentDate={props.currentDate} slots={prayerTasks.slots} lang={lang} theme={theme} onAddPrayer={props.onAddPrayer} onStatusChange={props.onStatusChange} />
      <div
        className={`category-card-grid relative isolate grid items-start gap-4 ${cardColumns === 3 ? 'category-card-grid-three' : cardColumns === 4 ? 'category-card-grid-four' : 'category-card-grid-two'}`}
        style={{
          '--category-columns-md': mediumGrid.units,
          '--category-columns-lg': largeGrid.units,
          '--category-columns-xl': wideGrid.units,
        } as CSSProperties}
      >
        <img src={emptySpaceTextures[theme]} alt="" aria-hidden="true" loading="lazy" decoding="async" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-[0.18] dark:opacity-[0.2]" />
        {cards.map((category, index) => {
          const mediumTail = index >= mediumGrid.tailStart;
          const largeTail = index >= largeGrid.tailStart;
          const wideTail = index >= wideGrid.tailStart;
          return <CategoryCard key={category.id} {...props} category={category}
            creationRequest={props.creationTarget?.categoryId === category.id ? props.creationTarget.requestId : undefined}
            gridSpans={{
              md: mediumTail ? mediumGrid.tailSpan : mediumGrid.itemSpan,
              lg: largeTail ? largeGrid.tailSpan : largeGrid.itemSpan,
              xl: wideTail ? wideGrid.tailSpan : wideGrid.itemSpan,
            }}
            tasks={grouped.get(category.id) || []}
            onCustomize={category.id === UNASSIGNED_CATEGORY ? undefined : () => setEditor(category)} />;
        })}
      </div>
      {editor && <CategoryEditor key={editor === 'new' ? 'new' : editor.id} category={editor === 'new' ? null : editor} lang={lang} theme={theme}
        onClose={() => setEditor(null)} onSave={(name, icon) => { if (editor === 'new') createPlannerCategory(name, icon); else updatePlannerCategory(editor.id, { name, icon }); setEditor(null); }}
        onDelete={async () => { if (editor !== 'new') { await props.onDeleteCategory?.(editor.id); setEditor(null); } }} />}
    </section>
  );
}

function CategoryCard({ category, tasks, filter, lang, onAdd, onEdit, onDelete, onMove, onToggleFocus, onStatusChange, onCustomize, creationRequest, gridSpans }: CardsDashboardProps & { category: PlannerCategory; onCustomize?: () => void; creationRequest?: number; gridSpans: { md: number; lg: number; xl: number } }) {
  const ar = lang === 'ar';
  const name = ar ? category.name : category.nameEn || category.name;
  const Icon = CARD_ICONS[category.icon];
  const regionId = useId();
  const [title, setTitle] = useState('');
  const [notice, setNotice] = useState('');
  const [emptyComposerOpen, setEmptyComposerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handledCreationRef = useRef<number | undefined>(undefined);
  const stats = calculateStats(tasks);
  const completed = stats.done;
  const isComplete = tasks.length > 0 && completed === tasks.length;
  const visible = tasks.filter(task => filter === 'all' || filter === 'scheduled' || task.status === filter);
  const collapsed = Boolean(category.collapsed);
  // User-created cards have UUID-based IDs; select their artwork by icon.
  const bannerCategory = { book: 'study', briefcase: 'work', heart: 'health', leaf: 'rest', moon: 'ideas', layers: 'money' }[category.icon];
  const banner = (Object.hasOwn(categoryBanners, category.id)
    ? categoryBanners[category.id]
    : categoryBanners[bannerCategory])?.[lang];
  useEffect(() => {
    if (!creationRequest || collapsed || handledCreationRef.current === creationRequest) return;
    const input = inputRef.current;
    if (!input) return;
    handledCreationRef.current = creationRequest;
    input.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    input.focus({ preventScroll: true });
  }, [creationRequest, collapsed]);
  useEffect(() => {
    if (!emptyComposerOpen || collapsed || tasks.length > 0) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [emptyComposerOpen, collapsed, tasks.length]);
  const statusLabels = ar
    ? { pending: 'متبقية', done: 'مكتملة', 'not-done': 'غير منجزة' }
    : { pending: 'Remaining', done: 'Completed', 'not-done': 'Not done' };
  // Use stored order rather than visible position so renaming/deleting cards never recolors their neighbors.
  const hues = [215, 35, 270, 345, 155, 190];
  const hue = hues[category.order] ?? (215 + category.order * 137.508) % 360;
  const colorStyle = { '--card-hue': hue, '--card-saturation': category.id === UNASSIGNED_CATEGORY ? '0%' : '65%' } as CSSProperties;
  return (
    <article aria-label={name} data-category-id={category.id} data-card-complete={isComplete} style={{ ...colorStyle, '--category-span-md': gridSpans.md, '--category-span-lg': gridSpans.lg, '--category-span-xl': gridSpans.xl } as CSSProperties} className="dashboard-category-card planner-card relative z-10 min-w-0 overflow-hidden rounded-card border border-t-[3px] shadow-2xs">
      <div data-category-banner={banner ? category.id : undefined} className={`relative isolate flex items-center gap-3 overflow-hidden p-4 ${banner ? 'planner-card-banner text-white' : ''}`}>
        {banner && <>
          <img src={banner} alt="" aria-hidden="true" loading="eager" decoding="async" className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center" />
          <span aria-hidden="true" className="planner-card-image-shade pointer-events-none absolute inset-0 z-10" />
        </>}
        <div className={`relative z-20 flex min-w-0 flex-1 items-center gap-3 ${banner ? 'rounded-xl bg-gradient-to-r from-black/65 via-black/55 to-black/65 px-2 py-1' : ''}`}>
          <div aria-hidden="true" className={`planner-card-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${banner ? 'border-white/20 bg-black/45 text-white' : ''}`}><Icon className="h-[18px] w-[18px]" strokeWidth={1.8} /></div>
          <div className="min-w-0 flex-1"><h3 className={`break-words text-sm font-bold leading-6 ${banner ? 'text-white' : ''}`}>{name}</h3></div>
        </div>
        {onCustomize && <div className={`relative z-20 flex shrink-0 items-center gap-0.5 ${banner ? 'rounded-xl bg-black/40 p-0.5' : ''}`}><button type="button" aria-label={ar ? `تخصيص ${name}` : `Customize ${name}`} onClick={onCustomize} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${banner ? 'text-white/90 hover:bg-white/15 hover:text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5'}`}><MoreHorizontal className="h-4 w-4" /></button><button type="button" aria-label={ar ? (collapsed ? `توسيع ${name}` : `طي ${name}`) : (collapsed ? `Expand ${name}` : `Collapse ${name}`)} aria-expanded={!collapsed} aria-controls={regionId} onClick={() => updatePlannerCategory(category.id, { collapsed: !collapsed })} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${banner ? 'text-white/90 hover:bg-white/15 hover:text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5'}`}><ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${collapsed ? '-rotate-90 rtl:rotate-90' : ''}`} /></button></div>}
      </div>
      {isComplete && <div dir={ar ? 'rtl' : 'ltr'} data-card-completion-banner role="status" className="mx-4 mt-2 mb-3 flex items-center justify-between gap-2 rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-3 py-2 text-[11px] font-semibold text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300"><span className="inline-flex items-center gap-2"><span>{ar ? 'اكتملت كل المهام' : 'All tasks complete'}</span><CheckCheck aria-hidden="true" className="h-4 w-4 shrink-0" /></span><span dir="ltr" className="tabular-nums">100%</span></div>}
      {tasks.length > 0 && <div data-card-stats role="group" aria-label={ar ? `إحصائيات ${name}` : `${name} statistics`} className="mx-4 grid grid-cols-4 items-start gap-1 border-t border-slate-200/60 py-3 dark:border-white/[0.06]">
        <StatCircle compact label={statusLabels.done} value={stats.done} percentage={stats.total ? stats.done / stats.total * 100 : 0} color="emerald" isActive={false} subLabel={`${stats.total ? Math.round(stats.done / stats.total * 100) : 0}%`} />
        <StatCircle compact label={statusLabels.pending} value={stats.pending} percentage={stats.total ? stats.pending / stats.total * 100 : 0} color="amber" isActive={false} subLabel={`${stats.total ? Math.round(stats.pending / stats.total * 100) : 0}%`} />
        <StatCircle compact label={statusLabels['not-done']} value={stats.notDone} percentage={stats.total ? stats.notDone / stats.total * 100 : 0} color="rose" isActive={false} subLabel={`${stats.total ? Math.round(stats.notDone / stats.total * 100) : 0}%`} />
        <StatCircle compact label={ar ? 'الإجمالي' : 'Total'} value={stats.total} percentage={stats.total ? 100 : 0} color="indigo" isActive={true} subLabel={ar ? 'مهمة' : 'tasks'} />
      </div>}
      <div id={regionId} data-planner-card-content hidden={collapsed} className="p-3 pt-2">
        <div className="space-y-1">
          {tasks.length === 0 && <div className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-200/80 bg-slate-50/60 px-3 py-4 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
            {!emptyComposerOpen && <button type="button" onClick={() => setEmptyComposerOpen(true)} className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-transparent px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-zinc-300 dark:hover:bg-white/[0.05] dark:hover:text-zinc-100">
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              {ar ? 'أضف أول مهمة' : 'Add first task'}
            </button>}
          </div>}
          {tasks.length > 0 && visible.length === 0 && <p className="px-2 py-5 text-xs leading-6 text-slate-500 dark:text-zinc-400">{ar ? 'لا توجد مهام تطابق هذا الفلتر.' : 'No tasks match this filter.'}</p>}
          {visible.map(task => {
            return <div key={task.id} data-card-task-status={task.status} className="task-row card-task-row group grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-start gap-x-1 rounded-xl px-1 py-1.5 transition-colors hover:bg-slate-100/70 focus-within:bg-slate-100/70 motion-reduce:transition-none dark:hover:bg-white/[0.04] dark:focus-within:bg-white/[0.04]">
            <button type="button" data-task-status={task.status}
              aria-label={ar ? `تغيير حالة ${task.title}: ${statusLabels[task.status]}. التالي: ${statusLabels[nextTaskStatus(task.status)]}` : `Change status of ${task.title}: ${statusLabels[task.status]}. Next: ${statusLabels[nextTaskStatus(task.status)]}`}
              title={ar ? 'انقر للتبديل: متبقية ← مكتملة ← غير منجزة ← متبقية' : 'Click to cycle: Remaining → Completed → Not done → Remaining'}
              onClick={() => onStatusChange(task.id, nextTaskStatus(task.status))}
              className="group/status flex h-11 w-11 shrink-0 items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 active:scale-[.98] dark:hover:bg-white/[0.05]"><TaskStatusIndicator status={task.status} /></button>
            <button type="button" onClick={() => onEdit(task)} aria-label={ar ? `تعديل ${task.title}` : `Edit ${task.title}`} title={task.title} className="flex min-h-9 min-w-0 flex-col justify-center rounded-lg py-1 text-start focus-visible:outline-2 focus-visible:outline-emerald-400">
              <span data-card-task-title dir="auto" className={`line-clamp-2 w-full min-w-0 text-[13px] font-medium leading-6 [overflow-wrap:anywhere] ${task.status === 'done' ? 'text-slate-500 dark:text-zinc-400' : 'text-slate-800 dark:text-zinc-200'}`}>{task.title}</span>
              {(task.time || task.notes) && <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-zinc-300">{task.time && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime12h(task.time, lang).formatted}</span>}{task.notes && <StickyNote className="h-3 w-3" aria-label={ar ? 'توجد ملاحظة' : 'Has notes'} />}</span>}
            </button>
            <TaskActions task={task} lang={lang} onEdit={onEdit} onDelete={onDelete} onMove={onMove} onToggleFocus={onToggleFocus} />
          </div>;
          })}
        </div>
        {(tasks.length > 0 || emptyComposerOpen) && <form className="planner-card-form mt-2 flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/60 dark:border-white/[0.07] dark:bg-white/[0.02]" onSubmit={e => { e.preventDefault(); if (!title.trim()) return; onAdd(title.trim(), category.id); setTitle(''); setNotice(ar ? 'تمت إضافة المهمة' : 'Task added'); }}>
          <input ref={inputRef} aria-label={ar ? `مهمة جديدة في ${name}` : `New task in ${name}`} maxLength={300} value={title} onChange={e => { setTitle(e.target.value); setNotice(''); }} onKeyDown={e => { if (e.nativeEvent.isComposing && e.key === 'Enter') e.preventDefault(); }} placeholder={ar ? 'أضف مهمة…' : 'Add a task…'} className="min-h-11 min-w-0 flex-1 rounded-xl bg-transparent px-3 text-xs outline-none placeholder:text-slate-500 dark:placeholder:text-zinc-400" />
          <button type="submit" disabled={!title.trim()} aria-label={ar ? `إضافة مهمة إلى ${name}` : `Add task to ${name}`} className="planner-card-add m-1 flex h-control-compact w-control-compact shrink-0 items-center justify-center rounded-control disabled:bg-transparent disabled:text-slate-400 dark:disabled:text-zinc-600"><Plus className="h-4 w-4" /></button>
        </form>}
        <p role="status" aria-live="polite" className="sr-only">{notice}</p>
      </div>
    </article>
  );
}
