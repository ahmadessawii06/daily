import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { BookOpen, Briefcase, Heart, Leaf, Lightbulb, DollarSign, X, Trash2 } from 'lucide-react';
import type { CategoryIcon, Language, PlannerCategory } from '../types';
import { CATEGORY_ICONS } from '../shared/workspace';

export const CARD_ICONS = { book: BookOpen, briefcase: Briefcase, heart: Heart, leaf: Leaf, moon: Lightbulb, layers: DollarSign };
const previewBanners: Partial<Record<CategoryIcon, Record<Language, string>>> = {
  book: {
    ar: new URL('../assets/images/cards/study-rtl.png', import.meta.url).href,
    en: new URL('../assets/images/cards/study-ltr.png', import.meta.url).href,
  },
  briefcase: {
    ar: new URL('../assets/images/cards/work-rtl.png', import.meta.url).href,
    en: new URL('../assets/images/cards/work-ltr.png', import.meta.url).href,
  },
  heart: {
    ar: new URL('../assets/images/cards/health-rtl.png', import.meta.url).href,
    en: new URL('../assets/images/cards/health-ltr.png', import.meta.url).href,
  },
  leaf: {
    ar: new URL('../assets/images/cards/personal-rtl.png', import.meta.url).href,
    en: new URL('../assets/images/cards/personal-ltr.png', import.meta.url).href,
  },
  moon: {
    ar: new URL('../assets/images/cards/ideas-rtl.png', import.meta.url).href,
    en: new URL('../assets/images/cards/ideas-ltr.png', import.meta.url).href,
  },
  layers: {
    ar: new URL('../assets/images/cards/money-rtl.png', import.meta.url).href,
    en: new URL('../assets/images/cards/money-ltr.png', import.meta.url).href,
  },
};
const defaultPreviewBanner = new URL('../assets/images/home/daily-progress-abstract.png', import.meta.url).href;
const iconNames = { book: ['كتاب', 'Book'], briefcase: ['شنطة', 'Work bag'], heart: ['صحة', 'Health'], leaf: ['حياة', 'Life'], moon: ['أفكار', 'Ideas'], layers: ['مال', 'Money'] };

