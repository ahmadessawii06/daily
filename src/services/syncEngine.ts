import { DayRecord, HabitStreak, Task } from '../types';
import { getAuthToken } from '../utils/auth';
import { loadAllDays, saveAllDays, getDayRecord } from '../utils/storage';

export type SyncState = 'synced' | 'syncing' | 'saving' | 'offline' | 'error';

export interface SyncStatusInfo {
  status: SyncState;
  pendingCount: number;
  lastSyncedAt: string | null;
  errorMessage?: string;
}

export interface QueueItem {
  id: string;
  type: 'day' | 'habits' | 'settings';
  date?: string;
  data: any;
  clientTimestamp: number;
}

let currentStatus: SyncState = navigator.onLine ? 'synced' : 'offline';
let lastSyncedTime: string | null = null;
let lastError: string | undefined = undefined;
const listeners = new Set<(info: SyncStatusInfo) => void>();

function notifyListeners() {
  const pending = getQueue().length;
  const info: SyncStatusInfo = {
    status: currentStatus,
    pendingCount: pending,
    lastSyncedAt: lastSyncedTime,
    errorMessage: lastError,
  };
  listeners.forEach((fn) => fn(info));
}

export function subscribeToSyncStatus(listener: (info: SyncStatusInfo) => void): () => void {
  listeners.add(listener);
  notifyListeners();
  return () => {
    listeners.delete(listener);
  };
}

function getQueueKey(userId = 'active_user'): string {
  return `mizan_sync_queue_${userId}`;
}

export function getQueue(userId = 'active_user'): QueueItem[] {
  try {
    const raw = localStorage.getItem(getQueueKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveQueue(queue: QueueItem[], userId = 'active_user'): void {
  try {
    localStorage.setItem(getQueueKey(userId), JSON.stringify(queue));
    notifyListeners();
  } catch {
    // ignore
  }
}

export function enqueueDayUpdate(date: string, tasks: Task[], notes = '', userId = 'active_user'): void {
  const queue = getQueue(userId);
  const existingIdx = queue.findIndex((item) => item.type === 'day' && item.date === date);

  const newItem: QueueItem = {
    id: `queue_${date}_${Date.now()}`,
    type: 'day',
    date,
    data: { tasks, notes, clientUpdatedAt: new Date().toISOString() },
    clientTimestamp: Date.now(),
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = newItem;
  } else {
    queue.push(newItem);
  }

  saveQueue(queue, userId);
  triggerSync(userId);
}

let syncTimeout: any = null;
let isSyncing = false;

export async function triggerSync(userId = 'active_user', force = false): Promise<void> {
  if (!navigator.onLine) {
    currentStatus = 'offline';
    notifyListeners();
    return;
  }

  const token = getAuthToken();
  if (!token) {
    currentStatus = 'offline';
    notifyListeners();
    return;
  }

  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    if (isSyncing) return;
    isSyncing = true;
    currentStatus = 'syncing';
    notifyListeners();

    try {
      const queue = getQueue(userId);
      const daysPayload: Record<string, any> = {};

      for (const item of queue) {
        if (item.type === 'day' && item.date) {
          daysPayload[item.date] = item.data;
        }
      }

      // If queue is empty, still perform a heartbeat sync
      const res = await fetch('/api/sync/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ days: daysPayload }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.days) {
          // Merge server days into local days using Conflict Resolution
          resolveAndMergeDays(result.days);
        }

        // Clear processed queue
        saveQueue([], userId);
        currentStatus = 'synced';
        lastSyncedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        lastError = undefined;
      } else if (res.status === 401) {
        currentStatus = 'error';
        lastError = 'انتهت الجلسة';
      } else {
        currentStatus = 'error';
        lastError = 'تعذر الاتصال بالخادم';
      }
    } catch (err: any) {
      currentStatus = navigator.onLine ? 'error' : 'offline';
      lastError = err.message || 'خطأ في الشبكة';
    } finally {
      isSyncing = false;
      notifyListeners();
    }
  }, force ? 0 : 350);
}

// Conflict Resolution: Merges server records with local records preserving task integrity
function resolveAndMergeDays(serverDays: Record<string, DayRecord>) {
  const localDays = loadAllDays();
  const merged: Record<string, DayRecord> = { ...localDays };

  for (const [date, serverRec] of Object.entries(serverDays)) {
    const localRec = localDays[date];

    if (!localRec) {
      merged[date] = serverRec;
      continue;
    }

    const serverTime = new Date(serverRec.updatedAt || 0).getTime();
    const localTime = new Date(localRec.updatedAt || 0).getTime();

    // If server is strictly newer, check if we need task-level reconciliation
    if (serverTime > localTime) {
      // Merge tasks array by ID
      const taskMap = new Map<string, Task>();
      (serverRec.tasks || []).forEach((t) => taskMap.set(t.id, t));

      // Check if any local tasks have pending changes not yet on server
      (localRec.tasks || []).forEach((lt) => {
        if (!taskMap.has(lt.id)) {
          taskMap.set(lt.id, lt);
        }
      });

      merged[date] = {
        ...serverRec,
        tasks: Array.from(taskMap.values()),
      };
    }
  }

  saveAllDays(merged);
}

// Online/Offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    currentStatus = 'syncing';
    notifyListeners();
    triggerSync('active_user', true);
  });

  window.addEventListener('offline', () => {
    currentStatus = 'offline';
    notifyListeners();
  });
}
