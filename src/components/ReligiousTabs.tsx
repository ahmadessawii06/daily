import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { BookOpen, HandHeart, MoonStar, Sun, Sunrise } from 'lucide-react';
import type { ReligiousSection } from './religiousContent';

const tabs: Array<{ id: ReligiousSection; label: string; icon: typeof Sun }> = [
  { id: 'quran', label: 'الورد القرآني', icon: BookOpen },
  { id: 'morning', label: 'أذكار الصباح', icon: Sun },
  { id: 'prayers', label: 'الصلوات والمهام', icon: Sunrise },
  { id: 'evening', label: 'أذكار المساء', icon: MoonStar },
  { id: 'duas', label: 'الأدعية', icon: HandHeart },
];

interface ReligiousTabsProps {
  active: ReligiousSection;
  onChange: (section: ReligiousSection) => void;
  sections?: ReligiousSection[];
  className?: string;
  label?: string;
}

export function ReligiousTabs({
  active,
  onChange,
  sections,
  className = '',
  label = 'أقسام العبادة',
}: ReligiousTabsProps) {
  const visibleTabs = sections ? tabs.filter(tab => sections.includes(tab.id)) : tabs;
  const navigation = useRef<HTMLElement>(null);

  const reveal = (button: HTMLButtonElement, smooth = false) => {
    const dock = navigation.current;
    if (!dock) return;
    const bounds = dock.getBoundingClientRect();
    const item = button.getBoundingClientRect();
    const offset = item.left < bounds.left + 8
      ? item.left - bounds.left - 8
      : item.right > bounds.right - 8
        ? item.right - bounds.right + 8
        : 0;
    if (offset) {
      dock.scrollBy({
        left: offset,
        behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant',
      });
    }
  };

  useEffect(() => {
    const dock = navigation.current;
    const button = dock?.querySelector<HTMLButtonElement>('[aria-current="page"]');
    if (!dock || !button) return;
    reveal(button, true);
    const observer = new ResizeObserver(() => reveal(button));
    observer.observe(dock);
    return () => observer.disconnect();
  }, [active]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll('button'));
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? buttons.length - 1
        : (current + (event.key === 'ArrowLeft' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus({ preventScroll: true });
    reveal(buttons[next]);
  };

  return (
    <nav
      ref={navigation}
      dir="rtl"
      className={`worship-navigation ${className}`.trim()}
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      <div
        className="worship-navigation-items"
        style={visibleTabs.length === 5 ? undefined : { gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
      >
        {visibleTabs.map(tab => {
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
              <span className="worship-navigation-icon">
                <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="worship-navigation-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
