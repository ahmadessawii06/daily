import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SquarePen } from 'lucide-react';
import type { Language } from '../types';
import { QuickNotesModal } from './QuickNotesModal';
import { getStoredQuickNotes } from '../utils/quickNotesStorage';
import { Tooltip } from './Tooltip';

export function QuickNotes({ lang }: { lang: Language }) {
  const [isOpen, setIsOpen] = useState(false);
  const [noteCount, setNoteCount] = useState(() => getStoredQuickNotes().length);
  const triggerButton = useRef<HTMLButtonElement | null>(null);
  const ar = lang === 'ar';

  // Keep note count updated
  useEffect(() => {
    const updateCount = () => {
      setNoteCount(getStoredQuickNotes().length);
    };
    window.addEventListener('mizan:quick-notes-updated', updateCount);
    return () => window.removeEventListener('mizan:quick-notes-updated', updateCount);
  }, []);

  // Global keyboard shortcut: Ctrl + Shift + N to open/toggle Quick Notes
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Support both Ctrl+Shift+N and Cmd+Shift+N
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Listen to custom open event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('mizan:open-quick-notes', handleOpen);
    return () => window.removeEventListener('mizan:open-quick-notes', handleOpen);
  }, []);

  const label = ar
    ? (noteCount > 0 ? `أفكاري وملاحظاتي (${noteCount}) — اختصار Ctrl+Shift+N` : 'أفكاري وملاحظاتي — اختصار Ctrl+Shift+N')
    : (noteCount > 0 ? `Quick Notes (${noteCount}) — Ctrl+Shift+N` : 'Quick Notes — Ctrl+Shift+N');

  return (
    <div className="contents">
      <Tooltip text={ar ? (noteCount > 0 ? `الملاحظات (${noteCount})` : 'الملاحظات السريعة') : (noteCount > 0 ? `Quick Notes (${noteCount})` : 'Quick Notes')}>
      <button
        id="header-quick-notes-btn"
        ref={triggerButton}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="quick-notes-dialog"
        onClick={() => setIsOpen(prev => !prev)}
        className={`group relative flex h-8 w-8 sm:h-8.5 sm:w-8.5 cursor-pointer shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-700 hover:text-emerald-800 hover:bg-emerald-600/10 dark:text-zinc-200 dark:hover:text-emerald-300 dark:hover:bg-emerald-400/15 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500 transition-all duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 ${
          isOpen
            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
            : ''
        }`}
      >
        <SquarePen
          size={17}
          strokeWidth={1.9}
          aria-hidden="true"
          className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-110"
        />
        {noteCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -end-1 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8.5px] font-bold text-white shadow-2xs ring-1.5 ring-white dark:ring-[#071714]"
          >
            {noteCount}
          </span>
        )}
      </button>
      </Tooltip>

      {isOpen &&
        createPortal(
          <QuickNotesModal
            isOpen={isOpen}
            onClose={() => {
              setIsOpen(false);
              requestAnimationFrame(() => triggerButton.current?.focus());
            }}
            lang={lang}
          />,
          document.body
        )}
    </div>
  );
}
