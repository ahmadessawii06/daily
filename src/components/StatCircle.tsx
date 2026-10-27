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
}) => {
  const radius = 23;
  const circumference = 2 * Math.PI * radius; // ≈ 144.51
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, percentage))) / 100;

  const colorConfig = {
    emerald: {
      stroke: '#10e588',
      bgGlow: 'bg-gradient-to-br from-emerald-300/30 via-emerald-400/12 to-transparent dark:from-emerald-300/25 dark:via-emerald-400/15 dark:to-transparent shadow-[0_8px_18px_rgba(16,185,129,0.12)]',
      text: 'text-emerald-600 dark:text-emerald-300',
      activeRing: 'ring-2 ring-[#10e588] ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-emerald-400/20',
    },
    amber: {
      stroke: '#f59e0b',
      bgGlow: 'bg-gradient-to-br from-amber-300/28 via-amber-500/12 to-transparent dark:from-amber-300/22 dark:via-amber-500/15 dark:to-transparent shadow-[0_8px_18px_rgba(245,158,11,0.12)]',
      text: 'text-amber-600 dark:text-amber-400',
      activeRing: 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-amber-500/15',
    },
    rose: {
      stroke: '#ff6b81',
      bgGlow: 'bg-gradient-to-br from-rose-300/28 via-rose-400/12 to-transparent dark:from-rose-300/24 dark:via-rose-400/15 dark:to-transparent shadow-[0_8px_18px_rgba(244,63,94,0.12)]',
      text: 'text-rose-500 dark:text-rose-300',
      activeRing: 'ring-2 ring-[#ff6b81] ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-rose-400/20',
    },
    indigo: {
      stroke: '#6366f1',
      bgGlow: 'bg-gradient-to-br from-indigo-300/26 via-indigo-500/12 to-transparent dark:from-indigo-300/22 dark:via-indigo-500/15 dark:to-transparent shadow-[0_8px_18px_rgba(99,102,241,0.12)]',
      text: 'text-indigo-600 dark:text-indigo-400',
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
        } ${isActive ? colorConfig.activeRing : 'ring-1 ring-white/20 hover:ring-white/50 hover:shadow-md'} `}
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
          className={`progress-value font-numbers ${compact ? 'text-base' : 'text-base sm:text-lg'} font-black tracking-tight ${colorConfig.text}`}
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
          <span className="mt-1 text-[11px] font-numbers font-bold leading-none text-slate-800 dark:text-white/[0.86]">
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
    <button data-progress-tone={color} data-progress-active={isActive} type="button" onClick={onClick} aria-label={`${label}: ${value}`} aria-pressed={isActive}
      className={`${classes} cursor-pointer hover:-translate-y-0.5 hover:scale-105 hover:opacity-100 hover:brightness-105 active:scale-95 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500 rounded-lg`}>
      {content}
    </button>
  ) : <div data-progress-tone={color} data-progress-active={isActive} aria-label={`${label}: ${value}`} className={classes}>{content}</div>;
};

