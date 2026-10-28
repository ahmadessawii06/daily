import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, Github, Terminal, Flame, Waves, Sunset, Leaf, MoonStar, NotebookPen, Palette, Sparkles } from 'lucide-react';
import type { Language } from '../types';
import { colorThemes, readColorTheme, saveColorTheme } from '../utils/colorThemes';
import { Tooltip } from './Tooltip';

const themeIcons = { 'mizan-developed': Palette, default: Sparkles, olive: Leaf, night: MoonStar, paper: NotebookPen, github: Github, hacker: Terminal, 'red-dark': Flame, ocean: Waves, sunset: Sunset };

export function ColorThemePicker({ lang, className }: { lang: Language; className: string }) {
  const ar = lang === 'ar';
  const id = useId();


  const panel = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(readColorTheme);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') panel.current?.hidePopover(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);
  return <>
    <Tooltip text={ar ? 'ثيمات الألوان' : 'Color themes'}>
    <button id="header-palette-btn" type="button" popoverTarget={id} onClick={() => setSelected(readColorTheme())} aria-label={ar ? 'ثيمات الألوان' : 'Color themes'} aria-haspopup="dialog" className={className}>
      <Palette aria-hidden="true" size={18} strokeWidth={1.8} className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:-rotate-12" />
    </button>
    </Tooltip>
    <div id={id} ref={panel} popover="manual" role="dialog" aria-labelledby={`${id}-title`} dir={ar ? 'rtl' : 'ltr'} className="theme-dock fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-dvh w-[min(310px,100%)] overflow-hidden rounded-none rounded-l-2xl border border-slate-200 bg-slate-50 p-2 text-slate-900 shadow-2xl dark:border-white/15 dark:bg-[#101219] dark:text-zinc-100 sm:p-2">
      <div className="sticky top-0 z-10 mb-1 flex items-center bg-slate-50 dark:bg-[#101219] justify-between gap-3 border-b border-slate-200 px-2 pb-2 pt-1 dark:border-white/10"><div className="space-y-1"><h2 id={`${id}-title`} className="flex items-center gap-2 text-sm font-bold"><Palette size={16} />{ar ? 'ثيم مساحتك' : 'Your space, your style'}</h2><p role="status" className="text-[11px] text-slate-500 dark:text-zinc-400">{ar ? 'التغيير مباشر والحفظ تلقائي' : 'Applied live. Saved automatically.'}</p></div></div>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-2" role="group" aria-label={ar ? 'الثيمات المتاحة' : 'Available themes'}>
        {colorThemes.map(item => { const Icon = themeIcons[item.id], active = selected === item.id; return <button key={item.id} type="button" aria-pressed={active} title={ar ? item.descriptionAr : item.descriptionEn} onClick={() => { saveColorTheme(item.id); setSelected(item.id); }} className={`group/theme relative flex min-h-12 w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${active ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}>
          <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: item.colors[1], color: item.colors[0] }}><Icon size={15} /></span>
          <span className="min-w-0 flex-1 text-xs font-medium">{ar ? item.ar : item.en}</span><span aria-hidden="true" className="flex -space-x-1" dir="ltr">{item.colors.map(color => <span key={color} className="h-3.5 w-3.5 rounded-full border border-black/15" style={{ background: color }} />)}</span>
          <span className="flex w-4 shrink-0 justify-center">{active && <Check aria-hidden="true" size={15} />}</span>
        </button>; })}
      </div>
      <div className="shrink-0 border-t border-slate-200 pt-3 dark:border-white/10">
        <button type="button" popoverTarget={id} popoverTargetAction="hide" className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"><Sparkles aria-hidden="true" size={17} className={ar ? 'order-last' : 'order-first'} />{ar ? 'يلا نعيش الجو' : 'Let’s try this vibe'}</button>
      </div>
    </div>
  </>;
}
