import React, { useEffect, useState } from 'react';
import { Archive, ChartColumnIncreasing, Columns2, Columns3, Columns4, Loader2, LogOut, MoonStar, Plus, Settings, Share2, Sun } from 'lucide-react';
import { Language, Theme, User } from '../types';
import { SyncIndicator } from './SyncIndicator';
import { ColorThemePicker } from './ColorThemePicker';
import { HijriDateNavigation } from './HijriDateNavigation';
import { ArabicLanguageIcon, EnglishLanguageIcon } from './LanguageIcons';
import { WeatherIndicator } from './WeatherIndicator';

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
  dateNavigation?: React.ReactNode;
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

export const MainHeader: React.FC<MainHeaderProps> = ({ cardColumns = 4, onToggleCardColumns, children, dayMemories, dateNavigation, currentDate, onDateChange, currentUser, onOpenAddTask, onOpenSettings, lang, theme, onToggleTheme, onToggleLang, onExport, exporting, onOpenArchive, onOpenStats, onLogout }) => {
  const ar = lang === 'ar';
  const [clock, setClock] = useState(() => getLiveClock(lang));
  useEffect(() => {
    const interval = window.setInterval(() => setClock(getLiveClock(lang)), 1000);
    return () => window.clearInterval(interval);
  }, [lang]);
  const hover = 'transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out enabled:hover:border-emerald-400/60 enabled:hover:bg-emerald-50 enabled:hover:text-emerald-700 enabled:hover:shadow-[0_6px_20px_-6px_rgba(16,185,129,0.4)] motion-safe:enabled:hover:-translate-y-0.5 motion-safe:enabled:active:translate-y-0 motion-safe:enabled:active:scale-95 motion-reduce:transition-none dark:enabled:hover:border-emerald-400/40 dark:enabled:hover:bg-emerald-400/10 dark:enabled:hover:text-emerald-300';
  const controlBase = 'group flex h-control min-w-control cursor-pointer shrink-0 items-center justify-center rounded-2xl border border-white/35 bg-slate-100/70 px-2 text-xs font-semibold text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_8px_rgba(38,63,48,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50 dark:border-white/[0.14] dark:bg-white/[0.04] dark:text-zinc-300 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_2px_8px_rgba(0,0,0,0.16)] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out motion-safe:enabled:hover:-translate-y-0.5 motion-safe:enabled:active:translate-y-0 motion-safe:enabled:active:scale-95 motion-reduce:transition-none';
  const control = `${controlBase} focus-visible:outline-emerald-500 ${hover}`;
  const logoutControl = `${controlBase} focus-visible:outline-red-500 enabled:hover:border-red-400/60 enabled:hover:bg-red-50 enabled:hover:text-red-600 enabled:hover:shadow-[0_6px_20px_-6px_rgba(239,68,68,0.45)] dark:enabled:hover:border-red-500/40 dark:enabled:hover:bg-red-500/10 dark:enabled:hover:text-red-400`;
  const iconMotion = 'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out';
  const themeLabel = theme === 'dark' ? (ar ? 'تفعيل الوضع الفاتح' : 'Switch to light mode') : (ar ? 'تفعيل الوضع الداكن' : 'Switch to dark mode');
  const headerOverlay = theme === 'light'
    ? 'bg-gradient-to-r from-white/18 via-transparent to-white/12'
    : 'bg-gradient-to-r from-[#041c18]/90 via-[#06221d]/75 to-[#041c18]/90';
  const headerVerticalOverlay = theme === 'light'
    ? 'bg-gradient-to-b from-white/10 via-transparent to-white/15'
    : 'bg-gradient-to-b from-[#020908]/30 via-[#020908]/25 to-[#020908]/80';
  const headerContrastOverlay = theme === 'light'
    ? 'bg-gradient-to-b from-slate-950/[0.03] via-transparent to-slate-950/[0.1]'
    : 'bg-gradient-to-b from-black/5 via-transparent to-black/15';
  return (
    <header data-main-header className="relative isolate flex flex-col gap-1.5 overflow-visible rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 shadow-lg shadow-slate-900/10 backdrop-blur-md sm:px-5 sm:py-2.5 dark:border-emerald-400/20 dark:bg-[#071714] dark:shadow-emerald-950/20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl">
        <img
          src={headerBackgrounds.light}
          alt=""
          fetchPriority="high"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ease-in-out ${
            theme === 'light' ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <img
          src={headerBackgrounds.dark}
          alt=""
          fetchPriority="high"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ease-in-out ${
            theme === 'dark' ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className={`absolute inset-0 ${headerOverlay} transition-colors duration-500`} />
        <div className={`absolute inset-0 ${headerVerticalOverlay} transition-colors duration-500`} />
        <div className={`absolute inset-0 ${headerContrastOverlay} transition-colors duration-500`} />
      </div>
      <div className="relative z-10 flex flex-col gap-1.5">
      <div className="main-header-top-bar">
        <div className="flex min-w-0 items-center gap-2 justify-self-start">
          <div className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/75 px-3 text-xs font-bold text-slate-900 shadow-xs backdrop-blur-md dark:border-white/15 dark:bg-black/30 dark:text-white">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#10e588] shadow-[0_0_10px_rgba(16,229,136,0.55)]" />
            <span>{ar ? 'ميزان' : 'Mizan'}</span>
          </div>
          <SyncIndicator lang={lang} userId={currentUser?.id} compact />
        </div>
        <div role="group" aria-label={ar ? 'أدوات اليوم' : 'Day tools'} dir="ltr" className="main-header-tools rounded-2xl border border-white/25 bg-white/10 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_18px_rgba(38,63,48,0.08)] backdrop-blur-sm dark:border-white/[0.12] dark:bg-white/[0.04]">
          <button id="header-logout-btn" type="button" onClick={onLogout} aria-label={ar ? 'تسجيل الخروج' : 'Sign out'} title={ar ? 'تسجيل الخروج' : 'Sign out'} className={logoutControl}><LogOut aria-hidden="true" size={20} strokeWidth={2} className={`${iconMotion} text-slate-600 group-hover:text-red-600 group-focus-visible:text-red-600 dark:text-zinc-300 dark:group-hover:text-red-400 dark:group-focus-visible:text-red-400 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:scale-110`} /></button>
          <button id="header-add-task-btn" type="button" onClick={onOpenAddTask} aria-label={ar ? 'إضافة مهمة جديدة واختيار مكانها' : 'Add a task and choose where it goes'} title={ar ? 'إضافة مهمة جديدة واختيار مكانها' : 'Add a task and choose where it goes'} className={`${control} text-slate-600 enabled:hover:border-emerald-400 enabled:hover:bg-emerald-50 enabled:hover:text-emerald-700 dark:enabled:hover:border-emerald-400/40 dark:enabled:hover:bg-emerald-400/10 dark:enabled:hover:text-emerald-300`}><Plus aria-hidden="true" size={20} strokeWidth={2} className={`${iconMotion} motion-safe:group-hover:rotate-90 motion-safe:group-focus-visible:rotate-90`} /></button>
          <div className="contents">
          {onToggleCardColumns && <button id="header-columns-btn" type="button" onClick={onToggleCardColumns} aria-label={ar ? `${cardColumns} بطاقات بالصف، التبديل إلى ${cardColumns === 4 ? 2 : cardColumns === 2 ? 3 : 4}` : `${cardColumns} cards per row, switch to ${cardColumns === 4 ? 2 : cardColumns === 2 ? 3 : 4}`} title={ar ? `عرض ${cardColumns === 4 ? 2 : cardColumns === 2 ? 3 : 4} بطاقات بالصف` : `Show ${cardColumns === 4 ? 2 : cardColumns === 2 ? 3 : 4} cards per row`} className={control}>{cardColumns === 4 ? <Columns4 aria-hidden="true" size={18} strokeWidth={1.8} /> : cardColumns === 3 ? <Columns3 aria-hidden="true" size={18} strokeWidth={1.8} /> : <Columns2 aria-hidden="true" size={18} strokeWidth={1.8} />}</button>}
          <div id="onboarding-insights-tools" className="contents">
            <button id="header-stats-btn" type="button" onClick={onOpenStats} aria-label={ar ? 'الإحصائيات والتقرير الأسبوعي' : 'Statistics & weekly report'} title={ar ? 'الإحصائيات والتقرير الأسبوعي' : 'Statistics & weekly report'} className={control}><ChartColumnIncreasing aria-hidden="true" size={20} strokeWidth={2} className={`${iconMotion} origin-bottom motion-safe:group-hover:scale-y-125 motion-safe:group-focus-visible:scale-y-125`} /></button>
            <button id="header-archive-btn" type="button" onClick={onOpenArchive} aria-label={ar ? 'الأرشيف وسجل الأيام' : 'Archive & history'} title={ar ? 'الأرشيف وسجل الأيام' : 'Archive & history'} className={control}><Archive aria-hidden="true" size={18} strokeWidth={1.8} className={`${iconMotion} motion-safe:group-hover:translate-y-0.5 motion-safe:group-focus-visible:translate-y-0.5`} /></button>
          </div>
          <button id="header-export-btn" type="button" onClick={onExport} disabled={exporting} aria-busy={exporting} aria-label={ar ? 'تصدير صورة اليوم' : 'Export today as an image'} title={ar ? 'تصدير صورة اليوم' : 'Export today as an image'} className={control}>{exporting ? <Loader2 aria-hidden="true" size={20} strokeWidth={2} className="animate-spin motion-reduce:animate-none" /> : <Share2 aria-hidden="true" size={20} strokeWidth={2} className={`${iconMotion} motion-safe:group-hover:scale-125 motion-safe:group-focus-visible:scale-125`} />}</button>
          </div>
          {dayMemories && <div className="contents" dir="ltr">{dayMemories}</div>}
          <div className="contents">
          <ColorThemePicker lang={lang} className={control} />
          <button id="header-lang-btn" type="button" onClick={onToggleLang} aria-label={ar ? 'Switch to English' : 'التبديل إلى العربية'} title={ar ? 'Switch to English' : 'التبديل إلى العربية'} lang={ar ? 'en' : 'ar'} className={control}>
            {ar ? (
              <ArabicLanguageIcon aria-hidden="true" size={20} className={`${iconMotion} motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:scale-110`} />
            ) : (
              <EnglishLanguageIcon aria-hidden="true" size={20} className={`${iconMotion} motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:scale-110`} />
            )}
          </button>
          <button id="header-theme-btn" type="button" onClick={onToggleTheme} aria-label={themeLabel} title={themeLabel} className={control}>{theme === 'dark' ? <Sun aria-hidden="true" size={20} strokeWidth={2} className={`${iconMotion} motion-safe:group-hover:rotate-90 motion-safe:group-focus-visible:rotate-90`} /> : <MoonStar aria-hidden="true" size={20} strokeWidth={2} className={`${iconMotion} motion-safe:group-hover:-rotate-25 motion-safe:group-focus-visible:-rotate-25`} />}</button>
          <button id="header-settings-btn" type="button" onClick={onOpenSettings} aria-label={ar ? 'الإعدادات' : 'Settings'} title={ar ? 'الإعدادات' : 'Settings'} className={control}>
            <Settings aria-hidden="true" size={20} strokeWidth={2} className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:rotate-45 motion-safe:group-focus-visible:rotate-45" />
          </button>
          </div>
        </div>
        <div className="main-header-actions flex min-w-0 items-center gap-2 justify-self-end">
          <div
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/75 px-3 text-xs font-bold text-slate-900 shadow-xs backdrop-blur-md dark:border-white/15 dark:bg-black/30 dark:text-white select-none"
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
        {onDateChange ? <div className="main-header-clock"><HijriDateNavigation currentDate={currentDate} onDateChange={onDateChange} lang={lang} /></div> : <div className="main-header-clock" />}
        <div className="main-header-secondary-date" dir={ar ? 'rtl' : 'ltr'}>
          {dateNavigation}
        </div>
      </div>
      {children && <div data-main-header-summary className="mt-1 pt-2">
        {children}
      </div>}
      </div>
    </header>
  );
};


