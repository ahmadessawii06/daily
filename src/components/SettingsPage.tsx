import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpLeft, ArrowUpRight, Check, Cloud, Copy, Download,
  KeyRound, LayoutTemplate, Loader2, RefreshCw, RotateCcw, ShieldCheck, UserRound,
  Search, Grid2X2, Sparkles, X, Shield, ChevronLeft, ChevronRight, type LucideIcon,
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
  onReplayTour?: () => void;
}

const cardSurface = 'overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#141D29]';
const btnSecondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 transition-all duration-200 hover:border-[#00C896]/60 hover:bg-[#00C896]/10 hover:text-[#008f6b] dark:hover:text-[#00C896] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C896] disabled:cursor-wait disabled:opacity-50 dark:border-white/[0.08] dark:bg-[#1C2938] dark:text-[#C3CEDD] dark:hover:border-[#00C896]/50 dark:hover:bg-[#00C896]/15 dark:hover:text-white cursor-pointer';

const sections = [
  { id: 'overview', icon: Grid2X2, ar: 'نظرة عامة', en: 'Overview' },
  { id: 'account', icon: UserRound, ar: 'الحساب', en: 'Account' },
  { id: 'sync', icon: Cloud, ar: 'المزامنة', en: 'Sync' },
  { id: 'tools', icon: LayoutTemplate, ar: 'أدواتك', en: 'Tools' },
  { id: 'session', icon: ShieldCheck, ar: 'الجلسة', en: 'Session' },
] as const;
type SectionId = typeof sections[number]['id'];

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="mb-3.5 space-y-1">
      <h2 id={id} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif]">
        {title}
      </h2>
      <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {description}
      </p>
    </div>
  );
}

