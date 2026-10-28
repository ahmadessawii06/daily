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
        className={`group relative flex h-control min-w-control cursor-pointer items-center justify-center rounded-2xl border border-white/35 bg-slate-100/70 px-2 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_8px_rgba(38,63,48,0.06)] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 hover:border-amber-400/60 hover:bg-amber-50 hover:text-amber-700 hover:shadow-[0_6px_20px_-6px_rgba(245,158,11,0.4)] focus-visible:outline-amber-500 dark:border-white/[.08] dark:bg-white/[.04] dark:text-zinc-300 dark:hover:border-amber-400/40 dark:hover:bg-amber-400/10 dark:hover:text-amber-300 ${
          isOpen
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
            : ''
        }`}
      >
        <SquarePen
          size={20}
          strokeWidth={2}
          aria-hidden="true"
          className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:-rotate-12 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:-rotate-12 motion-safe:group-focus-visible:scale-110"
        />
        {noteCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-400 px-1 text-[10px] font-bold tabular-nums text-blue-950 shadow-sm ring-2 ring-white dark:ring-[#111416]"
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
