import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDay } from '../backend/app';
import { prepareDayForSync } from '../src/utils/dayPhoto';
import { syncHelp } from '../src/utils/syncHelp';

test('legacy empty photo values do not block day synchronization', async () => {
  const day = { date: '2026-10-18', tasks: [], updatedAt: '2026-10-18T12:00:00.000Z', dayPhoto: null };
  assert.equal(validateDay(day.date, day).dayPhoto, '');
  assert.equal(day.dayPhoto, null);
  const normalized = await prepareDayForSync(day as any);
  assert.equal(normalized.dayPhoto, '');
  assert.equal(normalized.updatedAt, day.updatedAt);
});

test('days need no photo, nullable galleries are absent, and galleries supersede legacy photos', async () => {
  const day = { date: '2026-10-20', tasks: [], notes: 'Journal only', updatedAt: '2026-10-20T12:00:00Z' };
  assert.equal(validateDay(day.date, await prepareDayForSync(day)).notes, day.notes);
  assert.equal((await prepareDayForSync({ ...day, dayPhotos: null } as any)).dayPhotos, undefined);
  assert.deepEqual((await prepareDayForSync({ ...day, dayPhoto: 'obsolete', dayPhotos: [] })).dayPhotos, []);
});

test('sync keeps valid photos and identifies the date of damaged photos without deleting them', async () => {
  const day = { date: '2026-10-18', tasks: [], updatedAt: '2026-10-18T12:00:00Z', dayPhoto: 'data:image/jpeg;base64,/9j/2Q==' };
  assert.deepEqual(await prepareDayForSync(day), day);
  const damaged = { ...day, dayPhoto: 'broken' };
  await assert.rejects(prepareDayForSync(damaged), /Invalid day photo \(2026-10-18\)/);
  assert.equal(damaged.dayPhoto, 'broken');
  assert.match(syncHelp('Invalid day photo (2026-10-18)', 'en'), /Open the indicated day/);
  assert.match(syncHelp('Failed to fetch', 'en'), /internet/);
});

test('sync converts legacy PNG and oversized JPEG into compact JPEG', async () => {
  const oldImage = globalThis.Image;
  const oldDocument = globalThis.document;
  const output = 'data:image/jpeg;base64,/9j/2Q==';
  let encodes = 0;
  Object.assign(globalThis, {
    Image: class { naturalWidth = 1000; naturalHeight = 1000; async decode() {} },
    document: { createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {}, drawImage() {} }), toDataURL: () => ++encodes <= 4 ? 'data:image/jpeg;base64,' + 'A'.repeat(100000) : output }) },
  });
  try {
    const day = { date: '2026-10-18', tasks: [], updatedAt: '2026-10-18T12:00:00Z', dayPhoto: 'data:image/png;base64,AAAA', dayPhotos: ['data:image/jpeg;base64,' + 'A'.repeat(100000)] };
    const result = await prepareDayForSync(day);
    assert.equal(result.dayPhoto, '', 'The gallery supersedes the legacy single-photo field');
    assert.deepEqual(result.dayPhotos, [output]);
    assert.equal(day.dayPhoto, 'data:image/png;base64,AAAA');
    assert.equal(result.updatedAt, day.updatedAt);
  } finally { Object.assign(globalThis, { Image: oldImage, document: oldDocument }); }
});

test('day validation preserves compact JPEG photos and explicit removals', () => {
  const day = { tasks: [], updatedAt: '2026-10-18T12:00:00.000Z', dayPhoto: 'data:image/jpeg;base64,/9j/2Q==', dayPhotoUpdatedAt: '2026-10-18T12:00:00.000Z' };
  assert.equal(validateDay('2026-10-18', day).dayPhoto, day.dayPhoto);
  assert.equal(validateDay('2026-10-18', { ...day, dayPhoto: '' }).dayPhoto, '');
  for (const value of ['https://example.com/image.jpg', 'data:image/svg+xml;base64,PHN2Zz4=', 'x'.repeat(100001), 123]) {
    assert.throws(() => validateDay('2026-10-18', { ...day, dayPhoto: value }));
  }
  assert.throws(() => validateDay('2026-10-18', { ...day, dayPhotoUpdatedAt: 'invalid' }));
});

test('day validation preserves multiple photos and explicit gallery removals', () => {
  const photo = 'data:image/jpeg;base64,/9j/2Q==';
  const day = { tasks: [], updatedAt: '2026-10-18T12:00:00.000Z', dayPhotos: [photo, photo] };
  assert.deepEqual(validateDay('2026-10-18', day).dayPhotos, [photo, photo]);
  assert.deepEqual(validateDay('2026-10-18', { ...day, dayPhotos: [] }).dayPhotos, []);
  for (const dayPhotos of [photo, [null], [''], ['https://example.com/image.jpg']]) {
    assert.throws(() => validateDay('2026-10-18', { ...day, dayPhotos }));
  }
});
