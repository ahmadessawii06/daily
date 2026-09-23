import React from 'react';
import { X, Languages, RotateCcw, ShieldCheck, Check } from 'lucide-react';
import { Language } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onToggleLang: () => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onToggleLang,
  onResetData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm bg-[#0d0e13] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 end-4 p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-base font-bold text-white mb-4">
          {lang === 'ar' ? 'الإعدادات' : 'Settings'}
        </h2>

        <div className="space-y-4">
          
          {/* Language Selection */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Languages className="w-4 h-4 text-zinc-400" />
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">
                  {lang === 'ar' ? 'اللغة' : 'Language'}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {lang === 'ar' ? 'العربية (RTL)' : 'English (LTR)'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleLang}
              className="px-3 py-1 text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] rounded-lg border border-white/[0.08] transition-colors"
            >
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>

          {/* Reset Seed Schedule */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-4 h-4 text-zinc-400" />
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">
                  {lang === 'ar' ? 'الجدول الأصلي' : 'Seed Schedule'}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {lang === 'ar' ? 'استعادة بيانات 2026-09-23' : 'Reset default routine'}
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
              className="px-3 py-1 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 transition-colors"
            >
              {lang === 'ar' ? 'استعادة' : 'Reset'}
            </button>
          </div>

          {/* Privacy & Storage Note */}
          <div className="p-3 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/10 flex items-start gap-2.5 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-300 block mb-0.5">
                {lang === 'ar' ? 'خصوصية كاملة' : '100% Private'}
              </span>
              <span>
                {lang === 'ar' 
                  ? 'جميع المهام والبيانات مخزنة محليًا في متصفحك ولا يتم مشاركتها إطلاقًا.'
                  : 'All your tasks and history stay entirely in your browser’s localStorage.'}
              </span>
            </div>
          </div>

        </div>

        <div className="mt-6 pt-3 border-t border-white/[0.06] text-center">
          <p className="text-[11px] text-zinc-600">
            Daily Task Manager · Built for pure focus
          </p>
        </div>

      </div>
    </div>
  );
};
