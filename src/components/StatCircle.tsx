import React from 'react';

interface StatCircleProps {
  label: string;
  value: number;
  percentage: number;
  color: 'emerald' | 'amber' | 'rose' | 'indigo';
  isActive: boolean;
  onClick?: () => void;
  compact?: boolean;
  subLabel?: string;
  className?: string;
  title?: string;
}

export const StatCircle: React.FC<StatCircleProps> = ({
  label,
  value,
  percentage,
  color,
  isActive,
  onClick,
  subLabel,
  compact = false,
  className = '',
  title,
}) => {
  const radius = 23;
  const circumference = 2 * Math.PI * radius; // ≈ 144.51
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, percentage))) / 100;

  const colorConfig = {
    emerald: {
      stroke: '#059669',
      bgGlow: 'bg-emerald-500/[0.08] dark:bg-emerald-400/[0.1] border border-emerald-500/20 dark:border-emerald-400/20',
      text: 'text-emerald-800 dark:text-emerald-300',
      valueText: 'text-emerald-700 dark:text-emerald-300',
      subLabelText: 'text-emerald-700/80 dark:text-emerald-400/80 font-bold',
      activeRing: 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-[#06201a]',
      track: 'text-emerald-500/15 dark:text-emerald-400/15',
    },
    amber: {
      stroke: '#d97706',
      bgGlow: 'bg-amber-500/[0.08] dark:bg-amber-400/[0.1] border border-amber-500/20 dark:border-amber-400/20',
      text: 'text-amber-800 dark:text-amber-300',
      valueText: 'text-amber-700 dark:text-amber-300',
      subLabelText: 'text-amber-700/80 dark:text-amber-400/80 font-bold',
      activeRing: 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-[#06201a]',
      track: 'text-amber-500/15 dark:text-amber-400/15',
    },
    rose: {
      stroke: '#e11d48',
      bgGlow: 'bg-rose-500/[0.08] dark:bg-rose-400/[0.1] border border-rose-500/20 dark:border-rose-400/20',
      text: 'text-rose-800 dark:text-rose-300',
      valueText: 'text-rose-700 dark:text-rose-300',
      subLabelText: 'text-rose-700/80 dark:text-rose-400/80 font-bold',
      activeRing: 'ring-2 ring-rose-500 ring-offset-2 ring-offset-white dark:ring-offset-[#06201a]',
      track: 'text-rose-500/15 dark:text-rose-400/15',
    },
    indigo: {
      stroke: '#4f46e5',
      bgGlow: 'bg-indigo-500/[0.08] dark:bg-indigo-400/[0.1] border border-indigo-500/20 dark:border-indigo-400/20',
      text: 'text-indigo-800 dark:text-indigo-300',
      valueText: 'text-indigo-700 dark:text-indigo-300',
      subLabelText: 'text-indigo-700/80 dark:text-indigo-400/80 font-bold',
      activeRing: 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-[#06201a]',
      track: 'text-indigo-500/15 dark:text-indigo-400/15',
    },
  }[color];

  const content = (
    <>
      {/* Circle Body */}
      <div
        className={`progress-body relative ${compact ? 'w-12 h-12 sm:w-13 sm:h-13' : 'w-14 h-14 sm:w-16 sm:h-16'} rounded-full flex items-center justify-center transition-all duration-200 motion-reduce:transition-none shadow-2xs ${
          colorConfig.bgGlow
        } ${isActive ? colorConfig.activeRing : 'hover:scale-105 hover:border-current/40'} `}
      >
        <svg
          viewBox="0 0 54 54"
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none transform-gpu"
        >
          {/* Background track */}
          <circle
            cx="27"
            cy="27"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            className={`progress-track ${colorConfig.track}`}
          />
          {/* Active progress arc */}
          {percentage > 0 && (
            <circle
              cx="27"
              cy="27"
              r={radius}
              fill="none"
              stroke={`var(--progress-color, ${colorConfig.stroke})`}
              strokeWidth="2.8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out motion-reduce:transition-none"
            />
          )}
        </svg>

        {/* Number inside Circle */}
        <span
          className={`progress-value font-numbers text-base font-black leading-none tracking-tight sm:text-lg ${colorConfig.valueText}`}
        >
          {value}
        </span>
      </div>

      {/* Label & Details underneath Circle */}
      <div className="flex max-w-full flex-col items-center mt-1.5 leading-tight text-center">
        <span
          className={`${compact ? 'text-[11px] leading-snug' : 'text-xs'} font-bold font-['Alexandria'] ${
            isActive ? colorConfig.text : compact ? 'text-slate-800 dark:text-zinc-200 font-bold' : 'text-slate-800 dark:text-zinc-200'
          }`}
        >
          {label}
        </span>
        {subLabel && (
          <span className={`progress-sublabel mt-0.5 text-[10px] sm:text-[11px] font-numbers font-semibold leading-none ${colorConfig.subLabelText}`}>
            {subLabel}
          </span>
        )}
      </div>
    </>
  );

  const classes = `group flex min-w-0 flex-col items-center select-none transition-all duration-200 motion-reduce:transition-none ${className} ${
    isActive ? 'scale-105' : ''
  }`;

  return onClick ? (
    <button
      data-progress-tone={color}
      data-progress-active={isActive}
      type="button"
      onClick={onClick}
      aria-label={title || `${label}: ${value}`}
      aria-pressed={isActive}
      className={`${classes} relative hover:z-30 cursor-pointer hover:-translate-y-0.5 active:scale-95 motion-reduce:transform-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:rounded-full bg-transparent border-0 p-0`}
    >
      {content}
      {title && (
        <div
          role="tooltip"
          aria-hidden="true"
          className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out whitespace-nowrap"
        >
          <div className="mx-auto w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-white/95 dark:border-b-[#06201a]/95 -mb-[1px]" />
          <div dir="auto" className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold font-['Alexandria'] backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.45)] bg-white/95 text-slate-800 border border-slate-200/90 dark:bg-[#06201a]/95 dark:text-emerald-300 dark:border-emerald-400/30">
            <span>{title}</span>
          </div>
        </div>
      )}
    </button>
  ) : (
    <div data-progress-tone={color} data-progress-active={isActive} aria-label={`${label}: ${value}`} className={classes}>
      {content}
    </div>
  );
};
