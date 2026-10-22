import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  TrendingUp,
  MoonStar,
  BarChart3,
  PartyPopper,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Compass,
  Archive,
  Camera,
  Columns4,
  Globe,
  Palette,
  Settings,
  Sun,
  BookOpenText,
  Power,
  LayoutGrid,
  Image as ImageIcon,
} from 'lucide-react';
import type { Language, Theme } from '../types';

export interface OnboardingTourProps {
  isOpen: boolean;
  lang: Language;
  theme: Theme;
  onClose: (skipped: boolean) => void;
  onOpenAddTask: () => void;
  currentTasksCount?: number;
}

interface StepConfig {
  id: string;
  type: 'modal' | 'spotlight';
  targetSelector?: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  badgeText?: { ar: string; en: string };
  icon: React.ComponentType<{ className?: string; size?: number }>;
  interactive?: boolean;
}

export const STEPS: StepConfig[] = [
  // Step 1 — Welcome
  {
    id: 'welcome',
    type: 'modal',
    title: {
      ar: 'أهلاً بك في ميزان ✨',
      en: 'Welcome to Mizan ✨',
    },
    description: {
      ar: 'ميزان مساحتك لتنظيم يومك، وترتيب مهامك، ومتابعة إنجازاتك، حتى توازن بين وقتك وأولوياتك.',
      en: 'Mizan is your space to organize your day, structure your tasks, and track your achievements, balancing your time and priorities.',
    },
    icon: Sparkles,
  },
  // Step 2 — Explore Your Daily Planner
  {
    id: 'planner-area',
    type: 'spotlight',
    targetSelector: '#onboarding-planner-area',
    title: {
      ar: 'يومك، على طريقتك 📅',
      en: 'Your day, your way 📅',
    },
    description: {
      ar: 'هون بتقدر ترتّب مهام يومك، تحدد وقت لكل مهمة، أو تضيف مهام بدون وقت محدد.',
      en: 'Here you can arrange your day’s tasks, set a specific time for each, or add flexible unscheduled tasks.',
    },
    icon: Calendar,
  },
  // Date Navigation & Calendar
  {
    id: 'date-navigation',
    type: 'spotlight',
    targetSelector: '#onboarding-date-navigation',
    title: {
      ar: 'التنقل بين الأيام والتقويم 📅',
      en: 'Date Navigation & Calendar 📅',
    },
    description: {
      ar: 'تنقل بسهولة بين الأيام السابقة والقادمة بالأسهم، أو اضغط على التاريخ لفتح التقويم واختيار أي يوم محدد.',
      en: 'Easily jump between previous and future days using the arrows, or click the date to open the calendar picker.',
    },
    icon: Calendar,
  },
  // Planning View Switcher
  {
    id: 'view-switcher',
    type: 'spotlight',
    targetSelector: '#onboarding-view-switcher',
    title: {
      ar: 'طريقة عرض المهام (الجدول والبطاقات) 📋',
      en: 'Planning View (Timeline & Cards) 📋',
    },
    description: {
      ar: 'اختر أسلوب العرض المفضل لديك: عرض "البطاقات" لتنظيم المهام حسب الفئات، أو عرض "الجدول" لترتيب المهام على الساعات الزمنية.',
      en: 'Choose your preferred layout: "Cards" view for category-based organization, or "Timeline" view for an hourly schedule.',
    },
    icon: LayoutGrid,
  },
  // Step 3 — Create Your First Task
  {
    id: 'create-task',
    type: 'spotlight',
    targetSelector: '#header-add-task-btn',
    title: {
      ar: 'خلّينا نضيف أول مهمة ✨',
      en: 'Let’s add your first task ✨',
    },
    description: {
      ar: 'اضغط على إضافة مهمة، واكتب أول شغلة حابب تنجزها اليوم.',
      en: 'Click Add Task, and write down the first thing you want to accomplish today.',
    },
    icon: Plus,
    interactive: true,
  },
  // Step 4 — Track Your Progress
  {
    id: 'track-progress',
    type: 'spotlight',
    targetSelector: '#onboarding-today-progress',
    title: {
      ar: 'كل إنجاز إله قيمة 📈',
      en: 'Every achievement counts 📈',
    },
    description: {
      ar: 'كل ما تنجز مهمة، علّمها كمكتملة وشوف نسبة إنجازك كيف بتتقدم خلال اليوم.',
      en: 'Whenever you complete a task, mark it as done and watch your completion rate advance during the day.',
    },
    icon: TrendingUp,
  },
  // Step 5 — Prayer Times
  {
    id: 'prayer-times',
    type: 'spotlight',
    targetSelector: '#onboarding-prayer-card',
    title: {
      ar: 'خلي يومك متوازن 🕌',
      en: 'Keep your day balanced 🕌',
    },
    description: {
      ar: 'تابع مواقيت الصلاة من نفس المكان، ورتّب يومك بطريقة تناسب أولوياتك.',
      en: 'Track prayer times right from your planner, and arrange your day around your spiritual rhythm and priorities.',
    },
    icon: MoonStar,
  },
  // Day Journal
  {
    id: 'day-journal',
    type: 'spotlight',
    targetSelector: '#header-day-journal-btn',
    title: {
      ar: 'خلّي ليومك أثر (اليوميات والملاحظات) 📖',
      en: 'Leave a Trace (Daily Journal) 📖',
    },
    description: {
      ar: 'مساحة هادئة لتدوين يومياتك، خواطرك، وتأملاتك، لتوثيق أفكارك وما تعلمته وعشته خلال يومك.',
      en: 'A quiet space to write down your journal reflections, thoughts, and insights from your day.',
    },
    icon: BookOpenText,
  },
  // Day Photo
  {
    id: 'day-photo',
    type: 'spotlight',
    targetSelector: '#header-day-photo-btn',
    title: {
      ar: 'صورة اليوم (معرض الذكريات) 🖼️',
      en: 'Photo of the Day (Memories) 🖼️',
    },
    description: {
      ar: 'التقط أو أرفق صورة مميزة من يومك لتوثيق لحظة جميلة أو إنجاز قمت به، وتصفحها لاحقاً في الأرشيف.',
      en: 'Capture or upload a photo from your day to preserve moments and achievements in your memory archive.',
    },
    icon: ImageIcon,
  },
  // Step 6 — Color Themes
  {
    id: 'header-palette',
    type: 'spotlight',
    targetSelector: '#header-palette-btn',
    title: {
      ar: 'لوحة الثيمات والألوان 🎨',
      en: 'Color Themes & Styling 🎨',
    },
    description: {
      ar: 'خصص ألوان الواجهة وثيم مساحتك (ميزان المطور، الزمردي، الليلي، البنفسجي، وغيرها) ليتناسب مع ذوقك.',
      en: 'Personalize the interface colors and vibe (Mizan Developed, Emerald, Midnight, etc.) to match your taste.',
    },
    icon: Palette,
  },
  // Step 7 — Card Columns
  {
    id: 'header-columns',
    type: 'spotlight',
    targetSelector: '#header-columns-btn',
    title: {
      ar: 'أعمدة لوحة البطاقات 4 ⏸️',
      en: 'Card Columns Layout 4 ⏸️',
    },
    description: {
      ar: 'تحكم في تقسيم الشاشة: التبديل بين عرض 4 أو 3 أو 2 بطاقات في الصف الواحد حسب حجم شاشتك وراحتك.',
      en: 'Control your screen layout: switch between 4, 3, or 2 cards per row to best fit your display.',
    },
    icon: Columns4,
  },
  // Step 8 — Archive & History
  {
    id: 'header-archive',
    type: 'spotlight',
    targetSelector: '#header-archive-btn',
    title: {
      ar: 'الأرشيف وسجل الأيام 🗃️',
      en: 'Archive & History 🗃️',
    },
    description: {
      ar: 'تصفح الأيام السابقة بالكامل، وراجع ما أنجزته، واطلع على مذكراتك وصور الأيام الماضية.',
      en: 'Browse past days, review completed tasks, and look back at your daily journals and captured photos.',
    },
    icon: Archive,
  },
  // Step 9 — Statistics & Weekly Report
  {
    id: 'header-stats',
    type: 'spotlight',
    targetSelector: '#header-stats-btn',
    title: {
      ar: 'الإحصائيات والتقرير الأسبوعي 📊',
      en: 'Statistics & Weekly Report 📊',
    },
    description: {
      ar: 'تابع نسب إنجازك اليومية والأسبوعية، وسلاسل الاستمرار (Streaks)، وتعرف على نمط إنتاجيتك بالأرقام.',
      en: 'Track daily and weekly completion rates, habit streaks, and analyze your productivity with clear metrics.',
    },
    icon: BarChart3,
  },
  // Step 10 — Export Day as Image
  {
    id: 'header-export',
    type: 'spotlight',
    targetSelector: '#header-export-btn',
    title: {
      ar: 'تصدير صورة اليوم 📷',
      en: 'Export Today as Image 📷',
    },
    description: {
      ar: 'ولّد صورة عالية الدقة ومنظمة لجدول يومك وإنجازاتك لتشاركها مع أصدقائك أو تحفظها كذكرى.',
      en: 'Generate and download a clean, high-resolution snapshot of your full day’s plan and accomplishments.',
    },
    icon: Camera,
  },
  // Step 11 — Language Toggle
  {
    id: 'header-lang',
    type: 'spotlight',
    targetSelector: '#header-lang-btn',
    title: {
      ar: 'تبديل لغة الواجهة 🌐',
      en: 'Language Switcher 🌐',
    },
    description: {
      ar: 'التحويل الفوري بين اللغة العربية (مع دعم كامل لاتجاه اليمين لليسار وخط الإسكندرية) والإنجليزية.',
      en: 'Instantly toggle between Arabic (RTL layout with Alexandria typography) and English.',
    },
    icon: Globe,
  },
  // Step 12 — Dark / Light Mode
  {
    id: 'header-theme',
    type: 'spotlight',
    targetSelector: '#header-theme-btn',
    title: {
      ar: 'الوضع الداكن والفاتح ☀️ / 🌙',
      en: 'Dark & Light Mode ☀️ / 🌙',
    },
    description: {
      ar: 'بدّل بسهولة بين الوضع المظلم المريح للعينين بالمساء، والوضع الفاتح المناسب لإنتاجية النهار.',
      en: 'Easily switch between an eye-friendly dark theme at night and a crisp light theme for daytime focus.',
    },
    icon: Sun,
  },
  // Step 13 — Settings
  {
    id: 'header-settings',
    type: 'spotlight',
    targetSelector: '#header-settings-btn',
    title: {
      ar: 'الإعدادات وإدارة الحساب ⚙️',
      en: 'Settings & Account ⚙️',
    },
    description: {
      ar: 'إدارة حسابك، متابعة المزامنة السحابية، وضبط التفضيلات، وإعادة تشغيل هذه الجولة بأي وقت.',
      en: 'Manage your account, monitor cloud sync status, customize preferences, and replay this tour anytime.',
    },
    icon: Settings,
  },
  // Logout
  {
    id: 'header-logout',
    type: 'spotlight',
    targetSelector: '#header-logout-btn',
    title: {
      ar: 'تسجيل الخروج الآمن ⏻',
      en: 'Sign Out ⏻',
    },
    description: {
      ar: 'تسجيل الخروج الآمن من حسابك مع حفظ ومزامنة كافة بياناتك ومهامك محلياً وسحابياً بأمان.',
      en: 'Safely sign out from your account while ensuring all your tasks and data are saved and synced.',
    },
    icon: Power,
  },
  // Final Step
  {
    id: 'final',
    type: 'modal',
    title: {
      ar: 'هيك صرت جاهز! 🎉',
      en: 'You’re all set! 🎉',
    },
    description: {
      ar: 'صار عندك كل اللي بتحتاجه لتبدأ يومك بتنظيم ووضوح. ابدأ بخطوة صغيرة، وكل يوم رح تشوف الفرق.',
      en: 'You now have everything you need to start your day with organization and clarity. Start small, and you’ll see the difference every day.',
    },
    icon: PartyPopper,
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export function OnboardingTour({
  isOpen,
  lang,
  onClose,
  onOpenAddTask,
  currentTasksCount = 0,
}: OnboardingTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(true);
  const initialTasksCountRef = useRef(currentTasksCount);
  const [taskAddedDuringTour, setTaskAddedDuringTour] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const ar = lang === 'ar';
  const currentStep = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Track task creation during tour
  useEffect(() => {
    if (currentTasksCount > initialTasksCountRef.current) {
      setTaskAddedDuringTour(true);
    }
  }, [currentTasksCount]);

  // Target element locator & bounding box updater
  const updateTargetRect = useCallback(() => {
    if (!isOpen || currentStep.type !== 'spotlight' || !currentStep.targetSelector) {
      setTargetRect(null);
      setIsMeasuring(false);
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (!el) {
      // Fallback: try finding parent or main
      setTargetRect(null);
      setIsMeasuring(false);
      return;
    }

    const domRect = el.getBoundingClientRect();
    const padding = 8;
    setTargetRect({
      top: Math.max(0, domRect.top - padding),
      left: Math.max(0, domRect.left - padding),
      width: domRect.width + padding * 2,
      height: domRect.height + padding * 2,
      right: domRect.right + padding,
      bottom: domRect.bottom + padding,
    });
    setIsMeasuring(false);
  }, [isOpen, currentStep]);

  // Scroll target into view and update rect on step change
  useEffect(() => {
    if (!isOpen) return;

    if (currentStep.type === 'spotlight' && currentStep.targetSelector) {
      setIsMeasuring(true);
      const timer = setTimeout(() => {
        const el = document.querySelector(currentStep.targetSelector!);
        if (el) {
          const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          el.scrollIntoView({
            behavior: reducedMotion ? 'instant' : 'smooth',
            block: 'center',
            inline: 'nearest',
          });
          // Update rect after scroll settles
          requestAnimationFrame(() => {
            updateTargetRect();
          });
        } else {
          updateTargetRect();
        }
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setTargetRect(null);
      setIsMeasuring(false);
    }
  }, [isOpen, currentStepIndex, currentStep, updateTargetRect]);

  // Listen to window resize and scroll
  useEffect(() => {
    if (!isOpen || currentStep.type !== 'spotlight') return;

    const handleUpdate = () => {
      requestAnimationFrame(updateTargetRect);
    };

    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('scroll', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
    };
  }, [isOpen, currentStep, updateTargetRect]);

  // Keyboard navigation: Escape skips, Arrows/Enter navigate
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose(true);
      } else if (e.key === 'ArrowLeft') {
        if (ar && currentStepIndex < STEPS.length - 1) {
          e.preventDefault();
          setCurrentStepIndex(i => i + 1);
        } else if (!ar && currentStepIndex > 0) {
          e.preventDefault();
          setCurrentStepIndex(i => i - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (ar && currentStepIndex > 0) {
          e.preventDefault();
          setCurrentStepIndex(i => i - 1);
        } else if (!ar && currentStepIndex < STEPS.length - 1) {
          e.preventDefault();
          setCurrentStepIndex(i => i + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, ar, onClose]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (isLastStep) {
      onClose(false);
    } else {
      setCurrentStepIndex(i => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(i => i - 1);
    }
  };

  const handleSkip = () => {
    onClose(true);
  };

  const StepIcon = currentStep.icon;

  // Compute tooltip position relative to viewport
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: 'min(420px, calc(100vw - 32px))',
        width: '100%',
        zIndex: 105,
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = Math.min(380, viewportWidth - 32);
    const margin = 14;

    // Decide vertical placement: if target is in upper 45% of viewport, place below; else above
    const placeBelow = targetRect.top < viewportHeight * 0.45;
    let top = placeBelow ? targetRect.bottom + margin : targetRect.top - margin;

    // Horizontal placement: align near target center, clamped to screen edges
    const targetCenterX = targetRect.left + targetRect.width / 2;
    let left = targetCenterX - tooltipWidth / 2;

    // Ensure within horizontal boundaries
    left = Math.max(16, Math.min(left, viewportWidth - tooltipWidth - 16));

    // Ensure within vertical boundaries
    if (placeBelow) {
      if (top + 220 > viewportHeight) {
        top = Math.max(16, targetRect.top - 240);
      }
    } else {
      if (top < 16) {
        top = targetRect.bottom + margin;
      }
    }

    return {
      position: 'fixed',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: `${tooltipWidth}px`,
      zIndex: 105,
      transform: !placeBelow ? 'translateY(-100%)' : undefined,
    };
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={currentStep.title[lang]}
      dir={ar ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[100] font-['Alexandria','Cairo',sans-serif] select-none pointer-events-none"
    >
      {/* Spotlight Backdrops (4-slice layout prevents blocking clicks inside the cutout) */}
      {currentStep.type === 'spotlight' && targetRect ? (
        <>
          {/* Top slice */}
          <div
            className="fixed inset-x-0 top-0 bg-slate-950/75 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
            style={{ height: `${Math.max(0, targetRect.top)}px` }}
            onClick={currentStep.interactive ? undefined : handleNext}
          />
          {/* Bottom slice */}
          <div
            className="fixed inset-x-0 bottom-0 bg-slate-950/75 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
            style={{ top: `${targetRect.bottom}px` }}
            onClick={currentStep.interactive ? undefined : handleNext}
          />
          {/* Left slice */}
          <div
            className="fixed bg-slate-950/75 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
            style={{
              top: `${targetRect.top}px`,
              bottom: `${Math.max(0, window.innerHeight - targetRect.bottom)}px`,
              left: 0,
              width: `${Math.max(0, targetRect.left)}px`,
            }}
            onClick={currentStep.interactive ? undefined : handleNext}
          />
          {/* Right slice */}
          <div
            className="fixed bg-slate-950/75 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
            style={{
              top: `${targetRect.top}px`,
              bottom: `${Math.max(0, window.innerHeight - targetRect.bottom)}px`,
              left: `${targetRect.right}px`,
              right: 0,
            }}
            onClick={currentStep.interactive ? undefined : handleNext}
          />

          {/* Spotlight Highlight Ring */}
          <div
            className="fixed pointer-events-none rounded-2xl ring-2 ring-[#10e588] shadow-[0_0_25px_rgba(16,229,136,0.35)] transition-all duration-300"
            style={{
              top: `${targetRect.top}px`,
              left: `${targetRect.left}px`,
              width: `${targetRect.width}px`,
              height: `${targetRect.height}px`,
              zIndex: 101,
            }}
          />

          {/* Click shield for non-interactive steps: blocks clicks so the user doesn't activate underlying buttons */}
          {!currentStep.interactive && (
            <div
              className="fixed pointer-events-auto cursor-default rounded-2xl"
              style={{
                top: `${targetRect.top}px`,
                left: `${targetRect.left}px`,
                width: `${targetRect.width}px`,
                height: `${targetRect.height}px`,
                zIndex: 102,
              }}
              title={ar ? 'استخدم أزرار الجولة للمتابعة' : 'Use tour buttons to navigate'}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onPointerDown={e => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          )}
        </>
      ) : (
        /* Full Backdrop for Modal Steps */
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-[4px] transition-opacity duration-300 pointer-events-auto"
          onClick={handleSkip}
        />
      )}

      {/* MODAL STEP 1: WELCOME MODAL */}
      {currentStep.type === 'modal' && isFirstStep && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 pointer-events-auto">
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 text-slate-900 shadow-2xl transition-all dark:border-[#293646] dark:bg-[#12161f] dark:text-zinc-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Ambient decorative glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 end-0 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl dark:bg-emerald-500/10"
            />

            <div className="relative space-y-6">
              {/* Header Badge & Icon */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <Compass className="h-4 w-4 animate-spin-slow" />
                  <span>{ar ? 'جولة البداية' : 'Quick Tour'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSkip}
                  aria-label={ar ? 'تخطي الجولة' : 'Skip tour'}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-zinc-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {currentStep.title[lang]}
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-zinc-300">
                  {currentStep.description[lang]}
                </p>
              </div>

              {/* Three Pillars Micro-cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.03]">
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mb-1.5" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {ar ? 'جدولك اليومي' : 'Daily Planner'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {ar ? 'رتّب مهامك بحرية' : 'Organize smoothly'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.03]">
                  <MoonStar className="h-4 w-4 text-amber-500 dark:text-amber-400 mb-1.5" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {ar ? 'مواقيت الصلاة' : 'Prayer Times'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {ar ? 'توازن مع روحك' : 'Stay grounded'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.03]">
                  <TrendingUp className="h-4 w-4 text-blue-500 dark:text-blue-400 mb-1.5" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {ar ? 'متابعة الإنجاز' : 'Track Progress'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {ar ? 'احتفل بخطواتك' : 'Celebrate milestones'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                >
                  {ar ? 'تخطي الجولة' : 'Skip Tour'}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all dark:bg-[#10e588] dark:text-emerald-950 dark:hover:bg-[#0fd07b]"
                >
                  <span>{ar ? 'يلا نبدأ' : 'Let’s Start'}</span>
                  {ar ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL STEP 7: FINAL COMPLETION SCREEN */}
      {currentStep.type === 'modal' && isLastStep && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 pointer-events-auto">
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 text-center text-slate-900 shadow-2xl transition-all dark:border-[#293646] dark:bg-[#12161f] dark:text-zinc-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Ambient decorative glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 inset-x-0 mx-auto h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl"
            />

            <div className="relative space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20 animate-bounce">
                <PartyPopper className="h-8 w-8 stroke-[2.2]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {currentStep.title[lang]}
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
                  {currentStep.description[lang]}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onClose(false)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-600/25 active:scale-98 transition-all dark:bg-[#10e588] dark:text-emerald-950 dark:hover:bg-[#0fd07b]"
                >
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                  <span>{ar ? 'ابدأ يومي' : 'Start My Day'}</span>
                </button>
                <p className="mt-3 text-[11px] text-slate-400 dark:text-zinc-500">
                  {ar ? 'بتقدر ترجع للجولة بأي وقت من الإعدادات.' : 'You can revisit the tour anytime from Settings.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SPOTLIGHT STEPS (2, 3, 4, 5, 6) TOOLTIP CARD */}
      {currentStep.type === 'spotlight' && (
        <div
          ref={tooltipRef}
          style={getTooltipStyle()}
          className="pointer-events-auto rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-4 sm:p-5 text-slate-900 shadow-2xl transition-all duration-200 dark:border-white/15 dark:bg-[#12161f]/95 dark:text-zinc-100"
          onClick={e => e.stopPropagation()}
        >
          {/* Card Header: Icon, Step Counter, and Close */}
          <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <StepIcon size={15} />
              </span>
              <span className="font-numbers text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                {ar ? `${currentStepIndex + 1} من ${STEPS.length}` : `${currentStepIndex + 1} of ${STEPS.length}`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              aria-label={ar ? 'تخطي الجولة' : 'Skip tour'}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {currentStep.title[lang]}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
              {currentStep.description[lang]}
            </p>
          </div>

          {/* Interactive Feature for Step 3: Create First Task */}
          {currentStep.id === 'create-task' && (
            <div className="mt-3 space-y-2">
              {taskAddedDuringTour ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{ar ? 'رائع! تمت إضافة مهمتك الأولى بنجاح 👏' : 'Awesome! Your first task was added successfully 👏'}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAddTask}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>{ar ? 'فتح نافذة إضافة مهمة الآن' : 'Open task creator now'}</span>
                </button>
              )}
            </div>
          )}

          {/* Step Controls: Back, Skip, Next */}
          <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={handleSkip}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
            >
              {ar ? 'تخطي الجولة' : 'Skip Tour'}
            </button>

            <div className="flex items-center gap-1.5">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {ar ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5 text-slate-400" />}
                  <span>{ar ? 'السابق' : 'Back'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm transition-all active:scale-95 dark:bg-[#10e588] dark:text-emerald-950 dark:hover:bg-[#0fd07b] cursor-pointer"
              >
                <span>{ar ? 'التالي' : 'Next'}</span>
                {ar ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
