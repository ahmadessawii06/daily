import { toPng, toBlob } from 'html-to-image';
import { ALEXANDRIA_FONT_EMBED_CSS } from './alexandriaFontEmbed';

export interface ExportDailyTrackOptions {
  elementId?: string;
  element?: HTMLElement | null;
  fileName?: string;
  theme?: 'dark' | 'light';
}

interface SavedStyle {
  el: HTMLElement;
  overflow: string;
  overflowY: string;
  overflowX: string;
  maxHeight: string;
  height: string;
}

/**
 * Robust full-content screenshot exporter for Daily Track.
 * 
 * Accurately captures the complete original UI matching the live website 1:1,
 * embedding the authentic Alexandria font with all weights and Arabic glyphs,
 * keeping Header, Dashboard, Controls, Filters, and all 24 hours down to the
 * very last task with zero cutoff.
 */
export const exportDailyTrackToImage = async ({
  elementId = 'daily-track-container',
  element,
  fileName = 'Daily-Track.png',
  theme = 'dark',
}: ExportDailyTrackOptions): Promise<string> => {
  const target = element || document.getElementById(elementId);
  if (!target) {
    throw new Error(`Target container #${elementId} not found in DOM`);
  }

  // 1. Ensure all document web fonts are completely loaded before capturing
  if (document.fonts) {
    await document.fonts.ready;
  }

  // 2. Temporarily save scroll position and ensure top alignment during SVG render
  const originalScrollX = window.scrollX;
  const originalScrollY = window.scrollY;

  // 3. Collect and save original styles for target, its ancestors, and scrollable descendants
  const savedStyles: SavedStyle[] = [];

  const saveAndUnclip = (el: HTMLElement) => {
    savedStyles.push({
      el,
      overflow: el.style.overflow,
      overflowY: el.style.overflowY,
      overflowX: el.style.overflowX,
      maxHeight: el.style.maxHeight,
      height: el.style.height,
    });

    el.style.overflow = 'visible';
    el.style.overflowY = 'visible';
    el.style.overflowX = 'visible';
    el.style.maxHeight = 'none';
    el.style.height = 'auto';
  };

  try {
    // Unclip target element itself
    saveAndUnclip(target);

    // Unclip any ancestors up to document.body that could impose clipping
    let ancestor = target.parentElement;
    while (ancestor && ancestor !== document.body) {
      const computed = window.getComputedStyle(ancestor);
      const isClipped =
        computed.overflow !== 'visible' ||
        computed.overflowY !== 'visible' ||
        computed.overflowX !== 'visible' ||
        (computed.maxHeight !== 'none' && computed.maxHeight !== '');

      if (isClipped) {
        saveAndUnclip(ancestor);
      }
      ancestor = ancestor.parentElement;
    }

    // Unclip any descendants inside target that might clip task rows
    const descendants = target.querySelectorAll<HTMLElement>('*');
    descendants.forEach((child) => {
      const computed = window.getComputedStyle(child);
      const isClipped =
        computed.overflow === 'auto' ||
        computed.overflow === 'scroll' ||
        computed.overflow === 'hidden' ||
        computed.overflowY === 'auto' ||
        computed.overflowY === 'scroll' ||
        computed.overflowY === 'hidden' ||
        (computed.maxHeight !== 'none' && computed.maxHeight !== '');

      if (isClipped) {
        saveAndUnclip(child);
      }
    });

    // 4. Force DOM layout reflow and wait for paints
    void target.offsetHeight;
    await new Promise((resolve) => setTimeout(resolve, 160));

    // 5. Accurately calculate the true full content height and width
    const targetRect = target.getBoundingClientRect();
    const scrollHeight = target.scrollHeight;
    const offsetHeight = target.offsetHeight;

    // Scan all children to find the absolute bottommost coordinate
    let maxChildBottom = 0;
    const allDescendants = target.getElementsByTagName('*');
    for (let i = 0; i < allDescendants.length; i++) {
      const child = allDescendants[i] as HTMLElement;
      // Skip invisible / detached elements
      if (child.offsetParent === null && child.offsetWidth === 0 && child.offsetHeight === 0) {
        continue;
      }
      const r = child.getBoundingClientRect();
      const relativeBottom = r.bottom - targetRect.top;
      if (relativeBottom > maxChildBottom) {
        maxChildBottom = relativeBottom;
      }
    }

    // Full height with 36px safety margin to ensure the last task's border, shadow, and padding are never clipped
    const fullHeight = Math.ceil(
      Math.max(scrollHeight, offsetHeight, targetRect.height, maxChildBottom)
    ) + 36;

    const fullWidth = Math.ceil(
      Math.max(target.scrollWidth, target.offsetWidth, targetRect.width)
    );

    const bgColor = theme === 'dark' ? '#07080b' : '#f8fafc';

    // 6. Generate high-resolution Retina 2.5x PNG with Alexandria Font embedded as Base64
    const dataUrl = await toPng(target, {
      width: fullWidth,
      height: fullHeight,
      pixelRatio: 2.5,
      fontEmbedCSS: ALEXANDRIA_FONT_EMBED_CSS,
      cacheBust: true,
      backgroundColor: bgColor,
      style: {
        transform: 'none',
        overflow: 'visible',
        overflowY: 'visible',
        overflowX: 'visible',
        maxHeight: 'none',
        height: `${fullHeight}px`,
        width: `${fullWidth}px`,
        margin: '0',
      },
    });

    // 7. Trigger automatic download of the full PNG file
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();

    return dataUrl;
  } finally {
    // 8. Restore scroll position if modified
    if (window.scrollX !== originalScrollX || window.scrollY !== originalScrollY) {
      window.scrollTo(originalScrollX, originalScrollY);
    }

    // 9. CRITICAL: Restore all elements to their exact original CSS styles
    for (let i = savedStyles.length - 1; i >= 0; i--) {
      const s = savedStyles[i];
      s.el.style.overflow = s.overflow;
      s.el.style.overflowY = s.overflowY;
      s.el.style.overflowX = s.overflowX;
      s.el.style.maxHeight = s.maxHeight;
      s.el.style.height = s.height;
    }
  }
};

