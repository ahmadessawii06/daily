import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  position = 'bottom',
  className = '',
}) => {
  const id = useId();
  const trigger = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      if (!trigger.current || !bubble.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const hint = bubble.current.getBoundingClientRect();
      const below = anchor.bottom + 8;
      const above = anchor.top - hint.height - 8;
      const top = position === 'top'
        ? (above >= 8 ? above : below)
        : (below + hint.height <= window.innerHeight - 8 ? below : above);
      setPlacement({
        left: Math.max(8, Math.min(anchor.left + (anchor.width - hint.width) / 2, window.innerWidth - hint.width - 8)),
        top: Math.max(8, Math.min(top, window.innerHeight - hint.height - 8)),
      });
    };
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    document.addEventListener('keydown', dismiss);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      document.removeEventListener('keydown', dismiss);
    };
  }, [open, position, text]);

  const content = React.isValidElement<{ 'aria-describedby'?: string }>(children)
    ? React.cloneElement(children, {
      'aria-describedby': [children.props['aria-describedby'], open ? id : undefined].filter(Boolean).join(' ') || undefined,
    })
    : children;
  return (
    <div ref={trigger} className={`group/tooltip relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => { setPlacement(null); setOpen(true); }}
      onMouseLeave={() => { if (!trigger.current?.contains(document.activeElement)) setOpen(false); }}
      onFocusCapture={() => { setPlacement(null); setOpen(true); }}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
      onPointerDown={() => setOpen(false)}>
      {content}
      {open && createPortal(<div
        id={id}
        ref={bubble}
        role="tooltip"
        style={{ left: placement?.left ?? 0, top: placement?.top ?? 0, visibility: placement ? 'visible' : 'hidden' }}
        className="pointer-events-none fixed z-[300] max-w-[calc(100vw-1rem)]"
      >
        <div dir="auto" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-center text-[11px] leading-5 font-semibold font-['Alexandria'] backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.45)] bg-white/95 text-slate-800 border border-slate-200/90 dark:bg-[#06201a]/95 dark:text-emerald-300 dark:border-emerald-400/30">
          <span>{text}</span>
        </div>
      </div>, document.body)}
    </div>
  );
};
