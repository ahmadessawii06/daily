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
}) => {
  const radius = 23;
  const circumference = 2 * Math.PI * radius; // ≈ 144.51
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, percentage))) / 100;

  const colorConfig = {
    emerald: {
      stroke: '#10e588',
      bgGlow: 'bg-emerald-400/15 dark:bg-emerald-400/20',
      text: 'text-emerald-600 dark:text-emerald-300',
      activeRing: 'ring-2 ring-[#10e588] ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-emerald-400/20',
    },
    amber: {
      stroke: '#f59e0b',
      bgGlow: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-600 dark:text-amber-400',
      activeRing: 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-amber-500/15',
    },
    rose: {
      stroke: '#ff6b81',
      bgGlow: 'bg-rose-400/15 dark:bg-rose-400/20',
      text: 'text-rose-500 dark:text-rose-300',
      activeRing: 'ring-2 ring-[#ff6b81] ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-rose-400/20',
    },
    indigo: {
      stroke: '#6366f1',
      bgGlow: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      text: 'text-indigo-600 dark:text-indigo-400',
      activeRing: 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-[#11131a]',
      track: 'text-indigo-500/15',
    },
  }[color];

  const content = (
    <>
      {/* Circle Body */}
      <div
        className={`relative ${compact ? 'w-12 h-12' : 'w-14 h-14 sm:w-16 sm:h-16'} rounded-full flex items-center justify-center transition-all duration-200 motion-reduce:transition-none shadow-2xs ${
          colorConfig.bgGlow
        } ${isActive ? colorConfig.activeRing : 'hover:shadow-xs'}`}
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
            className={`${colorConfig.track} dark:text-zinc-300/75`}
          />
          {/* Active progress arc */}
          {percentage > 0 && (
            <circle
              cx="27"
              cy="27"
              r={radius}
              fill="none"
              stroke={colorConfig.stroke}
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
          className={`font-numbers ${compact ? 'text-base' : 'text-base sm:text-lg'} font-black tracking-tight ${colorConfig.text}`}
        >
          {value}
        </span>
      </div>

      {/* Label & Details underneath Circle */}
      <div className="flex max-w-full flex-col items-center mt-1.5 leading-tight text-center">
        <span
          className={`${compact ? 'text-[10px]' : 'text-[11px] sm:text-xs'} font-bold font-['Alexandria'] ${
            isActive ? colorConfig.text : 'text-slate-700 dark:text-zinc-300'
          }`}
        >
          {label}
        </span>
        {subLabel && (
          <span className="text-[10px] font-numbers font-medium text-slate-400 dark:text-zinc-500 mt-0.5">
            {subLabel}
          </span>
        )}
      </div>
    </>
  );
  const classes = `group flex min-w-0 flex-col items-center select-none transition-all duration-200 motion-reduce:transition-none ${
    isActive ? 'scale-105' : 'opacity-90'
  }`;
  return onClick ? (
    <button type="button" onClick={onClick} aria-label={`${label}: ${value}`} aria-pressed={isActive}
      className={`${classes} cursor-pointer hover:scale-105 hover:opacity-100 active:scale-95 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500 rounded-lg`}>
      {content}
    </button>
  ) : <div aria-label={`${label}: ${value}`} className={classes}>{content}</div>;
};

