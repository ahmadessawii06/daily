import React from 'react';
import { Calendar, History, SlidersHorizontal, Plus } from 'lucide-react';
import { Language } from '../types';

interface MobileNavProps {
  activeTab: 'daily' | 'archive';
  onTabChange: (tab: 'daily' | 'archive') => void;
  onOpenAddTask: () => void;
  onOpenSettings: () => void;
  lang: Language;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddTask,
  onOpenSettings,
  lang,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#090a0f]/95 backdrop-blur-xl border-t border-white/[0.1] px-5 py-2.5 flex items-center justify-around select-none">
      
      {/* Today */}
      <button
        type="button"
        onClick={() => onTabChange('daily')}
        className={`flex flex-col items-center gap-1 py-1 px-3 text-xs transition-colors cursor-pointer ${
          activeTab === 'daily' ? 'text-emerald-400 font-extrabold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Calendar className="w-5 h-5 stroke-[2.5]" />
        <span className="text-[11px] font-['Alexandria']">{lang === 'ar' ? 'اليوم' : 'Today'}</span>
      </button>

      {/* Floating Add Task Center Button */}
      <button
        type="button"
        onClick={onOpenAddTask}
        className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/30 active:scale-95 transition-transform -mt-6 border-2 border-[#090a0f] ring-2 ring-emerald-400/40 cursor-pointer"
        aria-label="Add Task"
      >
        <Plus className="w-6 h-6 stroke-[3.5]" />
      </button>

      {/* Archive */}
      <button
        type="button"
        onClick={() => onTabChange('archive')}
        className={`flex flex-col items-center gap-1 py-1 px-3 text-xs transition-colors cursor-pointer ${
          activeTab === 'archive' ? 'text-emerald-400 font-extrabold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <History className="w-5 h-5 stroke-[2.5]" />
        <span className="text-[11px] font-['Alexandria']">{lang === 'ar' ? 'الأرشيف' : 'Archive'}</span>
      </button>

      {/* Settings */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="flex flex-col items-center gap-1 py-1 px-3 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
      >
        <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[11px] font-['Alexandria']">{lang === 'ar' ? 'إعدادات' : 'Settings'}</span>
      </button>

    </div>
  );
};
