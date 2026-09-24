import React from 'react';
import { Plus, Menu, Sun, Moon, Sunrise, Camera, Printer, LayoutGrid, Clock } from 'lucide-react';
import { Language, Theme, ViewMode } from '../types';
import { formatHeaderDate } from '../utils/date';

interface MainHeaderProps {
  currentDate: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAddTask: () => void;
  onOpenExportModal: () => void;
  onPrintPDF: () => void;
  onOpenMobileMenu?: () => void;
  lang: Language;
  theme: Theme;
  onToggleTheme: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onOpenAddTask,
  onOpenExportModal,
  onPrintPDF,
  onOpenMobileMenu,
  lang,
  theme,
  onToggleTheme,
}) => {
  const hour = new Date().getHours();

  // Minimal and formal greeting
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
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0"
              aria-label="Open mobile menu"
            >
              <Menu className="w-4 h-4 stroke-[2]" />
            </button>
          )}

          {/* اسم التطبيق وشعار الحالة (Daily Track مع النقطة الخضراء) */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-bold font-['Alexandria'] shadow-2xs shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Daily Track</span>
          </div>

          {/* شارة الترحيب بنمط موحد وأيقونة خطية هادئة وبدون إيموجي */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-slate-600 dark:text-zinc-400 text-xs font-medium shrink-0">
            <GreetingIcon className="w-3.5 h-3.5 stroke-[2] text-slate-500 dark:text-zinc-400 shrink-0" />
            <span className="truncate">{greeting.text}</span>
          </div>
        </div>

        {/* يسار / النهاية: الإجراءات الرئيسية فقط */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* View Mode Toggle: Timeline vs Grouped Periods */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => onViewModeChange('timeline')}
              title={lang === 'ar' ? 'عرض المخطط الزمني (Timeline)' : 'Timeline View'}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-950 dark:bg-zinc-800 dark:text-white font-bold shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-['Alexandria']">{lang === 'ar' ? 'تايم لاين' : 'Timeline'}</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('periods')}
              title={lang === 'ar' ? 'عرض فترات اليوم (كروت مجمعة)' : 'Periods View'}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'periods'
                  ? 'bg-white text-slate-950 dark:bg-zinc-800 dark:text-white font-bold shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-['Alexandria']">{lang === 'ar' ? 'فترات' : 'Periods'}</span>
            </button>
          </div>

          {/* زر الوضع الداكن/الفاتح */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? (lang === 'ar' ? 'التبديل إلى الوضع الفاتح' : 'Switch to Light Mode') : (lang === 'ar' ? 'التبديل إلى الوضع الداكن' : 'Switch to Dark Mode')}
            className="p-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.07] border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center shadow-2xs"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 stroke-[2]" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 stroke-[2]" />
            )}
          </button>

          {/* زر تصدير كصورة */}
          <button
            type="button"
            onClick={onOpenExportModal}
            title={lang === 'ar' ? 'تصدير جدول اليوم كصورة' : 'Export as Image'}
            className="p-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.07] border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center gap-1.5 shadow-2xs"
            aria-label="Export schedule as image"
          >
            <Camera className="w-4 h-4 stroke-[2]" />
            <span className="hidden lg:inline text-xs font-medium font-['Alexandria']">
              {lang === 'ar' ? 'صورة' : 'Image'}
            </span>
          </button>

          {/* زر طباعة / PDF */}
          <button
            type="button"
            onClick={onPrintPDF}
            title={lang === 'ar' ? 'طباعة الجدول أو حفظه كـ PDF' : 'Print or save as PDF'}
            className="p-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.07] border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center gap-1.5 shadow-2xs"
            aria-label="Print or save as PDF"
          >
            <Printer className="w-4 h-4 stroke-[2]" />
            <span className="hidden lg:inline text-xs font-medium font-['Alexandria']">
              PDF
            </span>
          </button>

          {/* زر الإجراء الرئيسي: + إضافة مهمة جديدة */}
          <button
            type="button"
            onClick={onOpenAddTask}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 active:scale-98 rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer min-h-[36px] font-['Alexandria']"
          >
            <Plus className="w-4 h-4 stroke-[2.8]" />
            <span>{lang === 'ar' ? 'إضافة مهمة' : '+ Task'}</span>
            <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-950/10 text-emerald-950 border border-emerald-950/15">
              N
            </kbd>
          </button>
        </div>

      </div>

      {/* 2. الصف السفلي: الترحيب والتاريخ (Date & Motivation) */}
      <div className="pt-1 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Alexandria'] leading-tight">
            {headerDateStr}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5 font-medium font-['Alexandria']">
            {lang === 'ar' ? 'لنبدأ يوماً مفعماً بالإنتاجية والتركيز والسكينة.' : "Let's make today productive, focused, and calm."}
          </p>
        </div>
      </div>

    </header>
  );
};
