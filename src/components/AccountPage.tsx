import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Language } from '../types';

interface AccountPageProps {
  lang: Language;
  title: string;
  description: string;
  onBack: () => void;
  backLabel?: string;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function AccountPage({ lang, title, description, onBack, backLabel, compact = false, className = '', children }: AccountPageProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [title]);
  const Back = lang === 'ar' ? ArrowRight : ArrowLeft;
  return <main dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`${className} min-h-screen bg-slate-50 px-3 py-5 text-slate-900 dark:bg-[#07080b] dark:text-zinc-100 sm:px-6 sm:py-8`}>
    <div className={`mx-auto max-w-6xl ${compact ? 'space-y-5' : 'space-y-6 sm:space-y-8'}`}>
      <header className={`${compact ? 'space-y-4 pb-5' : 'space-y-6 pb-6'} border-b border-slate-200/80 dark:border-white/[0.08]`}>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-bold"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#10e588]" />{lang === 'ar' ? 'ميزان' : 'Mizan'}<span className="ms-1 text-slate-300 dark:text-zinc-700">/</span><span className="font-normal text-slate-500 dark:text-zinc-400">{lang === 'ar' ? 'مساحتك' : 'Your space'}</span></span>
          <button type="button" onClick={onBack} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:border-white/10 dark:bg-white/[.03] dark:text-zinc-300 dark:hover:bg-white/[.06]"><Back aria-hidden="true" size={15} />{backLabel || (lang === 'ar' ? 'العودة إلى اليوم' : 'Back to today')}</button>
        </div>
        <div><h1 ref={heading} tabIndex={-1} className={`${compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-bold tracking-tight outline-none`}>{title}</h1><p className={`${compact ? 'mt-2 text-[11px] leading-6' : 'mt-3 text-xs leading-7 sm:text-sm'} max-w-2xl text-slate-500 dark:text-zinc-400`}>{description}</p></div>
      </header>
      {children}
    </div>
  </main>;
}
