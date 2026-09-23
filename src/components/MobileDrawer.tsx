import React, { useEffect } from 'react';
import { 
  X, 
  Calendar, 
  History, 
  SlidersHorizontal, 
  CheckCircle2, 
  Sparkles, 
  Languages, 
  RotateCcw 
} from 'lucide-react';
import { Language } from '../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'daily' | 'archive';
  onTabChange: (tab: 'daily' | 'archive') => void;
  todayTasksCount: number;
  archiveDaysCount: number;
  onOpenSettings: () => void;
  lang: Language;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  todayTasksCount,
  archiveDaysCount,
  onOpenSettings,
  lang,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Slide-over panel */}
      <div 
        className={`fixed inset-y-0 ${
          lang === 'ar' ? 'end-0' : 'start-0'
        } w-72 max-w-[85vw] bg-[#0c0e14] border-s border-white/[0.1] p-5 shadow-2xl flex flex-col justify-between z-10 animate-in ${
          lang === 'ar' ? 'slide-in-from-right' : 'slide-in-from-left'
        } duration-200`}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 stroke-[2.8]" />
              </div>
              <div>
                <span className="font-extrabold text-base text-white tracking-tight font-['Alexandria']">
                  Daily
                </span>
                <span className="block text-[10px] text-zinc-400 font-medium">
                  {lang === 'ar' ? 'إدارة المهام اليومية' : 'Daily Task Manager'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-white/[0.05] transition-colors"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <button
              type="button"
              onClick={() => {
                onTabChange('daily');
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'daily'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-zinc-300 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 stroke-[2.5]" />
                <span className="font-['Alexandria']">{lang === 'ar' ? 'مهام اليوم' : 'Today’s Tasks'}</span>
              </div>
              {todayTasksCount > 0 && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                  {todayTasksCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onTabChange('archive');
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'archive'
                  ? 'bg-white/[0.12] text-white border border-white/[0.2] shadow-sm'
                  : 'text-zinc-300 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3">
                <History className="w-4 h-4 stroke-[2.5]" />
                <span className="font-['Alexandria']">{lang === 'ar' ? 'سجل الأرشيف' : 'Archive History'}</span>
              </div>
              {archiveDaysCount > 0 && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-slate-950">
                  {archiveDaysCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Options */}
        <div className="pt-4 border-t border-white/[0.08] space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all"
          >
            <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
            <span className="font-['Alexandria']">{lang === 'ar' ? 'الإعدادات والخيارات' : 'Settings & Options'}</span>
          </button>

          <div className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>Daily Mobile</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>{lang === 'ar' ? 'حفظ تلقائي' : 'Saved'}</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
