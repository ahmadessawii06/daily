import React from 'react';
import { Archive, BarChart3, Camera, Loader2, Moon, Plus, Settings, Sun } from 'lucide-react';
import { Language, Theme, User } from '../types';
import { formatHeaderDate } from '../utils/date';
import { SyncIndicator } from './SyncIndicator';

interface MainHeaderProps {
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
}

export const MainHeader: React.FC<MainHeaderProps> = ({ currentDate, currentUser, onOpenAddTask, onOpenSettings, lang, theme, onToggleTheme, onToggleLang, onExport, exporting, onOpenArchive, onOpenStats }) => {
  const ar = lang === 'ar';
  const hover = 'transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out enabled:hover:border-emerald-400/60 enabled:hover:bg-emerald-50 enabled:hover:text-emerald-700 enabled:hover:shadow-[0_6px_20px_-6px_rgba(16,185,129,0.4)] motion-safe:enabled:hover:-translate-y-0.5 motion-safe:enabled:active:translate-y-0 motion-safe:enabled:active:scale-95 motion-reduce:transition-none dark:enabled:hover:border-emerald-400/40 dark:enabled:hover:bg-emerald-400/10 dark:enabled:hover:text-emerald-300';
  const control = `group flex h-11 min-w-11 cursor-pointer shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100/70 px-2 text-xs font-semibold text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-wait disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300 ${hover}`;
  const themeLabel = theme === 'dark' ? (ar ? 'تفعيل الوضع الفاتح' : 'Switch to light mode') : (ar ? 'تفعيل الوضع الداكن' : 'Switch to dark mode');
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 dark:border-white/[0.08]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-100/70 px-3 text-xs font-bold text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#10e588]" />
            <span>{ar ? 'ميزان' : 'Mizan'}</span>
          </div>
          <SyncIndicator lang={lang} userId={currentUser?.id} interactive={false} compact />
        </div>
        <div role="group" aria-label={ar ? 'أدوات اليوم' : 'Day tools'} className="flex max-w-full flex-wrap items-center gap-2">
          <button type="button" onClick={onOpenArchive} aria-label={ar ? 'الأرشيف وسجل الأيام' : 'Archive & history'} title={ar ? 'الأرشيف وسجل الأيام' : 'Archive & history'} className={control}><Archive aria-hidden="true" size={18} /></button>
          <button type="button" onClick={onOpenStats} aria-label={ar ? 'الإحصائيات والتقرير الأسبوعي' : 'Statistics & weekly report'} title={ar ? 'الإحصائيات والتقرير الأسبوعي' : 'Statistics & weekly report'} className={control}><BarChart3 aria-hidden="true" size={18} /></button>
          <button type="button" onClick={onExport} disabled={exporting} aria-busy={exporting} aria-label={ar ? 'تصدير صورة اليوم' : 'Export today as an image'} title={ar ? 'تصدير صورة اليوم' : 'Export today as an image'} className={control}>{exporting ? <Loader2 aria-hidden="true" size={18} className="animate-spin motion-reduce:animate-none" /> : <Camera aria-hidden="true" size={18} />}</button>
          <button type="button" onClick={onToggleLang} aria-label={ar ? 'Switch to English' : 'التبديل إلى العربية'} title={ar ? 'Switch to English' : 'التبديل إلى العربية'} lang={ar ? 'en' : 'ar'} className={control}>{ar ? 'EN' : 'AR'}</button>
          <button type="button" onClick={onToggleTheme} aria-label={themeLabel} title={themeLabel} className={control}>{theme === 'dark' ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />}</button>
          <button type="button" onClick={onOpenSettings} aria-label={ar ? 'الإعدادات' : 'Settings'} title={ar ? 'الإعدادات' : 'Settings'} className={control}>
            <Settings aria-hidden="true" className="h-[18px] w-[18px] motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:rotate-45" strokeWidth={1.8} />
          </button>
          <button type="button" onClick={onOpenAddTask} aria-label={ar ? 'إضافة مهمة جديدة' : 'Add new task'} title={ar ? 'إضافة مهمة جديدة' : 'Add new task'} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-[#10e588] text-emerald-950 transition-colors hover:bg-[#0fd07b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">
            <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={2.3} />
          </button>
        </div>
      </div>
      <h1 className="text-xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-2xl md:text-3xl">
        <time dateTime={currentDate}>{formatHeaderDate(currentDate, lang)}</time>
      </h1>
    </header>
  );
};
