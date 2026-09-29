import { User } from '../types';

const AUTH_USER_KEY = 'daily_tasks_auth_user_v1';
const AUTH_TOKEN_KEY = 'daily_tasks_auth_token_v1';
const LOCAL_USERS_KEY = 'daily_tasks_registered_users_v1';

export function getStoredAuth(): { user: User | null; token: string | null } {
  try {
    const rawUser = localStorage.getItem(AUTH_USER_KEY);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (rawUser && token) {
      const user = JSON.parse(rawUser);
      return { user, token };
    }
  } catch (err) {
    console.warn('Error reading stored auth:', err);
  }
  return { user: null, token: null };
}

export function saveStoredAuth(user: User, token: string): void {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    // Save to registered local list as offline backup
    const localUsers = getLocalRegisteredUsers();
    const existingIdx = localUsers.findIndex((u) => u.username.toLowerCase() === user.username.toLowerCase());
    if (existingIdx >= 0) {
      localUsers[existingIdx] = user;
    } else {
      localUsers.push(user);
    }
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
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

export function getLocalRegisteredUsers(): User[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}
