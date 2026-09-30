import React from 'react';
import { Plus, Menu, Sun, Moon, Sunrise, Camera, User as UserIcon, LogOut } from 'lucide-react';
import { Language, Theme, User } from '../types';
import { formatHeaderDate } from '../utils/date';

interface MainHeaderProps {
  currentDate: string;
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenAddTask: () => void;
  onOpenExportModal: () => void;
  onOpenMobileMenu?: () => void;
  lang: Language;
  theme: Theme;
  onToggleTheme: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  currentDate,
  currentUser,
  onLogout,
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
    <header className="flex flex-col gap-3 pb-3 border-b border-slate-200/80 dark:border-white/[0.08] transition-colors">
      
      {/* 1. الصف العلوي: شريط الأيقونات والإجراءات المدمجة (Icons-only Header) */}
      <div className="flex items-center justify-between gap-2">
        
        {/* يمين / البداية: القائمة واسم التطبيق أو الشعار */}
        <div className="flex items-center gap-2 min-w-0">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer w-10 h-10 flex items-center justify-center shrink-0 active:scale-95"
              aria-label="Open mobile menu"
              title={lang === 'ar' ? 'القائمة' : 'Menu'}
            >
              <Menu className="w-4 h-4 stroke-[2]" />
            </button>
          )}

          {/* اسم التطبيق وشعار الحالة المدمج */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-bold font-['Alexandria'] shrink-0 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10e588] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10e588]"></span>
            </span>
            <span>Daily Track</span>
          </div>

          {/* أيقونة الترحيب المدمجة مع تلميح */}
          <div
            title={greeting.text}
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-slate-500 dark:text-zinc-400 shrink-0"
          >
            <GreetingIcon className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        {/* يسار / النهاية: أزرار الإجراءات بأيقونات فقط متناسقة */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* حساب المستخدم (أيقونة فقط مع تلميح بالاسم) */}
          {currentUser && (
            <div
              title={`${lang === 'ar' ? 'المستخدم:' : 'User:'} ${currentUser.name || currentUser.username}`}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-emerald-500 shrink-0 shadow-2xs"
            >
              <UserIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
          )}

          {/* تسجيل الخروج (أيقونة فقط) */}
          {currentUser && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              className="w-10 h-10 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer flex items-center justify-center active:scale-95 shrink-0"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 stroke-[2]" />
            </button>
          )}

          {/* زر الوضع الداكن/الفاتح (أيقونة فقط) */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? (lang === 'ar' ? 'التبديل للوضع الفاتح' : 'Light Mode') : (lang === 'ar' ? 'التبديل للوضع الداكن' : 'Dark Mode')}
            className="w-10 h-10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 shrink-0"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 stroke-[2]" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 stroke-[2]" />
            )}
          </button>

          {/* زر تصدير كصورة (أيقونة فقط) */}
          <button
            type="button"
            onClick={onOpenExportModal}
            title={lang === 'ar' ? 'تصدير جدول اليوم كصورة' : 'Export as Image'}
            className="w-10 h-10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 shrink-0"
            aria-label="Export schedule as image"
          >
            <Camera className="w-4 h-4 stroke-[2]" />
          </button>

          {/* زر إضافة مهمة جديدة (أيقونة رئيسية مميزة بارزة) */}
          <button
            type="button"
            onClick={onOpenAddTask}
            title={lang === 'ar' ? 'إضافة مهمة جديدة (N)' : 'Add Task (N)'}
            className="w-10 h-10 flex items-center justify-center text-slate-950 bg-[#10e588] hover:bg-[#0fd07b] active:scale-95 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0"
            aria-label="Add new task"
          >
            <Plus className="w-5 h-5 stroke-[2.8]" />
          </button>
        </div>

      </div>

      {/* 2. الصف السفلي: التاريخ والعبارة اليومية */}
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