/**
 * Copy full Daily Track image to clipboard as PNG
 */
export const copyDailyTrackToClipboard = async ({
  elementId = 'daily-track-container',
  element,
  theme = 'dark',
}: Omit<ExportDailyTrackOptions, 'fileName'>): Promise<boolean> => {
  const target = element || document.getElementById(elementId);
  if (!target) {
    throw new Error(`Target container #${elementId} not found in DOM`);
  }

  if (document.fonts) {
    await document.fonts.ready;
  }

  const originalScrollX = window.scrollX;
  const originalScrollY = window.scrollY;

  const savedStyles: SavedStyle[] = [];

  const saveAndUnclip = (el: HTMLElement) => {
    savedStyles.push({
      el,
      overflow: el.style.overflow,
      overflowY: el.style.overflowY,
      overflowX: el.style.overflowX,
      maxHeight: el.style.maxHeight,
      height: el.style.height,
    });

    el.style.overflow = 'visible';
    el.style.overflowY = 'visible';
    el.style.overflowX = 'visible';
    el.style.maxHeight = 'none';
    el.style.height = 'auto';
  };

  try {
    saveAndUnclip(target);

    let ancestor = target.parentElement;
    while (ancestor && ancestor !== document.body) {
      const computed = window.getComputedStyle(ancestor);
      if (
        computed.overflow !== 'visible' ||
        computed.overflowY !== 'visible' ||
        computed.overflowX !== 'visible' ||
        (computed.maxHeight !== 'none' && computed.maxHeight !== '')
      ) {
        saveAndUnclip(ancestor);
      }
      ancestor = ancestor.parentElement;
    }

    const descendants = target.querySelectorAll<HTMLElement>('*');
    descendants.forEach((child) => {
      const computed = window.getComputedStyle(child);
      if (
        computed.overflow === 'auto' ||
        computed.overflow === 'scroll' ||
        computed.overflow === 'hidden' ||
        computed.overflowY === 'auto' ||
        computed.overflowY === 'scroll' ||
        computed.overflowY === 'hidden' ||
        (computed.maxHeight !== 'none' && computed.maxHeight !== '')
      ) {
        saveAndUnclip(child);
      }
    });

    void target.offsetHeight;
    await new Promise((resolve) => setTimeout(resolve, 160));

    const targetRect = target.getBoundingClientRect();
    const scrollHeight = target.scrollHeight;
    const offsetHeight = target.offsetHeight;

    let maxChildBottom = 0;
    const allDescendants = target.getElementsByTagName('*');
    for (let i = 0; i < allDescendants.length; i++) {
      const child = allDescendants[i] as HTMLElement;
      if (child.offsetParent === null && child.offsetWidth === 0 && child.offsetHeight === 0) {
        continue;
      }
      const r = child.getBoundingClientRect();
      const relativeBottom = r.bottom - targetRect.top;
      if (relativeBottom > maxChildBottom) {
        maxChildBottom = relativeBottom;
      }
    }

    const fullHeight = Math.ceil(
      Math.max(scrollHeight, offsetHeight, targetRect.height, maxChildBottom)
    ) + 36;

    const fullWidth = Math.ceil(
      Math.max(target.scrollWidth, target.offsetWidth, targetRect.width)
    );

    const bgColor = theme === 'dark' ? '#07080b' : '#f8fafc';

    const blob = await toBlob(target, {
      width: fullWidth,
      height: fullHeight,
      pixelRatio: 2.5,
      fontEmbedCSS: ALEXANDRIA_FONT_EMBED_CSS,
      cacheBust: true,
      backgroundColor: bgColor,
      style: {
        transform: 'none',
        overflow: 'visible',
        overflowY: 'visible',
        overflowX: 'visible',
        maxHeight: 'none',
        height: `${fullHeight}px`,
        width: `${fullWidth}px`,
        margin: '0',
      },
    });

    if (blob && navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return true;
    }
    return false;
  } finally {
    if (window.scrollX !== originalScrollX || window.scrollY !== originalScrollY) {
      window.scrollTo(originalScrollX, originalScrollY);
    }

    for (let i = savedStyles.length - 1; i >= 0; i--) {
      const s = savedStyles[i];
      s.el.style.overflow = s.overflow;
      s.el.style.overflowY = s.overflowY;
      s.el.style.overflowX = s.overflowX;
      s.el.style.maxHeight = s.maxHeight;
      s.el.style.height = s.height;
    }
  }
};
