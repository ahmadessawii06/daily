import React, { useEffect, useRef, useState } from 'react';
import {
  Archive, ArrowUpLeft, ArrowUpRight, BarChart3, Camera, Check, Cloud, Copy, Download,
  KeyRound, Languages, LayoutTemplate, Loader2, LogOut, Moon, RefreshCw, RotateCcw, ShieldCheck, Sun,
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

const card = 'rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-white/[.08] dark:bg-[#11141b] sm:p-6';
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-wait disabled:opacity-50 dark:border-white/10 dark:bg-white/[.03] dark:text-zinc-300 dark:hover:bg-white/[.06]';

function SettingsCard({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: React.ReactNode }) {
  return <section className={`${card} flex flex-col gap-5`}>
    <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/[.04] dark:text-zinc-400"><Icon aria-hidden="true" size={18} strokeWidth={1.7} /></span><div className="min-w-0"><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-[11px] leading-6 text-slate-500 dark:text-zinc-400">{description}</p></div></div>
    <div className="mt-auto">{children}</div>
  </section>;
}

function ActionCard({ icon: Icon, title, description, onClick, ar, disabled = false }: { icon: LucideIcon; title: string; description: string; onClick: () => void; ar: boolean; disabled?: boolean }) {
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  return <button type="button" onClick={onClick} disabled={disabled} className={`${card} group flex min-h-40 flex-col items-start text-start transition-colors hover:border-emerald-500/40 hover:bg-emerald-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-wait disabled:opacity-50 dark:hover:border-emerald-400/25 dark:hover:bg-emerald-400/[.03]`}>
    <span className="mb-5 flex w-full items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Icon aria-hidden="true" size={19} strokeWidth={1.7} /></span><Arrow aria-hidden="true" size={16} className="text-slate-400 transition-colors group-hover:text-emerald-500 dark:text-zinc-600" /></span>
    <span className="text-sm font-semibold">{title}</span><span className="mt-2 text-[11px] font-normal leading-6 text-slate-500 dark:text-zinc-400">{description}</span>
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
  const alive = useRef(true), copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    alive.current = true;
    void checkDbHealth().then(data => { if (alive.current) setHealth({ ...data, checking: false }); });
    return () => { alive.current = false; if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, []);

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

  return <AccountPage lang={lang} title={t('الإعدادات', 'Settings')} description={t('حسابك، تفضيلاتك، وأدوات يومك — كل شيء في مكان واحد.', 'Your account, preferences and daily tools, together in one place.')} onBack={onBack}>
    <section aria-labelledby="settings-account-heading" className={`${card} border-emerald-500/20 dark:border-emerald-400/15`}>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-4"><span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-lg font-semibold text-emerald-700 dark:text-emerald-300">{accountName.trim().charAt(0).toUpperCase()}</span><div className="min-w-0"><h2 id="settings-account-heading" className="break-words text-base font-semibold"><bdi>{accountName}</bdi></h2><p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{currentUser.username && <><bdi>@{currentUser.username}</bdi><span className="mx-2 text-slate-300 dark:text-zinc-700">·</span></>}{role}</p>{currentUser.email && <p className="mt-1 break-all text-[11px] text-slate-500 dark:text-zinc-400"><bdi>{currentUser.email}</bdi></p>}</div></div>
        <div className="min-w-0 sm:max-w-sm"><p className="mb-2 text-[10px] font-medium text-slate-500 dark:text-zinc-500">{t('كود الحساب', 'Account code')}</p><div className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 dark:border-white/[.06] dark:bg-white/[.02]"><KeyRound aria-hidden="true" size={15} className="shrink-0 text-slate-400 dark:text-zinc-500" /><code dir="ltr" className="min-w-0 flex-1 select-all break-all text-[10px] text-slate-600 dark:text-zinc-300 sm:text-[11px]">{currentUser.userCode}</code><button type="button" onClick={() => { void copyCode(); }} aria-label={t('نسخ كود الحساب', 'Copy account code')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-500/10 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-emerald-300">{copied ? <Check aria-hidden="true" size={15} /> : <Copy aria-hidden="true" size={15} />}</button></div><p aria-live="polite" className="mt-1 text-[10px] text-slate-500 dark:text-zinc-400">{copied ? t('تم نسخ الكود.', 'Code copied.') : copyError ? t('يمكنك تحديد الكود ونسخه يدويًا.', 'You can select and copy the code manually.') : ''}</p></div>
      </div>
    </section>

    <section aria-labelledby="settings-preferences-heading" className="space-y-4">
      <h2 id="settings-preferences-heading" className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{t('تفضيلاتك', 'Your preferences')}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SettingsCard icon={Sun} title={t('المظهر', 'Appearance')} description={t('اختر المظهر الأريح لك.', 'Choose the look that feels right.')}>
          <div className="grid grid-cols-2 gap-2">{(['dark', 'light'] as const).map(value => { const Icon = value === 'dark' ? Moon : Sun; return <button key={value} type="button" aria-pressed={theme === value} onClick={() => onSetTheme(value)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500 ${theme === value ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/[.03]'}`}><Icon aria-hidden="true" size={15} />{value === 'dark' ? t('داكن', 'Dark') : t('فاتح', 'Light')}{theme === value && <Check aria-hidden="true" size={13} />}</button>; })}</div>
        </SettingsCard>
        <SettingsCard icon={Languages} title={t('لغة الواجهة', 'Language')} description={t('تجربة عربية أو إنجليزية، كما تفضّل.', 'Arabic or English, your choice.')}>
          <div className="grid grid-cols-2 gap-2">{(['ar', 'en'] as const).map(value => <button type="button" key={value} lang={value} aria-pressed={lang === value} onClick={() => { if (lang !== value) onToggleLang(); }} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-emerald-500 ${lang === value ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/[.03]'}`}>{value === 'ar' ? 'العربية' : 'English'}{lang === value && <Check aria-hidden="true" size={13} />}</button>)}</div>
        </SettingsCard>
        <SettingsCard icon={Cloud} title={t('المزامنة', 'Sync')} description={t('احتفظ بتعديلاتك محدثة بين أجهزتك.', 'Keep your account up to date across devices.')}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="text-[11px] text-slate-500 dark:text-zinc-400"><span className={`me-2 inline-block h-1.5 w-1.5 rounded-full ${health.checking ? 'bg-slate-400' : health.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />{health.checking ? t('جارٍ التحقق…', 'Checking…') : health.connected ? t('متصل', 'Connected') : t('غير متصل', 'Unavailable')}{health.database && <span className="ms-2 text-[10px] text-slate-400 dark:text-zinc-500">{health.database}</span>}</div><button type="button" onClick={() => { void sync(); }} disabled={syncing} className={button}>{syncing ? <Loader2 aria-hidden="true" size={14} className="animate-spin" /> : <RefreshCw aria-hidden="true" size={14} />}{syncing ? t('جارٍ المزامنة…', 'Syncing…') : t('مزامنة الآن', 'Sync now')}</button></div>
          <div className="mt-3"><SyncIndicator lang={lang} userId={currentUser.id} interactive={false} /></div>
          {!health.connected && !health.checking && <p className="mt-3 text-[11px] leading-6 text-amber-700 dark:text-amber-300">{t('تعديلاتك محفوظة محليًا وستنتظر عودة الاتصال.', 'Your local changes are saved and will wait for a connection.')}</p>}
        </SettingsCard>
      </div>
      {result && <p role={result.ok ? 'status' : 'alert'} className={`rounded-xl border px-4 py-3 text-xs leading-6 ${result.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>{result.text}</p>}
    </section>

    <section aria-labelledby="settings-tools-heading" className="space-y-4">
      <h2 id="settings-tools-heading" className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{t('حسابك وأدواتك', 'Your account & tools')}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ActionCard icon={BarChart3} title={t('الإحصائيات والتقرير الأسبوعي', 'Weekly statistics')} description={t('راجع إنجازك وعاداتك خلال الأسبوع.', 'See your progress and habits for the week.')} onClick={onOpenStats} ar={ar} />
        <ActionCard icon={Archive} title={t('الأرشيف وسجل الأيام', 'Archive & history')} description={t(`${archiveDaysCount} يومًا محفوظًا — ارجع لأي يوم بسهولة.`, `${archiveDaysCount} saved days — pick up where you left off.`)} onClick={onOpenArchive} ar={ar} />
        <ActionCard icon={Camera} title={exporting ? t('جارٍ تجهيز الصورة…', 'Preparing your image…') : t('تصدير صورة اليوم', 'Export today as an image')} description={t('احفظ لوحة اليوم كصورة للمشاركة أو المراجعة.', 'Save your daily planner to share or look back on.')} onClick={onExport} ar={ar} disabled={exporting} />
        <SettingsCard icon={LayoutTemplate} title={t('قالب الـ 24 ساعة', '24-hour template')} description={t('جهّز جدول اليوم من 00:00 إلى 23:00.', 'Set up today’s timeline from 00:00 to 23:00.')}><button type="button" className={`${button} w-full`} onClick={() => { onApply24HourTemplate(); onBack(); }}>{t('تطبيق على اليوم المحدد', 'Apply to the selected day')}</button></SettingsCard>
        {hasPermission(currentUser.role, 'users.read') && <ActionCard icon={ShieldCheck} title={t('إدارة المستخدمين', 'User management')} description={t('إدارة الحسابات والصلاحيات وسجل التدقيق.', 'Manage accounts, permissions and audit history.')} onClick={onOpenAdmin} ar={ar} />}
        <SettingsCard icon={LogOut} title={t('جلسة الحساب', 'Account session')} description={t('سجّل الخروج من حسابك على هذا الجهاز.', 'Sign out of your account on this device.')}><button type="button" className={`${button} w-full text-rose-600 dark:text-rose-400`} onClick={onLogout}><LogOut aria-hidden="true" size={14} />{t('تسجيل الخروج', 'Sign out')}</button></SettingsCard>
      </div>
    </section>

    {Object.keys(legacy).length > 0 && <SettingsCard icon={Download} title={t('بيانات النسخة القديمة', 'Legacy browser data')} description={t('نزّل نسخة احتياطية أو ادمجها مع هذا الحساب.', 'Download a backup or merge it into this account.')}><div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={backupLegacy}><Download aria-hidden="true" size={14} />{t('تنزيل نسخة', 'Download backup')}</button><button type="button" className={button} onClick={importLegacy}>{t('استيراد لهذا الحساب', 'Import into this account')}</button></div></SettingsCard>}

    <section className="flex flex-col justify-between gap-4 rounded-2xl border border-rose-500/15 bg-rose-50/30 p-5 dark:bg-rose-500/[.02] sm:flex-row sm:items-center sm:p-6"><div className="flex items-start gap-3"><RotateCcw aria-hidden="true" className="mt-0.5 shrink-0 text-rose-500/70" size={18} /><div><h2 className="text-xs font-semibold">{t('مسح المهام وإعادة ضبط العادات', 'Reset tasks & habits')}</h2><p className="mt-2 text-[11px] leading-6 text-slate-500 dark:text-zinc-400">{t('يمسح مهام هذا الحساب ويعيد ضبط عاداته. سيُطلب منك التأكيد.', 'Clears this account’s tasks and resets its habits. You will be asked to confirm.')}</p></div></div><button type="button" disabled={syncing} className={`${button} shrink-0 !border-rose-500/20 !text-rose-600 dark:!text-rose-400`} onClick={() => { if (window.confirm(t('هل تريد مسح مهام هذا الحساب وإعادة ضبط العادات؟', 'Clear this account’s tasks and reset habits?'))) { onResetData(); onBack(); } }}>{t('إعادة الضبط', 'Reset data')}</button></section>
  </AccountPage>;
}
