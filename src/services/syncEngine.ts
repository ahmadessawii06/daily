import type { DayRecord } from '../types';
import { getStoredAuth } from '../utils/auth';
import { loadAllDays, saveAllDays } from '../utils/storage';
import { userStorage, scopedKey, isReligiousSyncKey } from '../utils/scopedStorage';
import { mergeDay } from '../shared/merge';
import { requestApi } from './api';
import { enqueue, getQueue, saveQueue } from './syncQueue';
import { mergeWorkspace, parseWorkspace } from '../shared/workspace';
import { readStoredWorkspace, storeWorkspace } from '../utils/workspace';
import { prepareDayForSync } from '../utils/dayPhoto';
export { getQueue, saveQueue } from './syncQueue';
export type SyncState = 'synced' | 'syncing' | 'saving' | 'offline' | 'error' | 'warning';
export interface SyncStatusInfo { status: SyncState; pendingCount: number; lastSyncedAt: string | null; errorMessage?: string; }

let status: SyncState = 'saving';
let lastSyncedAt: string | null = null;
let errorMessage: string | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let inFlight: Promise<boolean> | null = null;
let inFlightUser: string | undefined;
const listeners = new Set<(info: SyncStatusInfo) => void>();
export function getSyncError(): string | undefined { return errorMessage; }
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
  const deferredPhotos = new Map<string, DayRecord>();
  try {
    const body: any = { days: {}, versions: {} };
    for (const item of sent) {
      if (item.type === 'day') {
        try { body.days[item.date!] = await prepareDayForSync(item.data); }
        catch {
          if (!active(userId, token)) return false;
          // Keep a durable account-scoped copy before syncing the other fields.
          userStorage.setItem(`unsynced_day_photos:${item.date}`, JSON.stringify(item.data));
          deferredPhotos.set(item.date!, item.data);
          const { dayPhoto, dayPhotos, dayPhotoUpdatedAt, ...rest } = item.data;
          body.days[item.date!] = rest;
        }
      }
      else {
        body[item.type] = item.data;
        body.versions[item.type] = item.clientTimestamp;
      }
    }
    const support = !!getStoredAuth().user?.impersonation;
    const result = support ? await requestApi('/sync/read') : await requestApi('/sync/batch', body);
    if (!result.success || !result.days) throw new Error('استجابة المزامنة غير صالحة');
    if (sent.some(item => item.type === 'workspace') && !result.workspace) throw new Error('الخادم الحالي لا يدعم مزامنة البطاقات بعد');
    if (sent.some(item => item.type === 'religious') && !result.religious) throw new Error('الخادم الحالي لا يدعم مزامنة بيانات الورد والأذكار');
    if (!active(userId, token)) return false;
    const acknowledged = new Set(sent.map(item => item.id));
    // Edits made during the request have different IDs and stay queued.
    const pending = getQueue(userId).filter(item => !acknowledged.has(item.id));
    if (result.religious && !support) {
      const sentReligious = sent.find(item => item.type === 'religious');
      let next = pending.find(item => item.type === 'religious');
      const retain = (key: string, entry: { value: string | null; version: number; id: string }) => {
        if (!next) {
          next = { id: crypto.randomUUID(), type: 'religious', data: {}, clientTimestamp: Date.now() };
          pending.push(next);
        }
        next.data[key] = entry;
      };
      for (const key of Object.keys(sentReligious?.data || {})) if (!result.religious[key]) throw new Error('Server did not acknowledge religious data');
      for (const [key, remote] of Object.entries(result.religious as Record<string, { value: string | null; version: number; id: string }>)) {
        if (!isReligiousSyncKey(key) || !remote || typeof remote.version !== 'number') throw new Error('Invalid religious sync response');
        const sentEntry = sentReligious?.data[key];
        if (next?.data[key] && next.data[key].version <= remote.version) next.data[key].version = remote.version + 1;
        if (sentEntry && (remote.version !== sentEntry.version || remote.id !== sentEntry.id) && !next?.data[key]) {
          // A conflicting update won on the server. Preserve the user's edit
          // and retry it after the observed version.
          retain(key, { ...sentEntry, version: remote.version + 1 });
        }
        if (next?.data[key] || (sentEntry && (remote.version !== sentEntry.version || remote.id !== sentEntry.id))) continue;
        const storageKey = scopedKey(key, userId);
        if (remote.value === null) localStorage.removeItem(storageKey); else localStorage.setItem(storageKey, remote.value);
      }
      // Import existing account-scoped data only when the server has no value.
      if (!userStorage.getItem('religious_sync_imported')) {
        const prefix = scopedKey('', userId);
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i)!;
          const key = storageKey.startsWith(prefix) ? storageKey.slice(prefix.length) : '';
          if (isReligiousSyncKey(key) && !result.religious[key] && !sentReligious?.data[key] && !next?.data[key]) {
            retain(key, { value: localStorage.getItem(storageKey), version: Date.now(), id: crypto.randomUUID() });
          }
        }
        userStorage.setItem('religious_sync_imported', '1');
      }
    }
    // A newer version from another device means the server rejected this
    // collection update. Rebase it and retry instead of losing the edit.
    for (const item of sent) {
      if (!['habits', 'recurring', 'settings'].includes(item.type)) continue;
      const remoteVersion = result.versions?.[item.type];
      if (typeof remoteVersion !== 'number' || remoteVersion <= item.clientTimestamp) continue;
      const newer = pending.find(entry => entry.type === item.type);
      if (newer) {
        if (item.type === 'settings') newer.data = { ...item.data, ...newer.data };
        newer.clientTimestamp = Math.max(newer.clientTimestamp, remoteVersion + 1);
      } else {
        pending.push({ ...item, clientTimestamp: remoteVersion + 1 });
      }
    }
    if (result.workspace) {
      const workspace = parseWorkspace(result.workspace);
      storeWorkspace(support ? workspace : mergeWorkspace(readStoredWorkspace(), workspace));
      for (const item of pending) if (item.type === 'workspace') item.data = mergeWorkspace(item.data, workspace);
    }
    saveQueue(pending, userId);
    const local = support ? {} : loadAllDays();
    for (const item of sent) {
      if (!support && item.type === 'day' && !deferredPhotos.has(item.date!)) userStorage.removeItem(`unsynced_day_photos:${item.date}`);
    }
    for (const [date, record] of Object.entries(result.days as Record<string, DayRecord>)) {
      const preserved = local[date] ?? deferredPhotos.get(date);
      if (!support && preserved && userStorage.getItem(`unsynced_day_photos:${date}`)) deferredPhotos.set(date, preserved);
      local[date] = mergeDay(local[date], record);
      if (deferredPhotos.has(date) && preserved) {
        local[date] = { ...local[date], dayPhoto: preserved.dayPhoto, dayPhotos: preserved.dayPhotos, dayPhotoUpdatedAt: preserved.dayPhotoUpdatedAt };
      }
    }
    saveAllDays(local);
    userStorage.setItem('sync_versions', JSON.stringify(result.versions || {}));
    const keys = { habits: 'daily_habits_v8_saturday_schedule', recurring: 'daily_life_recurring_items_v2' };
    for (const key of ['habits', 'recurring'] as const) {
      if (!pending.some(item => item.type === key) && result.versions?.[key]) userStorage.setItem(keys[key], JSON.stringify(result[key]));
    }
    // Keep locally-selected settings when this sync request included a newer
    // local settings update. A stale server response must not roll the UI back
    // to the previous theme immediately after the user toggles it.
    if (!sent.some(item => item.type === 'settings') && !pending.some(item => item.type === 'settings')) {
      const settings = result.settings || {};
      if (settings.theme) userStorage.setItem('daily_theme_v1', settings.theme);
      if (settings.lang) userStorage.setItem('lang', settings.lang);
      if (settings.prayerTimes) userStorage.setItem('daily_fixed_prayer_times_v1', JSON.stringify(settings.prayerTimes));
      if (settings.prayerLocation) userStorage.setItem('daily_prayer_location_config_v3', JSON.stringify(settings.prayerLocation));
      if (settings.onboarding) userStorage.setItem('mizan_onboarding_status_v1', JSON.stringify(settings.onboarding));
    }
    status = pending.length ? 'saving' : 'synced';
    if (!pending.length && deferredPhotos.size) {
      status = 'warning';
      errorMessage = `Photo saved locally only (${[...deferredPhotos.keys()].join(', ')})`;
    }
    lastSyncedAt = new Date().toLocaleTimeString('en-GB-u-nu-latn', { hour: '2-digit', minute: '2-digit' });
    window.dispatchEvent(new Event('mizan:data-synced'));
    return pending.length === 0;
  } catch (err) {
    if (active(userId, token)) {
      status = navigator.onLine ? 'error' : 'offline'; errorMessage = (err as Error).message;
      retryTimer = setTimeout(() => { if (active(userId, token)) void triggerSync(userId, true); }, 15000);
    }
    return false;
  } finally { if (active(userId, token)) notify(); }
}

function enqueueReligious(key: string, value: string | null) {
  enqueue('religious', { [key]: { value, version: Date.now(), id: Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-') } });
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
  if (active(userId, session.token) && getQueue(userId).length && (success || status === 'saving')) void triggerSync(userId);
  return success;
}

if (typeof window !== 'undefined') {
  window.addEventListener('mizan:religious-change', event => {
    const { key, value } = (event as CustomEvent).detail;
    enqueueReligious(key, value);
  });
  window.addEventListener('mizan:queue-changed', () => { void triggerSync(); });
  window.addEventListener('online', () => { void triggerSync(undefined, true); });
  window.addEventListener('offline', () => { status = 'offline'; notify(); });
  window.addEventListener('mizan:session-cleared', () => {
    clearTimeout(timer); clearTimeout(retryTimer); status = 'saving'; lastSyncedAt = null; errorMessage = undefined; notify();
  });
}
