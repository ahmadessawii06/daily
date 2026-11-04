import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { ReligiousSection } from './religiousContent';
import type { Language, Task } from '../types';
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
  lang?: Language;
}

export function ReligiousTabs({
  active,
  onChange,
  sections,
  className = '',
  label,
  currentDate,
  tasks,
  lang = 'ar',
}: ReligiousTabsProps) {
  const ar = lang === 'ar';
  const allTabs: Array<{ id: ReligiousSection; label: string; shortLabel: string }> = [
    { id: 'quran', label: ar ? 'وردك' : 'Quran Wird', shortLabel: ar ? 'وردك' : 'Quran' },
    { id: 'morning', label: ar ? 'أذكار الصباح' : 'Morning Adhkar', shortLabel: ar ? 'الصباح' : 'Morning' },
    { id: 'prayers', label: ar ? 'الصلوات والمهام' : 'Prayers & Tasks', shortLabel: ar ? 'الصلوات' : 'Prayers' },
    { id: 'evening', label: ar ? 'أذكار المساء' : 'Evening Adhkar', shortLabel: ar ? 'المساء' : 'Evening' },
    { id: 'duas', label: ar ? 'أدعيتك' : 'Your Duas', shortLabel: ar ? 'أدعيتك' : 'Duas' },
  ];
  const visibleTabs = sections ? allTabs.filter(tab => sections.includes(tab.id)) : allTabs;
  const navigation = useRef<HTMLElement>(null);
  const effectiveDate = currentDate || getTodayDateString();
  const [, setStatusTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setStatusTick(t => t + 1);
    window.addEventListener('daily_religious_progress_changed', handleUpdate);
    window.addEventListener('mizan:data-synced', handleUpdate);
    window.addEventListener('mizan:workspace-changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('daily_religious_progress_changed', handleUpdate);
      window.removeEventListener('mizan:data-synced', handleUpdate);
      window.removeEventListener('mizan:workspace-changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
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
        : (current + (event.key === (ar ? 'ArrowLeft' : 'ArrowRight') ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus({ preventScroll: true });
    reveal(buttons[next]);
  };

  return (
    <nav
      ref={navigation}
      dir={ar ? 'rtl' : 'ltr'}
      className={`worship-navigation ${className}`.trim()}
      aria-label={label || (ar ? 'أقسام العبادة' : 'Worship sections')}
      onKeyDown={handleKeyDown}
    >
      <div
        className="worship-navigation-items"
        style={visibleTabs.length === 5 ? undefined : { gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
      >
        {visibleTabs.map(tab => {
          const isActive = active === tab.id;
          const status = getSectionStatus(tab.id, effectiveDate, tasks);
          const statusClass = status.isDone ? 'is-completed' : 'is-pending';
          const completionTitle = status.isDone
            ? (ar ? `${tab.label}: مكتمل اليوم ✓` : `${tab.label}: Completed today ✓`)
            : (ar ? `${tab.label}: مطلوب اليوم` : `${tab.label}: Due today`);
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onChange(tab.id)}
              className={`${isActive ? 'is-active' : ''} ${statusClass}`.trim()}
              title={completionTitle}
              aria-label={completionTitle}
            >
              <span className="worship-navigation-label flex items-center justify-center">
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
