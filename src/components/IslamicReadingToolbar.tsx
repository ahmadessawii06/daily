import React from 'react';
import { StretchHorizontal, Expand, Maximize2, Minimize2 } from 'lucide-react';

export type ReadingViewMode = 'fit-screen' | 'fit-width';

export interface IslamicReadingToolbarProps {
  viewMode: ReadingViewMode;
  onViewModeChange: (mode: ReadingViewMode) => void;
  zoomLevel: number;
  onZoomLevelChange: (zoom: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  className?: string;
}

export const IslamicReadingToolbar: React.FC<IslamicReadingToolbarProps> = ({
  viewMode,
  onViewModeChange,
  zoomLevel,
  onZoomLevelChange,
  isFullscreen,
  onToggleFullscreen,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2.5 shrink-0 flex-wrap sm:flex-nowrap ${className}`}>
      {/* View Mode Segmented Control: [ملء الصفحة | ملء العرض] */}
      <div className="flex items-center p-0.5 rounded-lg border border-slate-200/90 bg-slate-100/90 dark:border-white/10 dark:bg-white/5 text-xs shadow-2xs shrink-0">
        <button
          type="button"
          onClick={() => onViewModeChange('fit-screen')}
          className={`flex items-center gap-1 h-6 sm:h-6.5 px-2 rounded-md font-bold transition cursor-pointer ${
            viewMode === 'fit-screen'
              ? 'bg-white text-emerald-800 dark:bg-white/15 dark:text-emerald-300 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white'
          }`}
          title="ملء الصفحة: عرض متناسق ومريح للقراءة في منتصف الشاشة (اختصار W)"
        >
          <StretchHorizontal size={12} />
          <span className="hidden sm:inline">ملء الصفحة</span>
          <span className="sm:hidden">الصفحة</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange('fit-width')}
          className={`flex items-center gap-1 h-6 sm:h-6.5 px-2 rounded-md font-bold transition cursor-pointer ${
            viewMode === 'fit-width'
              ? 'bg-white text-emerald-800 dark:bg-white/15 dark:text-emerald-300 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white'
          }`}
          title="ملء العرض: توسيع المحتوى لكامل عرض الشاشة (اختصار W)"
        >
          <Expand size={12} />
          <span className="hidden sm:inline">ملء العرض</span>
          <span className="sm:hidden">العرض</span>
        </button>
      </div>

      <div className="hidden sm:block h-4.5 w-px bg-slate-200/90 dark:bg-white/10 shrink-0" />

      {/* Quick Zoom Presets: [100% | 150% | 200% | 300%] */}
      <div className="flex items-center gap-1 shrink-0">
        {[
          { label: '100%', val: 100 },
          { label: '150%', val: 150 },
          { label: '200%', val: 200 },
          { label: '300%', val: 300 },
        ].map(preset => (
          <button
            key={preset.val}
            type="button"
            onClick={() => onZoomLevelChange(preset.val)}
            className={`h-7 sm:h-7.5 px-2 rounded-lg text-[11px] font-numbers font-bold border transition cursor-pointer text-center ${
              zoomLevel === preset.val
                ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-slate-950 shadow-2xs'
                : 'border-slate-200/90 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-700 dark:text-zinc-300 dark:hover:bg-white/10'
            }`}
            title={`نسبة تكبير سريعة ${preset.label}`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="hidden sm:block h-4.5 w-px bg-slate-200/90 dark:bg-white/10 shrink-0" />

      {/* Fullscreen Button */}
      <button
        type="button"
        onClick={onToggleFullscreen}
        className="flex items-center gap-1.5 h-7 sm:h-7.5 px-2 sm:px-2.5 rounded-lg border border-slate-200/90 bg-white dark:border-white/10 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-white/10 transition shadow-2xs cursor-pointer select-none"
        title={isFullscreen ? 'الخروج من الشاشة الكاملة (اختصار F)' : 'شاشة كاملة (اختصار F)'}
        aria-label="شاشة كاملة"
      >
        {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        <span className="hidden md:inline">{isFullscreen ? 'إنهاء الشاشة الكاملة' : 'شاشة كاملة'}</span>
        <kbd className="hidden lg:inline text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-zinc-400">
          F
        </kbd>
      </button>
    </div>
  );
};

