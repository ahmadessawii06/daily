import React, { useEffect } from 'react';
import { 
  X, 
  Calendar, 
  History, 
  SlidersHorizontal, 
  CheckCircle2, 
  Sparkles, 
  Sun, 
  Moon 
} from 'lucide-react';
import { Language, Theme } from '../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'daily' | 'archive';
  onTabChange: (tab: 'daily' | 'archive') => void;
  todayTasksCount: number;
  archiveDaysCount: number;
  onOpenSettings: () => void;
  lang: Language;
  theme: Theme;
  onToggleTheme: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  todayTasksCount,
  archiveDaysCount,
  onOpenSettings,
  lang,
  theme,
  onToggleTheme,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Slide-over panel */}
      <div 
        className={`fixed inset-y-0 ${
          lang === 'ar' ? 'end-0' : 'start-0'
        } w-72 max-w-[85vw] bg-white dark:bg-[#0c0e14] border-s border-slate-200 dark:border-white/[0.1] p-5 shadow-2xl flex flex-col justify-between z-10 animate-in ${
          lang === 'ar' ? 'slide-in-from-right' : 'slide-in-from-left'
        } duration-200 transition-colors`}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 stroke-[2.8]" />
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight font-['Alexandria']">
                  Daily
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                  {lang === 'ar' ? 'إدارة المهام اليومية' : 'Daily Task Manager'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <button
              type="button"
              onClick={() => {
                onTabChange('daily');
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 stroke-[2.5]" />
                <span className="font-['Alexandria']">{lang === 'ar' ? 'مهام اليوم' : 'Today’s Tasks'}</span>
              </div>
              {todayTasksCount > 0 && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                  {todayTasksCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onTabChange('archive');
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'archive'
                  ? 'bg-slate-100 dark:bg-white/[0.12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/[0.2] shadow-xs'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3">
                <History className="w-4 h-4 stroke-[2.5]" />
                <span className="font-['Alexandria']">{lang === 'ar' ? 'سجل الأرشيف' : 'Archive History'}</span>
              </div>
              {archiveDaysCount > 0 && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950">
                  {archiveDaysCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Options */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/[0.08] space-y-2">
          
          {/* Quick theme toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500 stroke-[2.5]" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
              )}
              <span className="font-['Alexandria']">
                {theme === 'dark' ? (lang === 'ar' ? 'الوضع الفاتح' : 'Light Mode') : (lang === 'ar' ? 'الوضع الداكن' : 'Dark Mode')}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400 font-bold uppercase">
              {theme}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
            <span className="font-['Alexandria']">{lang === 'ar' ? 'الإعدادات والخيارات' : 'Settings & Options'}</span>
          </button>

          <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
            <span>Daily Mobile</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>{lang === 'ar' ? 'حفظ تلقائي' : 'Saved'}</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
