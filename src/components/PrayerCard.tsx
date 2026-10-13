import { useLayoutEffect, useRef, useState } from 'react';
import { CheckCheck, MoonStar, RefreshCw } from 'lucide-react';
import type { Language, Task, TaskStatus } from '../types';
import type { DailyPrayer } from '../utils/prayerTasks';
import { nextTaskStatus } from '../utils/taskStatus';
import { formatTime12h } from '../utils/date';
import { StatCircle } from './StatCircle';
import { TaskStatusIndicator } from './TaskStatusIndicator';
import { useNablusPrayerTimes } from '../hooks/useNablusPrayerTimes';

const prayerVerses = [
  '﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ﴾',
  '﴿إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا﴾',
  '﴿إِنَّنِي أَنَا اللَّهُ لَا إِلَٰهَ إِلَّا أَنَا فَاعْبُدْنِي وَأَقِمِ الصَّلَاةَ لِذِكْرِي﴾',
  '﴿وَالَّذِينَ هُمْ عَلَىٰ صَلَوَاتِهِمْ يُحَافِظُونَ﴾',
  '﴿رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ﴾',
];

function PrayerVerseBadge() {
  // Choose once per completed card, so ordinary UI updates do not shuffle the message.
  const [verse] = useState(() => prayerVerses[Math.floor(Math.random() * prayerVerses.length)]);
  const badgeRef = useRef<HTMLParagraphElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const badge = badgeRef.current;
    const text = textRef.current;
    if (!badge || !text) return;
    let disposed = false;
    const fitVerse = () => {
      if (disposed) return;
      const style = getComputedStyle(badge);
      const availableWidth = badge.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (availableWidth <= 0) return;
      // Measure the shaped Arabic text with the actual font, then shrink only when needed.
      text.style.fontSize = '12px';
      const naturalWidth = text.getBoundingClientRect().width;
      if (naturalWidth <= availableWidth) return;
      let size = 12 * (availableWidth - 1) / naturalWidth;
      text.style.fontSize = `${size}px`;
      const fittedWidth = text.getBoundingClientRect().width;
      if (fittedWidth > availableWidth) {
        size *= (availableWidth - 1) / fittedWidth;
        text.style.fontSize = `${size}px`;
      }
    };
    fitVerse();
    const observer = new ResizeObserver(fitVerse);
    observer.observe(badge);
    void document.fonts.ready.then(fitVerse);
    document.fonts.addEventListener('loadingdone', fitVerse);
    return () => {
      disposed = true;
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', fitVerse);
    };
  }, [verse]);
  return <p ref={badgeRef} data-prayer-verse lang="ar" dir="rtl" className="order-3 min-w-0 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-center text-xs leading-6 text-emerald-900 dark:border-amber-200/15 dark:bg-amber-200/[0.06] dark:text-amber-100/90 md:order-4"><span ref={textRef} className="inline-block whitespace-nowrap">{verse}</span></p>;
}

