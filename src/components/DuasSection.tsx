import { Check, Clipboard, Heart, Search, Share2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { userStorage } from '../utils/scopedStorage';
import { DUAS } from './religiousContent';

const categories = ['الكل', 'رزق', 'استغفار', 'الوالدين', 'النوم', 'الهم والحزن', 'عام'] as const;
export function DuasSection() {
  const [category, setCategory] = useState<(typeof categories)[number]>('الكل');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => { try { return JSON.parse(userStorage.getItem('religious_dua_favorites') || '[]'); } catch { return []; } });
  const [copied, setCopied] = useState<string | null>(null);
  const visible = useMemo(() => DUAS.filter(dua => (category === 'الكل' || dua.category === category) && (!query.trim() || dua.text.includes(query.trim()) || dua.category.includes(query.trim()))), [category, query]);
  const toggleFavorite = (id: string) => { const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id]; setFavorites(next); userStorage.setItem('religious_dua_favorites', JSON.stringify(next)); };
  const copy = async (id: string, text: string) => { try { await navigator.clipboard.writeText(text); setCopied(id); window.setTimeout(() => setCopied(current => current === id ? null : current), 1400); } catch {} };
  const share = async (text: string) => { if (navigator.share) await navigator.share({ text }).catch(() => {}); else await copy('share', text); };
  return <section dir="rtl" className="religious-section" aria-labelledby="duas-title"><div className="religious-section-heading"><div><p className="religious-kicker">طمأنينة القلب</p><h2 id="duas-title">الأدعية</h2><p>أدعية مختارة من القرآن الكريم والسنة النبوية.</p></div><Heart className="religious-heading-icon" /></div><div className="dua-toolbar"><div className="dua-search"><Search size={17} /><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث في الأدعية..." aria-label="البحث في الأدعية" /></div><div className="dua-categories" role="tablist" aria-label="تصنيفات الأدعية">{categories.map(item => <button key={item} type="button" role="tab" aria-selected={category === item} onClick={() => setCategory(item)} className={category === item ? 'is-active' : ''}>{item}</button>)}</div></div><div className="dua-grid">{visible.map(dua => <article className="dua-card" key={dua.id}><div className="dua-card-header"><span>{dua.category}</span><button type="button" onClick={() => toggleFavorite(dua.id)} aria-label="حفظ في المفضلة" className={favorites.includes(dua.id) ? 'is-favorite' : ''}><Heart size={17} fill={favorites.includes(dua.id) ? 'currentColor' : 'none'} /></button></div><p>{dua.text}</p><footer><a href={dua.sourceUrl} target="_blank" rel="noreferrer">{dua.source}</a><div><button type="button" onClick={() => copy(dua.id, dua.text)} aria-label="نسخ الدعاء">{copied === dua.id ? <Check size={15} /> : <Clipboard size={15} />}</button><button type="button" onClick={() => void share(dua.text)} aria-label="مشاركة الدعاء"><Share2 size={15} /></button></div></footer></article>)}</div>{!visible.length && <p className="religious-empty">لا توجد أدعية مطابقة للبحث.</p>}</section>;
}
