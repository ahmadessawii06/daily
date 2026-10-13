import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, Clock, X, StickyNote } from 'lucide-react';
import { Language, Task, TaskStatus } from '../types';
import { formatTime12h } from '../utils/date';
import { getTaskContextIcon } from '../utils/taskIconHelper';
import { nextTaskStatus } from '../utils/taskStatus';
import { TaskStatusIndicator } from './TaskStatusIndicator';
import { TaskActions } from './TaskActions';

interface TaskRowProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onUpdateTitle?: (taskId: string, newTitle: string) => void;
  lang: Language;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onEnterNext?: () => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  onUpdateTitle,
  lang,
  isEditing = false,
  onStartEdit,
  onEnterNext,
}) => {
  const [statusMenuPosition, setStatusMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const statusTriggerRef = useRef<HTMLButtonElement | null>(null);
  const openStatusMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    statusTriggerRef.current = event.currentTarget;
    setStatusMenuPosition({ left: Math.max(8, Math.min(event.clientX, window.innerWidth - 160)), top: Math.max(8, Math.min(event.clientY, window.innerHeight - 160)) });
  };
  const handleStatusKeys = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!event.shiftKey || event.key !== 'F10') return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    statusTriggerRef.current = event.currentTarget;
    setStatusMenuPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 160)), top: Math.max(8, Math.min(rect.bottom, window.innerHeight - 160)) });
  };
  useEffect(() => {
    if (!statusMenuPosition) return;
    statusMenuRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    const dismiss = () => setStatusMenuPosition(null);
    const outside = (event: PointerEvent) => { if (!statusMenuRef.current?.contains(event.target as Node)) dismiss(); };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { dismiss(); statusTriggerRef.current?.focus({ preventScroll: true }); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', dismiss, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('scroll', dismiss, true);
    };
  }, [statusMenuPosition]);
  const [inlineTitle, setInlineTitle] = useState(task.title || '');
  const [isEditingInline, setIsEditingInline] = useState(isEditing);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  // Sync internal editing state with prop
  useEffect(() => {
    setIsEditingInline(isEditing);
  }, [isEditing]);

  // Sync internal title with task prop updates only when not editing inline
  useEffect(() => {
    if (!isEditingInline) {
      setInlineTitle(task.title || '');
    }
  }, [task.title, isEditingInline]);

  useEffect(() => {
    if (!isEditingInline) return;
    const focusVisibleInput = () => {
      const inputs = [mobileInputRef.current, desktopInputRef.current];
      const active = document.activeElement;
      if (active !== document.body && !inputs.includes(active as HTMLInputElement)) return;
      const input = inputs.find(element => element && element.getClientRects().length > 0);
      if (input && active !== input) {
        input.focus();
        input.select();
      }
    };
    focusVisibleInput();
    window.addEventListener('resize', focusVisibleInput);
    return () => window.removeEventListener('resize', focusVisibleInput);
  }, [isEditingInline]);

  // 12-hour formatted time (with صباحًا / مساءً)
  const t12 = formatTime12h(task.time, lang);
  const effectiveTitle = isEditingInline ? inlineTitle : (task.title || '');
  const isEmptySlot = !effectiveTitle || effectiveTitle.trim() === '';

  // Smart context icon helper based on task keywords in Arabic and English
  const currentTitleForIcon = isEditingInline ? inlineTitle : task.title;
  const contextIconData = getTaskContextIcon(currentTitleForIcon);
  const ContextIcon = contextIconData.icon;

  // Keep the row neutral; communicate status through the indicator and title tone.
  const statusConfig = isEmptySlot
    ? {
        label: lang === 'ar' ? 'ساعة متاحة' : 'Open Slot',
        rowClass: 
          'bg-slate-50/40 hover:bg-slate-50 border-dashed border-slate-200/80 hover:border-slate-300 dark:bg-white/[0.01] dark:hover:bg-white/[0.03] dark:border-white/[0.06] dark:hover:border-white/[0.12]',
        titleClass: 'text-slate-400 dark:text-zinc-500 font-normal',
        timeClass: 'text-slate-600 dark:text-zinc-400 bg-slate-100/70 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/[0.06]',
      }
    : {
        done: {
          label: lang === 'ar' ? 'مكتملة' : 'Done',
          rowClass: 
            'bg-white hover:bg-slate-50/70 border-slate-200/70 dark:bg-[#11131a] dark:hover:bg-[#141720] dark:border-white/[0.06]',
          titleClass: 'text-slate-500 dark:text-zinc-400 font-medium',
          timeClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
        },
        pending: {
          label: '',
          rowClass: 
            'bg-white hover:bg-slate-50/70 border-slate-200/70 dark:bg-[#11131a] dark:hover:bg-[#141720] dark:border-white/[0.06]',
          titleClass: 'text-slate-900 dark:text-zinc-100 font-bold',
          timeClass: 'text-slate-600 dark:text-zinc-400 bg-slate-100/70 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/[0.06]',
        },
        'not-done': {
          label: lang === 'ar' ? 'غير منجزة' : 'Not Done',
          rowClass: 
            'bg-white hover:bg-slate-50/70 border-slate-200/70 dark:bg-[#11131a] dark:hover:bg-[#141720] dark:border-white/[0.06]',
          titleClass: 'text-slate-900 dark:text-zinc-100 font-bold',
          timeClass: 'text-rose-700 dark:text-rose-300 bg-rose-50/60 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
        },
      }[task.status];

  // Quick cycle between the 3 status states
  const handleCycleStatus = () => {
    onStatusChange(task.id, nextTaskStatus(task.status));
  };

  const isCommittingRef = useRef(false);

  const handleCommitTitle = (advanceToNext = false) => {
    if (isCommittingRef.current) return;
    isCommittingRef.current = true;

    const trimmed = inlineTitle.trim();
    if (trimmed !== (task.title || '').trim()) {
      if (onUpdateTitle) {
        onUpdateTitle(task.id, trimmed);
      }
    }

    setIsEditingInline(false);

    if (advanceToNext && onEnterNext) {
      onEnterNext();
    }

    setTimeout(() => {
      isCommittingRef.current = false;
    }, 80);
  };

  return (
    <>
    <div className={`task-row group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3.5 px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl border transition-all duration-200 overflow-hidden ${statusConfig.rowClass}`}>
      
      {/* ============================================================ */}
      {/* 1. MOBILE VIEW (< sm): 2-Tier Layout so titles NEVER cut off */}
      {/* ============================================================ */}
      <div className="flex sm:hidden flex-col gap-2 w-full">
        
        {/* Mobile top bar: status and time, with a compact actions menu */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-black/[0.04] dark:border-white/[0.05]">
          
          {/* Start: Tactile Checkbox + 12h Time Badge */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCycleStatus}
              onContextMenu={openStatusMenu}
              onKeyDown={handleStatusKeys}
              aria-label={`${lang === 'ar' ? 'تغيير حالة' : 'Change status of'} ${task.title || task.time}: ${task.status === 'pending' ? (lang === 'ar' ? 'متبقية' : 'Remaining') : statusConfig.label}`}
              title={lang === 'ar' ? 'انقر لتغيير حالة المهمة' : 'Click to toggle status'}
              className="group/status w-9 h-9 rounded-lg flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              <TaskStatusIndicator status={task.status} isEmptySlot={isEmptySlot} />
            </button>

            <div className={`font-numbers text-xs font-black tabular-nums shrink-0 px-2 py-1 rounded-xl border flex items-center gap-1.5 shadow-2xs ${statusConfig.timeClass}`}>
              <Clock className="w-3.5 h-3.5 opacity-75 shrink-0" />
              <span className="font-extrabold tracking-wide">{task.time ? t12.time12 : (lang === 'ar' ? 'بدون وقت' : 'Unscheduled')}</span>
              {task.time && <span className={`text-[10px] font-['Alexandria'] font-extrabold px-1.5 py-0.5 rounded-md ${
                t12.isPM 
                  ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30' 
                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
              }`}>
                {t12.period}
              </span>}
            </div>
          </div>

          <TaskActions task={task} lang={lang} onEdit={onEdit} onDelete={onDelete} />

        </div>

        {/* Mobile Main Body: Context Icon + Task Title (FULL WIDTH, NEVER CUT OFF!) + Notes */}
        <div className="w-full pt-0.5">
          {isEmptySlot || isEditingInline ? (
            <div className="flex items-center gap-2 w-full">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${contextIconData.bgClass}`}>
                <ContextIcon className={`w-3.5 h-3.5 ${contextIconData.iconClass}`} />
              </div>

              <input
                ref={mobileInputRef}
                type="text"
                value={inlineTitle}
                onChange={(e) => setInlineTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCommitTitle(true);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsEditingInline(false);
                    setInlineTitle(task.title || '');
                  }
                }}
                onBlur={() => {
                  handleCommitTitle(false);
                }}
                placeholder={lang === 'ar' ? '+ اكتب اسم المهمة هنا واضغط Enter...' : '+ Write task name and press Enter...'}
                className="task-input w-full border border-slate-300 dark:border-white/[0.15] focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3 py-2 text-base font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none transition-all shadow-2xs min-h-[40px]"
              />
              {inlineTitle.trim() && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur before click
                    handleCommitTitle(false);
                  }}
                  className="px-3 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-xs cursor-pointer shrink-0 min-h-[40px] flex items-center justify-center active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              )}
            </div>
          ) : (
            <div 
              onClick={() => {
                if (onStartEdit) onStartEdit();
                else setIsEditingInline(true);
              }}
              className="flex items-start gap-2.5 w-full cursor-pointer group/title py-0.5"
              title={lang === 'ar' ? 'انقر لتعديل اسم المهمة سريعًا' : 'Click to quickly rename'}
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover/title:scale-105 shadow-2xs ${contextIconData.bgClass}`}>
                <ContextIcon className={`w-3.5 h-3.5 ${contextIconData.iconClass}`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold select-text font-['Alexandria'] leading-relaxed break-words group-hover/title:underline decoration-emerald-500/50 decoration-2 ${statusConfig.titleClass}`}>
                  {task.title}
                </p>

                {task.notes && (
                  <div className="mt-1">
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(task);
                      }}
                      title={task.notes}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-300 font-semibold bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-md cursor-pointer hover:opacity-80 transition-opacity max-w-full break-words"
                    >
                      <StickyNote className="w-3 h-3 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span className="break-words">{task.notes}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ============================================================ */}
      {/* 2. TABLET / IPAD / DESKTOP VIEW (sm: and up): Single Sleek Row */}
      {/* ============================================================ */}
      <div className="hidden sm:flex items-center gap-3 min-w-0 flex-1">
        
        {/* Tactile Action Trigger */}
        <button
          type="button"
          onClick={handleCycleStatus}
          onContextMenu={openStatusMenu}
          onKeyDown={handleStatusKeys}
          aria-label={`${lang === 'ar' ? 'تغيير حالة' : 'Change status of'} ${task.title || task.time}: ${task.status === 'pending' ? (lang === 'ar' ? 'متبقية' : 'Remaining') : statusConfig.label}`}
          title={lang === 'ar' ? 'انقر لتغيير حالة المهمة' : 'Click to toggle status'}
          className="group/status w-9 h-9 rounded-lg flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-400"
        >
          <TaskStatusIndicator status={task.status} isEmptySlot={isEmptySlot} />
        </button>

        {/* 12-Hour Time Badge */}
        <div className={`font-numbers text-xs font-black tabular-nums shrink-0 px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shadow-2xs ${statusConfig.timeClass}`}>
          <Clock className="w-3.5 h-3.5 opacity-75 shrink-0" />
          <span className="font-extrabold tracking-wide">{task.time ? t12.time12 : (lang === 'ar' ? 'بدون وقت' : 'Unscheduled')}</span>
          {task.time && <span className={`text-[11px] font-['Alexandria'] font-extrabold px-1.5 py-0.5 rounded-md ${
            t12.isPM 
              ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30' 
              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
          }`}>
            {t12.period}
          </span>}
        </div>

        {/* Title & Notes / Direct In-place Input */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          {isEmptySlot || isEditingInline ? (
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${contextIconData.bgClass}`}>
                <ContextIcon className={`w-3.5 h-3.5 ${contextIconData.iconClass}`} />
              </div>

              <input
                ref={desktopInputRef}
                type="text"
                value={inlineTitle}
                onChange={(e) => setInlineTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCommitTitle(true);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsEditingInline(false);
                    setInlineTitle(task.title || '');
                  }
                }}
                onBlur={() => {
                  handleCommitTitle(false);
                }}
                placeholder={lang === 'ar' ? '+ اكتب اسم المهمة هنا واضغط Enter...' : '+ Write task name and press Enter...'}
                className="task-input w-full border border-slate-300 dark:border-white/[0.15] focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3 py-1.5 text-sm font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none transition-all shadow-2xs min-h-[36px]"
              />
              {inlineTitle.trim() && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCommitTitle(false);
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-xs cursor-pointer shrink-0 min-h-[36px] flex items-center justify-center"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              )}
            </div>
          ) : (
            <div 
              onClick={() => {
                if (onStartEdit) onStartEdit();
                else setIsEditingInline(true);
              }}
              className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group/title py-0.5"
              title={lang === 'ar' ? 'انقر لتعديل اسم المهمة سريعًا' : 'Click to quickly rename'}
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover/title:scale-105 shadow-2xs ${contextIconData.bgClass}`}>
                <ContextIcon className={`w-3.5 h-3.5 ${contextIconData.iconClass}`} />
              </div>

              <span className={`text-sm truncate select-text font-['Alexandria'] group-hover/title:underline decoration-emerald-500/50 decoration-2 ${statusConfig.titleClass}`}>
                {task.title}
              </span>
            </div>
          )}

          {task.notes && (
            <span 
              onClick={() => onEdit(task)}
              title={task.notes}
              className="inline-flex items-center gap-1 text-[11px] text-amber-900 dark:text-amber-300 font-semibold bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 px-1.5 py-0.5 rounded shrink-0 max-w-[180px] truncate cursor-pointer hover:opacity-80 transition-opacity"
            >
              <StickyNote className="w-3 h-3 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate">{task.notes}</span>
            </span>
          )}
        </div>

      </div>

      <div className="hidden sm:flex shrink-0">
        <TaskActions task={task} lang={lang} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
      {statusMenuPosition && createPortal(
        <div ref={statusMenuRef} style={statusMenuPosition} dir={lang === 'ar' ? 'rtl' : 'ltr'} role="group" aria-label={lang === 'ar' ? 'حالة المهمة' : 'Task status'}
          className="fixed z-[100] w-36 bg-white dark:bg-[#13151f] border border-slate-200 dark:border-white/[0.15] rounded-xl p-1.5 shadow-2xl text-xs space-y-1 backdrop-blur-xl"
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setStatusMenuPosition(null); }}
        >
          <button
            type="button"
            onClick={() => {
              onStatusChange(task.id, 'done');
              setStatusMenuPosition(null);
              statusTriggerRef.current?.focus();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-500/20"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>{lang === 'ar' ? 'مكتملة' : 'Done'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onStatusChange(task.id, 'not-done');
              setStatusMenuPosition(null);
              statusTriggerRef.current?.focus();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-800 dark:text-rose-300 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/20"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
            <span>{lang === 'ar' ? 'غير منجزة' : 'Not Done'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onStatusChange(task.id, 'pending');
              setStatusMenuPosition(null);
              statusTriggerRef.current?.focus();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <span>{lang === 'ar' ? 'بدون حالة' : 'No status'}</span>
          </button>
        </div>
      , document.body)}
    </>
  );
};
