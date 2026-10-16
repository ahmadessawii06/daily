import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpLeft, ArrowUpRight, Check, Cloud, Copy, Download,
  KeyRound, LayoutTemplate, Loader2, RefreshCw, RotateCcw, ShieldCheck, UserRound,
  Search, Grid2X2, type LucideIcon,
} from 'lucide-react';
import type { Language, Theme, User } from '../types';
import { hasPermission } from '../shared/admin';
import { checkDbHealth, type DbHealthStatus } from '../services/api';
import { getSyncError, triggerSync } from '../services/syncEngine';
import { loadAllDays, saveAllDays, saveHabits } from '../utils/storage';
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
  { id: 'overview', icon: Grid2X2, ar: 'نظرة عامة', en: 'Overview' },
  { id: 'account', icon: UserRound, ar: 'الحساب', en: 'Account' },
  { id: 'sync', icon: Cloud, ar: 'المزامنة', en: 'Sync' },
  { id: 'tools', icon: LayoutTemplate, ar: 'أدواتك', en: 'Tools' },
  { id: 'session', icon: ShieldCheck, ar: 'الجلسة', en: 'Session' },
] as const;
type SectionId = typeof sections[number]['id'];

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return <div className="mb-5"><h2 id={id} className="text-lg font-bold sm:text-xl">{title}</h2><p className="mt-2 text-xs leading-6 text-slate-500 dark:text-zinc-400">{description}</p></div>;
}

function ActionRow({ icon: Icon, title, description, onClick, ar, disabled = false }: { icon: LucideIcon; title: string; description: string; onClick: () => void; ar: boolean; disabled?: boolean }) {
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  return <button type="button" onClick={onClick} disabled={disabled} className="group flex w-full items-center gap-3 px-4 py-4 text-start transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-wait disabled:opacity-50 dark:hover:bg-white/[.025] sm:gap-4 sm:px-5">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-500 transition-colors group-hover:border-emerald-500/20 group-hover:text-emerald-600 dark:border-white/[.06] dark:bg-white/[.025] dark:text-zinc-400 dark:group-hover:text-emerald-300"><Icon aria-hidden="true" size={18} strokeWidth={1.7} /></span>
    <span className="min-w-0 flex-1"><span className="block text-xs font-medium">{title}</span><span className="mt-1 block text-[11px] font-normal leading-6 text-slate-500 dark:text-zinc-400">{description}</span></span>
    <Arrow aria-hidden="true" size={16} className="shrink-0 text-slate-400 transition-colors group-hover:text-emerald-500 dark:text-zinc-600" />
  </button>;
}

