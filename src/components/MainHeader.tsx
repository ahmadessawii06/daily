import React from 'react';
import { Plus, Menu, Sun, Moon, Sunrise, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { formatHeaderDate } from '../utils/date';

interface MainHeaderProps {
  currentDate: string;
  onOpenAddTask: () => void;
  onOpenMobileMenu?: () => void;
  lang: Language;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  currentDate,
  onOpenAddTask,
  onOpenMobileMenu,
  lang,
}) => {
  const hour = new Date().getHours();

  const getGreetingData = () => {
    if (hour >= 5 && hour < 12) {
      return {
        text: lang === 'ar' ? 'صباح الخير والبركة 👋' : 'Good morning 👋',
        icon: Sunrise,
        badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        text: lang === 'ar' ? 'طاب يومك وإنجازك 👋' : 'Good afternoon 👋',
        icon: Sun,
        badgeBg: 'bg-amber-400/10 text-amber-300 border-amber-400/20'
      };
    }
    return {
      text: lang === 'ar' ? 'مساء الخير والهمّة 👋' : 'Good evening 👋',
      icon: Moon,
      badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
    };
  };

  const greeting = getGreetingData();
  const GreetingIcon = greeting.icon;
  const headerDateStr = formatHeaderDate(currentDate, lang);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-white/[0.08]">
      
      {/* Left / Date & Greetings */}
      <div>
        <div className="flex items-center gap-2.5">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 text-zinc-400 hover:text-white rounded-xl bg-white/[0.04] border border-white/[0.08]"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${greeting.badgeBg}`}>
            <GreetingIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{greeting.text}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mt-2 font-['Alexandria','Cairo']">
          {headerDateStr}
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{lang === 'ar' ? 'لنبدأ يومًا مفعمًا بالإنتاجية والتركيز.' : "Let's make today productive."}</span>
        </p>
      </div>

      {/* Right / Add Task Action */}
      <div className="flex items-center gap-2.5 self-start sm:self-center">
        <button
          type="button"
          onClick={onOpenAddTask}
          className="group relative flex items-center gap-2.5 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 hover:from-emerald-300 hover:to-teal-200 active:scale-98 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 ring-1 ring-white/30 cursor-pointer"
        >
          <div className="w-5 h-5 rounded-lg bg-slate-950/20 flex items-center justify-center">
            <Plus className="w-4 h-4 stroke-[3] text-slate-950" />
          </div>
          <span>{lang === 'ar' ? 'إضافة مهمة جديدة' : '+ Add Task'}</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-950/15 font-mono text-slate-900 font-extrabold">
            N
          </span>
        </button>
      </div>

    </div>
  );
};