interface PrayerCardProps {
  currentDate: string;
  slots: { prayer: DailyPrayer; task?: Task }[];
  lang: Language;
  onAddPrayer: (title: string, time: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

export function PrayerCard({ currentDate, slots, lang, onAddPrayer, onStatusChange }: PrayerCardProps) {
  const ar = lang === 'ar';
  const times = useNablusPrayerTimes(currentDate);
  const done = slots.filter(slot => slot.task?.status === 'done').length;
  const notDone = slots.filter(slot => slot.task?.status === 'not-done').length;
  const pending = slots.length - done - notDone;
  const labels = ar ? { done: 'مكتملة', pending: 'متبقية', 'not-done': 'غير منجزة' }
    : { done: 'Completed', pending: 'Remaining', 'not-done': 'Not done' };
  return (
    <article data-prayer-card aria-label={ar ? 'الصلوات الخمس' : 'Five daily prayers'} className="col-span-full min-w-0 overflow-hidden rounded-3xl border border-emerald-300/70 bg-linear-to-br from-emerald-50 via-white to-amber-50/60 p-4 shadow-xs dark:border-emerald-400/25 dark:from-[#102521] dark:via-[#111b1c] dark:to-[#202219] sm:p-5">
      <div className="grid grid-cols-1 items-center gap-x-5 gap-y-3 md:grid-cols-[minmax(0,1fr)_20rem]">
        <div data-prayer-heading className="order-1 flex min-w-0 items-center gap-3">
          <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/50 bg-amber-100/70 text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200"><MoonStar className="h-6 w-6" strokeWidth={1.6} /></div>
          <div><h3 className="text-base font-bold">{ar ? 'الصلوات الخمس' : 'Five daily prayers'}</h3><p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-100/60">{ar ? `${done} من 5 مكتملة · لحظات ثابتة في يومك` : `${done} of 5 complete · A steady daily rhythm`}</p></div>
        </div>
        <div data-prayer-stats role="group" aria-label={ar ? 'إحصائيات الصلوات' : 'Prayer statistics'} className="order-2 grid grid-cols-4 gap-3">
          <StatCircle compact label={labels.done} value={done} percentage={done * 20} color="emerald" isActive={false} subLabel={`${done * 20}%`} />
          <StatCircle compact label={labels.pending} value={pending} percentage={pending * 20} color="amber" isActive={false} subLabel={`${pending * 20}%`} />
          <StatCircle compact label={labels['not-done']} value={notDone} percentage={notDone * 20} color="rose" isActive={false} subLabel={`${notDone * 20}%`} />
          <StatCircle compact label={ar ? 'الإجمالي' : 'Total'} value={5} percentage={100} color="indigo" isActive={true} subLabel={ar ? 'صلوات' : 'prayers'} />
        </div>
        {done === 5 && <PrayerVerseBadge key={slots.map(slot => slot.task?.id).join(':')} />}
        {done === 5 && <div data-prayer-completion role="status" className="order-4 flex w-full max-w-sm items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300 md:order-3">
          <span className="inline-flex items-center gap-2"><CheckCheck aria-hidden="true" className="h-4 w-4 shrink-0" />{ar ? 'اكتملت كل المهام' : 'All tasks complete'}</span>
          <span dir="ltr" className="tabular-nums">100%</span>
        </div>}
      </div>
      {times.error && <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/40 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-300/5 dark:text-amber-200"><span>{ar ? 'تعذر تحميل مواقيت الصلاة. تحقق من الاتصال وأعد المحاولة.' : 'Could not load prayer times. Check your connection and retry.'}</span><button type="button" onClick={times.refresh} className="inline-flex min-h-9 items-center gap-1 font-semibold"><RefreshCw aria-hidden="true" className="h-3 w-3" />{ar ? 'إعادة المحاولة' : 'Retry'}</button></div>}
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-emerald-200/60 pt-4 dark:border-emerald-100/10 lg:grid-cols-5">
        {slots.map(({ prayer, task }, index) => {
          const status = task?.status || 'pending';
          const name = ar ? `صلاة ${prayer.nameAr}` : `${prayer.nameEn} prayer`;
          const time = times.data?.prayers.find(item => item.id === prayer.id)?.time;
          const appearance = status === 'done' ? 'border-emerald-400/60 bg-emerald-100/70 dark:bg-emerald-400/10'
            : status === 'not-done' ? 'border-rose-400/60 bg-rose-50 dark:bg-rose-400/10'
            : 'border-emerald-200/70 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]';
          return <div key={prayer.id} data-prayer-slot={prayer.id} data-prayer-status={status} className={`group min-w-0 rounded-2xl border p-3 ${index === 4 ? 'col-span-2 lg:col-span-1' : ''} ${appearance}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0"><p className="break-words text-sm font-bold">{name}</p><p className="mt-1 text-[11px] font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">{time ? <time data-prayer-time dateTime={`${currentDate}T${time}`}>{formatTime12h(time, lang).formatted}</time> : <span>{times.loading ? (ar ? 'تحميل الوقت…' : 'Loading…') : (ar ? 'الوقت غير متاح' : 'Time unavailable')}</span>}</p></div>
              <button type="button" data-task-status={status} aria-label={ar ? `تغيير حالة ${name}: ${labels[status]}` : `Change status of ${name}: ${labels[status]}`} onClick={() => task ? onStatusChange(task.id, nextTaskStatus(status)) : onAddPrayer(`صلاة ${prayer.nameAr}`, time || '')} className="group/status flex h-11 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-emerald-400"><TaskStatusIndicator status={status} /></button>
            </div>
            {status !== 'pending' && <p className={`mt-3 text-[10px] font-semibold ${status === 'done' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>{labels[status]}</p>}
          </div>;
        })}
      </div>
    
    </article>
  );
}
