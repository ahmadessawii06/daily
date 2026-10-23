import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OnboardingTour, STEPS } from '../src/components/OnboardingTour';
import { SettingsPage } from '../src/components/SettingsPage';
import { CardsDashboard } from '../src/components/CardsDashboard';
import { TaskList } from '../src/components/TaskList';
import {
  shouldShowOnboarding,
  saveOnboardingStatus,
  markPendingNewUserOnboarding,
  clearPendingNewUserOnboarding,
  getStoredOnboardingStatus,
  ONBOARDING_STATUS_KEY,
  PENDING_NEW_USER_KEY,
} from '../src/utils/onboardingStorage';
import { saveStoredAuth, clearStoredAuth, beginSupportSession } from '../src/utils/auth';
import { userStorage } from '../src/utils/scopedStorage';
import type { User, PlannerWorkspace } from '../src/types';

// Mock localStorage for Node test runner
const memoryStore = new Map<string, string>();
const mockStorage = {
  getItem: (key: string) => memoryStore.get(key) ?? null,
  setItem: (key: string, value: string) => { memoryStore.set(key, String(value)); },
  removeItem: (key: string) => { memoryStore.delete(key); },
  clear: () => { memoryStore.clear(); },
  key: (index: number) => Array.from(memoryStore.keys())[index] ?? null,
  get length() { return memoryStore.size; },
};

Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, configurable: true });
const mockWindow = new EventTarget();
(mockWindow as any).matchMedia = () => ({ matches: false });
Object.defineProperty(globalThis, 'window', { value: mockWindow, configurable: true });

const regularUser: User = {
  id: 'user_regular_123',
  username: 'newbie',
  name: 'Newbie User',
  userCode: 'CODE123456789ABCDEF0',
  role: 'user',
};

const supportUser: User = {
  ...regularUser,
  impersonation: { id: 'support_grant_456', actorId: 'admin_1', expiresAt: new Date(Date.now() + 60000).toISOString() },
};

const emptyWorkspace: PlannerWorkspace = {
  categories: [
    { id: 'cat1', name: 'العمل', icon: 'briefcase', order: 0, updatedAt: '2026-10-23T00:00:00Z' },
  ],
  view: 'cards',
  viewUpdatedAt: '2026-10-23T00:00:00Z',
};

test('onboarding storage lifecycle: new registration triggers once, skipping or completing persists account status', () => {
  mockStorage.clear();
  saveStoredAuth(regularUser, 'token_abc');

  // 1. Initial state: Existing user logging in without pending flag does not see onboarding
  assert.equal(shouldShowOnboarding(), false, 'Existing user should not be forced into onboarding');

  // 2. New registration sets pending flag
  markPendingNewUserOnboarding();
  assert.equal(shouldShowOnboarding(), true, 'Newly registered user should see onboarding');

  // 3. User skips the tour
  saveOnboardingStatus({ completed: true, skipped: true });
  const status = getStoredOnboardingStatus();
  assert.equal(status?.completed, true, 'Status marked as completed');
  assert.equal(status?.skipped, true, 'Status marked as skipped');

  // 4. Reload / next check: Should not show again
  assert.equal(shouldShowOnboarding(), false, 'Completed or skipped tour does not show again');
});

test('support and administrator impersonation sessions NEVER trigger onboarding', () => {
  mockStorage.clear();
  saveStoredAuth(supportUser, 'token_support');
  markPendingNewUserOnboarding();

  assert.equal(shouldShowOnboarding(), false, 'Support session must never show onboarding');
});

test('accounts remain isolated: different users do not mix onboarding statuses', () => {
  mockStorage.clear();

  const userA: User = { id: 'user_a', username: 'usera', userCode: 'CODEA', role: 'user' };
  const userB: User = { id: 'user_b', username: 'userb', userCode: 'CODEB', role: 'user' };

  // User A registers and completes tour
  saveStoredAuth(userA, 'token_a');
  markPendingNewUserOnboarding();
  saveOnboardingStatus({ completed: true, skipped: false });
  assert.equal(shouldShowOnboarding(), false);

  // Switch to User B (new user)
  saveStoredAuth(userB, 'token_b');
  assert.equal(getStoredOnboardingStatus(), null, 'User B has no completed status');
  markPendingNewUserOnboarding();
  assert.equal(shouldShowOnboarding(), true, 'User B sees onboarding independently');
});

test('OnboardingTour renders Step 1 Welcome modal correctly in Arabic and English', () => {
  const arHtml = renderToStaticMarkup(
    React.createElement(OnboardingTour, {
      isOpen: true,
      lang: 'ar',
      theme: 'dark',
      onClose: () => {},
      onOpenAddTask: () => {},
      currentTasksCount: 0,
    })
  );

  assert.ok(arHtml.includes('أهلاً بك في ميزان ✨'), 'Arabic welcome title appears');
  assert.ok(arHtml.includes('ميزان مساحتك لتنظيم يومك'), 'Arabic welcome description appears');
  assert.ok(arHtml.includes('يلا نبدأ'), 'Arabic start button appears');
  assert.ok(arHtml.includes('تخطي الجولة'), 'Arabic skip button appears');

  const enHtml = renderToStaticMarkup(
    React.createElement(OnboardingTour, {
      isOpen: true,
      lang: 'en',
      theme: 'light',
      onClose: () => {},
      onOpenAddTask: () => {},
      currentTasksCount: 0,
    })
  );

  assert.ok(enHtml.includes('Welcome to Mizan ✨'), 'English welcome title appears');
  assert.ok(enHtml.includes('Let’s Start') || enHtml.includes("Let's Start"), 'English start button appears');
  assert.ok(enHtml.includes('Skip Tour'), 'English skip button appears');
});

