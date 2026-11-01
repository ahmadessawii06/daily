import React, { useEffect, useState } from 'react';
import { Archive, ChartColumnIncreasing, Columns2, Columns3, Columns4, Loader2, LogOut, MoonStar, Plus, Settings, Share2, Sun } from 'lucide-react';
import { Language, Theme, User } from '../types';
import { SyncIndicator } from './SyncIndicator';
import { ColorThemePicker } from './ColorThemePicker';
import { HijriDateNavigation } from './HijriDateNavigation';
import { ArabicLanguageIcon, EnglishLanguageIcon } from './LanguageIcons';
import { WeatherIndicator } from './WeatherIndicator';
import { Tooltip } from './Tooltip';

const headerBackgrounds: Record<Theme, string> = {
  dark: new URL('../assets/images/home/night-header-dark.webp', import.meta.url).href,
  light: new URL('../assets/images/home/night-header-light.webp', import.meta.url).href,
};

const getLiveClock = (lang: Language) => {
  const now = new Date();
  const hour = now.getHours();
  const displayHour = hour % 12 || 12;
  return {
    text: [displayHour, now.getMinutes(), now.getSeconds()]
      .map(part => String(part).padStart(2, '0'))
      .join(':'),
    period: lang === 'ar'
      ? (hour >= 12 ? '\u0645\u0633\u0627\u0621\u064b' : '\u0635\u0628\u0627\u062d\u0627\u064b')
      : (hour >= 12 ? 'PM' : 'AM'),
  };
};

