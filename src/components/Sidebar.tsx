import React from 'react';
import { 
  CheckCircle2, 
  Calendar, 
  History, 
  SlidersHorizontal, 
  Sparkles,
  ChevronRight,
  Flame,
  Layers
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
    <aside className="w-64 bg-[#090a0f] border-e border-white/[0.08] flex flex-col justify-between p-4 shrink-0 select-none">
      
      {/* Brand & Main Nav */}
      <div className="space-y-6">
        
        {/* Brand with strong visual emblem */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/20">
            <CheckCircle2 className="w-5 h-5 stroke-[2.8]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight font-['Alexandria','Plus_Jakarta_Sans']">
                Daily
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="block text-[11px] text-zinc-400 font-medium -mt-0.5">
              {lang === 'ar' ? 'إدارة المهام اليومية' : 'Task Flow Engine'}
            </span>
          </div>
        </div>

        {/* Navigation Items with Stronger Icons & Active States */}
        <nav className="space-y-1.5">
          
          {/* Today */}
          <button
            type="button"
            onClick={() => onTabChange('daily')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              activeTab === 'daily'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-950/40 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                activeTab === 'daily' ? 'bg-emerald-400 text-slate-950 shadow-sm' : 'bg-white/[0.05] text-zinc-400'
              }`}>
                <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>{lang === 'ar' ? 'مهام اليوم' : 'Today’s Tasks'}</span>
            </div>
            
            {todayTasksCount > 0 && (
              <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold tabular-nums ${
                activeTab === 'daily' 
                  ? 'bg-emerald-400 text-slate-950' 
                  : 'bg-zinc-800 text-zinc-300'
              }`}>
                {todayTasksCount}
              </span>
            )}
          </button>

          {/* Archive */}
          <button
            type="button"
            onClick={() => onTabChange('archive')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              activeTab === 'archive'
                ? 'bg-white/[0.1] text-white border border-white/[0.15] shadow-sm font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                activeTab === 'archive' ? 'bg-white text-slate-950 shadow-sm' : 'bg-white/[0.05] text-zinc-400'
              }`}>
                <History className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>{lang === 'ar' ? 'سجل الأرشيف' : 'Archive History'}</span>
            </div>

            {archiveDaysCount > 0 && (
              <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold tabular-nums ${
                activeTab === 'archive' 
                  ? 'bg-white text-slate-950' 
                  : 'bg-zinc-800 text-zinc-300'
              }`}>
                {archiveDaysCount}
              </span>
            )}
          </button>

        </nav>
      </div>

      {/* Bottom Settings & Status */}
      <div className="pt-4 border-t border-white/[0.08] space-y-2">
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-white/[0.05] text-zinc-400 flex items-center justify-center">
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <span>{lang === 'ar' ? 'الإعدادات والخيارات' : 'Settings & Data'}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
        </button>

        <div className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-[11px] text-zinc-400">
          <span className="font-mono text-zinc-400 font-medium">Daily Pro</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>{lang === 'ar' ? 'حفظ تلقائي' : 'Auto Saved'}</span>
          </span>
        </div>
      </div>

    </aside>
  );
};