function ActionRow({
  icon: Icon,
  title,
  description,
  onClick,
  ar,
  disabled = false,
  highlight = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  ar: boolean;
  disabled?: boolean;
  highlight?: boolean;
}) {
  const Arrow = ar ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative flex w-full items-center gap-3.5 px-4 py-3.5 text-start transition-all duration-200 hover:bg-slate-50/90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#00C896] disabled:cursor-wait disabled:opacity-50 dark:hover:bg-[#1C2938]/60 sm:gap-4 sm:px-5 sm:py-4 cursor-pointer"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${
          highlight
            ? 'border-[#00C896]/40 bg-[#00C896]/10 text-[#008f6b] dark:text-[#00C896] group-hover:scale-105 group-hover:bg-[#00C896]/20'
            : 'border-slate-200/90 bg-slate-50 text-slate-700 group-hover:border-[#00C896]/40 group-hover:bg-[#00C896]/10 group-hover:text-[#008f6b] dark:group-hover:text-[#00C896] dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-[#C3CEDD]'
        }`}
      >
        <Icon aria-hidden="true" size={20} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#008f6b] dark:group-hover:text-[#00C896] transition-colors duration-200">
          {title}
        </span>
        <span className="mt-0.5 block text-xs font-normal leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </span>
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 group-hover:bg-slate-100 group-hover:text-[#008f6b] dark:group-hover:text-[#00C896] rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1 dark:text-slate-400 dark:group-hover:bg-white/[0.06]">
        <Arrow aria-hidden="true" size={18} strokeWidth={2.2} />
      </span>
    </button>
  );
}

export function SettingsPage(props: SettingsPageProps) {
  const { currentUser, lang, onBack, onResetData, onSyncComplete, onOpenAdmin, onReplayTour } = props;
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
        setResult({
          source: 'sync',
          ok: response.success,
          text: response.success
            ? t('تمت مزامنة بيانات حسابك بنجاح.', 'Your account is up to date.')
            : [t('تعذرت المزامنة. بياناتك محفوظة محليًا ويمكنك إعادة المحاولة.', 'Sync failed. Your local changes are saved; you can retry.'), response.error].filter(Boolean).join(' '),
        });
        if (response.success) onSyncComplete();
      }
    } catch {
      if (alive.current) setResult({ source: 'sync', ok: false, text: t('تعذر الاتصال بالخادم. أعد المحاولة لاحقًا.', 'Unable to reach the server. Please retry.') });
    } finally {
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

  const role = {
    user: t('حساب شخصي', 'Personal account'),
    support: t('الدعم', 'Support'),
    admin: t('أدمن', 'Admin'),
    super_admin: t('مشرف أعلى', 'Super Admin'),
  }[currentUser.role || 'user'];

  const accountName = currentUser.name || currentUser.username || t('مستخدم ميزان', 'Mizan user');

  const shortcuts = [
    {
      icon: Cloud,
      title: t('المزامنة والاتصال', 'Sync & connection'),
      description: syncing ? t('جارٍ مزامنة البيانات…', 'Syncing…') : t('متابعة حالة الاتصال ومزامنة التعديلات مع الخادم', 'Connection status and your latest changes'),
      action: () => goToSection('sync'),
      disabled: syncing,
      keywords: 'sync cloud مزامنة اتصال سيرفر شبكة سحابي خادم',
    },
    {
      icon: UserRound,
      title: t('كود الحساب وبيانات الدخول', 'Account & account code'),
      description: t('عرض كود الحساب الفريد لتسجيل الدخول بأمان', accountName),
      action: () => goToSection('account'),
      keywords: 'account code copy الحساب كود نسخ بيانات دخول مفتاح',
    },
    {
      icon: ShieldCheck,
      title: t('إدارة الجلسة وبيانات الحساب', 'Session & reset'),
      description: t('التحكم في تسجيل الدخول أو مسح المهام وإعادة الضبط', 'Manage your session and data'),
      action: () => goToSection('session'),
      keywords: 'session reset logout الجلسة خروج مسح ضبط حذف أمان',
    },
    ...(onReplayTour ? [{
      icon: Sparkles,
      title: t('إعادة الجولة التعريفية', 'Replay onboarding tour'),
      description: t('استكشف ميزات ميزان وتعرّف على أساسيات تنظيم يومك', 'Revisit Mizan features'),
      action: () => { onBack(); onReplayTour(); },
      keywords: 'tour onboarding جولة تعريفية استكشاف تعليمات بداية تدريب إرشاد',
    }] : []),
    ...(Object.keys(legacy).length ? [{
      icon: Download,
      title: t('بيانات النسخة القديمة', 'Legacy browser data'),
      description: t('تنزيل نسخة احتياطية من البيانات السابقة أو استيرادها', 'Backup & import'),
      action: () => goToSection('tools'),
      keywords: 'legacy backup import بيانات قديمة استيراد نسخة احتياطية أرشيف',
    }] : []),
    ...(hasPermission(currentUser.role, 'users.read') ? [{
      icon: Shield,
      title: t('إدارة المستخدمين', 'User management'),
      description: t('إدارة الحسابات وتعيين الصلاحيات ومراجعة سجل التدقيق', 'Accounts & permissions'),
      action: onOpenAdmin,
      keywords: 'admin users إدارة مستخدمين صلاحيات تدقيق إشراف أدمن',
    }] : []),
  ];

  const normalizeSearch = (value: string) =>
    value.toLocaleLowerCase().normalize('NFKD').replace(/[\u064b-\u065f\u0670]/g, '').replace(/[أإآ]/g, 'ا').trim();

  const matchingShortcuts = shortcuts.filter(item =>
    (query.trim() || item.icon !== UserRound) &&
    normalizeSearch(`${item.title} ${item.description} ${item.keywords}`).includes(normalizeSearch(query))
  );

  return (
    <AccountPage
      className="settings-page"
      lang={lang}
      compact
      title={t('الإعدادات', 'Settings')}
      description={t('إدارة حسابك، وتفضيلات المزامنة، وخيارات النظام وتنظيم يومك.', 'Manage your account, sync preferences, and system options.')}
      onBack={onBack}
    >
      <div className="settings-compact flex flex-col space-y-5 sm:space-y-6">
        {/* Search Input for Settings (order-3 visually so it appears after tabs and before shortcuts) */}
        <div className="relative order-3">
          <label className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 transition-all duration-200 focus-within:border-[#00C896] focus-within:ring-2 focus-within:ring-[#00C896]/20 shadow-xs dark:border-white/[0.08] dark:bg-[#141D29] dark:hover:border-white/[0.14] dark:focus-within:border-[#00C896] dark:focus-within:bg-[#182332]">
            <Search aria-hidden="true" size={18} className="shrink-0 text-slate-500 group-focus-within:text-[#00C896] transition-colors duration-200" />
            <input
              type="search"
              value={query}
              onChange={event => { setQuery(event.target.value); setActiveSection('overview'); }}
              aria-label={t('البحث في الإعدادات', 'Search settings')}
              placeholder={t('البحث في الإعدادات والخيارات والأدوات…', 'Search settings, options, and tools…')}
              className="min-h-10 min-w-0 flex-1 bg-transparent text-xs sm:text-sm font-medium outline-none text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('مسح نص البحث', 'Clear search text')}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center rounded-md border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                {t('بحث في الإعدادات', 'Settings search')}
              </span>
            )}
          </label>
        </div>

        {/* 1. Account Hero Card (بطاقة الحساب) */}
        <div className={`${cardSurface} order-1 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5`}>
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00C896] text-lg font-black text-[#080D14] shadow-[0_4px_16px_rgba(0,200,150,0.3)] ring-2 ring-[#00C896]/20 font-['Alexandria','Cairo',sans-serif]"
            >
              {accountName.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="break-words text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  <bdi>{accountName}</bdi>
                </h2>
                <span className="flex h-2 w-2 rounded-full bg-[#00C896] shadow-[0_0_6px_rgba(0,200,150,0.6)]" title={t('حساب نشط', 'Active account')} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#00C896]/30 bg-[#00C896]/10 px-2 py-0.5 text-[11px] font-bold text-[#008f6b] dark:text-[#00C896]">
                  <Shield aria-hidden="true" size={11} />
                  <span>{role}</span>
                </span>
                {currentUser.username && (
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300" dir="ltr">
                    @{currentUser.username}
                  </span>
                )}
                {currentUser.email && (
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300" dir="ltr">
                    {currentUser.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/[0.06] sm:border-t-0">
            <SyncIndicator lang={lang} userId={currentUser.id} compact />
            <button
              type="button"
              className={btnSecondary}
              onClick={() => goToSection('account')}
            >
              <UserRound aria-hidden="true" size={15} />
              <span>{t('إدارة الحساب', 'Manage account')}</span>
            </button>
          </div>
        </div>

        {/* 2. Main Sections Tabs (التبويبات كأقسام رئيسية متساوية المساحة) */}
        <div className="order-2 space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#00C896]" />
              <span>{t('الأقسام الرئيسية', 'Main Sections')}</span>
            </div>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              {t('اختر قسماً للانتقال إليه', 'Select a section to navigate')}
            </span>
          </div>

          <div
            role="tablist"
            aria-label={t('أقسام الإعدادات الرئيسية', 'Main settings sections')}
            aria-orientation="horizontal"
            className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2 rounded-2xl border border-slate-200/90 bg-white p-1.5 dark:border-white/[0.08] dark:bg-[#141D29] shadow-xs"
          >
            {sections.map(({ id, icon: Icon, ar: arabic, en }) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  ref={element => { tabRefs.current[id] = element; }}
                  id={`settings-tab-${id}`}
                  type="button"
                  role="tab"
                  aria-controls={`settings-${id}`}
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => { setQuery(''); goToSection(id); }}
                  onKeyDown={event => handleTabKey(event, id)}
                  className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-2 sm:px-3 text-xs sm:text-sm font-bold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C896] cursor-pointer text-center select-none ${
                    isActive
                      ? 'bg-[#00C896] text-[#080D14] shadow-[0_2px_14px_rgba(0,200,150,0.3)] font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-white'
                  } ${id === 'session' ? 'col-span-2 sm:col-span-1' : ''}`}
                >
                  <Icon aria-hidden="true" size={16} className={isActive ? 'stroke-[2.3]' : 'stroke-[1.9] text-slate-600 dark:text-slate-400'} />
                  <span>{ar ? arabic : en}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Tab Panels / Content Area */}
        <div className="order-4 min-w-0">
          {/* TAB 1: OVERVIEW / SHORTCUTS */}
          <section
            id="settings-overview"
            role="tabpanel"
            aria-labelledby="settings-tab-overview"
            hidden={activeSection !== 'overview'}
            tabIndex={0}
            className="space-y-4 outline-none"
          >
            {/* Shortcuts Section Header: Clearly labeled as Quick Links */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#00C896]/10 px-2 py-0.5 text-[11px] font-bold text-[#008f6b] dark:text-[#00C896] border border-[#00C896]/20">
                    <Sparkles size={11} />
                    <span>{t('روابط سريعة', 'Quick Links')}</span>
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif]">
                    {query ? t('نتائج البحث في الإعدادات', 'Search results') : t('اختصارات سريعة للوصول المباشر', 'A shortcut to everything')}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {query
                    ? t('انقر على أي نتيجة للانتقال مباشرة إلى الإعداد المطلوب.', 'Click any result to jump directly to that setting.')
                    : t('روابط مباشرة للوصول السريع إلى الأدوات والإعدادات الشائعة دون الحاجة للبحث.', 'Direct links for instant access to common tools and settings without searching.')}
                </p>
              </div>
            </div>

            {/* Action Rows Container */}
            <div className={`${cardSurface} divide-y divide-slate-100 dark:divide-white/[0.05]`}>
              {matchingShortcuts.map(({ icon, title, description, action, disabled }) => (
                <ActionRow
                  key={title}
                  icon={icon}
                  title={title}
                  description={description}
                  onClick={action}
                  disabled={disabled}
                  ar={ar}
                />
              ))}
            </div>

            {matchingShortcuts.length === 0 && (
              <div role="status" className={`${cardSurface} flex flex-col items-center justify-center p-8 text-center sm:p-12`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/90 bg-slate-100 text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-400 mb-3">
                  <Search size={22} strokeWidth={1.8} />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                  {t('لم يتم العثور على نتائج مطابقة للبحث.', 'No matching settings found.')}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {t('يرجى تجربة كلمة بحث أخرى أو اسم القسم المطلوب.', 'Please try another search keyword or section name.')}
                </p>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#008f6b] dark:text-[#00C896] hover:underline cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>{t('إعادة ضبط البحث وعرض جميع الاختصارات', 'Reset search and show all shortcuts')}</span>
                </button>
              </div>
            )}

            {result?.source === 'sync' && (
              <div
                role={result.ok ? 'status' : 'alert'}
                className={`rounded-2xl border p-4 text-xs sm:text-sm font-medium leading-relaxed ${
                  result.ok
                    ? 'border-[#00C896]/30 bg-[#00C896]/10 text-emerald-900 dark:text-[#00C896]'
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-800 dark:text-rose-300'
                }`}
              >
                {result.text}
              </div>
            )}
          </section>

          {/* TAB 2: ACCOUNT */}
          <section
            id="settings-account"
            role="tabpanel"
            aria-labelledby="settings-tab-account"
            hidden={activeSection !== 'account'}
            tabIndex={0}
            className={`${cardSurface} outline-none divide-y divide-slate-100 dark:divide-white/[0.05]`}
          >
            <div className="p-4 sm:p-6 space-y-3">
              <h2 id="settings-account-heading" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif]">
                {t('تفاصيل الحساب', 'Account details')}
              </h2>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-700 dark:text-[#C3CEDD]">
                {currentUser.username && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="text-slate-500">@</span>
                    <bdi>{currentUser.username}</bdi>
                  </span>
                )}
                {currentUser.email && (
                  <span className="break-all font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                    <bdi>{currentUser.email}</bdi>
                  </span>
                )}
                <span className="inline-flex items-center rounded-md bg-[#00C896]/10 px-2.5 py-0.5 text-xs text-[#008f6b] dark:text-[#00C896] font-bold border border-[#00C896]/20">
                  {role}
                </span>
              </div>
            </div>

            <div className="bg-slate-50/80 p-4 dark:bg-[#101721] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
              <div className="mb-3 space-y-1 sm:mb-0">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  <KeyRound aria-hidden="true" size={16} className="text-[#008f6b] dark:text-[#00C896]" />
                  <span>{t('كود الحساب الفريد', 'Unique account code')}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {t('استخدم كود حسابك الفريد لتسجيل الدخول بأمان إلى مساحتك من أي جهاز.', 'Use your unique account code to securely sign in from any device.')}
                </p>
              </div>

              <div className="min-w-0 sm:w-80 space-y-1.5">
                <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200/90 bg-white ps-3.5 pe-1.5 py-1 dark:border-white/[0.08] dark:bg-[#080D14]">
                  <code dir="ltr" className="min-w-0 flex-1 select-all break-all font-mono text-xs font-bold tracking-wider text-slate-900 dark:text-[#C3CEDD]">
                    {currentUser.userCode}
                  </code>
                  <button
                    type="button"
                    onClick={() => { void copyCode(); }}
                    aria-label={t('نسخ كود الحساب', 'Copy account code')}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#008f6b] hover:bg-[#00C896]/15 focus-visible:outline-2 focus-visible:outline-[#00C896] dark:text-[#00C896] transition-colors cursor-pointer"
                  >
                    {copied ? <Check aria-hidden="true" size={17} strokeWidth={2.5} /> : <Copy aria-hidden="true" size={17} />}
                  </button>
                </div>
                <p aria-live="polite" className="text-xs leading-5 font-semibold text-emerald-700 dark:text-[#00C896]">
                  {copied ? t('تم نسخ كود الحساب بنجاح.', 'Code copied successfully.') : copyError ? t('يمكنك تحديد الكود ونسخه يدويًا.', 'You can select and copy the code manually.') : ''}
                </p>
              </div>
            </div>
          </section>

          {/* TAB 3: SYNC */}
          <section
            id="settings-sync"
            role="tabpanel"
            aria-labelledby="settings-tab-sync"
            hidden={activeSection !== 'sync'}
            tabIndex={0}
            className="outline-none space-y-3.5"
          >
            <SectionHeading
              id="settings-sync-heading"
              title={t('المزامنة السحابية وحالة الاتصال', 'Cloud sync & connection status')}
              description={t('متابعة حالة الاتصال بالخادم، ومزامنة آخر التعديلات فوراً بين أجهزتك.', 'Monitor server connection status and sync the latest updates across your devices.')}
            />

            <div className={`${cardSurface} p-4 sm:p-6 space-y-5`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#00C896]/40 bg-[#00C896]/10 text-[#008f6b] dark:text-[#00C896]">
                    <Cloud aria-hidden="true" size={24} strokeWidth={1.8} />
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {t('المزامنة والاتصال', 'Sync & connection')}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          health.checking ? 'bg-slate-400' : health.connected ? 'bg-[#00C896] shadow-[0_0_8px_rgba(0,200,150,0.6)]' : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-bold text-slate-800 dark:text-white">
                        {health.checking ? t('جارٍ التحقق…', 'Checking…') : health.connected ? t('متصل بالخادم', 'Connected to server') : t('غير متصل حالياً', 'Currently disconnected')}
                      </span>
                      {health.database && (
                        <span className="break-words font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
                          ({health.database})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { void sync(); }}
                  disabled={syncing}
                  className={`${btnSecondary} sm:w-auto w-full`}
                >
                  {syncing ? <Loader2 aria-hidden="true" size={15} className="animate-spin text-[#008f6b] dark:text-[#00C896]" /> : <RefreshCw aria-hidden="true" size={15} />}
                  <span>{syncing ? t('جارٍ المزامنة…', 'Syncing…') : t('مزامنة الآن', 'Sync now')}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-white/[0.06]">
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                  {t('تعديلاتك المحلية تظل محفوظة بأمان وتتم مزامنتها تلقائياً عند عودة الاتصال.', 'Your local changes stay safely saved and will sync automatically when reconnected.')}
                </p>
                <SyncIndicator lang={lang} userId={currentUser.id} />
              </div>

              {!health.connected && !health.checking && (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs font-medium leading-relaxed text-amber-900 dark:text-amber-200">
                  {t('ستُستأنف المزامنة السحابية تلقائياً بمجرد عودة الاتصال بالإنترنت.', 'Cloud sync will resume automatically once connection is restored.')}
                </div>
              )}
            </div>

            {result?.source === 'sync' && (
              <div
                role={result.ok ? 'status' : 'alert'}
                className={`rounded-2xl border p-4 text-xs sm:text-sm font-medium leading-relaxed ${
                  result.ok
                    ? 'border-[#00C896]/30 bg-[#00C896]/10 text-emerald-900 dark:text-[#00C896]'
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-800 dark:text-rose-300'
                }`}
              >
                {result.text}
              </div>
            )}
          </section>

          {/* TAB 4: TOOLS */}
          <section
            id="settings-tools"
            role="tabpanel"
            aria-labelledby="settings-tab-tools"
            hidden={activeSection !== 'tools'}
            tabIndex={0}
            className="outline-none space-y-3.5"
          >
            {!hasPermission(currentUser.role, 'users.read') && Object.keys(legacy).length === 0 && !onReplayTour && (
              <div className={`${cardSurface} p-4 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300`}>
                {t('لا توجد بيانات قديمة للاستيراد في هذا المتصفح. أدوات يومك متاحة من الصفحة الرئيسية.', 'There is no legacy data to import in this browser. Your daily tools are available from the planner.')}
              </div>
            )}

            <SectionHeading
              id="settings-tools-heading"
              title={t('أدوات إضافية وإدارة البيانات', 'Additional tools & data')}
              description={t('الوصول إلى الجولة الإرشادية، وإدارة المستخدمين، وإدارة النسخ الاحتياطية للبيانات السابقة.', 'Access the guided tour, manage users, and handle legacy data backups.')}
            />

            <div className={`${cardSurface} divide-y divide-slate-100 dark:divide-white/[0.05]`}>
              {onReplayTour && (
                <ActionRow
                  icon={Sparkles}
                  title={t('الجولة الإرشادية التفاعلية', 'Interactive onboarding tour')}
                  description={t('استكشف ميزات ميزان وتعرّف على أساسيات تنظيم يومك والتخطيط.', 'Revisit Mizan features and learn how to plan your day.')}
                  onClick={() => { onBack(); onReplayTour(); }}
                  ar={ar}
                  highlight
                />
              )}
              {hasPermission(currentUser.role, 'users.read') && (
                <ActionRow
                  icon={Shield}
                  title={t('لوحة إدارة المستخدمين', 'User administration')}
                  description={t('إدارة الحسابات والصلاحيات وسجل التدقيق الإداري.', 'Manage accounts, permissions and administrative audit logs.')}
                  onClick={onOpenAdmin}
                  ar={ar}
                />
              )}
            </div>

            {Object.keys(legacy).length > 0 && (
              <div className={`${cardSurface} p-4 sm:p-6 space-y-3`}>
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-['Alexandria','Cairo',sans-serif]">
                    {t('بيانات المتصفح السابقة', 'Legacy browser data')}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                    {t('تنزيل نسخة احتياطية من بيانات المتصفح السابقة أو دمجها في هذا الحساب.', 'Download a backup of earlier records or merge them into this account.')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button type="button" className={btnSecondary} onClick={backupLegacy}>
                    <Download aria-hidden="true" size={15} />
                    <span>{t('تنزيل نسخة احتياطية', 'Download backup')}</span>
                  </button>
                  <button type="button" className={btnSecondary} onClick={importLegacy}>
                    <span>{t('استيراد لهذا الحساب', 'Import into this account')}</span>
                  </button>
                </div>
              </div>
            )}

            {result?.source === 'tools' && (
              <div
                role={result.ok ? 'status' : 'alert'}
                className={`rounded-2xl border p-4 text-xs sm:text-sm font-medium leading-relaxed ${
                  result.ok
                    ? 'border-[#00C896]/30 bg-[#00C896]/10 text-emerald-900 dark:text-[#00C896]'
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-800 dark:text-rose-300'
                }`}
              >
                {result.text}
              </div>
            )}
          </section>

          {/* TAB 5: SESSION */}
          <section
            id="settings-session"
            role="tabpanel"
            aria-labelledby="settings-tab-session"
            hidden={activeSection !== 'session'}
            tabIndex={0}
            className="outline-none space-y-3.5"
          >
            <SectionHeading
              id="settings-session-heading"
              title={t('إدارة الجلسة وبيانات الحساب', 'Session & account data')}
              description={t('إجراءات حساسة لإعادة ضبط المهام والعادات أو إدارة بيانات الحساب الحالي.', 'Sensitive actions to reset tasks and habits or manage current account data.')}
            />

            <div className="overflow-hidden rounded-2xl border border-rose-500/20 bg-white dark:border-rose-500/25 dark:bg-[#141D29]">
              <div className="flex flex-col justify-between gap-4 bg-rose-50/50 p-4 dark:bg-rose-500/[0.04] sm:flex-row sm:items-center sm:p-6">
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-300 font-['Alexandria','Cairo',sans-serif]">
                    {t('مسح المهام وإعادة ضبط العادات', 'Reset tasks & habits')}
                  </h3>
                  <p className="max-w-md text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                    {t('يمسح مهام هذا الحساب ويعيد ضبط عاداته إلى الوضع الافتراضي. سيُطلب منك التأكيد قبل التنفيذ.', 'Clears this account’s tasks and resets its habits to default. Confirmation is required.')}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={syncing}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs sm:text-sm font-bold text-rose-700 transition-all duration-200 hover:border-rose-500/50 hover:bg-rose-500/20 hover:text-rose-800 focus-visible:outline-2 focus-visible:outline-rose-500 dark:text-rose-300 dark:hover:text-white cursor-pointer"
                  onClick={() => {
                    if (window.confirm(t('هل أنت متأكد من مسح مهام هذا الحساب وإعادة ضبط العادات؟', 'Are you sure you want to clear this account’s tasks and reset habits?'))) {
                      onResetData();
                      onBack();
                    }
                  }}
                >
                  <RotateCcw aria-hidden="true" size={15} />
                  <span>{t('إعادة الضبط الآن', 'Reset data now')}</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AccountPage>
  );
}
