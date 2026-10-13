import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, LayoutGrid, ListChecks, X } from 'lucide-react';
import type { Language, PlannerCategory } from '../types';

interface TaskDestinationDialogProps {
  lang: Language;
  cards: PlannerCategory[];
  onClose: () => void;
  onTimeline: () => void;
  onCards: () => void;
  onCard: (categoryId: string) => void;
}

export function TaskDestinationDialog({ lang, cards, onClose, onTimeline, onCards, onCard }: TaskDestinationDialogProps) {
  const ar = lang === 'ar';
  const [step, setStep] = useState<'view' | 'card'>('view');
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const headingId = useId();

  useEffect(() => {
    openerRef.current ||= document.activeElement as HTMLElement | null;
    const opener = openerRef.current;
    return () => {
      // A destination editor can take focus itself; restore only after cancellation.
      requestAnimationFrame(() => { if (document.activeElement === document.body && opener?.isConnected) opener.focus(); });
    };
  }, []);

  useEffect(() => { firstChoiceRef.current?.focus(); }, [step]);

  const choiceClass = 'flex min-h-14 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-start text-sm font-semibold text-slate-900 transition-colors hover:border-emerald-500/50 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" onPointerDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={headingId} className="max-h-[calc(100dvh-1.5rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/[0.1] dark:bg-[#11131a]" onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); onClose(); }
        if (event.key !== 'Tab') return;
        const controls = [...(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') || [])];
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={headingId} className="text-base font-bold">{step === 'view' ? (ar ? 'أين تريد إضافة المهمة؟' : 'Where do you want to add your task?') : (ar ? 'اختر البطاقة' : 'Choose a card')}</h2>
          <button type="button" onClick={onClose} aria-label={ar ? 'إغلاق اختيار مكان المهمة' : 'Close task destination'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-zinc-400 dark:hover:bg-white/5"><X aria-hidden="true" className="h-4 w-4" /></button>
        </div>
        {step === 'view' ? <div className="space-y-2">
          <button ref={firstChoiceRef} type="button" data-task-destination="timeline" onClick={onTimeline} className={choiceClass}><ListChecks aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />{ar ? 'الجدول الزمني' : 'Timeline'}</button>
          <button type="button" data-task-destination="cards" onClick={() => { onCards(); setStep('card'); }} className={choiceClass}><LayoutGrid aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />{ar ? 'البطاقات' : 'Cards'}</button>
        </div> : <>
          <div className="max-h-[55dvh] space-y-2 overflow-y-auto p-1">
            {cards.map((card, index) => <button ref={index === 0 ? firstChoiceRef : undefined} key={card.id} type="button" data-task-card-target={card.id} onClick={() => onCard(card.id)} className={choiceClass}><span className="min-w-0 break-words">{ar ? card.name : card.nameEn || card.name}</span></button>)}
          </div>
          <button type="button" onClick={() => setStep('view')} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-slate-500 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-zinc-400 dark:hover:text-white">{ar ? <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /> : <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />}{ar ? 'رجوع' : 'Back'}</button>
        </>}
      </div>
    </div>
  );
}
