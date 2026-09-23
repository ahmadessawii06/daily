import React from 'react';
import { CalendarDays, Archive, Settings, Plus } from 'lucide-react';
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
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#090a0f]/95 backdrop-blur-md border-t border-white/[0.08] px-4 py-2 flex items-center justify-around select-none">
      
      {/* Today */}
      <button
        type="button"
        onClick={() => onTabChange('daily')}
        className={`flex flex-col items-center gap-1 py-1 px-3 text-xs transition-colors ${
          activeTab === 'daily' ? 'text-emerald-400 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <CalendarDays className="w-4 h-4" />
        <span className="text-[10px]">{lang === 'ar' ? 'اليوم' : 'Today'}</span>
      </button>

      {/* Floating Add Task Center Button */}
      <button
        type="button"
        onClick={onOpenAddTask}
        className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg active:scale-95 transition-transform -mt-5 border-2 border-[#090a0f]"
        aria-label="Add Task"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* Archive */}
      <button
        type="button"
        onClick={() => onTabChange('archive')}
        className={`flex flex-col items-center gap-1 py-1 px-3 text-xs transition-colors ${
          activeTab === 'archive' ? 'text-emerald-400 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Archive className="w-4 h-4" />
        <span className="text-[10px]">{lang === 'ar' ? 'الأرشيف' : 'Archive'}</span>
      </button>

      {/* Settings */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="flex flex-col items-center gap-1 py-1 px-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span className="text-[10px]">{lang === 'ar' ? 'إعدادات' : 'Settings'}</span>
      </button>

    </div>
  );
};
