import React, { useState } from 'react';
import { BookOpen, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language } from '../types';
import { getDailyVerse } from '../data/dailyVerses';
import { getDailyHadith } from '../data/dailyHadiths';
import { DailyAyahDialog } from './DailyAyahDialog';
import { DailyHadithDialog } from './DailyHadithDialog';

interface DailyInspirationPreviewProps {
  type: 'ayah' | 'hadith';
  currentDate?: string;
  lang: Language;
  className?: string;
}

export const DailyInspirationPreview: React.FC<DailyInspirationPreviewProps> = ({
  type,
  currentDate,
  lang,
  className = '',
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const verse = React.useMemo(() => getDailyVerse(currentDate), [currentDate]);
  const hadith = React.useMemo(() => getDailyHadith(currentDate), [currentDate]);

  const isAyah = type === 'ayah';
  const isAr = lang === 'ar';
  const Chevron = isAr ? ChevronLeft : ChevronRight;

  // Text preview
  const previewText = isAyah
    ? (isAr ? verse.textAr.replace(/^[﴿"]/, '').replace(/[﴾"]$/, '').trim() : verse.textEn)
    : (isAr ? hadith.textAr.replace(/^[«"]/, '').replace(/[»"]$/, '').trim() : hadith.textEn);

  const attributionText = isAyah
    ? (isAr
        ? `سورة ${verse.surahAr} • ${verse.ayahNumberAr.includes('–') ? 'الآيات' : 'الآية'} ${verse.ayahNumberAr}`
        : `Surah ${verse.surahEn} • ${verse.ayahNumberEn}`)
    : (isAr
        ? `${hadith.sourceAr}`
        : `${hadith.sourceEn}`);

  // Color schemes
  const colorStyles = isAyah
    ? {
        cardBg: 'bg-[#FAF7F0]/92 hover:bg-[#FAF7F0] dark:bg-[#071f1a]/88 dark:hover:bg-[#071f1a]/95',
        borderColor: 'border-[#E5DCC9] hover:border-[#B69A5A]/50 dark:border-[#B69A5A]/25 dark:hover:border-[#B69A5A]/45',
        shadow: 'shadow-[0_2px_12px_-2px_rgba(182,154,90,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)]',
        headerText: 'text-[#8C6928] dark:text-[#D6B772]',
        iconColor: 'text-[#B69A5A] dark:text-[#D6B772]',
        bodyText: 'text-[#174637] dark:text-[#F6EEDA]',
        ctaColor: 'text-[#8C6928] hover:text-[#5d4416] dark:text-[#D6B772] dark:hover:text-[#F6EEDA]',
        fontFamily: "'Amiri Quran', 'Amiri', serif",
        focusRing: 'focus-visible:ring-[#B69A5A]/50',
      }
    : {
        cardBg: 'bg-[#EDF3ED]/92 hover:bg-[#EDF3ED] dark:bg-[#06201a]/88 dark:hover:bg-[#06201a]/95',
        borderColor: 'border-[#D6E5DA] hover:border-[#4A8971]/50 dark:border-emerald-500/25 dark:hover:border-emerald-500/45',
        shadow: 'shadow-[0_2px_12px_-2px_rgba(74,137,113,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)]',
        headerText: 'text-[#214D40] dark:text-[#5EEAD4]',
        iconColor: 'text-[#4A8971] dark:text-[#5EEAD4]',
        bodyText: 'text-[#214D40] dark:text-[#EBF8F2]',
        ctaColor: 'text-[#214D40] hover:text-[#0f2c24] dark:text-[#5EEAD4] dark:hover:text-[#EBF8F2]',
        fontFamily: "'Amiri', 'Traditional Arabic', serif",
        focusRing: 'focus-visible:ring-[#4A8971]/50',
      };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        aria-haspopup="dialog"
        aria-label={
          isAyah
            ? (isAr ? 'عرض آية اليوم كاملة' : 'View full Verse of the Day')
            : (isAr ? 'عرض حديث اليوم كاملاً' : 'View full Hadith of the Day')
        }
        dir={isAr ? 'rtl' : 'ltr'}
        className={`group relative flex flex-col justify-between w-full h-full min-h-[92px] sm:min-h-[100px] p-2.5 sm:p-3 text-start rounded-2xl border backdrop-blur-md cursor-pointer select-none transition-all duration-200 transform-gpu motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 ${colorStyles.cardBg} ${colorStyles.borderColor} ${colorStyles.shadow} ${colorStyles.focusRing} ${className}`.trim()}
      >
        {/* Top Header: Title + CTA */}
        <div className="flex items-center justify-between w-full mb-1">
          <div className="flex items-center gap-1.5">
            {isAyah ? (
              <BookOpen size={13} className={`${colorStyles.iconColor} shrink-0`} />
            ) : (
              <Sparkles size={13} className={`${colorStyles.iconColor} shrink-0`} />
            )}
            <span
              className={`text-[11px] sm:text-xs font-bold font-['Alexandria'] tracking-wide uppercase ${colorStyles.headerText}`}
            >
              {isAyah ? (isAr ? 'آية اليوم' : 'Daily Verse') : (isAr ? 'حديث اليوم' : 'Daily Hadith')}
            </span>
          </div>

          {/* Simple CTA with micro arrow */}
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold font-['Alexandria'] transition-transform duration-200 group-hover:translate-x-0.5 ${colorStyles.ctaColor}`}
          >
            <span>{isAyah ? (isAr ? 'اقرأ الآية' : 'Read') : (isAr ? 'اقرأ الحديث' : 'Read')}</span>
            <Chevron size={11} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>

        {/* Middle: Short text preview with line-clamp-2 */}
        <div className="my-auto py-0.5 w-full">
          <p
            className={`font-arabic text-xs sm:text-[13px] leading-[1.8] line-clamp-2 text-start font-normal ${colorStyles.bodyText}`}
            style={{ fontFamily: colorStyles.fontFamily }}
          >
            {isAr ? (isAyah ? `﴿${previewText}﴾` : `«${previewText}»`) : previewText}
          </p>
        </div>

        {/* Bottom: Subtle attribution matching standard editorial colophon */}
        <div className="mt-1 pt-1.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center gap-1.5 text-[10.5px] sm:text-[11px] font-medium font-['Alexandria'] select-none w-full">
          <span aria-hidden="true" className={isAyah ? 'text-[#B69A5A]/60 dark:text-[#D6B772]/60' : 'text-[#4A8971]/60 dark:text-[#5EEAD4]/60'}>
            —
          </span>
          <span className={`truncate max-w-full ${isAyah ? 'text-[#8C6928] dark:text-[#D6B772]' : 'text-[#214D40] dark:text-[#5EEAD4]'}`}>
            {attributionText}
          </span>
          <span aria-hidden="true" className={isAyah ? 'text-[#B69A5A]/60 dark:text-[#D6B772]/60' : 'text-[#4A8971]/60 dark:text-[#5EEAD4]/60'}>
            —
          </span>
        </div>
      </button>

      {/* Reading Dialog */}
      {isAyah ? (
        <DailyAyahDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          verse={verse}
          lang={lang}
        />
      ) : (
        <DailyHadithDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          hadith={hadith}
          lang={lang}
        />
      )}
    </>
  );
};
