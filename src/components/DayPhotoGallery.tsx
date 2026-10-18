import React, { useId, useState } from 'react';
import { ArrowUpRight, Camera, ChevronDown, Download, Expand, ImagePlus, Images, Plus, Trash2 } from 'lucide-react';

export function DayPhotoGallery({ photos, date, ar, busy, onAdd, onCapture, onView, onRemove }: {
  photos: string[]; date: string; ar: boolean; busy: boolean;
  onAdd: () => void; onCapture: () => void; onView: (index: number) => void; onRemove: (index: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const panelId = useId();
  const tool = 'flex size-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300';
  return <>
    <header className="flex flex-wrap items-center justify-between gap-4 px-5 pb-5 pt-6 sm:px-7">
      <div className="flex items-center gap-3.5">
        <span className="flex size-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-400/20 to-amber-500/5 text-amber-600 dark:text-amber-300"><Images size={23} strokeWidth={1.5} /></span>
        <div>
          <h2 id="day-photo-title" className="flex flex-wrap items-center gap-3 text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">{ar ? 'لحظات من يومك' : 'Your day, in moments'}
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-gradient-to-r from-amber-400/15 to-amber-400/5 py-1 pe-3 ps-1 text-amber-700 dark:border-amber-300/20 dark:text-amber-200">
              <span className="flex min-w-7 items-center justify-center rounded-full bg-amber-400 px-1.5 py-1 text-xs font-bold tabular-nums leading-5 text-amber-950 shadow-sm">{photos.length}</span>
              <span className="text-[10px] font-medium tracking-normal">{ar ? (photos.length === 1 ? 'لحظة محفوظة' : 'لحظات محفوظة') : (photos.length === 1 ? 'saved moment' : 'saved moments')}</span>
            </span>
          </h2>
        </div>
      </div>
      <div className="flex items-center gap-2">

        <button type="button" disabled={busy} onClick={onCapture} title={ar ? 'التقاط صورة' : 'Take a photo'} aria-label={ar ? 'التقاط صورة' : 'Take a photo'} className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all duration-200 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600 motion-safe:enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-amber-500 disabled:opacity-40 dark:border-white/10 dark:text-zinc-400 dark:hover:border-amber-400/50 dark:hover:bg-amber-400/10 dark:hover:text-amber-300"><Camera size={18} /></button>
        <button type="button" disabled={busy} onClick={onAdd} className="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-amber-400 px-4 text-xs font-bold text-amber-950 shadow-[0_4px_16px_-6px_rgba(251,191,36,0.5)] transition-all duration-200 hover:bg-amber-300 hover:shadow-[0_6px_24px_-6px_rgba(251,191,36,0.65)] motion-safe:enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:opacity-40"><Plus size={17} />{ar ? 'إضافة لحظة' : 'Add a moment'}</button>
        <button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded(value => !value)} className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-amber-600/15 bg-amber-50/70 px-3 text-[11px] font-semibold text-amber-700 transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-amber-500 dark:border-amber-400/15 dark:bg-amber-400/[.06] dark:text-amber-300 dark:hover:bg-amber-400/10">
          <Images aria-hidden="true" size={13} />
          {expanded ? (ar ? 'طيّ' : 'Collapse') : (ar ? 'عرض لحظاتك الأسطورية' : 'Show your legendary moments')}
          <ChevronDown aria-hidden="true" size={15} className={`shrink-0 text-slate-400 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </header>
    <div id={panelId} hidden={!expanded} className="px-4 pb-5 sm:px-7">
      {photos.length ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {photos.map((photo, index) => <article key={`${index}-${photo.slice(-24)}`} className="group relative aspect-[4/5] isolate overflow-hidden rounded-2xl bg-slate-200 ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/5">
          <img aria-hidden="true" src={photo} className="pointer-events-none absolute inset-0 -z-10 size-full scale-125 object-cover opacity-30 blur-xl" />
          <button type="button" onClick={() => onView(index)} aria-label={ar ? `عرض الصورة ${index + 1}` : `View photo ${index + 1}`} className="absolute inset-0 size-full cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-amber-400">
            <img src={photo} loading="lazy" draggable={false} alt={ar ? `صورة اليوم ${index + 1}` : `Day photo ${index + 1}`} className="size-full object-contain p-2 motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]" />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <span className="pointer-events-none absolute start-3 top-3 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] font-medium tabular-nums text-white/90 backdrop-blur-md">{String(index + 1).padStart(2, '0')}</span>
          <button type="button" onClick={() => onView(index)} title={ar ? 'تكبير الصورة' : 'Expand photo'} aria-label={ar ? `تكبير الصورة ${index + 1}` : `Expand photo ${index + 1}`} className={`${tool} absolute end-3 top-3 z-10 cursor-pointer`}><Expand size={15} /></button>
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
            <button type="button" onClick={() => onView(index)} className="flex items-center gap-1 text-xs font-medium text-white/90 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-300">{ar ? 'لحظة محفوظة' : 'A saved moment'}<ArrowUpRight size={14} className="opacity-60" /></button>
            <div className="flex gap-1.5">
              <a href={photo} download={`mizan-${date}-${index + 1}.jpg`} title={ar ? 'تنزيل الصورة' : 'Download photo'} aria-label={ar ? `تنزيل الصورة ${index + 1}` : `Download photo ${index + 1}`} className={`${tool} hover:!bg-emerald-500/80 focus-visible:!bg-emerald-500/80`}><Download size={15} /></a>
              <button type="button" disabled={busy} onClick={() => onRemove(index)} title={ar ? 'حذف الصورة' : 'Delete photo'} aria-label={ar ? `حذف الصورة ${index + 1}` : `Delete photo ${index + 1}`} className={`${tool} hover:!bg-red-500/80 disabled:opacity-40`}><Trash2 size={14} /></button>
            </div>
          </div>
        </article>)}
        <button type="button" disabled={busy} onClick={onAdd} className="group flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-center transition-colors hover:border-amber-400 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-500 disabled:opacity-40 dark:border-white/15 dark:bg-white/[.015] dark:hover:border-amber-400/50 dark:hover:bg-amber-400/[.04]">
          <span className="flex size-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors group-hover:text-amber-600 dark:border-white/10 dark:bg-white/[.03] dark:group-hover:text-amber-300"><Plus size={24} strokeWidth={1.5} /></span>
          <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">{ar ? 'في كمان لحظات؟' : 'One more moment?'}</span>
          <span className="text-[10px] leading-5 text-slate-400 dark:text-zinc-500">{ar ? 'أضف صورًا أو اسحبها هون' : 'Add photos or drop them here'}</span>
        </button>
      </div> : <button type="button" disabled={busy} onClick={onAdd} className="group flex min-h-72 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-gradient-to-b from-slate-50 to-white px-5 py-10 text-center hover:border-amber-400 focus-visible:outline-2 focus-visible:outline-amber-500 disabled:opacity-40 dark:border-white/15 dark:from-white/[.03] dark:to-transparent">
        <span className="mb-5 flex size-20 -rotate-6 items-center justify-center rounded-3xl border border-amber-400/20 bg-amber-400/10 text-amber-600 shadow-[8px_8px_0_0_rgba(251,191,36,0.05)] motion-safe:transition-transform motion-safe:group-hover:rotate-0 dark:text-amber-300"><ImagePlus size={34} strokeWidth={1.3} /></span>
        <span className="text-lg font-semibold text-slate-800 dark:text-zinc-100">{ar ? 'يومك يستاهل ينحفظ' : 'A day worth remembering'}</span>
        <span className="mt-2 text-xs leading-6 text-slate-500 dark:text-zinc-400">{ar ? 'اجمع اللقطات اللي بتحب ترجع إلها. اسحب صورك هون أو اخترها من جهازك.' : 'Keep the moments you’ll want to revisit. Drop photos here or choose from your device.'}</span>
        <span className="mt-5 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-amber-950">{ar ? 'أضف أول لحظة' : 'Add your first moment'}</span>
      </button>}
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-zinc-500"><span>{ar ? 'اضغط على أي صورة لتعيش اللحظة من جديد' : 'Open any photo to revisit the moment'}</span><span dir="ltr">JPG · PNG · WebP <span className="mx-1 opacity-40">/</span> 20 MB</span></footer>
    </div>
  </>;
}
