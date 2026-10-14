import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarArrowUp, MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import type { Language, Task } from '../types';
import { canMoveTask, isFocusTaskEligible } from '../shared/taskPlanning';

interface TaskActionsProps {
  task: Task;
  lang: Language;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMove?: (id: string) => void;
  onToggleFocus?: (id: string) => void;
}

export function TaskActions({ task, lang, onEdit, onDelete, onMove, onToggleFocus }: TaskActionsProps) {
  const ar = lang === 'ar', menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null), menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const isOpen = position !== null;
  const editLabel = ar ? `تفاصيل ${task.title}` : `Details for ${task.title}`;
  const deleteLabel = ar ? `حذف ${task.title}` : `Delete ${task.title}`;
  const showFocus = Boolean(onToggleFocus && isFocusTaskEligible(task));
  const showMove = Boolean(onMove && canMoveTask(task));
  const enhanced = Boolean(onToggleFocus || onMove);
  const close = (restoreFocus = false) => {
    setPosition(null);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  };
  const getPosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect || !triggerRef.current?.getClientRects().length || rect.bottom < 0 || rect.top > window.innerHeight) return null;
    const width = 208, height = 8 + (2 + Number(showFocus) + Number(showMove)) * 44;
    return {
      left: Math.max(8, Math.min(ar ? rect.left : rect.right - width, window.innerWidth - width - 8)),
      top: rect.bottom + height + 8 <= window.innerHeight ? rect.bottom + 4 : Math.max(8, rect.top - height - 4),
    };
  };
  const open = () => setPosition(getPosition());
  useEffect(() => {
    if (!isOpen) return;
    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    const dismissOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) close();
    };
    const dismissOnMove = () => close();
    const followAnchor = () => setPosition(getPosition());
    document.addEventListener('pointerdown', dismissOutside);
    window.addEventListener('resize', dismissOnMove);
    window.addEventListener('scroll', followAnchor, true);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      window.removeEventListener('resize', dismissOnMove);
      window.removeEventListener('scroll', followAnchor, true);
    };
  }, [isOpen, ar, showFocus, showMove]);
  const itemClass = 'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-start text-xs font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none dark:text-zinc-200 dark:hover:bg-white/5 dark:focus:bg-white/5';
  return <div data-task-actions className="flex shrink-0">
    <div className="task-actions-desktop items-center gap-0.5 transition-opacity motion-reduce:transition-none">
      <button type="button" aria-label={editLabel} title={ar ? 'تعديل المهمة' : 'Edit task'} onClick={() => onEdit(task)} className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-emerald-400 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"><Pencil aria-hidden="true" className="h-3.5 w-3.5" /></button>
      <button type="button" aria-label={deleteLabel} title={ar ? 'حذف المهمة' : 'Delete task'} onClick={() => onDelete(task.id)} className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-rose-400 dark:text-zinc-400 dark:hover:bg-rose-400/10 dark:hover:text-rose-300"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" /></button>
    </div>
    <button ref={triggerRef} type="button" data-task-actions-trigger aria-label={ar ? `خيارات ${task.title || 'الساعة'}` : `Options for ${task.title || 'slot'}`} aria-haspopup="menu" aria-expanded={isOpen} aria-controls={isOpen ? menuId : undefined} onClick={() => isOpen ? close(true) : open()} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(); } }} className={`${enhanced ? 'task-actions-menu' : 'task-actions-mobile'} h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400 dark:text-zinc-400 dark:hover:bg-white/5`}><MoreHorizontal aria-hidden="true" className="h-4 w-4" /></button>
    {position && createPortal(<div ref={menuRef} id={menuId} role="menu" aria-label={ar ? 'خيارات المهمة' : 'Task options'} dir={ar ? 'rtl' : 'ltr'} style={position} className="fixed z-[100] w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-[#171a23]" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node) && event.relatedTarget !== triggerRef.current) close(); }} onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[next]?.focus({ preventScroll: true });
      }
    }}>
      <button type="button" role="menuitem" aria-label={editLabel} onClick={() => { close(); onEdit(task); }} className={itemClass}><Pencil aria-hidden="true" className="h-3.5 w-3.5" />{ar ? 'تعديل' : 'Edit'}</button>
      {showFocus && <button type="button" role="menuitem" onClick={() => { close(true); onToggleFocus?.(task.id); }} className={itemClass}>{task.isTopFocus ? <PinOff aria-hidden="true" className="h-3.5 w-3.5" /> : <Pin aria-hidden="true" className="h-3.5 w-3.5" />}{task.isTopFocus ? (ar ? 'إلغاء التثبيت' : 'Unpin task') : (ar ? 'تثبيت ضمن أهم 3' : 'Pin to top 3')}</button>}
      {showMove && <button type="button" role="menuitem" onClick={() => { close(true); onMove?.(task.id); }} className={itemClass}><CalendarArrowUp aria-hidden="true" className="h-3.5 w-3.5" />{ar ? 'نقل لليوم التالي' : 'Move to next day'}</button>}
      <button type="button" role="menuitem" aria-label={deleteLabel} onClick={() => { close(true); onDelete(task.id); }} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-start text-xs font-medium text-rose-600 hover:bg-rose-50 focus:bg-rose-50 focus:outline-none dark:text-rose-300 dark:hover:bg-rose-400/10 dark:focus:bg-rose-400/10"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" />{ar ? 'حذف' : 'Delete'}</button>
    </div>, document.body)}
  </div>;
}
