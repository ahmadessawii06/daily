import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MainHeader } from '../src/components/MainHeader';
import { SettingsPage } from '../src/components/SettingsPage';
import type { User } from '../src/types';
import { colorThemes } from '../src/utils/colorThemes';

const user: User = { id: 'test-user', username: 'member', name: 'Test member', userCode: '1234567890ABCDEF12345678', role: 'user' };
const noop = () => {};
test('the planner header exposes language and theme beside daily actions and sync status', () => {
  for (const lang of ['ar', 'en'] as const) {
    const html = renderToStaticMarkup(React.createElement(MainHeader, { currentDate: '2026-10-15', currentUser: user, lang, theme: 'dark', onToggleTheme: noop, onToggleLang: noop, onExport: noop, exporting: false, onLogout: noop, onOpenArchive: noop, onOpenStats: noop, onOpenAddTask: noop, onOpenSettings: noop }));
    assert.equal((html.match(/<button\b/g) || []).length, 11 + colorThemes.length, 'Toolbar actions include the clickable sync indicator and all theme choices');
    assert.ok(html.includes(lang === 'ar' ? 'ميزان المطور' : 'Mizan Developed'));
    assert.ok(html.includes('popover="manual"'), 'Theme choices stay in a fixed non-blocking side panel');
    assert.ok(!html.includes('Search themes'));
    assert.ok(html.includes(lang === 'ar' ? 'ثيمات الألوان' : 'Color themes'));
    assert.ok(html.includes(lang === 'ar' ? 'تصدير صورة اليوم' : 'Export today as an image'));
    assert.ok(html.includes(lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'));
    assert.ok(html.includes(lang === 'ar' ? 'تفعيل الوضع الفاتح' : 'Switch to light mode'));
    assert.ok(html.includes(`aria-label="${lang === 'ar' ? 'الإعدادات' : 'Settings'}"`));
    assert.ok(html.includes(`aria-label="${lang === 'ar' ? 'إضافة مهمة جديدة' : 'Add new task'}"`));
    assert.match(html, /<button\b[^>]*aria-label="(?:حالة المزامنة:|تعذرت المزامنة|Sync status:|Sync failed)[^"]*"/, 'Sync status must be a button so failure details can open');
    assert.ok(!html.includes('aria-expanded='), 'No account dropdown remains');
  }
});

const settings = (currentUser: User, lang: 'ar' | 'en' = 'en') => renderToStaticMarkup(React.createElement(SettingsPage, { currentUser, lang, theme: 'dark', archiveDaysCount: 3, exporting: false, onBack: noop, onToggleLang: noop, onSetTheme: noop, onResetData: noop, onApply24HourTemplate: noop, onSyncComplete: noop, onOpenStats: noop, onOpenArchive: noop, onOpenAdmin: noop, onExport: noop, onLogout: noop }));

test('settings opens with searchable shortcuts and keeps detailed settings in accessible tabs', () => {
  const html = settings(user);
  assert.ok(html.startsWith('<main'));
  assert.ok(!html.includes('role="dialog"'));
  for (const feature of ['Sync now', 'Reset tasks &amp; habits', user.userCode]) assert.ok(html.includes(feature), feature);
  for (const removed of ['Sign out', 'Weekly statistics', 'Archive &amp; history', 'Appearance', 'Language', 'Export today as an image', '24-hour template', 'settings-preferences']) assert.ok(!html.includes(removed), removed);
  assert.ok(html.includes('Checking…'), 'Health loading is distinct from an offline failure');
  assert.ok(!html.includes('User management'));
  assert.ok(html.includes('aria-label="Search settings"'));
  assert.ok(html.includes('A shortcut to everything'));
  assert.equal((html.match(/<button\b[^>]*aria-label="Sync (?:status:|failed)[^"]*"/g) || []).length, 2, 'Both sync indicators in settings remain clickable');
  assert.equal((html.match(/role="tab"/g) || []).length, 5);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 5);
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 1);
  assert.equal((html.match(/hidden=""/g) || []).length, 4, 'Inactive panels do not lengthen the page or expose hidden controls');
  assert.ok(html.includes('id="settings-overview" role="tabpanel" aria-labelledby="settings-tab-overview" tabindex="0"'));
  assert.ok(html.includes('id="settings-account" role="tabpanel" aria-labelledby="settings-tab-account" hidden="" tabindex="0"'));
});

test('the management tile follows permissions and legacy cached identities remain renderable', () => {
  for (const role of ['support', 'admin', 'super_admin'] as const) assert.ok(settings({ ...user, role }).includes('User management'));
  assert.ok(!settings({ ...user, role: undefined }).includes('User management'));
  assert.ok(settings({ id: user.id, userCode: user.userCode }).includes('Mizan user'));
  assert.ok(settings(user, 'ar').includes('dir="rtl"'));
  assert.ok(settings(user, 'en').includes('dir="ltr"'));
});
