import React, { useEffect, useRef, useState } from 'react';
import { Camera, LoaderCircle, SwitchCamera, X } from 'lucide-react';
import type { Language } from '../types';

export function DayCamera({ lang, onClose, onCapture }: { lang: Language; onClose: () => void; onCapture: (file: File) => void }) {
  const ar = lang === 'ar';
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const active = useRef(true);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [capturing, setCapturing] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    active.current = true;
    element?.showModal();
    return () => {
      active.current = false;
      element?.close();
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    let current: MediaStream | null = null;
    setReady(false); setError('');
    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
        current = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } } });
        if (cancelled) { current.getTracks().forEach(track => track.stop()); return; }
        stream.current = current;
        if (video.current) { video.current.srcObject = current; await video.current.play(); }
        if (!cancelled) setReady(true);
      } catch (failure) {
        current?.getTracks().forEach(track => track.stop());
        if (cancelled) return;
        const name = (failure as Error).name;
        setError(name === 'NotAllowedError' ? (ar ? 'اسمح باستخدام الكاميرا من إعدادات المتصفح، ثم حاول مرة أخرى.' : 'Allow camera access in your browser settings, then try again.') : name === 'NotFoundError' ? (ar ? 'ما لقينا كاميرا متصلة بهذا الجهاز.' : 'No camera was found on this device.') : (ar ? 'تعذّر فتح الكاميرا. تأكد أنها متاحة وأن الموقع مفتوح عبر HTTPS أو localhost.' : 'Could not open the camera. Check that it is available and use HTTPS or localhost.'));
      }
    };
    void start();
    return () => { cancelled = true; current?.getTracks().forEach(track => track.stop()); if (stream.current === current) stream.current = null; };
  }, [facing, ar]);
  const capture = () => {
    const source = video.current;
    if (!source || !ready || capturing || !source.videoWidth) return;
    setCapturing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = source.videoWidth; canvas.height = source.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas');
      context.drawImage(source, 0, 0);
      canvas.toBlob(blob => {
        if (!active.current) return;
        if (!blob) { setCapturing(false); setError(ar ? 'تعذّر التقاط الصورة. حاول مرة أخرى.' : 'Could not capture the photo. Try again.'); return; }
        onCapture(new File([blob], `mizan-camera-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.9);
    } catch { setCapturing(false); setError(ar ? 'تعذّر التقاط الصورة. حاول مرة أخرى.' : 'Could not capture the photo. Try again.'); }
  };
  return <dialog ref={dialog} aria-labelledby="day-camera-title" dir={ar ? 'rtl' : 'ltr'} onCancel={event => { event.preventDefault(); onClose(); }} onClose={() => { if (!dialog.current?.open) onClose(); }} className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-black p-0 text-white backdrop:bg-black">
    <div className="relative h-full">
      <video ref={video} autoPlay muted playsInline className={`h-full w-full object-contain ${facing === 'user' ? '-scale-x-100' : ''}`} />
      <header className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]"><h2 id="day-camera-title" className="font-semibold">{ar ? 'التقط لحظة من يومك' : 'Capture a moment'}</h2><button type="button" autoFocus onClick={onClose} aria-label={ar ? 'إغلاق الكاميرا' : 'Close camera'} className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-amber-400"><X size={21} /></button></header>
      {!ready && !error && <p role="status" className="absolute inset-0 flex items-center justify-center gap-2 text-sm"><LoaderCircle size={20} className="animate-spin" />{ar ? 'جارٍ فتح الكاميرا…' : 'Opening camera…'}</p>}
      {error && <p role="alert" className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-2xl border border-amber-400/25 bg-slate-950/95 p-6 text-center text-sm leading-7 text-amber-200">{error}</p>}
      <footer className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-7 bg-gradient-to-t from-black/90 to-transparent px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-12">
        <button type="button" disabled={!ready || capturing} onClick={() => setFacing(value => value === 'environment' ? 'user' : 'environment')} aria-label={ar ? 'تبديل الكاميرا' : 'Switch camera'} className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-40"><SwitchCamera size={23} /></button>
        <button type="button" disabled={!ready || capturing} onClick={capture} aria-label={ar ? 'التقاط الصورة' : 'Capture photo'} className="flex size-20 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-white/15 p-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 disabled:opacity-40"><span className="flex size-full items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-amber-300">{capturing ? <LoaderCircle className="animate-spin" /> : <Camera size={27} />}</span></button>
        <span className="size-12" aria-hidden="true" />
      </footer>
    </div>
  </dialog>;
}
