import React from 'react';

interface LanguageIconProps {
  size?: number;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

/**
 * Arabic Language Icon (AR) styled in a sleek keycap / language badge aesthetic.
 */
export const ArabicLanguageIcon: React.FC<LanguageIconProps> = ({
  size = 20,
  className = '',
  'aria-hidden': ariaHidden = true,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden={ariaHidden}
  >
    <rect
      x="2.5"
      y="2.5"
      width="19"
      height="19"
      rx="5.5"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <text
      x="12"
      y="15.8"
      textAnchor="middle"
      fontSize="9.5"
      fontWeight="800"
      fill="currentColor"
      stroke="none"
      letterSpacing="0.4"
      fontFamily="'Outfit', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    >
      AR
    </text>
  </svg>
);

/**
 * English Language Icon (EN) styled in a sleek keycap / language badge aesthetic.
 */
export const EnglishLanguageIcon: React.FC<LanguageIconProps> = ({
  size = 20,
  className = '',
  'aria-hidden': ariaHidden = true,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden={ariaHidden}
  >
    <rect
      x="2.5"
      y="2.5"
      width="19"
      height="19"
      rx="5.5"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <text
      x="12"
      y="15.8"
      textAnchor="middle"
      fontSize="9.5"
      fontWeight="800"
      fill="currentColor"
      stroke="none"
      letterSpacing="0.4"
      fontFamily="'Outfit', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    >
      EN
    </text>
  </svg>
);