interface CategoryEditorProps {
  category: PlannerCategory | null;
  lang: Language;
  onSave: (name: string, icon: CategoryIcon) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function CategoryEditor({ category, lang, onSave, onDelete, onClose }: CategoryEditorProps) {
  const ar = lang === 'ar';
  const [name, setName] = useState(category ? (lang === 'en' ? category.nameEn || category.name : category.name) : '');
  const [icon, setIcon] = useState<CategoryIcon>(category?.icon || 'layers');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const Icon = CARD_ICONS[icon];
  const headingId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);
  const confirmation = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    input.current?.focus();
    return () => { previous?.focus(); };
  }, []);
  useEffect(() => { if (confirmDelete) confirmation.current?.focus(); }, [confirmDelete]);

  const field = 'w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#08090d] px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
  const trimmedName = name.trim();
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedName || isSaving) return;
    setError('');
    setIsSaving(true);
    try { await Promise.resolve(onSave(trimmedName, icon)); }
    catch { setError(ar ? 'تعذر حفظ المساحة. تحقق من الاسم وعدد التصنيفات.' : 'Could not create this space. Check its name and category limit.'); }
    finally { setIsSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialog} dir={ar ? 'rtl' : 'ltr'} role="dialog" aria-modal="true" aria-labelledby={headingId}
        onKeyDown={e => {
          if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
          if (e.key !== 'Tab') return;
          const elements = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select') || [])];
          const first = elements[0], last = elements[elements.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
          if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }}
        className="w-full max-w-md max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#11131a] dark:text-zinc-100 sm:max-h-[90dvh] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id={headingId} className="text-lg font-bold">{category ? (ar ? 'تخصيص البطاقة' : 'Customize card') : (ar ? 'إنشاء مساحة جديدة' : 'Create a new space')}</h2>
          <button type="button" aria-label={ar ? 'إغلاق' : 'Close'} onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="flex flex-col gap-2 text-xs font-semibold">
            <span>{ar ? 'اسم المساحة' : 'Space name'}</span>
            <input ref={input} required maxLength={80} value={name} onChange={e => { setName(e.target.value); if (error) setError(''); }} placeholder={ar ? 'مثلاً: مشروعي الشخصي' : 'For example: My personal project'} aria-invalid={Boolean(error)} className={`${field} px-4 py-3.5 text-[13px] leading-6 ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} />
          </label>
          <fieldset>
            <legend className="mb-2.5 text-xs font-semibold">{ar ? 'الأيقونة' : 'Icon'}</legend>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">{CATEGORY_ICONS.map(value => {
              const Icon = CARD_ICONS[value];
              return <button key={value} type="button" aria-label={iconNames[value][ar ? 0 : 1]} aria-pressed={icon === value} onClick={() => setIcon(value)}
                className={`flex h-11 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11131a] ${icon === value ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/5'}`}><Icon className="h-5 w-5" /></button>;
            })}</div>
          </fieldset>
          {!category && <div className="-mt-1 space-y-3">
            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200">{ar ? 'معاينة المساحة' : 'Space preview'}</p>
            <div dir={ar ? 'rtl' : 'ltr'} className="overflow-hidden rounded-2xl border border-white/10 bg-[#1d2b3e] text-slate-100 shadow-inner" aria-label={ar ? 'معاينة شكل المساحة' : 'Space appearance preview'}>
            <div className="relative h-24 overflow-hidden">
              <img src={previewBanners[icon]?.[lang] || defaultPreviewBanner} alt="" aria-hidden="true" loading="eager" decoding="async" className="absolute inset-0 h-full w-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-[#1d2b3e]/82" />
              <div className="relative flex h-full items-center justify-start gap-3 p-3">
                <div className="flex min-w-0 flex-1 items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-black/35"><Icon className="h-4 w-4" /></span><p className="min-w-0 flex-1 truncate text-[15px] font-bold leading-6 text-white" title={trimmedName || undefined}>{trimmedName || (ar ? 'اسم المساحة' : 'Space name')}</p></div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-[11px] text-slate-300"><span>{ar ? 'لا توجد مهام بعد' : 'No tasks yet'}</span><span className="text-slate-500">{ar ? 'تتحدث مباشرة' : 'Updates live'}</span></div>
            </div>
          </div>}
          {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
          {confirmDelete && <div role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/5 p-3 text-xs leading-6">
            <p>{ar ? 'حذف البطاقة؟ ستبقى جميع مهامها في أيامها وتظهر ضمن «غير مصنّف».' : 'Delete this card? All its tasks stay on their original days under “Unassigned”.'}</p>
            <div className="mt-2 flex gap-3"><button ref={confirmation} type="button" onClick={onDelete} className="min-h-10 font-bold text-rose-600 dark:text-rose-400">{ar ? 'تأكيد حذف البطاقة' : 'Confirm card deletion'}</button><button type="button" onClick={() => { setConfirmDelete(false); deleteButton.current?.focus(); }} className="min-h-10">{ar ? 'إلغاء' : 'Cancel'}</button></div>
          </div>}
          <div className="sticky bottom-[-1.25rem] z-10 -mx-5 -mb-5 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur dark:border-white/10 dark:bg-[#11131a]/95 sm:-mx-6 sm:-mb-6 sm:px-6">
            {category ? <button ref={deleteButton} type="button" onClick={() => setConfirmDelete(true)} className="inline-flex min-h-11 items-center gap-2 text-xs text-rose-600 dark:text-rose-400"><Trash2 className="h-4 w-4" />{ar ? 'حذف البطاقة' : 'Delete card'}</button> : <span />}
            <button type="submit" disabled={!trimmedName || isSaving} aria-busy={isSaving} className={`${category ? 'sm:flex-none' : 'w-full sm:w-auto'} min-h-11 flex-1 rounded-xl bg-emerald-400 px-5 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40`}>{isSaving && <span aria-hidden="true" className="me-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />}{category ? (ar ? 'حفظ التعديلات' : 'Save changes') : (ar ? 'إنشاء المساحة' : 'Create space')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
