import { User } from '../types';

const AUTH_USER_KEY = 'daily_tasks_auth_user_v2';
const AUTH_TOKEN_KEY = 'daily_tasks_auth_token_v2';
const LOCAL_CREDENTIALS_KEY = 'daily_tasks_user_creds_v2';

// Purge old v1 admin storage if present
try {
  localStorage.removeItem('daily_tasks_auth_user_v1');
  localStorage.removeItem('daily_tasks_auth_token_v1');
  localStorage.removeItem('daily_tasks_registered_users_v1');
} catch {
  // ignore
}

export function getStoredAuth(): { user: User | null; token: string | null } {
  try {
    const rawUser = localStorage.getItem(AUTH_USER_KEY);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (rawUser && token) {
      const user = JSON.parse(rawUser);
      // Ensure it's not old admin
      if (user && user.username !== 'admin') {
        return { user, token };
      }
    }
  } catch (err) {
    console.warn('Error reading stored auth:', err);
  }
  return { user: null, token: null };
}

export function saveStoredAuth(user: User, token: string, passwordPlain?: string): void {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    if (passwordPlain) {
      const creds = getLocalRegisteredCredentials();
      creds[user.username.toLowerCase()] = {
        user,
        password: passwordPlain,
      };
      localStorage.setItem(LOCAL_CREDENTIALS_KEY, JSON.stringify(creds));
    }
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

export function getLocalRegisteredCredentials(): Record<string, { user: User; password: string }> {
  try {
    const raw = localStorage.getItem(LOCAL_CREDENTIALS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {};
}

export function verifyLocalCredential(username: string, passwordInput: string): User | null {
  const cleanUser = username.trim().toLowerCase();
  
  // Specific master check for v27md
  if (cleanUser === 'v27md' && passwordInput === '122122122') {
    return {
      id: 'user-v27md',
      username: 'v27md',
      name: 'محمد (v27md)',
      email: 'v27md@tasks.app',
      createdAt: new Date().toISOString(),
    };
  }

  // Strictly check matching password in locally registered accounts
  const creds = getLocalRegisteredCredentials();
  const found = creds[cleanUser];
  if (found && found.password === passwordInput) {
    return found.user;
  }

  return null;
}
