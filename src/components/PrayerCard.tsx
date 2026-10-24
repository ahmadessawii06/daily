import { useLayoutEffect, useState } from 'react';
import { CalendarDays, Check, MapPin, Moon, MoonStar, RefreshCw, Sun, Sunrise, Sunset, X } from 'lucide-react';
import type { Language, Task, TaskStatus } from '../types';
import type { DailyPrayer } from '../utils/prayerTasks';
import { nextTaskStatus } from '../utils/taskStatus';
import { addDays, formatHeaderDate, formatTime12h } from '../utils/date';
import { useNablusPrayerTimes } from '../hooks/useNablusPrayerTimes';
import { getDateTimeInPrayerTimeZone, getNextPrayerSchedule, getPrayerIntervalProgress, getPrayerTimeZoneDate, isPrayerUpcomingOnDate } from '../utils/prayerSchedule';
const fajrImage = new URL('../assets/images/prayers/fajr.png', import.meta.url).href;
const dhuhrImage = new URL('../assets/images/prayers/dhuhr.png', import.meta.url).href;
const asrImage = new URL('../assets/images/prayers/asr.png', import.meta.url).href;
const maghribImage = new URL('../assets/images/prayers/maghrib.png', import.meta.url).href;
const ishaImage = new URL('../assets/images/prayers/isha.png', import.meta.url).href;
const mosqueImage = new URL('../assets/images/prayers/mosque.png', import.meta.url).href;

const prayerVerses = [
  { text: '﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ﴾', source: 'سورة البقرة • الآية ٢٣٨' },
  { text: '﴿إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا﴾', source: 'سورة النساء • الآية ١٠٣' },
  { text: '﴿إِنَّنِي أَنَا اللَّهُ لَا إِلَٰهَ إِلَّا أَنَا فَاعْبُدْنِي وَأَقِمِ الصَّلَاةَ لِذِكْرِي﴾', source: 'سورة طه • الآية ١٤' },
  { text: '﴿وَالَّذِينَ هُمْ عَلَىٰ صَلَوَاتِهِمْ يُحَافِظُونَ﴾', source: 'سورة المؤمنون • الآية ٩' },
  { text: '﴿رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ﴾', source: 'سورة إبراهيم • الآية ٤٠' },
];

