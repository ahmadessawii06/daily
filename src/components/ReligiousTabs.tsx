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
    <div dir="rtl" className="religious-dashboard-header">
      <nav className="religious-tabs" aria-label="أقسام العبادة">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} type="button" aria-current={active === tab.id ? 'page' : undefined} onClick={() => onChange(tab.id)} className={active === tab.id ? 'is-active' : ''}>
              <Icon size={18} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