export function SettingsPage(props: SettingsPageProps) {
  const { currentUser, lang, onBack, onResetData, onSyncComplete, onOpenAdmin } = props;
  const ar = lang === 'ar', t = (a: string, e: string) => ar ? a : e;
  const [health, setHealth] = useState<DbHealthStatus & { checking: boolean }>({ connected: false, checking: true });
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; source: 'sync' | 'tools' } | null>(null);
  const [copied, setCopied] = useState(false), [copyError, setCopyError] = useState(false);
  const [legacy] = useState(legacyBackup);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [query, setQuery] = useState('');
  const tabRefs = useRef<Partial<Record<SectionId, HTMLButtonElement | null>>>({});
  const alive = useRef(true), copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    alive.current = true;
    void checkDbHealth().then(data => { if (alive.current) setHealth({ ...data, checking: false }); });
    return () => { alive.current = false; if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, []);

  const goToSection = (id: SectionId) => {
    setQuery('');
    setActiveSection(id);
  };
  const handleTabKey = (event: React.KeyboardEvent<HTMLButtonElement>, id: SectionId) => {
    const index = sections.findIndex(section => section.id === id);
    const nextKey = ar ? 'ArrowLeft' : 'ArrowRight';
    const previousKey = ar ? 'ArrowRight' : 'ArrowLeft';
    let next = index;
    if (event.key === nextKey) next = (index + 1) % sections.length;
    else if (event.key === previousKey) next = (index - 1 + sections.length) % sections.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = sections.length - 1;
    else return;
    event.preventDefault();
    goToSection(sections[next].id);
    tabRefs.current[sections[next].id]?.focus({ preventScroll: true });
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
      const success = await triggerSync(currentUser.id, true);
      const response = { success, error: success ? undefined : getSyncError() };
      if (alive.current) {
        setResult({ source: 'sync', ok: response.success, text: response.success ? t('تمت مزامنة بيانات حسابك بنجاح.', 'Your account is up to date.') : [t('تعذرت المزامنة. بياناتك محفوظة محليًا ويمكنك إعادة المحاولة.', 'Sync failed. Your local changes are saved; you can retry.'), response.error].filter(Boolean).join(' ') });
        if (response.success) onSyncComplete();
      }
    } catch { if (alive.current) setResult({ source: 'sync', ok: false, text: t('تعذر الاتصال بالخادم. أعد المحاولة لاحقًا.', 'Unable to reach the server. Please retry.') }); }
    finally {
      if (alive.current) setSyncing(false);
      void checkDbHealth().then(data => { if (alive.current) setHealth({ ...data, checking: false }); });
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
      onSyncComplete(); setResult({ source: 'tools', ok: true, text: t('تم الاستيراد. النسخة القديمة بقيت محفوظة.', 'Imported. The old copy is preserved.') });
    } catch (error) { setResult({ source: 'tools', ok: false, text: (error as Error).message }); }
  };
  const backupLegacy = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(legacy, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'mizan-legacy-backup.json'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const role = { user: t('حساب شخصي', 'Personal account'), support: t('الدعم', 'Support'), admin: t('أدمن', 'Admin'), super_admin: t('مشرف أعلى', 'Super Admin') }[currentUser.role || 'user'];
  const accountName = currentUser.name || currentUser.username || t('مستخدم ميزان', 'Mizan user');
  const shortcuts = [
    { icon: Cloud, title: t('مزامنة الآن', 'Sync now'), description: syncing ? t('جارٍ المزامنة…', 'Syncing…') : t('احفظ آخر تغييراتك', 'Sync your latest changes'), action: () => { void sync(); }, disabled: syncing, color: 'text-emerald-500 bg-emerald-500/10', keywords: 'sync cloud مزامنة اتصال' },
    { icon: UserRound, title: t('حسابي وكود الحساب', 'Account & account code'), description: accountName, action: () => goToSection('account'), color: 'text-blue-500 bg-blue-500/10', keywords: 'account code copy الحساب كود نسخ' },
    { icon: ShieldCheck, title: t('الجلسة وإعادة الضبط', 'Session & reset'), description: t('إدارة الدخول والبيانات', 'Manage your session and data'), action: () => goToSection('session'), color: 'text-rose-500 bg-rose-500/10', keywords: 'session reset logout الجلسة خروج مسح ضبط' },
    ...(Object.keys(legacy).length ? [{ icon: Download, title: t('بيانات النسخة القديمة', 'Legacy browser data'), description: t('النسخ الاحتياطي والاستيراد', 'Backup & import'), action: () => goToSection('tools'), color: 'text-teal-500 bg-teal-500/10', keywords: 'legacy backup import بيانات قديمة استيراد نسخة احتياطية' }] : []),
    ...(hasPermission(currentUser.role, 'users.read') ? [{ icon: ShieldCheck, title: t('إدارة المستخدمين', 'User management'), description: t('الحسابات والصلاحيات', 'Accounts & permissions'), action: onOpenAdmin, color: 'text-indigo-500 bg-indigo-500/10', keywords: 'admin users إدارة مستخدمين صلاحيات' }] : []),
  ];
  const normalizeSearch = (value: string) => value.toLocaleLowerCase().normalize('NFKD').replace(/[\u064b-\u065f\u0670]/g, '').replace(/[أإآ]/g, 'ا').trim();
  const matchingShortcuts = shortcuts.filter(item => normalizeSearch(`${item.title} ${item.description} ${item.keywords}`).includes(normalizeSearch(query)));

  return <AccountPage lang={lang} compact title={t('الإعدادات', 'Settings')} description={t('كل شيء تحتاجه، أقرب إليك.', 'Everything you need, within reach.')} onBack={onBack}>
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 dark:from-[#102a26] dark:via-[#101c21] dark:to-[#121a2a] sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -end-16 -top-24 h-64 w-64 rounded-full border-[35px] border-emerald-500/[.06]" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-xl font-bold text-white shadow-lg shadow-emerald-500/20">{accountName.trim().charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="text-xs text-emerald-700 dark:text-emerald-300">{t('مساحتك الشخصية', 'YOUR PERSONAL SPACE')}</p><h2 className="mt-1 break-words text-xl font-bold sm:text-2xl"><bdi>{accountName}</bdi></h2><p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{role}</p></div></div>
          <div className="flex flex-wrap items-center gap-2"><SyncIndicator lang={lang} userId={currentUser.id} interactive={false} /><button type="button" className={`${button} !bg-white/70 dark:!bg-white/5`} onClick={() => goToSection('account')}><UserRound size={15} />{t('تفاصيل الحساب', 'Account details')}</button></div>
        </div>
        <label className="relative mt-6 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 dark:border-white/10 dark:bg-black/20">
          <Search aria-hidden="true" size={19} className="shrink-0 text-slate-400" /><input type="search" value={query} onChange={event => { setQuery(event.target.value); setActiveSection('overview'); }} aria-label={t('ابحث في الإعدادات', 'Search settings')} placeholder={t('شو بدك تعمل؟ ابحث عن إعداد أو أداة…', 'What do you need? Find a setting or tool…')} className="min-h-13 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
        </label>
      </div>
      <div role="tablist" aria-label={t('أقسام الإعدادات', 'Settings sections')} aria-orientation="horizontal" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 dark:border-white/[.08] dark:bg-[#101219]">
        {sections.map(({ id, icon: Icon, ar: arabic, en }) => <button key={id} ref={element => { tabRefs.current[id] = element; }} id={`settings-tab-${id}`} type="button" role="tab" aria-controls={`settings-${id}`} aria-selected={activeSection === id} tabIndex={activeSection === id ? 0 : -1} onClick={() => { setQuery(''); goToSection(id); }} onKeyDown={event => handleTabKey(event, id)} className={`flex min-h-11 shrink-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500 ${activeSection === id ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5'}`}><Icon aria-hidden="true" size={16} />{ar ? arabic : en}</button>)}
      </div>
      <div className="min-w-0">
        <section id="settings-overview" role="tabpanel" aria-labelledby="settings-tab-overview" hidden={activeSection !== 'overview'} tabIndex={0} className="space-y-5 outline-none">
          <div><h2 className="text-lg font-bold">{query ? t('نتائج البحث', 'Search results') : t('اختصاراتك، بدون لف ودوران', 'A shortcut to everything')}</h2><p className="mt-1 text-xs leading-6 text-slate-500 dark:text-zinc-400">{query ? t('اختر النتيجة للوصول مباشرة.', 'Choose a result to jump straight in.') : t('الأشياء اللي بتحتاجها كل يوم، بضغطة واحدة.', 'Your everyday actions, one click away.')}</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{matchingShortcuts.map(({ icon: Icon, title, description, action, color, disabled }) => <button key={title} type="button" onClick={action} disabled={disabled} className="group flex min-h-36 flex-col items-start rounded-2xl border border-slate-200/80 bg-white p-5 text-start transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-wait disabled:opacity-50 dark:border-white/[.08] dark:bg-[#101219] dark:hover:border-emerald-400/40 dark:hover:bg-[#13221f]"><span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon aria-hidden="true" size={21} /></span><span className="text-sm font-semibold">{title}</span><span className="mt-1 text-xs leading-6 text-slate-500 dark:text-zinc-400">{description}</span></button>)}</div>
          {matchingShortcuts.length === 0 && <p role="status" className={`${panel} p-8 text-center text-sm text-slate-500`}>{t('ما لقينا نتيجة. جرّب اسم الأداة أو الإعداد.', 'No results. Try a tool or setting name.')}</p>}
          {result?.source === 'sync' && <p role={result.ok ? 'status' : 'alert'} className={`rounded-xl border p-4 text-sm leading-7 ${result.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>{result.text}</p>}
        </section>
        <section id="settings-account" role="tabpanel" aria-labelledby="settings-tab-account" hidden={activeSection !== 'account'} tabIndex={0} className={`${panel} outline-none`}>
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

        <section id="settings-sync" role="tabpanel" aria-labelledby="settings-tab-sync" hidden={activeSection !== 'sync'} tabIndex={0} className="outline-none">
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
          {result?.source === 'sync' && <p role={result.ok ? 'status' : 'alert'} className={`mt-3 rounded-xl border px-4 py-3 text-xs leading-6 ${result.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>{result.text}</p>}
        </section>

        <section id="settings-tools" role="tabpanel" aria-labelledby="settings-tab-tools" hidden={activeSection !== 'tools'} tabIndex={0} className="outline-none">
          <SectionHeading id="settings-tools-heading" title={t('مساحة أكبر ليومك', 'Get more from your day')} description={t('كل أدواتك، بدون ما تزدحم لوحة يومك.', 'Your everyday tools, with room to focus in your planner.')} />
          <div className={`${panel} grid divide-y divide-slate-200/80 dark:divide-white/[.07] md:grid-cols-2 md:divide-y-0 md:[&>button]:border-b md:[&>button]:border-slate-200/80 md:dark:[&>button]:border-white/[.07] md:[&>button:nth-child(odd)]:border-e`}>
            {hasPermission(currentUser.role, 'users.read') && <ActionRow icon={ShieldCheck} title={t('إدارة المستخدمين', 'User management')} description={t('الحسابات والصلاحيات وسجل التدقيق.', 'Accounts, permissions and audit log.')} onClick={onOpenAdmin} ar={ar} />}
          </div>
          {Object.keys(legacy).length > 0 && <div className={`${panel} mt-4 p-5 sm:p-6`}><h3 className="text-xs font-medium">{t('بيانات النسخة القديمة', 'Legacy browser data')}</h3><p className="mt-2 text-[11px] leading-6 text-slate-500 dark:text-zinc-400">{t('نزّل نسخة احتياطية أو ادمجها مع هذا الحساب.', 'Download a backup or merge it into this account.')}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" className={button} onClick={backupLegacy}><Download aria-hidden="true" size={14} />{t('تنزيل نسخة', 'Download backup')}</button><button type="button" className={button} onClick={importLegacy}>{t('استيراد لهذا الحساب', 'Import into this account')}</button></div></div>}
          {result?.source === 'tools' && <p role={result.ok ? 'status' : 'alert'} className={`mt-3 rounded-xl border px-4 py-3 text-xs leading-6 ${result.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>{result.text}</p>}
        </section>

        <section id="settings-session" role="tabpanel" aria-labelledby="settings-tab-session" hidden={activeSection !== 'session'} tabIndex={0} className="outline-none">
          <SectionHeading id="settings-session-heading" title={t('حسابك وبياناتك', 'Account & data')} description={t('إدارة الجلسة وإعادة الضبط، بخطوات واضحة.', 'Manage your session and data with clear, deliberate actions.')} />
          <div className={panel}>
            <div className="flex flex-col justify-between gap-4 border-t border-slate-200/80 bg-rose-50/40 p-5 dark:border-white/[.07] dark:bg-rose-500/[.025] sm:flex-row sm:items-center sm:p-6"><div><h3 className="text-xs font-medium text-rose-700 dark:text-rose-300">{t('مسح المهام وإعادة ضبط العادات', 'Reset tasks & habits')}</h3><p className="mt-2 max-w-sm text-[11px] leading-6 text-slate-500 dark:text-zinc-400">{t('يمسح مهام هذا الحساب ويعيد ضبط عاداته. سيُطلب منك التأكيد.', 'Clears this account’s tasks and resets its habits. You will be asked to confirm.')}</p></div><button type="button" disabled={syncing} className={`${button} shrink-0 !border-rose-500/20 !text-rose-600 dark:!text-rose-400`} onClick={() => { if (window.confirm(t('هل تريد مسح مهام هذا الحساب وإعادة ضبط العادات؟', 'Clear this account’s tasks and reset habits?'))) { onResetData(); onBack(); } }}><RotateCcw aria-hidden="true" size={14} />{t('إعادة الضبط', 'Reset data')}</button></div>
          </div>
        </section>
      </div>
    </div>
  </AccountPage>;
}
