import test from 'node:test';
import assert from 'node:assert/strict';
import { accountConflictQuery, assertNoAccountConflict, prepareAccountTransfer, transferredAccountMatches, transferSummary } from '../scripts/lib/accountTransfer';

function fixture() {
  const account = {
    id: 'account-identifier', userCode: 'A'.repeat(24), username: 'tetete', name: 'Transfer user', email: 'transfer@example.test',
    passwordHash: 'a'.repeat(128), salt: 'b'.repeat(32), role: 'super_admin', status: 'active',
    authVersion: 3, sessions: [{ id: 'local-session' }], reset: { hash: 'obsolete-reset' }, revision: 7,
    createdAt: '2026-01-01T00:00:00Z', lastLoginAt: '2026-10-14T00:00:00Z',
    state: { days: { '2026-10-14': { date: '2026-10-14', notes: 'Day notes', tasks: [{ id: 'task', title: 'Keep me', time: '10:30', status: 'done', notes: 'Task notes', categoryId: 'custom' }], deletedTaskIds: { removed: '2026-10-13T00:00:00Z' } } }, habits: [{ id: 'habit', streak: 8 }], recurring: [{ id: 'recurring' }], settings: { lang: 'ar', theme: 'dark' }, versions: { settings: 10 }, workspace: { view: 'cards', categories: [{ id: 'custom', name: 'Custom card' }] } },
  };
  const event = { id: 'audit', actorId: account.id, actorName: account.name, action: 'auth.login', targetId: account.id, at: '2026-10-14T00:00:00Z', reason: 'Successful credential sign-in' };
  return { format: 2, accounts: { [account.id]: account }, audits: [event, { ...event, id: 'unrelated', actorId: 'other', targetId: 'other' }], grants: { secret: { id: 'grant-not-transferred' } } };
}

test('account transfer preserves identity, hashed password and complete planner state without copying live authorization', () => {
  const store = fixture(), before = structuredClone(store);
  const result = prepareAccountTransfer(store, 'tetete');
  const source = store.accounts['account-identifier'];
  assert.equal(result.account.id, source.id); assert.equal(result.account.userCode, source.userCode);
  assert.equal(result.account.passwordHash, source.passwordHash); assert.equal(result.account.salt, source.salt);
  assert.equal(result.account.role, 'super_admin'); assert.equal(result.account.authVersion, 4);
  assert.deepEqual(result.account.sessions, []); assert.equal(result.account.reset, undefined);
  assert.deepEqual(result.account.state, source.state); assert.deepEqual(store, before);
  assert.deepEqual(result.audits, [store.audits[0]]);
  assert.deepEqual(transferSummary(result), { username: 'tetete', role: 'super_admin', days: 1, tasks: 1, habits: 1, recurring: 1, auditEvents: 1 });
  assert.ok(!JSON.stringify(transferSummary(result)).includes(source.passwordHash));
  assert.ok(!JSON.stringify(result).includes('local-session')); assert.ok(!JSON.stringify(result).includes('obsolete-reset')); assert.ok(!JSON.stringify(result).includes('grant-not-transferred'));
});

test('old local stores receive compatible defaults without changing the original document', () => {
  const a: any = fixture().accounts['account-identifier'];
  delete a.role; delete a.status; delete a.authVersion; delete a.state.settings; delete a.state.versions;
  const original = structuredClone(a);
  const result = prepareAccountTransfer({ [a.id]: a }, 'TETETE');
  assert.equal(result.account.role, 'user'); assert.equal(result.account.status, 'active'); assert.equal(result.account.authVersion, 1);
  assert.deepEqual(result.account.state.settings, {}); assert.deepEqual(a, original);
});

test('transfer rejects missing, duplicate or malformed accounts and audit entries', () => {
  assert.throws(() => prepareAccountTransfer(fixture(), 'missing'));
  assert.throws(() => prepareAccountTransfer(null, 'tetete'));
  const store: any = fixture(); store.accounts.other = structuredClone(store.accounts['account-identifier']);
  assert.throws(() => prepareAccountTransfer(store, 'tetete'));
  const badHash = fixture(); badHash.accounts['account-identifier'].passwordHash = 'plaintext';
  assert.throws(() => prepareAccountTransfer(badHash, 'tetete'));
  const badRole: any = fixture(); badRole.accounts['account-identifier'].role = 'owner';
  assert.throws(() => prepareAccountTransfer(badRole, 'tetete'));
  const badAudit = fixture(); badAudit.audits.push({ ...badAudit.audits[0] });
  assert.throws(() => prepareAccountTransfer(badAudit, 'tetete'));
});

test('collision detection covers IDs, username, code and email and refuses all existing accounts', () => {
  const a = prepareAccountTransfer(fixture(), 'tetete').account;
  assert.deepEqual(accountConflictQuery(a), { $or: [{ id: a.id }, { username: a.username }, { userCode: a.userCode }, { email: a.email }] });
  delete a.email; assert.equal(accountConflictQuery(a).$or.length, 3);
  assert.doesNotThrow(() => assertNoAccountConflict(null));
  assert.throws(() => assertNoAccountConflict({ id: 'existing' }));
});

test('read-back verification detects lost state, changed credentials or imported reset links while allowing Mongo metadata', () => {
  const a = prepareAccountTransfer(fixture(), 'tetete').account;
  assert.ok(transferredAccountMatches(a, { ...structuredClone(a), _id: 'mongo-id', __v: 0 }));
  const missing = structuredClone(a); missing.state.days = {};
  assert.equal(transferredAccountMatches(a, missing), false);
  assert.equal(transferredAccountMatches(a, { ...a, passwordHash: 'c'.repeat(128) }), false);
  assert.equal(transferredAccountMatches(a, { ...a, reset: { hash: 'should-not-exist' } }), false);
  assert.equal(transferredAccountMatches(a, null), false);
});
