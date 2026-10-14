import React, { useState, useRef, useEffect, useId } from 'react';
import { Plus, Sun, Moon, Camera, Power, LogOut, Settings, BarChart3, Archive, KeyRound, Copy, Check } from 'lucide-react';
import { Language, Theme, User } from '../types';
import { formatHeaderDate } from '../utils/date';
import { SyncIndicator } from './SyncIndicator';

interface MainHeaderProps {
  currentDate: string;
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
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

const toolButton = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100/70 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500';
const accountAction = 'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-500';

export const MainHeader: React.FC<MainHeaderProps> = ({
  currentDate, currentUser, onLogout, onOpenAddTask, onOpenExportModal,
  onOpenSettings, onOpenStats, onOpenArchive, archiveDaysCount, lang, theme, onToggleTheme, onOpenAdmin,
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
    <header className="relative flex flex-col gap-4 border-b border-slate-200/80 pb-4 transition-colors dark:border-white/[0.08]">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-100/70 px-3 text-xs font-bold text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#10e588]" />
            <span>{ar ? 'ميزان' : 'Mizan'}</span>
          </div>
          <SyncIndicator lang={lang} userId={currentUser?.id} />
        </div>

        <div role="group" aria-label={ar ? 'أدوات اليوم' : 'Day tools'} className="ms-auto flex shrink-0 items-center gap-1.5">
          {currentUser && (
            <div className="relative" ref={profileMenuRef}>
              <button ref={profileButtonRef} type="button" onClick={() => setIsProfileMenuOpen(open => !open)} aria-label={ar ? 'قائمة الحساب' : 'Account menu'} aria-expanded={isProfileMenuOpen} aria-controls={profilePanelId} title={accountName} className={`relative flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-400/15 ${isProfileMenuOpen ? 'border-emerald-500/50 bg-emerald-100 dark:bg-emerald-400/15' : 'border-emerald-500/25 bg-emerald-50 dark:border-emerald-400/25 dark:bg-emerald-400/10'}`}>
                <span aria-hidden="true">{avatarLetter}</span>
                <span aria-hidden="true" className="absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-50 dark:ring-[#07080b]" />
              </button>

              {isProfileMenuOpen && (
                <div id={profilePanelId} className="absolute start-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/[0.1] dark:bg-[#141820] sm:start-auto sm:end-0">
                  <div className="mb-2 border-b border-slate-100 px-3 py-3 dark:border-white/[0.06]">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white"><bdi>{accountName}</bdi></p>
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
                  {onOpenAdmin && <button type="button" onClick={() => openFromAccount(onOpenAdmin)} className={accountAction}><KeyRound aria-hidden="true" className="h-4 w-4 text-emerald-500" /><span>{ar ? 'إدارة المستخدمين' : 'User management'}</span></button>}
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
          {currentUser && onLogout && (
            <button type="button" onClick={onLogout} aria-label={ar ? 'تسجيل الخروج' : 'Log out'} title={ar ? 'تسجيل الخروج' : 'Log out'} className={`${toolButton} hover:border-rose-500/25 hover:text-rose-600 dark:hover:text-rose-400`}>
              <Power className="h-4 w-4" strokeWidth={1.8} />
            </button>
          )}
          <button type="button" onClick={onOpenSettings} aria-label={ar ? 'الإعدادات والخيارات' : 'Settings'} title={ar ? 'الإعدادات' : 'Settings'} className={toolButton}>
            <Settings className="h-4 w-4" strokeWidth={1.8} />
          </button>
          <button type="button" onClick={onToggleTheme} aria-label={theme === 'dark' ? (ar ? 'التبديل للوضع الفاتح' : 'Switch to light theme') : (ar ? 'التبديل للوضع الداكن' : 'Switch to dark theme')} title={theme === 'dark' ? (ar ? 'الوضع الفاتح' : 'Light theme') : (ar ? 'الوضع الداكن' : 'Dark theme')} className={toolButton}>
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" strokeWidth={1.8} /> : <Moon className="h-4 w-4" strokeWidth={1.8} />}
          </button>
          <button type="button" onClick={onOpenExportModal} aria-label={ar ? 'تصدير جدول اليوم كصورة' : 'Export schedule as image'} title={ar ? 'تصدير صورة' : 'Export image'} className={toolButton}>
            <Camera className="h-4 w-4" strokeWidth={1.8} />
          </button>
          <button type="button" onClick={onOpenAddTask} aria-label={ar ? 'إضافة مهمة جديدة' : 'Add new task'} title={ar ? 'إضافة مهمة جديدة (N)' : 'Add task (N)'} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#10e588] text-emerald-950 transition-colors hover:bg-[#0fd07b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <h1 className="text-xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-2xl md:text-3xl">
        <time dateTime={currentDate}>{formatHeaderDate(currentDate, lang)}</time>
      </h1>
    </header>
  );
};
