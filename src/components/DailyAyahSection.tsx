import React from 'react';
import { Language } from '../types';
import { getDailyVerse } from '../data/dailyVerses';

interface DailyAyahSectionProps {
  currentDate?: string;
  lang: Language;
  className?: string;
}

/**
 * DailyAyahSection
 * 
 * Premium Quranic Editorial Section placed at the head of the main content area.
 * Typography-led, quiet, and deeply respectful: prioritizes the Holy Quranic text
 * in Amiri Quran with gilded manuscript brackets, subtle golden attribution,
 * and a serene translucent backdrop that sits harmoniously on the canvas.
 */
export const DailyAyahSection: React.FC<DailyAyahSectionProps> = ({
  currentDate,
  lang,
  className = '',
}) => {
  const dailyVerse = React.useMemo(() => getDailyVerse(currentDate), [currentDate]);

  const rawTextAr = dailyVerse.textAr.trim();
  const cleanTextAr = rawTextAr.replace(/^﴿/, '').replace(/﴾$/, '').trim();
  const textLen = (lang === 'ar' ? cleanTextAr : dailyVerse.textEn).length;

  // Responsive typography scale tailored to verse length
  const typographyScale = textLen > 110
    ? 'text-[17px] sm:text-[20px] md:text-[22px] leading-[2.05] sm:leading-[2.18]'
    : textLen > 60
      ? 'text-[19px] sm:text-[22px] md:text-[25px] leading-[2.1] sm:leading-[2.25]'
      : 'text-[22px] sm:text-[26px] md:text-[29px] leading-[2.15] sm:leading-[2.3]';

  return (
    <section
      data-daily-ayah-section
      lang={lang === 'ar' ? 'ar' : 'en'}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      aria-label={lang === 'ar' ? 'آية اليوم الكريمة' : 'Verse of the Day'}
      className={`group relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-emerald-950/[0.08] bg-white/55 px-4 py-3 sm:px-8 sm:py-3.5 md:py-4 text-center shadow-[0_4px_20px_-4px_rgba(18,50,38,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.9)] backdrop-blur-md transition-all duration-300 dark:border-emerald-400/[0.12] dark:bg-[#071f1a]/70 dark:shadow-[0_6px_28px_-6px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.06)] ${className}`.trim()}
    >
      {/* Ambient micro radial glow at top */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_at_top,rgba(212,175,95,0.12)_0%,transparent_75%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(212,175,95,0.08)_0%,transparent_75%)] select-none"
      />

      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* 1. Modest Editorial Header Crest */}
        <div className="flex items-center justify-center gap-2.5 mb-1.5 sm:mb-2 select-none">
          <span
            aria-hidden="true"
            className="h-px w-6 sm:w-12 bg-gradient-to-r from-transparent via-[#b88a38]/30 to-[#b88a38]/60 dark:via-[#d4af5f]/25 dark:to-[#d4af5f]/60"
          />
          <div className="inline-flex items-center gap-1.5 px-1">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="size-3.5 text-[#b88a38] dark:text-[#d4af5f] shrink-0 opacity-90"
            >
              <path
                d="M12 2L14.5 7.5L20 8.5L16 13L17 19L12 16L7 19L8 13L4 8.5L9.5 7.5L12 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="11.5" r="1.8" fill="currentColor" />
            </svg>
            <span className="text-[11px] sm:text-xs font-bold font-['Alexandria'] text-[#8c6928] dark:text-[#d6b772] tracking-widest uppercase">
              {lang === 'ar' ? 'آيَـةُ الـيَـوْم' : 'Verse of the Day'}
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="size-3.5 text-[#b88a38] dark:text-[#d4af5f] shrink-0 opacity-90"
            >
              <path
                d="M12 2L14.5 7.5L20 8.5L16 13L17 19L12 16L7 19L8 13L4 8.5L9.5 7.5L12 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="11.5" r="1.8" fill="currentColor" />
            </svg>
          </div>
          <span
            aria-hidden="true"
            className="h-px w-6 sm:w-12 bg-gradient-to-l from-transparent via-[#b88a38]/30 to-[#b88a38]/60 dark:via-[#d4af5f]/25 dark:to-[#d4af5f]/60"
          />
        </div>

        {/* 2. Quranic Calligraphy Centerpiece with Gilded Manuscript Brackets */}
        <p
          className={`font-arabic text-[#0e3328] dark:text-[#f6edd9] transition-all ${typographyScale} tracking-normal font-normal selection:bg-amber-100 selection:text-emerald-950 dark:selection:bg-emerald-900/60 dark:selection:text-amber-100 max-w-3xl mx-auto my-0.5 sm:my-1`}
          style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}
        >
          {lang === 'ar' ? (
            <span className="inline">
              <span
                aria-hidden="true"
                className="text-[#b88a38] dark:text-[#d4af5f] font-arabic select-none text-[1.1em] me-1 inline-block align-baseline opacity-90"
              >
                ﴿
              </span>
              <span>{cleanTextAr}</span>
              <span
                aria-hidden="true"
                className="text-[#b88a38] dark:text-[#d4af5f] font-arabic select-none text-[1.1em] ms-1 inline-block align-baseline opacity-90"
              >
                ﴾
              </span>
            </span>
          ) : (
            <span className="font-sans font-medium text-slate-800 dark:text-zinc-100 text-sm sm:text-base leading-relaxed">
              {dailyVerse.textEn}
            </span>
          )}
        </p>

        {/* 3. Noble Quranic Attribution (Integrated dashes without pill/circle) */}
        <div className="mt-1.5 sm:mt-2 flex items-center justify-center gap-2 text-[11px] sm:text-xs font-semibold text-[#8c6928] dark:text-[#cbb06d] select-none font-['Alexandria']">
          <span
            aria-hidden="true"
            className="h-[1.5px] w-5 sm:w-8 bg-[#b88a38]/50 dark:bg-[#d4af5f]/45 rounded-full"
          />
          <span>
            {lang === 'ar'
              ? `سورة ${dailyVerse.surahAr} • ${dailyVerse.ayahNumberAr.includes('–') ? 'الآيات' : 'الآية'} ${dailyVerse.ayahNumberAr}`
              : `Surah ${dailyVerse.surahEn} • ${dailyVerse.ayahNumberEn.includes('–') ? 'Verses' : 'Verse'} ${dailyVerse.ayahNumberEn}`}
          </span>
          <span
            aria-hidden="true"
            className="h-[1.5px] w-5 sm:w-8 bg-[#b88a38]/50 dark:bg-[#d4af5f]/45 rounded-full"
          />
        </div>
      </div>
    </section>
  );
};
