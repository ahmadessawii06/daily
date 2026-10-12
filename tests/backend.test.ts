import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import { createApiApp } from '../backend/app';
import { createNetlifyHandler, handler as productionNetlifyHandler } from '../netlify/functions/api';
import mongoose from 'mongoose';

test('API authentication, durable storage, isolation and conflicts', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mizan-test-'));
  process.env.DATA_DIR = directory;
  process.env.MONGODB_URI = '';
  process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
  process.env.NODE_ENV = 'test';
  let server: Server;
  let base: string;
  const start = async () => {
    server = createApiApp().listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  };
  const stop = () => new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  const request = async (route: string, body?: any, token?: string) => {
    const response = await fetch(base + route, { method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, data: await response.json() };
  };
  try {
    await start();
    const first = await request('/auth/register', { username: 'alice', password: 'secret pass ', name: 'Alice' });
    const second = await request('/auth/register', { username: 'bob', password: 'another password' });
    const token = first.data.token;
    await t.test('registration returns consistent user identity and real signed token', () => {
      assert.equal(first.status, 201); assert.ok(first.data.user.userCode); assert.equal(token.split('.').length, 3);
      assert.equal(first.data.user.passwordHash, undefined);
    });
    await t.test('password whitespace remains significant and duplicates are rejected', async () => {
      assert.equal((await request('/auth/login', { username: 'alice', password: 'secret pass' })).status, 401);
      assert.equal((await request('/auth/login', { username: 'alice', password: 'secret pass ' })).status, 200);
      assert.equal((await request('/auth/register', { username: 'alice', password: 'new password' })).status, 409);
    });
    await t.test('unauthenticated and forged requests cannot read or write shared guest data', async () => {
      assert.equal((await request('/days')).status, 401);
      assert.equal((await request('/sync/batch', { days: {} }, 'forged')).status, 401);
      assert.equal((await request('/days', undefined, `${token.slice(0, -4)}AAAA`)).status, 401);
    });
    const task = { id: 'task-one', title: 'Study', time: '09:30', endTime: '10:45', duration: 75,
      status: 'pending', priority: 'high', deadline: '2026-12-01', isTopFocus: true, recurringTemplateId: 'rec-one',
      createdAt: '2026-10-01T09:00:00.000Z', updatedAt: '2026-10-01T09:00:00.000Z' };
    const day = { date: '2026-10-01', tasks: [task], updatedAt: task.updatedAt, dayNote: 'Important day' };
    await t.test('task fields and notes round trip; second account sees no first-account data', async () => {
      assert.equal((await request('/sync/batch', { days: { [day.date]: day } }, token)).status, 200);
      const loaded = (await request(`/days/${day.date}`, undefined, token)).data;
      assert.deepEqual(loaded.tasks[0], task); assert.equal(loaded.dayNote, day.dayNote);
      assert.deepEqual((await request('/days', undefined, second.data.token)).data.days, {});
      const mongoRecord = new mongoose.models.Account({ state: { days: { [day.date]: day } } }).toObject().state.days[day.date];
      for (const key of ['duration', 'endTime', 'priority', 'deadline', 'isTopFocus', 'recurringTemplateId', 'createdAt']) {
        assert.equal(mongoRecord.tasks[0][key], (task as any)[key]);
      }
    });
    await t.test('invalid dates and tasks return 400 rather than apparent success', async () => {
      assert.equal((await request('/days/2026-02-30', day, token)).status, 400);
      assert.equal((await request(`/days/${day.date}`, { ...day, tasks: [{ ...task, status: 'invalid' }] }, token)).status, 400);
      assert.equal((await request('/missing-endpoint', undefined, token)).status, 404);
    });
    await t.test('deletion survives stale offline uploads and explicit restoration works', async () => {
      const deletionTime = '2026-10-01T10:00:00.000Z';
      await request('/sync/batch', { days: { [day.date]: { ...day, tasks: [], updatedAt: deletionTime, deletedTaskIds: { [task.id]: deletionTime } } } }, token);
      await request('/sync/batch', { days: { [day.date]: day } }, token);
      assert.deepEqual((await request(`/days/${day.date}`, undefined, token)).data.tasks, []);
      const restored = { ...day, tasks: [{ ...task, updatedAt: '2026-10-01T11:00:00.000Z' }], updatedAt: '2026-10-01T11:00:00.000Z' };
      await request('/sync/batch', { days: { [day.date]: restored } }, token);
      assert.equal((await request(`/days/${day.date}`, undefined, token)).data.tasks.length, 1);
    });
    await t.test('habit and recurring deletions persist and settings cannot change account identity', async () => {
      await request('/sync/batch', { habits: [{ id: 'h', title: 'Habit' }], recurring: [{ id: 'r', title: 'Recurring' }], settings: { theme: 'light', userId: second.data.user.id }, versions: { habits: 1, recurring: 1, settings: 1 } }, token);
      await request('/sync/batch', { habits: [], recurring: [], versions: { habits: 2, recurring: 2 } }, token);
      const result = (await request('/sync/batch', { days: {} }, token)).data;
      assert.deepEqual(result.habits, []); assert.deepEqual(result.recurring, []);
      assert.equal(result.settings.theme, 'light'); assert.equal(result.settings.userId, undefined);
    });
    await t.test('server restart retains accounts and data', async () => {
      await stop(); await start();
      assert.equal((await request('/auth/login', { username: 'alice', password: 'secret pass ' })).status, 200);
      assert.equal((await request(`/days/${day.date}`, undefined, token)).data.tasks[0].time, '09:30');
    });
    await t.test('Netlify adapter serves the same authenticated API', async () => {
      const netlifyHandler = createNetlifyHandler(createApiApp());
      const result = await netlifyHandler({ path: '/.netlify/functions/api/api/days', httpMethod: 'GET',
        headers: { authorization: `Bearer ${token}` }, body: null, isBase64Encoded: false,
        requestContext: { identity: {} } }, {}) as any;
      assert.equal(result.statusCode, 200); assert.ok(JSON.parse(result.body).days[day.date]);
    });
    await t.test('Netlify enforces production configuration even without platform environment flags', async () => {
      const result = await productionNetlifyHandler({ path: '/api/health', httpMethod: 'GET', headers: {}, body: null, requestContext: { identity: {} } }, {}) as any;
      assert.equal(result.statusCode, 503); assert.equal(JSON.parse(result.body).connected, false);
    });
    await t.test('serverless refuses temporary file fallback when MongoDB is missing', async () => {
      process.env.VERCEL = '1';
      try { assert.equal((await request('/health')).status, 503); }
      finally { delete process.env.VERCEL; }
    });
  } finally {
    await stop();
    assert.ok(directory.startsWith(os.tmpdir()) && path.basename(directory).startsWith('mizan-test-'));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
