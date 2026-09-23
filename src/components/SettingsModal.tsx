import React from 'react';
import { X, Languages, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm bg-gradient-to-b from-[#13151f] to-[#0d0e14] border border-white/[0.12] rounded-3xl p-6 shadow-2xl relative overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400" />

        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 end-5 p-2 text-zinc-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <h2 className="text-lg font-extrabold text-white mb-5 font-['Alexandria','Cairo']">
          {lang === 'ar' ? 'الإعدادات والبيانات' : 'Settings & Data'}
        </h2>

        <div className="space-y-3.5">
          
          {/* Language Selection */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/[0.06] text-white flex items-center justify-center">
                <Languages className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-100 block font-['Alexandria']">
                  {lang === 'ar' ? 'لغة الواجهة' : 'App Language'}
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  {lang === 'ar' ? 'العربية (Alexandria Font)' : 'English (LTR)'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleLang}
              className="px-3 py-1.5 text-xs font-bold text-zinc-100 hover:text-white bg-white/[0.08] hover:bg-white/[0.15] rounded-xl border border-white/[0.1] transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>

          {/* Reset Seed Schedule */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-100 block font-['Alexandria']">
                  {lang === 'ar' ? 'الجدول الأصلي' : 'Seed Schedule'}
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
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
              className="px-3 py-1.5 text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-500/15 hover:bg-rose-500/25 rounded-xl border border-rose-500/30 transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'استعادة' : 'Reset'}
            </button>
          </div>

          {/* Privacy & Storage Note */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/15 flex items-start gap-3 text-xs text-zinc-300">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-emerald-300 block mb-0.5 font-['Alexandria']">
                {lang === 'ar' ? 'حفظ محلي آمن 100%' : '100% Offline & Private'}
              </span>
              <span className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                {lang === 'ar' 
                  ? 'جميع المهام والتواريخ مخزنة حصريًا في متصفحك عبر localStorage.'
                  : 'All your tasks and history stay entirely in your browser’s localStorage.'}
              </span>
            </div>
          </div>

        </div>

        <div className="mt-6 pt-3 border-t border-white/[0.08] text-center">
          <p className="text-[11px] text-zinc-500 font-mono font-medium">
            Daily • Designed for High Productivity
          </p>
        </div>

      </div>
    </div>
  );
};
