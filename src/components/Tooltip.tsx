import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  position = 'bottom',
  className = '',
}) => {
  return (
    <div className={`group/tooltip relative inline-flex items-center justify-center ${className}`}>
      {children}
      <div
        role="tooltip"
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 opacity-0 scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-200 ease-out whitespace-nowrap ${
          position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}
      >
        <div dir="auto" className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold font-['Alexandria'] backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.45)] bg-white/95 text-slate-800 border border-slate-200/90 dark:bg-[#06201a]/95 dark:text-emerald-300 dark:border-emerald-400/30">
          <span>{text}</span>
        </div>
      </div>
    </div>
  );
};
