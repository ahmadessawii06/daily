import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Check, Download, Image, ScanLine } from 'lucide-react';
import type { Language, Theme } from '../types';
import '../screenshot-loading.css';

export function ScreenshotLoadingScreen({ lang, theme }: { lang: Language; theme: Theme }) {
  const dialog = useRef<HTMLDivElement>(null);
  const previousFocus = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => {
    const previous = previousFocus.current;
    dialog.current?.focus({ preventScroll: true });
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);

  // Keep the loading screen outside the captured planner and preview elements.
  return createPortal(
    <div ref={dialog} role="dialog" aria-modal="true" aria-busy="true"
      aria-label={lang === 'ar' ? 'جارٍ تجهيز لقطة الشاشة' : 'Preparing screenshot'}
      tabIndex={-1} onKeyDown={event => { if (event.key === 'Tab') event.preventDefault(); }}
      dir={lang === 'ar' ? 'rtl' : 'ltr'} data-screenshot-loading data-loading-theme={theme}
      className="screenshot-loading">
      <div className="screenshot-loading-content">
        <div className="screenshot-loading-label"><Camera size={15} /><span>{lang === 'ar' ? 'لقطة من يومك' : 'A snapshot of your day'}</span></div>
        <div className="screenshot-loading-visual" aria-hidden="true">
          <div className="screenshot-loading-glow" />
          <div className="screenshot-loading-sheet screenshot-loading-sheet-back" />
          <div className="screenshot-loading-sheet screenshot-loading-sheet-front">
            <div className="screenshot-loading-sheet-header"><span className="screenshot-loading-sheet-brand" /><span /><span /></div>
            <div className="screenshot-loading-sheet-progress"><span>ميزان</span><span className="screenshot-loading-ring"><Check size={16} /></span></div>
            <div className="screenshot-loading-sheet-grid">{[0, 1, 2, 3].map(i => <div key={i}><span /><i /><i /><i /></div>)}</div>
          </div>
          <div className="screenshot-loading-frame"><i /><i /><i /><i /><div className="screenshot-loading-scan" /></div>
          <span className="screenshot-loading-camera"><Camera size={28} strokeWidth={1.5} /></span>
          <span className="screenshot-loading-file"><Image size={14} />PNG<span className="screenshot-loading-file-dot" /></span>
        </div>
        <div role="status" aria-live="polite" aria-atomic="true" className="screenshot-loading-message">
          <h1>{lang === 'ar' ? 'يومك، في صورة.' : 'Your day. One picture.'}</h1>
          <p>{lang === 'ar' ? 'نجهّز لقطة كاملة لجدولك، بكل التفاصيل الصغيرة.' : 'Capturing your complete schedule, down to the little details.'}</p>
          <div className="screenshot-loading-progress" aria-hidden="true"><span /></div>
          <span className="screenshot-loading-status"><ScanLine size={15} />{lang === 'ar' ? 'جارٍ تجهيز لقطة الشاشة…' : 'Preparing your screenshot…'}</span>
        </div>
        <div className="screenshot-loading-note"><Download size={14} /><span>{lang === 'ar' ? 'لحظات وتكون جاهزة للمشاركة' : 'Ready to share in a moment'}</span></div>
      </div>
    </div>, document.body,
  );
}
