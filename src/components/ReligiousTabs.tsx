import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { BookOpen, HandHeart, MoonStar, Sun, Sunrise } from 'lucide-react';
import type { ReligiousSection } from './religiousContent';
import type { Task } from '../types';
import {
  getStoredMorningCounts,
  isStoredMorningConfirmed,
  getStoredEveningCounts,
  isStoredEveningConfirmed,
  getStoredQuranCompleted,
  getStoredDuasCompleted,
  calculateAdhkarCompletedCount,
  isMorningAdhkarTask,
  isEveningAdhkarTask,
  isQuranWirdTask,
  isDuasTask,
} from '../utils/dailyProgress';
import { AZKAR_SABAH } from '../data/azkarSabah';
import { AZKAR_MASAA } from '../data/azkarMasaa';
import { partitionPrayerTasks } from '../utils/prayerTasks';
import { getDayRecord } from '../utils/storage';
import { getTodayDateString } from '../utils/date';

const tabs: Array<{ id: ReligiousSection; label: string; shortLabel: string; icon: typeof Sun }> = [
  { id: 'quran', label: 'وردك', shortLabel: 'وردك', icon: BookOpen },
  { id: 'morning', label: 'أذكار الصباح', shortLabel: 'الصباح', icon: Sun },
  { id: 'prayers', label: 'الصلوات والمهام', shortLabel: 'الصلوات', icon: Sunrise },
  { id: 'evening', label: 'أذكار المساء', shortLabel: 'المساء', icon: MoonStar },
  { id: 'duas', label: 'أدعيتك', shortLabel: 'أدعيتك', icon: HandHeart },
];

function getSectionStatus(section: ReligiousSection, date: string, tasksList?: Task[]): { isDone: boolean } {
  try {
    const currentTasks = tasksList && tasksList.length > 0 ? tasksList : getDayRecord(date).tasks;

    if (section === 'quran') {
      const isDone = getStoredQuranCompleted(date) || currentTasks.some(t => isQuranWirdTask(t.title) && t.status === 'done');
      return { isDone };
    }

    if (section === 'duas') {
      const isDone = getStoredDuasCompleted(date).completed || currentTasks.some(t => isDuasTask(t.title) && t.status === 'done');
      return { isDone };
    }

    if (section === 'morning') {
      const counts = getStoredMorningCounts(date);
      const doneCount = calculateAdhkarCompletedCount(AZKAR_SABAH, counts);
      const isDone = isStoredMorningConfirmed(date) || doneCount === AZKAR_SABAH.length || currentTasks.some(t => isMorningAdhkarTask(t.title) && t.status === 'done');
      return { isDone };
    }

    if (section === 'evening') {
      const counts = getStoredEveningCounts(date);
      const doneCount = calculateAdhkarCompletedCount(AZKAR_MASAA, counts);
      const isDone = isStoredEveningConfirmed(date) || doneCount === AZKAR_MASAA.length || currentTasks.some(t => isEveningAdhkarTask(t.title) && t.status === 'done');
      return { isDone };
    }

    if (section === 'prayers') {
      const partition = partitionPrayerTasks(currentTasks);
      const completedPrayers = partition.slots.filter(s => s.task && s.task.status === 'done').length;
      const isDone = completedPrayers === 5;
      return { isDone };
    }
  } catch {
    return { isDone: false };
  }

  return { isDone: false };
}

interface ReligiousTabsProps {
  active: ReligiousSection;
  onChange: (section: ReligiousSection) => void;
  sections?: ReligiousSection[];
  className?: string;
  label?: string;
  currentDate?: string;
  tasks?: Task[];
}

export function ReligiousTabs({
  active,
  onChange,
  sections,
  className = '',
  label = 'أقسام العبادة',
  currentDate,
  tasks,
}: ReligiousTabsProps) {
  const visibleTabs = sections ? tabs.filter(tab => sections.includes(tab.id)) : tabs;
  const navigation = useRef<HTMLElement>(null);
  const effectiveDate = currentDate || getTodayDateString();
  const [, setStatusTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setStatusTick(t => t + 1);
    window.addEventListener('daily_religious_progress_changed', handleUpdate);
    window.addEventListener('mizan:data-synced', handleUpdate);
    window.addEventListener('mizan:workspace-changed', handleUpdate);
    return () => {
      window.removeEventListener('daily_religious_progress_changed', handleUpdate);
      window.removeEventListener('mizan:data-synced', handleUpdate);
      window.removeEventListener('mizan:workspace-changed', handleUpdate);
    };
  }, []);

  const reveal = (button: HTMLButtonElement, smooth = false) => {
    const dock = navigation.current;
    if (!dock || dock.scrollWidth <= dock.clientWidth + 2) return;
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
          const status = getSectionStatus(tab.id, effectiveDate, tasks);
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
              <span className="worship-navigation-label flex items-center justify-center gap-1.5">
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span
                  className={`worship-tab-dot inline-block size-1.5 rounded-full shrink-0 transition-all duration-300 ${
                    status.isDone
                      ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] ring-1 ring-emerald-400/40'
                      : 'bg-amber-400/90 shadow-[0_0_4px_rgba(245,158,11,0.5)]'
                  }`}
                  title={status.isDone ? `${tab.label}: مكتمل اليوم ✓` : `${tab.label}: مطلوب اليوم`}
                  aria-label={status.isDone ? `${tab.label}: مكتمل اليوم` : `${tab.label}: مطلوب اليوم`}
                />
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
