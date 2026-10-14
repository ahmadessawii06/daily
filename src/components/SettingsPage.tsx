import React, { useEffect, useRef, useState } from 'react';
import {
  Archive, ArrowUpLeft, ArrowUpRight, BarChart3, Camera, Check, Cloud, Copy, Download,
  KeyRound, Languages, LayoutTemplate, Loader2, LogOut, Moon, RefreshCw, RotateCcw, ShieldCheck, Sun, UserRound, SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import type { Language, Theme, User } from '../types';
import { hasPermission } from '../shared/admin';
import { checkDbHealth, migrateLocalDataToMongo, type DbHealthStatus } from '../services/api';
import { getStoredHabits, loadAllDays, saveAllDays, saveHabits } from '../utils/storage';
import { legacyBackup } from '../utils/scopedStorage';
import { mergeDay } from '../shared/merge';
import { enqueueDay } from '../services/syncQueue';
import { saveStoredRecurringItems } from '../utils/recurring';
import { AccountPage } from './AccountPage';
import { SyncIndicator } from './SyncIndicator';

interface SettingsPageProps {
  currentUser: User;
  lang: Language;
  theme: Theme;
  archiveDaysCount: number;
  exporting: boolean;
  onBack: () => void;
  onToggleLang: () => void;
  onSetTheme: (theme: Theme) => void;
  onResetData: () => void;
  onApply24HourTemplate: () => void;
  onSyncComplete: () => void;
  onOpenStats: () => void;
  onOpenArchive: () => void;
  onOpenAdmin: () => void;
  onExport: () => void;
  onLogout: () => void;
}

const panel = 'overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-white/[.08] dark:bg-[#101219]';
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-wait disabled:opacity-50 dark:border-white/10 dark:bg-white/[.03] dark:text-zinc-300 dark:hover:bg-white/[.06]';

const sections = [
  { id: 'account', icon: UserRound, ar: 'الحساب', en: 'Account' },
  { id: 'preferences', icon: SlidersHorizontal, ar: 'المظهر', en: 'Preferences' },
  { id: 'sync', icon: Cloud, ar: 'المزامنة', en: 'Sync' },
  { id: 'tools', icon: LayoutTemplate, ar: 'أدواتك', en: 'Tools' },
  { id: 'session', icon: ShieldCheck, ar: 'الجلسة', en: 'Session' },
] as const;
type SectionId = typeof sections[number]['id'];

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return <div className="mb-5"><h2 id={id} className="text-sm font-semibold sm:text-base">{title}</h2><p className="mt-2 text-[11px] leading-6 text-slate-500 dark:text-zinc-400">{description}</p></div>;
}

function ActionRow({ icon: Icon, title, description, onClick, ar, disabled = false }: { icon: LucideIcon; title: string; description: string; onClick: () => void; ar: boolean; disabled?: boolean }) {
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  return <button type="button" onClick={onClick} disabled={disabled} className="group flex w-full items-center gap-3 px-4 py-5 text-start transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-wait disabled:opacity-50 dark:hover:bg-white/[.025] sm:gap-4 sm:px-6">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-500 transition-colors group-hover:border-emerald-500/20 group-hover:text-emerald-600 dark:border-white/[.06] dark:bg-white/[.025] dark:text-zinc-400 dark:group-hover:text-emerald-300"><Icon aria-hidden="true" size={18} strokeWidth={1.7} /></span>
    <span className="min-w-0 flex-1"><span className="block text-xs font-medium">{title}</span><span className="mt-1 block text-[11px] font-normal leading-6 text-slate-500 dark:text-zinc-400">{description}</span></span>
    <Arrow aria-hidden="true" size={16} className="shrink-0 text-slate-400 transition-colors group-hover:text-emerald-500 dark:text-zinc-600" />
  </button>;
}