interface MainHeaderProps {
  cardColumns?: 2 | 3 | 4;
  onToggleCardColumns?: () => void;
  children?: React.ReactNode;
  dayMemories?: React.ReactNode;
  quickNotes?: React.ReactNode;
  dateNavigation?: React.ReactNode;
  worshipNavigation?: React.ReactNode;
  currentDate: string;
  onDateChange?: (date: string) => void;
  currentUser?: User | null;
  onOpenAddTask: () => void;
  onOpenSettings: () => void;
  lang: Language;
  theme: Theme;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onExport: () => void;
  exporting: boolean;
  onOpenArchive: () => void;
  onOpenStats: () => void;
  onLogout: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ cardColumns = 4, onToggleCardColumns, children, dayMemories, quickNotes, dateNavigation, worshipNavigation, currentDate, onDateChange, currentUser, onOpenAddTask, onOpenSettings, lang, theme, onToggleTheme, onToggleLang, onExport, exporting, onOpenArchive, onOpenStats, onLogout }) => {
  const ar = lang === 'ar';
  const [clock, setClock] = useState(() => getLiveClock(lang));
  useEffect(() => {
    const interval = window.setInterval(() => setClock(getLiveClock(lang)), 1000);
    return () => window.clearInterval(interval);
  }, [lang]);
  const controlBase = 'group flex h-8 w-8 sm:h-8.5 sm:w-8.5 cursor-pointer shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-700 hover:text-emerald-800 hover:bg-emerald-600/10 dark:text-zinc-200 dark:hover:text-emerald-300 dark:hover:bg-emerald-400/15 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500 disabled:cursor-wait disabled:opacity-50 transition-all duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95';
  const control = `${controlBase}`;
  const logoutControl = `${controlBase} hover:!text-red-600 hover:!bg-red-50/80 dark:hover:!text-red-400 dark:hover:!bg-red-500/10 focus-visible:!outline-red-500`;
  const iconMotion = 'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out';
  const themeLabel = theme === 'dark' ? (ar ? 'تفعيل الوضع الفاتح' : 'Switch to light mode') : (ar ? 'تفعيل الوضع الداكن' : 'Switch to dark mode');

  return (
    <header data-main-header className="relative isolate flex flex-col gap-2 overflow-visible rounded-3xl border border-white/80 bg-white/40 px-3 py-2.5 pb-3.5 shadow-[0_8px_32px_-4px_rgba(18,56,38,0.08),inset_0_1px_1.5px_0_rgba(255,255,255,0.95)] backdrop-blur-md sm:px-5 sm:py-3 sm:pb-4 dark:border-white/12 dark:bg-[#071714]/85 dark:shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_1px_0_rgba(255,255,255,0.08)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-3xl">
        <img
          src={headerBackgrounds.light}
          alt=""
          fetchPriority="high"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ease-in-out filter saturate-[1.14] contrast-[1.02] brightness-[1.01] ${
            theme === 'light' ? 'opacity-95' : 'opacity-0'
          }`}
        />
        <img
          src={headerBackgrounds.dark}
          alt=""
          fetchPriority="high"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ease-in-out filter saturate-[1.05] contrast-[1.05] brightness-[0.9] ${
            theme === 'dark' ? 'opacity-95' : 'opacity-0'
          }`}
        />
        {/* Subtle warm atmospheric vertical gradient */}
        <div className={`absolute inset-0 transition-colors duration-500 ${
          theme === 'light'
            ? 'bg-gradient-to-b from-amber-50/15 via-transparent to-emerald-950/10'
            : 'bg-gradient-to-b from-[#02110e]/65 via-[#031814]/45 to-[#02110e]/75'
        }`} />
        {/* Selective peripheral vignette: softens high contrast on palm silhouettes at extreme sides while keeping center golden and clear */}
        <div className={`absolute inset-0 transition-colors duration-500 ${
          theme === 'light'
            ? 'bg-gradient-to-r from-emerald-950/10 via-transparent via-50% to-emerald-950/10'
            : 'bg-gradient-to-r from-black/25 via-transparent via-50% to-black/25'
        }`} />
        <div className={`absolute inset-0 transition-colors duration-500 ${
          theme === 'light'
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.04)_65%,transparent_100%)]'
            : 'bg-[radial-gradient(ellipse_at_center,rgba(5,28,24,0.45)_0%,rgba(3,17,14,0.2)_65%,transparent_100%)]'
        }`} />
      </div>
      <div className="relative z-10 flex flex-col gap-1.5">
      <div className="main-header-top-bar">
        <div className="flex min-w-0 items-center gap-2 justify-self-start">
          <div className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-white/85 bg-white/80 px-3 text-xs font-bold text-[#14382f] shadow-[0_2px_10px_-2px_rgba(18,50,38,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md dark:border-white/15 dark:bg-[#061e18]/85 dark:text-[#F8EBCD]">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#10e588] shadow-[0_0_10px_rgba(16,229,136,0.55)]" />
            <span>{ar ? 'ميزان' : 'Mizan'}</span>
          </div>
          <SyncIndicator lang={lang} userId={currentUser?.id} compact />
        </div>
        <div
          role="group"
          aria-label={ar ? 'أدوات اليوم' : 'Day tools'}
          dir="ltr"
          className="main-header-tools inline-flex items-center gap-0.5 rounded-xl border border-white/85 bg-white/75 p-1 shadow-[0_4px_16px_-4px_rgba(18,50,38,0.08),inset_0_1px_1.5px_rgba(255,255,255,0.95)] backdrop-blur-md dark:border-white/15 dark:bg-black/40 dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)]"
        >
          {/* Cluster 1: Logout */}
          <Tooltip text={ar ? 'تسجيل الخروج' : 'Sign out'}>
            <button id="header-logout-btn" type="button" onClick={onLogout} aria-label={ar ? 'تسجيل الخروج' : 'Sign out'} className={logoutControl}>
              <LogOut aria-hidden="true" size={17} strokeWidth={2} className={`${iconMotion} text-slate-600 group-hover:text-red-600 dark:text-zinc-300 dark:group-hover:text-red-400`} />
            </button>
          </Tooltip>

          <span aria-hidden="true" className="h-4 w-px bg-slate-300/80 dark:bg-white/15 shrink-0 mx-1" />

          {/* Cluster 2: Tasks & Insights */}
          <div className="flex items-center gap-0.5">
            <Tooltip text={ar ? 'إضافة مهمة جديدة' : 'Add new task'}>
              <button id="header-add-task-btn" type="button" onClick={onOpenAddTask} aria-label={ar ? 'إضافة مهمة جديدة واختيار مكانها' : 'Add a task and choose where it goes'} className={`${control} text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-500/15`}>
                <Plus aria-hidden="true" size={17} strokeWidth={2.2} className={`${iconMotion} motion-safe:group-hover:rotate-90`} />
              </button>
            </Tooltip>
            {onToggleCardColumns && (
              <Tooltip text={ar ? `تغيير الأعمدة (${cardColumns} حالياً)` : `Change columns (${cardColumns})`}>
                <button id="header-columns-btn" type="button" onClick={onToggleCardColumns} aria-label={ar ? `${cardColumns} بطاقات بالصف، التبديل إلى ${cardColumns === 4 ? 2 : cardColumns === 2 ? 3 : 4}` : `${cardColumns} cards per row, switch to ${cardColumns === 4 ? 2 : cardColumns === 2 ? 3 : 4}`} className={control}>
                  {cardColumns === 4 ? <Columns4 aria-hidden="true" size={17} strokeWidth={1.9} /> : cardColumns === 3 ? <Columns3 aria-hidden="true" size={17} strokeWidth={1.9} /> : <Columns2 aria-hidden="true" size={17} strokeWidth={1.9} />}
                </button>
              </Tooltip>
            )}
            <div id="onboarding-insights-tools" className="contents">
              <Tooltip text={ar ? 'الإحصائيات والتقرير' : 'Statistics & report'}>
                <button id="header-stats-btn" type="button" onClick={onOpenStats} aria-label={ar ? 'الإحصائيات والتقرير الأسبوعي' : 'Statistics & weekly report'} className={control}>
                  <ChartColumnIncreasing aria-hidden="true" size={17} strokeWidth={2} className={`${iconMotion} origin-bottom motion-safe:group-hover:scale-y-115`} />
                </button>
              </Tooltip>
              <Tooltip text={ar ? 'الأرشيف وسجل الأيام' : 'Archive & history'}>
                <button id="header-archive-btn" type="button" onClick={onOpenArchive} aria-label={ar ? 'الأرشيف وسجل الأيام' : 'Archive & history'} className={control}>
                  <Archive aria-hidden="true" size={16} strokeWidth={1.8} className={`${iconMotion} motion-safe:group-hover:translate-y-0.5`} />
                </button>
              </Tooltip>
            </div>
            <Tooltip text={ar ? 'تصدير كصورة' : 'Export as image'}>
              <button id="header-export-btn" type="button" onClick={onExport} disabled={exporting} aria-busy={exporting} aria-label={ar ? 'تصدير صورة اليوم' : 'Export today as an image'} className={control}>
                {exporting ? <Loader2 aria-hidden="true" size={16} strokeWidth={2} className="animate-spin" /> : <Share2 aria-hidden="true" size={17} strokeWidth={1.9} className={`${iconMotion} motion-safe:group-hover:scale-115`} />}
              </button>
            </Tooltip>
          </div>

          {(dayMemories || quickNotes) && (
            <>
              <span aria-hidden="true" className="h-4 w-px bg-slate-300/80 dark:bg-white/15 shrink-0 mx-1" />
              {/* Cluster 3: Memories & Notes */}
              <div className="flex items-center gap-0.5">
                {dayMemories && <div className="contents" dir="ltr">{dayMemories}</div>}
                {quickNotes && <div className="contents" dir="ltr">{quickNotes}</div>}
              </div>
            </>
          )}

          <span aria-hidden="true" className="h-4 w-px bg-slate-300/80 dark:bg-white/15 shrink-0 mx-1" />

          {/* Cluster 4: Preferences & Settings */}
          <div className="flex items-center gap-0.5">
            <ColorThemePicker lang={lang} className={control} />
            <Tooltip text={ar ? 'English' : 'العربية'}>
              <button id="header-lang-btn" type="button" onClick={onToggleLang} aria-label={ar ? 'Switch to English' : 'التبديل إلى العربية'} lang={ar ? 'en' : 'ar'} className={control}>
                {ar ? (
                  <ArabicLanguageIcon aria-hidden="true" size={17} className={`${iconMotion} motion-safe:group-hover:scale-110`} />
                ) : (
                  <EnglishLanguageIcon aria-hidden="true" size={17} className={`${iconMotion} motion-safe:group-hover:scale-110`} />
                )}
              </button>
            </Tooltip>
            <Tooltip text={themeLabel}>
              <button id="header-theme-btn" type="button" onClick={onToggleTheme} aria-label={themeLabel} className={control}>
                {theme === 'dark' ? <Sun aria-hidden="true" size={17} strokeWidth={2} className={`${iconMotion} motion-safe:group-hover:rotate-90`} /> : <MoonStar aria-hidden="true" size={17} strokeWidth={2} className={`${iconMotion} motion-safe:group-hover:-rotate-25`} />}
              </button>
            </Tooltip>
            <Tooltip text={ar ? 'الإعدادات' : 'Settings'}>
              <button id="header-settings-btn" type="button" onClick={onOpenSettings} aria-label={ar ? 'الإعدادات' : 'Settings'} className={control}>
                <Settings aria-hidden="true" size={17} strokeWidth={2} className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:rotate-45" />
              </button>
            </Tooltip>
          </div>
        </div>
        <div className="main-header-actions flex min-w-0 items-center gap-2 justify-self-end">
          <div
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-white/85 bg-white/80 px-3 text-xs font-bold text-[#14382f] shadow-[0_2px_10px_-2px_rgba(18,50,38,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md dark:border-white/15 dark:bg-[#061e18]/85 dark:text-[#F8EBCD] select-none"
            aria-label={`${clock.text} ${clock.period}`}
            dir={ar ? 'rtl' : 'ltr'}
          >
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#10e588] shadow-[0_0_10px_rgba(16,229,136,0.55)]" />
            <span className="font-semibold tabular-nums tracking-tight">{clock.text}</span>
            <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">{clock.period}</span>
          </div>
          <WeatherIndicator lang={lang} compact />
        </div>
      </div>
      <div className="main-header-secondary-bar" dir="ltr">
        <div className="main-header-clock">
          {onDateChange && <HijriDateNavigation currentDate={currentDate} onDateChange={onDateChange} lang={lang} />}
        </div>
        {worshipNavigation && (
          <div className="main-header-dock-container" dir={ar ? 'rtl' : 'ltr'}>
            {worshipNavigation}
          </div>
        )}
        <div className="main-header-secondary-date" dir={ar ? 'rtl' : 'ltr'}>
          {dateNavigation}
        </div>
        {children && <div data-main-header-summary dir={ar ? 'rtl' : 'ltr'}>
          {children}
        </div>}
      </div>
      </div>
    </header>
  );
};


