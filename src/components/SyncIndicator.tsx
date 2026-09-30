import React, { useState, useEffect } from 'react';
import { Cloud, CloudCheck, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
import { subscribeToSyncStatus, triggerSync, SyncStatusInfo } from '../services/syncEngine';
import { Language } from '../types';

interface SyncIndicatorProps {
  lang: Language;
  userId?: string;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ lang, userId }) => {
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
    triggerSync(userId || 'active_user', true);
  };

  const getStatusDisplay = () => {
    switch (syncInfo.status) {
      case 'syncing':
      case 'saving':
        return {
          text: lang === 'ar' ? 'جارٍ المزامنة...' : 'Syncing...',
          icon: RefreshCw,
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/25',
          iconClass: 'animate-spin text-amber-500',
          dot: 'bg-amber-400',
        };
      case 'offline':
        return {
          text: lang === 'ar' ? 'وضع عدم الاتصال' : 'Offline Mode',
          icon: CloudOff,
          color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
          iconClass: 'text-zinc-400',
          dot: 'bg-zinc-400',
        };
      case 'error':
        return {
          text: lang === 'ar' ? 'إعادة المحاولة' : 'Retry Sync',
          icon: AlertCircle,
          color: 'text-rose-500 bg-rose-500/10 border-rose-500/25',
          iconClass: 'text-rose-500',
          dot: 'bg-rose-500',
        };
      case 'synced':
      default:
        return {
          text: lang === 'ar' ? 'محفوظ سحابياً' : 'Saved',
          icon: CloudCheck,
          color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          iconClass: 'text-emerald-500',
          dot: 'bg-emerald-500',
        };
    }
  };

  const current = getStatusDisplay();
  const Icon = current.icon;

  return (
    <button
      type="button"
      onClick={handleManualSync}
      title={
        lang === 'ar'
          ? `حالة المزامنة: ${current.text} ${syncInfo.pendingCount > 0 ? `(${syncInfo.pendingCount} معلقة)` : ''} - انقر للمزامنة الفورية`
          : `Sync Status: ${current.text} - Click to sync now`
      }
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer select-none active:scale-95 ${current.color}`}
    >
      <span className={`w-2 h-2 rounded-full ${current.dot} shrink-0`} />
      <Icon className={`w-3.5 h-3.5 shrink-0 ${current.iconClass || ''}`} />
      <span className="hidden sm:inline font-['Alexandria']">{current.text}</span>
      {syncInfo.pendingCount > 0 && (
        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
          {syncInfo.pendingCount}
        </span>
      )}
    </button>
  );
};
