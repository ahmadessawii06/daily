import { Check, RotateCcw, RotateCw, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DhikrItem } from './religiousContent';
import { userStorage } from '../utils/scopedStorage';

interface AdhkarSectionProps { kind: 'morning' | 'evening'; date: string; items: DhikrItem[]; }

export function AdhkarSection({ kind, date, items }: AdhkarSectionProps) {
  const key = `religious_adhkar_${kind}_${date}`;
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    try { return JSON.parse(userStorage.getItem(key) || '{}'); } catch { return {}; }
  });
  const completed = useMemo(() => items.filter(item => (counts[item.id] || 0) >= item.count).length, [counts, items]);
  const allDone = completed === items.length && items.length > 0;
  const update = (item: DhikrItem) => {
    const next = { ...counts, [item.id]: Math.min(item.count, (counts[item.id] || 0) + 1) };
    setCounts(next); userStorage.setItem(key, JSON.stringify(next));
  };
  const reset = () => { setCounts({}); userStorage.removeItem(key); };
  const evening = kind === 'evening';
  return <section dir="rtl" className={`religious-section ${evening ? 'religious-evening' : ''}`} aria-labelledby={`${kind}-adhkar-title`}>
    <div className="religious-section-heading">
      <div><p className="religious-kicker">{evening ? 'سكون المساء' : 'بداية مباركة'}</p><h2 id={`${kind}-adhkar-title`}>{evening ? 'أذكار المساء' : 'أذكار الصباح'}</h2><p>أذكار ثابتة من السنة، بهدوء وخطوة واحدة في كل مرة.</p></div>
      <button type="button" onClick={reset} className="religious-ghost-button"><RotateCcw size={16} />إعادة ضبط</button>
    </div>
    <div className="religious-progress-card"><div className="religious-progress-copy"><strong>{completed} من {items.length}</strong><span>أذكار مكتملة اليوم</span></div><div role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={completed} className="religious-progress-track"><span style={{ width: `${items.length ? completed / items.length * 100 : 0}%` }} /></div></div>
    {allDone && <div className="religious-success"><Sparkles size={19} />ما شاء الله، أتممت أذكارك اليوم.</div>}
    <div className="adhkar-grid">{items.map(item => { const current = counts[item.id] || 0; const done = current >= item.count; return <article className={`adhkar-card ${done ? 'is-complete' : ''}`} key={item.id}>
      <div className="adhkar-card-top"><span>{done ? <Check size={17} /> : 'ذِكر'}</span><small>{item.count} مرات</small></div><h3>{item.title}</h3><p className="adhkar-text">{item.text}</p><div className="adhkar-card-footer"><a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.source}</a><button type="button" onClick={() => update(item)} disabled={done} aria-label={`تكرار ${item.title}`}><span>{done ? 'تم' : 'تسبيح'}</span><b>{current}/{item.count}</b></button></div>
    </article>; })}</div>
  </section>;
}
