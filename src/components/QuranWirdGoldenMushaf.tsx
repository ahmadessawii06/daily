import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  BookOpen, 
  RotateCcw, 
  CheckCheck, 
  Shuffle, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Moon, 
  Sun, 
  ExternalLink, 
  Calendar, 
  Plus, 
  Minus, 
  Timer, 
  Play, 
  Pause,
  Sparkles,
  Maximize,
  Columns,
  StretchHorizontal,
  Expand
} from 'lucide-react';
import { 
  QURAN_SURAHS, 
  QURAN_JUZS, 
  getSurahForPage, 
  getJuzForPage, 
  getDailyWirdPageForDate, 
  getGoldenQuranPageUrl 
} from '../data/quranNavigation';
import { userStorage } from '../utils/scopedStorage';
import type { Theme } from '../types';

export type QuranViewMode = 'fit-screen' | 'fit-width';

interface QuranWirdProps {
  date: string;
  theme?: Theme;
}

export function QuranWirdGoldenMushaf({ date, theme }: QuranWirdProps) {
  // Storage keys
  const COMPLETED_KEY = `islambook_quran_wird_completed_${date}`;
  const PAGE_KEY = `islambook_quran_wird_page_${date}`;
  const SESSION_KEY = `islambook_quran_wird_session_${date}`;
  const ZOOM_KEY = 'islambook_quran_zoom_level';
  const VIEW_MODE_KEY = 'islambook_quran_view_mode';
  const NIGHT_OVERRIDE_KEY = 'islambook_quran_night_override';

  // Default daily page for this date
  const defaultDailyPage = getDailyWirdPageForDate(date);

  // Current page state
  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
      const saved = userStorage.getItem(PAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 1 && parsed <= 604) return parsed;
      }
      return defaultDailyPage;
    } catch {
      return defaultDailyPage;
    }
  });

  // Completion state
  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    return userStorage.getItem(COMPLETED_KEY) === 'true';
  });

  // View Mode: 'fit-screen' (ملاء الشاشة بالكامل) vs 'fit-width' (ملاء العرض وتكبير الخط)
  const [viewMode, setViewMode] = useState<QuranViewMode>(() => {
    try {
      const saved = userStorage.getItem(VIEW_MODE_KEY) as QuranViewMode;
      if (saved === 'fit-screen' || saved === 'fit-width') return saved;
      return 'fit-screen';
    } catch {
      return 'fit-screen';
    }
  });

  // Dark / Night theme handling:
  // 1. Detects app's current theme
  const isAppDark = theme === 'dark' || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  
  // 2. Allows manual override per reader, or automatically adheres to app theme
  const [nightModeOverride, setNightModeOverride] = useState<boolean | null>(() => {
    try {
      const saved = userStorage.getItem(NIGHT_OVERRIDE_KEY);
      return saved !== null ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Effective night mode
  const isNight = nightModeOverride !== null ? nightModeOverride : isAppDark;

  // Zoom level state (percentage: 75% to 500%)
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    try {
      const saved = userStorage.getItem(ZOOM_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 75 && parsed <= 500) return parsed;
      }
      return 100;
    } catch { return 100; }
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  // Timer & Session state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    try {
      const saved = JSON.parse(userStorage.getItem(SESSION_KEY) || '{}');
      return saved.elapsed || 0;
    } catch { return 0; }
  });

  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const readerContainerRef = useRef<HTMLDivElement>(null);

  // Surah & Juz meta
  const currentSurah = getSurahForPage(currentPage);
  const currentJuz = getJuzForPage(currentPage);
  const isTodayAssignedPage = currentPage === defaultDailyPage;

  // Persist current page
  useEffect(() => {
    userStorage.setItem(PAGE_KEY, String(currentPage));
  }, [currentPage, PAGE_KEY]);

  // Persist view mode
  const handleSetViewMode = (mode: QuranViewMode) => {
    setViewMode(mode);
    userStorage.setItem(VIEW_MODE_KEY, mode);
  };

  const toggleViewMode = () => {
    handleSetViewMode(viewMode === 'fit-screen' ? 'fit-width' : 'fit-screen');
  };

  // Persist completion state & notify app
  useEffect(() => {
    userStorage.setItem(COMPLETED_KEY, isCompleted ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('daily_religious_progress_changed', { detail: { type: 'quran', date } }));
  }, [isCompleted, COMPLETED_KEY, date]);

  // Session timer ticker
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Save session info
  useEffect(() => {
    userStorage.setItem(SESSION_KEY, JSON.stringify({
      elapsed: elapsedSeconds,
      page: currentPage,
      completed: isCompleted
    }));
  }, [elapsedSeconds, currentPage, isCompleted, SESSION_KEY]);

  // Format clock
  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Page Navigation actions
  const goToPage = useCallback((page: number) => {
    const clamped = Math.max(1, Math.min(604, page));
    setIsLoadingImage(true);
    setCurrentPage(clamped);
    if (!timerRunning && !isCompleted) {
      setTimerRunning(true);
    }
  }, [timerRunning, isCompleted]);

  // Next page in Medina Mushaf (in RTL Quran: Next page is page + 1)
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // Pick random page
  const rollRandomPage = () => {
    let randomP = Math.floor(Math.random() * 604) + 1;
    if (randomP === currentPage) {
      randomP = (randomP % 604) + 1;
    }
    goToPage(randomP);
  };

  // Zoom In / Out handlers (Dynamic step scaling up to 500%)
  const handleZoomIn = () => {
    setZoomLevel(prev => {
      const step = prev >= 300 ? 50 : prev >= 150 ? 25 : 15;
      const next = Math.min(500, prev + step);
      userStorage.setItem(ZOOM_KEY, String(next));
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const step = prev > 300 ? 50 : prev > 150 ? 25 : 15;
      const next = Math.max(75, prev - step);
      userStorage.setItem(ZOOM_KEY, String(next));
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
    userStorage.setItem(ZOOM_KEY, '100');
  };

  const handleSetZoomLevel = (level: number) => {
    const clamped = Math.max(75, Math.min(500, level));
    setZoomLevel(clamped);
    userStorage.setItem(ZOOM_KEY, String(clamped));
  };

  // Night mode toggle
  const handleToggleNightMode = () => {
    const next = !isNight;
    setNightModeOverride(next);
    userStorage.setItem(NIGHT_OVERRIDE_KEY, JSON.stringify(next));
  };

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        nextPage();
      } else if (e.key === 'ArrowRight') {
        prevPage();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      } else if (e.key === 'w' || e.key === 'W') {
        toggleViewMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, viewMode]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!readerContainerRef.current) return;
    if (!document.fullscreenElement) {
      readerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Touch Swipe gestures (strictly checks for horizontal movement and ignores vertical scrolling)
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartXRef.current;
    const diffY = touchEndY - touchStartYRef.current;

    // Only recognize as a page turn if horizontal motion is deliberate and dominates vertical scroll
    // Minimum 75px horizontal distance AND at least 2.5x the vertical distance
    if (Math.abs(diffX) > 75 && Math.abs(diffX) > Math.abs(diffY) * 2.5) {
      if (diffX > 0) {
        prevPage();
      } else {
        nextPage();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Mark completed
  const handleToggleComplete = () => {
    const nextState = !isCompleted;
    setIsCompleted(nextState);
    if (nextState) {
      setTimerRunning(false);
    }
  };

  // Proportional stage sizing
  // In fit-width mode, scale width generously up to 1180px (like GoldenQuran's max-width: 1180px)
  const baseWidth = isFullscreen ? 1100 : 860;
  const scaledWidth = Math.round(baseWidth * (zoomLevel / 100));

  return (
    <div 
      ref={readerContainerRef}
      className={`islambook-container mt-2 w-full max-w-full mx-auto px-2 sm:px-4 transition-colors ${
        isFullscreen ? 'fixed inset-0 z-50 bg-[#071915] p-3 sm:p-6 overflow-y-auto max-w-none' : ''
      }`} 
      dir="rtl" 
      lang="ar"
    >
      {/* 1. Sticky Navigation & Header */}
      <div className="sticky top-[8px] z-40 mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3.5 rounded-2xl border border-emerald-600/20 bg-white/95 text-slate-900 dark:border-teal-400/25 dark:bg-[#06221d]/95 dark:text-white px-3 py-2 sm:px-4 sm:py-2.5 shadow-lg shadow-slate-900/5 dark:shadow-emerald-950/20 backdrop-blur-md transition-all">
          
          {/* Right side: Title & Current Page Meta */}
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-500/25 dark:bg-amber-400/10 dark:border-amber-400/20 shadow-2xs">
                <BookOpen size={18} className="text-amber-600 dark:text-amber-300" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-arabic text-sm sm:text-base font-black text-slate-950 dark:text-white leading-tight">
                    الورد القرآني
                  </h1>
                  {isCompleted && (
                    <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-teal-500/20 dark:text-[#5EEAD4] px-2 py-0.2 text-[10px] font-bold">
                      تم الإنجاز ✓
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                  {currentSurah.name} · {currentJuz.name} · صفحة {currentPage} من 604
                </p>
              </div>
            </div>

            {/* Quick Randomize Page Button */}
            <button
              type="button"
              onClick={rollRandomPage}
              className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50/90 hover:bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-200 dark:hover:bg-amber-400/25 transition shadow-2xs cursor-pointer"
              title="اختيار صفحة عشوائية جديدة من المصحف الشريف"
            >
              <Shuffle size={13} className="text-amber-700 dark:text-amber-300" />
              <span>صفحة عشوائية 🎲</span>
            </button>
          </div>

          {/* Central Controls: Surah & Juz jump + Daily button */}
          <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
            {/* Surah Dropdown */}
            <select
              value={currentSurah.page}
              onChange={(e) => goToPage(Number(e.target.value))}
              className="h-8 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 px-2 text-xs font-bold text-slate-800 dark:text-zinc-200 focus:outline-emerald-500 cursor-pointer"
              aria-label="الانتقال إلى سورة"
            >
              <option value="" disabled>اختر السورة...</option>
              {QURAN_SURAHS.map((s) => (
                <option key={s.number} value={s.page}>
                  {s.number}. {s.name}
                </option>
              ))}
            </select>

            {/* Juz Dropdown */}
            <select
              value={currentJuz.page}
              onChange={(e) => goToPage(Number(e.target.value))}
              className="h-8 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 px-2 text-xs font-bold text-slate-800 dark:text-zinc-200 focus:outline-emerald-500 cursor-pointer"
              aria-label="الانتقال إلى جزء"
            >
              <option value="" disabled>اختر الجزء...</option>
              {QURAN_JUZS.map((j) => (
                <option key={j.number} value={j.page}>
                  {j.name} (ص {j.page})
                </option>
              ))}
            </select>

            {/* Back to Today's Assigned Wird button if not on it */}
            {!isTodayAssignedPage && (
              <button
                type="button"
                onClick={() => goToPage(defaultDailyPage)}
                className="flex items-center gap-1 h-8 rounded-xl border border-emerald-600/30 bg-emerald-50/80 hover:bg-emerald-100 px-2.5 text-xs font-bold text-emerald-900 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-[#5EEAD4] transition cursor-pointer"
                title="الرجوع لصفحة الورد المخصصة لهذا اليوم"
              >
                <Calendar size={13} />
                <span>صفحة اليوم ({defaultDailyPage})</span>
              </button>
            )}
          </div>

          {/* Tools Menu: View Mode Switcher, Zoom Controls, Night Mode, Stopwatch, Fullscreen */}
          <div className="flex flex-wrap w-full sm:w-auto items-center justify-between sm:justify-end gap-1.5 shrink-0">
            
            {/* View Mode Switcher: ملاء الشاشة vs ملاء العرض */}
            <div className="flex items-center rounded-xl border border-emerald-600/20 bg-slate-100/90 dark:border-white/10 dark:bg-white/5 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handleSetViewMode('fit-screen')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'fit-screen'
                    ? 'bg-emerald-600 text-white dark:bg-[#22D3B6] dark:text-[#04251F] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white'
                }`}
                title="ملاء الشاشة: عرض الصفحة بالكامل متناسقة مع ارتفاع الشاشة دون أي قص"
              >
                <StretchHorizontal size={13} />
                <span>ملاء الشاشة</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('fit-width')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'fit-width'
                    ? 'bg-emerald-600 text-white dark:bg-[#22D3B6] dark:text-[#04251F] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white'
                }`}
                title="ملاء العرض: توسيع الصفحة لكامل العرض لتكبير الكلمات وقراءة مريحة مع تمرير عمودي"
              >
                <Expand size={13} />
                <span>ملاء العرض</span>
              </button>
            </div>

            {/* Stopwatch Badge */}
            <div className="flex items-center gap-1 text-xs text-slate-700 bg-slate-100/90 border border-slate-200 dark:text-teal-200 dark:bg-white/5 dark:border-white/10 px-2 py-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTimerRunning(!timerRunning)}
                className="hover:opacity-75 transition cursor-pointer"
                title={timerRunning ? 'إيقاف المؤقت' : 'تشغيل المؤقت'}
              >
                {timerRunning ? <Pause size={12} className="text-emerald-600" /> : <Play size={12} className="text-slate-500" />}
              </button>
              <span className="font-numbers font-bold tabular-nums text-emerald-800 dark:text-[#5EEAD4]">{formatClock(elapsedSeconds)}</span>
            </div>

            {/* Zoom Stepper Controls: [-] [100%] [+] up to 500% */}
            <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/5 px-1 py-0.5 text-xs shadow-2xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 75}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-700 dark:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="تصغير (-)"
                aria-label="تصغير حجم الصفحة"
              >
                <Minus size={13} />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 font-numbers text-[11px] font-black text-slate-700 dark:text-zinc-200 hover:text-emerald-700 dark:hover:text-[#5EEAD4] transition cursor-pointer"
                title="إعادة ضبط الحجم الافتراضي (100%)"
              >
                {zoomLevel}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 500}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-700 dark:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="تكبير (+ حتى 500%)"
                aria-label="تكبير حجم الصفحة حتى 500%"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Quick Preset Buttons (100%, 150%, 200%) */}
            <div className="hidden lg:flex items-center gap-1">
              {[
                { label: '100%', val: 100 },
                { label: '150%', val: 150 },
                { label: '200%', val: 200 }
              ].map(preset => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => handleSetZoomLevel(preset.val)}
                  className={`h-7 px-2 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                    zoomLevel === preset.val
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-teal-500/20 dark:text-[#5EEAD4]'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                  title={`تكبير ${preset.label}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Night mode toggle (Dark Theme) */}
            <button
              type="button"
              onClick={handleToggleNightMode}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border transition shadow-2xs cursor-pointer ${
                isNight 
                  ? 'border-amber-400/40 bg-amber-400/20 text-amber-300 hover:bg-amber-400/30' 
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200'
              }`}
              title={isNight ? 'الوضع الليلي مفعّل (انقر للتحويل للوضع العاجي)' : 'الوضع النهاري مفعّل (انقر للتحويل للوضع الليلي الداكن)'}
              aria-label="تبديل الوضع الليلي والنهاري"
            >
              {isNight ? <Moon size={15} className="text-amber-300" /> : <Sun size={15} className="text-amber-500" />}
            </button>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 transition shadow-2xs cursor-pointer"
              title={isFullscreen ? 'الخروج من ملء الشاشة' : 'عرض ملء الشاشة (F)'}
              aria-label="ملء الشاشة"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Direct GoldenQuran link */}
            <a
              href={`https://goldenquran.org/mushaf/${currentPage}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200 transition shadow-2xs"
              title="فتح هذه الصفحة في المصحف الذهبي"
              aria-label="المصحف الذهبي"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Top Page Quick Nav Bar */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto px-2 mb-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
        {/* Previous page (In RTL, Next is left, Prev is right) */}
        <button
          type="button"
          onClick={prevPage}
          disabled={currentPage <= 1}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#07241e] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs transition cursor-pointer"
        >
          <ChevronRight size={15} />
          <span>السابقة ({currentPage > 1 ? currentPage - 1 : 1})</span>
        </button>

        {/* Direct page input */}
        <div className="flex items-center gap-1.5 bg-white/80 dark:bg-[#07241e]/80 border border-slate-200 dark:border-white/10 px-3 py-1 rounded-xl shadow-2xs">
          <span className="text-slate-500 dark:text-zinc-400">صفحة</span>
          <input
            type="number"
            min={1}
            max={604}
            value={currentPage}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) goToPage(val);
            }}
            className="w-12 text-center font-numbers font-black text-sm text-emerald-800 dark:text-[#5EEAD4] bg-transparent border-b border-emerald-500/40 focus:outline-none"
            aria-label="رقم الصفحة"
          />
          <span className="text-slate-500 dark:text-zinc-400">من 604</span>
        </div>

        {/* Next page */}
        <button
          type="button"
          onClick={nextPage}
          disabled={currentPage >= 604}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#07241e] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs transition cursor-pointer"
        >
          <span>التالية ({currentPage < 604 ? currentPage + 1 : 604})</span>
          <ChevronLeft size={15} />
        </button>
      </div>

      {/* 3. GoldenQuran Reading Stage (Never traps vertical scroll or crops the page) */}
      <div 
        className={`mushaf-stage relative w-full flex items-center justify-center mx-auto my-2 ${
          viewMode === 'fit-width' && zoomLevel > 100 ? 'overflow-x-auto' : 'overflow-visible'
        }`}
        style={{
          touchAction: 'pan-y pinch-zoom',
          overscrollBehaviorY: 'auto',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Floating Side Click Strips (GoldenQuran edge navigation) */}
        <button
          type="button"
          onClick={nextPage}
          disabled={currentPage >= 604}
          className="hidden md:flex items-center justify-center absolute left-1 top-12 bottom-12 w-10 z-30 opacity-0 hover:opacity-100 transition-opacity bg-black/15 hover:bg-amber-500/20 text-amber-300 rounded-xl cursor-pointer disabled:hidden pointer-events-auto"
          title="الصفحة التالية (يسار)"
          aria-label="الصفحة التالية"
        >
          <ChevronLeft size={28} />
        </button>

        <button
          type="button"
          onClick={prevPage}
          disabled={currentPage <= 1}
          className="hidden md:flex items-center justify-center absolute right-1 top-12 bottom-12 w-10 z-30 opacity-0 hover:opacity-100 transition-opacity bg-black/15 hover:bg-amber-500/20 text-amber-300 rounded-xl cursor-pointer disabled:hidden pointer-events-auto"
          title="الصفحة السابقة (يمين)"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight size={28} />
        </button>

        {/* The Golden Quran Sheet Container */}
        <div 
          className="mushaf-sheet relative flex flex-col items-center justify-center rounded-xl sm:rounded-2xl transition-all select-none shadow-2xl"
          style={{
            background: isNight
              ? 'linear-gradient(180deg, #1f1b15 0%, #1b1712 55%, #15120e 100%)'
              : 'linear-gradient(180deg, #fbf6e9 0%, #f7efdc 55%, #efe4c8 100%)',
            border: isNight
              ? '1px solid rgba(196, 156, 64, 0.28)'
              : '1px solid rgba(184, 145, 47, 0.40)',
            boxShadow: isNight
              ? '0 24px 60px -20px rgba(0, 0, 0, 0.85), 0 0 1px rgba(196, 156, 64, 0.3)'
              : '0 24px 60px -20px rgba(63, 43, 8, 0.28), 0 0 1px rgba(184, 145, 47, 0.4)',
            // Exact King Fahd Medina Mushaf scan aspect ratio (1024 / 1656)
            aspectRatio: '1024 / 1656',
            // In Fit Screen mode, constrain by viewport height so nothing is ever clipped
            maxHeight: viewMode === 'fit-screen'
              ? (isFullscreen 
                  ? `calc((100vh - 100px) * ${zoomLevel / 100})` 
                  : `calc((100vh - 180px) * ${zoomLevel / 100})`)
              : 'none',
            // In Fit Width mode, expand generously to fill width and zoom proportionally
            width: viewMode === 'fit-width' ? '100%' : 'auto',
            maxWidth: viewMode === 'fit-width' 
              ? `${scaledWidth}px` 
              : '100%',
            touchAction: 'pan-y pinch-zoom',
          }}
        >
          {/* Loading Spinner / Placeholder */}
          {isLoadingImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fbf6e9]/90 dark:bg-[#15120e]/95 z-20 backdrop-blur-xs rounded-xl">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-amber-600 border-t-transparent dark:border-amber-400 dark:border-t-transparent" />
              <p className="mt-3 text-xs font-bold text-amber-900 dark:text-amber-200">
                جارٍ تحميل صفحة المصحف الشريف #{currentPage}...
              </p>
            </div>
          )}

          {/* High-Res King Fahd Medina Mushaf Scan from GoldenQuran CDN */}
          <img
            key={currentPage}
            src={getGoldenQuranPageUrl(currentPage)}
            alt={`صفحة المصحف الشريف ${currentPage}`}
            draggable={false}
            className="mushaf-scan w-full h-full block select-none pointer-events-auto transition-transform duration-150"
            style={{
              objectFit: 'contain',
              // GoldenQuran's exact night mode filter
              filter: isNight
                ? 'invert(.9) hue-rotate(180deg) sepia(.2) saturate(1.5) brightness(.95)'
                : 'none',
              touchAction: 'pan-y pinch-zoom',
              userSelect: 'none',
              WebkitUserDrag: 'none',
            } as React.CSSProperties}
            onDoubleClick={toggleViewMode}
            onLoad={() => setIsLoadingImage(false)}
            onError={() => setIsLoadingImage(false)}
            loading="eager"
            title="انقر نقراً مزدوجاً للتبديل بين ملاء الشاشة وملاء العرض"
          />
        </div>
      </div>

      {/* 4. Page Footer Ribbon Info (Below the sheet, never overlaps image) */}
      <div className="w-full max-w-4xl mx-auto my-2 flex items-center justify-between rounded-xl border border-[#C8A951]/25 bg-white/90 dark:bg-[#061b17]/90 px-4 py-2 text-xs text-slate-700 dark:text-zinc-300 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-800 dark:text-amber-300">{currentSurah.name}</span>
          <span className="text-slate-400">•</span>
          <span>{currentJuz.name}</span>
        </div>

        <div className="flex items-center gap-1.5 font-numbers font-black text-amber-900 dark:text-amber-200">
          <span>صفحة</span>
          <span className="text-sm font-extrabold">{currentPage}</span>
          <span className="text-[11px] text-slate-400">من 604</span>
        </div>

        {/* Quick Mode Indicator / Toggle */}
        <button
          type="button"
          onClick={toggleViewMode}
          className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-amber-800 dark:text-zinc-400 dark:hover:text-amber-200 transition cursor-pointer"
          title="تبديل وضع العرض"
        >
          {viewMode === 'fit-screen' ? (
            <>
              <Expand size={12} />
              <span>وضع ملاء العرض</span>
            </>
          ) : (
            <>
              <StretchHorizontal size={12} />
              <span>وضع ملاء الشاشة</span>
            </>
          )}
        </button>
      </div>

      {/* 5. Action Section: Completion Button & Session Tracker */}
      <div className="w-full max-w-4xl mx-auto mt-4 sm:mt-5 space-y-3">
        {/* Main Wird Completion Button */}
        <button
          type="button"
          onClick={handleToggleComplete}
          className={`w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 px-6 font-black text-base transition-all duration-200 shadow-md cursor-pointer ${
            isCompleted
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-teal-500 dark:text-slate-950 ring-4 ring-emerald-500/20'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#22D3B6] dark:text-[#04251F] dark:hover:bg-[#14b8a6] hover:shadow-lg'
          }`}
        >
          <CheckCheck size={22} strokeWidth={2.5} />
          <span>{isCompleted ? 'أتممت ورد اليوم بحمد الله ✓ (اضغط للإلغاء)' : 'أتممت قراءة ورد اليوم بحمد الله'}</span>
        </button>

        {/* Completion Celebration Banner when completed */}
        {isCompleted && (
          <div className="overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/90 via-white to-amber-50/60 p-5 text-center shadow-lg dark:border-teal-400/40 dark:from-[#06221d] dark:via-[#082b24] dark:to-[#041a15]">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-teal-400 dark:text-slate-950 shadow-md">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-black text-emerald-950 dark:text-white">
              هنيئاً لك! كُتب لك أجر تلاوة كتاب الله اليوم
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-arabic leading-relaxed">
              ﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾ · جعله الله نوراً لقلبك وشفيعاً لك يوم القيامة.
            </p>
            <div className="mt-3 flex items-center justify-center gap-3 text-xs">
              <span className="rounded-xl border border-emerald-200 bg-white/90 dark:border-white/10 dark:bg-white/5 px-3 py-1.5 font-bold text-slate-800 dark:text-white">
                ⏱️ مدة التلاوة: <strong className="font-numbers text-emerald-700 dark:text-[#5EEAD4]">{formatClock(elapsedSeconds)}</strong>
              </span>
              <span className="rounded-xl border border-emerald-200 bg-white/90 dark:border-white/10 dark:bg-white/5 px-3 py-1.5 font-bold text-slate-800 dark:text-white">
                📖 صفحة الورد: <strong className="font-numbers text-emerald-700 dark:text-[#5EEAD4]">#{currentPage}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Reading Tips & GoldenQuran Credit */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-[#071d18]/60 px-4 py-2 text-xs text-slate-600 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span>💡 نصيحة: انقر نقراً مزدوجاً على الصفحة أو استخدم زري (ملاء الشاشة / ملاء العرض) للتحكم السريع في حجم الصفحة، مع أزرار (+) و (-) للتكبير حتى 500%</span>
          </span>
          <a
            href="https://goldenquran.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>المصدر: المصحف الذهبي</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
