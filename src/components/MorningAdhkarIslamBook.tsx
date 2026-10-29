import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen,
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
  Sparkles,
  Sun
} from 'lucide-react';
import { AZKAR_SABAH, type ZekrItem } from '../data/azkarSabah';
import { userStorage } from '../utils/scopedStorage';

interface MorningAdhkarProps {
  date: string;
}

export function MorningAdhkarIslamBook({ date }: MorningAdhkarProps) {
  // Storage keys
  const COUNTS_KEY = `islambook_azkar_morning_counts_${date}`;
  const SETTINGS_KEY = 'islambook_azkar_settings';
  const BOOKMARK_KEY = 'islambook_azkar_morning_bookmark';
  const SESSION_KEY = `islambook_azkar_morning_session_${date}`;

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

    // Active Zekr detection for visual guidance
  const activeZekrId = useMemo(() => {
    if (bookmarkId) {
      const bZekr = AZKAR_SABAH.find(z => z.id === bookmarkId);
      if (bZekr && (counts[bZekr.id] || 0) < bZekr.count) return bookmarkId;
    }
    const firstUnfinished = AZKAR_SABAH.find(z => (counts[z.id] || 0) < z.count);
    return firstUnfinished ? firstUnfinished.id : null;
  }, [bookmarkId, counts]);

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
    window.dispatchEvent(new CustomEvent('daily_religious_progress_changed', { detail: { type: 'morning', date } }));
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
    return AZKAR_SABAH.reduce((acc, curr) => acc + curr.count, 0);
  }, []);

  const totalCounted = useMemo(() => {
    return AZKAR_SABAH.reduce((acc, curr) => {
      const tapped = counts[curr.id] || 0;
      return acc + Math.min(curr.count, tapped);
    }, 0);
  }, [counts]);

  const completedZekrCount = useMemo(() => {
    return AZKAR_SABAH.filter(z => (counts[z.id] || 0) >= z.count).length;
  }, [counts]);

  const remainingZekrCount = AZKAR_SABAH.length - completedZekrCount;
  const overallPercentage = Math.round(totalCountRequired ? (totalCounted / totalCountRequired) * 100 : 0);

  // Handle tap / decrement
  const handleTap = (zekr: ZekrItem, index: number) => {
    // Start timer on first interaction if not started
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
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }
    } catch {}
    const nextCounts = { ...counts, [zekr.id]: nextTapped };
    setCounts(nextCounts);
    setBookmarkId(zekr.id);
    userStorage.setItem(BOOKMARK_KEY, zekr.id);

    // Auto-scroll to next zekr if completed
    if (nextTapped >= zekr.count && autoScroll) {
      if (index + 1 < AZKAR_SABAH.length) {
        const nextZekr = AZKAR_SABAH[index + 1];
        setTimeout(() => {
          const el = document.getElementById(`zekr-row-${nextZekr.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setBookmarkId(nextZekr.id);
            userStorage.setItem(BOOKMARK_KEY, nextZekr.id);
          }
        }, 220);
      } else {
        // Finished all!
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
    window.dispatchEvent(new CustomEvent('daily_religious_progress_changed', { detail: { type: 'morning', date } }));
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

  // Helper to parse source reference in brackets e.g. [البقرة 255]
const parseZekrContent = (text: string) => {
  const match = text.match(/\s*\[([^\]]+)\]\.?\s*$/);
  if (match) {
    return {
      body: text.replace(/\s*\[([^\]]+)\]\.?\s*$/, '').trim(),
      source: match[1].trim(),
    };
  }
  return { body: text, source: null };
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
    <div className="islambook-container mt-2 max-w-5xl mx-auto" dir="rtl" lang="ar">
      {/* 1. Low-Profile Sticky Accomplishment & Navigation Header */}
      <div className="sticky top-[8px] z-40 mb-3.5 -mx-2 px-2 sm:mx-0 sm:px-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 rounded-2xl border border-emerald-600/20 bg-white/95 text-slate-900 dark:border-teal-400/25 dark:bg-[#06221d]/95 dark:text-white px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-lg shadow-slate-900/5 dark:shadow-emerald-950/20 backdrop-blur-md transition-all">
          
          {/* Section Title & Navigation to Current Zekr */}
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-500/25 dark:bg-teal-400/10 dark:border-teal-400/20 shadow-2xs">
                <Sun size={18} className="text-amber-500 dark:text-amber-400" />
              </span>
              <div>
                <h1 className="font-arabic text-sm sm:text-base font-black text-slate-950 dark:text-white leading-tight">
                  أذكار الصباح
                </h1>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                  {completedZekrCount === AZKAR_SABAH.length ? 'أتممت أذكارك بنجاح' : `${remainingZekrCount} متبقية من ${AZKAR_SABAH.length}`}
                </p>
              </div>
            </div>

            {/* Jump to Active Zekr Button */}
            {activeZekrId && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById(`zekr-row-${activeZekrId}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50/90 hover:bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 dark:border-teal-400/30 dark:bg-teal-400/15 dark:text-[#5EEAD4] dark:hover:bg-teal-400/25 transition shadow-2xs"
                title="الانتقال فوراً إلى الذكر الحالي"
              >
                <BookmarkCheck size={13} className="text-emerald-700 dark:text-[#2DD4BF]" />
                <span>الذكر الحالي #{AZKAR_SABAH.findIndex(z => z.id === activeZekrId) + 1}</span>
              </button>
            )}
          </div>

          {/* Central Accomplishment & Progress Hero */}
          <div className="flex flex-1 flex-col items-center justify-center w-full max-w-sm gap-1 select-none">
            <div className="flex items-center justify-between w-full text-xs">
              <span className="font-bold text-slate-700 dark:text-zinc-200 text-[11px] sm:text-xs">
                {completedZekrCount === AZKAR_SABAH.length ? '✨ اكتملت جميع الأذكار' : `${completedZekrCount} من ${AZKAR_SABAH.length} أذكار مكتملة`}
              </span>
              <span className="font-numbers text-emerald-800 dark:text-[#5EEAD4] font-black text-xs sm:text-sm">
                {overallPercentage}%
              </span>
            </div>
            {/* Visual Progress Track */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-l from-emerald-500 via-teal-600 to-emerald-700 dark:from-[#2DD4BF] dark:to-[#0d9488] transition-all duration-500 ease-out"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>

          {/* Secondary Tools Menu & Controls */}
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2 shrink-0" ref={settingsRef}>
            {/* Stopwatch Badge */}
            <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100/90 border border-slate-200 dark:text-teal-200 dark:bg-white/5 dark:border-white/10 px-2.5 py-1 rounded-xl">
              <Timer size={13} className="text-amber-600 dark:text-[#D5B779]" />
              <span className="font-numbers font-bold tabular-nums text-emerald-800 dark:text-[#5EEAD4]">{formatClock(elapsedSeconds)}</span>
            </div>

            {/* Scroll to Top */}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/15 transition shadow-2xs"
              title="الرجوع لأعلى الصفحة"
              aria-label="الرجوع لأعلى الصفحة"
            >
              <ArrowUp size={14} />
            </button>

            {/* Options Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-emerald-600/30 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-teal-400/30 dark:bg-teal-400/15 dark:text-[#5EEAD4] dark:hover:bg-teal-400/25 transition text-xs font-bold shadow-2xs"
                aria-label="خيارات وأدوات القراءة"
                title="خيارات القراءة والخط والمؤقت"
              >
                <Sliders size={14} />
                <span>خيارات</span>
              </button>

              {isSettingsOpen && (
                <div className="ib-dropdown-menu absolute left-0 sm:left-auto sm:right-0 top-10 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-2xl dark:border-white/10 dark:bg-[#0c2621] dark:text-slate-100">
                  <div className="mb-2 pb-2 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">خيارات وأدوات القراءة</span>
                    <button
                      type="button"
                      onClick={() => setTimerRunning(!timerRunning)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      {timerRunning ? <Pause size={12} /> : <Play size={12} />}
                      <span>{timerRunning ? 'إيقاف المؤقت' : 'تشغيل المؤقت'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTashkeel(!showTashkeel)}
                    className="flex w-full items-center justify-between py-1.5 text-right transition hover:text-emerald-700 dark:hover:text-teal-300"
                  >
                    <span className="text-xs font-semibold">إظهار التشكيل</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${showTashkeel ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-zinc-400'}`}>
                      {showTashkeel ? 'مفعل' : 'معطل'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBold(!isBold)}
                    className="flex w-full items-center justify-between py-1.5 text-right transition hover:text-emerald-700 dark:hover:text-teal-300"
                  >
                    <span className="text-xs font-semibold">خط عريض</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${isBold ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-zinc-400'}`}>
                      {isBold ? 'مفعل' : 'معطل'}
                    </span>
                  </button>

                  <div className="my-1.5 h-px bg-slate-100 dark:bg-white/10" />

                  <div className="py-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">حجم الخط</span>
                      <span className="rounded border bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:border-white/10 dark:bg-white/5">{fontSize}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFontSize(prev => Math.min(38, prev + 2))}
                        className="flex flex-1 items-center justify-center gap-1 rounded bg-slate-100 py-1 text-xs font-bold transition hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10"
                      >
                        <Plus size={13} /> تكبير
                      </button>
                      <button
                        type="button"
                        onClick={() => setFontSize(prev => Math.max(18, prev - 2))}
                        className="flex flex-1 items-center justify-center gap-1 rounded bg-slate-100 py-1 text-xs font-bold transition hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10"
                      >
                        <Minus size={13} /> تصغير
                      </button>
                    </div>
                  </div>

                  <div className="my-1.5 h-px bg-slate-100 dark:bg-white/10" />

                  {/* Font selection */}
                  <div className="py-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 block">الخط العربي المعتمد</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'sf-arabic', name: 'SF Arabic (آبل)', font: "'SF Pro Arabic', sans-serif" },
                        { id: 'almarai', name: 'المراعي (واضح)', font: "'Almarai', sans-serif" },
                        { id: 'readex', name: 'ريدكس (مريح)', font: "'Readex Pro', sans-serif" },
                        { id: 'uthmanic', name: 'رسم المصحف', font: "'KFGQPC Uthmanic Script', serif" },
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFontFamily(f.id)}
                          className={`rounded-lg p-1.5 text-center text-xs transition border ${fontFamily === f.id ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:text-teal-200 font-bold' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                          style={{ fontFamily: f.font }}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="my-1.5 h-px bg-slate-100 dark:bg-white/10" />

                  <label className="flex cursor-pointer select-none items-center gap-2 py-1 text-xs text-slate-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={e => setAutoScroll(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>التمرير التلقائي للذكر التالي</span>
                  </label>

                  <div className="my-1.5 h-px bg-slate-100 dark:bg-white/10" />

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('هل تود إعادة ضبط جميع عدادات هذه الجلسة؟')) {
                        handleResetAll();
                        setIsSettingsOpen(false);
                      }
                    }}
                    className="flex w-full items-center gap-1.5 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg px-1.5"
                  >
                    <RotateCcw size={13} />
                    <span>إعادة ضبط جميع الأذكار</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Structured Adhkar Cards List with Strong Visual Hierarchy */}
      <div className="space-y-3">
        {AZKAR_SABAH.map((zekr, index) => {
          const tapped = counts[zekr.id] || 0;
          const remaining = Math.max(0, zekr.count - tapped);
          const isDone = remaining === 0;
          const isActive = zekr.id === activeZekrId && !isDone;
          const isBookmarked = bookmarkId === zekr.id;

          // Circular progress calculation
          const radius = 20;
          const circumference = 2 * Math.PI * radius;
          const progressRatio = zekr.count > 0 ? (tapped / zekr.count) : 0;
          const strokeDashoffset = circumference - circumference * Math.min(1, Math.max(0, progressRatio));

          return (
            <article
              key={zekr.id}
              id={`zekr-row-${zekr.id}`}
              className={`ib-zekr-row relative flex items-stretch gap-3.5 sm:gap-5 overflow-hidden rounded-2xl p-3.5 sm:p-5 transition-all duration-300 ${
                isActive
                  ? 'border-2 border-emerald-500/50 bg-emerald-50/20 dark:border-teal-400/40 dark:bg-[#06241e]/70 shadow-md ring-1 ring-emerald-500/15'
                  : isDone
                    ? 'border border-emerald-500/25 bg-emerald-50/40 dark:border-teal-500/20 dark:bg-[#031d17]/50 shadow-xs'
                    : 'border border-slate-200/80 bg-white hover:border-emerald-500/35 dark:border-white/10 dark:bg-[#071815]/95 shadow-xs'
              }`}
            >
              {/* Integrated Counter Column (Point 3) */}
              <div className="ib-zekr-counter-col relative flex shrink-0 items-center justify-center pl-3.5 sm:pl-4 border-l border-slate-100 dark:border-white/5 rtl:pl-0 rtl:border-l-0 rtl:border-r rtl:border-slate-100 dark:rtl:border-white/5 rtl:pr-3.5 sm:rtl:pr-4 self-stretch">
                <button
                  type="button"
                  onClick={() => handleTap(zekr, index)}
                  disabled={isDone}
                  aria-label={isDone ? `الذكر ${index + 1} مكتمل` : `تكرار الذكر ${index + 1}، المتبقي ${remaining}`}
                  className={`group/tap relative flex shrink-0 w-20 sm:w-24 md:w-26 h-full min-h-[92px] sm:min-h-[100px] flex-col items-center justify-center rounded-xl p-2 sm:p-2.5 transition-all duration-150 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-500 motion-safe:active:scale-95 ${
                    isActive
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-teal-500 dark:hover:bg-teal-600 dark:text-slate-950 shadow-sm'
                      : isDone
                        ? 'bg-emerald-100/80 text-emerald-900 dark:bg-teal-950/70 dark:text-teal-200 border border-emerald-300/70 dark:border-teal-700/50 cursor-default'
                        : 'bg-slate-50/90 hover:bg-emerald-50/80 text-slate-800 dark:bg-white/5 dark:hover:bg-teal-950/30 dark:text-white border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/30 hover:shadow-2xs'
                  }`}
                >
                  {/* Gauge Circle */}
                  <div className="relative flex h-14 w-14 sm:h-15 sm:w-15 items-center justify-center">
                    <div className={`absolute inset-0 rounded-full border-2 transition-all ${
                      isActive
                        ? 'border-white/40 bg-white/15'
                        : isDone 
                          ? 'border-emerald-500/35 bg-emerald-500/15 dark:border-teal-400/35 dark:bg-teal-400/15' 
                          : 'border-emerald-500/20 bg-emerald-500/10 dark:border-emerald-400/20 dark:bg-emerald-400/10 group-hover/tap:scale-105'
                    }`} />

                    <svg className="absolute inset-0 h-full w-full -rotate-90 transform-gpu" viewBox="0 0 56 56">
                      <circle
                        cx="28"
                        cy="28"
                        r={24}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.6"
                        className={`${isActive ? 'text-white/30 dark:text-slate-900/30' : 'text-slate-200 dark:text-zinc-700/60'}`}
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r={24}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.6"
                        strokeDasharray={2 * Math.PI * 24}
                        strokeDashoffset={2 * Math.PI * 24 - (2 * Math.PI * 24 * Math.min(1, Math.max(0, progressRatio)))}
                        strokeLinecap="round"
                        className={`${isActive ? 'text-white dark:text-slate-950' : 'text-emerald-600 dark:text-[#2DD4BF]'} transition-all duration-300 ease-out`}
                      />
                    </svg>

                    {isDone ? (
                      <Check strokeWidth={3.5} size={24} className="text-emerald-700 dark:text-[#2DD4BF] drop-shadow-xs" />
                    ) : (
                      <span className={`font-numbers text-2xl sm:text-3xl font-black tabular-nums tracking-tight ${isActive ? 'text-white dark:text-slate-950' : 'text-slate-950 dark:text-white'}`}>
                        {remaining}
                      </span>
                    )}
                  </div>

                  <span className={`mt-1 text-xs sm:text-xs font-bold tracking-wide ${isActive ? 'text-white/95 dark:text-slate-950 font-extrabold' : isDone ? 'text-emerald-900 dark:text-teal-200' : 'text-slate-700 dark:text-zinc-300'}`}>
                    {isDone ? 'مكتمل ✓' : `${tapped}/${zekr.count}`}
                  </span>
                </button>
              </div>

              {/* Left side (in RTL): Zekr Text and Blessing with Controlled Measure */}
              <div className="ib-zekr-content-col flex min-w-0 flex-1 flex-col justify-center max-w-2xl lg:max-w-3xl py-1">
                {/* Meta Bar: Index, Subtitle/Title, Status Badge, and Quick Actions */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-1.5 mb-2.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                    <span className="font-numbers font-black text-slate-800 dark:text-zinc-200 text-xs sm:text-sm">
                      #{index + 1}
                    </span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/90 text-emerald-900 border border-emerald-300/80 dark:bg-teal-950/80 dark:border-teal-500/40 dark:text-teal-200 px-2.5 py-0.5 text-xs font-bold shadow-2xs">
                        الذكر الحالي
                      </span>
                    )}
                    {isDone && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-900 dark:bg-teal-900/40 dark:border-teal-600/50 dark:text-teal-200 px-2.5 py-0.5 text-xs font-bold shadow-2xs">
                        <Check size={13} strokeWidth={2.5} /> تم الإنجاز
                      </span>
                    )}
                    {zekr.subtitle ? (
                      <h3 className="font-bold text-emerald-950 dark:text-[#5EEAD4] text-sm sm:text-base leading-snug">
                        {formatText(zekr.subtitle)}
                      </h3>
                    ) : (
                      <span className="font-bold text-emerald-900 dark:text-teal-300 text-sm sm:text-base">
                        الذكر #{index + 1}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleCopy(zekr, e)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 transition"
                      title="نسخ الذكر"
                      aria-label="نسخ نص الذكر"
                    >
                      {copiedId === zekr.id ? <Check size={14} className="text-emerald-700 dark:text-[#a7f3d0]" /> : <Copy size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleResetZekr(zekr.id, e)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 transition"
                      title="إعادة ضبط هذا الذكر"
                      aria-label="إعادة ضبط عداد الذكر"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>

                {/* Main Zekr Text (Comfortable Weight 400, Elevated Line-Height 2.15, Breathing Space - Point 2) */}
                {(() => {
                  const { body: zekrBody, source: zekrSource } = parseZekrContent(zekr.text);
                  return (
                    <>
                      <p
                        className="ib-zekr-text select-text text-right text-slate-950 dark:text-[#f8fafc] py-1.5 sm:py-2.5"
                        style={{
                          fontFamily: getFontFamilyStyle(fontFamily),
                          fontSize: `${fontSize}px`,
                          fontWeight: isBold ? 700 : 400,
                          lineHeight: 2.15,
                        }}
                      >
                        {formatText(zekrBody)}
                      </p>

                      {/* Explicit Source Badge with High Contrast and Clear Size */}
                      {zekrSource && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/80 bg-emerald-100/90 dark:border-teal-500/40 dark:bg-teal-950/70 px-3 py-1 text-xs sm:text-sm font-black text-emerald-950 dark:text-teal-200 shadow-2xs">
                            <BookOpen size={14} className="text-emerald-700 dark:text-teal-400" />
                            <span>المصدر: {formatText(zekrSource)}</span>
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Fadl / Blessing text with Elevated Contrast and Larger Size */}
                {zekr.fadl && (
                  <div className="ib-zekrbless mt-3 flex items-start gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50/70 p-2.5 sm:p-3 dark:border-amber-400/25 dark:bg-amber-950/30">
                    <span className="shrink-0 font-black bg-amber-200/90 text-amber-950 border border-amber-400/70 dark:bg-amber-400/25 dark:text-amber-100 dark:border-amber-400/50 px-2.5 py-1 rounded-lg text-xs sm:text-sm shadow-2xs flex items-center gap-1">
                      <Sparkles size={13} className="text-amber-800 dark:text-amber-300" />
                      <span>الفضل:</span>
                    </span>
                    <span className="flex-1 text-sm sm:text-base font-bold leading-relaxed text-slate-900 dark:text-slate-100">
                      {formatText(zekr.fadl)}
                    </span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* 3. Rewarding Completion Banner when All Adhkar are Done */}
      {overallPercentage === 100 && (
        <section className="mt-6 overflow-hidden rounded-3xl border-2 border-emerald-600/30 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 p-6 sm:p-8 text-center shadow-xl dark:border-teal-400/40 dark:from-[#06221d] dark:via-[#082b24] dark:to-[#041a15]">
          <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-teal-400 dark:text-slate-950 shadow-md ring-4 ring-emerald-500/20">
            <CheckCheck size={28} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
            ما شاء الله! أتممت أذكار الصباح كاملة
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            جعلها الله في ميزان حسناتك، وحفظاً وبركةً ليومك وسائر أوقاتك.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="rounded-xl border border-emerald-300/60 bg-white/90 dark:border-white/10 dark:bg-white/5 px-3.5 py-2 font-bold text-slate-900 dark:text-white shadow-2xs">
              ⏱️ مدة الجلسة: <strong className="font-numbers text-emerald-800 dark:text-[#5EEAD4]">{formatClock(elapsedSeconds)}</strong>
            </span>
            <span className="rounded-xl border border-emerald-300/60 bg-white/90 dark:border-white/10 dark:bg-white/5 px-3.5 py-2 font-bold text-slate-900 dark:text-white shadow-2xs">
              📿 إجمالي التكرارات: <strong className="font-numbers text-emerald-800 dark:text-[#5EEAD4]">{totalCounted}</strong>
            </span>
          </div>
        </section>
      )}


      {/* Reading Summary and Session Box (Aligned with Mizan prayer dashboard colors) */}
      <section className="ib-reading-summary-card mb-8 mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 dark:border-teal-400/35 dark:bg-[#06221d] dark:text-white shadow-2xl transition-colors">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 dark:border-teal-300/20 dark:bg-gradient-to-l dark:from-[#041c18]/90 dark:via-[#062620]/80 dark:to-[#041c18]/90 px-4 py-3 sm:px-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-amber-700 dark:text-amber-200 sm:text-lg">
            <Timer size={20} className="text-amber-600 dark:text-[#D5B779]" />
            <span>وقت قراءة الأذكار</span>
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-teal-300/20 dark:bg-[#041915]/80 p-4">
              <div className="font-numbers text-3xl font-extrabold tracking-wider text-teal-600 dark:text-[#5EEAD4] sm:text-4xl">
                {formatClock(elapsedSeconds)}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-teal-100/75">
                {isConfirmed 
                  ? 'تم تأكيد إتمام القراءة اليوم ✓'
                  : timerRunning 
                    ? 'مؤقت القراءة يعمل حالياً' 
                    : elapsedSeconds > 0 
                      ? 'المؤقت متوقف مؤقتاً' 
                      : 'يبدأ تلقائياً عند الضغط على أول ذكر'}
              </p>
            </div>

            {/* Counts & Progress */}
            <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-teal-300/20 dark:bg-[#041915]/80 p-4">
              <div className="mb-2 flex items-center justify-between text-sm font-bold">
                <span className="text-slate-700 dark:text-teal-100/90">التكرارات المنجزة:</span>
                <span className="font-numbers text-base font-extrabold text-teal-600 dark:text-[#5EEAD4]" dir="ltr">
                  {totalCounted} / {totalCountRequired}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-[#2DD4BF] to-[#0d9488] transition-all duration-300"
                  style={{ width: `${totalCountRequired ? (totalCounted / totalCountRequired) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-teal-100/70">
                <span>الأذكار المكتملة: {completedZekrCount} من {AZKAR_SABAH.length}</span>
                <span className="font-bold font-numbers text-teal-600 dark:text-[#5EEAD4]">{Math.round(totalCountRequired ? (totalCounted / totalCountRequired) * 100 : 0)}%</span>
              </div>
            </div>
          </div>

          {/* Start and End Times */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-white/10 pt-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-white/60">وقت البدء:</span>
              <strong className="font-numbers text-teal-700 dark:text-[#5EEAD4]">{sessionStartTime || '—'}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-white/60">وقت الانتهاء:</span>
              <strong className="font-numbers text-teal-700 dark:text-[#5EEAD4]">{sessionEndTime || '—'}</strong>
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
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#22D3B6] dark:text-[#04251F] dark:hover:bg-[#14b8a6]'
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
