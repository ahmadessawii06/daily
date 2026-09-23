import React from 'react';
import { Plus, Menu } from 'lucide-react';
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
  // Determine dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return lang === 'ar' ? 'صباح الخير 👋' : 'Good morning 👋';
    }
    if (hour < 17) {
      return lang === 'ar' ? 'طاب يومك 👋' : 'Good afternoon 👋';
    }
    return lang === 'ar' ? 'مساء الخير 👋' : 'Good evening 👋';
  };

  const headerDateStr = formatHeaderDate(currentDate, lang);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
      
      {/* Left: Greeting, Date & Subtitle */}
      <div>
        <div className="flex items-center gap-2">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden p-1.5 -ms-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <span className="text-xs sm:text-sm font-medium text-emerald-400">
            {getGreeting()}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
          {headerDateStr}
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          {lang === 'ar' ? 'لنبدأ يومًا مفعمًا بالإنتاجية والإنجاز.' : "Let's make today productive."}
        </p>
      </div>

      {/* Right: + Add Task button */}
      <div className="flex items-center gap-2 self-start sm:self-center">
        <button
          type="button"
          onClick={onOpenAddTask}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-950 bg-white hover:bg-zinc-200 active:scale-98 rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{lang === 'ar' ? '+ إضافة مهمة' : '+ Add Task'}</span>
        </button>
      </div>

    </div>
  );
};
