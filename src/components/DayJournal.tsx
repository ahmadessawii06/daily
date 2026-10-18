import React, { useEffect, useState } from 'react';
import { JournalNotebook } from './JournalNotebook';
import type { Language } from '../types';
import { getDayRecord, saveDayJournal } from '../utils/storage';

export function DayJournal({ date, lang, onSaved, initiallyExpanded = false }: { date: string; lang: Language; onSaved: () => void; initiallyExpanded?: boolean }) {
  const [text, setText] = useState(() => getDayRecord(date).notes || '');
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(initiallyExpanded);
  useEffect(() => {
    const refresh = () => { if (!failed) setText(getDayRecord(date).notes || ''); };
    window.addEventListener('mizan:data-synced', refresh);
    return () => window.removeEventListener('mizan:data-synced', refresh);
  }, [date, failed]);
  const save = (value: string) => {
    setText(value);
    const saved = saveDayJournal(date, value);
    setFailed(!saved);
    if (saved) onSaved();
  };
  return <JournalNotebook date={date} lang={lang} text={text} failed={failed} expanded={expanded} onToggle={() => setExpanded(value => !value)} onSave={save} />;
}
