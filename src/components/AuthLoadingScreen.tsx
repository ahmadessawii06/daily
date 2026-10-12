import { Scale } from 'lucide-react';
import type { Language, Theme } from '../types';

export type AuthLoadingStage = 'login' | 'register' | 'preparing';

interface AuthLoadingScreenProps {
  stage: AuthLoadingStage;
  lang: Language;
  theme: Theme;
}

export function AuthLoadingScreen({ stage, lang, theme }: AuthLoadingScreenProps) {
  const isArabic = lang === 'ar';
  const isDark = theme === 'dark';
  const messages = isArabic
    ? {
        login: ['جارٍ تسجيل دخولك', 'لحظات ونعود إلى يومك.'],
        register: ['جارٍ إنشاء حسابك', 'بداية جديدة، ومساحة لما يهمك.'],
        preparing: ['نجهّز مساحتك', 'جارٍ تحميل جدولك وإعداداتك.'],
      }
    : {
        login: ['Signing you in', 'A moment, then back to your day.'],
        register: ['Creating your account', 'A fresh start. Room for what matters.'],
        preparing: ['Preparing your workspace', 'Loading your schedule and preferences.'],
      };
  const [title, description] = messages[stage];

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      data-auth-loading={stage}
      className={`relative isolate flex min-h-screen min-h-[100dvh] w-full items-center justify-center overflow-hidden px-6 py-12 font-['Alexandria','Cairo',sans-serif] ${isDark ? 'bg-[#091B16] text-[#F4F0E5]' : 'bg-[#F8F6EF] text-[#193E30]'}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className={`absolute inset-0 ${isDark ? 'bg-[radial-gradient(ellipse_at_50%_35%,rgba(73,114,80,0.22),transparent_65%)]' : 'bg-[radial-gradient(ellipse_at_50%_35%,rgba(205,175,101,0.15),transparent_65%)]'}`} />
        <div className={`absolute left-1/2 top-1/2 h-[min(80vw,34rem)] w-[min(80vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border ${isDark ? 'border-[#D5C397]/[0.06]' : 'border-[#816830]/[0.08]'}`} />
      </div>

      <div className="relative w-full max-w-sm text-center">
        <div aria-hidden="true" className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center">
          <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D5C397]/15' : 'border-[#816830]/15'}`} />
          <div className={`absolute inset-0 rounded-full border-2 border-transparent motion-safe:animate-spin ${isDark ? 'border-t-[#D5C397]' : 'border-t-[#816830]'}`} />
          <div className={`flex h-20 w-20 items-center justify-center rounded-full ${isDark ? 'bg-[#D5C397]/[0.06] text-[#D5C397]' : 'bg-[#816830]/[0.06] text-[#816830]'}`}>
            <Scale className="h-10 w-10" strokeWidth={1.35} />
          </div>
        </div>

        <p className="mb-10 text-3xl font-bold tracking-tight">{isArabic ? 'ميزان' : 'MIZAN'}</p>
        <div role="status" aria-live="polite" aria-atomic="true">
          <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
          <p className={`mt-3 text-sm leading-7 ${isDark ? 'text-[#B2C3B7]' : 'text-[#5B6C5E]'}`}>{description}</p>
        </div>

        <div aria-hidden="true" className={`mx-auto mt-8 h-1 w-36 overflow-hidden rounded-full ${isDark ? 'bg-[#D5C397]/15' : 'bg-[#816830]/15'}`}>
          <div className={`auth-loading-bar h-full w-1/3 rounded-full ${isDark ? 'bg-[#D5C397]' : 'bg-[#816830]'}`} />
        </div>
        <p className={`mt-12 text-xs ${isDark ? 'text-[#95AC9C]' : 'text-[#657A68]'}`}>
          {isArabic ? 'خطوة صغيرة نحو يوم أكثر توازنًا' : 'A small step toward a more balanced day'}
        </p>
      </div>
    </main>
  );
}
