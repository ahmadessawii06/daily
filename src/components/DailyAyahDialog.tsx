import React, { useEffect, useRef } from 'react';
import { X, BookOpen } from 'lucide-react';
import { Language } from '../types';
import { DailyVerse } from '../data/dailyVerses';

interface DailyAyahDialogProps {
  isOpen: boolean;
  onClose: () => void;
  verse: DailyVerse;
  lang: Language;
}

export const DailyAyahDialog: React.FC<DailyAyahDialogProps> = ({
  isOpen,
  onClose,
  verse,
  lang,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Close on Escape & Lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on close button
    closeBtnRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rawTextAr = verse.textAr.trim();
  const cleanTextAr = rawTextAr.replace(/^﴿/, '').replace(/﴾$/, '').trim();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-ayah-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Surface */}
      <div
        ref={dialogRef}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        lang={lang === 'ar' ? 'ar' : 'en'}
        className="relative z-10 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[#E5DCC9] bg-[#FAF7F0] p-5 sm:p-7 text-center shadow-[0_20px_60px_-15px_rgba(20,50,40,0.35)] dark:border-[#B69A5A]/25 dark:bg-[#071f1a] transition-all transform animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top ambient radial glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top,rgba(182,154,90,0.18)_0%,transparent_75%)] select-none"
        />

        {/* Close Button */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label={lang === 'ar' ? 'إغلاق نافذة الآية' : 'Close verse dialog'}
          className="absolute top-4 start-4 flex size-8 items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-black/5 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#B69A5A]"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* Header Title */}
        <div className="flex items-center justify-center gap-2 mb-3 select-none">
          <BookOpen size={16} className="text-[#B69A5A] dark:text-[#D6B772]" />
          <h3
            id="daily-ayah-title"
            className="text-xs sm:text-sm font-bold font-['Alexandria'] text-[#8C6928] dark:text-[#D6B772] tracking-widest uppercase"
          >
            {lang === 'ar' ? 'آيَـةُ الـيَـوْم' : 'Verse of the Day'}
          </h3>
        </div>

        {/* Quranic Text */}
        <div className="my-4 sm:my-6 px-1 sm:px-4">
          <p
            className="font-arabic text-[#174637] dark:text-[#F6EEDA] text-[23px] sm:text-[27px] leading-[2.15] sm:leading-[2.3] tracking-normal font-normal selection:bg-amber-100 selection:text-emerald-950 dark:selection:bg-emerald-900/60 dark:selection:text-amber-100"
            style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}
          >
            {lang === 'ar' ? (
              <span>
                <span
                  aria-hidden="true"
                  className="text-[#B69A5A] dark:text-[#D6B772] font-arabic select-none text-[1.12em] me-1 inline-block align-baseline opacity-95"
                >
                  ﴿
                </span>
                <span>{cleanTextAr}</span>
                <span
                  aria-hidden="true"
                  className="text-[#B69A5A] dark:text-[#D6B772] font-arabic select-none text-[1.12em] ms-1 inline-block align-baseline opacity-95"
                >
                  ﴾
                </span>
              </span>
            ) : (
              <span className="font-sans font-medium text-slate-800 dark:text-zinc-100 text-base sm:text-lg leading-relaxed">
                {verse.textEn}
              </span>
            )}
          </p>

          {/* English translation when Arabic is shown */}
          {lang === 'ar' && verse.textEn && (
            <p className="mt-4 pt-3 border-t border-[#E5DCC9]/50 dark:border-white/10 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans italic leading-relaxed">
              {verse.textEn}
            </p>
          )}
        </div>

        {/* Attribution & Colophon */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 text-xs sm:text-[13px] font-semibold text-[#B69A5A] dark:text-[#D6B772] select-none font-['Alexandria']">
          <span
            aria-hidden="true"
            className="h-[1.5px] w-6 sm:w-10 bg-[#B69A5A]/60 dark:bg-[#D6B772]/50 rounded-full"
          />
          <span>
            {lang === 'ar'
              ? `سورة ${verse.surahAr} • ${verse.ayahNumberAr.includes('–') ? 'الآيات' : 'الآية'} ${verse.ayahNumberAr}`
              : `Surah ${verse.surahEn} • ${verse.ayahNumberEn.includes('–') ? 'Verses' : 'Verse'} ${verse.ayahNumberEn}`}
          </span>
          <span
            aria-hidden="true"
            className="h-[1.5px] w-6 sm:w-10 bg-[#B69A5A]/60 dark:bg-[#D6B772]/50 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
