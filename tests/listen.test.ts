import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { listenOnAvailablePort } from '../backend/listen';

const close = (server: Server) => new Promise<void>(resolve => server.close(() => resolve()));

test('development skips an occupied port while production reports the conflict', async () => {
  const occupied = createServer();
  const development = createServer();
  const production = createServer();
  try {
    const port = await listenOnAvailablePort(occupied, 0, false);
    const actual = await listenOnAvailablePort(development, port, true);
    assert.ok(actual > port);
    assert.equal(development.listenerCount('error'), 0);
    await assert.rejects(listenOnAvailablePort(production, port, false), { code: 'EADDRINUSE' });
  } finally { await Promise.all([close(occupied), close(development), close(production)]); }
});

test('invalid port values return clear configuration errors', async () => {
  const server = createServer();
  for (const port of [-1, NaN, 65536, 1.5]) {
    await assert.rejects(listenOnAvailablePort(server, port, true), /PORT must be an integer/);
  }
});
