import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Sun, 
  Moon, 
  Sunrise, 
  Camera, 
  CircleUserRound, 
  Power, 
  Settings, 
  BarChart3, 
  Archive, 
  ChevronDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Language, Theme, User } from '../types';
import { formatHeaderDate } from '../utils/date';

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

export const MainHeader: React.FC<MainHeaderProps> = ({
  currentDate,
  currentUser,
  onLogout,
  onOpenAddTask,
  onOpenExportModal,
  onOpenSettings,
  onOpenStats,
  onOpenArchive,
  archiveDaysCount,
  lang,
  theme,
  onToggleTheme,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

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
    <header className="flex flex-col gap-3 pb-3 border-b border-slate-200/80 dark:border-white/[0.08] transition-colors relative">
      
      {/* 1. الصف العلوي: شريط الأيقونات والإجراءات المدمجة (Icons-only Header) */}
      <div className="flex items-center justify-between gap-2">
        
        {/* يمين / البداية: اسم التطبيق وأيقونة الترحيب */}
        <div className="flex items-center gap-2 min-w-0">
          {/* اسم التطبيق وشعار الحالة المدمج: ميزان */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-bold font-['Alexandria'] shrink-0 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10e588] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10e588]"></span>
            </span>
            <span>ميزان</span>
          </div>

          {/* أيقونة الترحيب المدمجة مع تلميح */}
          <div
            title={greeting.text}
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-slate-500 dark:text-zinc-400 shrink-0"
          >
            <GreetingIcon className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        {/* يسار / النهاية: أزرار الأيقونات فقط */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* قائمة وحساب المستخدم (أفاتار مع قائمة منبثقة للإحصائيات والأرشيف) */}
          {currentUser && (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                title={`${lang === 'ar' ? 'الملف الشخصي والإحصائيات' : 'Profile & Insights'} (${currentUser.name || currentUser.username})`}
                className="relative group flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-500/5 dark:from-emerald-400/20 dark:via-teal-400/10 dark:to-emerald-500/5 border border-emerald-500/30 dark:border-emerald-400/30 text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs hover:border-emerald-500/60 transition-all cursor-pointer active:scale-95"
                aria-label="Profile Menu"
              >
                {currentUser.name || currentUser.username ? (
                  <span className="text-sm font-black uppercase text-emerald-700 dark:text-emerald-300 font-['Alexandria']">
                    {(currentUser.name || currentUser.username).trim().charAt(0)}
                  </span>
                ) : (
                  <CircleUserRound className="w-5 h-5 stroke-[2.2]" />
                )}
                {/* مؤشر الحالة النشطة */}
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-[#0c1015]" />
                </span>
              </button>

              {/* القائمة المنسدلة للبروفايل، الإحصائيات، والأرشيف */}
              {isProfileMenuOpen && (
                <div className="absolute end-0 top-12 z-50 w-72 p-2 bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/[0.12] rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 font-['Alexandria']">
                  {/* معلومات المستخدم */}
                  <div className="px-3 py-2.5 mb-1 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.05]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {(currentUser.name || currentUser.username).trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {currentUser.name || currentUser.username}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-400 truncate">
                          @{currentUser.username}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        <span>نشط</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {/* خيار الإحصائيات */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenStats();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer text-start"
                    >
                      <div className="flex items-center gap-2.5">
                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                        <span>{lang === 'ar' ? 'الإحصائيات والتقرير الأسبوعي' : 'Weekly Statistics'}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-zinc-400">
                        📊
                      </span>
                    </button>

                    {/* خيار الأرشيف */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenArchive();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-xl transition-colors cursor-pointer text-start"
                    >
                      <div className="flex items-center gap-2.5">
                        <Archive className="w-4 h-4 text-cyan-500" />
                        <span>{lang === 'ar' ? 'الأرشيف وسجل الأيام' : 'Archive & History'}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        {archiveDaysCount}
                      </span>
                    </button>

                    {/* خيار الإعدادات من البروفايل أيضاً */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer text-start"
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                        <span>{lang === 'ar' ? 'الإعدادات والخيارات' : 'Settings'}</span>
                      </div>
                    </button>

                    {/* خط فاصل */}
                    <div className="my-1 border-t border-slate-100 dark:border-white/[0.06]" />

                    {/* تسجيل الخروج */}
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer text-start"
                      >
                        <Power className="w-4 h-4 stroke-[2.2]" />
                        <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* زر تسجيل الخروج المباشر */}
          {currentUser && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              className="group w-10 h-10 text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl bg-slate-100 hover:bg-rose-500/10 dark:bg-white/[0.05] dark:hover:bg-rose-500/15 border border-slate-200/80 hover:border-rose-500/30 dark:border-white/[0.08] dark:hover:border-rose-500/30 transition-all duration-200 cursor-pointer flex items-center justify-center active:scale-95 shrink-0 shadow-2xs"
              aria-label="Logout"
            >
              <Power className="w-4 h-4 stroke-[2.2] group-hover:scale-110 group-hover:rotate-12 transition-transform" />
            </button>
          )}

          {/* زر الإعدادات والخيارات الجديد في الهيدر */}
          <button
            type="button"
            onClick={onOpenSettings}
            title={lang === 'ar' ? 'الإعدادات والخيارات' : 'Settings'}
            className="w-10 h-10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 shrink-0"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 stroke-[2]" />
          </button>

          {/* زر الوضع الداكن/الفاتح */}
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

          {/* زر تصدير كصورة */}
          <button
            type="button"
            onClick={onOpenExportModal}
            title={lang === 'ar' ? 'تصدير جدول اليوم كصورة' : 'Export as Image'}
            className="w-10 h-10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 shrink-0"
            aria-label="Export schedule as image"
          >
            <Camera className="w-4 h-4 stroke-[2]" />
          </button>

          {/* زر إضافة مهمة جديدة */}
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

      {/* 2. الصف السفلي: التاريخ */}
      <div className="pt-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Alexandria'] leading-tight">
          {headerDateStr}
        </h1>
      </div>

    </header>
  );
};
