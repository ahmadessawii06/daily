import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Check, 
  CheckCheck, 
  BookmarkCheck, 
  ArrowUp, 
  Timer, 
  Play, 
  Pause,
  Copy,
  Plus,
  Minus,
  MoonStar
} from 'lucide-react';
import { AZKAR_MASAA, type ZekrItem } from '../data/azkarMasaa';
import { userStorage } from '../utils/scopedStorage';

interface EveningAdhkarProps {
  date: string;
}

export function EveningAdhkarIslamBook({ date }: EveningAdhkarProps) {
  // Storage keys for Evening Adhkar
  const COUNTS_KEY = `islambook_azkar_evening_counts_${date}`;
  const SETTINGS_KEY = 'islambook_azkar_settings';
  const BOOKMARK_KEY = 'islambook_azkar_evening_bookmark';
  const SESSION_KEY = `islambook_azkar_evening_session_${date}`;

  // Settings State
  const [showTashkeel, setShowTashkeel] = useState<boolean>(() => {
    try {
      const saved = JSON.parse(userStorage.getItem(SETTINGS_KEY) || '{}');
      return saved.showTashkeel !== undefined ? saved.showTashkeel : true;
    } catch { return true; }
  });

  const [isBold, setIsBold] = useState<boolean>(() => {
    try {
      const saved = JSON.parse(userStorage.getItem(SETTINGS_KEY) || '{}');
      return saved.isBold !== undefined ? saved.isBold : true;
    } catch { return true; }
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = JSON.parse(userStorage.getItem(SETTINGS_KEY) || '{}');
      return saved.fontSize || 26;
    } catch { return 26; }
  });

  const [fontFamily, setFontFamily] = useState<string>(() => {
    try {
      const saved = JSON.parse(userStorage.getItem(SETTINGS_KEY) || '{}');
      return saved.fontFamily || 'sf-arabic';
    } catch { return 'sf-arabic'; }
  });

  const [autoScroll, setAutoScroll] = useState<boolean>(() => {
    try {
      const saved = JSON.parse(userStorage.getItem(SETTINGS_KEY) || '{}');
      return saved.autoScroll !== undefined ? saved.autoScroll : true;
    } catch { return true; }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Counts state: tracks how many taps done per zekr
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(userStorage.getItem(COUNTS_KEY) || '{}');
    } catch { return {}; }
  });

  // Bookmark / Current reading position
  const [bookmarkId, setBookmarkId] = useState<string | null>(() => {
    return userStorage.getItem(BOOKMARK_KEY) || null;
  });

  // Session stopwatch & completion state
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(() => {
    try {
      const saved = JSON.parse(userStorage.getItem(SESSION_KEY) || '{}');
      return saved.startTime || null;
    } catch { return null; }
  });

  const [sessionEndTime, setSessionEndTime] = useState<string | null>(() => {
    try {
      const saved = JSON.parse(userStorage.getItem(SESSION_KEY) || '{}');
      return saved.endTime || null;
    } catch { return null; }
  });

  const [isConfirmed, setIsConfirmed] = useState<boolean>(() => {
    try {
      const saved = JSON.parse(userStorage.getItem(SESSION_KEY) || '{}');
      return saved.confirmed || false;
    } catch { return false; }
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    try {
      const saved = JSON.parse(userStorage.getItem(SESSION_KEY) || '{}');
      return saved.elapsed || 0;
    } catch { return 0; }
  });

  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Close settings dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save settings when changed
  useEffect(() => {
    userStorage.setItem(SETTINGS_KEY, JSON.stringify({
      showTashkeel,
      isBold,
      fontSize,
      fontFamily,
      autoScroll
    }));
  }, [showTashkeel, isBold, fontSize, fontFamily, autoScroll]);

  // Save counts when changed
  useEffect(() => {
    userStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
    window.dispatchEvent(new CustomEvent('daily_religious_progress_changed', { detail: { type: 'evening', date } }));
  }, [counts, COUNTS_KEY]);

  // Save session info
  useEffect(() => {
    userStorage.setItem(SESSION_KEY, JSON.stringify({
      startTime: sessionStartTime,
      endTime: sessionEndTime,
      confirmed: isConfirmed,
      elapsed: elapsedSeconds
    }));
  }, [sessionStartTime, sessionEndTime, isConfirmed, elapsedSeconds, SESSION_KEY]);

  // Stopwatch timer interval
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Total counted vs target count
  const totalCountRequired = useMemo(() => {
    return AZKAR_MASAA.reduce((acc, curr) => acc + curr.count, 0);
  }, []);

  const totalCounted = useMemo(() => {
    return AZKAR_MASAA.reduce((acc, curr) => {
      const tapped = counts[curr.id] || 0;
      return acc + Math.min(curr.count, tapped);
    }, 0);
  }, [counts]);

  const completedZekrCount = useMemo(() => {
    return AZKAR_MASAA.filter(z => (counts[z.id] || 0) >= z.count).length;
  }, [counts]);

  const remainingZekrCount = AZKAR_MASAA.length - completedZekrCount;
  const overallPercentage = Math.round(totalCountRequired ? (totalCounted / totalCountRequired) * 100 : 0);

  // Handle tap / decrement
  const handleTap = (zekr: ZekrItem, index: number) => {
    if (!sessionStartTime) {
      const nowStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSessionStartTime(nowStr);
    }
    if (!timerRunning && !isConfirmed) {
      setTimerRunning(true);
    }

    const currentTapped = counts[zekr.id] || 0;
    if (currentTapped >= zekr.count) return;

    const nextTapped = currentTapped + 1;
    const nextCounts = { ...counts, [zekr.id]: nextTapped };
    setCounts(nextCounts);
    setBookmarkId(zekr.id);
    userStorage.setItem(BOOKMARK_KEY, zekr.id);

    // Auto-scroll to next zekr if completed
    if (nextTapped >= zekr.count && autoScroll) {
      if (index + 1 < AZKAR_MASAA.length) {
        const nextZekr = AZKAR_MASAA[index + 1];
        setTimeout(() => {
          const el = document.getElementById(`evening-zekr-row-${nextZekr.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setBookmarkId(nextZekr.id);
            userStorage.setItem(BOOKMARK_KEY, nextZekr.id);
          }
        }, 220);
      } else {
        setTimerRunning(false);
        if (!sessionEndTime) {
          setSessionEndTime(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    }
  };

  // Reset single zekr
  const handleResetZekr = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCounts = { ...counts, [id]: 0 };
    setCounts(nextCounts);
  };

  // Reset all
  const handleResetAll = () => {
    setCounts({});
    userStorage.removeItem(COUNTS_KEY);
    window.dispatchEvent(new CustomEvent('daily_religious_progress_changed', { detail: { type: 'evening', date } }));
    setBookmarkId(null);
    userStorage.removeItem(BOOKMARK_KEY);
    setElapsedSeconds(0);
    setTimerRunning(false);
    setSessionStartTime(null);
    setSessionEndTime(null);
    setIsConfirmed(false);
    userStorage.removeItem(SESSION_KEY);
  };

  // Confirm reading
  const handleConfirmReading = () => {
    setIsConfirmed(true);
    setTimerRunning(false);
    if (!sessionEndTime) {
      setSessionEndTime(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  };

  // Copy zekr text
  const handleCopy = (zekr: ZekrItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `${zekr.subtitle ? zekr.subtitle + '\n' : ''}${zekr.text}\n${zekr.fadl ? 'الفضل: ' + zekr.fadl : ''}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(zekr.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Helper to remove tashkeel if toggled off
  const formatText = (text: string) => {
    if (showTashkeel) return text;
    return text.replace(/[\u064B-\u0652\u0670\u0640]/g, '');
  };

  // Map font key to CSS font-family string (Premium Arabic & Quranic typography)
  const getFontFamilyStyle = (key: string) => {
    switch (key) {
      case 'sf-arabic':
        return "'SF Pro Arabic', -apple-system, BlinkMacSystemFont, sans-serif";
      case 'sf-rounded':
        return "'SF Pro Rounded', 'SF Pro Arabic', -apple-system, sans-serif";
      case 'almarai':
        return "'Almarai', sans-serif";
      case 'readex':
        return "'Readex Pro', sans-serif";
      case 'tajawal':
        return "'Tajawal', sans-serif";
      case 'ibm':
        return "'IBM Plex Sans Arabic', sans-serif";
      case 'uthmanic':
        return "'KFGQPC Uthmanic Script', 'Amiri Quran', serif";
      case 'naskh':
        return "'Noto Naskh Arabic', 'Amiri', serif";
      default:
        return "'SF Pro Arabic', 'Almarai', sans-serif";
    }
  };

  // Format digital clock 00:00:00
  const formatClock = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hrs, mins, secs].map(v => String(v).padStart(2, '0')).join(':');
  };

  return (
    <div className="islambook-container mt-[10px]" dir="rtl" lang="ar">
      {/* Sticky Compact Header for continuous progress visibility while scrolling */}
      <div className="sticky top-[10px] z-40 mb-4 -mx-2 px-2 sm:mx-0 sm:px-0">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2.5 rounded-2xl border border-emerald-500/20 bg-white/95 text-slate-800 dark:border-emerald-400/25 dark:bg-[#06221d]/95 dark:text-white p-2.5 sm:px-4 sm:py-2.5 shadow-xl backdrop-blur-md transition-all">
          {/* Right side (RTL): Section title & settings */}
          <div className="flex w-full lg:w-auto items-center justify-between lg:justify-start gap-2 shrink-0" ref={settingsRef}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-300/30 dark:bg-emerald-500/15 dark:text-teal-200 dark:hover:bg-emerald-500/30 dark:hover:text-white transition-all shadow-2xs"
                aria-label="إعدادات القراءة"
                title="إعدادات القراءة والخط"
              >
                <Sliders size={15} />
              </button>

              <div className="flex items-center gap-1.5">
                <MoonStar size={16} className="text-emerald-600 dark:text-[#2DD4BF]" />
                <span className="font-arabic text-sm font-black text-slate-800 dark:text-white">
                  أذكار المساء
                </span>
              </div>
            </div>

            {/* Jump to bookmark on mobile */}
            {bookmarkId && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById(`evening-zekr-row-${bookmarkId}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="lg:hidden flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 dark:border-emerald-300/30 dark:bg-teal-400/15 dark:text-teal-100"
              >
                <BookmarkCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                <span>تابع القراءة</span>
              </button>
            )}

            {isSettingsOpen && (
              <div className="ib-dropdown-menu absolute right-2 top-12 z-50 w-72 rounded-xl border border-slate-200 bg-white py-2 text-sm text-slate-800 shadow-2xl dark:border-white/10 dark:bg-[#0c2621] dark:text-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTashkeel(!showTashkeel)}
                  className="flex w-full items-center justify-between px-4 py-2 text-right transition hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <span>إظهار التشكيل</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${showTashkeel ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-[#2DD4BF]' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-zinc-400'}`}>
                    {showTashkeel ? 'مفعل' : 'معطل'}
                  </span>
                </button>

                <div className="my-1 h-px bg-slate-200 dark:bg-white/10" />

                <button
                  type="button"
                  onClick={() => setIsBold(!isBold)}
                  className="flex w-full items-center justify-between px-4 py-2 text-right transition hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <span className="font-bold">خط عريض</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${isBold ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-[#2DD4BF]' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-zinc-400'}`}>
                    {isBold ? 'مفعل' : 'معطل'}
                  </span>
                </button>

                <div className="my-1 h-px bg-slate-200 dark:bg-white/10" />

                <div className="px-4 py-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">حجم الخط</span>
                    <span className="rounded border bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:border-white/10 dark:bg-white/5">{fontSize}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFontSize(prev => Math.min(42, prev + 2))}
                      className="flex flex-1 items-center justify-center gap-1 rounded bg-slate-100 py-1 text-xs font-bold transition hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <Plus size={14} /> تكبير
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize(prev => Math.max(18, prev - 2))}
                      className="flex flex-1 items-center justify-center gap-1 rounded bg-slate-100 py-1 text-xs font-bold transition hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <Minus size={14} /> تصغير
                    </button>
                  </div>
                </div>

                <div className="my-1 h-px bg-slate-200 dark:bg-white/10" />

                {/* Font Family Selection */}
                <div className="px-4 py-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">نوع الخط العربي المعتمد</span>
                    <span className="text-[10px] text-emerald-600 dark:text-[#2DD4BF]">خطوط آبل وشركات عالمية</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'sf-arabic', name: 'SF Arabic (آبل الرسمي)', font: "'SF Pro Arabic', sans-serif", badge: 'خط الآيفون المعتمد' },
                      { id: 'sf-rounded', name: 'SF Rounded (آيفون ناعم)', font: "'SF Pro Arabic', sans-serif", badge: 'انسيابي هادئ' },
                      { id: 'almarai', name: 'المراعي (Almarai)', font: "'Almarai', sans-serif", badge: 'فائق الوضوح' },
                      { id: 'readex', name: 'ريدكس (Readex)', font: "'Readex Pro', sans-serif", badge: 'مريح للنظر' },
                      { id: 'tajawal', name: 'تجوال (Tajawal)', font: "'Tajawal', sans-serif", badge: 'تطبيقات الأذكار' },
                      { id: 'ibm', name: 'آي بي إم (IBM Plex)', font: "'IBM Plex Sans Arabic', sans-serif", badge: 'تقني فاخر' },
                      { id: 'uthmanic', name: 'مصحف المدينة (حفص)', font: "'KFGQPC Uthmanic Script', serif", badge: 'رسم المصحف' },
                      { id: 'naskh', name: 'نسخ راقي (Naskh)', font: "'Noto Naskh Arabic', serif", badge: 'كلاسيكي أصيل' },
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFontFamily(f.id)}
                        className={`group relative flex flex-col items-center justify-center rounded-xl p-2 text-center transition-all border ${
                          fontFamily === f.id
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-teal-200 ring-2 ring-emerald-500/30 font-bold shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10'
                        }`}
                        style={{ fontFamily: f.font }}
                      >
                        <span className="text-[13px] leading-tight">{f.name}</span>
                        <span className="mt-1 text-[10px] text-slate-500 dark:text-white/50 group-hover:text-emerald-600 dark:group-hover:text-teal-300">
                          {f.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="my-1 h-px bg-slate-200 dark:bg-white/10" />

                <label className="flex cursor-pointer select-none items-center gap-2 px-4 py-2 transition hover:bg-slate-100 dark:hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={e => setAutoScroll(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-zinc-300">التمرير التلقائي للذكر التالي</span>
                </label>

                <div className="my-1 h-px bg-slate-200 dark:bg-white/10" />

                <button
                  type="button"
                  onClick={handleResetAll}
                  className="flex w-full items-center gap-2 px-4 py-2 text-right text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  <RotateCcw size={14} /> إعادة ضبط جميع العدادات
                </button>
              </div>
            )}
          </div>

          {/* All 5 Stat Circles - Flex centered naturally between right and left controls without overlapping */}
          <div className="flex flex-1 items-center justify-center py-0.5">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-3.5">
              {/* 1. الإجمالي (Total) - Indigo */}
              <div className="flex items-center gap-1.5" title={`إجمالي الأذكار: ${AZKAR_MASAA.length}`}>
                <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-500/40 dark:bg-emerald-500/15 dark:border-emerald-400/50 shadow-xs">
                  <span className="font-numbers text-xs sm:text-sm font-black text-emerald-600 dark:text-[#2DD4BF]">{AZKAR_MASAA.length}</span>
                </div>
                <span className="hidden xl:inline text-xs font-bold text-emerald-700 dark:text-teal-200/90">الإجمالي</span>
              </div>

              {/* 2. مكتملة (Done) - Emerald */}
              <div className="flex items-center gap-1.5" title={`الأذكار المكتملة: ${completedZekrCount}`}>
                <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-500/40 dark:bg-emerald-500/15 dark:border-emerald-400/50 shadow-xs">
                  <span className="font-numbers text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-300">{completedZekrCount}</span>
                </div>
                <span className="hidden xl:inline text-xs font-bold text-emerald-700 dark:text-emerald-200/90">مكتملة</span>
              </div>

              {/* 3. نسبة الإنجاز في المنتصف (Overall Progress %) - Blue/Indigo */}
              <div className="flex items-center gap-1.5" title={`نسبة الإنجاز: ${overallPercentage}%`}>
                <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-500/50 dark:bg-emerald-500/15 dark:border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                  <span className="font-numbers text-xs sm:text-sm font-black text-emerald-600 dark:text-[#2DD4BF]">{overallPercentage}%</span>
                </div>
                <span className="hidden lg:inline text-xs font-bold text-emerald-700 dark:text-[#2DD4BF]">الإنجاز</span>
              </div>

              {/* 4. متبقية (Remaining) - Amber */}
              <div className="flex items-center gap-1.5" title={`الأذكار المتبقية: ${remainingZekrCount}`}>
                <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-amber-50 border-2 border-amber-500/40 dark:bg-amber-500/15 dark:border-amber-400/50 shadow-xs">
                  <span className="font-numbers text-xs sm:text-sm font-black text-amber-600 dark:text-amber-300">{remainingZekrCount}</span>
                </div>
                <span className="hidden xl:inline text-xs font-bold text-amber-700 dark:text-amber-200/90">متبقية</span>
              </div>

              {/* 5. التكرارات (Repetitions) - Rose */}
              <div className="flex items-center gap-1.5" title={`التكرارات المنجزة: ${totalCounted} من ${totalCountRequired}`}>
                <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-rose-50 border-2 border-rose-500/40 dark:bg-rose-500/15 dark:border-rose-400/50 shadow-xs">
                  <span className="font-numbers text-xs sm:text-sm font-black text-rose-600 dark:text-rose-300">{totalCounted}</span>
                </div>
                <span className="hidden xl:inline text-xs font-bold text-rose-700 dark:text-rose-200/90">التكرارات</span>
              </div>
            </div>
          </div>

          {/* Left side (RTL): Quick live indicators & session controls inside sticky header */}
          <div className="flex w-full lg:w-auto items-center justify-between lg:justify-end gap-1.5 sm:gap-2 shrink-0">
            {/* Stopwatch timer */}
            <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 border border-slate-200 dark:text-teal-200 dark:bg-white/5 dark:border-white/10 px-2 py-1 rounded-xl">
              <Timer size={14} className="text-amber-600 dark:text-amber-400" />
              <span className="font-numbers font-bold tabular-nums text-emerald-700 dark:text-[#2DD4BF]">{formatClock(elapsedSeconds)}</span>
            </div>

            {/* Buttons: إيقاف مؤقت / استئناف & ابدأ من جديد */}
            <button
              type="button"
              onClick={() => setTimerRunning(!timerRunning)}
              className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2 sm:px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/15 shadow-2xs"
              title={timerRunning ? 'إيقاف مؤقت للوقت' : 'استئناف مؤقت الوقت'}
            >
              {timerRunning ? <Pause size={13} /> : <Play size={13} />}
              <span className="hidden sm:inline">{timerRunning ? 'إيقاف مؤقت' : 'استئناف'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2 sm:px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/15 shadow-2xs"
              title="إعادة ضبط وبدء القراءة من جديد"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">ابدأ من جديد</span>
            </button>

            {/* Scroll to Top button */}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2 sm:px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/15 shadow-2xs"
              title="الرجوع لأعلى الصفحة"
              aria-label="الرجوع لأعلى الصفحة"
            >
              <ArrowUp size={13} />
              <span className="hidden sm:inline">للأعلى</span>
            </button>

            {/* Progress ratio */}
            <div className="hidden 2xl:flex items-center gap-2 text-xs">
              <span className="font-numbers font-black text-emerald-700 dark:text-[#2DD4BF]" dir="ltr">
                {totalCounted}/{totalCountRequired}
              </span>
              <div className="w-14 sm:w-16 h-2 rounded-full bg-slate-200 dark:bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-emerald-500 to-teal-700 transition-all duration-300"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
              <span className="font-numbers text-[11px] font-bold text-emerald-700 dark:text-[#2DD4BF]">{overallPercentage}%</span>
            </div>

            {/* Jump to bookmark */}
            {bookmarkId && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById(`evening-zekr-row-${bookmarkId}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="hidden lg:flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800 hover:bg-emerald-100 dark:border-emerald-300/30 dark:bg-teal-400/15 dark:text-teal-100 dark:hover:bg-teal-400/25 transition shadow-2xs"
                title="الانتقال إلى آخر ذكر قرأته"
              >
                <BookmarkCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>تابع القراءة</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Stats Circles Bar matching the home page design with Evening Identity */}
      <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 text-slate-800 dark:border-emerald-400/25 dark:bg-gradient-to-l dark:from-[#041a16]/90 dark:via-[#07241e]/80 dark:to-[#041a16]/90 dark:text-white p-3 sm:p-4 shadow-xl backdrop-blur-md transition-colors">
        <div className="flex flex-wrap items-center justify-around gap-2 sm:gap-4">
          {/* 1. الإجمالي (Total) - Indigo ring */}
          <div className="group flex min-w-0 flex-col items-center select-none">
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 dark:border-0 dark:bg-emerald-500/10 shadow-inner">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 dark:border-emerald-400/40" />
              <div className="absolute inset-1 rounded-full border border-emerald-500/60 dark:border-emerald-400/60" />
              <span className="font-numbers text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {AZKAR_MASAA.length}
              </span>
            </div>
            <span className="mt-1.5 font-arabic text-xs font-bold text-slate-700 dark:text-slate-200">
              الإجمالي
            </span>
            <span className="font-numbers text-[11px] font-bold text-emerald-600/90 dark:text-emerald-400/90">
              100%
            </span>
          </div>

          {/* 2. مكتملة (Done) - Emerald ring */}
          <div className="group flex min-w-0 flex-col items-center select-none">
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 dark:border-0 dark:bg-emerald-500/10 shadow-inner">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 dark:border-emerald-400/40" />
              <div className="absolute inset-1 rounded-full border border-emerald-500/60 dark:border-emerald-400/60" />
              <span className="font-numbers text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {completedZekrCount}
              </span>
            </div>
            <span className="mt-1.5 font-arabic text-xs font-bold text-slate-700 dark:text-slate-200">
              مكتملة
            </span>
            <span className="font-numbers text-[11px] font-bold text-emerald-600/90 dark:text-emerald-400/90">
              {Math.round((completedZekrCount / AZKAR_MASAA.length) * 100)}%
            </span>
          </div>

          {/* Center Gauge: Overall Progress % (matching center gauge in reference image) */}
          <div className="group flex min-w-0 flex-col items-center select-none">
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-slate-50 border border-emerald-500/30 dark:bg-white/5 dark:border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              {/* SVG circular gauge */}
              <svg className="absolute inset-0 h-full w-full -rotate-90 transform-gpu p-1" viewBox="0 0 70 70">
                <circle cx="35" cy="35" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200 dark:text-white/10" />
                <circle
                  cx="35"
                  cy="35"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 - (2 * Math.PI * 28 * overallPercentage) / 100}
                  strokeLinecap="round"
                  className="text-emerald-500 dark:text-emerald-400 transition-all duration-700 ease-out"
                />
              </svg>
              <span className="font-numbers text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
                {overallPercentage}<span className="text-xs text-emerald-600 dark:text-[#2DD4BF]">%</span>
              </span>
            </div>
            <span className="mt-1 font-arabic text-xs font-bold text-emerald-700 dark:text-[#2DD4BF]">
              نسبة الإنجاز
            </span>
          </div>

          {/* 3. متبقية (Remaining) - Amber ring */}
          <div className="group flex min-w-0 flex-col items-center select-none">
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-amber-50 border border-amber-200 dark:border-0 dark:bg-amber-500/10 shadow-inner">
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/40 dark:border-amber-400/40" />
              <div className="absolute inset-1 rounded-full border border-amber-500/60 dark:border-amber-400/60" />
              <span className="font-numbers text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                {remainingZekrCount}
              </span>
            </div>
            <span className="mt-1.5 font-arabic text-xs font-bold text-slate-700 dark:text-slate-200">
              متبقية
            </span>
            <span className="font-numbers text-[11px] font-bold text-amber-600/90 dark:text-amber-400/90">
              {Math.round((remainingZekrCount / AZKAR_MASAA.length) * 100)}%
            </span>
          </div>

          {/* 4. تكرارات منجزة - Rose ring */}
          <div className="group flex min-w-0 flex-col items-center select-none">
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-rose-50 border border-rose-200 dark:border-0 dark:bg-rose-500/10 shadow-inner">
              <div className="absolute inset-0 rounded-full border-2 border-rose-500/40 dark:border-rose-400/40" />
              <div className="absolute inset-1 rounded-full border border-rose-500/60 dark:border-rose-400/60" />
              <span className="font-numbers text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                {totalCounted}
              </span>
            </div>
            <span className="mt-1.5 font-arabic text-xs font-bold text-slate-700 dark:text-slate-200">
              التكرارات
            </span>
            <span className="font-numbers text-[11px] font-bold text-rose-600/90 dark:text-rose-400/90">
              من {totalCountRequired}
            </span>
          </div>
        </div>
      </section>

      {/* Azkar Rows List */}
      <div className="ib-card ib-panel mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#06221d] text-slate-800 dark:text-white shadow-xl transition-colors">
        <div className="ib-card-body space-y-3.5 p-2.5 sm:p-4">
          {AZKAR_MASAA.map((zekr, index) => {
            const tapped = counts[zekr.id] || 0;
            const remaining = Math.max(0, zekr.count - tapped);
            const isDone = remaining === 0;
            const isBookmarked = bookmarkId === zekr.id;

            // Circular progress calculation matching main page StatCircle
            const radius = 28;
            const circumference = 2 * Math.PI * radius; // ~ 175.93
            const progressRatio = zekr.count > 0 ? (tapped / zekr.count) : 0;
            const strokeDashoffset = circumference - circumference * Math.min(1, Math.max(0, progressRatio));

            return (
              <div key={zekr.id} className="relative">
                {/* Row with Counter on the RIGHT in RTL */}
                <div
                  id={`evening-zekr-row-${zekr.id}`}
                  className={`ib-zekr-row flex flex-col md:flex-row items-stretch overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isDone 
                      ? 'border-emerald-300/40 bg-emerald-50/30 dark:border-emerald-400/35 dark:bg-[#0a352c]/90' 
                      : 'border-slate-200/90 bg-white dark:border-white/10 dark:bg-[#06231d]/95 hover:border-emerald-500/30'
                  } ${isBookmarked ? 'ring-2 ring-emerald-500 dark:ring-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.18)]' : 'shadow-xs dark:shadow-md dark:shadow-black/20'}`}
                >
                  {/* Counter Box on the RIGHT (in RTL flex-row, this first child is on the far right) */}
                  <div className="ib-zekr-counter-col relative flex shrink-0 flex-col md:w-36 border-b md:border-b-0 md:border-l border-slate-200 dark:border-emerald-500/20">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleTap(zekr, index)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleTap(zekr, index);
                        }
                      }}
                      className={`ib-zekr-counter-box group relative flex h-full cursor-pointer select-none flex-col items-center justify-between p-3.5 transition-all duration-200 ${
                        isDone
                          ? 'bg-emerald-500/10 text-emerald-800 dark:bg-[#0f4438] dark:text-teal-100 shadow-inner'
                          : 'bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-[#093229] dark:hover:bg-[#0d3b31] text-slate-900 dark:text-white shadow-xs'
                      }`}
                      aria-label={`تكرار الذكر، المتبقي ${remaining}`}
                    >
                      {/* Top actions: Check on right, Index on left */}
                      <div className="flex w-full items-center justify-between">
                        <span className="ib-completion-icon inline-flex items-center">
                          {isDone ? (
                            <Check strokeWidth={3} size={22} className="text-emerald-600 dark:text-[#2DD4BF] drop-shadow-xs" />
                          ) : (
                            <span className="block h-5 w-5 rounded-full border-2 border-slate-300 dark:border-white/50 group-hover:border-emerald-500 dark:group-hover:border-white" />
                          )}
                        </span>

                        <span className="font-numbers text-xs font-bold text-slate-400 dark:text-white/60">
                          {index + 1}
                        </span>
                      </div>

                      {/* Center: StatCircle style circular gauge with concentric borders and main page font-numbers */}
                      <div className="relative my-2.5 flex flex-col items-center justify-center">
                        <div className="relative flex h-[72px] w-[72px] items-center justify-center">
                          {/* Inner glow and concentric ring background like main page StatCircle */}
                          <div className={`absolute inset-0 rounded-full border-2 transition-all ${
                            isDone 
                              ? 'border-emerald-500/30 bg-emerald-500/15 dark:border-emerald-400/30 dark:bg-teal-400/10' 
                              : 'border-emerald-500/20 bg-emerald-500/5 dark:border-emerald-400/15 dark:bg-teal-400/5 group-hover:scale-105'
                          }`} />

                          {/* SVG Progress Circle matching StatCircle */}
                          <svg className="absolute inset-0 h-full w-full -rotate-90 transform-gpu" viewBox="0 0 68 68">
                            {/* Track circle */}
                            <circle
                              cx="34"
                              cy="34"
                              r={radius}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.5"
                              className="text-slate-200 dark:text-zinc-700/60"
                            />
                            {/* Active filled arc */}
                            <circle
                              cx="34"
                              cy="34"
                              r={radius}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.5"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              className="text-emerald-600 dark:text-emerald-400 transition-all duration-500 ease-out"
                            />
                          </svg>

                          {/* Center number inside circle: Exact font-numbers from main page */}
                          <span className="font-numbers text-2xl font-black tabular-nums tracking-tight text-slate-800 dark:text-white">
                            {remaining}
                          </span>
                        </div>

                        <span className="mt-1.5 text-[11px] font-bold text-emerald-700 dark:text-[#2DD4BF]">
                          {isDone ? 'مكتمل ✓' : 'اضغط للعد'}
                        </span>
                      </div>

                      {/* Bottom actions: Reset & Copy */}
                      <div className="flex w-full items-center justify-between border-t border-slate-200 dark:border-white/10 pt-1.5 text-slate-500 dark:text-white/80">
                        <button
                          type="button"
                          onClick={(e) => handleResetZekr(zekr.id, e)}
                          className="rounded-lg p-1 transition hover:bg-slate-200 dark:hover:bg-black/20 hover:text-slate-800 dark:hover:text-white"
                          title="إعادة ضبط هذا الذكر"
                        >
                          <RotateCcw size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleCopy(zekr, e)}
                          className="rounded-lg p-1 transition hover:bg-slate-200 dark:hover:bg-black/20 hover:text-slate-800 dark:hover:text-white"
                          title="نسخ الذكر"
                        >
                          {copiedId === zekr.id ? <Check size={15} className="text-emerald-600 dark:text-[#2DD4BF]" /> : <Copy size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Left side (in RTL): Zekr Text and Blessing */}
                  <div className="ib-zekr-content-col flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div>
                      {/* Subtitle / Basmala / Taawwudh */}
                      {zekr.subtitle && (
                        <div className="ib-subtitle mb-2.5 border-b border-emerald-500/15 pb-1.5 font-bold text-emerald-700 dark:text-[#2DD4BF] text-sm sm:text-base">
                          {formatText(zekr.subtitle)}
                        </div>
                      )}

                      {/* Main Zekr Text */}
                      <p
                        className="ib-zekr-text select-text text-justify leading-relaxed text-slate-800 dark:text-[#f7faf8]"
                        style={{
                          fontFamily: getFontFamilyStyle(fontFamily),
                          fontSize: `${fontSize}px`,
                          fontWeight: isBold ? 700 : 400
                        }}
                      >
                        {formatText(zekr.text)}
                      </p>
                    </div>

                    {/* Fadl / Blessing text */}
                    {zekr.fadl && (
                      <div className="ib-zekrbless mt-3.5 flex items-start gap-2 border-t border-emerald-500/15 pt-2.5 text-sm font-semibold text-emerald-800 dark:text-teal-200">
                        <span className="shrink-0 font-bold text-amber-600 dark:text-amber-400">الفضل:</span>
                        <span className="flex-1 leading-normal text-emerald-950/80 dark:text-teal-100/90">{formatText(zekr.fadl)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {index < AZKAR_MASAA.length - 1 && (
                  <hr className="ib-divider my-2.5 h-0.5 border-0 bg-slate-200 dark:bg-emerald-500/10 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reading Summary and Session Box (Aligned with Evening Navy / Indigo Theme) */}
      <section className="ib-reading-summary-card mb-8 mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 dark:border-emerald-400/35 dark:bg-[#06221d] dark:text-white shadow-2xl transition-colors">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 dark:border-emerald-300/20 dark:bg-gradient-to-l dark:from-[#041a16]/90 dark:via-[#07241e]/80 dark:to-[#041a16]/90 px-4 py-3 sm:px-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-emerald-700 dark:text-teal-200 sm:text-lg">
            <Timer size={20} className="text-amber-600 dark:text-amber-400" />
            <span>وقت قراءة أذكار المساء</span>
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTimerRunning(!timerRunning)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white dark:border-white/15 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-white transition hover:bg-slate-100 dark:hover:bg-white/15"
            >
              {timerRunning ? <Pause size={14} /> : <Play size={14} />}
              <span>{timerRunning ? 'إيقاف مؤقت' : 'استئناف'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white dark:border-white/15 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-white transition hover:bg-slate-100 dark:hover:bg-white/15"
            >
              <RotateCcw size={14} />
              <span>ابدأ من جديد</span>
            </button>
          </div>
        </header>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-2">
            {/* Clock & Status */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-emerald-300/20 dark:bg-[#041d18]/80 p-4">
              <div className="font-numbers text-3xl font-extrabold tracking-wider text-emerald-600 dark:text-[#2DD4BF] sm:text-4xl">
                {formatClock(elapsedSeconds)}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-teal-100/75">
                {isConfirmed 
                  ? 'تم تأكيد إتمام قراءة أذكار المساء اليوم ✓'
                  : timerRunning 
                    ? 'مؤقت القراءة يعمل حالياً' 
                    : elapsedSeconds > 0 
                      ? 'المؤقت متوقف مؤقتاً' 
                      : 'يبدأ تلقائياً عند الضغط على أول ذكر'}
              </p>
            </div>

            {/* Counts & Progress */}
            <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-emerald-300/20 dark:bg-[#041d18]/80 p-4">
              <div className="mb-2 flex items-center justify-between text-sm font-bold">
                <span className="text-slate-700 dark:text-teal-100/90">التكرارات المنجزة:</span>
                <span className="font-numbers text-base font-extrabold text-emerald-600 dark:text-[#2DD4BF]" dir="ltr">
                  {totalCounted} / {totalCountRequired}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-700 transition-all duration-300"
                  style={{ width: `${totalCountRequired ? (totalCounted / totalCountRequired) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-teal-100/70">
                <span>الأذكار المكتملة: {completedZekrCount} من {AZKAR_MASAA.length}</span>
                <span className="font-bold font-numbers text-emerald-600 dark:text-[#2DD4BF]">{Math.round(totalCountRequired ? (totalCounted / totalCountRequired) * 100 : 0)}%</span>
              </div>
            </div>
          </div>

          {/* Start and End Times */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-white/10 pt-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-white/60">وقت البدء:</span>
              <strong className="font-numbers text-emerald-700 dark:text-[#2DD4BF]">{sessionStartTime || '—'}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-white/60">وقت الانتهاء:</span>
              <strong className="font-numbers text-emerald-700 dark:text-[#2DD4BF]">{sessionEndTime || '—'}</strong>
            </div>
          </div>

          {/* Actions & Confirm Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-white/10 pt-3">
            <button
              type="button"
              onClick={handleConfirmReading}
              disabled={isConfirmed}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black shadow-md transition ${
                isConfirmed
                  ? 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-emerald-600/40 dark:text-teal-200/60'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-600'
              }`}
            >
              <CheckCheck size={18} strokeWidth={2.5} />
              <span>{isConfirmed ? 'تم تأكيد القراءة ✓' : 'تأكيد القراءة'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/20 dark:bg-transparent dark:text-white/90 dark:hover:bg-white/10 sm:text-sm transition"
            >
              <ArrowUp size={16} />
              <span>العودة لأعلى الصفحة</span>
            </button>
          </div>

          <p className="pt-2 text-center text-[11px] text-slate-400 dark:text-teal-100/50">
            استخدام العدادات اختياري، ويتم حفظ إنجازك وتقدمك تلقائياً لليوم الحالي.
          </p>
        </div>
      </section>
    </div>
  );
}

