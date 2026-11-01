import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  BookOpen, 
  RotateCcw, 
  CheckCheck, 
  Shuffle,
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  SlidersHorizontal,
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  Calendar, 
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

  // Clear any legacy reader-specific night mode override so it stays 100% in sync with MainHeader
  useEffect(() => {
    try {
      userStorage.removeItem('islambook_quran_night_override');
    } catch {}
  }, []);

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

  // Dark / Night theme strictly follows the app's theme from MainHeader settings
  const isNight = theme === 'dark' || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

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
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetWidth, setSheetWidth] = useState<number | null>(null);

  // Sync sheetWidth in real-time with the Mushaf page container's rendered width
  useEffect(() => {
    if (!sheetRef.current) return;
    const updateWidth = () => {
      if (sheetRef.current) {
        const rect = sheetRef.current.getBoundingClientRect();
        if (rect && rect.width > 0) {
          setSheetWidth(Math.round(rect.width));
        }
      }
    };

    updateWidth();
    const observer = new ResizeObserver(() => {
      updateWidth();
    });
    observer.observe(sheetRef.current);
    window.addEventListener('resize', updateWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, [viewMode, zoomLevel, currentPage, isFullscreen]);

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

  // Auto-start session timer when user starts scrolling the page
  useEffect(() => {
    if (timerRunning || isCompleted) return;

    const handleScrollActivity = () => {
      setTimerRunning(true);
    };

    window.addEventListener('scroll', handleScrollActivity, { passive: true });
    document.addEventListener('scroll', handleScrollActivity, { passive: true, capture: true });
    window.addEventListener('wheel', handleScrollActivity, { passive: true });
    window.addEventListener('touchmove', handleScrollActivity, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScrollActivity);
      document.removeEventListener('scroll', handleScrollActivity, { capture: true });
      window.removeEventListener('wheel', handleScrollActivity);
      window.removeEventListener('touchmove', handleScrollActivity);
    };
  }, [timerRunning, isCompleted]);

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
  // In fit-width mode, scale width comfortably (620px desktop default for comfortable reading size)
  const baseWidth = isFullscreen ? 820 : 620;
  const scaledWidth = Math.round(baseWidth * (zoomLevel / 100));

  // Dynamic page width strictly matching zoom level (100%, 150%, 200%, etc.) and view mode
  const activePageWidth = sheetWidth || (
    viewMode === 'fit-width'
      ? scaledWidth
      : Math.round(((typeof window !== 'undefined' ? window.innerHeight : 800) - (isFullscreen ? 70 : 160)) * (zoomLevel / 100) * (1024 / 1656))
  );

  return (
    <div 
      ref={readerContainerRef}
      className={`islambook-container mt-2 w-full max-w-full mx-auto px-2 sm:px-4 transition-colors ${
        isFullscreen ? 'fixed inset-0 z-50 bg-[#071915] p-3 sm:p-6 overflow-y-auto max-w-none' : ''
      }`} 
      dir="rtl" 
      lang="ar"
    >
      {/* 1. Sticky Navigation & Reader Toolbar (Professional Horizontal Application Toolbar) */}
      <div className="sticky top-[8px] z-40 mb-2 sm:mb-3">
        <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-1.5 sm:gap-2 rounded-2xl border border-slate-200/90 bg-white/95 text-slate-900 dark:border-white/10 dark:bg-[#071d18]/95 dark:text-white py-1.5 px-2.5 sm:py-2 sm:px-3 shadow-md shadow-slate-900/5 dark:shadow-emerald-950/20 backdrop-blur-md transition-all">
          
          {/* Section 1: Identity & Quran Navigation & Session Timer */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 w-full 2xl:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            
            {/* Identity & Status Badge */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 dark:bg-amber-400/10 dark:border-amber-400/20 shadow-2xs">
                <BookOpen size={14} className="text-amber-600 dark:text-amber-300" />
              </span>
              <span className="font-arabic text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                وردك
              </span>
              {isCompleted && (
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-800 dark:bg-emerald-500/15 dark:text-[#5EEAD4] dark:border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold select-none">
                  تم الإنجاز
                </span>
              )}
            </div>

            <div className="hidden sm:block h-4.5 w-px bg-slate-200/90 dark:bg-white/10 shrink-0" />

            {/* Navigation Group: Surah + Juz + Page Navigation */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Surah Selector */}
              <div className="relative">
                <select
                  value={currentSurah.page}
                  onChange={(e) => goToPage(Number(e.target.value))}
                  className="appearance-none h-7 sm:h-7.5 pl-6 pr-2 rounded-lg border border-slate-200/90 bg-white dark:border-white/10 dark:bg-white/5 text-xs font-bold text-slate-800 dark:text-zinc-100 hover:border-slate-300 dark:hover:border-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 cursor-pointer transition shadow-2xs max-w-[105px] sm:max-w-[125px] truncate"
                  aria-label="الانتقال إلى سورة"
                  title="اختيار السورة"
                >
                  {QURAN_SURAHS.map((s) => (
                    <option key={s.number} value={s.page} className="bg-white dark:bg-[#071915] text-slate-900 dark:text-white">
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={11} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              </div>

              {/* Juz Selector */}
              <div className="relative">
                <select
                  value={currentJuz.page}
                  onChange={(e) => goToPage(Number(e.target.value))}
                  className="appearance-none h-7 sm:h-7.5 pl-6 pr-2 rounded-lg border border-slate-200/90 bg-white dark:border-white/10 dark:bg-white/5 text-xs font-bold text-slate-800 dark:text-zinc-100 hover:border-slate-300 dark:hover:border-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 cursor-pointer transition shadow-2xs max-w-[85px] sm:max-w-[105px] truncate"
                  aria-label="الانتقال إلى جزء"
                  title="اختيار الجزء"
                >
                  {QURAN_JUZS.map((j) => (
                    <option key={j.number} value={j.page} className="bg-white dark:bg-[#071915] text-slate-900 dark:text-white">
                      {j.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={11} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              </div>

              {/* Page Stepper Capsule: [< Prev] [صفحة X من 604] [Next >] */}
              <div className="flex items-center h-7 sm:h-7.5 rounded-lg border border-slate-200/90 bg-white dark:border-white/10 dark:bg-white/5 text-xs font-bold text-slate-800 dark:text-zinc-100 shadow-2xs overflow-hidden">
                {/* Prev Button (In RTL, prev is right arrow) */}
                <button
                  type="button"
                  onClick={prevPage}
                  disabled={currentPage <= 1}
                  className="flex items-center justify-center w-6 sm:w-7 h-full text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="الصفحة السابقة (السهم الأيمن →)"
                  aria-label="الصفحة السابقة"
                >
                  <ChevronRight size={13} />
                </button>

                {/* Page Number & Total */}
                <div 
                  className="flex items-center gap-1 px-1.5 border-x border-slate-200/70 dark:border-white/10 h-full group"
                  title="انقر لتعديل رقم الصفحة والانتقال مباشرة إليها"
                >
                  <span className="text-slate-400 dark:text-zinc-400 text-[11px] hidden sm:inline">صفحة</span>
                  <input
                    type="number"
                    min={1}
                    max={604}
                    value={currentPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) goToPage(val);
                    }}
                    className="w-7 sm:w-8 text-center font-numbers font-black text-xs text-emerald-700 dark:text-emerald-300 bg-transparent focus:outline-none"
                    aria-label="رقم صفحة المصحف"
                  />
                  <span className="text-slate-400 dark:text-zinc-400 text-[10px] font-numbers">/ 604</span>
                </div>

                {/* Next Button (In RTL, next is left arrow) */}
                <button
                  type="button"
                  onClick={nextPage}
                  disabled={currentPage >= 604}
                  className="flex items-center justify-center w-6 sm:w-7 h-full text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="الصفحة التالية (السهم الأيسر ←)"
                  aria-label="الصفحة التالية"
                >
                  <ChevronLeft size={13} />
                </button>
              </div>

              {/* Today's Assigned Wird Page Button */}
              {!isTodayAssignedPage && (
                <button
                  type="button"
                  onClick={() => goToPage(defaultDailyPage)}
                  className="flex items-center gap-1 h-7 sm:h-7.5 px-2 rounded-lg border border-emerald-500/40 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20 text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
                  title={`الرجوع لصفحة الورد المخصصة لهذا اليوم (${defaultDailyPage})`}
                >
                  <Calendar size={11} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">صفحة اليوم</span>
                </button>
              )}
            </div>

            {/* Session Timer (Start/Pause, Clock, Reset) */}
            <div 
              className="flex items-center gap-1.5 h-7 sm:h-7.5 px-2 rounded-lg border border-slate-200/90 bg-slate-50/80 dark:border-white/10 dark:bg-white/5 text-xs text-slate-600 dark:text-zinc-300 shadow-2xs select-none shrink-0"
              title="مدة جلسة القراءة الحالية"
            >
              <button
                type="button"
                onClick={() => setTimerRunning(!timerRunning)}
                className="text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition cursor-pointer"
                title={timerRunning ? 'إيقاف المؤقت مؤقتاً' : 'تشغيل مؤقت القراءة'}
                aria-label={timerRunning ? 'إيقاف المؤقت' : 'بدء المؤقت'}
              >
                {timerRunning ? <Pause size={11} className="text-emerald-700 dark:text-emerald-400" /> : <Play size={11} />}
              </button>
              <span className="font-numbers font-medium text-xs tabular-nums text-slate-700 dark:text-zinc-200 min-w-[36px] text-center">
                {formatClock(elapsedSeconds)}
              </span>
              <button
                type="button"
                onClick={() => { setElapsedSeconds(0); setTimerRunning(false); }}
                className="text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 transition cursor-pointer"
                title="تصفير المؤقت"
                aria-label="تصفير المؤقت"
              >
                <RotateCcw size={10} />
              </button>
            </div>

          </div>

          {/* Divider between sections on wide screen */}
          <div className="hidden 2xl:block h-6 w-px bg-slate-200/90 dark:bg-white/10 shrink-0 mx-1" />

          {/* Section 2: View Controls, Zoom Stepper, Presets & Action Tools */}
          <div className="flex items-center justify-between 2xl:justify-end gap-1.5 sm:gap-2.5 w-full 2xl:w-auto shrink-0 flex-wrap sm:flex-nowrap pt-1 2xl:pt-0 border-t border-slate-200/70 dark:border-white/10 2xl:border-t-0">
            
            {/* View Mode Segmented Control: [ملء الشاشة | ملء العرض] */}
            <div className="flex items-center p-0.5 rounded-lg border border-slate-200/90 bg-slate-100/90 dark:border-white/10 dark:bg-white/5 text-xs shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => handleSetViewMode('fit-screen')}
                className={`flex items-center gap-1 h-6 sm:h-6.5 px-2 rounded-md font-bold transition cursor-pointer ${
                  viewMode === 'fit-screen'
                    ? 'bg-white text-emerald-800 dark:bg-white/15 dark:text-emerald-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white'
                }`}
                title="ملء الصفحة: عرض الصفحة كاملة متناسقة مع ارتفاع الشاشة دون أي قص (اختصار W)"
              >
                <StretchHorizontal size={12} />
                <span className="hidden sm:inline">ملء الصفحة</span>
                <span className="sm:hidden">الصفحة</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetViewMode('fit-width')}
                className={`flex items-center gap-1 h-6 sm:h-6.5 px-2 rounded-md font-bold transition cursor-pointer ${
                  viewMode === 'fit-width'
                    ? 'bg-white text-emerald-800 dark:bg-white/15 dark:text-emerald-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white'
                }`}
                title="ملء العرض: توسيع الصفحة لكامل العرض مع تكبير الخط والتمرير العمودي (اختصار W)"
              >
                <Expand size={12} />
                <span className="hidden sm:inline">ملء العرض</span>
                <span className="sm:hidden">العرض</span>
              </button>
            </div>

            <div className="hidden sm:block h-4.5 w-px bg-slate-200/90 dark:bg-white/10 shrink-0" />

            {/* Quick Zoom Presets: [100% | 150% | 200% | 300%] */}
            <div className="flex items-center gap-1 shrink-0">
              {[
                { label: '100%', val: 100 },
                { label: '150%', val: 150 },
                { label: '200%', val: 200 },
                { label: '300%', val: 300 },
              ].map(preset => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => handleSetZoomLevel(preset.val)}
                  className={`h-7 sm:h-7.5 px-2 rounded-lg text-[11px] font-numbers font-bold border transition cursor-pointer text-center ${
                    zoomLevel === preset.val
                      ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-slate-950 shadow-2xs'
                      : 'border-slate-200/90 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-700 dark:text-zinc-300 dark:hover:bg-white/10'
                  }`}
                  title={`نسبة تكبير سريعة ${preset.label}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="hidden sm:block h-4.5 w-px bg-slate-200/90 dark:bg-white/10 shrink-0" />

            {/* Tools Group: Fullscreen, Random, Golden Mushaf Link */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              
              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 h-7 sm:h-7.5 px-2 sm:px-2.5 rounded-lg border border-slate-200/90 bg-white dark:border-white/10 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-white/10 transition shadow-2xs cursor-pointer select-none"
                title={isFullscreen ? 'الخروج من الشاشة الكاملة (اختصار F)' : 'شاشة كاملة (اختصار F)'}
                aria-label="شاشة كاملة"
              >
                {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                <span className="hidden md:inline">{isFullscreen ? 'إنهاء الشاشة الكاملة' : 'شاشة كاملة'}</span>
                <kbd className="hidden lg:inline text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-zinc-400">
                  F
                </kbd>
              </button>

              {/* Random Page Button */}
              <button
                type="button"
                onClick={rollRandomPage}
                className="flex items-center gap-1 h-7 sm:h-7.5 px-2 rounded-lg border border-slate-200/90 bg-white dark:border-white/10 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-white/10 transition shadow-2xs cursor-pointer select-none"
                title="الانتقال لصفحة عشوائية من المصحف"
              >
                <Shuffle size={12} className="text-slate-500 dark:text-zinc-400" />
                <span className="hidden md:inline">عشوائية</span>
                <span className="text-[11px]">🎲</span>
              </button>

              {/* External Link to Golden Mushaf */}
              <a
                href={`https://goldenquran.org/mushaf/${currentPage}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 h-7 sm:h-7.5 px-2 rounded-lg border border-slate-200/90 bg-white dark:border-white/10 dark:bg-white/5 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition shadow-2xs"
                title="فتح المصحف الذهبي في نافذة جديدة"
              >
                <span className="hidden lg:inline">المصحف الذهبي</span>
                <ExternalLink size={11} className="text-slate-400 dark:text-zinc-500" />
              </a>

            </div>

          </div>

        </div>
      </div>

      {/* 3. GoldenQuran Reading Stage (Never traps vertical scroll or crops the page) */}
      <div 
        className={`mushaf-stage relative w-full flex items-center justify-center mx-auto my-1.5 scroll-mt-24 ${
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
          ref={sheetRef}
          className="mushaf-sheet relative flex flex-col items-center justify-center rounded-xl sm:rounded-2xl transition-all select-none shadow-2xl"
          style={{
            background: isNight ? '#000000'
              : 'linear-gradient(180deg, #fbf6e9 0%, #f7efdc 55%, #efe4c8 100%)',
            border: isNight
              ? '1.5px solid rgba(212, 175, 55, 0.70)'
              : '1px solid rgba(184, 145, 47, 0.40)',
            outline: isNight ? '1px solid rgba(212, 175, 55, 0.35)' : 'none',
            outlineOffset: isNight ? '-6px' : '0',
            boxShadow: isNight ? '0 0 40px -5px rgba(212, 175, 55, 0.22), 0 24px 60px -20px rgba(0, 0, 0, 0.98)'
              : '0 24px 60px -20px rgba(63, 43, 8, 0.28), 0 0 1px rgba(184, 145, 47, 0.4)',
            // Exact King Fahd Medina Mushaf scan aspect ratio (1024 / 1656)
            aspectRatio: '1024 / 1656',
            // In Fit Screen mode, constrain by viewport height so nothing is ever clipped
            maxHeight: viewMode === 'fit-screen'
              ? (isFullscreen 
                  ? `calc((100vh - 70px) * ${zoomLevel / 100})` 
                  : `calc((100vh - 160px) * ${zoomLevel / 100})`)
              : 'none',
            // In Fit Width mode, expand proportionally; in Fit Screen, constrain comfortably
            width: viewMode === 'fit-width' ? '100%' : 'auto',
            maxWidth: viewMode === 'fit-width' 
              ? `${scaledWidth}px` 
              : `min(100%, calc(640px * ${zoomLevel / 100}))`,
            touchAction: 'pan-y pinch-zoom',
          }}
        >
          {/* Loading Spinner / Placeholder */}
          {isLoadingImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fbf6e9]/90 dark:bg-black/95 z-20 backdrop-blur-xs rounded-xl">
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
              // Crisp bright white verses in dark mode with golden borders preserved
              filter: isNight ? 'invert(1) hue-rotate(180deg) contrast(1.25) brightness(1.02)' : 'none',
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

      {/* 4. Page Footer Ribbon Info (Below the sheet, matches exact page width) */}
      <div 
        className="mx-auto my-2 flex items-center justify-between rounded-xl border border-[#C8A951]/25 bg-white/90 dark:bg-[#061b17]/90 px-3 sm:px-4 py-2 text-xs text-slate-700 dark:text-zinc-300 shadow-xs transition-all duration-200"
        style={{
          width: activePageWidth ? `${activePageWidth}px` : '100%',
          maxWidth: '100%',
        }}
      >
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
      <div 
        className="mx-auto mt-4 sm:mt-5 space-y-3 transition-all duration-200"
        style={{
          width: activePageWidth ? `${activePageWidth}px` : '100%',
          maxWidth: '100%',
        }}
      >
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
