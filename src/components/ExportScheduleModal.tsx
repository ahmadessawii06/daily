import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Palette, 
  Layers, 
  Calendar, 
  CheckCheck, 
  Clock, 
  XCircle, 
  Image as ImageIcon,
  Sun,
  Moon,
  Sparkles,
  Columns2,
  List
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { exportDailyTrackToImage, copyDailyTrackToClipboard } from '../utils/exportDailyTrack';
import { DayStats, Language, Task } from '../types';
import { formatHeaderDate, formatTime12h } from '../utils/date';

interface ExportScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  date: string;
  stats: DayStats;
  dayNote?: string;
  lang: Language;
}

type ExportTheme = 'dark' | 'light' | 'emerald';
type ExportScope = 'all' | 'scheduled';
type ExportLayout = 'columns' | 'list';

export const ExportScheduleModal: React.FC<ExportScheduleModalProps> = ({
  isOpen,
  onClose,
  tasks,
  date,
  stats,
  dayNote,
  lang,
}) => {
  const [exportTheme, setExportTheme] = useState<ExportTheme>('dark');
  const [exportScope, setExportScope] = useState<ExportScope>('all');
  const [exportLayout, setExportLayout] = useState<ExportLayout>('list');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Directly capture the rendered preview card
  const previewCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Filter tasks based on scope
  const filteredTasks = exportScope === 'scheduled'
    ? tasks.filter((t) => t.title && t.title.trim().length > 0)
    : tasks;

  // Split tasks into Morning (00:00 - 11:59) and Evening (12:00 - 23:59) for 2-column timetable
  const morningTasks = filteredTasks.filter((t) => {
    const hour = parseInt(t.time.split(':')[0] || '0', 10);
    return hour < 12;
  });

  const eveningTasks = filteredTasks.filter((t) => {
    const hour = parseInt(t.time.split(':')[0] || '0', 10);
    return hour >= 12;
  });

  // Calculate stats for the export card
  const scheduledCount = tasks.filter((t) => t.title && t.title.trim().length > 0).length;
  const cardStats = {
    total: scheduledCount > 0 ? scheduledCount : tasks.length,
    done: stats.done,
    pending: stats.pending,
    notDone: stats.notDone,
    percentage: stats.completionPercentage,
  };

  // Download Image
  const handleDownload = async () => {
    try {
      setIsExporting(true);
      await exportDailyTrackToImage({
        element: previewCardRef.current || document.getElementById('daily-track-container'),
        fileName: `Daily-Track-${date}.png`,
        theme: exportTheme === 'light' ? 'light' : 'dark',
      });
      onClose();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopy = async () => {
    try {
      setIsExporting(true);
      const success = await copyDailyTrackToClipboard({
        element: previewCardRef.current || document.getElementById('daily-track-container'),
        theme: exportTheme === 'light' ? 'light' : 'dark',
      });

      if (success) {
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
      } else {
        await handleDownload();
      }
    } catch (err) {
      console.error('Copy failed:', err);
      await handleDownload();
    } finally {
      setIsExporting(false);
    }
  };

  const headerDateStr = formatHeaderDate(date, lang);

  // Theme palettes
  const themeStyles = {
    dark: {
      cardBg: 'bg-[#090b12] text-zinc-100 border border-white/[0.12]',
      headerBg: 'bg-gradient-to-b from-[#141824] to-[#0c0e18] border-b border-white/[0.08]',
      columnHeaderBg: 'bg-white/[0.04] border border-white/[0.08] text-zinc-300',
      itemBgEmpty: 'bg-white/[0.02] border-white/[0.06] text-zinc-400',
      itemBgDone: 'bg-emerald-950/40 border-emerald-500/35 text-emerald-200',
      itemBgPending: 'bg-white/[0.03] border-white/[0.08] text-zinc-100',
      itemBgNotDone: 'bg-rose-950/35 border-rose-500/35 text-rose-200',
      accentDone: 'bg-emerald-400',
      accentPending: 'bg-transparent',
      accentNotDone: 'bg-rose-400',
      accentEmpty: 'bg-white/10',
      badgeBg: 'bg-black/40 border border-white/10 text-zinc-200',
      footerBg: 'bg-[#06080d] border-t border-white/[0.08] text-zinc-500',
      statusDoneBadge: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40',
      statusPendingBadge: 'hidden',
      statusNotDoneBadge: 'text-rose-300 bg-rose-500/20 border-rose-500/40',
    },
    light: {
      cardBg: 'bg-[#f8fafc] text-slate-900 border border-slate-300 shadow-xl',
      headerBg: 'bg-gradient-to-b from-white to-slate-100 border-b border-slate-200',
      columnHeaderBg: 'bg-slate-200/80 border border-slate-300 text-slate-800',
      itemBgEmpty: 'bg-white border-slate-200 text-slate-400',
      itemBgDone: 'bg-emerald-50 border-emerald-300 text-emerald-950',
      itemBgPending: 'bg-white border-slate-200 text-slate-900',
      itemBgNotDone: 'bg-rose-50 border-rose-300 text-rose-950',
      accentDone: 'bg-emerald-500',
      accentPending: 'bg-transparent',
      accentNotDone: 'bg-rose-500',
      accentEmpty: 'bg-slate-300',
      badgeBg: 'bg-slate-200/80 border border-slate-300 text-slate-800',
      footerBg: 'bg-slate-100 border-t border-slate-200 text-slate-500',
      statusDoneBadge: 'text-emerald-900 bg-emerald-100 border-emerald-300',
      statusPendingBadge: 'hidden',
      statusNotDoneBadge: 'text-rose-900 bg-rose-100 border-rose-300',
    },
    emerald: {
      cardBg: 'bg-[#04120e] text-emerald-50 border border-emerald-500/30',
      headerBg: 'bg-gradient-to-b from-[#0a231b] to-[#051611] border-b border-emerald-500/25',
      columnHeaderBg: 'bg-emerald-950/60 border border-emerald-500/20 text-emerald-300',
      itemBgEmpty: 'bg-emerald-950/20 border-emerald-500/10 text-emerald-600',
      itemBgDone: 'bg-emerald-900/40 border-emerald-400/40 text-emerald-200',
      itemBgPending: 'bg-emerald-950/30 border-emerald-500/20 text-emerald-100',
      itemBgNotDone: 'bg-rose-950/40 border-rose-500/40 text-rose-200',
      accentDone: 'bg-emerald-400',
      accentPending: 'bg-transparent',
      accentNotDone: 'bg-rose-400',
      accentEmpty: 'bg-emerald-800/30',
      badgeBg: 'bg-emerald-950/80 border border-emerald-500/25 text-emerald-300',
      footerBg: 'bg-[#020b08] border-t border-emerald-500/20 text-emerald-600',
      statusDoneBadge: 'text-emerald-200 bg-emerald-900/50 border-emerald-400/50',
      statusPendingBadge: 'hidden',
      statusNotDoneBadge: 'text-rose-200 bg-rose-950/50 border-rose-500/40',
    },
  }[exportTheme];

  // Helper renderer for a single task row item
  const renderItemRow = (t: Task) => {
    const isEmpty = !t.title || t.title.trim() === '';
    const t12 = formatTime12h(t.time, lang);

    const rowClass = isEmpty
      ? themeStyles.itemBgEmpty
      : t.status === 'done'
      ? themeStyles.itemBgDone
      : t.status === 'pending'
      ? themeStyles.itemBgPending
      : themeStyles.itemBgNotDone;

    const stripClass = isEmpty
      ? themeStyles.accentEmpty
      : t.status === 'done'
      ? themeStyles.accentDone
      : t.status === 'pending'
      ? themeStyles.accentPending
      : themeStyles.accentNotDone;

    return (
      <div
        key={t.id}
        className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs gap-2 transition-all ${rowClass}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Vertical accent color strip */}
          <div className={`w-1 self-stretch rounded-full shrink-0 ${stripClass}`} />

          {/* Time Badge (12-hour AM/PM) */}
          <div className={`font-mono font-bold text-[11px] tabular-nums shrink-0 px-2 py-0.5 rounded-md flex items-center gap-1 ${themeStyles.badgeBg}`}>
            <span>{t12.time12}</span>
            <span className="text-[10px] font-['Alexandria']">{t12.periodShort}</span>
          </div>

          {/* Task Title */}
          <span
            className={`font-['Alexandria'] font-bold truncate ${
              isEmpty
                ? 'opacity-40 font-normal italic'
                : t.status === 'done'
                ? 'line-through opacity-75'
                : ''
            }`}
          >
            {isEmpty ? (lang === 'ar' ? 'ساعة فارغة' : 'Empty slot') : t.title}
          </span>
        </div>

        {/* Status Badge: Exact identical font & styling to website (Alexandria font) */}
        <div className="shrink-0 flex items-center">
          {isEmpty || t.status === 'pending' ? null : t.status === 'done' ? (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-['Alexandria'] font-extrabold border transition-all ${themeStyles.statusDoneBadge}`}>
              <span className="font-black text-xs">✓</span>
              <span>{lang === 'ar' ? 'مكتملة' : 'Done'}</span>
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-['Alexandria'] font-extrabold border transition-all ${themeStyles.statusNotDoneBadge}`}>
              <span className="font-black text-xs">✕</span>
              <span>{lang === 'ar' ? 'غير منجزة' : 'Not Done'}</span>
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 font-['Alexandria','Cairo',sans-serif]">
      
      {/* Main Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0e1017] border border-slate-200 dark:border-white/[0.1] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92dvh]">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
                {lang === 'ar' ? 'تصدير جدول اليوم كصورة فائقة الجودة' : 'Export Daily Schedule as Image'}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400">
                {lang === 'ar' ? 'تصميم متوازن بدون قص لكامل ساعات اليوم بدقة 4K' : 'Balanced full 24-hour design, never cut off'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Modal Controls Toolbar (Theme, Scope, Layout) */}
        <div className="p-3 sm:p-4 bg-slate-100/80 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.08] shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Theme Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1 font-['Alexandria']">
                <Palette className="w-3.5 h-3.5 text-emerald-500" />
                <span>{lang === 'ar' ? 'المظهر:' : 'Theme:'}</span>
              </span>
              <div className="flex items-center p-1 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/[0.1] rounded-xl font-bold shadow-2xs font-['Alexandria']">
                <button
                  type="button"
                  onClick={() => setExportTheme('dark')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    exportTheme === 'dark' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs' : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {lang === 'ar' ? 'داكن' : 'Dark'}
                </button>
                <button
                  type="button"
                  onClick={() => setExportTheme('light')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    exportTheme === 'light' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs' : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {lang === 'ar' ? 'فاتح' : 'Light'}
                </button>
                <button
                  type="button"
                  onClick={() => setExportTheme('emerald')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    exportTheme === 'emerald' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {lang === 'ar' ? 'زمردي' : 'Emerald'}
                </button>
              </div>
            </div>

            {/* Layout Selector: 2-Columns vs Single List */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1 font-['Alexandria']">
                <span>{lang === 'ar' ? 'التخطيط:' : 'Layout:'}</span>
              </span>
              <div className="flex items-center p-1 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/[0.1] rounded-xl font-bold shadow-2xs font-['Alexandria']">
                <button
                  type="button"
                  onClick={() => setExportLayout('columns')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    exportLayout === 'columns' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-zinc-400'
                  }`}
                  title="عمودين: صباحاً ومساءً (أفضل تصميم متوازن لليوم الكامل)"
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'عمودين (صباحاً ومساءً)' : '2 Columns'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportLayout('list')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    exportLayout === 'list' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'قائمة واحدة' : 'List'}</span>
                </button>
              </div>
            </div>

            {/* Scope Selector: All 24h vs Scheduled */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1 font-['Alexandria']">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                <span>{lang === 'ar' ? 'المحتوى:' : 'Scope:'}</span>
              </span>
              <div className="flex items-center p-1 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/[0.1] rounded-xl font-bold shadow-2xs font-['Alexandria']">
                <button
                  type="button"
                  onClick={() => {
                    setExportScope('all');
                    setExportLayout('columns');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    exportScope === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {lang === 'ar' ? 'كامل الـ 24 ساعة' : 'All 24h'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportScope('scheduled');
                    setExportLayout('list');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    exportScope === 'scheduled' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {lang === 'ar' ? 'المحددة فقط' : 'Scheduled'}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Live On-Screen Preview Area (Scrollable within modal, pristine render target) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60 dark:bg-black/70 flex justify-center">
          
          {/* 
            TARGET CONTAINER FOR CAPTURE:
            Rendered in full natural height, no artificial clipping or hidden bounds.
          */}
          <div
            ref={previewCardRef}
            dir="rtl"
            className={`w-full max-w-2xl rounded-3xl overflow-hidden font-['Alexandria','Cairo',sans-serif] shadow-2xl ${themeStyles.cardBg}`}
            style={{ boxSizing: 'border-box' }}
          >
            {/* Poster Header */}
            <div className={`p-6 sm:p-7 ${themeStyles.headerBg}`}>
              {/* Top Badges */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-extrabold text-sm shadow-sm">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-mono font-black tracking-wider uppercase opacity-90 block">
                      {lang === 'ar' ? 'مسار اليوم · DAILY TRACK' : 'DAILY TRACK SCHEDULE'}
                    </span>
                    <span className="text-[10px] opacity-60 font-['Alexandria']">
                      {lang === 'ar' ? 'جدول المهام اليومية' : 'Personal Daily Agenda'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-black/15 dark:bg-white/10 border border-white/15">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono">{date}</span>
                </div>
              </div>

              {/* Date Title */}
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-['Alexandria']">
                {headerDateStr}
              </h2>

              {dayNote && (
                <p className="text-xs opacity-80 mt-1.5 font-medium italic font-['Alexandria']">
                  "{dayNote}"
                </p>
              )}

              {/* Progress Metrics & Status Bar */}
              <div className="mt-5 pt-4 border-t border-white/10 space-y-3 font-['Alexandria']">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{lang === 'ar' ? 'نسبة الإنجاز اليومي:' : 'Daily Completion:'}</span>
                  <span dir="ltr" className="font-['Alexandria'] text-emerald-400 font-extrabold text-sm">
                    {cardStats.percentage}% ({cardStats.done} / {cardStats.total})
                  </span>
                </div>

                <div className="w-full bg-black/25 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 rounded-full transition-all"
                    style={{ width: `${cardStats.percentage}%` }}
                  />
                </div>

                {/* Quick Counter Chips */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-center text-xs font-['Alexandria'] font-bold">
                  <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl py-1.5 px-2 text-emerald-400 flex items-center justify-center gap-1.5">
                    <CheckCheck className="w-4 h-4 stroke-[3]" />
                    <span>{cardStats.done} {lang === 'ar' ? 'مكتملة' : 'Done'}</span>
                  </div>
                  <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl py-1.5 px-2 text-rose-300 flex items-center justify-center gap-1.5">
                    <XCircle className="w-4 h-4 stroke-[2.8]" />
                    <span>{cardStats.notDone} {lang === 'ar' ? 'غير منجزة' : 'Not Done'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Body: 2-Column Balanced Timetable or Single List */}
            <div className="p-5 sm:p-6">
              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center opacity-60 text-xs font-medium font-['Alexandria']">
                  {lang === 'ar' ? 'لا توجد مهام محددة لليوم' : 'No tasks scheduled'}
                </div>
              ) : exportLayout === 'columns' ? (
                /* 2 COLUMNS: Morning (right) & Evening (left) */
                <div className="grid grid-cols-2 gap-3.5">
                  
                  {/* Morning Column (12:00 ص - 11:00 ص) */}
                  <div className="space-y-2">
                    <div className={`flex items-center justify-between px-3 py-1.5 rounded-xl font-bold text-xs font-['Alexandria'] ${themeStyles.columnHeaderBg}`}>
                      <div className="flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span>{lang === 'ar' ? 'الفترة الصباحية' : 'Morning'}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-70">12:00 ص - 11:00 ص</span>
                    </div>

                    <div className="space-y-1.5">
                      {morningTasks.map(renderItemRow)}
                    </div>
                  </div>

                  {/* Evening Column (12:00 م - 11:00 م) */}
                  <div className="space-y-2">
                    <div className={`flex items-center justify-between px-3 py-1.5 rounded-xl font-bold text-xs font-['Alexandria'] ${themeStyles.columnHeaderBg}`}>
                      <div className="flex items-center gap-1.5">
                        <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{lang === 'ar' ? 'الفترة المسائية' : 'Evening'}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-70">12:00 م - 11:00 م</span>
                    </div>

                    <div className="space-y-1.5">
                      {eveningTasks.map(renderItemRow)}
                    </div>
                  </div>

                </div>
              ) : (
                /* Single Column List */
                <div className="space-y-1.5">
                  {filteredTasks.map(renderItemRow)}
                </div>
              )}
            </div>

            {/* Poster Footer Watermark */}
            <div className={`px-6 py-3.5 flex items-center justify-between text-[11px] font-medium opacity-70 ${themeStyles.footerBg}`}>
              <div className="flex items-center gap-2 font-['Alexandria']">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'ar' ? 'مسار اليوم · Daily Track' : 'Daily Track Routine'}</span>
              </div>
              <span className="font-mono text-[10px] opacity-80">
                {new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Actions */}
        <div className="p-4 sm:p-5 bg-white dark:bg-[#0c0d13] border-t border-slate-200 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          <div className="text-xs text-slate-500 dark:text-zinc-400 hidden sm:block font-['Alexandria']">
            {lang === 'ar' 
              ? '✨ يتم تصدير الصورة بدقة عالية مع كافة الساعات الـ 24 وبخط الموقع الأصلي.' 
              : '✨ Ultra-sharp 4K export with full 24 hours intact and original fonts.'}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto font-['Alexandria']">
            <button
              type="button"
              onClick={handleCopy}
              disabled={isExporting}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.15] bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-800 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer min-h-[42px] shadow-2xs"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                  <span className="text-emerald-600 dark:text-emerald-400">{lang === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 stroke-[2.2]" />
                  <span>{lang === 'ar' ? 'نسخ الصورة' : 'Copy'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 hover:from-emerald-300 hover:to-teal-200 transition-all shadow-lg shadow-emerald-500/20 active:scale-98 cursor-pointer min-h-[42px]"
            >
              <Download className="w-4 h-4 stroke-[2.8]" />
              <span>
                {isExporting 
                  ? (lang === 'ar' ? 'جارٍ استخراج الصورة...' : 'Generating image...') 
                  : (lang === 'ar' ? 'تحميل الصورة كاملة (PNG)' : 'Download Full PNG')}
              </span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
