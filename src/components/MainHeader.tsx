import React from 'react';
import { Plus, Settings } from 'lucide-react';
import { Language, User } from '../types';
import { formatHeaderDate } from '../utils/date';
import { SyncIndicator } from './SyncIndicator';

interface MainHeaderProps {
  currentDate: string;
  currentUser?: User | null;
  onOpenAddTask: () => void;
  onOpenSettings: () => void;
  lang: Language;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ currentDate, currentUser, onOpenAddTask, onOpenSettings, lang }) => {
  const ar = lang === 'ar';
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 dark:border-white/[0.08]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-100/70 px-3 text-xs font-bold text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#10e588]" />
            <span>{ar ? 'ميزان' : 'Mizan'}</span>
          </div>
          <SyncIndicator lang={lang} userId={currentUser?.id} interactive={false} compact />
        </div>
        <div role="group" aria-label={ar ? 'أدوات اليوم' : 'Day tools'} className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onOpenSettings} aria-label={ar ? 'الإعدادات' : 'Settings'} title={ar ? 'الإعدادات' : 'Settings'} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100/70 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-white">
            <Settings aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
          <button type="button" onClick={onOpenAddTask} aria-label={ar ? 'إضافة مهمة جديدة' : 'Add new task'} title={ar ? 'إضافة مهمة جديدة' : 'Add new task'} className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10e588] text-emerald-950 transition-colors hover:bg-[#0fd07b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">
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
