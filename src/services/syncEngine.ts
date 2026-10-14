import type { DayRecord } from '../types';
import { getStoredAuth } from '../utils/auth';
import { loadAllDays, saveAllDays } from '../utils/storage';
import { userStorage } from '../utils/scopedStorage';
import { mergeDay } from '../shared/merge';
import { requestApi } from './api';
import { getQueue, saveQueue } from './syncQueue';
import { mergeWorkspace, parseWorkspace } from '../shared/workspace';
import { readStoredWorkspace, storeWorkspace } from '../utils/workspace';
export { getQueue, saveQueue } from './syncQueue';
export type SyncState = 'synced' | 'syncing' | 'saving' | 'offline' | 'error';
export interface SyncStatusInfo { status: SyncState; pendingCount: number; lastSyncedAt: string | null; errorMessage?: string; }

let status: SyncState = 'saving';
let lastSyncedAt: string | null = null;
let errorMessage: string | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let inFlight: Promise<boolean> | null = null;
let inFlightUser: string | undefined;
const listeners = new Set<(info: SyncStatusInfo) => void>();
function notify() { listeners.forEach(fn => fn({ status, pendingCount: getQueue().length, lastSyncedAt, errorMessage })); }
export function subscribeToSyncStatus(listener: (info: SyncStatusInfo) => void): () => void {
  listeners.add(listener); notify(); return () => { listeners.delete(listener); };
}

function active(userId: string, token: string): boolean {
  const session = getStoredAuth();
  return session.user?.id === userId && session.token === token;
}

async function sync(userId: string, token: string): Promise<boolean> {
  status = 'syncing'; errorMessage = undefined; notify();
  const sent = getQueue(userId);
  try {
    const body: any = { days: {}, versions: {} };
    for (const item of sent) {
      if (item.type === 'day') body.days[item.date!] = item.data;
      else {
        body[item.type] = item.data;
        body.versions[item.type] = item.clientTimestamp;
      }
    }
    const support = !!getStoredAuth().user?.impersonation;
    const result = support ? await requestApi('/sync/read') : await requestApi('/sync/batch', body);
    if (!result.success || !result.days) throw new Error('استجابة المزامنة غير صالحة');
    if (sent.some(item => item.type === 'workspace') && !result.workspace) throw new Error('الخادم الحالي لا يدعم مزامنة البطاقات بعد');
    if (!active(userId, token)) return false;
    const acknowledged = new Set(sent.map(item => item.id));
    // Edits made during the request have different IDs and stay queued.
    const pending = getQueue(userId).filter(item => !acknowledged.has(item.id));
    if (result.workspace) {
      const workspace = parseWorkspace(result.workspace);
      storeWorkspace(support ? workspace : mergeWorkspace(readStoredWorkspace(), workspace));
      for (const item of pending) if (item.type === 'workspace') item.data = mergeWorkspace(item.data, workspace);
    }
    saveQueue(pending, userId);
    const local = support ? {} : loadAllDays();
    for (const [date, record] of Object.entries(result.days as Record<string, DayRecord>)) local[date] = mergeDay(local[date], record);
    saveAllDays(local);
    userStorage.setItem('sync_versions', JSON.stringify(result.versions || {}));
    const keys = { habits: 'daily_habits_v8_saturday_schedule', recurring: 'daily_life_recurring_items_v2' };
    for (const key of ['habits', 'recurring'] as const) {
      if (!pending.some(item => item.type === key) && result.versions?.[key]) userStorage.setItem(keys[key], JSON.stringify(result[key]));
    }
    if (!pending.some(item => item.type === 'settings')) {
      const settings = result.settings || {};
      if (settings.theme) userStorage.setItem('daily_theme_v1', settings.theme);
      if (settings.lang) userStorage.setItem('lang', settings.lang);
      if (settings.prayerTimes) userStorage.setItem('daily_fixed_prayer_times_v1', JSON.stringify(settings.prayerTimes));
      if (settings.prayerLocation) userStorage.setItem('daily_prayer_location_config_v3', JSON.stringify(settings.prayerLocation));
    }
    status = pending.length ? 'saving' : 'synced';
    lastSyncedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    window.dispatchEvent(new Event('mizan:data-synced'));
    return true;
  } catch (err) {
    if (active(userId, token)) {
      status = navigator.onLine ? 'error' : 'offline'; errorMessage = (err as Error).message;
      retryTimer = setTimeout(() => { if (active(userId, token)) void triggerSync(userId, true); }, 15000);
    }
    return false;
  } finally { if (active(userId, token)) notify(); }
}

export async function triggerSync(userId = getStoredAuth().user?.id, force = false): Promise<boolean> {
  if (timer) clearTimeout(timer);
  if (retryTimer) clearTimeout(retryTimer);
  const session = getStoredAuth();
  if (!userId || userId !== session.user?.id || !session.token) return false;
  if (!navigator.onLine) { status = 'offline'; notify(); return false; }
  if (!force) {
    status = 'saving'; notify();
    timer = setTimeout(() => { void triggerSync(userId, true); }, 350);
    return false;
  }
  if (inFlight) {
    if (inFlightUser === userId) return inFlight;
    await inFlight;
    if (!active(userId, session.token)) return false;
  }
  inFlightUser = userId;
  inFlight = sync(userId, session.token);
  const success = await inFlight;
  inFlight = null; inFlightUser = undefined;
  if (success && active(userId, session.token) && getQueue(userId).length) void triggerSync(userId);
  return success;
}

if (typeof window !== 'undefined') {
  window.addEventListener('mizan:queue-changed', () => { void triggerSync(); });
  window.addEventListener('online', () => { void triggerSync(undefined, true); });
  window.addEventListener('offline', () => { status = 'offline'; notify(); });
  window.addEventListener('mizan:session-cleared', () => {
    clearTimeout(timer); clearTimeout(retryTimer); status = 'saving'; lastSyncedAt = null; errorMessage = undefined; notify();
  });
}
