import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuranWirdGoldenMushaf } from '../src/components/QuranWirdGoldenMushaf';
import { saveStoredAuth } from '../src/utils/auth';
import { userStorage } from '../src/utils/scopedStorage';
import { getGoldenQuranPageUrl } from '../src/data/quranNavigation';

test('each date opens its assigned Quran page instead of a shared old reading position', () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  } });
  saveStoredAuth({ id: 'reader', userCode: 'READER' }, 'token');
  for (const [date, page] of [['2026-11-05', 125], ['2026-11-06', 392]] as const) {
    userStorage.setItem(`daily_quran_assignment_${date}`, String(page));
    userStorage.setItem(`islambook_quran_wird_page_${date}`, '10');
    const html = renderToStaticMarkup(React.createElement(QuranWirdGoldenMushaf, { date, theme: 'dark' }));
    assert.ok(html.includes(`src="${getGoldenQuranPageUrl(page)}"`));
    assert.ok(!html.includes(`src="${getGoldenQuranPageUrl(10)}"`));
    assert.equal(userStorage.getItem(`islambook_quran_wird_page_${date}`), '10');
  }
});
