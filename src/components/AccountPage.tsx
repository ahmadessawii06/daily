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
  const ar = lang === 'ar';
  return <main dir={ar ? 'rtl' : 'ltr'} className={`${className} min-h-screen bg-slate-50 px-3.5 py-6 text-slate-900 dark:bg-[#080D14] dark:text-zinc-100 sm:px-6 sm:py-8`}>
    <div className={`mx-auto max-w-5xl ${compact ? 'space-y-6' : 'space-y-6 sm:space-y-8'}`}>
      <header className={`${compact ? 'space-y-4 pb-5' : 'space-y-6 pb-6'} border-b border-slate-200/80 dark:border-white/[0.08]`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label={ar ? 'مسار التنقل' : 'Breadcrumb'} className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#00C896] shadow-[0_0_8px_rgba(0,200,150,0.5)]" />
            <span className="font-bold text-slate-900 dark:text-white">{ar ? 'ميزان' : 'Mizan'}</span>
            <span className="text-slate-300 dark:text-white/20">/</span>
            <span>{ar ? 'مساحتك' : 'Your space'}</span>
          </nav>
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-[#00C896]/50 hover:bg-[#00C896]/10 hover:text-[#00C896] focus-visible:outline-2 focus-visible:outline-[#00C896] dark:border-white/[0.08] dark:bg-[#141D29] dark:text-[#C3CEDD] dark:hover:border-[#00C896]/50 dark:hover:bg-[#00C896]/10 dark:hover:text-[#00C896] cursor-pointer"
          >
            <Back aria-hidden="true" size={15} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>{backLabel || (ar ? 'العودة إلى اليوم' : 'Back to today')}</span>
          </button>
        </div>
        <div className="space-y-1">
          <h1 ref={heading} tabIndex={-1} className={`${compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'} font-extrabold tracking-tight text-slate-900 dark:text-white outline-none font-['Alexandria','Cairo',sans-serif]`}>
            {title}
          </h1>
          <p className={`${compact ? 'text-xs sm:text-sm leading-relaxed' : 'text-sm leading-relaxed'} max-w-2xl text-slate-500 dark:text-[#94A3B8]`}>
            {description}
          </p>
        </div>
      </header>
      {children}
    </div>
  </main>;
}
