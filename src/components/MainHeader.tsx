import React from 'react';
import { Plus, Menu, Sun, Moon, Sunrise, Sparkles, Camera } from 'lucide-react';
import { Language, Theme } from '../types';
import { formatHeaderDate } from '../utils/date';

interface MainHeaderProps {
  currentDate: string;
  onOpenAddTask: () => void;
  onOpenExportModal: () => void;
  onOpenMobileMenu?: () => void;
  lang: Language;
  theme: Theme;
  onToggleTheme: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  currentDate,
  onOpenAddTask,
  onOpenExportModal,
  onOpenMobileMenu,
  lang,
  theme,
  onToggleTheme,
}) => {
  const hour = new Date().getHours();

  const getGreetingData = () => {
    if (hour >= 5 && hour < 12) {
      return {
        text: lang === 'ar' ? 'صباح الخير والبركة 👋' : 'Good morning 👋',
        icon: Sunrise,
        badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        text: lang === 'ar' ? 'طاب يومك وإنجازك 👋' : 'Good afternoon 👋',
        icon: Sun,
        badgeBg: 'bg-amber-400/10 text-amber-600 dark:text-amber-300 border-amber-400/20'
      };
    }
    return {
      text: lang === 'ar' ? 'مساء الخير والهمّة 👋' : 'Good evening 👋',
      icon: Moon,
      badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20'
    };
  };

  const greeting = getGreetingData();
  const GreetingIcon = greeting.icon;
  const headerDateStr = formatHeaderDate(currentDate, lang);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-200/90 dark:border-white/[0.08] transition-colors">
      
      {/* Date & Greetings */}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.1] transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}

          {/* Daily Track Brand Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-black tracking-tight font-['Alexandria'] shadow-xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Daily Track</span>
          </div>

          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${greeting.badgeBg}`}>
            <GreetingIcon className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span className="truncate">{greeting.text}</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2 font-['Alexandria','Cairo'] leading-tight">
          {headerDateStr}
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium flex items-center gap-1.5 truncate">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span className="truncate">{lang === 'ar' ? 'لنبدأ يومًا مفعمًا بالإنتاجية والتركيز.' : "Let's make today productive."}</span>
        </p>
      </div>

      {/* Right Controls: Theme Toggle + Add Task */}
      <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-center">
        
        {/* Quick Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? (lang === 'ar' ? 'التبديل إلى الوضع الفاتح' : 'Switch to Light Mode') : (lang === 'ar' ? 'التبديل إلى الوضع الداكن' : 'Switch to Dark Mode')}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.12] text-slate-700 dark:text-zinc-200 transition-all cursor-pointer shadow-xs min-h-[42px] min-w-[42px] flex items-center justify-center"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 stroke-[2.5]" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600 stroke-[2.5]" />
          )}
        </button>

        {/* Export Schedule as Image Button */}
        <button
          type="button"
          onClick={onOpenExportModal}
          title={lang === 'ar' ? 'تصدير جدول اليوم كصورة فائقة الجودة' : 'Export schedule as high-res image'}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.06] hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-500/15 dark:hover:border-emerald-500/30 text-slate-700 dark:text-zinc-200 transition-all cursor-pointer shadow-xs min-h-[42px] min-w-[42px] flex items-center justify-center gap-1.5 group"
          aria-label="Export schedule as image"
        >
          <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform stroke-[2.2]" />
          <span className="hidden lg:inline text-xs font-bold font-['Alexandria'] text-slate-800 dark:text-zinc-200">
            {lang === 'ar' ? 'تصدير كصورة' : 'Export'}
          </span>
        </button>

        {/* Add Task Action */}
        <button
          type="button"
          onClick={onOpenAddTask}
          className="flex-1 sm:flex-initial justify-center group relative flex items-center gap-2 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 hover:from-emerald-300 hover:to-teal-200 active:scale-98 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 ring-1 ring-white/30 cursor-pointer min-h-[42px]"
        >
          <div className="w-5 h-5 rounded-lg bg-slate-950/20 flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 stroke-[3] text-slate-950" />
          </div>
          <span>{lang === 'ar' ? 'إضافة مهمة جديدة' : '+ Add Task'}</span>
          <span className="hidden lg:inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-950/15 font-mono text-slate-900 font-extrabold">
            N
          </span>
        </button>
      </div>

    </header>
  );
};