function PrayerVerseBadge() {
  const [verse] = useState(() => prayerVerses[Math.floor(Math.random() * prayerVerses.length)]);
  return <div data-prayer-verse lang="ar" dir="rtl" className="w-full min-w-0 rounded-[14px] border border-[rgba(190,155,85,0.24)] bg-[rgba(5,20,18,0.72)] px-3 py-2 text-center text-[#F8EBCD] sm:px-4">
    <p className="quran-verse-text">{verse.text}</p>
    <p className="mt-2 flex items-center justify-center gap-2 text-[15px] font-medium leading-5 text-[#D5B779]">
      <span aria-hidden="true" className="h-px w-5 bg-[#D5B779]/35" />
      <span>{verse.source}</span>
      <span aria-hidden="true" className="h-px w-5 bg-[#D5B779]/35" />
    </p>
  </div>;
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
  const [now, setNow] = useState(() => new Date());
  const yesterdayDate = addDays(currentDate, -1);
  const yesterdayTimes = useNablusPrayerTimes(yesterdayDate);
  const tomorrowDate = addDays(currentDate, 1);
  const tomorrowTimes = useNablusPrayerTimes(tomorrowDate);
  useLayoutEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isToday = currentDate === getPrayerTimeZoneDate(now);
  const prayerTimes = slots.map(({ prayer, task }) => ({
    prayer,
    task,
    time: times.data?.prayers.find(item => item.id === prayer.id)?.time,
  }));
  const tomorrowFajrTime = tomorrowTimes.data?.prayers.find(item => item.id === 'fajr')?.time;
  const scheduledTimes = prayerTimes.flatMap(item => item.time ? [{ id: item.prayer.id, time: item.time }] : []);
  const scheduledPrayer = isToday
    ? getNextPrayerSchedule(scheduledTimes, tomorrowFajrTime, now)
    : null;
  const scheduledPrayerInfo = scheduledPrayer
    ? prayerTimes.find(item => item.prayer.id === scheduledPrayer.id)
    : undefined;
  const nextPrayer = isToday
    ? scheduledPrayer && scheduledPrayerInfo
      ? { ...scheduledPrayerInfo, time: scheduledPrayer.time }
      : undefined
    : prayerTimes.find(item => item.task?.status !== 'done') || prayerTimes[0];
  const nextPrayerIsTomorrow = Boolean(isToday && scheduledPrayer?.isTomorrow);
  const countdownTarget = isToday && scheduledPrayer
    ? getDateTimeInPrayerTimeZone(scheduledPrayer.date, scheduledPrayer.time)
    : null;
  const remainingSeconds = countdownTarget && countdownTarget.getTime() > now.getTime()
    ? Math.floor((countdownTarget.getTime() - now.getTime()) / 1000)
    : null;
  const countdown = remainingSeconds === null ? null : [
    Math.floor(remainingSeconds / 3600),
    Math.floor((remainingSeconds % 3600) / 60),
    remainingSeconds % 60,
  ].map(value => String(value).padStart(2, '0')).join(':');
  const scheduledPrayerIndex = scheduledPrayer && !scheduledPrayer.isTomorrow
    ? prayerTimes.findIndex(item => item.prayer.id === scheduledPrayer.id)
    : -1;
  const previousPrayer = scheduledPrayer?.isTomorrow
    ? prayerTimes.find(item => item.prayer.id === 'isha')
    : scheduledPrayerIndex > 0
      ? prayerTimes[scheduledPrayerIndex - 1]
      : scheduledPrayerIndex === 0
        ? { prayer: prayerTimes.find(item => item.prayer.id === 'isha')?.prayer, time: yesterdayTimes.data?.prayers.find(item => item.id === 'isha')?.time }
        : undefined;
  const countdownProgress = isToday && scheduledPrayer && previousPrayer?.time
    ? getPrayerIntervalProgress(
        scheduledPrayerIndex === 0 && !scheduledPrayer.isTomorrow ? yesterdayDate : currentDate,
        previousPrayer.time,
        scheduledPrayer.date,
        scheduledPrayer.time,
        now,
      )
    : null;
  const statusLabels = ar
    ? { done: 'مكتملة', pending: 'قادمة', 'not-done': 'فائتة' }
    : { done: 'Completed', pending: 'Upcoming', 'not-done': 'Missed' };
  const prayerIcons = {
    fajr: Sunrise,
    dhuhr: Sun,
    asr: Sun,
    maghrib: Sunset,
    isha: Moon,
  };
  const prayerImages = {
    fajr: fajrImage,
    dhuhr: dhuhrImage,
    asr: asrImage,
    maghrib: maghribImage,
    isha: ishaImage,
  };
  const prayerAccents = {
    fajr: 'border-teal-300/40 bg-teal-400/15 text-teal-200 shadow-teal-950/30',
    dhuhr: 'border-amber-300/40 bg-amber-400/15 text-amber-200 shadow-amber-950/30',
    asr: 'border-orange-300/40 bg-orange-400/15 text-orange-200 shadow-orange-950/30',
    maghrib: 'border-rose-300/40 bg-rose-400/15 text-rose-200 shadow-rose-950/30',
    isha: 'border-fuchsia-300/40 bg-fuchsia-400/15 text-fuchsia-200 shadow-fuchsia-950/30',
  };
  const getPrayerName = (prayer: DailyPrayer) => ar ? prayer.nameAr : prayer.nameEn;
  const getPrayerTime = (time?: string, loading = times.loading) => time
    ? formatTime12h(time, lang).formatted
    : loading
      ? (ar ? 'جارٍ تحميل الوقت…' : 'Loading time…')
      : (ar ? 'الوقت غير متاح' : 'Time unavailable');
  const getNextPrayerName = () => nextPrayerIsTomorrow && nextPrayer?.prayer.id === 'fajr'
    ? (ar ? 'فجر الغد' : "Tomorrow's Fajr")
    : nextPrayer ? getPrayerName(nextPrayer.prayer) : '';
  const NextPrayerIcon = nextPrayer ? prayerIcons[nextPrayer.prayer.id] : Sunrise;
  return (
    <article id="onboarding-prayer-card" data-prayer-card data-prayer-showcase aria-label={ar ? 'الصلوات الخمس' : 'Five daily prayers'} className="prayer-card-shell col-span-full min-w-0 overflow-hidden rounded-3xl border border-emerald-400/25 bg-[#071714] text-white shadow-2xl shadow-emerald-950/10">
      <header className="relative isolate flex min-h-20 items-center justify-between gap-3 overflow-hidden border-b border-emerald-300/10 px-4 py-3 sm:px-6">
        <img src={mosqueImage} alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_42%] opacity-40" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-l from-[#041c18]/85 via-[#06221d]/55 to-[#06110f]/20" />
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-400/10 text-amber-300">
            <MoonStar aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-extrabold tracking-tight sm:text-base">{ar ? 'الصلوات الخمس' : 'Five daily prayers'}</h3>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="hidden items-center gap-1.5 rounded-full border border-emerald-300/20 bg-black/20 px-3 py-2 text-[10px] font-semibold text-emerald-50/80 backdrop-blur-sm sm:inline-flex">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-teal-300" />
            {ar ? 'نابلس، فلسطين' : 'Nablus, Palestine'}
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-medium text-white/75 backdrop-blur-sm sm:text-xs">
            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-emerald-300" />
            {formatHeaderDate(currentDate, lang)}
          </p>
        </div>
      </header>

      <div className="prayer-card-content space-y-3 p-3 sm:space-y-4 sm:p-4">
        <section data-prayer-next dir={ar ? 'rtl' : 'ltr'} className="prayer-next-layout relative isolate min-w-0 items-center overflow-hidden rounded-2xl border border-teal-400/40 bg-[#06221d] px-4 py-4 shadow-[0_0_40px_-24px_rgba(16,229,200,0.45)] sm:px-5 sm:py-4 lg:px-8 lg:py-5">
          <img src={mosqueImage} alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_52%] opacity-90" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(270deg,rgba(1,18,18,.94)_0%,rgba(2,26,25,.78)_38%,rgba(3,26,25,.16)_100%),linear-gradient(0deg,rgba(2,14,14,.45),transparent_70%)]" />
          {nextPrayer ? <>
            <div data-prayer-next-info className="flex min-w-0 items-center justify-start gap-4 text-start">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-teal-300/20 bg-teal-400/10 text-teal-300 sm:h-16 sm:w-16">
                <NextPrayerIcon aria-hidden="true" className="h-8 w-8" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-teal-100/75">{ar ? 'الصلاة القادمة' : 'Next prayer'}</p>
                <h4 className="mt-1 truncate text-3xl font-black tracking-tight sm:text-4xl">{getNextPrayerName()}</h4>
                <p className="mt-1 text-lg font-extrabold text-teal-300 sm:text-xl">{getPrayerTime(nextPrayer.time, nextPrayerIsTomorrow ? tomorrowTimes.loading : times.loading)}</p>
              </div>
            </div>
            <div data-prayer-verse-center className="flex min-w-0 items-center justify-center">
              <PrayerVerseBadge />
            </div>
            <div data-prayer-countdown className="flex min-w-0 flex-col items-center justify-center text-center">
              <p className="inline-flex max-w-full items-center justify-center text-xs font-semibold leading-5 text-teal-50/85">
                {ar
                  ? countdown ? `حتى أذان ${getNextPrayerName()}` : `موعد أذان ${getNextPrayerName()}`
                  : countdown ? `Time until ${getNextPrayerName()} prayer` : `${getNextPrayerName()} prayer time`}
              </p>
              {countdown
                ? <p dir="ltr" style={{ fontVariantNumeric: 'tabular-nums' }} className="mt-[5px] w-[9ch] shrink-0 text-center font-mono text-[39px] font-bold leading-none tabular-nums tracking-wide text-[#5EEAD4]">{countdown}</p>
                : <p className="mt-1 text-xl font-black tabular-nums text-teal-300">{getPrayerTime(nextPrayer.time)}</p>}
              {countdown && countdownProgress !== null && <div
                role="progressbar"
                aria-label={ar ? `التقدم من الأذان السابق إلى ${getNextPrayerName()}` : `Progress from previous adhan to ${getNextPrayerName()}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(Math.min(100, Math.max(0, countdownProgress)))}
                className="mt-2 h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-[rgba(94,234,212,0.16)]"
              >
                <div className="h-full rounded-full bg-[#5EEAD4] transition-[width] duration-1000 motion-reduce:transition-none" style={{ width: `${Math.min(100, Math.max(0, countdownProgress))}%` }} />
              </div>}
            </div>
          </> : (
            <div className="flex min-w-0 items-center justify-center px-5 text-sm text-teal-50/70">
              {ar ? 'مواقيت الصلاة غير متاحة حاليًا.' : 'Prayer times are unavailable right now.'}
            </div>
          )}
        </section>

        {times.error && <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/40 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-300/5 dark:text-amber-200"><span>{ar ? 'تعذر تحميل مواقيت الصلاة. تحقق من الاتصال وأعد المحاولة.' : 'Could not load prayer times. Check your connection and retry.'}</span><button type="button" onClick={times.refresh} className="inline-flex min-h-9 items-center gap-1 font-semibold"><RefreshCw aria-hidden="true" className="h-3 w-3" />{ar ? 'إعادة المحاولة' : 'Retry'}</button></div>}

        <div data-prayer-gallery className="prayer-gallery">
        {slots.map(({ prayer, task }) => {
          const status = task?.status || 'pending';
          const time = times.data?.prayers.find(item => item.id === prayer.id)?.time;
          const formattedPrayerTime = time ? formatTime12h(time, lang) : null;
          const isUpcomingPrayer = isPrayerUpcomingOnDate(prayer.id, time, currentDate, isToday, scheduledPrayer);
          const PrayerIcon = prayerIcons[prayer.id];
          const accent = status === 'done' ? 'emerald' : status === 'not-done' ? 'rose' : 'amber';
          const prayerAccent = prayerAccents[prayer.id];
          const statusButtonClass = status === 'done'
            ? 'border-teal-200/25 bg-slate-950/30 text-teal-100/90'
            : status === 'not-done'
              ? 'border-rose-200/30 bg-slate-950/30 text-rose-200'
              : 'border-white/20 bg-slate-950/25 text-white/75';
          return <article key={prayer.id} data-prayer-slot={prayer.id} data-prayer-status={status} data-prayer-accent={accent} data-prayer-upcoming={isUpcomingPrayer || undefined}
            className={`prayer-slot-card group relative isolate min-w-0 overflow-hidden rounded-2xl border shadow-md shadow-black/15 transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-teal-300/60 motion-reduce:transition-none ${
              status === 'done' ? 'border-[#18BFA5]/65 hover:shadow-[0_0_18px_rgba(24,191,165,0.22)]' : status === 'not-done' ? 'border-[#C65B76]/65 hover:shadow-[0_0_18px_rgba(198,91,118,0.22)]' : 'border-white/20 hover:shadow-[0_0_18px_rgba(255,255,255,0.12)]'
            }`}>
            <img src={prayerImages[prayer.id]} alt="" aria-hidden="true" className="absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none" />
            <div aria-hidden="true" className="absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(2,8,24,.12)_0%,rgba(2,8,24,.08)_36%,rgba(1,12,16,.78)_73%,rgba(1,12,16,.97)_100%)]" />
            {isUpcomingPrayer && <div data-prayer-upcoming-outline aria-hidden="true" className="pointer-events-none absolute inset-[2px] z-20 rounded-2xl border-2 border-[#2DD4BF] shadow-[inset_0_0_0_1px_rgba(45,212,191,0.28),0_0_8px_rgba(45,212,191,0.18)]" />}
            <div className="prayer-slot-content relative z-10 flex flex-col items-center px-3 py-3.5 text-center sm:px-4 sm:py-4">
              <button type="button" data-task-status={status}
                aria-label={ar ? `${getPrayerName(prayer)}: ${statusLabels[status]}. تغيير الحالة` : `${getPrayerName(prayer)}: ${statusLabels[status]}. Change status`}
                title={ar ? 'اضغط لتغيير حالة الصلاة' : 'Click to change prayer status'}
                onClick={() => task ? onStatusChange(task.id, nextTaskStatus(status)) : onAddPrayer(`صلاة ${prayer.nameAr}`, time || '')}
                className={`flex h-10 w-10 cursor-pointer items-center justify-center self-center rounded-full border-2 shadow-md shadow-black/45 backdrop-blur-sm transition-[color,background-color,border-color,transform] duration-200 ease-out hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200 motion-reduce:transition-none ${
                status === 'done' ? 'border-white/90 bg-[#22D3B6] text-[#04251F]'
                  : status === 'not-done' ? 'border-rose-100/90 bg-rose-600/90 text-white'
                    : 'border-white/90 bg-slate-950/65 text-white'
              }`}>
                {status === 'done' ? <Check aria-hidden="true" strokeWidth={3} className="prayer-status-check h-[22px] w-[22px]" /> : status === 'not-done' ? <X aria-hidden="true" strokeWidth={3} className="h-5 w-5" /> : <span aria-hidden="true" className="h-5 w-5 rounded-full border-2 border-current" />}
              </button>
              {isUpcomingPrayer && <span data-prayer-upcoming-badge className="mt-2 inline-flex items-center rounded-full border border-teal-300/50 bg-[#04221f]/95 px-2.5 py-1 text-[11px] font-bold leading-4 text-teal-100 shadow-sm backdrop-blur-sm">
                {ar ? 'الصلاة القادمة' : 'Next prayer'}
              </span>}
              <div className="mt-auto flex w-full flex-col items-center">
                <span className={`mb-2 flex h-[38px] w-[38px] items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none ${prayerAccent}`}>
                  <PrayerIcon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h4 className="max-w-full truncate text-base font-extrabold text-white drop-shadow sm:text-lg">{ar ? `صلاة ${getPrayerName(prayer)}` : getPrayerName(prayer)}</h4>
                <p className="mt-1 flex min-h-5 items-center justify-center text-teal-100/90 drop-shadow">
                  {time && formattedPrayerTime
                    ? <time data-prayer-time dateTime={`${currentDate}T${time}`} dir={ar ? 'rtl' : 'ltr'} className="inline-flex items-baseline gap-1.5">
                        <span dir="ltr" style={{ unicodeBidi: 'isolate' }} className="text-[15px] font-bold tabular-nums text-[#5EEAD4]">{formattedPrayerTime.time12}</span>
                        <span dir={ar ? 'rtl' : 'ltr'} className="text-[10px] font-semibold text-teal-100/70">{formattedPrayerTime.period}</span>
                      </time>
                    : <span className="text-xs font-semibold">{getPrayerTime()}</span>}
                </p>
                <span data-task-status={status} aria-label={ar ? `${getPrayerName(prayer)}: ${statusLabels[status]}` : `${getPrayerName(prayer)}: ${statusLabels[status]}`}
                  className={`mt-2 inline-flex min-h-9 min-w-28 items-center justify-center rounded-full border px-3 text-[10px] font-bold shadow-sm backdrop-blur-md ${statusButtonClass}`}>
                  {status === 'pending' ? (ar ? 'لم يحن وقتها' : 'Upcoming') : statusLabels[status]}
                </span>
              </div>

            </div>
          </article>;
        })}
        </div>
      </div>
    </article>
  );
}
