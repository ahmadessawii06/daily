import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  Lightbulb,
  LayoutGrid,
  List,
  Pin,
  PinOff,
  SquarePen,
  Search,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import type { Language, QuickNote, QuickNoteColor } from '../types';
import {
  addQuickNote,
  clearStoredDraft,
  deleteQuickNote,
  formatNoteTimestamp,
  getStoredDraft,
  getStoredQuickNotes,
  saveStoredDraft,
  togglePinQuickNote,
  updateQuickNote,
} from '../utils/quickNotesStorage';

interface QuickNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const COLOR_CONFIG: Record<
  QuickNoteColor,
  {
    nameAr: string;
    nameEn: string;
    dotBg: string;
    cardStyle: string;
    badgeStyle: string;
  }
> = {
  cream: {
    nameAr: 'كريمي',
    nameEn: 'Cream',
    dotBg: 'bg-[#faf6ee] border-amber-200 text-amber-900',
    cardStyle:
      'bg-[#faf6ee] border-[#eadfce] hover:border-[#d8c7af] dark:bg-[#2b271f] dark:border-[#625747] dark:hover:border-[#89775e]',
    badgeStyle: 'bg-[#f0e5d4] border-[#e2d1b8] text-[#7c6a52] dark:bg-[#4a3d2e] dark:border-[#6d5b44] dark:text-[#e5d5bc]',
  },
  mint: {
    nameAr: 'نعناعي',
    nameEn: 'Mint',
    dotBg: 'bg-[#e6f7ef] border-emerald-300 text-emerald-800',
    cardStyle:
      'bg-[#eef7f1] border-[#d7eade] hover:border-[#b8d7c4] dark:bg-[#172a23] dark:border-[#315445] dark:hover:border-[#4b8066]',
    badgeStyle: 'bg-[#dceee2] border-[#c3dfcd] text-[#4f7662] dark:bg-[#244438] dark:border-[#3c6853] dark:text-[#b6dbc3]',
  },
  amber: {
    nameAr: 'عسلي',
    nameEn: 'Amber',
    dotBg: 'bg-[#fef4dc] border-amber-300 text-amber-900',
    cardStyle:
      'bg-[#fbf4e8] border-[#eadcc5] hover:border-[#dbc59e] dark:bg-[#2b251a] dark:border-[#625237] dark:hover:border-[#8a7046]',
    badgeStyle: 'bg-[#f2e4c9] border-[#e4d0aa] text-[#8a6a3d] dark:bg-[#4b3b24] dark:border-[#705934] dark:text-[#e4c98d]',
  },
  blue: {
    nameAr: 'سماوي',
    nameEn: 'Sky',
    dotBg: 'bg-[#eaf3fe] border-sky-300 text-sky-800',
    cardStyle:
      'bg-[#eef3f7] border-[#d9e2e9] hover:border-[#b9cbd8] dark:bg-[#1b2730] dark:border-[#3f5665] dark:hover:border-[#5c7b8e]',
    badgeStyle: 'bg-[#dfeaf1] border-[#c9dbe7] text-[#577287] dark:bg-[#293e4c] dark:border-[#456476] dark:text-[#b4d0e0]',
  },
  rose: {
    nameAr: 'وردي',
    nameEn: 'Rose',
    dotBg: 'bg-[#fdeef1] border-rose-300 text-rose-800',
    cardStyle:
      'bg-[#f8eff0] border-[#ead9dc] hover:border-[#d9bfc4] dark:bg-[#2b1e22] dark:border-[#62444b] dark:hover:border-[#855d66]',
    badgeStyle: 'bg-[#f0dfe2] border-[#e2c8cd] text-[#8a626b] dark:bg-[#4b3037] dark:border-[#704750] dark:text-[#e0b9c1]',
  },
};

const COLOR_KEYS: QuickNoteColor[] = ['cream', 'mint', 'amber', 'blue', 'rose'];

function directionForText(value: string, fallback: 'rtl' | 'ltr'): 'rtl' | 'ltr' {
  const firstStrongCharacter = value.match(/[A-Za-z\u0590-\u08FF]/)?.[0];
  if (!firstStrongCharacter) return fallback;
  return /[A-Za-z]/.test(firstStrongCharacter) ? 'ltr' : 'rtl';
}

