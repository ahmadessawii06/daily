import { BookOpen, HandHeart, MoonStar, Sun, Sunrise } from 'lucide-react';
import type { ReligiousSection } from './religiousContent';

const tabs: Array<{ id: ReligiousSection; label: string; icon: typeof Sun }> = [
  { id: 'prayers', label: 'الصلوات الخمس', icon: Sunrise },
  { id: 'morning', label: 'أذكار الصباح', icon: Sun },
  { id: 'evening', label: 'أذكار المساء', icon: MoonStar },
  { id: 'quran', label: 'الورد القرآني', icon: BookOpen },
  { id: 'duas', label: 'الأدعية', icon: HandHeart },
];

export function ReligiousTabs({ active, onChange }: { active: ReligiousSection; onChange: (section: ReligiousSection) => void }) {
  return (
    <div dir="rtl" className="flex items-center justify-center w-full px-2 py-1">
      <nav className="religious-tabs" aria-label="أقسام العبادة">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onChange(tab.id)}
              className={isActive ? 'is-active' : ''}
            >
              <Icon size={16} aria-hidden="true" className={isActive ? 'text-emerald-700 dark:text-teal-300' : 'text-slate-500 dark:text-zinc-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
