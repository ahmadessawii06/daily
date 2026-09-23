import React from 'react';
import { 
  CheckCircle2, 
  CalendarDays, 
  Archive, 
  Settings, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Language } from '../types';

interface SidebarProps {
  activeTab: 'daily' | 'archive';
  onTabChange: (tab: 'daily' | 'archive') => void;
  todayTasksCount: number;
  archiveDaysCount: number;
  onOpenSettings: () => void;
  lang: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  todayTasksCount,
  archiveDaysCount,
  onOpenSettings,
  lang,
}) => {
  return (
    <aside className="w-64 bg-[#0a0b0e] border-e border-white/[0.06] flex flex-col justify-between p-4 shrink-0 select-none">
      
      {/* Top: Brand & Navigation */}
      <div className="space-y-6">
        
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight font-['Plus_Jakarta_Sans']">
              Daily
            </span>
            <span className="block text-[11px] text-zinc-500 font-medium -mt-0.5">
              {lang === 'ar' ? 'منظّم المهام' : 'Task Manager'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          
          {/* Today Tab */}
          <button
            type="button"
            onClick={() => onTabChange('daily')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'daily'
                ? 'bg-white/[0.08] text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CalendarDays className={`w-4 h-4 ${activeTab === 'daily' ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span>{lang === 'ar' ? 'اليوم' : 'Today'}</span>
            </div>
            
            {todayTasksCount > 0 && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                activeTab === 'daily' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-zinc-800/80 text-zinc-400'
              }`}>
                {todayTasksCount}
              </span>
            )}
          </button>

          {/* Archive Tab */}
          <button
            type="button"
            onClick={() => onTabChange('archive')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'archive'
                ? 'bg-white/[0.08] text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Archive className={`w-4 h-4 ${activeTab === 'archive' ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span>{lang === 'ar' ? 'الأرشيف' : 'Archive'}</span>
            </div>

            {archiveDaysCount > 0 && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                activeTab === 'archive' 
                  ? 'bg-white/20 text-zinc-200' 
                  : 'bg-zinc-800/80 text-zinc-400'
              }`}>
                {archiveDaysCount}
              </span>
            )}
          </button>

        </nav>
      </div>

      {/* Bottom: Settings & Meta */}
      <div className="pt-4 border-t border-white/[0.06] space-y-2">
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-zinc-500" />
            <span>{lang === 'ar' ? 'الإعدادات' : 'Settings'}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        </button>

        <div className="px-3 pt-2 text-[10px] text-zinc-600 flex items-center justify-between">
          <span>Daily v1.2</span>
          <span className="flex items-center gap-1 text-emerald-500/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{lang === 'ar' ? 'حفظ محلي' : 'Local sync'}</span>
          </span>
        </div>
      </div>

    </aside>
  );
};