export function QuickNotesModal({ isOpen, onClose, lang }: QuickNotesModalProps) {
  const ar = lang === 'ar';
  const headingId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Notes state
  const [notes, setNotes] = useState<QuickNote[]>(() => getStoredQuickNotes());
  const [searchQuery, setSearchQuery] = useState('');
  const [noteFilter, setNoteFilter] = useState<'all' | 'pinned' | 'recent'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // New Note Form State (loaded from draft)
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftColor, setDraftColor] = useState<QuickNoteColor>('cream');
  const [draftSavedAlert, setDraftSavedAlert] = useState(false);

  // Inline Editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState<QuickNoteColor>('cream');

  // Copied feedback map
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{
    message: string;
    type?: 'success' | 'info';
    undo?: () => void;
  } | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  };

  const showToast = (message: string, undo?: () => void) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, undo });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync notes from storage / events
  const reloadNotes = () => {
    setNotes(getStoredQuickNotes());
  };

  useEffect(() => {
    window.addEventListener('mizan:quick-notes-updated', reloadNotes);
    return () => window.removeEventListener('mizan:quick-notes-updated', reloadNotes);
  }, []);

  // When modal opens: restore draft, lock body scroll, autofocus
  useEffect(() => {
    if (!isOpen) return;

    reloadNotes();
    const stored = getStoredDraft();
    setDraftTitle(stored.title || '');
    setDraftContent(stored.content || '');
    setDraftColor(stored.color || 'cream');

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Autofocus on textarea or title input
    requestAnimationFrame(() => {
      resizeTextarea();
      textareaRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Draft auto-saving
  useEffect(() => {
    if (!isOpen) return;
    const hasText = draftTitle.trim() || draftContent.trim();
    saveStoredDraft({
      title: draftTitle,
      content: draftContent,
      color: draftColor,
    });
    if (hasText) {
      setDraftSavedAlert(true);
      const timer = setTimeout(() => setDraftSavedAlert(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setDraftSavedAlert(false);
    }
  }, [draftTitle, draftContent, draftColor, isOpen]);

  useEffect(() => {
    if (isOpen) requestAnimationFrame(resizeTextarea);
  }, [draftContent, isOpen]);

  // Global key bindings inside modal: Escape to close / cancel edit, Ctrl+Enter to save
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingNoteId) {
          e.preventDefault();
          setEditingNoteId(null);
        } else {
          e.preventDefault();
          onClose();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (editingNoteId) {
          handleSaveEdit();
        } else {
          handleCreateNote();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingNoteId, draftTitle, draftContent, draftColor, editTitle, editContent, editColor]);

  // Focus trap
  const trapFocus = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  // Create new note
  const handleCreateNote = () => {
    const trimmedContent = draftContent.trim();
    const trimmedTitle = draftTitle.trim();

    if (!trimmedContent && !trimmedTitle) {
      textareaRef.current?.focus();
      return;
    }

    addQuickNote({
      title: trimmedTitle,
      content: trimmedContent,
      color: draftColor,
      isPinned: false,
    });

    clearStoredDraft();
    setDraftTitle('');
    setDraftContent('');
    setDraftColor('cream');
    setDraftSavedAlert(false);
    reloadNotes();

    showToast(ar ? 'تم حفظ الملاحظة بنجاح ✨' : 'Note saved successfully ✨');
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  // Clear draft
  const handleClearDraft = () => {
    clearStoredDraft();
    setDraftTitle('');
    setDraftContent('');
    setDraftColor('cream');
    setDraftSavedAlert(false);
    showToast(ar ? 'تم إفراغ المسودة' : 'Draft cleared');
    textareaRef.current?.focus();
  };

  // Toggle Pin
  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isNowPinned = togglePinQuickNote(id);
    reloadNotes();
    showToast(
      isNowPinned
        ? (ar ? 'تم تثبيت الملاحظة في الأعلى 📌' : 'Note pinned to top 📌')
        : (ar ? 'تم إلغاء تثبيت الملاحظة' : 'Note unpinned')
    );
  };

  // Copy note
  const handleCopyNote = (note: QuickNote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const textToCopy = note.title ? `${note.title}\n\n${note.content}` : note.content;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedNoteId(note.id);
      setTimeout(() => setCopiedNoteId(null), 2000);
      showToast(ar ? 'تم نسخ الملاحظة إلى الحافظة' : 'Copied to clipboard');
    });
  };

  // Start inline editing
  const handleStartEdit = (note: QuickNote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingNoteId(note.id);
    setEditTitle(note.title || '');
    setEditContent(note.content || '');
    setEditColor(note.color || 'cream');
  };

  // Save inline edit
  const handleSaveEdit = () => {
    if (!editingNoteId) return;
    const trimmedTitle = editTitle.trim();
    const trimmedContent = editContent.trim();

    if (!trimmedTitle && !trimmedContent) {
      showToast(ar ? 'لا يمكن حفظ ملاحظة فارغة' : 'Cannot save an empty note');
      return;
    }

    updateQuickNote(editingNoteId, {
      title: trimmedTitle,
      content: trimmedContent,
      color: editColor,
    });

    setEditingNoteId(null);
    reloadNotes();
    showToast(ar ? 'تم تحديث الملاحظة بنجاح' : 'Note updated successfully');
  };

  // Delete note
  const handleDeleteNote = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const { deletedNote, restore } = deleteQuickNote(id);
    if (editingNoteId === id) setEditingNoteId(null);
    reloadNotes();

    showToast(
      ar ? 'تم حذف الملاحظة' : 'Note deleted',
      restore ? () => {
        restore();
        reloadNotes();
        showToast(ar ? 'تم استرجاع الملاحظة' : 'Note restored');
      } : undefined
    );
  };

  // Filter notes by search
  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = notes;
    if (noteFilter === 'pinned') result = result.filter(note => note.isPinned);
    if (noteFilter === 'recent') result = result.slice(0, 5);
    if (!query) return result;
    return result.filter(n => {
      const titleMatch = (n.title || '').toLowerCase().includes(query);
      const contentMatch = (n.content || '').toLowerCase().includes(query);
      return titleMatch || contentMatch;
    });
  }, [notes, searchQuery, noteFilter]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6"
      dir={ar ? 'rtl' : 'ltr'}
      role="presentation"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={ar ? 'إغلاق النافذة' : 'Close dialog'}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-md transition-opacity duration-200 dark:bg-black/70"
      />

      {/* Dialog container */}
      <section
        ref={dialogRef}
        id="quick-notes-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onKeyDown={trapFocus}
        className="relative flex max-h-[min(900px,calc(100dvh-1.5rem))] w-full max-w-[780px] flex-col overflow-hidden rounded-[26px] border border-white/50 bg-[rgba(250,248,239,0.98)] shadow-2xl shadow-slate-950/25 transition-all motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-200 dark:border-white/[0.12] dark:bg-[#10251f] dark:shadow-black/60"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3.5 sm:px-6 sm:py-4 dark:border-white/[0.08]">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#0F766E]/15 bg-[#0F766E]/10 text-[#0F766E] shadow-xs dark:border-emerald-400/30 dark:text-emerald-300"
              aria-hidden="true"
            >
              <SquarePen size={22} strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h2
                  id={headingId}
                  className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg dark:text-zinc-100"
                >
                  {ar ? 'ملاحظات سريعة جداً' : 'Very Quick Notes'}
                </h2>
                {notes.length > 0 && (
                  <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    {notes.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label={ar ? 'إغلاق النافذة' : 'Close dialog'}
              title={ar ? 'إغلاق (Esc)' : 'Close (Esc)'}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:border-white/[0.1] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
            >
              <X size={17} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-4 sm:px-6 sm:py-5">
          {/* Part 2: New Note Input Card (Modern Minimal Notes) */}
          <div
            className={`relative rounded-2xl border transition-all duration-200 shadow-xs focus-within:shadow-md ${
              COLOR_CONFIG[draftColor].cardStyle
            }`}
          >
            {/* Title field (Optional) */}
            <div className="px-4 pt-3.5 pb-1">
              <input
                ref={titleInputRef}
                type="text"
                dir={directionForText(draftTitle, ar ? 'rtl' : 'ltr')}
                value={draftTitle}
                onChange={e => setDraftTitle(e.target.value)}
                placeholder={ar ? 'عنوان الملاحظة' : 'Note title'}
                style={{ unicodeBidi: 'plaintext', overflowWrap: 'anywhere', wordBreak: 'normal' }}
                className={`w-full min-w-0 border-0 bg-transparent px-0 text-sm font-bold text-[#17243B] placeholder:text-slate-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500 sm:text-base ${directionForText(draftTitle, ar ? 'rtl' : 'ltr') === 'rtl' ? 'text-right' : 'text-left'}`}
              />
            </div>

            {/* Multiline textarea */}
            <div className="px-4 py-1">
              <textarea
                ref={textareaRef}
                dir={directionForText(draftContent, ar ? 'rtl' : 'ltr')}
                value={draftContent}
                onChange={e => {
                  setDraftContent(e.target.value);
                  requestAnimationFrame(resizeTextarea);
                }}
                rows={2}
                placeholder={ar ? 'شو خطر ببالك؟ اكتب فكرتك هون...' : "What's on your mind? Write your idea here..."}
                style={{ unicodeBidi: 'plaintext', overflowWrap: 'anywhere', wordBreak: 'normal' }}
                className={`block min-h-[54px] max-h-[220px] w-full min-w-0 resize-none overflow-y-auto border-0 bg-transparent px-0 py-1.5 text-sm leading-relaxed text-[#17243B] placeholder:text-slate-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-500 ${directionForText(draftContent, ar ? 'rtl' : 'ltr') === 'rtl' ? 'text-right' : 'text-left'}`}
              />
            </div>

            {/* Card Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/50 px-4 py-2.5 dark:border-white/[0.06]">
              {/* Left Side: Color palette & Draft state */}
              <div className="flex items-center gap-2.5">
                <div
                  role="radiogroup"
                  aria-label={ar ? 'لون الملاحظة' : 'Note color'}
                  className="flex items-center gap-1.5"
                >
                  {COLOR_KEYS.map(c => {
                    const active = draftColor === c;
                    const conf = COLOR_CONFIG[c];
                    return (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        title={ar ? conf.nameAr : conf.nameEn}
                        aria-label={ar ? conf.nameAr : conf.nameEn}
                        onClick={() => setDraftColor(c)}
                        className={`size-6 rounded-full border transition-all ${conf.dotBg} ${
                          active
                            ? 'ring-2 ring-[#0F766E] ring-offset-1 dark:ring-offset-[#10251f] scale-110 shadow-xs'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Draft autosave feedback */}
                {(draftTitle.trim() || draftContent.trim()) && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                    <Check size={13} strokeWidth={2} />
                    <span>{ar ? 'المسودة محفوظة' : 'Draft autosaved'}</span>
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="ms-1 text-[10px] text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 underline cursor-pointer"
                    >
                      {ar ? 'مسح' : 'Clear'}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: Save Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="save-quick-note-btn"
                  onClick={handleCreateNote}
                  disabled={!draftTitle.trim() && !draftContent.trim()}
                  className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#0F766E]/25 transition-[transform,background-color,box-shadow,opacity] hover:bg-[#115E59] hover:shadow-md hover:shadow-[#0F766E]/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#0F766E]"
                >
                  <span>{ar ? 'حفظ الملاحظة' : 'Save note'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Part 3: Saved Notes Section */}
          <div className="space-y-3.5">
            {/* Section Header with Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-[#E7E5E4] bg-white/70 p-1 dark:border-white/[0.08] dark:bg-white/[0.04]">
                  {([
                    ['all', ar ? 'الكل' : 'All'],
                    ['pinned', ar ? 'المثبتة' : 'Pinned'],
                    ['recent', ar ? 'الأحدث' : 'Recent'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNoteFilter(value)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors sm:text-[11px] ${
                        noteFilter === value
                          ? 'bg-[#0F766E] text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-[#17243B] dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 rounded-xl border border-[#E7E5E4] bg-white/70 p-1 dark:border-white/[0.08] dark:bg-white/[0.04]">
                <button
                  type="button"
                  aria-label={ar ? 'عرض البطاقات' : 'Grid view'}
                  aria-pressed={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  className={`flex size-7 items-center justify-center rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#0F766E] text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-[#17243B] dark:hover:bg-white/[0.08]'}`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  aria-label={ar ? 'عرض القائمة' : 'List view'}
                  aria-pressed={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                  className={`flex size-7 items-center justify-center rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#0F766E] text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-[#17243B] dark:hover:bg-white/[0.08]'}`}
                >
                  <List size={14} />
                </button>
              </div>

              {/* Search input */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search
                  size={14}
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={ar ? 'ابحث في الملاحظات...' : 'Search notes...'}
                  className="w-full rounded-xl border border-[#E7E5E4] bg-white/80 py-1.5 pe-8 ps-8 text-xs text-[#17243B] placeholder:text-slate-400 transition-colors focus:border-[#0F766E] focus:bg-white focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-emerald-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={ar ? 'مسح البحث' : 'Clear search'}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Notes List / Grid */}
            {notes.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 px-4 text-center dark:border-white/[0.08]">
                <span className="flex size-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-400/20 dark:text-amber-300">
                  <Lightbulb size={26} strokeWidth={1.8} />
                </span>
                <p className="mt-3 text-sm font-bold text-slate-800 dark:text-zinc-200">
                  {ar ? 'لا توجد ملاحظات بعد' : 'No notes yet'}
                </p>
                <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-zinc-400">
                  {ar
                    ? 'اكتب ما يخطر في بالك في البطاقة أعلاه، واضغط حفظ لتبقى أفكارك مرتبة ومحفوظة دائمًا.'
                    : 'Jot down whatever comes to mind in the card above, then save to keep your ideas organized.'}
                </p>
              </div>
            ) : filteredNotes.length === 0 ? (
              /* Search Empty state */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 py-10 px-4 text-center dark:border-white/[0.08]">
                <Search size={24} className="text-slate-400 dark:text-zinc-500" />
                <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  {ar ? 'لا توجد نتائج تطابق بحثك' : 'No notes found matching your search'}
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 underline font-medium"
                >
                  {ar ? 'عرض جميع الملاحظات' : 'Show all notes'}
                </button>
              </div>
            ) : (
              /* Notes list */
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 items-start gap-3 sm:grid-cols-2' : 'flex flex-col gap-2.5'}>
                {filteredNotes.map(note => {
                  const conf = COLOR_CONFIG[note.color || 'cream'];
                  const isEditing = editingNoteId === note.id;
                  const noteDirection = directionForText(`${note.title} ${note.content}`, ar ? 'rtl' : 'ltr');

                  if (isEditing) {
                    /* Inline Edit Mode */
                    return (
                      <div
                        key={note.id}
                        dir={directionForText(`${editTitle} ${editContent}`, ar ? 'rtl' : 'ltr')}
                        className={`col-span-full rounded-2xl border-2 border-emerald-500/40 p-4 shadow-sm ${
                          COLOR_CONFIG[editColor].cardStyle
                        }`}
                      >
                        <div className="mb-2">
                          <input
                            type="text"
                            dir={directionForText(editTitle, ar ? 'rtl' : 'ltr')}
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            placeholder={ar ? 'عنوان الملاحظة' : 'Note title'}
                            style={{ unicodeBidi: 'plaintext', overflowWrap: 'anywhere', wordBreak: 'normal' }}
                            className={`w-full min-w-0 border-0 bg-transparent px-0 text-sm font-bold text-[#17243B] focus:outline-none dark:text-zinc-100 ${directionForText(editTitle, ar ? 'rtl' : 'ltr') === 'rtl' ? 'text-right' : 'text-left'}`}
                          />
                        </div>
                        <div className="mb-3">
                          <textarea
                            dir={directionForText(editContent, ar ? 'rtl' : 'ltr')}
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            rows={3}
                            placeholder={ar ? 'محتوى الملاحظة...' : 'Note content...'}
                            style={{ unicodeBidi: 'plaintext', overflowWrap: 'anywhere', wordBreak: 'normal' }}
                            className={`w-full min-w-0 resize-none border-0 bg-transparent px-0 text-xs leading-relaxed text-slate-800 focus:outline-none dark:text-zinc-200 sm:text-sm ${directionForText(editContent, ar ? 'rtl' : 'ltr') === 'rtl' ? 'text-right' : 'text-left'}`}
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/50 pt-3 dark:border-white/[0.06]">
                          {/* Color selector */}
                          <div className="flex items-center gap-1.5">
                            {COLOR_KEYS.map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setEditColor(c)}
                                className={`size-5 rounded-full border ${COLOR_CONFIG[c].dotBg} ${
                                  editColor === c ? 'ring-2 ring-emerald-500 scale-110' : 'opacity-70'
                                }`}
                              />
                            ))}
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200/60 dark:text-zinc-400 dark:hover:bg-white/[0.08]"
                            >
                              {ar ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500"
                            >
                              {ar ? 'حفظ التعديل' : 'Save changes'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <article
                      key={note.id}
                      dir={noteDirection}
                      onClick={() => handleStartEdit(note)}
                      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-3 transition-all duration-200 cursor-pointer shadow-[0_8px_24px_-18px_rgba(23,36,59,0.28)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(23,36,59,0.34)] ${
                        conf.cardStyle
                      } ${
                        note.isPinned
                          ? 'border-[#0F766E]/40 ring-1 ring-[#0F766E]/20 dark:border-emerald-400/30 dark:ring-emerald-400/20'
                          : ''
                      }`}
                    >
                      {/* Top bar of note: Title & Actions */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border ${conf.badgeStyle}`} aria-hidden="true">
                            <Lightbulb size={14} strokeWidth={1.8} />
                          </span>

                          {/* Action Toolbar on card */}
                          <div
                            className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                            onClick={e => e.stopPropagation()}
                          >
                            {/* Pin / Unpin */}
                            <button
                              type="button"
                              title={note.isPinned ? (ar ? 'إلغاء التثبيت' : 'Unpin') : (ar ? 'تثبيت في الأعلى' : 'Pin to top')}
                              aria-label={note.isPinned ? (ar ? 'إلغاء التثبيت' : 'Unpin') : (ar ? 'تثبيت في الأعلى' : 'Pin to top')}
                              onClick={e => handleTogglePin(note.id, e)}
                              className={`flex size-7 items-center justify-center rounded-lg border transition-colors ${
                                note.isPinned
                          ? `${conf.badgeStyle}`
                                  : 'border-transparent text-slate-400 hover:border-slate-200 hover:bg-white hover:text-slate-700 dark:text-zinc-500 dark:hover:border-white/10 dark:hover:bg-white/[0.08] dark:hover:text-zinc-200'
                              }`}
                            >
                              {note.isPinned ? <PinOff size={13} /> : <Pin size={13} />}
                            </button>

                            {/* Copy text */}
                            <button
                              type="button"
                              title={ar ? 'نسخ الملاحظة' : 'Copy note'}
                              aria-label={ar ? 'نسخ الملاحظة' : 'Copy note'}
                              onClick={e => handleCopyNote(note, e)}
                              className="flex size-7 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-700 dark:text-zinc-500 dark:hover:border-white/10 dark:hover:bg-white/[0.08] dark:hover:text-zinc-200"
                            >
                              {copiedNoteId === note.id ? (
                                <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              title={ar ? 'تعديل الملاحظة' : 'Edit note'}
                              aria-label={ar ? 'تعديل الملاحظة' : 'Edit note'}
                              onClick={e => handleStartEdit(note, e)}
                              className="flex size-7 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-700 dark:text-zinc-500 dark:hover:border-white/10 dark:hover:bg-white/[0.08] dark:hover:text-zinc-200"
                            >
                              <Edit3 size={13} />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              title={ar ? 'حذف الملاحظة' : 'Delete note'}
                              aria-label={ar ? 'حذف الملاحظة' : 'Delete note'}
                              onClick={e => handleDeleteNote(note.id, e)}
                              className="flex size-7 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:border-red-500/20 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 min-w-0 w-full">
                          {note.isPinned && (
                            <span className={`mb-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${conf.badgeStyle}`}>
                              <Pin size={10} />
                              {ar ? 'مثبتة' : 'Pinned'}
                            </span>
                          )}
                          {note.title && (
                            <h4 dir="auto" style={{ unicodeBidi: 'plaintext', overflowWrap: 'normal', wordBreak: 'normal' }} className="w-full min-w-0 truncate whitespace-nowrap text-sm font-bold text-[#17243B] dark:text-zinc-100">
                              {note.title}
                            </h4>
                          )}
                        </div>

                        {/* Content */}
                        <p dir="auto" style={{ unicodeBidi: 'plaintext', overflowWrap: 'anywhere', wordBreak: 'normal' }} className="mt-1.5 line-clamp-3 w-full min-w-0 whitespace-pre-wrap text-xs leading-relaxed text-[#536176] dark:text-zinc-300">
                          {note.content}
                        </p>
                      </div>

                      {/* Footer: Date and subtle indicator */}
                      <footer className="mt-3 flex items-center justify-between border-t border-slate-200/40 pt-2 text-[10px] text-slate-400 dark:border-white/[0.05] dark:text-zinc-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={11} strokeWidth={1.7} />
                          <time dateTime={note.createdAt}>
                            {formatNoteTimestamp(note.createdAt, lang)}
                          </time>
                        </span>

                        <span className="text-[10px] opacity-0 transition-opacity group-hover:opacity-100 text-emerald-600 dark:text-emerald-400 font-medium">
                          {ar ? 'اضغط للتعديل' : 'Click to edit'}
                        </span>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Floating Toast inside modal */}
        {toast && (
          <div
            role="status"
            className="pointer-events-auto absolute bottom-4 start-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-2xl border border-slate-300/80 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-900 shadow-xl backdrop-blur-md dark:border-white/15 dark:bg-[#121319]/95 dark:text-zinc-100"
          >
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span>{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                onClick={toast.undo}
                className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                <Undo2 size={12} />
                {ar ? 'تراجع' : 'Undo'}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
