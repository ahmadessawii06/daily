import { User } from '../types';

const AUTH_USER_KEY = 'mizan_auth_user_v3';
const AUTH_TOKEN_KEY = 'mizan_auth_token_v3';

// Safe in-memory fallback for Safari Private Browsing or restricted environments
const memoryAuthCache: { user: User | null; token: string | null } = {
  user: null,
  token: null,
};

// Purge any legacy storage safely
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('daily_tasks_user_creds_v2');
    localStorage.removeItem('daily_tasks_registered_users_v1');
    localStorage.removeItem('daily_tasks_auth_user_v1');
    localStorage.removeItem('daily_tasks_auth_token_v1');
  }
} catch {
  // ignore Safari Private Browsing restrictions
}

export function getStoredAuth(): { user: User | null; token: string | null } {
  try {
    if (typeof localStorage !== 'undefined') {
      const rawUser = localStorage.getItem(AUTH_USER_KEY);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (rawUser && token) {
        const user = JSON.parse(rawUser);
        if (user && user.id && user.username) {
          memoryAuthCache.user = user;
          memoryAuthCache.token = token;
          return { user, token };
        }
      }
    }
  } catch (err) {
    console.warn('Error reading stored auth:', err);
  }

  // Fallback to memory cache
  if (memoryAuthCache.user && memoryAuthCache.token) {
    return memoryAuthCache;
  }

  return { user: null, token: null };
}

export function getAuthToken(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) return token;
    }
  } catch {
    // ignore
  }
  return memoryAuthCache.token;
}

export function saveStoredAuth(user: User, token: string): void {
  memoryAuthCache.user = user;
  memoryAuthCache.token = token;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  } catch (err) {
    console.warn('Error saving auth to localStorage (e.g. Safari Private Mode):', err);
  }
}

export function clearStoredAuth(): void {
  memoryAuthCache.user = null;
  memoryAuthCache.token = null;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (err) {
    console.warn('Error clearing auth:', err);
  }
}
