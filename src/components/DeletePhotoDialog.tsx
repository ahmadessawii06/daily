import React, { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Language } from '../types';

export function DeletePhotoDialog({ lang, onCancel, onConfirm }: {
  photo: string; lang: Language; onCancel: () => void; onConfirm: () => boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState(false);
  const ar = lang === 'ar';
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    return () => { element?.close(); if (opener?.isConnected) opener.focus(); };
  }, []);
  return <dialog ref={dialog} role="alertdialog" aria-labelledby="delete-photo-title" dir={ar ? 'rtl' : 'ltr'}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); onCancel(); }}
    onClose={event => { event.stopPropagation(); if (!dialog.current?.open) onCancel(); }}
    onKeyDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}
    className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-3xl border border-amber-400/30 bg-slate-950 p-7 text-center text-white shadow-[0_24px_100px_rgba(0,0,0,0.7)] backdrop:bg-black/75 backdrop:backdrop-blur-sm">
    <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-400/40"><Trash2 size={32} className="text-red-400" aria-hidden="true" /></div>
    <h2 id="delete-photo-title" className="text-xl font-bold">{ar ? 'حذف هذه اللحظة؟' : 'Delete this moment?'}</h2>
    {error && <p role="alert" className="mt-4 text-xs leading-6 text-red-300">{ar ? 'تعذّر حفظ الحذف. حاول مرة أخرى.' : 'Could not save deletion. Please try again.'}</p>}
    <div className="mt-6 grid grid-cols-2 gap-3">
      <button autoFocus type="button" onClick={onCancel} className="min-h-12 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">{ar ? 'إلغاء' : 'Cancel'}</button>
      <button type="button" onClick={() => { if (!onConfirm()) setError(true); }} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white hover:bg-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"><Trash2 size={16} aria-hidden="true" />{ar ? 'حذف الصورة' : 'Delete photo'}</button>
    </div>
  </dialog>;
}
