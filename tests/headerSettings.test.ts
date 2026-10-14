import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MainHeader } from '../src/components/MainHeader';
import { SettingsPage } from '../src/components/SettingsPage';
import type { User } from '../src/types';

const user: User = { id: 'test-user', username: 'member', name: 'Test member', userCode: '1234567890ABCDEF12345678', role: 'user' };
const noop = () => {};
test('the planner header has exactly two actions and keeps sync status accessible without a third button', () => {
  for (const lang of ['ar', 'en'] as const) {
    const html = renderToStaticMarkup(React.createElement(MainHeader, { currentDate: '2026-10-15', currentUser: user, lang, onOpenAddTask: noop, onOpenSettings: noop }));
    assert.equal((html.match(/<button\b/g) || []).length, 2);
    assert.ok(html.includes(`aria-label="${lang === 'ar' ? 'الإعدادات' : 'Settings'}"`));
    assert.ok(html.includes(`aria-label="${lang === 'ar' ? 'إضافة مهمة جديدة' : 'Add new task'}"`));
    assert.ok(html.includes('role="status"'));
    assert.ok(!html.includes('aria-expanded='), 'No account dropdown remains');
  }
});

const settings = (currentUser: User, lang: 'ar' | 'en' = 'en') => renderToStaticMarkup(React.createElement(SettingsPage, { currentUser, lang, theme: 'dark', archiveDaysCount: 3, exporting: false, onBack: noop, onToggleLang: noop, onSetTheme: noop, onResetData: noop, onApply24HourTemplate: noop, onSyncComplete: noop, onOpenStats: noop, onOpenArchive: noop, onOpenAdmin: noop, onExport: noop, onLogout: noop }));

test('settings is a page containing all account tools and existing preferences, with no settings dialog', () => {
  const html = settings(user);
  assert.ok(html.startsWith('<main'));
  assert.ok(!html.includes('role="dialog"'));
  for (const feature of ['Appearance', 'Language', 'Sync now', 'Weekly statistics', 'Archive &amp; history', 'Export today as an image', '24-hour template', 'Sign out', 'Reset tasks &amp; habits', user.userCode]) assert.ok(html.includes(feature), feature);
  assert.ok(html.includes('Checking…'), 'Health loading is distinct from an offline failure');
  assert.ok(!html.includes('User management'));
});

test('the management tile follows permissions and legacy cached identities remain renderable', () => {
  for (const role of ['support', 'admin', 'super_admin'] as const) assert.ok(settings({ ...user, role }).includes('User management'));
  assert.ok(!settings({ ...user, role: undefined }).includes('User management'));
  assert.ok(settings({ id: user.id, userCode: user.userCode }).includes('Mizan user'));
  assert.ok(settings(user, 'ar').includes('dir="rtl"'));
  assert.ok(settings(user, 'en').includes('dir="ltr"'));
});
