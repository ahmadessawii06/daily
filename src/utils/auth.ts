import { User } from '../types';

const AUTH_USER_KEY = 'mizan_auth_user_v3';
const AUTH_TOKEN_KEY = 'mizan_auth_token_v3';

// Purge any legacy unencrypted password storage immediately
try {
  localStorage.removeItem('daily_tasks_user_creds_v2');
  localStorage.removeItem('daily_tasks_registered_users_v1');
  localStorage.removeItem('daily_tasks_auth_user_v1');
  localStorage.removeItem('daily_tasks_auth_token_v1');
} catch {
  // ignore
}

export function getStoredAuth(): { user: User | null; token: string | null } {
  try {
    const rawUser = localStorage.getItem(AUTH_USER_KEY);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (rawUser && token) {
      const user = JSON.parse(rawUser);
      if (user && user.id && user.username) {
        return { user, token };
      }
    }
  } catch (err) {
    console.warn('Error reading stored auth:', err);
  }
  return { user: null, token: null };
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveStoredAuth(user: User, token: string): void {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (err) {
    console.warn('Error saving auth:', err);
  }
}

export function clearStoredAuth(): void {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (err) {
    console.warn('Error clearing auth:', err);
  }
}
