import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Clock, 
  X, 
  Edit3, 
  Trash2, 
  StickyNote, 
  Flame, 
  Sparkles, 
  BookOpen, 
  Briefcase, 
  CheckSquare2,
  Plus
} from 'lucide-react';
import { Language, Task, TaskStatus } from '../types';
import { formatTime12h } from '../utils/date';
import { getTaskContextIcon } from '../utils/taskIconHelper';

interface TaskRowProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onUpdateTitle?: (taskId: string, newTitle: string) => void;
  lang: Language;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  onUpdateTitle,
  lang,
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [inlineTitle, setInlineTitle] = useState(task.title || '');
  const [isEditingInline, setIsEditingInline] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal title with task prop updates
  useEffect(() => {
    setInlineTitle(task.title || '');
  }, [task.title]);

  useEffect(() => {
    if (isEditingInline && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingInline]);

  // 12-hour formatted time (with صباحًا / مساءً)
  const t12 = formatTime12h(task.time, lang);
  const isEmptySlot = !task.title || task.title.trim() === '';

  // Smart context icon helper based on task keywords in Arabic and English
  const currentTitleForIcon = isEditingInline ? inlineTitle : task.title;
  const contextIconData = getTaskContextIcon(currentTitleForIcon);
  const ContextIcon = contextIconData.icon;

  // Status visual configuration: Row coloring + Badges + Side accent strip
  const statusConfig = isEmptySlot
    ? {
        label: lang === 'ar' ? 'ساعة متاحة' : 'Open Slot',
        shortLabel: lang === 'ar' ? 'متاح' : 'Open',
        symbol: '+',
        rowClass: 
          'bg-slate-50/70 hover:bg-slate-100/90 border-dashed border-slate-300/80 hover:border-slate-400 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] dark:border-white/[0.12] dark:hover:border-white/[0.22]',
        accentStrip: 'bg-slate-300 dark:bg-white/20',
        triggerBg: 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20',
        badgeClass: 'text-slate-600 bg-slate-100 border-slate-200 dark:text-zinc-400 dark:bg-white/[0.05] dark:border-white/[0.1]',
        titleClass: 'text-slate-400 dark:text-zinc-500 font-normal',
        timeClass: 'text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-white/[0.06] border-slate-200 dark:border-white/[0.1]',
      }
    : {
        done: {
          label: lang === 'ar' ? 'مكتملة' : 'Done',
          shortLabel: lang === 'ar' ? 'تم' : 'Done',
          symbol: '✓',
          rowClass: 
            'bg-emerald-500/[0.08] hover:bg-emerald-500/[0.13] border-emerald-500/30 hover:border-emerald-500/50 shadow-xs shadow-emerald-500/5 dark:bg-emerald-950/25 dark:hover:bg-emerald-950/40 dark:border-emerald-500/35 dark:hover:border-emerald-400/50 dark:shadow-emerald-950/40',
          accentStrip: 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
          triggerBg: 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/40 shadow-sm',
          badgeClass: 'text-emerald-900 bg-emerald-100 border-emerald-300 hover:bg-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:hover:bg-emerald-500/30 shadow-2xs',
          titleClass: 'line-through text-slate-500 dark:text-zinc-500 font-medium',
          timeClass: 'text-emerald-900 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
        },
        pending: {
          label: '',
          shortLabel: '',
          symbol: '',
          rowClass: 
            'bg-white hover:bg-slate-50/90 border-slate-200/90 hover:border-slate-300 shadow-2xs dark:bg-[#11131a] dark:hover:bg-[#151822] dark:border-white/[0.08] dark:hover:border-white/[0.15]',
          accentStrip: 'bg-transparent',
          triggerBg: 'border-2 border-slate-300 dark:border-white/25 hover:border-emerald-500 text-transparent hover:text-emerald-600 dark:hover:border-emerald-400 dark:hover:text-emerald-400 bg-slate-50/60 dark:bg-white/[0.03]',
          badgeClass: '',
          titleClass: 'text-slate-900 dark:text-zinc-100 font-bold',
          timeClass: 'text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-white/[0.06] border-slate-200 dark:border-white/[0.1]',
        },
        'not-done': {
          label: lang === 'ar' ? 'غير منجزة' : 'Not Done',
          shortLabel: lang === 'ar' ? 'لم تنجز' : 'Not Done',
          symbol: '✕',
          rowClass: 
            'bg-rose-500/[0.08] hover:bg-rose-500/[0.13] border-rose-500/30 hover:border-rose-500/50 shadow-xs shadow-rose-500/5 dark:bg-rose-950/25 dark:hover:bg-rose-950/40 dark:border-rose-500/35 dark:hover:border-rose-400/50 dark:shadow-rose-950/40',
          accentStrip: 'bg-rose-500 dark:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
          triggerBg: 'bg-rose-500 text-white ring-2 ring-rose-500/40 shadow-sm',
          badgeClass: 'text-rose-900 bg-rose-100 border-rose-300 hover:bg-rose-200 dark:text-rose-300 dark:bg-rose-500/20 dark:border-rose-500/40 dark:hover:bg-rose-500/30 shadow-2xs',
          titleClass: 'text-rose-900 dark:text-rose-200 font-bold',
          timeClass: 'text-rose-900 dark:text-rose-300 bg-rose-500/10 border-rose-500/25',
        },
      }[task.status];

  // Quick cycle between the 3 status states
  const handleCycleStatus = () => {
    const cycleMap: Record<TaskStatus, TaskStatus> = {
      pending: 'done',
      done: 'not-done',
      'not-done': 'pending',
    };
    onStatusChange(task.id, cycleMap[task.status]);
  };

  const handleCommitTitle = () => {
    const trimmed = inlineTitle.trim();
    if (trimmed !== (task.title || '').trim()) {
      if (onUpdateTitle) {
        onUpdateTitle(task.id, trimmed);
      }
    }
    setIsEditingInline(false);
  };

  return (
    <div className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3.5 px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl border transition-all duration-200 overflow-hidden ${statusConfig.rowClass}`}>
      
      {/* ============================================================ */}
      {/* 1. MOBILE VIEW (< sm): 2-Tier Layout so titles NEVER cut off */}
      {/* ============================================================ */}
      <div className="flex sm:hidden flex-col gap-2 w-full">
        
        {/* Mobile Top Bar: Checkbox + Time Badge on start, Status & Actions on end */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-black/[0.04] dark:border-white/[0.05]">
          
          {/* Start: Tactile Checkbox + 12h Time Badge */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCycleStatus}
              title={lang === 'ar' ? 'انقر لتغيير حالة المهمة' : 'Click to toggle status'}
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer active:scale-90 ${statusConfig.triggerBg}`}
            >
              {isEmptySlot ? (
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : task.status === 'done' ? (
                <Check className="w-3.5 h-3.5 stroke-[3.5]" />
              ) : task.status === 'not-done' ? (
                <X className="w-3.5 h-3.5 stroke-[3.5]" />
              ) : (
                <Check className="w-3 h-3 stroke-[2.5] opacity-0 group-hover:opacity-40 transition-opacity text-slate-500 dark:text-zinc-400" />
              )}
            </button>

            <div className={`font-numbers text-xs font-black tabular-nums shrink-0 px-2 py-1 rounded-xl border flex items-center gap-1.5 shadow-2xs ${statusConfig.timeClass}`}>
              <Clock className="w-3.5 h-3.5 opacity-75 shrink-0" />
              <span className="font-extrabold tracking-wide">{t12.time12}</span>
              <span className={`text-[10px] font-['Alexandria'] font-extrabold px-1.5 py-0.5 rounded-md ${
                t12.isPM 
                  ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30' 
                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
              }`}>
                {t12.period}
              </span>
            </div>
          </div>

          {/* End: Status Badge (Done/Not Done) + Edit & Delete Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(!isEmptySlot && task.status !== 'pending') && (
              <button
                type="button"
                onClick={handleCycleStatus}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer min-h-[30px] active:scale-95 ${statusConfig.badgeClass}`}
              >
                <span className="font-black text-xs">{statusConfig.symbol}</span>
                <span>{statusConfig.label}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(task)}
              title={lang === 'ar' ? 'تعديل المهمة والملاحظات' : 'Edit task details'}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(task.id)}
              title={isEmptySlot ? (lang === 'ar' ? 'حذف هذه الساعة' : 'Delete slot') : (lang === 'ar' ? 'حذف / تفريغ المهمة' : 'Clear / Delete')}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>

        </div>

        {/* Mobile Main Body: Context Icon + Task Title (FULL WIDTH, NEVER CUT OFF!) + Notes */}
        <div className="w-full pt-0.5">
          {isEmptySlot || isEditingInline ? (
            <div className="flex items-center gap-2 w-full">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${contextIconData.bgClass}`}>
                <ContextIcon className={`w-3.5 h-3.5 ${contextIconData.iconClass}`} />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={inlineTitle}
                onChange={(e) => setInlineTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCommitTitle();
                  } else if (e.key === 'Escape') {
                    setIsEditingInline(false);
                    setInlineTitle(task.title || '');
                  }
                }}
                onBlur={handleCommitTitle}
                placeholder={lang === 'ar' ? '+ اكتب اسم المهمة هنا واضغط Enter...' : '+ Write task name and press Enter...'}
                className="w-full bg-white dark:bg-[#0b0d13] border border-slate-300 dark:border-white/[0.15] focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3 py-2 text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none transition-all shadow-2xs min-h-[40px]"
              />
              {inlineTitle.trim() && (
                <button
                  type="button"
                  onClick={handleCommitTitle}
                  className="px-3 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-xs cursor-pointer shrink-0 min-h-[40px] flex items-center justify-center active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              )}
            </div>
          ) : (
            <div 
              onClick={() => setIsEditingInline(true)}
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
          title={lang === 'ar' ? 'انقر لتغيير حالة المهمة' : 'Click to toggle status'}
          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer active:scale-90 ${statusConfig.triggerBg}`}
        >
          {isEmptySlot ? (
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : task.status === 'done' ? (
            <Check className="w-3.5 h-3.5 stroke-[3.5]" />
          ) : task.status === 'not-done' ? (
            <X className="w-3.5 h-3.5 stroke-[3.5]" />
          ) : (
            <Check className="w-3 h-3 stroke-[2.5] opacity-0 group-hover:opacity-40 transition-opacity text-slate-500 dark:text-zinc-400" />
          )}
        </button>

        {/* 12-Hour Time Badge */}
        <div className={`font-numbers text-xs font-black tabular-nums shrink-0 px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shadow-2xs ${statusConfig.timeClass}`}>
          <Clock className="w-3.5 h-3.5 opacity-75 shrink-0" />
          <span className="font-extrabold tracking-wide">{t12.time12}</span>
          <span className={`text-[11px] font-['Alexandria'] font-extrabold px-1.5 py-0.5 rounded-md ${
            t12.isPM 
              ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30' 
              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
          }`}>
            {t12.period}
          </span>
        </div>

        {/* Title & Notes / Direct In-place Input */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          {isEmptySlot || isEditingInline ? (
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${contextIconData.bgClass}`}>
                <ContextIcon className={`w-3.5 h-3.5 ${contextIconData.iconClass}`} />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={inlineTitle}
                onChange={(e) => setInlineTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCommitTitle();
                  } else if (e.key === 'Escape') {
                    setIsEditingInline(false);
                    setInlineTitle(task.title || '');
                  }
                }}
                onBlur={handleCommitTitle}
                placeholder={lang === 'ar' ? '+ اكتب اسم المهمة هنا واضغط Enter...' : '+ Write task name and press Enter...'}
                className="w-full bg-white dark:bg-[#0b0d13] border border-slate-300 dark:border-white/[0.15] focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none transition-all shadow-2xs min-h-[36px]"
              />
              {inlineTitle.trim() && (
                <button
                  type="button"
                  onClick={handleCommitTitle}
                  className="px-2.5 py-1 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-xs cursor-pointer shrink-0 min-h-[36px] flex items-center justify-center"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              )}
            </div>
          ) : (
            <div 
              onClick={() => setIsEditingInline(true)}
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

      {/* Desktop/Tablet Right Side Actions */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        {(!isEmptySlot && task.status !== 'pending') ? (
          <div className="relative">
            <button
              type="button"
              onClick={handleCycleStatus}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowStatusMenu(!showStatusMenu);
              }}
              title={lang === 'ar' ? 'انقر للتبديل، أو زر يمين للقائمة' : 'Click to cycle, right click for menu'}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer min-h-[30px] active:scale-95 ${statusConfig.badgeClass}`}
            >
              <span className="font-black text-xs">{statusConfig.symbol}</span>
              <span>{statusConfig.label}</span>
            </button>

            {/* Quick status selector */}
            {showStatusMenu && (
              <div 
                className="absolute end-0 top-full mt-2 z-40 w-36 bg-white dark:bg-[#13151f] border border-slate-200 dark:border-white/[0.15] rounded-xl p-1.5 shadow-2xl text-xs space-y-1 backdrop-blur-xl"
                onMouseLeave={() => setShowStatusMenu(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    onStatusChange(task.id, 'done');
                    setShowStatusMenu(false);
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
                    setShowStatusMenu(false);
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
                    setShowStatusMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <span>{lang === 'ar' ? 'بدون حالة' : 'No status'}</span>
                </button>
              </div>
            )}
          </div>
        ) : isEmptySlot ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all min-h-[30px] opacity-60">
            <span>{statusConfig.symbol}</span>
            <span>{statusConfig.label}</span>
          </div>
        ) : null}

        {/* Actions (Edit / Delete) - ALWAYS VISIBLE */}
        <div className="flex items-center gap-1">
          {/* Edit icon button */}
          <button
            type="button"
            onClick={() => onEdit(task)}
            title={lang === 'ar' ? 'تعديل المهمة والملاحظات' : 'Edit task details'}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer min-w-[30px] min-h-[30px] flex items-center justify-center active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
          
          {/* Delete icon button */}
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            title={isEmptySlot ? (lang === 'ar' ? 'حذف هذه الساعة' : 'Delete slot') : (lang === 'ar' ? 'حذف / تفريغ المهمة' : 'Clear / Delete')}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors cursor-pointer min-w-[30px] min-h-[30px] flex items-center justify-center active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>

      </div>

    </div>
  );
};
