import { useEffect, useId, useRef, useState } from 'react';
import { BookOpen, Briefcase, Heart, Leaf, MoonStar, Layers3, X, Trash2 } from 'lucide-react';
import type { CategoryIcon, Language, PlannerCategory } from '../types';
import { CATEGORY_ICONS } from '../shared/workspace';

export const CARD_ICONS = { book: BookOpen, briefcase: Briefcase, heart: Heart, leaf: Leaf, moon: MoonStar, layers: Layers3 };
const iconNames = { book: ['كتاب', 'Book'], briefcase: ['عمل', 'Work'], heart: ['صحة', 'Health'], leaf: ['حياة', 'Life'], moon: ['عبادة', 'Worship'], layers: ['مساحة', 'Space'] };

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={headingId}
        onKeyDown={e => {
          if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
          if (e.key !== 'Tab') return;
          const elements = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select') || [])];
          const first = elements[0], last = elements[elements.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
          if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }}
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#11131a] dark:text-zinc-100 sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 id={headingId} className="text-lg font-bold">{category ? (ar ? 'تخصيص البطاقة' : 'Customize card') : (ar ? 'مساحة جديدة ليومك' : 'A new space for your day')}</h2>
          <button type="button" aria-label={ar ? 'إغلاق' : 'Close'} onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); try { onSave(name.trim(), icon); } catch { setError(ar ? 'تعذر حفظ البطاقة. تحقق من الاسم وعدد التصنيفات.' : 'Could not save this card. Check its name and your category limit.'); } }} className="space-y-5">
          <label className="block space-y-2 text-xs font-semibold">
            <span>{ar ? 'اسم البطاقة' : 'Card name'}</span>
            <input ref={input} required maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder={ar ? 'مثلاً: مشروعي الشخصي' : 'For example: My personal project'} className={field} />
          </label>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold">{ar ? 'الأيقونة' : 'Icon'}</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{CATEGORY_ICONS.map(value => {
              const Icon = CARD_ICONS[value];
              return <button key={value} type="button" aria-label={iconNames[value][ar ? 0 : 1]} aria-pressed={icon === value} onClick={() => setIcon(value)}
                className={`flex h-11 items-center justify-center rounded-xl border transition-colors ${icon === value ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/5'}`}><Icon className="h-5 w-5" /></button>;
            })}</div>
          </fieldset>
          {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
          {confirmDelete && <div role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/5 p-3 text-xs leading-6">
            <p>{ar ? 'حذف البطاقة؟ ستبقى جميع مهامها في أيامها وتظهر ضمن «غير مصنّف».' : 'Delete this card? All its tasks stay on their original days under “Unassigned”.'}</p>
            <div className="mt-2 flex gap-3"><button ref={confirmation} type="button" onClick={onDelete} className="min-h-10 font-bold text-rose-600 dark:text-rose-400">{ar ? 'تأكيد حذف البطاقة' : 'Confirm card deletion'}</button><button type="button" onClick={() => { setConfirmDelete(false); deleteButton.current?.focus(); }} className="min-h-10">{ar ? 'إلغاء' : 'Cancel'}</button></div>
          </div>}
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
            {category ? <button ref={deleteButton} type="button" onClick={() => setConfirmDelete(true)} className="inline-flex min-h-11 items-center gap-2 text-xs text-rose-600 dark:text-rose-400"><Trash2 className="h-4 w-4" />{ar ? 'حذف البطاقة' : 'Delete card'}</button> : <span />}
            <button type="submit" disabled={!name.trim()} className="min-h-11 rounded-xl bg-emerald-400 px-5 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-300 disabled:opacity-40">{ar ? 'حفظ البطاقة' : 'Save card'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