function ThemePreview({ value, selected, label, onSelect }: { value: Theme; selected: boolean; label: string; onSelect: () => void }) {
  const dark = value === 'dark', Icon = dark ? Moon : Sun;
  return <button type="button" aria-pressed={selected} onClick={onSelect} className={`group min-w-0 rounded-xl border p-2 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${selected ? 'border-emerald-500 bg-emerald-500/[.04] dark:border-emerald-400/70' : 'border-slate-200 hover:border-slate-400 dark:border-white/10 dark:hover:border-white/25'}`}>
    <span aria-hidden="true" className={`flex h-24 overflow-hidden rounded-lg border sm:h-28 ${dark ? 'border-white/5 bg-[#0b0e13]' : 'border-slate-200/70 bg-[#f3f6f5]'}`}>
      <span className={`flex w-10 shrink-0 flex-col gap-2 border-e px-2.5 pt-3 ${dark ? 'border-white/5 bg-[#12171b]' : 'border-slate-200/60 bg-white'}`}><span className="h-2 w-2 rounded-full bg-emerald-500" />{[0, 1, 2].map(i => <span key={i} className={`h-1 w-4 rounded-full ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />)}</span>
      <span className="min-w-0 flex-1 p-3"><span className={`mb-3 block h-1.5 w-1/2 rounded-full ${dark ? 'bg-zinc-500' : 'bg-slate-400'}`} /><span className="mb-2 block h-1 w-3/4 rounded-full bg-emerald-500/40" /><span className="grid grid-cols-2 gap-2">{[0, 1].map(i => <span key={i} className={`h-9 rounded border ${dark ? 'border-white/[.07] bg-white/[.025]' : 'border-slate-200 bg-white'}`} />)}</span></span>
    </span>
    <span className="flex items-center gap-2 px-1 pb-1 pt-3 text-xs font-medium"><Icon aria-hidden="true" size={14} className="text-slate-500 dark:text-zinc-400" />{label}<span aria-hidden="true" className={`ms-auto flex h-4 w-4 items-center justify-center rounded-full border ${selected ? 'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-[#08140f]' : 'border-slate-300 dark:border-zinc-600'}`}>{selected && <Check size={10} strokeWidth={3} />}</span></span>
  </button>;
}

export function SettingsPage(props: SettingsPageProps) {
  const { currentUser, lang, theme, archiveDaysCount, exporting, onBack, onToggleLang, onSetTheme, onResetData, onApply24HourTemplate, onSyncComplete, onOpenStats, onOpenArchive, onOpenAdmin, onExport, onLogout } = props;
  const ar = lang === 'ar', t = (a: string, e: string) => ar ? a : e;
  const [health, setHealth] = useState<DbHealthStatus & { checking: boolean }>({ connected: false, checking: true });
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false), [copyError, setCopyError] = useState(false);
  const [legacy] = useState(legacyBackup);
  const [activeSection, setActiveSection] = useState<SectionId>('account');
  const requestedSection = useRef<SectionId | null>(null);
  const alive = useRef(true), copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    alive.current = true;
    void checkDbHealth().then(data => { if (alive.current) setHealth({ ...data, checking: false }); });
    return () => { alive.current = false; if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let current: SectionId = 'account';
        for (const section of sections) {
          const element = document.getElementById(`settings-${section.id}`);
          if (element && element.getBoundingClientRect().top <= 160) current = section.id;
        }
        if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) current = 'session';
        // A section near the page end cannot always reach the top of the viewport.
        setActiveSection(requestedSection.current || current);
      });
    };
    const followScroll = () => { requestedSection.current = null; update(); };
    const followKeyboard = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key) && !(event.target instanceof Element && event.target.closest('button, input, select, textarea'))) followScroll();
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', followScroll);
    window.addEventListener('wheel', followScroll, { passive: true });
    window.addEventListener('touchstart', followScroll, { passive: true });
    window.addEventListener('keydown', followKeyboard);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', followScroll);
      window.removeEventListener('wheel', followScroll);
      window.removeEventListener('touchstart', followScroll);
      window.removeEventListener('keydown', followKeyboard);
    };
  }, []);

  const goToSection = (id: SectionId) => {
    requestedSection.current = id;
    const element = document.getElementById(`settings-${id}`);
    element?.focus({ preventScroll: true });
    element?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    setActiveSection(id);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentUser.userCode);
      if (!alive.current) return;
      setCopied(true); setCopyError(false);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch { if (alive.current) setCopyError(true); }
  };
  const sync = async () => {
    if (syncing) return;
    setSyncing(true); setResult(null);
    try {
      const response = await migrateLocalDataToMongo(loadAllDays(), getStoredHabits());
      if (alive.current) {
        setResult({ ok: response.success, text: response.success ? t('تمت مزامنة بيانات حسابك بنجاح.', 'Your account is up to date.') : t('تعذرت المزامنة. بياناتك محفوظة محليًا ويمكنك إعادة المحاولة.', 'Sync failed. Your local changes are saved; you can retry.') });
        if (response.success) onSyncComplete();
      }
    } catch { if (alive.current) setResult({ ok: false, text: t('تعذر الاتصال بالخادم. أعد المحاولة لاحقًا.', 'Unable to reach the server. Please retry.') }); }
    finally {
      const data = await checkDbHealth();
      if (alive.current) { setHealth({ ...data, checking: false }); setSyncing(false); }
    }
  };
  const importLegacy = () => {
    if (!window.confirm(t('هل البيانات القديمة في هذا المتصفح تخص هذا الحساب؟ سيتم دمجها معه.', 'Do the old browser records belong to this account? They will be merged.'))) return;
    try {
      const days = legacy['daily_tasks_app_data_v8_saturday_schedule'] as ReturnType<typeof loadAllDays> | undefined;
      if (!days || typeof days !== 'object' || Array.isArray(days)) throw new Error(t('لا توجد أيام قديمة قابلة للاستيراد.', 'No legacy days found.'));
      const merged = loadAllDays();
      for (const [date, record] of Object.entries(days)) if (record && Array.isArray(record.tasks)) merged[date] = mergeDay(merged[date], record);
      saveAllDays(merged); for (const day of Object.values(merged)) enqueueDay(day);
      const habits = legacy['daily_habits_v8_saturday_schedule']; if (Array.isArray(habits)) saveHabits(habits);
      const recurring = legacy['daily_life_recurring_items_v2']; if (Array.isArray(recurring)) saveStoredRecurringItems(recurring);
      onSyncComplete(); setResult({ ok: true, text: t('تم الاستيراد. النسخة القديمة بقيت محفوظة.', 'Imported. The old copy is preserved.') });
    } catch (error) { setResult({ ok: false, text: (error as Error).message }); }
  };
  const backupLegacy = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(legacy, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'mizan-legacy-backup.json'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const role = { user: t('حساب شخصي', 'Personal account'), support: t('الدعم', 'Support'), admin: t('أدمن', 'Admin'), super_admin: t('مشرف أعلى', 'Super Admin') }[currentUser.role || 'user'];
  const accountName = currentUser.name || currentUser.username || t('مستخدم ميزان', 'Mizan user');

  return <AccountPage lang={lang} title={t('الإعدادات', 'Settings')} description={t('مساحة تناسبك. اضبط التفاصيل، وخلّي تركيزك على يومك.', 'Make yourself at home. Set the details, then get back to your day.')} onBack={onBack}>
    <div className="grid items-start gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
      <aside className="sticky top-0 z-20 -mx-3 border-b border-slate-200/80 bg-slate-50 px-3 py-3 dark:border-white/[.07] dark:bg-[#07080b] sm:mx-0 sm:rounded-xl lg:top-8 lg:border-0 lg:p-0">
        <p className="mb-5 hidden px-3 text-[10px] font-medium text-slate-400 dark:text-zinc-500 lg:block">{t('إعدادات مساحتك', 'YOUR WORKSPACE')}</p>
        <nav aria-label={t('أقسام الإعدادات', 'Settings sections')} className="grid grid-cols-5 gap-1 lg:grid-cols-1 lg:gap-2">
          {sections.map(({ id, icon: Icon, ar: arabic, en }) => <button key={id} type="button" aria-controls={`settings-${id}`} aria-current={activeSection === id ? 'location' : undefined} onClick={() => goToSection(id)} className={`flex min-h-12 flex-col items-center justify-center gap-2 rounded-xl px-1 py-2.5 text-[9px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500 sm:text-[11px] lg:flex-row lg:justify-start lg:gap-3 lg:px-3 ${activeSection === id ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-white/[.04] dark:hover:text-zinc-200'}`}><Icon aria-hidden="true" size={17} strokeWidth={1.7} />{ar ? arabic : en}<span aria-hidden="true" className={`ms-auto hidden h-1.5 w-1.5 rounded-full bg-emerald-500 lg:block ${activeSection === id ? 'opacity-100' : 'opacity-0'}`} /></button>)}
        </nav>
        <div className="mx-3 mt-8 hidden border-t border-slate-200 pt-5 dark:border-white/[.07] lg:block"><p className="text-[11px] font-medium text-slate-600 dark:text-zinc-300">{t('على طريقتك، كل يوم.', 'Your day. Your way.')}</p><p className="mt-2 text-[10px] leading-6 text-slate-400 dark:text-zinc-500">{t('تُحفظ تفضيلات المظهر واللغة تلقائيًا.', 'Appearance and language preferences are saved automatically.')}</p></div>
      </aside>

      <div className="min-w-0 space-y-10 sm:space-y-12">
        <section id="settings-account" aria-labelledby="settings-account-heading" tabIndex={-1} className={`${panel} scroll-mt-28 outline-none lg:scroll-mt-8`}>
          <div className="relative overflow-hidden px-5 pb-6 pt-7 sm:px-7 sm:pb-7 sm:pt-8">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.09),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.1),transparent_70%)]" />
            <div className="relative flex items-start gap-4 sm:gap-5">
              <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-xl font-medium text-emerald-700 dark:text-emerald-300 sm:h-16 sm:w-16 sm:text-2xl">{accountName.trim().charAt(0).toUpperCase()}</span>
              <div className="min-w-0 flex-1"><p className="mb-2 text-[10px] text-slate-500 dark:text-zinc-400">{t('حسابك في ميزان', 'YOUR MIZAN ACCOUNT')}</p><h2 id="settings-account-heading" className="break-words text-xl font-semibold tracking-tight sm:text-2xl"><bdi>{accountName}</bdi></h2><div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-slate-500 dark:text-zinc-400">{currentUser.username && <bdi>@{currentUser.username}</bdi>}<span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/15 bg-emerald-500/[.06] px-2 py-1 text-[10px] text-emerald-700 dark:text-emerald-300"><span aria-hidden="true" className="h-1 w-1 rounded-full bg-emerald-500" />{role}</span></div>{currentUser.email && <p className="mt-3 break-all text-[11px] text-slate-500 dark:text-zinc-400"><bdi>{currentUser.email}</bdi></p>}</div>
            </div>
          </div>
          <div className="border-t border-slate-200/70 bg-slate-50/70 px-4 py-4 dark:border-white/[.06] dark:bg-white/[.015] sm:flex sm:items-center sm:justify-between sm:gap-5 sm:px-7">
            <div className="mb-3 flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 sm:mb-0"><KeyRound aria-hidden="true" size={14} />{t('كود الحساب', 'Account code')}</div>
            <div className="min-w-0 sm:w-72"><div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200/80 bg-white ps-3 dark:border-white/[.07] dark:bg-[#0c0f14]"><code dir="ltr" className="min-w-0 flex-1 select-all break-all text-[10px] tracking-wide text-slate-600 dark:text-zinc-300 sm:text-[11px]">{currentUser.userCode}</code><button type="button" onClick={() => { void copyCode(); }} aria-label={t('نسخ كود الحساب', 'Copy account code')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-500/10 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-emerald-300">{copied ? <Check aria-hidden="true" size={15} /> : <Copy aria-hidden="true" size={15} />}</button></div><p aria-live="polite" className="text-[10px] leading-5 text-slate-500 dark:text-zinc-400">{copied ? t('تم نسخ الكود.', 'Code copied.') : copyError ? t('يمكنك تحديد الكود ونسخه يدويًا.', 'You can select and copy the code manually.') : ''}</p></div>
          </div>
        </section>

        <section id="settings-preferences" aria-labelledby="settings-preferences-heading" tabIndex={-1} className="scroll-mt-28 outline-none lg:scroll-mt-8">
          <SectionHeading id="settings-preferences-heading" title={t('تجربة تشبهك', 'A space that feels like you')} description={t('ألوان أريح، ولغتك المفضلة. التفاصيل الصغيرة بتفرق.', 'A comfortable look and your preferred language. Small details, better days.')} />
          <div className={panel}>
            <div className="grid gap-5 p-5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-7 sm:p-6">
              <div><h3 className="text-xs font-medium">{t('المظهر', 'Appearance')}</h3><p className="mt-2 text-[11px] leading-6 text-slate-500 dark:text-zinc-400">{t('اختَر الإضاءة الأنسب ليومك.', 'Choose the light that suits your day.')}</p></div>
              <div className="grid min-w-0 grid-cols-2 gap-3"><ThemePreview value="dark" selected={theme === 'dark'} label={t('داكن', 'Dark')} onSelect={() => onSetTheme('dark')} /><ThemePreview value="light" selected={theme === 'light'} label={t('فاتح', 'Light')} onSelect={() => onSetTheme('light')} /></div>
            </div>
            <div className="grid items-center gap-4 border-t border-slate-200/80 p-5 dark:border-white/[.07] sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-7 sm:p-6">
              <div><h3 className="flex items-center gap-2 text-xs font-medium"><Languages aria-hidden="true" size={14} className="text-slate-400 dark:text-zinc-500" />{t('لغة الواجهة', 'Language')}</h3><p className="mt-2 text-[11px] leading-6 text-slate-500 dark:text-zinc-400">{t('كل شيء بالاتجاه الصحيح.', 'Feel at home in either direction.')}</p></div>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100/80 p-1 dark:bg-black/20">{(['ar', 'en'] as const).map(value => <button type="button" key={value} lang={value} aria-pressed={lang === value} onClick={() => { if (lang !== value) onToggleLang(); }} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500 ${lang === value ? 'border-slate-200/80 bg-white text-slate-900 shadow-sm dark:border-white/10 dark:bg-[#1c2028] dark:text-zinc-100' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>{value === 'ar' ? 'العربية' : 'English'}{lang === value && <Check aria-hidden="true" size={13} className="text-emerald-600 dark:text-emerald-400" />}</button>)}</div>
            </div>
          </div>
        </section>

        <section id="settings-sync" aria-labelledby="settings-sync-heading" tabIndex={-1} className="scroll-mt-28 outline-none lg:scroll-mt-8">
          <SectionHeading id="settings-sync-heading" title={t('يومك، على كل أجهزتك', 'One day. Every device.')} description={t('تابع حالة الاتصال، وزامن آخر تعديلات حسابك.', 'Check your connection and sync the latest changes to your account.')} />
          <div className={`${panel} p-5 sm:p-6`}>
            <div className="grid grid-cols-[48px_minmax(0,1fr)] items-start gap-4 sm:flex">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/15 bg-emerald-500/[.06] text-emerald-600 dark:text-emerald-400"><Cloud aria-hidden="true" size={23} strokeWidth={1.5} /></span>
              <div className="min-w-0 flex-1"><h3 className="text-xs font-medium">{t('المزامنة', 'Sync')}</h3><p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400"><span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${health.checking ? 'bg-slate-400' : health.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />{health.checking ? t('جارٍ التحقق…', 'Checking…') : health.connected ? t('متصل', 'Connected') : t('غير متصل', 'Unavailable')}{health.database && <span className="w-full break-words text-[10px] text-slate-400 dark:text-zinc-500 sm:w-auto">{health.database}</span>}</p></div>
              <button type="button" onClick={() => { void sync(); }} disabled={syncing} className={`${button} col-span-2 w-full shrink-0 sm:w-auto`}>{syncing ? <Loader2 aria-hidden="true" size={14} className="animate-spin" /> : <RefreshCw aria-hidden="true" size={14} />}{syncing ? t('جارٍ المزامنة…', 'Syncing…') : t('مزامنة الآن', 'Sync now')}</button>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4 dark:border-white/[.07]"><p className="text-[11px] leading-6 text-slate-500 dark:text-zinc-400">{t('تعديلاتك المحلية تبقى محفوظة عند انقطاع الاتصال.', 'Your local changes stay saved when you are offline.')}</p><SyncIndicator lang={lang} userId={currentUser.id} interactive={false} /></div>
            {!health.connected && !health.checking && <p className="mt-3 text-[11px] leading-6 text-amber-700 dark:text-amber-300">{t('ستُستأنف المزامنة عند عودة الاتصال.', 'Sync will resume when the connection is restored.')}</p>}
          </div>
          {result && <p role={result.ok ? 'status' : 'alert'} className={`mt-3 rounded-xl border px-4 py-3 text-xs leading-6 ${result.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>{result.text}</p>}
        </section>

        <section id="settings-tools" aria-labelledby="settings-tools-heading" tabIndex={-1} className="scroll-mt-28 outline-none lg:scroll-mt-8">
          <SectionHeading id="settings-tools-heading" title={t('مساحة أكبر ليومك', 'Get more from your day')} description={t('كل أدواتك، بدون ما تزدحم لوحة يومك.', 'Your everyday tools, with room to focus in your planner.')} />
          <div className={`${panel} divide-y divide-slate-200/80 dark:divide-white/[.07]`}>
            <ActionRow icon={BarChart3} title={t('الإحصائيات والتقرير الأسبوعي', 'Weekly statistics')} description={t('راجع إنجازك وعاداتك خلال الأسبوع.', 'See your progress and habits for the week.')} onClick={onOpenStats} ar={ar} />
            <ActionRow icon={Archive} title={t('الأرشيف وسجل الأيام', 'Archive & history')} description={t(`${archiveDaysCount} يومًا محفوظًا — ارجع لأي يوم بسهولة.`, `${archiveDaysCount} saved days — pick up where you left off.`)} onClick={onOpenArchive} ar={ar} />
            <ActionRow icon={Camera} title={exporting ? t('جارٍ تجهيز الصورة…', 'Preparing your image…') : t('تصدير صورة اليوم', 'Export today as an image')} description={t('احفظ لوحة اليوم كصورة للمشاركة أو المراجعة.', 'Save your daily planner to share or look back on.')} onClick={onExport} ar={ar} disabled={exporting} />
            {hasPermission(currentUser.role, 'users.read') && <ActionRow icon={ShieldCheck} title={t('إدارة المستخدمين', 'User management')} description={t('إدارة الحسابات والصلاحيات وسجل التدقيق.', 'Manage accounts, permissions and audit history.')} onClick={onOpenAdmin} ar={ar} />}
          </div>
          <div className="mt-4 flex flex-col gap-4 rounded-xl border border-dashed border-slate-300/80 p-5 dark:border-white/15 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><LayoutTemplate aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-slate-400 dark:text-zinc-500" /><div><h3 className="text-xs font-medium">{t('قالب الـ 24 ساعة', '24-hour template')}</h3><p className="mt-2 text-[11px] leading-6 text-slate-500 dark:text-zinc-400">{t('جهّز جدول اليوم من 00:00 إلى 23:00.', 'Set up today’s timeline from 00:00 to 23:00.')}</p></div></div><button type="button" className={`${button} shrink-0`} onClick={() => { onApply24HourTemplate(); onBack(); }}>{t('تطبيق على اليوم المحدد', 'Apply to the selected day')}</button></div>
          {Object.keys(legacy).length > 0 && <div className={`${panel} mt-4 p-5 sm:p-6`}><h3 className="text-xs font-medium">{t('بيانات النسخة القديمة', 'Legacy browser data')}</h3><p className="mt-2 text-[11px] leading-6 text-slate-500 dark:text-zinc-400">{t('نزّل نسخة احتياطية أو ادمجها مع هذا الحساب.', 'Download a backup or merge it into this account.')}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" className={button} onClick={backupLegacy}><Download aria-hidden="true" size={14} />{t('تنزيل نسخة', 'Download backup')}</button><button type="button" className={button} onClick={importLegacy}>{t('استيراد لهذا الحساب', 'Import into this account')}</button></div></div>}
        </section>

        <section id="settings-session" aria-labelledby="settings-session-heading" tabIndex={-1} className="scroll-mt-28 pb-6 outline-none lg:scroll-mt-8">
          <SectionHeading id="settings-session-heading" title={t('حسابك وبياناتك', 'Account & data')} description={t('إدارة الجلسة وإعادة الضبط، بخطوات واضحة.', 'Manage your session and data with clear, deliberate actions.')} />
          <div className={panel}>
            <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"><div><h3 className="text-xs font-medium">{t('جلسة الحساب', 'Account session')}</h3><p className="mt-2 text-[11px] leading-6 text-slate-500 dark:text-zinc-400">{t('سجّل الخروج من حسابك على هذا الجهاز.', 'Sign out of your account on this device.')}</p></div><button type="button" className={`${button} shrink-0`} onClick={onLogout}><LogOut aria-hidden="true" size={14} />{t('تسجيل الخروج', 'Sign out')}</button></div>
            <div className="flex flex-col justify-between gap-4 border-t border-slate-200/80 bg-rose-50/40 p-5 dark:border-white/[.07] dark:bg-rose-500/[.025] sm:flex-row sm:items-center sm:p-6"><div><h3 className="text-xs font-medium text-rose-700 dark:text-rose-300">{t('مسح المهام وإعادة ضبط العادات', 'Reset tasks & habits')}</h3><p className="mt-2 max-w-sm text-[11px] leading-6 text-slate-500 dark:text-zinc-400">{t('يمسح مهام هذا الحساب ويعيد ضبط عاداته. سيُطلب منك التأكيد.', 'Clears this account’s tasks and resets its habits. You will be asked to confirm.')}</p></div><button type="button" disabled={syncing} className={`${button} shrink-0 !border-rose-500/20 !text-rose-600 dark:!text-rose-400`} onClick={() => { if (window.confirm(t('هل تريد مسح مهام هذا الحساب وإعادة ضبط العادات؟', 'Clear this account’s tasks and reset habits?'))) { onResetData(); onBack(); } }}><RotateCcw aria-hidden="true" size={14} />{t('إعادة الضبط', 'Reset data')}</button></div>
          </div>
        </section>
      </div>
    </div>
  </AccountPage>;
}
