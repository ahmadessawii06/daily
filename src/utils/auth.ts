import type { User } from '../types';

const SESSION_KEY = 'mizan_session_v4';
let memorySession: { user: User; token: string } | null = null;

export function getStoredAuth(): { user: User | null; token: string | null } {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw);
      if (session.user?.id && typeof session.token === 'string') memorySession = session;
    } else memorySession = null;
  } catch {}
  return memorySession || { user: null, token: null };
}

export function getAuthToken(): string | null { return getStoredAuth().token; }
export function getStoredUserCode(): string | null { return getStoredAuth().user?.userCode || null; }

export function saveStoredAuth(user: User, token: string): void {
  memorySession = { user, token };
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(memorySession)); } catch {}
}

export function clearStoredAuth(): void {
  memorySession = null;
  try {
    for (const key of [SESSION_KEY, 'mizan_user_code_v1', 'mizan_user_info_v1', 'mizan_auth_user_v3', 'mizan_auth_token_v3']) localStorage.removeItem(key);
  } catch {}
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('mizan:session-cleared'));
}
