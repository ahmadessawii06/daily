import { getStoredAuth } from '../utils/auth';
import { scopedKey, userStorage } from '../utils/scopedStorage';
import type { DayRecord } from '../types';

export interface QueueItem {
  id: string;
  type: 'day' | 'habits' | 'recurring' | 'settings';
  date?: string;
  data: any;
  clientTimestamp: number;
}

export function getQueue(userId = getStoredAuth().user?.id): QueueItem[] {
  try { return JSON.parse(localStorage.getItem(scopedKey('sync_queue_v4', userId)) || '[]'); }
  catch { return []; }
}

export function saveQueue(queue: QueueItem[], userId = getStoredAuth().user?.id): void {
  localStorage.setItem(scopedKey('sync_queue_v4', userId), JSON.stringify(queue));
}

export function enqueue(type: QueueItem['type'], data: any, date?: string): void {
  const userId = getStoredAuth().user?.id;
  if (!userId) return;
  if (type === 'settings') {
    const previous = getQueue(userId).find(item => item.type === 'settings');
    data = { ...previous?.data, ...data };
  }
  const existing = getQueue(userId);
  let versions: Record<string, number> = {};
  try { versions = JSON.parse(userStorage.getItem('sync_versions') || '{}'); } catch {}
  const clientTimestamp = Math.max(Date.now(), (versions[type] || 0) + 1, ...existing.map(item => item.clientTimestamp + 1));
  const queue = existing.filter(item => item.type !== type || item.date !== date);
  const id = Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
  queue.push({ id, type, date, data, clientTimestamp });
  saveQueue(queue, userId);
  window.dispatchEvent(new Event('mizan:queue-changed'));
}

export function enqueueDay(record: DayRecord): void { enqueue('day', record, record.date); }