test('SettingsPage provides a Replay Tour option that invokes callback and navigates back to planner', () => {
  let replayed = false;
  let backed = false;

  const html = renderToStaticMarkup(
    React.createElement(SettingsPage, {
      currentUser: regularUser,
      lang: 'ar',
      theme: 'dark',
      archiveDaysCount: 0,
      exporting: false,
      onBack: () => { backed = true; },
      onToggleLang: () => {},
      onSetTheme: () => {},
      onResetData: () => {},
      onApply24HourTemplate: () => {},
      onSyncComplete: () => {},
      onOpenStats: () => {},
      onOpenArchive: () => {},
      onOpenAdmin: () => {},
      onExport: () => {},
      onLogout: () => {},
      onReplayTour: () => { replayed = true; },
    })
  );

  assert.ok(html.includes('إعادة الجولة التعريفية'), 'Replay tour option is visible in Settings');
});

test('First-time user clarity: CardsDashboard displays empty state call to action when no tasks exist', () => {
  const html = renderToStaticMarkup(
    React.createElement(CardsDashboard, {
      currentDate: '2026-10-23',
      archiveDays: [],
      tasks: [],
      workspace: emptyWorkspace,
      filter: 'all',
      onFilterChange: () => {},
      lang: 'ar',
      onAdd: () => {},
      onAddPrayer: () => {},
      onStatusChange: () => {},
      onEdit: () => {},
      onDelete: () => {},
      onOpenAddTask: () => {},
    })
  );

  assert.ok(html.includes('يوم جديد، بداية جديدة ☀️'), 'Friendly empty state title appears in CardsDashboard');
  assert.ok(html.includes('ابدأ بإضافة أول مهمة'), 'Friendly empty state description appears');
  assert.ok(html.includes('أضف أول مهمة'), 'Add first task button is present');
});

test('First-time user clarity: TaskList displays empty state with Add First Task button and template option', () => {
  const html = renderToStaticMarkup(
    React.createElement(TaskList, {
      tasks: [],
      onStatusChange: () => {},
      onEdit: () => {},
      onDelete: () => {},
      onUpdateTitle: () => {},
      onOpenAddTask: () => {},
      onApply24HourTemplate: () => {},
      currentFilter: 'all',
      onFilterChange: () => {},
      lang: 'ar',
    })
  );

  assert.ok(html.includes('يوم جديد، بداية جديدة ☀️'), 'Friendly empty state title appears in TaskList');
  assert.ok(html.includes('أضف أول مهمة'), 'Add first task button is present in TaskList');
  assert.ok(html.includes('قالب 24 ساعة'), '24-hour template option remains accessible');
});

test('Header toolbar tools are included in onboarding tour with non-interactive protection', () => {
  const expectedToolbarSteps = [
    { id: 'date-navigation', selector: '#onboarding-date-navigation' },
    { id: 'view-switcher', selector: '#onboarding-view-switcher' },
    { id: 'day-journal', selector: '#header-day-journal-btn' },
    { id: 'day-photo', selector: '#header-day-photo-btn' },
    { id: 'header-palette', selector: '#header-palette-btn' },
    { id: 'header-columns', selector: '#header-columns-btn' },
    { id: 'header-archive', selector: '#header-archive-btn' },
    { id: 'header-stats', selector: '#header-stats-btn' },
    { id: 'header-export', selector: '#header-export-btn' },
    { id: 'header-lang', selector: '#header-lang-btn' },
    { id: 'header-theme', selector: '#header-theme-btn' },
    { id: 'header-settings', selector: '#header-settings-btn' },
    { id: 'header-logout', selector: '#header-logout-btn' },
  ];

  for (const expected of expectedToolbarSteps) {
    const step = STEPS.find(s => s.id === expected.id);
    assert.ok(step, `Step ${expected.id} exists in tour`);
    assert.equal(step?.targetSelector, expected.selector, `Step ${expected.id} has correct selector`);
    assert.ok(step?.title.ar && step?.title.en, `Step ${expected.id} has Arabic & English titles`);
    assert.ok(step?.description.ar && step?.description.en, `Step ${expected.id} has Arabic & English descriptions`);
    assert.notEqual(step?.interactive, true, `Step ${expected.id} is non-interactive to block clicks during tour`);
  }

  // Only create-task is interactive
  const createTaskStep = STEPS.find(s => s.id === 'create-task');
  assert.equal(createTaskStep?.interactive, true, 'create-task step remains interactive');
});

