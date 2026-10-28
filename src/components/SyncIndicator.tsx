import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { syncHelp } from '../utils/syncHelp';
import { CloudCheck, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
import { subscribeToSyncStatus, triggerSync, SyncStatusInfo } from '../services/syncEngine';
import { Language } from '../types';
import { Tooltip } from './Tooltip';

interface SyncIndicatorProps {
  lang: Language;
  userId?: string;
  interactive?: boolean;
  compact?: boolean;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ lang, userId, interactive = true, compact = false }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (detailsOpen) dialog.current?.showModal(); }, [detailsOpen]);
  const [syncInfo, setSyncInfo] = useState<SyncStatusInfo>({
    status: navigator.onLine ? 'synced' : 'offline',
    pendingCount: 0,
    lastSyncedAt: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeToSyncStatus((info) => {
      setSyncInfo(info);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = () => {
    triggerSync(userId, true);
  };

  const getStatusDisplay = () => {
    switch (syncInfo.status) {
      case 'syncing':
      case 'saving':
        return {
          text: lang === 'ar' ? 'جارٍ المزامنة...' : 'Syncing...',
          icon: RefreshCw,
          color: 'text-amber-800 dark:text-amber-400 bg-white/85 dark:bg-amber-500/10 border-amber-500/30 dark:border-amber-500/25 shadow-xs backdrop-blur-md',
          iconClass: 'animate-spin text-amber-600 dark:text-amber-500',
          dot: 'bg-amber-500',
        };
      case 'offline':
        return {
          text: lang === 'ar' ? 'وضع عدم الاتصال' : 'Offline Mode',
          icon: CloudOff,
          color: 'text-zinc-800 dark:text-zinc-400 bg-white/85 dark:bg-zinc-500/10 border-zinc-300 dark:border-zinc-500/20 shadow-xs backdrop-blur-md',
          iconClass: 'text-zinc-600 dark:text-zinc-400',
          dot: 'bg-zinc-400',
        };
      case 'warning':
        return {
          text: lang === 'ar' ? 'تمت المزامنة، راجع الصور' : 'Synced — check photos',
          icon: AlertCircle,
          color: 'text-amber-800 dark:text-amber-400 bg-white/85 dark:bg-amber-500/10 border-amber-500/30 dark:border-amber-500/25 shadow-xs backdrop-blur-md',
          iconClass: 'text-amber-600 dark:text-amber-500',
          dot: 'bg-amber-500',
        };
      case 'error':
        return {
          text: lang === 'ar' ? 'تعذرت المزامنة' : 'Sync failed',
          icon: AlertCircle,
          color: 'text-rose-800 dark:text-rose-400 bg-white/85 dark:bg-rose-500/10 border-rose-500/30 dark:border-rose-500/25 shadow-xs backdrop-blur-md',
          iconClass: 'text-rose-600 dark:text-rose-500',
          dot: 'bg-rose-500',
        };
      case 'synced':
      default:
        return {
          text: lang === 'ar' ? 'تمت المزامنة' : 'Synced',
          icon: CloudCheck,
          color: 'text-emerald-800 dark:text-emerald-400 bg-white/85 dark:bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/20 shadow-xs backdrop-blur-md',
          iconClass: 'text-emerald-600 dark:text-emerald-500',
          dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
        };
    }
  };

  const current = getStatusDisplay();
  const Icon = current.icon;
  const label = lang === 'ar'
    ? `حالة المزامنة: ${current.text}${syncInfo.pendingCount > 0 ? ` (${syncInfo.pendingCount} معلقة)` : ''}${interactive ? ' — انقر للمزامنة الفورية' : ''}`
    : `Sync status: ${current.text}${syncInfo.pendingCount > 0 ? ` (${syncInfo.pendingCount} pending)` : ''}${interactive ? ' — Click to sync now' : ''}`;

  const content = <>
      <span className={`w-2 h-2 rounded-full ${current.dot} shrink-0`} />
      <Icon aria-hidden="true" strokeWidth={1.8} className={`w-3.5 h-3.5 shrink-0 ${current.iconClass || ''}`} />
      <span className={compact ? 'hidden sm:inline' : undefined}>{current.text}</span>
      {syncInfo.pendingCount > 0 && (
        <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
          {syncInfo.pendingCount}
        </span>
      )}
    </>;
  const classes = `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-semibold select-none ${current.color}`;
  const failed = syncInfo.status === 'error' || syncInfo.status === 'offline' || syncInfo.status === 'warning';
  const actionLabel = syncInfo.status === 'warning' ? (lang === 'ar' ? 'تمت مزامنة اليوم — عرض تنبيه الصور' : 'Day synced — view photo warning') : failed ? (lang === 'ar' ? 'تعذرت المزامنة — عرض السبب والحلول' : 'Sync failed — view cause and solutions') : label;
  const tooltipText = interactive ? actionLabel : label;
  return <>{interactive
    ? <Tooltip text={tooltipText}><button type="button" onClick={() => failed ? setDetailsOpen(true) : handleManualSync()} aria-label={actionLabel} className={`${classes} cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500`}>{content}</button></Tooltip>
    : <Tooltip text={tooltipText}><div role="status" aria-label={label} className={classes}>{content}</div></Tooltip>
    }{detailsOpen && createPortal(<dialog ref={dialog} onCancel={() => setDetailsOpen(false)} onClose={() => setDetailsOpen(false)} aria-labelledby="sync-details-title" dir={lang === 'ar' ? 'rtl' : 'ltr'} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-rose-500/20 bg-white p-6 text-slate-800 shadow-xl backdrop:bg-black/50 dark:bg-zinc-900 dark:text-zinc-100">
      <h2 id="sync-details-title" className="font-bold">{syncInfo.status === 'warning' ? (lang === 'ar' ? 'تمت مزامنة اليوم مع تنبيه' : 'Day synced with a warning') : (lang === 'ar' ? 'سبب تعذر المزامنة' : 'Why sync failed')}</h2>
      <p role="status" className="mt-3 text-sm leading-7">{syncHelp(syncInfo.errorMessage, lang)}</p>
      {syncInfo.errorMessage && <p className="mt-3 break-words rounded-lg bg-rose-500/10 p-3 text-xs" dir="auto">{syncInfo.errorMessage}</p>}
      <p className="mt-3 text-xs">{lang === 'ar' ? `تعديلات معلقة: ${syncInfo.pendingCount}` : `Pending changes: ${syncInfo.pendingCount}`}</p>
      <div className="mt-5 flex gap-3"><button type="button" disabled={syncInfo.status === 'syncing'} onClick={() => { void triggerSync(userId, true).then(ok => { if (ok) setDetailsOpen(false); }); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50">{lang === 'ar' ? 'إعادة المحاولة' : 'Retry sync'}</button><button type="button" onClick={() => setDetailsOpen(false)} className="rounded-lg border px-4 py-2 text-sm">{lang === 'ar' ? 'إغلاق' : 'Close'}</button></div>
    </dialog>, document.body)}</>;
};
