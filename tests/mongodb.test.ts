import test from 'node:test';
import assert from 'node:assert/strict';
import { describeDbFailure } from '../src/db/mongodb.js';
import mongoose from 'mongoose';
import { storageStatus } from '../backend/repository.js';

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
  } finally {
    Reflect.set(mongoose.connection, 'readyState', 0);
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
  }
});
