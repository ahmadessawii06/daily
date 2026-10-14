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
    if (typeof sessionStorage !== 'undefined') {
      const support = sessionStorage.getItem('mizan_support_session');
      if (support) { const s = JSON.parse(support); if (s.user?.impersonation && typeof s.token === 'string') return s; }
    }
  } catch {}
  return memorySession || { user: null, token: null };
}

export function getAuthToken(): string | null { return getStoredAuth().token; }
export function getStoredUserCode(): string | null { return getStoredAuth().user?.userCode || null; }

export function saveStoredAuth(user: User, token: string): void {
  if (user.impersonation && typeof sessionStorage !== 'undefined') { sessionStorage.setItem('mizan_support_session', JSON.stringify({ user, token })); return; }
  memorySession = { user, token };
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(memorySession)); } catch {}
}
export function beginSupportSession(user: User, token: string) {
  if (!user.impersonation) throw new Error('Invalid support session');
  sessionStorage.setItem('mizan_support_session', JSON.stringify({ user, token }));
}
export function originalAdminSession(): { user: User; token: string } | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
export function clearSupportSession(): void {
  try {
    const id = getStoredAuth().user?.impersonation?.id;
    if (id) for (let i = localStorage.length - 1; i >= 0; i--) { const key = localStorage.key(i); if (key?.startsWith(`mizan_support_${id}:`)) localStorage.removeItem(key); }
    sessionStorage.removeItem('mizan_support_session');
  } catch {}
}

export function clearStoredAuth(): void {
  clearSupportSession();
  memorySession = null;
  try {
    for (const key of [SESSION_KEY, 'mizan_user_code_v1', 'mizan_user_info_v1', 'mizan_auth_user_v3', 'mizan_auth_token_v3']) localStorage.removeItem(key);
  } catch {}
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('mizan:session-cleared'));
}
