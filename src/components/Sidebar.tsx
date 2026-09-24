import React from 'react';
import { 
  CheckCircle2, 
  Calendar, 
  History, 
  SlidersHorizontal, 
  Sparkles,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { Language, Theme } from '../types';

interface SidebarProps {
  activeTab: 'daily' | 'archive';
  onTabChange: (tab: 'daily' | 'archive') => void;
  todayTasksCount: number;
  archiveDaysCount: number;
  onOpenSettings: () => void;
  lang: Language;
  theme: Theme;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  todayTasksCount,
  archiveDaysCount,
  onOpenSettings,
  lang,
  theme,
  onToggleTheme,
}) => {
  return (
    <aside className="w-20 lg:w-64 bg-white/95 dark:bg-[#090a0f] border-e border-slate-200 dark:border-white/[0.08] flex flex-col justify-between p-2.5 lg:p-4 shrink-0 select-none transition-all duration-200">
      
      {/* Brand & Main Nav */}
      <div className="space-y-6">
        
        {/* Brand with strong visual emblem */}
        <div className="flex items-center justify-center lg:justify-start gap-3 px-1 lg:px-2 py-2">
          <div className="w-10 h-10 lg:w-9 lg:h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/20 shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.8]" />
          </div>
          <div className="hidden lg:block min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight font-['Alexandria','Cairo']">
                Daily
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="block text-[11px] text-slate-500 dark:text-zinc-400 font-medium -mt-0.5 truncate">
              {lang === 'ar' ? 'إدارة المهام اليومية' : 'Task Flow Engine'}
            </span>
          </div>
        </div>

        {/* Navigation Items with Stronger Icons & Active States */}
        <nav className="space-y-2">
          
          {/* Today */}
          <button
            type="button"
            onClick={() => onTabChange('daily')}
            title={lang === 'ar' ? 'مهام اليوم' : "Today's Tasks"}
            className={`w-full flex flex-col lg:flex-row items-center justify-center lg:justify-between p-2 lg:px-3.5 lg:py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer min-h-[44px] ${
              activeTab === 'daily'
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-xs font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3">
              <div className={`w-7 h-7 lg:w-6 lg:h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                activeTab === 'daily' ? 'bg-emerald-400 text-slate-950 shadow-xs' : 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-zinc-400'
              }`}>
                <Calendar className="w-4 h-4 lg:w-3.5 lg:h-3.5 stroke-[2.5]" />
              </div>
              <span className="font-['Alexandria'] text-[10px] lg:text-xs">
                {lang === 'ar' ? 'مهام اليوم' : 'Tasks'}
              </span>
            </div>
            
            {todayTasksCount > 0 && (
              <span className={`text-[10px] lg:text-[11px] font-mono px-2 lg:px-2.5 py-0.5 rounded-full font-bold tabular-nums mt-0.5 lg:mt-0 ${
                activeTab === 'daily' 
                  ? 'bg-emerald-400 text-slate-950' 
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
              }`}>
                {todayTasksCount}
              </span>
            )}
          </button>

          {/* Archive */}
          <button
            type="button"
            onClick={() => onTabChange('archive')}
            title={lang === 'ar' ? 'سجل الأرشيف' : 'Archive History'}
            className={`w-full flex flex-col lg:flex-row items-center justify-center lg:justify-between p-2 lg:px-3.5 lg:py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer min-h-[44px] ${
              activeTab === 'archive'
                ? 'bg-slate-100 dark:bg-white/[0.1] text-slate-900 dark:text-white border border-slate-300 dark:border-white/[0.15] shadow-xs font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3">
              <div className={`w-7 h-7 lg:w-6 lg:h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                activeTab === 'archive' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs' : 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-zinc-400'
              }`}>
                <History className="w-4 h-4 lg:w-3.5 lg:h-3.5 stroke-[2.5]" />
              </div>
              <span className="font-['Alexandria'] text-[10px] lg:text-xs">
                {lang === 'ar' ? 'الأرشيف' : 'Archive'}
              </span>
            </div>

            {archiveDaysCount > 0 && (
              <span className={`text-[10px] lg:text-[11px] font-mono px-2 lg:px-2.5 py-0.5 rounded-full font-bold tabular-nums mt-0.5 lg:mt-0 ${
                activeTab === 'archive' 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950' 
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
              }`}>
                {archiveDaysCount}
              </span>
            )}
          </button>

        </nav>
      </div>

      {/* Bottom Controls: Theme Switch, Settings & Status */}
      <div className="pt-4 border-t border-slate-200 dark:border-white/[0.08] space-y-2">
        
        {/* Quick Theme Switcher */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? (lang === 'ar' ? 'التبديل للوضع الفاتح' : 'Switch to Light Mode') : (lang === 'ar' ? 'التبديل للوضع الداكن' : 'Switch to Dark Mode')}
          className="w-full flex items-center justify-center lg:justify-between p-2 lg:px-3.5 lg:py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer min-h-[44px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 lg:w-6 lg:h-6 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-400 stroke-[2.5]" />
              ) : (
                <Moon className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-indigo-600 stroke-[2.5]" />
              )}
            </div>
            <span className="hidden lg:inline">{theme === 'dark' ? (lang === 'ar' ? 'الوضع الفاتح' : 'Light Mode') : (lang === 'ar' ? 'الوضع الداكن' : 'Dark Mode')}</span>
          </div>
          <span className="hidden lg:inline text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-zinc-400 font-bold">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          title={lang === 'ar' ? 'الإعدادات والخيارات' : 'Settings & Data'}
          className="w-full flex items-center justify-center lg:justify-between p-2 lg:px-3.5 lg:py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer min-h-[44px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 lg:w-6 lg:h-6 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4 lg:w-3.5 lg:h-3.5 stroke-[2.2]" />
            </div>
            <span className="hidden lg:inline">{lang === 'ar' ? 'الإعدادات والخيارات' : 'Settings & Data'}</span>
          </div>
          <ChevronRight className={`hidden lg:block w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 ${lang === 'ar' ? 'rotate-180' : ''}`} />
        </button>

        {/* Pro / Status badge */}
        <div className="p-2 lg:px-3 lg:py-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] flex items-center justify-center lg:justify-between text-[11px] text-slate-500 dark:text-zinc-400">
          <span className="hidden lg:inline font-mono font-bold text-slate-700 dark:text-zinc-400">Daily Pro</span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold" title={lang === 'ar' ? 'حفظ تلقائي' : 'Auto Saved'}>
            <Sparkles className="w-3.5 h-3.5 lg:w-3 lg:h-3" />
            <span className="hidden lg:inline">{lang === 'ar' ? 'حفظ تلقائي' : 'Auto Saved'}</span>
          </span>
        </div>
      </div>

    </aside>
  );
};
