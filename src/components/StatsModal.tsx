import React from 'react';
import { X, BarChart3 } from 'lucide-react';
import { Language } from '../types';
import { WeeklyReview } from './WeeklyReview';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onNavigateToDay: (dateStr: string) => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onNavigateToDay,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0e1017] border border-slate-200/80 dark:border-white/[0.1] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden font-['Alexandria']"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'ar' ? 'الإحصائيات والتقرير الأسبوعي' : 'Weekly Statistics & Insights'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {lang === 'ar' ? 'تحليل شامل للإنجاز والعادات خلال الأسبوع' : 'Comprehensive review of your daily performance & habits'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <WeeklyReview
            lang={lang}
            onNavigateToDay={(dateStr) => {
              onNavigateToDay(dateStr);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};
