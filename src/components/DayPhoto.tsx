import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, LoaderCircle, Undo2, Upload, X } from 'lucide-react';
import { DayCamera } from './DayCamera';
import { DayPhotoGallery } from './DayPhotoGallery';
import { createPortal } from 'react-dom';
import { DeletePhotoDialog } from './DeletePhotoDialog';
import { DayPhotoViewer } from './DayPhotoViewer';
import type { Language } from '../types';
import { getDayRecord, saveDayPhotos } from '../utils/storage';
import { prepareDayPhoto } from '../utils/dayPhoto';

export function DayPhoto({ date, lang, onSaved }: { date: string; lang: Language; onSaved: () => void }) {
  const ar = lang === 'ar';
  const readPhotos = () => { const record = getDayRecord(date); return record.dayPhotos ?? (record.dayPhoto ? [record.dayPhoto] : []); };
  const [photos, setPhotos] = useState(readPhotos);
  const [viewing, setViewing] = useState<{ photo: string; index: number } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [deletedPhotos, setDeletedPhotos] = useState<{ photo: string; index: number }[]>([]);
  const [undoError, setUndoError] = useState(false);
  const [undoSeconds, setUndoSeconds] = useState(5);
  useEffect(() => {
    if (!deletedPhotos.length) return;
    setUndoSeconds(5);
    const deadline = Date.now() + 5000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setUndoSeconds(remaining);
      if (!remaining) { window.clearInterval(timer); setDeletedPhotos([]); }
    }, 100);
    return () => window.clearInterval(timer);
  }, [deletedPhotos]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const processing = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const refresh = () => setPhotos(readPhotos());
    refresh();
    window.addEventListener('mizan:data-synced', refresh);
    return () => { mounted.current = false; window.removeEventListener('mizan:data-synced', refresh); };
  }, [date]);
  const save = (value: string[]) => {
    if (!saveDayPhotos(date, value)) { setError(ar ? 'تعذّر حفظ الصور. قد تكون مساحة الجهاز ممتلئة، جرّب صورًا أصغر.' : 'Could not save photos. Storage may be full; try smaller photos.'); return false; }
    setPhotos(value); setError(''); onSaved();
    return true;
  };
  const choose = async (files: File[]) => {
    if (processing.current) return;
    processing.current = true;
    setBusy(true); setError('');
    try {
      let failed = 0;
      for (const file of files) {
        let photo: string;
        try { photo = await prepareDayPhoto(file); }
        catch { failed++; continue; }
        if (!mounted.current) return;
        if (!save([...readPhotos(), photo])) return;
      }
      if (failed && mounted.current) setError(ar ? `تعذّر تجهيز ${failed} من الصور. تم حفظ الصور الصالحة؛ استخدم JPG أو PNG أو WebP حتى 20 ميغابايت للصورة.` : `${failed} photos could not be processed. Valid photos were saved; use JPG, PNG, or WebP up to 20 MB each.`);
    }
    catch { if (mounted.current) setError(ar ? 'اختر صورة JPG أو PNG أو WebP أصغر من 20 ميغابايت. جرّب صورة أصغر إذا تعذّر تجهيزها.' : 'Choose a JPG, PNG, or WebP under 20 MB. Try a smaller image if processing fails.'); }
    finally { processing.current = false; if (mounted.current) setBusy(false); }
  };
  const removePhoto = (index: number) => {
    const current = readPhotos();
    if (!current[index] || !save(current.filter((_, i) => i !== index))) return false;
    setDeletedPhotos(previous => [...previous, { photo: current[index], index }]);
    setUndoError(false);
    return true;
  };
  const undo = () => {
    const deleted = deletedPhotos.at(-1);
    if (!deleted) return;
    const current = [...readPhotos()];
    current.splice(Math.min(deleted.index, current.length), 0, deleted.photo);
    if (!save(current)) { setUndoError(true); return; }
    setDeletedPhotos(previous => previous.slice(0, -1));
    setUndoError(false);
  };
  const feedback = deletedPhotos.length > 0 && <div dir={ar ? 'rtl' : 'ltr'} className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-[120] flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/15 bg-[#171b23] px-4 py-2 text-xs text-white shadow-2xl">
    <CheckCircle2 size={18} className="shrink-0 text-emerald-400" aria-hidden="true" />
    <span role="status">{undoError ? (ar ? 'تعذّر التراجع، حاول مرة أخرى' : 'Could not undo. Try again.') : (ar ? 'تم حذف الصورة' : 'Photo deleted')}</span>
    <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full border border-white/15 text-[10px] tabular-nums text-zinc-400">{undoSeconds}</span>
    <button type="button" disabled={busy} onClick={undo} className="flex min-h-10 items-center gap-1.5 rounded-lg px-2 font-semibold text-emerald-300 hover:bg-emerald-500/10 focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:opacity-40"><Undo2 size={15} aria-hidden="true" />{ar ? 'تراجع' : 'Undo'}</button>
    <button type="button" onClick={() => setDeletedPhotos([])} aria-label={ar ? 'إغلاق رسالة التراجع' : 'Dismiss undo'} className="flex size-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-emerald-400"><X size={15} /></button>
  </div>;
  return <section aria-labelledby="day-photo-title" dir={ar ? 'rtl' : 'ltr'}
    onDragEnter={event => { event.preventDefault(); if (event.dataTransfer.types.includes('Files')) { dragDepth.current++; if (!processing.current) setDragging(true); } }}
    onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = processing.current ? 'none' : 'copy'; }}
    onDragLeave={event => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }}
    onDrop={event => {
      event.preventDefault(); dragDepth.current = 0; setDragging(false);
      if (processing.current) return;
      const files = Array.from(event.dataTransfer.files);
      if (files.length) void choose(files);
    }}
    className={`relative overflow-hidden rounded-3xl border bg-white shadow-sm dark:bg-[#111416] ${dragging ? 'border-amber-400 ring-4 ring-amber-400/15' : 'border-slate-200 dark:border-white/[.08]'}`}>
    <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={ar ? 'اختيار صور' : 'Choose photos'} disabled={busy} onChange={event => { const files = Array.from(event.target.files || []); if (files.length) void choose(files); event.target.value = ''; }} />
    <DayPhotoGallery photos={photos} date={date} ar={ar} busy={busy} onAdd={() => input.current?.click()} onCapture={() => setCameraOpen(true)} onView={index => setViewing({ photo: photos[index], index })} onRemove={setPendingDelete} />
    {busy && <p role="status" className="mx-7 mb-5 flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400"><LoaderCircle size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />{ar ? 'جارٍ تجهيز الصورة…' : 'Preparing photo…'}</p>}
    {error && <p role="alert" className="mx-7 mb-5 text-xs leading-6 text-amber-700 dark:text-amber-300">{error}</p>}
    {dragging && <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-amber-50/95 text-amber-800 dark:bg-[#1c1b12]/95 dark:text-amber-200"><Upload size={36} strokeWidth={1.5} aria-hidden="true" /><p role="status" className="text-sm font-semibold">{ar ? 'أفلت الصورة هون' : 'Drop your photos here'}</p><span className="text-xs opacity-70">{ar ? 'لقطة جديدة لهذا اليوم' : 'A new moment for this day'}</span></div>}
    {viewing && createPortal(<DayPhotoViewer photos={photos} index={viewing.index} date={date} lang={lang} busy={busy} onRemove={removePhoto} onClose={() => setViewing(null)} feedback={feedback} />, document.body)}
    {!viewing && feedback && createPortal(feedback, document.body)}
    {pendingDelete !== null && createPortal(<DeletePhotoDialog photo={photos[pendingDelete]} lang={lang} onCancel={() => setPendingDelete(null)} onConfirm={() => {
      if (!removePhoto(pendingDelete)) return false;
      setPendingDelete(null);
      return true;
    }} />, document.body)}
    {cameraOpen && createPortal(<DayCamera lang={lang} onClose={() => setCameraOpen(false)} onCapture={file => { setCameraOpen(false); void choose([file]); }} />, document.body)}
  </section>;
}
