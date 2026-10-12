import test from 'node:test';
import assert from 'node:assert/strict';
import { describeDbFailure } from '../src/db/mongodb.js';

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
