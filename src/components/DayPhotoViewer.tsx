import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Trash2, X } from 'lucide-react';
import { DeletePhotoDialog } from './DeletePhotoDialog';
import type { Language } from '../types';

export function DayPhotoViewer({ photos, index: initialIndex, date, lang, busy, onRemove, onClose, feedback }: {
  photos: string[]; index: number; date: string; lang: Language; busy: boolean; onRemove: (index: number) => boolean; onClose: () => void; feedback?: React.ReactNode;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const photo = photos[index];
  const dialog = useRef<HTMLDialogElement>(null);
  const ar = lang === 'ar';
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  const move = (step: number) => setIndex(current => (current + step + photos.length) % photos.length);
  const remove = () => {
    if (!onRemove(index)) return false;
    setConfirmDelete(false);
    if (photos.length === 1) onClose();
    else setIndex(Math.min(index, photos.length - 2));
    return true;
  };
  return <dialog ref={dialog} aria-labelledby="photo-viewer-title" dir={ar ? 'rtl' : 'ltr'}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClose={() => { if (!dialog.current?.open) onClose(); }}
    onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden rounded-none border-0 bg-[#080a0b] p-0 text-white backdrop:bg-black">
    <div className="relative isolate h-full w-full">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] sm:px-7 [&>a]:pointer-events-auto [&>button]:pointer-events-auto">
        <div className="flex-1"><h2 id="photo-viewer-title" className="text-sm font-semibold">{ar ? 'لحظات من يومك' : 'Your day, in moments'}</h2><p className="mt-1 text-[10px] text-zinc-500"><bdi>{date}</bdi><span className="mx-2">/</span><span aria-live="polite">{index + 1} / {photos.length}</span></p></div>
        <a href={photo} download={`mizan-${date}-${index + 1}.jpg`} aria-label={ar ? 'تنزيل الصورة' : 'Download photo'} className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-emerald-500/80 focus-visible:outline-2 focus-visible:outline-white sm:px-4"><Download size={18} aria-hidden="true" /><span className="hidden sm:inline">{ar ? 'تنزيل الصورة' : 'Download photo'}</span></a>
        <button type="button" disabled={busy} onClick={() => setConfirmDelete(true)} aria-label={ar ? 'حذف الصورة' : 'Delete photo'} className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-red-500/80 focus-visible:outline-2 focus-visible:outline-red-400 disabled:opacity-40 sm:px-4"><Trash2 size={18} aria-hidden="true" /><span className="hidden sm:inline">{ar ? 'حذف الصورة' : 'Delete photo'}</span></button>
        <button type="button" autoFocus onClick={onClose} aria-label={ar ? 'إغلاق الصورة' : 'Close photo'} className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-md hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-amber-400"><X size={20} /></button>
      </div>
      <div className="absolute inset-0 isolate overflow-hidden">
        <img src={photo} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full object-cover opacity-15 blur-3xl" />
        <img src={photo} alt={ar ? `صورة اليوم ${index + 1}` : `Day photo ${index + 1}`} className="h-full w-full object-contain" />
        {photos.length > 1 && <div dir="ltr" className="pointer-events-none absolute inset-x-2 top-1/2 flex -translate-y-1/2 justify-between sm:inset-x-4">
          <button type="button" onClick={() => move(-1)} aria-label={ar ? 'الصورة السابقة' : 'Previous photo'} className="pointer-events-auto flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-amber-400"><ChevronLeft size={20} /></button>
          <button type="button" onClick={() => move(1)} aria-label={ar ? 'الصورة التالية' : 'Next photo'} className="pointer-events-auto flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-amber-400"><ChevronRight size={20} /></button>
        </div>}
      </div>
      {photos.length > 1 && <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center bg-gradient-to-t from-black/80 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8"><div className="pointer-events-auto flex max-w-full gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/35 p-2 backdrop-blur-md" aria-label={ar ? 'صور الألبوم' : 'Album photos'}>{photos.map((item, position) => <button key={position} type="button" onClick={() => setIndex(position)} aria-label={ar ? `عرض الصورة ${position + 1}` : `View photo ${position + 1}`} aria-pressed={index === position} className={`size-11 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity focus-visible:outline-2 focus-visible:outline-amber-300 sm:size-14 ${index === position ? 'border-amber-400 opacity-100' : 'border-transparent opacity-40 hover:opacity-80'}`}><img src={item} alt="" loading="lazy" className="size-full object-cover" /></button>)}</div></div>}
    </div>
    {feedback}
    {confirmDelete && <DeletePhotoDialog photo={photo} lang={lang} onCancel={() => setConfirmDelete(false)} onConfirm={remove} />}
  </dialog>;
}
