import React from 'react';
import { Language } from '../types';
import { getDailyVerse } from '../data/dailyVerses';
import { getDailyHadith } from '../data/dailyHadiths';

interface DailyAyahSectionProps {
  currentDate?: string;
  lang: Language;
  className?: string;
}

/**
 * DailyInspirationsSection (DailyAyahSection)
 * 
 * Two balanced editorial cards side-by-side:
 * - On the right (RTL start): «آيَـةُ الـيَـوْم» (Verse of the Day)
 * - On the left (RTL end): «حَدِيثُ الـيَـوْم» (Hadith of the Day)
 * 
 * Typography-led, peaceful, and beautifully proportioned in a 2-column grid.
 */
export const DailyAyahSection: React.FC<DailyAyahSectionProps> = ({
  currentDate,
  lang,
  className = '',
}) => {
  const dailyVerse = React.useMemo(() => getDailyVerse(currentDate), [currentDate]);
  const dailyHadith = React.useMemo(() => getDailyHadith(currentDate), [currentDate]);

  const rawVerseAr = dailyVerse.textAr.trim();
  const cleanVerseAr = rawVerseAr.replace(/^﴿/, '').replace(/﴾$/, '').trim();
  const verseLen = (lang === 'ar' ? cleanVerseAr : dailyVerse.textEn).length;

  const rawHadithAr = dailyHadith.textAr.trim();
  const cleanHadithAr = rawHadithAr.replace(/^[«"]/, '').replace(/[»"]$/, '').trim();
  const hadithLen = (lang === 'ar' ? cleanHadithAr : dailyHadith.textEn).length;

  // Adaptive typography scales
  const verseScale = verseLen > 110
    ? 'text-[16px] sm:text-[18px] md:text-[20px] leading-[2.0] sm:leading-[2.15]'
    : verseLen > 60
      ? 'text-[18px] sm:text-[21px] md:text-[23px] leading-[2.05] sm:leading-[2.2]'
      : 'text-[20px] sm:text-[24px] md:text-[26px] leading-[2.1] sm:leading-[2.25]';

  const hadithScale = hadithLen > 130
    ? 'text-[15px] sm:text-[17px] md:text-[18.5px] leading-[2.0] sm:leading-[2.15]'
    : hadithLen > 70
      ? 'text-[17px] sm:text-[19px] md:text-[21px] leading-[2.05] sm:leading-[2.2]'
      : 'text-[19px] sm:text-[22px] md:text-[24px] leading-[2.1] sm:leading-[2.25]';

  const cardBaseStyle = 'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-950/[0.08] bg-white/55 px-4 py-3 sm:px-6 sm:py-3.5 md:py-4 text-center shadow-[0_4px_20px_-4px_rgba(18,50,38,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.9)] backdrop-blur-md transition-all duration-300 dark:border-emerald-400/[0.12] dark:bg-[#071f1a]/70 dark:shadow-[0_6px_28px_-6px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.06)]';

  return (
    <div
      data-daily-inspirations
      lang={lang === 'ar' ? 'ar' : 'en'}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={`grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-w-5xl mx-auto w-full items-stretch ${className}`.trim()}
    >
      {/* 1. RIGHT CARD: «آية اليوم» (Verse of the Day) */}
      <section
        data-daily-ayah
        aria-label={lang === 'ar' ? 'آية اليوم الكريمة' : 'Verse of the Day'}
        className={`${cardBaseStyle} order-1`}
      >
        {/* Ambient micro radial glow at top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_at_top,rgba(212,175,95,0.12)_0%,transparent_75%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(212,175,95,0.08)_0%,transparent_75%)] select-none"
        />

        <div className="relative z-10 flex flex-col items-center justify-between h-full">
          {/* Header Crest */}
          <div className="flex items-center justify-center gap-2.5 mb-1.5 sm:mb-2 select-none w-full">
            <span
              aria-hidden="true"
              className="h-px w-6 sm:w-10 bg-gradient-to-r from-transparent via-[#b88a38]/30 to-[#b88a38]/60 dark:via-[#d4af5f]/25 dark:to-[#d4af5f]/60"
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
              className="h-px w-6 sm:w-10 bg-gradient-to-l from-transparent via-[#b88a38]/30 to-[#b88a38]/60 dark:via-[#d4af5f]/25 dark:to-[#d4af5f]/60"
            />
          </div>

          {/* Quranic Calligraphy Centerpiece */}
          <div className="flex-1 flex items-center justify-center my-1 sm:my-1.5">
            <p
              className={`font-arabic text-[#0e3328] dark:text-[#f6edd9] transition-all ${verseScale} tracking-normal font-normal selection:bg-amber-100 selection:text-emerald-950 dark:selection:bg-emerald-900/60 dark:selection:text-amber-100 max-w-xl mx-auto`}
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
                  <span>{cleanVerseAr}</span>
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
          </div>

          {/* Attribution */}
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

      {/* 2. LEFT CARD: «حديث اليوم» (Hadith of the Day) */}
      <section
        data-daily-hadith
        aria-label={lang === 'ar' ? 'حديث اليوم الشريف' : 'Hadith of the Day'}
        className={`${cardBaseStyle} order-2`}
      >
        {/* Ambient micro radial glow at top (subtle emerald aura) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12)_0%,transparent_75%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.08)_0%,transparent_75%)] select-none"
        />

        <div className="relative z-10 flex flex-col items-center justify-between h-full">
          {/* Header Crest */}
          <div className="flex items-center justify-center gap-2.5 mb-1.5 sm:mb-2 select-none w-full">
            <span
              aria-hidden="true"
              className="h-px w-6 sm:w-10 bg-gradient-to-r from-transparent via-emerald-600/30 to-emerald-600/60 dark:via-emerald-400/25 dark:to-emerald-400/60"
            />
            <div className="inline-flex items-center gap-1.5 px-1">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="size-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 opacity-90"
              >
                <path
                  d="M12 3C7.5 3 4 6.5 4 11C4 16 12 21 12 21C12 21 20 16 20 11C20 6.5 16.5 3 12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="11" r="2.5" fill="currentColor" />
              </svg>
              <span className="text-[11px] sm:text-xs font-bold font-['Alexandria'] text-emerald-800 dark:text-emerald-300 tracking-widest uppercase">
                {lang === 'ar' ? 'حَدِيثُ الـيَـوْم' : 'Hadith of the Day'}
              </span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="size-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 opacity-90"
              >
                <path
                  d="M12 3C7.5 3 4 6.5 4 11C4 16 12 21 12 21C12 21 20 16 20 11C20 6.5 16.5 3 12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="11" r="2.5" fill="currentColor" />
              </svg>
            </div>
            <span
              aria-hidden="true"
              className="h-px w-6 sm:w-10 bg-gradient-to-l from-transparent via-emerald-600/30 to-emerald-600/60 dark:via-emerald-400/25 dark:to-emerald-400/60"
            />
          </div>

          {/* Prophetic Hadith Calligraphy Centerpiece */}
          <div className="flex-1 flex items-center justify-center my-1 sm:my-1.5">
            <p
              className={`font-arabic text-[#13332a] dark:text-[#ebf8f2] transition-all ${hadithScale} tracking-normal font-medium selection:bg-emerald-100 selection:text-emerald-950 dark:selection:bg-emerald-900/60 dark:selection:text-emerald-100 max-w-xl mx-auto`}
              style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
            >
              {lang === 'ar' ? (
                <span className="inline">
                  <span
                    aria-hidden="true"
                    className="text-emerald-700 dark:text-emerald-400 font-arabic select-none text-[1.1em] me-1 inline-block align-baseline opacity-90"
                  >
                    «
                  </span>
                  <span>{cleanHadithAr}</span>
                  <span
                    aria-hidden="true"
                    className="text-emerald-700 dark:text-emerald-400 font-arabic select-none text-[1.1em] ms-1 inline-block align-baseline opacity-90"
                  >
                    »
                  </span>
                </span>
              ) : (
                <span className="font-sans font-medium text-slate-800 dark:text-zinc-100 text-sm sm:base leading-relaxed">
                  {dailyHadith.textEn}
                </span>
              )}
            </p>
          </div>

          {/* Attribution & Source */}
          <div className="mt-1.5 sm:mt-2 flex items-center justify-center gap-2 text-[11px] sm:text-xs font-semibold text-emerald-800/90 dark:text-emerald-300/90 select-none font-['Alexandria']">
            <span
              aria-hidden="true"
              className="h-[1.5px] w-5 sm:w-8 bg-emerald-600/40 dark:bg-emerald-400/35 rounded-full"
            />
            <span className="truncate max-w-[260px] sm:max-w-none">
              {lang === 'ar'
                ? `${dailyHadith.narratorAr} • ${dailyHadith.sourceAr}`
                : `${dailyHadith.narratorEn} • ${dailyHadith.sourceEn}`}
            </span>
            <span
              aria-hidden="true"
              className="h-[1.5px] w-5 sm:w-8 bg-emerald-600/40 dark:bg-emerald-400/35 rounded-full"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
