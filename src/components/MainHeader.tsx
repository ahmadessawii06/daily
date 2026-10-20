import React from 'react';
import { Archive, BarChart3, Camera, Loader2, Power, Moon, Plus, Settings, Sun } from 'lucide-react';
import { Language, Theme, User } from '../types';
import { formatHeaderDate } from '../utils/date';
import { SyncIndicator } from './SyncIndicator';
import { ColorThemePicker } from './ColorThemePicker';

interface MainHeaderProps {
  children?: React.ReactNode;
  currentDate: string;
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

export const MainHeader: React.FC<MainHeaderProps> = ({ children, currentDate, currentUser, onOpenAddTask, onOpenSettings, lang, theme, onToggleTheme, onToggleLang, onExport, exporting, onOpenArchive, onOpenStats, onLogout }) => {
  const ar = lang === 'ar';
  const hover = 'transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out enabled:hover:border-emerald-400/60 enabled:hover:bg-emerald-50 enabled:hover:text-emerald-700 enabled:hover:shadow-[0_6px_20px_-6px_rgba(16,185,129,0.4)] motion-safe:enabled:hover:-translate-y-0.5 motion-safe:enabled:active:translate-y-0 motion-safe:enabled:active:scale-95 motion-reduce:transition-none dark:enabled:hover:border-emerald-400/40 dark:enabled:hover:bg-emerald-400/10 dark:enabled:hover:text-emerald-300';
  const control = `group flex h-11 min-w-11 cursor-pointer shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100/70 px-2 text-xs font-semibold text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-wait disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300 ${hover}`;
  const iconMotion = 'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out';
  const themeLabel = theme === 'dark' ? (ar ? 'تفعيل الوضع الفاتح' : 'Switch to light mode') : (ar ? 'تفعيل الوضع الداكن' : 'Switch to dark mode');
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 dark:border-white/[0.08]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-100/70 px-3 text-xs font-bold text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#10e588]" />
            <span>{ar ? 'ميزان' : 'Mizan'}</span>
          </div>
          <SyncIndicator lang={lang} userId={currentUser?.id} compact />
        </div>
        <div role="group" aria-label={ar ? 'أدوات اليوم' : 'Day tools'} className="order-3 col-span-2 flex max-w-full flex-wrap items-center justify-end gap-2 sm:order-none sm:justify-start">
          <ColorThemePicker lang={lang} className={control} />
          <button type="button" onClick={onOpenArchive} aria-label={ar ? 'الأرشيف وسجل الأيام' : 'Archive & history'} title={ar ? 'الأرشيف وسجل الأيام' : 'Archive & history'} className={control}><Archive aria-hidden="true" size={18} className={`${iconMotion} motion-safe:group-hover:translate-y-0.5 motion-safe:group-focus-visible:translate-y-0.5`} /></button>
          <button type="button" onClick={onOpenStats} aria-label={ar ? 'الإحصائيات والتقرير الأسبوعي' : 'Statistics & weekly report'} title={ar ? 'الإحصائيات والتقرير الأسبوعي' : 'Statistics & weekly report'} className={control}><BarChart3 aria-hidden="true" size={18} className={`${iconMotion} origin-bottom motion-safe:group-hover:scale-y-125 motion-safe:group-focus-visible:scale-y-125`} /></button>
          <button type="button" onClick={onExport} disabled={exporting} aria-busy={exporting} aria-label={ar ? 'تصدير صورة اليوم' : 'Export today as an image'} title={ar ? 'تصدير صورة اليوم' : 'Export today as an image'} className={control}>{exporting ? <Loader2 aria-hidden="true" size={18} className="animate-spin motion-reduce:animate-none" /> : <Camera aria-hidden="true" size={18} className={`${iconMotion} motion-safe:group-hover:scale-125 motion-safe:group-focus-visible:scale-125`} />}</button>
          <button type="button" onClick={onToggleLang} aria-label={ar ? 'Switch to English' : 'التبديل إلى العربية'} title={ar ? 'Switch to English' : 'التبديل إلى العربية'} lang={ar ? 'en' : 'ar'} className={control}><span className={`${iconMotion} inline-block motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:scale-110`}>{ar ? 'EN' : 'AR'}</span></button>
          <button type="button" onClick={onToggleTheme} aria-label={themeLabel} title={themeLabel} className={control}>{theme === 'dark' ? <Sun aria-hidden="true" size={18} className={`${iconMotion} motion-safe:group-hover:rotate-90 motion-safe:group-focus-visible:rotate-90`} /> : <Moon aria-hidden="true" size={18} className={`${iconMotion} motion-safe:group-hover:-rotate-25 motion-safe:group-focus-visible:-rotate-25`} />}</button>
          <button type="button" onClick={onOpenSettings} aria-label={ar ? 'الإعدادات' : 'Settings'} title={ar ? 'الإعدادات' : 'Settings'} className={control}>
            <Settings aria-hidden="true" className="h-[18px] w-[18px] motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:rotate-45 motion-safe:group-focus-visible:rotate-45" strokeWidth={1.8} />
          </button>

        </div>
        <div className="order-2 flex shrink-0 items-center gap-2 sm:order-none">
          <button type="button" onClick={onLogout} aria-label={ar ? 'تسجيل الخروج' : 'Sign out'} title={ar ? 'تسجيل الخروج' : 'Sign out'} className={`${ar ? 'order-last' : 'order-first'} group flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-[#e51010] bg-[#e51010] text-black transition-[transform,background-color,border-color,box-shadow] duration-200 hover:border-[#d00f0f] hover:bg-[#d00f0f] hover:shadow-[0_6px_20px_-6px_rgba(229,16,16,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 motion-reduce:transition-none`}><Power aria-hidden="true" size={19} strokeWidth={2} className={`${iconMotion} motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-12 motion-safe:group-focus-visible:scale-110`} /></button>
          <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onOpenAddTask} aria-label={ar ? 'إضافة مهمة جديدة' : 'Add new task'} title={ar ? 'إضافة مهمة جديدة' : 'Add new task'} className="group flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-[#10e588] text-emerald-950 transition-colors hover:bg-[#0fd07b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">
            <Plus aria-hidden="true" className={`${iconMotion} h-5 w-5 motion-safe:group-hover:rotate-90 motion-safe:group-focus-visible:rotate-90`} strokeWidth={2.3} />
          </button>
          </div>
        </div>
      </div>
      <h1 className="text-xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-2xl md:text-3xl">
        <time dateTime={currentDate}>{formatHeaderDate(currentDate, lang)}</time>
      </h1>
      {children}
    </header>
  );
};
