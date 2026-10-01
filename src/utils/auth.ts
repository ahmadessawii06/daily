import { User } from '../types';

const USER_CODE_STORAGE_KEY = 'mizan_user_code_v1';
const USER_INFO_STORAGE_KEY = 'mizan_user_info_v1';

// In-memory cache for restricted browsing environments
let memoryUserCode: string | null = null;
let memoryUser: User | null = null;

export function getStoredUserCode(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const code = localStorage.getItem(USER_CODE_STORAGE_KEY);
      if (code && code.trim()) {
        memoryUserCode = code.trim().toUpperCase();
        return memoryUserCode;
      }
    }
  } catch {}
  return memoryUserCode;
}

export function getStoredAuth(): { user: User | null; token: string | null } {
  try {
    if (typeof localStorage !== 'undefined') {
      const rawUser = localStorage.getItem(USER_INFO_STORAGE_KEY);
      const code = localStorage.getItem(USER_CODE_STORAGE_KEY);
      if (rawUser && code) {
        const user = JSON.parse(rawUser);
        if (user && user.userCode) {
          memoryUser = user;
          memoryUserCode = user.userCode;
          return { user, token: user.userCode };
        }
      }
    }
  } catch {}

  if (memoryUser) {
    return { user: memoryUser, token: memoryUser.userCode };
  }

  return { user: null, token: null };
}

export function getAuthToken(): string | null {
  return getStoredUserCode();
}

export function saveStoredAuth(user: User, _token?: string): void {
  memoryUser = user;
  memoryUserCode = user.userCode;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USER_CODE_STORAGE_KEY, user.userCode.trim().toUpperCase());
      localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(user));
    }
  } catch {}
}

export function clearStoredAuth(): void {
  memoryUser = null;
  memoryUserCode = null;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(USER_CODE_STORAGE_KEY);
      localStorage.removeItem(USER_INFO_STORAGE_KEY);
      localStorage.removeItem('mizan_auth_user_v3');
      localStorage.removeItem('mizan_auth_token_v3');
    }
  } catch {}
}
