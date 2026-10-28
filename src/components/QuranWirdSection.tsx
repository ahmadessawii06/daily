import { BookOpen, Check, ChevronLeft, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { userStorage } from '../utils/scopedStorage';
import { QURAN_READING_SAMPLES } from './religiousContent';

export function QuranWirdSection({ date }: { date: string }) {
  const saved = (() => { try { return JSON.parse(userStorage.getItem('religious_quran_wird') || '{}'); } catch { return {}; } })();
  const [goal, setGoal] = useState<number>(saved.goal || 5);
  const [progress, setProgress] = useState<number>(saved.date === date ? saved.progress || 0 : 0);
  const [surah, setSurah] = useState(saved.surah || 'الفاتحة');
  const [ayah, setAyah] = useState(saved.ayah || '2');
  const save = (next: Partial<typeof saved>) => {
    userStorage.setItem('religious_quran_wird', JSON.stringify({ ...saved, goal, progress, surah, ayah, date, ...next }));
    window.dispatchEvent(new CustomEvent('daily_religious_progress_changed', { detail: { type: 'quran', date } }));
  };
  const percentage = Math.min(100, Math.round(progress / goal * 100));
  return <section dir="rtl" className="religious-section" aria-labelledby="quran-wird-title"><div className="religious-section-heading"><div><p className="religious-kicker">نور يومك</p><h2 id="quran-wird-title">الورد القرآني</h2><p>حدد مقدارًا يسيرًا، وداوم عليه كل يوم.</p></div><BookOpen className="religious-heading-icon" /></div>
    <div className="quran-wird-layout"><div className="quran-goal-card"><div className="quran-goal-heading"><span>هدف اليوم</span><strong>{goal} صفحات</strong></div><div className="religious-progress-track"><span style={{ width: `${percentage}%` }} /></div><div className="quran-progress-meta"><span>{progress} من {goal} صفحات</span><span>{percentage}%</span></div><div className="quran-stepper"><button type="button" onClick={() => { const next = Math.max(1, goal - 1); setGoal(next); save({ goal: next }); }} aria-label="تقليل الهدف"><Minus size={16} /></button><span>عدد الصفحات</span><button type="button" onClick={() => { const next = Math.min(100, goal + 1); setGoal(next); save({ goal: next }); }} aria-label="زيادة الهدف"><Plus size={16} /></button></div><button type="button" className="religious-primary-button" onClick={() => { const next = Math.min(goal, progress + 1); setProgress(next); save({ progress: next }); }}>{progress >= goal ? <><Check size={17} />تم إنجاز الورد</> : <>متابعة القراءة <ChevronLeft size={17} /></>}</button></div>
      <div className="quran-reading-card"><p className="religious-kicker">آخر موضع قراءة</p><h3>{surah}، الآية {ayah}</h3><p>يمكنك تعديل الموضع عند التوقف، ليبقى محفوظًا لحين عودتك.</p><div className="quran-position-fields"><input aria-label="اسم السورة" value={surah} onChange={e => setSurah(e.target.value)} onBlur={() => save({ surah })} /><input aria-label="رقم الآية" inputMode="numeric" value={ayah} onChange={e => setAyah(e.target.value)} onBlur={() => save({ ayah })} /></div><div className="quran-ayah-list">{QURAN_READING_SAMPLES.map(sample => <a key={sample.reference} href={sample.url} target="_blank" rel="noreferrer"><span>{sample.text}</span><small>{sample.reference}</small></a>)}</div></div></div>
  </section>;
}
