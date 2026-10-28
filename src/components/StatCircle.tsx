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
      stroke: '#10e588',
      bgGlow: 'bg-gradient-to-br from-emerald-300/30 via-emerald-400/12 to-transparent dark:from-emerald-300/25 dark:via-emerald-400/15 dark:to-transparent shadow-[0_8px_18px_rgba(16,185,129,0.12)]',
      text: 'text-emerald-700 dark:text-emerald-300',
      valueText: 'text-emerald-600 dark:text-emerald-400',
      subLabelText: 'text-emerald-700/85 dark:text-emerald-400/90',
      activeRing: 'ring-2 ring-[#10e588] ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-emerald-400/20',
    },
    amber: {
      stroke: '#f59e0b',
      bgGlow: 'bg-gradient-to-br from-amber-300/28 via-amber-500/12 to-transparent dark:from-amber-300/22 dark:via-amber-500/15 dark:to-transparent shadow-[0_8px_18px_rgba(245,158,11,0.12)]',
      text: 'text-amber-700 dark:text-amber-300',
      valueText: 'text-amber-600 dark:text-amber-400',
      subLabelText: 'text-amber-700/85 dark:text-amber-400/90',
      activeRing: 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-amber-500/15',
    },
    rose: {
      stroke: '#ff6b81',
      bgGlow: 'bg-gradient-to-br from-rose-300/28 via-rose-400/12 to-transparent dark:from-rose-300/24 dark:via-rose-400/15 dark:to-transparent shadow-[0_8px_18px_rgba(244,63,94,0.12)]',
      text: 'text-rose-700 dark:text-rose-300',
      valueText: 'text-rose-600 dark:text-rose-400',
      subLabelText: 'text-rose-700/85 dark:text-rose-400/90',
      activeRing: 'ring-2 ring-[#ff6b81] ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-rose-400/20',
    },
    indigo: {
      stroke: '#6366f1',
      bgGlow: 'bg-gradient-to-br from-indigo-300/26 via-indigo-500/12 to-transparent dark:from-indigo-300/22 dark:via-indigo-500/15 dark:to-transparent shadow-[0_8px_18px_rgba(99,102,241,0.12)]',
      text: 'text-indigo-700 dark:text-indigo-300',
      valueText: 'text-indigo-600 dark:text-indigo-400',
      subLabelText: 'text-indigo-700/85 dark:text-indigo-400/90',
      activeRing: 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-indigo-500/15',
    },
  }[color];

  const content = (
    <>
      {/* Circle Body */}
      <div
        className={`progress-body relative ${compact ? 'w-12 h-12' : 'w-14 h-14 sm:w-16 sm:h-16'} rounded-full flex items-center justify-center transition-all duration-200 motion-reduce:transition-none shadow-2xs ${
          colorConfig.bgGlow
        } ${isActive ? colorConfig.activeRing : 'ring-1 ring-white/20 group-hover:ring-2 group-hover:ring-current/60 group-hover:scale-105 group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] group-hover:brightness-110'} `}
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
            strokeWidth="3.5"
            className={`progress-track ${colorConfig.track} dark:text-zinc-300/75`}
          />
          {/* Active progress arc */}
          {percentage > 0 && (
            <circle
              cx="27"
              cy="27"
              r={radius}
              fill="none"
              stroke={`var(--progress-color, ${colorConfig.stroke})`}
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out motion-reduce:transition-none"
            />
          )}
        </svg>

        {/* Number inside Circle */}
        <span
          className={`progress-value font-numbers text-lg font-black leading-none tracking-tight sm:text-xl ${colorConfig.valueText}`}
        >
          {value}
        </span>
      </div>

      {/* Label & Details underneath Circle */}
      <div className="flex max-w-full flex-col items-center mt-1.5 leading-tight text-center">
        <span
            className={`${compact ? 'text-[11px] leading-snug' : 'text-xs'} font-bold font-['Alexandria'] ${
            isActive ? colorConfig.text : compact ? 'text-slate-800 dark:text-white/[0.9]' : 'text-slate-700 dark:text-zinc-300'
          }`}
        >
          {label}
        </span>
        {subLabel && (
          <span className={`progress-sublabel mt-1 text-[11px] font-numbers font-bold leading-none ${colorConfig.subLabelText}`}>
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
    <button data-progress-tone={color} data-progress-active={isActive} type="button" onClick={onClick} aria-label={title || `${label}: ${value}`} aria-pressed={isActive}
      className={`${classes} relative cursor-pointer hover:-translate-y-0.5 active:scale-95 motion-reduce:transform-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:rounded-full bg-transparent border-0 p-0`}>
      {content}
      {title && (
        <div
          role="tooltip"
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out whitespace-nowrap"
        >
          <div dir="auto" className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold font-['Alexandria'] backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.45)] bg-white/95 text-slate-800 border border-slate-200/90 dark:bg-[#06201a]/95 dark:text-emerald-300 dark:border-emerald-400/30">
            <span>{title}</span>
          </div>
        </div>
      )}
    </button>
  ) : <div data-progress-tone={color} data-progress-active={isActive} aria-label={`${label}: ${value}`} className={classes}>{content}</div>;
};

