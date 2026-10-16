import test from 'node:test';
import assert from 'node:assert/strict';
import { describeDbFailure } from '../backend/mongodb.js';
import mongoose from 'mongoose';
import { normalizeAccount, storageStatus, findAccount, updateState, type Account } from '../backend/repository.js';

test('MongoDB diagnostics classify failures without leaking connection credentials', () => {
  const secret = 'mongodb+srv://private-user:private-password@private-host/';
  const cases = [
    [{ code: 18, message: `bad auth ${secret}` }, 'Authentication failed:'],
    [{ code: 'ENOTFOUND', message: secret }, 'DNS lookup failed:'],
    [{ name: 'MongoParseError', message: secret }, 'Invalid MongoDB URI:'],
    [{ message: `TLS certificate failure ${secret}` }, 'TLS connection failed:'],
    [{ name: 'MongooseServerSelectionError', message: secret }, 'Cluster unreachable:'],
    [{ message: secret }, 'MongoDB connection failed:'],
  ] as const;
  for (const [error, prefix] of cases) {
    const description = describeDbFailure(error);
    assert.ok(description.startsWith(prefix));
    assert.ok(!/private-|mongodb\+srv/.test(description));
  }
});

test('accounts initialize collections and unique indexes only after connection, and retry failures', async t => {
  const model = mongoose.models.Account;
  // This used to cache a createCollection failure during module import.
  await model.init();
  assert.equal(mongoose.connection.readyState, 0);
  const previousUri = process.env.MONGODB_URI;
  const calls: string[] = [];
  let fail = true;
  t.mock.method(mongoose, 'connect', async () => {
    calls.push('connect');
    Reflect.set(mongoose.connection, 'readyState', 1);
    return mongoose;
  });
  t.mock.method(model, 'createCollection', async () => {
    assert.equal(mongoose.connection.readyState, 1);
    calls.push('collection');
    if (fail) { fail = false; throw new Error('temporary initialization failure'); }
  });
  t.mock.method(model, 'createIndexes', async () => { calls.push('indexes'); });
  try {
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    await assert.rejects(storageStatus(), /temporary initialization failure/);
    assert.equal(await storageStatus(), 'MongoDB');
    assert.equal(await storageStatus(), 'MongoDB');
    assert.deepEqual(calls, ['connect', 'collection', 'collection', 'indexes']);
    const saved: any = { id: 'old-account', revision: 0, state: { habits: [{ id: 'habit', title: 'Keep me' }] } };
    t.mock.method(model, 'findOne', () => ({ lean: async () => structuredClone(saved) }));
    t.mock.method(model, 'updateOne', async (filter: any, update: any) => {
      assert.equal(filter.revision, saved.revision);
      saved.state = update.$set.state;
      saved.revision++;
      return { modifiedCount: 1 };
    });
    assert.deepEqual((await findAccount(saved.id, true))?.state.days, {});
    const date = '2026-10-12';
    const state = await updateState(saved.id, state => {
      state.days[date] = { date, tasks: [], updatedAt: '2026-10-12T10:00:00.000Z' };
      state.versions.settings = 1;
    });
    assert.equal(state.days[date].date, date);
    assert.deepEqual(saved.state.habits, [{ id: 'habit', title: 'Keep me' }]);
    assert.equal(saved.state.versions.settings, 1);
  } finally {
    Reflect.set(mongoose.connection, 'readyState', 0);
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
  }
});

test('new accounts retain empty sync objects and older accounts get missing fields', () => {
  const empty = { days: {}, habits: [], recurring: [], settings: {}, versions: {} };
  const document = new mongoose.models.Account({ state: empty }).toObject();
  assert.deepEqual(document.state, empty);
  assert.deepEqual(normalizeAccount({ state: undefined } as unknown as Account)?.state, empty);
  assert.equal(normalizeAccount(null), null);
  const legacy = normalizeAccount({ state: { workspace: { view: 'cards', categories: [{ id: 'custom', name: 'Keep me' }] } } } as unknown as Account);
  assert.equal(legacy?.state.workspace?.categories[0].name, 'Keep me');
  assert.equal(legacy?.state.workspace?.categories[0].updatedAt, '1970-01-01T00:00:00.000Z');
});
