import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDay } from '../backend/app';

test('day validation preserves compact JPEG photos and explicit removals', () => {
  const day = { tasks: [], updatedAt: '2026-10-18T12:00:00.000Z', dayPhoto: 'data:image/jpeg;base64,/9j/2Q==', dayPhotoUpdatedAt: '2026-10-18T12:00:00.000Z' };
  assert.equal(validateDay('2026-10-18', day).dayPhoto, day.dayPhoto);
  assert.equal(validateDay('2026-10-18', { ...day, dayPhoto: '' }).dayPhoto, '');
  for (const value of ['https://example.com/image.jpg', 'data:image/svg+xml;base64,PHN2Zz4=', 'x'.repeat(100001), 123]) {
    assert.throws(() => validateDay('2026-10-18', { ...day, dayPhoto: value }));
  }
  assert.throws(() => validateDay('2026-10-18', { ...day, dayPhotoUpdatedAt: 'invalid' }));
});
