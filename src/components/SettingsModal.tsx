import React from 'react';
import { X, Languages, RotateCcw, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Language, Theme } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onToggleLang: () => void;
  onResetData: () => void;
  theme: Theme;
  onSetTheme: (theme: Theme) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onToggleLang,
  onResetData,
  theme,
  onSetTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0d0e14] border border-slate-200 dark:border-white/[0.12] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden max-h-[88dvh] overflow-y-auto transition-colors"
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400" />

        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 end-4 sm:top-5 sm:end-5 p-2 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-5 font-['Alexandria','Cairo']">
          {lang === 'ar' ? 'الإعدادات والمظهر' : 'Settings & Appearance'}
        </h2>

        <div className="space-y-3.5">

          {/* Theme Selector (Dark / Light) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 font-['Alexandria']">
                {lang === 'ar' ? 'وضع المظهر' : 'Appearance'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                {theme === 'dark' ? (lang === 'ar' ? 'داكن' : 'Dark') : (lang === 'ar' ? 'فاتح' : 'Light')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Dark mode button */}
              <button
                type="button"
                onClick={() => onSetTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-950 text-white border-emerald-400 ring-2 ring-emerald-400/30 shadow-sm'
                    : 'bg-white dark:bg-white/[0.04] text-slate-700 dark:text-zinc-400 border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400 stroke-[2.5]" />
                <span>{lang === 'ar' ? 'الوضع الداكن' : 'Dark Mode'}</span>
              </button>

              {/* Light mode button */}
              <button
                type="button"
                onClick={() => onSetTheme('light')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-slate-950 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md font-extrabold'
                    : 'bg-white dark:bg-white/[0.04] text-slate-700 dark:text-zinc-400 border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
                <span>{lang === 'ar' ? 'الوضع الفاتح' : 'Light Mode'}</span>
              </button>
            </div>
          </div>
          
          {/* Language Selection */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/[0.06] text-slate-700 dark:text-white flex items-center justify-center">
                <Languages className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block font-['Alexandria']">
                  {lang === 'ar' ? 'لغة الواجهة' : 'App Language'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  {lang === 'ar' ? 'العربية (Alexandria Font)' : 'English (LTR)'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleLang}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-100 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.15] rounded-xl border border-slate-200 dark:border-white/[0.1] transition-all cursor-pointer shadow-2xs"
            >
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>

          {/* Reset Seed Schedule */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block font-['Alexandria']">
                  {lang === 'ar' ? 'الجدول الأصلي' : 'Seed Schedule'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  {lang === 'ar' ? 'استعادة جدول 23 سبتمبر' : 'Restore initial timetable'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(lang === 'ar' ? 'هل تريد استعادة الجدول الأولي؟' : 'Reset schedule data to initial seed?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 bg-rose-100 dark:bg-rose-500/15 hover:bg-rose-200 dark:hover:bg-rose-500/25 rounded-xl border border-rose-300 dark:border-rose-500/30 transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'استعادة' : 'Reset'}
            </button>
          </div>

          {/* Privacy & Storage Note */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/20 flex items-start gap-3 text-xs text-slate-700 dark:text-zinc-300">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5 font-['Alexandria']">
                {lang === 'ar' ? 'حفظ محلي آمن 100%' : '100% Offline & Private'}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
                {lang === 'ar' 
                  ? 'جميع المهام والتواريخ وإعدادات المظهر مخزنة بأمان في متصفحك.'
                  : 'All your tasks, history, and theme settings are safely kept in your browser.'}
              </span>
            </div>
          </div>

        </div>

        <div className="mt-6 pt-3 border-t border-slate-200 dark:border-white/[0.08] text-center">
          <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono font-medium">
            Daily • Designed for High Productivity
          </p>
        </div>

      </div>
    </div>
  );
};
