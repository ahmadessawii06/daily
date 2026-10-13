import React, { useState, useRef, useEffect, useId } from 'react';
import { Plus, Sun, Moon, Camera, LogOut, Settings, BarChart3, Archive, KeyRound, Copy, Check, Scale, ChevronDown } from 'lucide-react';
import { Language, Theme, User } from '../types';
import { formatHeaderDate } from '../utils/date';
import { SyncIndicator } from './SyncIndicator';

interface MainHeaderProps {
  currentDate: string;
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenAddTask: () => void;
  onOpenExportModal: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenArchive: () => void;
  archiveDaysCount: number;
  lang: Language;
  theme: Theme;
  onToggleTheme: () => void;
}

const toolButton = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500';
const accountAction = 'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-500';

export const MainHeader: React.FC<MainHeaderProps> = ({
  currentDate, currentUser, onLogout, onOpenAddTask, onOpenExportModal,
  onOpenSettings, onOpenStats, onOpenArchive, archiveDaysCount, lang, theme, onToggleTheme,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profilePanelId = useId();
  const ar = lang === 'ar';
  const accountName = currentUser?.name || currentUser?.username || (ar ? 'مستخدم ميزان' : 'Mizan user');
  const avatarLetter = accountName.trim().charAt(0).toUpperCase() || 'M';

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopiedCode(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setIsCopiedCode(false), 2000);
    } catch { /* Leave the selectable code available if clipboard access fails. */ }
  };

  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); }, []);

  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handlePointer = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setIsProfileMenuOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
        profileButtonRef.current?.focus();
      }
    };
    const handleFocus = (event: FocusEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setIsProfileMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    document.addEventListener('focusin', handleFocus);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('focusin', handleFocus);
    };
  }, [isProfileMenuOpen]);

  const openFromAccount = (action: () => void) => {
    setIsProfileMenuOpen(false);
    action();
  };

  return (
    <header className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-5 transition-colors dark:border-white/[0.08]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 rounded-3xl border border-slate-200/80 bg-white/90 p-3 shadow-xs dark:border-white/[0.08] dark:bg-[#101318]/90 sm:p-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <div aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
            <Scale className="h-6 w-6" strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">{ar ? 'ميزان' : 'Mizan'}</span>
              {ar && <span className="text-[9px] font-semibold tracking-[0.2em] text-slate-400 dark:text-zinc-500" dir="ltr">MIZAN</span>}
            </div>
            <SyncIndicator lang={lang} userId={currentUser?.id} variant="quiet" />
          </div>
        </div>

        <div className="order-3 col-span-2 flex items-center justify-between gap-2 md:order-2 md:col-span-1 md:justify-end">
          <button type="button" onClick={onOpenAddTask} aria-label={ar ? 'إضافة مهمة جديدة' : 'Add new task'} title={ar ? 'إضافة مهمة جديدة (N)' : 'Add task (N)'} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#10e588] px-3 text-xs font-bold text-emerald-950 transition-colors hover:bg-[#0fd07b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:px-4">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>{ar ? 'مهمة جديدة' : 'New task'}</span>
          </button>
          <div role="group" aria-label={ar ? 'أدوات اليوم' : 'Day tools'} className="flex shrink-0 items-center rounded-2xl border border-slate-200/70 bg-slate-50 p-0.5 dark:border-white/[0.05] dark:bg-white/[0.025]">
            <button type="button" onClick={onOpenExportModal} aria-label={ar ? 'تصدير جدول اليوم كصورة' : 'Export schedule as image'} title={ar ? 'تصدير صورة' : 'Export image'} className={toolButton}>
              <Camera className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <button type="button" onClick={onOpenSettings} aria-label={ar ? 'الإعدادات والخيارات' : 'Settings'} title={ar ? 'الإعدادات' : 'Settings'} className={toolButton}>
              <Settings className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <button type="button" onClick={onToggleTheme} aria-label={theme === 'dark' ? (ar ? 'التبديل للوضع الفاتح' : 'Switch to light theme') : (ar ? 'التبديل للوضع الداكن' : 'Switch to dark theme')} title={theme === 'dark' ? (ar ? 'الوضع الفاتح' : 'Light theme') : (ar ? 'الوضع الداكن' : 'Dark theme')} className={toolButton}>
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-300" strokeWidth={1.8} /> : <Moon className="h-4 w-4" strokeWidth={1.8} />}
            </button>
          </div>
        </div>

        {currentUser && (
          <div className="relative order-2 md:order-3" ref={profileMenuRef}>
            <button ref={profileButtonRef} type="button" onClick={() => setIsProfileMenuOpen(open => !open)} aria-label={ar ? 'قائمة الحساب' : 'Account menu'} aria-expanded={isProfileMenuOpen} aria-controls={profilePanelId} title={accountName} className={`flex min-h-11 items-center gap-2.5 rounded-2xl p-1.5 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-zinc-300 dark:hover:bg-white/[0.05] ${isProfileMenuOpen ? 'bg-slate-100 dark:bg-white/[0.05]' : ''}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 ring-1 ring-slate-200/80 dark:bg-[#222a2d] dark:text-emerald-200 dark:ring-white/[0.08]" aria-hidden="true">{avatarLetter}</span>
              <span className="hidden max-w-28 truncate text-xs font-semibold lg:block"><bdi>{accountName}</bdi></span>
              <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileMenuOpen && (
              <div id={profilePanelId} className="absolute end-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/[0.1] dark:bg-[#141820]">
                <div className="mb-2 border-b border-slate-100 px-3 py-3 dark:border-white/[0.06]">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white"><bdi>{accountName}</bdi></p>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-zinc-400">{ar ? 'مساحتك اليومية في ميزان' : 'Your daily space in Mizan'}</p>
                  {currentUser.userCode && (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-white/[0.04]">
                      <div className="flex min-w-0 items-center gap-2 text-xs text-slate-600 dark:text-zinc-300">
                        <KeyRound aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate font-mono" dir="ltr">{currentUser.userCode}</span>
                      </div>
                      <button type="button" onClick={() => handleCopyCode(currentUser.userCode)} title={ar ? 'نسخ كود الحساب' : 'Copy account code'} className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-400/10">
                        {isCopiedCode ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : <Copy aria-hidden="true" className="h-3.5 w-3.5" />}
                        <span aria-live="polite">{isCopiedCode ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'نسخ' : 'Copy')}</span>
                      </button>
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => openFromAccount(onOpenStats)} className={accountAction}>
                  <BarChart3 aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" />
                  <span>{ar ? 'الإحصائيات والتقرير الأسبوعي' : 'Weekly statistics'}</span>
                </button>
                <button type="button" onClick={() => openFromAccount(onOpenArchive)} className={accountAction}>
                  <Archive aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" />
                  <span className="flex-1">{ar ? 'الأرشيف وسجل الأيام' : 'Archive & history'}</span>
                  <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[10px] tabular-nums text-slate-500 dark:bg-white/[0.05] dark:text-zinc-400">{archiveDaysCount}</span>
                </button>
                <button type="button" onClick={() => openFromAccount(onOpenSettings)} className={accountAction}>
                  <Settings aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" />
                  <span>{ar ? 'الإعدادات والخيارات' : 'Settings'}</span>
                </button>
                {onLogout && (
                  <div className="mt-2 border-t border-slate-100 pt-2 dark:border-white/[0.06]">
                    <button type="button" onClick={() => openFromAccount(onLogout)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-xs font-medium text-rose-600 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-500 dark:text-rose-400 dark:hover:bg-rose-400/10">
                      <LogOut aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                      <span>{ar ? 'تسجيل الخروج' : 'Log out'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <h1 className="text-xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-2xl md:text-3xl">
        <time dateTime={currentDate}>{formatHeaderDate(currentDate, lang)}</time>
      </h1>
    </header>
  );
};
