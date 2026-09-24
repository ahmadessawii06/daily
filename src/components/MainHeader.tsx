import React from 'react';
import { Plus, Menu, Sun, Moon, Sunrise, Camera } from 'lucide-react';
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

  // Minimal and formal greeting without casual emojis
  const getGreetingData = () => {
    if (hour >= 5 && hour < 12) {
      return {
        text: lang === 'ar' ? 'صباح الخير والبركة' : 'Good morning',
        icon: Sunrise,
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        text: lang === 'ar' ? 'طاب يومك وإنجازك' : 'Good afternoon',
        icon: Sun,
      };
    }
    return {
      text: lang === 'ar' ? 'مساء الخير والهمّة' : 'Good evening',
      icon: Moon,
    };
  };

  const greeting = getGreetingData();
  const GreetingIcon = greeting.icon;
  const headerDateStr = formatHeaderDate(currentDate, lang);

  return (
    <header className="flex flex-col gap-4 pb-4 border-b border-slate-200/80 dark:border-white/[0.08] transition-colors">
      
      {/* 1. الصف العلوي: شريط الملاحة والإجراءات (Navigation & Actions) */}
      <div className="flex items-center justify-between gap-3">
        
        {/* يمين / البداية: اسم التطبيق وشعار الحالة */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0 active:scale-95"
              aria-label="Open mobile menu"
            >
              <Menu className="w-4 h-4 stroke-[2]" />
            </button>
          )}

          {/* اسم التطبيق وشعار الحالة (Daily Track مع النقطة الخضراء) */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white text-[11px] sm:text-xs font-bold font-['Alexandria'] shadow-2xs shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10e588] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10e588]"></span>
            </span>
            <span>Daily Track</span>
          </div>

          {/* شارة الترحيب بنمط موحد وأيقونة خطية هادئة وبدون إيموجي */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-slate-600 dark:text-zinc-400 text-xs font-medium shrink-0">
            <GreetingIcon className="w-3.5 h-3.5 stroke-[2] text-slate-500 dark:text-zinc-400 shrink-0" />
            <span className="truncate">{greeting.text}</span>
          </div>
        </div>

        {/* يسار / النهاية: الإجراءات الرئيسية فقط (زر الإضافة الرئيسي + أزرار ثانوية هادئة) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* زر الوضع الداكن/الفاتح (Secondary / Ghost Button) */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? (lang === 'ar' ? 'التبديل إلى الوضع الفاتح' : 'Switch to Light Mode') : (lang === 'ar' ? 'التبديل إلى الوضع الداكن' : 'Switch to Dark Mode')}
            className="p-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.07] border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center shadow-2xs active:scale-95"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 stroke-[2]" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 stroke-[2]" />
            )}
          </button>

          {/* زر تصدير كصورة (Secondary / Ghost Button) */}
          <button
            type="button"
            onClick={onOpenExportModal}
            title={lang === 'ar' ? 'تصدير جدول اليوم كصورة' : 'Export schedule as image'}
            className="p-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.07] border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
            aria-label="Export schedule as image"
          >
            <Camera className="w-4 h-4 stroke-[2]" />
            <span className="hidden md:inline text-xs font-medium font-['Alexandria']">
              {lang === 'ar' ? 'تصدير كصورة' : 'Export'}
            </span>
          </button>

          {/* زر الإجراء الرئيسي: + إضافة مهمة جديدة (Primary CTA مع ظل ناعم واختصار kbd) */}
          <button
            type="button"
            onClick={onOpenAddTask}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-[#10e588] hover:bg-[#0fd07b] active:scale-95 rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer min-h-[40px] font-['Alexandria'] shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.8]" />
            <span className="sm:hidden">{lang === 'ar' ? 'مهمة' : 'Add'}</span>
            <span className="hidden sm:inline">{lang === 'ar' ? 'إضافة مهمة جديدة' : '+ Add Task'}</span>
            <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-black/10 text-slate-950 border border-black/15">
              N
            </kbd>
          </button>
        </div>

      </div>

      {/* 2. الصف السفلي: الترحيب والتاريخ (Date & Motivation) */}
      <div className="pt-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Alexandria'] leading-tight">
          {headerDateStr}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium font-['Alexandria']">
          {lang === 'ar' ? 'احرص على ما ينفعك واستعن بالله ولا تعجز' : "Be keen on what benefits you, seek help from Allah, and do not despair."}
        </p>
      </div>

    </header>
  );
};
