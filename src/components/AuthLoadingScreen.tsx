import { CalendarDays, Check, LayoutGrid, Scale, Sparkles, Target } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Language, Theme } from '../types';

export type AuthLoadingStage = 'login' | 'register' | 'preparing';
interface AuthLoadingScreenProps { stage: AuthLoadingStage; lang: Language; theme: Theme; }

export function AuthLoadingScreen({ stage, lang, theme }: AuthLoadingScreenProps) {
  const ar = lang === 'ar';
  const messages = ar ? {
    login: ['يومك الحلو يبدأ من هون.', 'جارٍ تسجيل دخولك، لحظات وتكون في مساحتك.'],
    register: ['مساحة جديدة. احتمالات أكثر.', 'جارٍ إنشاء حسابك، وبداية حكايتك مع ميزان.'],
    preparing: ['نرتّب المساحة ليومك.', 'نحمّل جدولك وتفضيلاتك، لتكمل من حيث توقفت.'],
  } : {
    login: ['A good day starts here.', 'Signing you in. Your space is just a moment away.'],
    register: ['Fresh space. More possibilities.', 'Creating your account. Your Mizan story starts here.'],
    preparing: ['Making room for your day.', 'Loading your schedule and preferences. Pick up where you left off.'],
  };
  const [title, description] = messages[stage];
  const steps = ar ? ['الدخول إلى حسابك', 'تجهيز مساحتك'] : ['Accessing your account', 'Preparing your workspace'];
  return <main dir={ar ? 'rtl' : 'ltr'} data-auth-loading={stage} data-loading-theme={theme} className="auth-scene relative isolate flex min-h-[100dvh] w-full flex-col overflow-hidden px-5 py-7 font-['Alexandria','Cairo',sans-serif] sm:px-10 sm:py-9">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="auth-aurora auth-aurora-one" /><div className="auth-aurora auth-aurora-two" />
      <div className="auth-scene-grid absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,var(--auth-bg)_85%)]" />
      {[0, 1, 2, 3, 4, 5].map(i => <span key={i} className="auth-particle" style={{ '--i': i } as CSSProperties} />)}
    </div>
    <header className="auth-enter relative flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5"><span className="auth-brand flex size-9 items-center justify-center rounded-xl"><Scale size={20} strokeWidth={1.6} /></span><span className="text-sm font-bold tracking-tight">{ar ? 'ميزان' : 'MIZAN'}<span className="ms-2 text-[9px] font-normal tracking-[.16em] opacity-40">YOUR DAILY SPACE</span></span></div>
      <span className="hidden items-center gap-2 text-[10px] opacity-60 sm:inline-flex"><span className="auth-status-dot size-1.5 rounded-full" />{ar ? 'مساحة لما يهمّك' : 'Room for what matters'}</span>
    </header>
    <div className="relative flex flex-1 flex-col items-center justify-center py-12 sm:py-16">
      <div aria-hidden="true" className="auth-visual relative mb-8 flex h-56 w-full max-w-[650px] items-center justify-center sm:mb-10 sm:h-64">
        <div className="auth-orbit auth-orbit-outer" /><div className="auth-orbit auth-orbit-inner" />
        <div className="auth-core-glow absolute size-36 rounded-full" />
        <div className="auth-core relative flex size-24 items-center justify-center rounded-[28px] sm:size-28 sm:rounded-[32px]">
          <Scale size={45} strokeWidth={1.25} /><span className="auth-core-scan absolute inset-0 rounded-[inherit]" />
          <span className="auth-spark absolute -end-2 -top-2 flex size-8 items-center justify-center rounded-xl"><Sparkles size={14} /></span>
        </div>
        <div className="auth-float-card auth-float-start absolute start-0 top-0 max-w-[155px] rounded-2xl p-3 sm:start-4 sm:top-3 sm:max-w-[190px] sm:p-4">
          <div className="mb-3 flex items-center gap-2"><span className="auth-mini-icon flex size-7 items-center justify-center rounded-lg"><Target size={14} /></span><span className="text-[10px] font-semibold">{ar ? 'مساحة للتركيز' : 'Space to focus'}</span></div>
          <div className="flex items-center gap-2"><span className="auth-check flex size-4 items-center justify-center rounded-full"><Check size={10} /></span><span className="auth-skeleton h-1.5 w-20 rounded-full" /></div>
          <div className="mt-2.5 flex items-center gap-2 opacity-40"><span className="size-4 rounded-full border border-current" /><span className="auth-skeleton h-1.5 w-14 rounded-full" /></div>
        </div>
        <div className="auth-float-card auth-float-end absolute bottom-0 end-0 w-36 rounded-2xl p-3 sm:bottom-2 sm:end-4 sm:w-44 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3"><span className="text-[10px] font-semibold">{ar ? 'كل يوم، بداية' : 'A fresh start, daily'}</span><CalendarDays size={14} className="shrink-0 opacity-60" /></div>
          <div className="flex h-10 items-end gap-1.5">{[35, 60, 42, 76, 55, 90, 70].map((height, i) => <span key={i} className="auth-chart-bar flex-1 rounded-t-sm" style={{ height: `${height}%`, '--i': i } as CSSProperties} />)}</div>
        </div>
        <span className="auth-float-tag absolute bottom-2 start-7 hidden items-center gap-2 rounded-full px-3 py-2 text-[9px] sm:inline-flex"><LayoutGrid size={12} />{ar ? 'يومك، بطريقتك' : 'Your day, your way'}</span>
      </div>
      <div className="auth-enter relative w-full max-w-xl text-center" role="status" aria-live="polite" aria-atomic="true">
        <p className="auth-eyebrow mb-4 inline-flex items-center gap-2 text-[10px] font-medium"><span className="auth-loading-dots inline-flex gap-1" aria-hidden="true"><i /><i /><i /></span>{ar ? 'قليل من الهدوء، وكثير من الإمكانات' : 'A little calm. A lot of possibility.'}</p>
        <h1 className="text-[clamp(1.55rem,4vw,2.6rem)] font-bold leading-[1.65] tracking-tight">{title}</h1>
        <p className="auth-muted mx-auto mt-3 max-w-md text-xs leading-7 sm:text-sm">{description}</p>
      </div>
      <div className="auth-enter mt-8 w-full max-w-[290px]" aria-hidden="true">
        <div className="auth-progress h-1 overflow-hidden rounded-full"><div className="auth-loading-bar h-full w-1/3 rounded-full" /></div>
        <div className="auth-muted mt-4 flex items-center justify-between gap-3 text-[9px] sm:text-[10px]">{steps.map((step, index) => <span key={step} className={`inline-flex items-center gap-1.5 ${index === (stage === 'preparing' ? 1 : 0) ? 'auth-current-step' : 'opacity-45'}`}><span className="flex size-4 items-center justify-center rounded-full border border-current text-[8px]">{index + 1}</span>{step}</span>)}</div>
      </div>
    </div>
    <footer className="auth-enter auth-muted relative flex flex-wrap items-center justify-center gap-2 text-center text-[9px] leading-6 sm:justify-between sm:text-[10px]"><span>{ar ? 'خطوة صغيرة نحو يوم أكثر توازنًا' : 'A small step toward a more balanced day'}</span><span className="hidden tracking-[.22em] opacity-50 sm:inline">LESS NOISE. MORE LIFE.</span></footer>
  </main>;
}
