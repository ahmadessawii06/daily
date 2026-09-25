import React, { useState, useEffect } from 'react';
import {
  X,
  Languages,
  RotateCcw,
  ShieldCheck,
  Sun,
  Moon,
  LayoutTemplate,
  Database,
  RefreshCw,
  CheckCircle2,
  Cloud,
} from 'lucide-react';
import { Language, Theme } from '../types';
import { checkDbHealth, migrateLocalDataToMongo } from '../services/api';
import { getStoredHabits, loadAllDays } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onToggleLang: () => void;
  onResetData: () => void;
  onApply24HourTemplate?: () => void;
  theme: Theme;
  onSetTheme: (theme: Theme) => void;
  onSyncComplete?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onToggleLang,
  onResetData,
  onApply24HourTemplate,
  theme,
  onSetTheme,
  onSyncComplete,
}) => {
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    checking: boolean;
    database?: string;
    ipWhitelistNeeded?: boolean;
  }>({
    connected: false,
    checking: true,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDbStatus((prev) => ({ ...prev, checking: true }));
      checkDbHealth().then((res) => {
        setDbStatus({
          connected: res.connected,
          checking: false,
          database: res.database || 'MongoDB Atlas',
          ipWhitelistNeeded: res.ipWhitelistNeeded,
        });
      });
    }
  }, [isOpen]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const days = loadAllDays();
      const habits = getStoredHabits();
      const res = await migrateLocalDataToMongo(days, habits);
      if (res.success) {
        setSyncResult(
          lang === 'ar'
            ? `تمت المزامنة بنجاح وحفظ ${res.importedCount || 'جميع'} الأيام في MongoDB Atlas!`
            : `Synced successfully! Saved to MongoDB Atlas.`
        );
        if (onSyncComplete) onSyncComplete();
      } else {
        setSyncResult(lang === 'ar' ? 'تعذرت المزامنة' : 'Sync failed');
      }
    } catch {
      setSyncResult(lang === 'ar' ? 'حدث خطأ أثناء المزامنة' : 'Error during sync');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0d0e14] border border-slate-200 dark:border-white/[0.12] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden max-h-[90dvh] overflow-y-auto transition-colors"
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-[#10e588]" />

        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 end-4 sm:top-5 sm:end-5 p-2 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4 font-['Alexandria','Cairo']">
          {lang === 'ar' ? 'الإعدادات وقاعدة البيانات' : 'Settings & Database'}
        </h2>

        <div className="space-y-3.5">
          
          {/* MongoDB Atlas Status & Cloud Sync Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08] border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-['Alexandria']">
                      MongoDB Atlas Cloud
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        dbStatus.connected
                          ? 'bg-[#10e588]/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.connected ? 'bg-[#10e588] animate-pulse' : 'bg-amber-500'}`} />
                      <span>{dbStatus.connected ? (lang === 'ar' ? 'متصل' : 'Connected') : (lang === 'ar' ? 'جارٍ الاتصال...' : 'Connecting...')}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {lang === 'ar' ? 'قاعدة بيانات سحابية متصلة ومزامنة تلقائياً' : 'Automated Cloud Database Sync'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#10e588] hover:bg-[#0fd07b] text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-60 font-['Alexandria']"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? (lang === 'ar' ? 'جارٍ المزامنة...' : 'Syncing...') : (lang === 'ar' ? 'مزامنة السحابة الآن' : 'Sync to MongoDB Now')}</span>
              </button>

              <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                {lang === 'ar' ? 'Cluster: cluster0.09l0tvf' : 'Atlas Cluster Active'}
              </span>
            </div>

            {!dbStatus.connected && !dbStatus.checking && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-800 dark:text-amber-300 font-medium space-y-1">
                <p className="font-bold font-['Alexandria']">
                  {lang === 'ar' ? '💡 لتفعيل الاتصال السحابي المباشر:' : '💡 To activate direct MongoDB connection:'}
                </p>
                <p className="leading-relaxed text-[11px]">
                  {lang === 'ar'
                    ? 'في حساب MongoDB Atlas ⬅️ ادخل على Network Access ⬅️ اضغط Add IP Address ⬅️ واختر Allow Access from Anywhere (0.0.0.0/0).'
                    : 'In MongoDB Atlas -> Network Access -> Add IP Address -> Select Allow Access from Anywhere (0.0.0.0/0).'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 pt-0.5">
                  {lang === 'ar'
                    ? '🛡️ ملاحظة: بياناتك وجدول يوم السبت محفوظة محلياً وتعمل بدقة كاملة حتى بدون اتصال السحابة.'
                    : '🛡️ Note: All your schedule data is safely saved locally and fully functional.'}
                </p>
              </div>
            )}

            {syncResult && (
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 p-2 rounded-xl border border-emerald-500/20 animate-in fade-in">
                {syncResult}
              </div>
            )}
          </div>

          {/* Theme Selector (Dark / Light) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 font-['Alexandria']">
                {lang === 'ar' ? 'وضع المظهر' : 'Appearance'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                {theme === 'dark' ? (lang === 'ar' ? 'داكن' : 'Dark') : (lang === 'ar' ? 'فاتح' : 'Light')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Dark mode button */}
              <button
                type="button"
                onClick={() => onSetTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-950 text-white border-emerald-400 ring-2 ring-emerald-400/30 shadow-sm'
                    : 'bg-white dark:bg-white/[0.04] text-slate-700 dark:text-zinc-400 border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400 stroke-[2.5]" />
                <span>{lang === 'ar' ? 'الوضع الداكن' : 'Dark Mode'}</span>
              </button>

              {/* Light mode button */}
              <button
                type="button"
                onClick={() => onSetTheme('light')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-slate-950 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md font-extrabold'
                    : 'bg-white dark:bg-white/[0.04] text-slate-700 dark:text-zinc-400 border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
                <span>{lang === 'ar' ? 'الوضع الفاتح' : 'Light Mode'}</span>
              </button>
            </div>
          </div>
          
          {/* Language Selection */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/[0.06] text-slate-700 dark:text-white flex items-center justify-center">
                <Languages className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block font-['Alexandria']">
                  {lang === 'ar' ? 'لغة الواجهة' : 'App Language'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  {lang === 'ar' ? 'العربية (Alexandria Font)' : 'English (LTR)'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleLang}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-100 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.15] rounded-xl border border-slate-200 dark:border-white/[0.1] transition-all cursor-pointer shadow-2xs"
            >
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>

          {/* 24-Hour Schedule Template Option */}
          {onApply24HourTemplate && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <LayoutTemplate className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block font-['Alexandria']">
                    {lang === 'ar' ? 'قالب الـ 24 ساعة' : '24-Hour Template'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                    {lang === 'ar' ? 'تجهيز كامل ساعات اليوم (00:00 - 23:00)' : 'Setup all 24 hours of today'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onApply24HourTemplate();
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 bg-emerald-100 dark:bg-emerald-500/15 hover:bg-emerald-200 dark:hover:bg-emerald-500/25 rounded-xl border border-emerald-300 dark:border-emerald-500/30 transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'تطبيق' : 'Apply'}
              </button>
            </div>
          )}

          {/* Reset Seed Schedule */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block font-['Alexandria']">
                  {lang === 'ar' ? 'تصفير شامل للبيانات' : 'Reset All Data'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  {lang === 'ar' ? 'البدء من السبت 26 سبتمبر بنسبة 0%' : 'Start clean from Saturday 26 (0%)'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onResetData();
                onClose();
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 bg-rose-100 dark:bg-rose-500/15 hover:bg-rose-200 dark:hover:bg-rose-500/25 rounded-xl border border-rose-300 dark:border-rose-500/30 transition-all cursor-pointer shadow-2xs"
            >
              {lang === 'ar' ? 'تصفير الآن' : 'Reset Now'}
            </button>
          </div>

        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-white/[0.08] text-center">
          <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono font-medium">
            Daily • Powered by MongoDB Atlas
          </p>
        </div>

      </div>
    </div>
  );
};
