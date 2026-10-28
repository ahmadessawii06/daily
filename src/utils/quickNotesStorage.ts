import type { QuickNote, QuickNoteColor } from '../types';
import { userStorage } from './scopedStorage';

const STORAGE_KEY = 'mizan_quick_notes_v1';
const DRAFT_KEY = 'mizan_quick_notes_draft_v1';

export interface QuickNotesDraft {
  title: string;
  content: string;
  color?: QuickNoteColor;
}

function generateNoteId(): string {
  try {
    const random = Array.from(crypto.getRandomValues(new Uint32Array(3))).join('-');
    return `note_${Date.now()}_${random}`;
  } catch {
    return `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export function sortQuickNotes(notes: QuickNote[]): QuickNote[] {
  return [...notes].sort((a, b) => {
    // Pinned notes always come first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // Newest first
    const dateA = new Date(a.createdAt).getTime() || 0;
    const dateB = new Date(b.createdAt).getTime() || 0;
    return dateB - dateA;
  });
}

export function getStoredQuickNotes(): QuickNote[] {
  try {
    const raw = userStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return sortQuickNotes(parsed);
    }
    return [];
  } catch (error) {
    console.error('Failed to parse quick notes:', error);
    return [];
  }
}

export function saveAllQuickNotes(notes: QuickNote[]): void {
  try {
    userStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    window.dispatchEvent(new Event('mizan:quick-notes-updated'));
  } catch (error) {
    console.error('Failed to save quick notes:', error);
  }
}

export function addQuickNote(data: {
  title?: string;
  content: string;
  color?: QuickNoteColor;
  isPinned?: boolean;
}): QuickNote {
  const current = getStoredQuickNotes();
  const now = new Date().toISOString();
  const newNote: QuickNote = {
    id: generateNoteId(),
    title: (data.title || '').trim(),
    content: (data.content || '').trim(),
    color: data.color || 'cream',
    isPinned: Boolean(data.isPinned),
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newNote, ...current];
  saveAllQuickNotes(updated);
  return newNote;
}

export function updateQuickNote(
  id: string,
  updates: {
    title?: string;
    content?: string;
    color?: QuickNoteColor;
    isPinned?: boolean;
  }
): QuickNote | null {
  const current = getStoredQuickNotes();
  const index = current.findIndex(n => n.id === id);
  if (index === -1) return null;

  const existing = current[index];
  const updatedNote: QuickNote = {
    ...existing,
    ...(updates.title !== undefined ? { title: updates.title.trim() } : {}),
    ...(updates.content !== undefined ? { content: updates.content.trim() } : {}),
    ...(updates.color !== undefined ? { color: updates.color } : {}),
    ...(updates.isPinned !== undefined ? { isPinned: updates.isPinned } : {}),
    updatedAt: new Date().toISOString(),
  };

  current[index] = updatedNote;
  saveAllQuickNotes(current);
  return updatedNote;
}

export function togglePinQuickNote(id: string): boolean {
  const current = getStoredQuickNotes();
  const note = current.find(n => n.id === id);
  if (!note) return false;
  const nextPinned = !note.isPinned;
  updateQuickNote(id, { isPinned: nextPinned });
  return nextPinned;
}

export function deleteQuickNote(id: string): {
  deletedNote: QuickNote | null;
  restore: () => void;
} {
  const current = getStoredQuickNotes();
  const noteToDelete = current.find(n => n.id === id) || null;
  if (!noteToDelete) {
    return { deletedNote: null, restore: () => {} };
  }

  const remaining = current.filter(n => n.id !== id);
  saveAllQuickNotes(remaining);

  return {
    deletedNote: noteToDelete,
    restore: () => {
      const refreshed = getStoredQuickNotes();
      if (!refreshed.some(n => n.id === noteToDelete.id)) {
        saveAllQuickNotes([noteToDelete, ...refreshed]);
      }
    },
  };
}

export function getStoredDraft(): QuickNotesDraft {
  try {
    const raw = userStorage.getItem(DRAFT_KEY);
    if (!raw) return { title: '', content: '', color: 'cream' };
    const parsed = JSON.parse(raw);
    return {
      title: parsed.title || '',
      content: parsed.content || '',
      color: parsed.color || 'cream',
    };
  } catch {
    return { title: '', content: '', color: 'cream' };
  }
}

export function saveStoredDraft(draft: QuickNotesDraft): void {
  try {
    if (!draft.title.trim() && !draft.content.trim()) {
      clearStoredDraft();
    } else {
      userStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  } catch (error) {
    console.error('Failed to save draft:', error);
  }
}

export function clearStoredDraft(): void {
  try {
    userStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.error('Failed to clear draft:', error);
  }
}

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const ENGLISH_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function formatNoteTimestamp(isoString: string, lang: 'ar' | 'en' = 'ar'): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const isPM = hours >= 12;
    const hours12 = hours % 12 || 12;
    const period = lang === 'ar' ? (isPM ? 'م' : 'ص') : (isPM ? 'PM' : 'AM');
    const timeStr = `${hours12}:${minutes} ${period}`;

    if (isToday) {
      return lang === 'ar' ? `اليوم، ${timeStr}` : `Today, ${timeStr}`;
    }

    if (isYesterday) {
      return lang === 'ar' ? `أمس، ${timeStr}` : `Yesterday, ${timeStr}`;
    }

    const day = d.getDate();
    const month = lang === 'ar' ? ARABIC_MONTHS[d.getMonth()] : ENGLISH_MONTHS[d.getMonth()];
    const isSameYear = d.getFullYear() === now.getFullYear();

    if (isSameYear) {
      return lang === 'ar' ? `${day} ${month}، ${timeStr}` : `${month} ${day}, ${timeStr}`;
    }

    return lang === 'ar'
      ? `${day} ${month} ${d.getFullYear()}`
      : `${month} ${day}, ${d.getFullYear()}`;
  } catch {
    return '';
  }
}
