import { Sparkles, Compass, Clock, ArrowRight } from 'lucide-react';

interface ComingSoonFeatureProps {
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: typeof Compass;
}

export function ComingSoonFeature({
  title,
  badge,
  subtitle,
  description,
  features,
  icon: Icon,
}: ComingSoonFeatureProps) {
  return (
    <section dir="rtl" className="w-full py-6 sm:py-10 px-3 sm:px-6">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-white/90 via-slate-50/80 to-white/95 p-6 sm:p-10 shadow-2xl backdrop-blur-xl dark:border-emerald-400/25 dark:from-[#06221d]/90 dark:via-[#041a16]/80 dark:to-[#031310]/95 text-slate-800 dark:text-white transition-all">
        {/* Decorative Ambient Background Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl dark:bg-emerald-500/20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-teal-400/15 blur-3xl dark:bg-teal-400/20"
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300">
            <Sparkles size={14} className="animate-pulse text-amber-500 dark:text-amber-300" />
            <span>{badge}</span>
          </div>

          {/* Main Floating Icon */}
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/30 bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 shadow-lg shadow-emerald-950/20 ring-4 ring-emerald-500/10">
            <Icon size={38} className="text-emerald-600 dark:text-teal-300 drop-shadow-sm" />
          </div>

          {/* Titles */}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm sm:text-base font-semibold text-emerald-700 dark:text-emerald-300">
            {subtitle}
          </p>
          <p className="mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
            {description}
          </p>

          {/* Feature Highlights Grid */}
          <div className="mt-8 grid w-full grid-cols-1 sm:grid-cols-2 gap-3 text-right">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3.5 shadow-xs transition hover:border-emerald-500/40 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-emerald-400/40"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-teal-300">
                  <ArrowRight size={14} className="rotate-180" />
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom ETA Indicator */}
          <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <Clock size={14} className="text-amber-500" />
            <span>قيد العمل والتحسين والتطوير الفاخر • متاح قريباً بإذن الله</span>
          </div>
        </div>
      </div>
    </section>
  );
}

