import { isDeepStrictEqual } from 'node:util';
import type { Account } from '../../backend/repository.js';
import { ROLES, type AuditEntry } from '../../src/shared/admin.js';

export class TransferError extends Error {}
export interface AccountTransfer { account: Account; audits: AuditEntry[]; }

export function prepareAccountTransfer(store: any, username: string): AccountTransfer {
  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) throw new TransferError('Invalid username');
  const accounts = store?.format === 2 ? store.accounts : store;
  if (!accounts || typeof accounts !== 'object' || Array.isArray(accounts)) throw new TransferError('Invalid local account store');
  const matches = Object.values(accounts).filter((a: any) => a?.username === username.toLowerCase()) as Account[];
  if (matches.length !== 1) throw new TransferError('Expected exactly one matching local account');
  const source = structuredClone(matches[0]);
  if (!source.id || typeof source.id !== 'string' || !/^[A-Fa-f0-9]{24}$/.test(source.userCode || '') || !/^[a-f0-9]{128}$/i.test(source.passwordHash || '') || !/^[a-f0-9]{32}$/i.test(source.salt || '')) throw new TransferError('Invalid account identity or hashed credentials');
  const role = source.role || 'user';
  if (!ROLES.includes(role) || (source.status && !['active', 'suspended'].includes(source.status))) throw new TransferError('Invalid account role or status');
  if (!source.state || typeof source.state !== 'object' || Array.isArray(source.state)) throw new TransferError('Missing planner state');
  const state = source.state;
  state.days ??= {}; state.habits ??= []; state.recurring ??= []; state.settings ??= {}; state.versions ??= {};
  if (typeof state.days !== 'object' || Array.isArray(state.days) || !Array.isArray(state.habits) || !Array.isArray(state.recurring) || !state.settings || typeof state.settings !== 'object' || Array.isArray(state.settings)) throw new TransferError('Invalid planner state');
  if (Object.values(state.days).some(d => !d || !Array.isArray(d.tasks))) throw new TransferError('Invalid day record');
  const version = source.authVersion ?? 0;
  if (!Number.isSafeInteger(version) || version < 0 || version >= Number.MAX_SAFE_INTEGER) throw new TransferError('Invalid session version');
  const account: Account = {
    id: source.id, userCode: source.userCode, username: source.username,
    passwordHash: source.passwordHash, salt: source.salt, state,
    role, status: source.status || 'active', authVersion: version + 1,
    sessions: [], revision: source.revision || 0,
    ...(source.name !== undefined ? { name: source.name } : {}),
    ...(source.email ? { email: source.email } : {}),
    ...(source.createdAt ? { createdAt: source.createdAt } : {}),
    ...(source.lastLoginAt ? { lastLoginAt: source.lastLoginAt } : {}),
    ...(source.deletedAt ? { deletedAt: source.deletedAt } : {}),
  };
  const audits: AuditEntry[] = [];
  const seen = new Set<string>();
  for (const event of Array.isArray(store?.audits) ? store.audits : []) {
    if (event.actorId !== account.id && event.targetId !== account.id) continue;
    const { id, actorId, actorName, action, targetId, at, reason } = event;
    if (![id, actorId, actorName, action, targetId, at, reason].every(v => typeof v === 'string') || !Number.isFinite(Date.parse(at)) || seen.has(id)) throw new TransferError('Invalid or duplicate source audit entry');
    audits.push({ id, actorId, actorName, action, targetId, at, reason }); seen.add(id);
  }
  return { account, audits };
}

export function accountConflictQuery(a: Account) {
  return { $or: [{ id: a.id }, { username: a.username }, { userCode: a.userCode }, ...(a.email ? [{ email: a.email }] : [])] };
}
export function assertNoAccountConflict(existing: unknown) {
  if (existing) throw new TransferError('An Atlas account already uses this ID, username, account code or email. Nothing was overwritten.');
}
export function transferredAccountMatches(expected: Account, actual: any) {
  return !!actual && !actual.reset && Object.entries(expected).every(([key, value]) => isDeepStrictEqual(value, actual[key]));
}
export function transferSummary(transfer: AccountTransfer) {
  const a = transfer.account;
  return { username: a.username, role: a.role, days: Object.keys(a.state.days).length, tasks: Object.values(a.state.days).reduce((n, d) => n + d.tasks.length, 0), habits: a.state.habits.length, recurring: a.state.recurring.length, auditEvents: transfer.audits.length };
}
