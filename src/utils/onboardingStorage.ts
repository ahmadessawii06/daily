import { getStoredAuth } from './auth';
import { userStorage } from './scopedStorage';
import { enqueue } from '../services/syncQueue';
import type { OnboardingStatus } from '../types';

export const ONBOARDING_STATUS_KEY = 'mizan_onboarding_status_v1';
export const PENDING_NEW_USER_KEY = 'mizan_pending_new_user_onboarding_v1';

export function getStoredOnboardingStatus(): OnboardingStatus | null {
  try {
    const raw = userStorage.getItem(ONBOARDING_STATUS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function markPendingNewUserOnboarding(): void {
  userStorage.setItem(PENDING_NEW_USER_KEY, 'true');
}

export function clearPendingNewUserOnboarding(): void {
  userStorage.removeItem(PENDING_NEW_USER_KEY);
}

export function saveOnboardingStatus(params: { completed: boolean; skipped?: boolean }): void {
  const current = getStoredOnboardingStatus();
  const status: OnboardingStatus = {
    ...current,
    completed: params.completed,
    skipped: Boolean(params.skipped),
    completedAt: params.completed ? (current?.completedAt || new Date().toISOString()) : undefined,
    updatedAt: new Date().toISOString(),
  };

  userStorage.setItem(ONBOARDING_STATUS_KEY, JSON.stringify(status));
  clearPendingNewUserOnboarding();

  // Enqueue to settings for backend sync across devices
  enqueue('settings', { onboarding: status });
}

export function shouldShowOnboarding(): boolean {
  const auth = getStoredAuth();
  // Never show during impersonation or support sessions or if signed out
  if (!auth.user || auth.user.impersonation) {
    return false;
  }

  const status = getStoredOnboardingStatus();
  if (status?.completed) {
    return false;
  }

  return userStorage.getItem(PENDING_NEW_USER_KEY) === 'true';
}
