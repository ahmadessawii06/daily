import React, { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, LoaderCircle, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import type { Language } from '../types';
import { getDayRecord, saveDayPhoto } from '../utils/storage';
import { prepareDayPhoto } from '../utils/dayPhoto';

export function DayPhoto({ date, lang, onSaved }: { date: string; lang: Language; onSaved: () => void }) {
  const ar = lang === 'ar';
  const [photo, setPhoto] = useState(() => getDayRecord(date).dayPhoto || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const processing = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const refresh = () => setPhoto(getDayRecord(date).dayPhoto || '');
    window.addEventListener('mizan:data-synced', refresh);
    return () => { mounted.current = false; window.removeEventListener('mizan:data-synced', refresh); };
  }, [date]);
  const save = (value: string) => {
    if (!saveDayPhoto(date, value)) { setError(ar ? 'تعذّر حفظ الصورة. قد تكون مساحة الجهاز ممتلئة، جرّب صورة أصغر.' : 'Could not save. Storage may be full; try a smaller photo.'); return; }
    setPhoto(value); setError(''); onSaved();
  };
  const choose = async (file: File) => {
    if (processing.current) return;
    processing.current = true;
    setBusy(true); setError('');
    try { const value = await prepareDayPhoto(file); if (mounted.current) save(value); }
    catch { if (mounted.current) setError(ar ? 'اختر صورة JPG أو PNG أو WebP أصغر من 20 ميغابايت. جرّب صورة أصغر إذا تعذّر تجهيزها.' : 'Choose a JPG, PNG, or WebP under 20 MB. Try a smaller image if processing fails.'); }
    finally { processing.current = false; if (mounted.current) setBusy(false); }
  };
  return <section aria-labelledby="day-photo-title" dir={ar ? 'rtl' : 'ltr'}
    onDragEnter={event => { event.preventDefault(); if (event.dataTransfer.types.includes('Files')) { dragDepth.current++; if (!processing.current) setDragging(true); } }}
    onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = processing.current ? 'none' : 'copy'; }}
    onDragLeave={event => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }}
    onDrop={event => {
      event.preventDefault(); dragDepth.current = 0; setDragging(false);
      if (processing.current) return;
      const files = Array.from(event.dataTransfer.files);
      if (files.length !== 1) { setError(ar ? 'اسحب صورة واحدة لليوم.' : 'Drop one photo for the day.'); return; }
      void choose(files[0]);
    }}
    className={`relative isolate overflow-hidden rounded-2xl border bg-white p-4 shadow-2xs transition-[border-color,box-shadow] dark:bg-[#101416] sm:p-5 ${dragging ? 'border-amber-400 ring-4 ring-amber-400/15 shadow-[0_0_40px_-12px_rgba(245,158,11,0.35)]' : 'border-amber-500/20 dark:border-amber-400/15'}`}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_65%)]" />
    <div className="mb-4 flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-400/[.08] dark:text-amber-300"><Camera size={19} aria-hidden="true" /></span>
      <div className="flex-1"><h2 id="day-photo-title" className="text-sm font-semibold">{ar ? 'صورة اليوم' : 'Photo of the day'}</h2><p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-zinc-400">{ar ? 'لحظة بتحكي عن يومك.' : 'A moment that tells your day.'}</p></div>
      {photo && <button disabled={busy} type="button" aria-label={ar ? 'حذف صورة اليوم' : 'Remove day photo'} onClick={() => { if (window.confirm(ar ? 'حذف صورة هذا اليوم؟' : 'Remove this day’s photo?')) save(''); }} className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-emerald-500"><Trash2 size={15} /></button>}
    </div>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={ar ? 'اختيار صورة اليوم' : 'Choose day photo'} disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) void choose(file); event.target.value = ''; }} />
    <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="sr-only" aria-label={ar ? 'التقاط صورة اليوم بالكاميرا' : 'Capture day photo with camera'} disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) void choose(file); event.target.value = ''; }} />
    <div className={`relative mb-4 overflow-hidden rounded-xl border border-dashed transition-colors ${dragging ? 'border-amber-400 bg-amber-50 dark:bg-amber-400/10' : 'border-amber-500/25 bg-amber-50/30 dark:border-amber-400/20 dark:bg-black/15'}`}>
      {photo ? <img src={photo} draggable={false} alt={ar ? 'صورة اليوم المختارة' : 'Selected photo of the day'} className="max-h-96 w-full object-contain p-2 sm:p-3" /> : <button type="button" disabled={busy} onClick={() => input.current?.click()} className="group flex min-h-52 w-full flex-col items-center justify-center px-5 py-8 text-center focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-amber-500 disabled:opacity-50 sm:min-h-60">
        <span className="relative mb-5 flex size-16 -rotate-6 items-center justify-center rounded-2xl border border-amber-500/20 bg-white text-amber-600 shadow-[5px_5px_0_0_rgba(245,158,11,0.10)] motion-safe:transition-transform motion-safe:group-hover:rotate-0 dark:bg-[#1c1b15] dark:text-amber-300"><ImageIcon size={30} strokeWidth={1.4} aria-hidden="true" /><span className="absolute -bottom-2 -end-2 flex size-7 items-center justify-center rounded-lg bg-amber-400 text-amber-950"><Upload size={14} aria-hidden="true" /></span></span>
        <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{ar ? 'كل يوم إله لقطة' : 'Every day has its moment'}</span>
        <span className="mt-2 text-xs leading-6 text-slate-500 dark:text-zinc-400">{ar ? 'اسحب صورتك هون، أو اضغط لاختيارها' : 'Drag your photo here, or click to choose'}</span>
        <span className="mt-3 text-[10px] tracking-wide text-slate-400 dark:text-zinc-500">JPG · PNG · WebP · {ar ? 'حتى 20 ميغابايت' : 'up to 20 MB'}</span>
      </button>}
      {photo && <p className="border-t border-amber-500/10 px-3 py-2 text-center text-[10px] text-slate-400 dark:text-zinc-500">{ar ? 'لتغيير اللقطة، اسحب صورة جديدة هون أو استخدم الأزرار' : 'Drop a new photo here or use the buttons to replace it'}</p>}
    </div>
    <div className="grid grid-cols-2 gap-3" aria-busy={busy}>
      {(['insert', 'capture'] as const).map(action => {
        const Icon = action === 'insert' ? ImagePlus : Camera;
        return <button key={action} type="button" disabled={busy} onClick={() => (action === 'insert' ? input : cameraInput).current?.click()}
          className={`group flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-3 py-4 text-xs font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-200 hover:border-amber-400/60 hover:bg-amber-50 hover:text-amber-700 hover:shadow-[0_6px_20px_-6px_rgba(245,158,11,0.3)] motion-safe:enabled:hover:-translate-y-0.5 motion-safe:enabled:active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:opacity-50 motion-reduce:transition-none dark:hover:border-amber-400/40 dark:hover:bg-amber-400/10 dark:hover:text-amber-300 ${action === 'capture' ? 'border-amber-500/20 bg-amber-50/60 text-amber-700 dark:border-amber-400/15 dark:bg-amber-400/[.05] dark:text-amber-300' : 'border-dashed border-slate-300 bg-slate-50/50 text-slate-600 dark:border-white/15 dark:bg-black/10 dark:text-zinc-300'}`}>
          <Icon size={22} strokeWidth={1.7} aria-hidden="true" className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-110" />
          {action === 'insert' ? (ar ? 'إدراج صورة' : 'Insert photo') : (ar ? 'التقاط صورة' : 'Take photo')}
        </button>;
      })}
    </div>
    {busy && <p role="status" className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400"><LoaderCircle size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />{ar ? 'جارٍ تجهيز الصورة…' : 'Preparing photo…'}</p>}
    {error && <p role="alert" className="mt-3 text-xs leading-6 text-amber-700 dark:text-amber-300">{error}</p>}
    {dragging && <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-amber-50/95 text-amber-800 dark:bg-[#1c1b12]/95 dark:text-amber-200"><Upload size={36} strokeWidth={1.5} aria-hidden="true" /><p role="status" className="text-sm font-semibold">{ar ? 'أفلت الصورة هون' : 'Drop your photo here'}</p><span className="text-xs opacity-70">{ar ? 'لقطة جديدة لهذا اليوم' : 'A new moment for this day'}</span></div>}
  </section>;
}
