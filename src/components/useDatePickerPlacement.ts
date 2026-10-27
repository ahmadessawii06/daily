import { CSSProperties, RefObject, useLayoutEffect, useState } from 'react';

type Placement = 'below' | 'above';

const POPOVER_GAP = 5;
const CONTENT_GAP = 12;

const getPlacement = (element: HTMLElement, popover: HTMLElement | null): Placement => {
  const rect = element.getBoundingClientRect();
  const measuredHeight = popover?.getBoundingClientRect().height;
  const requiredHeight = Math.min(measuredHeight || 520, window.innerHeight - 32) + POPOVER_GAP;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  return spaceBelow < requiredHeight && spaceAbove > spaceBelow ? 'above' : 'below';
};

export function useDatePickerPlacement(
  anchorRef: RefObject<HTMLElement | null>,
  popoverRef: RefObject<HTMLElement | null>,
  open: boolean,
) {
  const [placement, setPlacement] = useState<Placement>('below');

  useLayoutEffect(() => {
    if (!open) return;
    const header = anchorRef.current?.closest<HTMLElement>('[data-main-header]') || null;
    let frame = 0;
    const update = () => {
      if (!anchorRef.current) return;
      const nextPlacement = getPlacement(anchorRef.current, popoverRef.current);
      setPlacement(nextPlacement);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!header || !popoverRef.current || nextPlacement === 'above') {
          header?.style.removeProperty('--date-picker-clearance');
          return;
        }
        const headerBottom = header.getBoundingClientRect().bottom;
        const popoverBottom = popoverRef.current.getBoundingClientRect().bottom;
        const clearance = Math.max(0, Math.ceil(popoverBottom - headerBottom + CONTENT_GAP));
        if (clearance > 0) header.style.setProperty('--date-picker-clearance', `${clearance}px`);
        else header.style.removeProperty('--date-picker-clearance');
      });
    };
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    if (popoverRef.current) observer?.observe(popoverRef.current);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      header?.style.removeProperty('--date-picker-clearance');
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, open, popoverRef]);

  const style: CSSProperties = placement === 'above'
    ? { top: 'auto', bottom: 'calc(100% + 0.3rem)' }
    : { top: 'calc(100% + 0.3rem)', bottom: 'auto' };
  return { placement, style };
}
