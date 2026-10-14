import { getStoredAuth } from './auth';

export function scopedKey(key: string, userId = getStoredAuth().user?.id): string {
  const support = getStoredAuth().user?.impersonation;
  if (support && userId === getStoredAuth().user?.id) return `mizan_support_${support.id}:${key}`;
  return `mizan_user_${encodeURIComponent(userId || 'signed_out')}:${key}`;
}

export const userStorage = {
  getItem(key: string): string | null { return localStorage.getItem(scopedKey(key)); },
  setItem(key: string, value: string): void { localStorage.setItem(scopedKey(key), value); },
  removeItem(key: string): void { localStorage.removeItem(scopedKey(key)); },
};

// Unscoped data has no trustworthy owner. Keep it for an explicit import.
export function legacyBackup(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  try {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    if (/^daily_/.test(key)) {
      try { result[key] = JSON.parse(localStorage.getItem(key)!); } catch {}
    }
  }
  } catch {}
  return result;
}
