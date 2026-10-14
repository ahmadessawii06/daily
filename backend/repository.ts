import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import mongoose, { Schema } from 'mongoose';
import { connectToDatabase, getDbLastError, isDbConnected } from './mongodb.js';
import type { DayRecord, HabitStreak, PlannerWorkspace, RecurringItem, User } from '../src/types';
import { ROLES, type Role, type AuthSession, type AuditEntry, type SupportGrant } from '../src/shared/admin.js';

export interface Account extends User {
  username: string;
  passwordHash: string;
  salt: string;
  revision: number;
  role?: Role;
  authVersion?: number;
  sessions?: AuthSession[];
  deletedAt?: string | null;
  reset?: { hash: string; expiresAt: string; requestedAt: string; usedAt?: string };
  state: {
    days: Record<string, DayRecord>;
    habits: HabitStreak[];
    recurring: RecurringItem[];
    settings: Record<string, any>;
    workspace?: PlannerWorkspace;
    versions: Record<string, number>;
  };
}

const AccountModel = mongoose.models.Account || mongoose.model('Account', new Schema({
  id: { type: String, required: true, unique: true },
  userCode: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, sparse: true, unique: true },
  createdAt: String,
  role: { type: String, enum: ROLES, default: 'user' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  lastLoginAt: String, deletedAt: String,
  authVersion: { type: Number, default: 0 },
  sessions: { type: Schema.Types.Mixed, default: [] },
  reset: Schema.Types.Mixed,
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  revision: { type: Number, default: 0 },
  // Validated at the API boundary; Mixed retains all task and recurring fields.
  state: { type: Schema.Types.Mixed, required: true },
}, { autoCreate: false, autoIndex: false, minimize: false }));

// MongoDB documents saved with minimize enabled may omit empty Mixed objects.
// Restore missing fields on reads and before merges, retaining existing data.
export function normalizeAccount(account: Account | null): Account | null {
  if (!account) return null;
  account.role = ROLES.includes(account.role as Role) ? account.role : 'user';
  account.status = account.status === 'suspended' ? 'suspended' : 'active';
  account.authVersion ??= 0;
  account.sessions ??= [];
  account.state ??= {} as Account['state'];
  account.state.days ??= {};
  account.state.habits ??= [];
  account.state.recurring ??= [];
  account.state.settings ??= {};
  account.state.versions ??= {};
  return account;
}

let accountInitialization: Promise<void> | null = null;

async function initializeAccounts(): Promise<void> {
  if (!accountInitialization) {
    accountInitialization = (async () => {
      await AccountModel.createCollection();
      // Keep unique indexes for account IDs, usernames and email addresses.
      await AccountModel.createIndexes();
    })().catch(error => {
      accountInitialization = null;
      throw error;
    });
  }
  await accountInitialization;
}

export const dataDir = () => path.resolve(process.env.DATA_DIR || 'data');
export const isServerless = () => !!(process.env.VERCEL || process.env.NETLIFY);

async function useMongo(): Promise<boolean> {
  if (process.env.MONGODB_URI?.trim() && !process.env.MONGODB_URI.includes('<')) {
    await connectToDatabase();
    if (!isDbConnected()) throw new Error(`Database unavailable: ${getDbLastError() || 'connection not ready'}`);
    await initializeAccounts();
    return true;
  }
  if (isServerless() || process.env.NODE_ENV === 'production') throw new Error('MONGODB_URI is required in production');
  return false;
}

interface LocalStore { format: 2; accounts: Record<string, Account>; audits: AuditEntry[]; grants: Record<string, SupportGrant>; }
function readStore(): LocalStore {
  const filename = path.join(dataDir(), 'accounts.json');
  if (!fs.existsSync(filename)) return { format: 2, accounts: {}, audits: [], grants: {} };
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  return data.format === 2 && data.accounts ? data : { format: 2, accounts: data, audits: [], grants: {} };
}
function readAccounts() { return readStore().accounts; }

function writeStore(store: LocalStore): void {
  fs.mkdirSync(dataDir(), { recursive: true });
  const filename = path.join(dataDir(), 'accounts.json');
  const temporary = `${filename}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(store, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, filename);
}
let localWrite: Promise<unknown> = Promise.resolve();
function localTransaction<T>(fn: (store: LocalStore) => Promise<T> | T): Promise<T> {
  const work = localWrite.catch(() => {}).then(async () => { const store = readStore(); const result = await fn(store); writeStore(store); return result; });
  localWrite = work; return work;
}

export async function storageStatus(): Promise<string> {
  return await useMongo() ? 'MongoDB' : 'Local file database';
}

export async function findAccount(identifier: string, byId = false): Promise<Account | null> {
  if (await useMongo()) {
    const account = await AccountModel.findOne(byId ? { id: identifier } : { $or: [{ username: identifier }, { email: identifier }] }).lean() as unknown as Account | null;
    return normalizeAccount(account);
  }
  return normalizeAccount(Object.values(readAccounts()).find(a => byId ? a.id === identifier : a.username === identifier || a.email === identifier) || null);
}

export async function createAccount(account: Account): Promise<void> {
  if (await useMongo()) {
    await AccountModel.create(account);
  } else {
    await localTransaction(store => {
    const accounts = store.accounts;
    if (Object.values(accounts).some(a => a.username === account.username || (account.email && a.email === account.email))) {
      throw Object.assign(new Error('Account already exists'), { code: 11000 });
    }
    accounts[account.id] = account;
    });
  }
}

export async function updateState(id: string, mutate: (state: Account['state']) => void): Promise<Account['state']> {
  if (await useMongo()) {
    // Compare-and-swap prevents concurrent serverless instances losing updates.
    for (let attempt = 0; attempt < 8; attempt++) {
      const account = normalizeAccount(await AccountModel.findOne({ id }).lean() as unknown as Account | null);
      if (!account) throw new Error('Account not found');
      mutate(account.state);
      const result = await AccountModel.updateOne({ id, revision: account.revision }, { $set: { state: account.state }, $inc: { revision: 1 } });
      if (result.modifiedCount) return account.state;
    }
    throw new Error('Concurrent update; please retry');
  }
  // No await between reading and writing: atomic within the single local server.
  return localTransaction(store => {
  const accounts = store.accounts;
  const account = normalizeAccount(accounts[id]);
  if (!account) throw new Error('Account not found');
  mutate(account.state);
  account.revision++;
  return account.state;
  });
}

const AuditModel = mongoose.models.AdminAudit || mongoose.model('AdminAudit', new Schema({ id: { type: String, unique: true }, actorId: String, actorName: String, action: String, targetId: String, at: String, reason: String }, { autoCreate: false, autoIndex: false }));
const GrantModel = mongoose.models.SupportGrant || mongoose.model('SupportGrant', new Schema({ id: { type: String, unique: true }, actorId: String, targetId: String, actorVersion: Number, targetVersion: Number, actorSessionId: String, expiresAt: String, endedAt: String }, { autoCreate: false, autoIndex: false }));
const ControlModel = mongoose.models.AdminControl || mongoose.model('AdminControl', new Schema({ id: { type: String, unique: true }, epoch: Number }, { autoCreate: false, autoIndex: false }));
let securityReady: Promise<void> | null = null;
async function initializeSecurity() {
  securityReady ||= (async () => {
    for (const model of [AuditModel, GrantModel, ControlModel]) { await model.createCollection(); await model.createIndexes(); }
    await AuditModel.collection.createIndex({ at: -1 });
    await AccountModel.collection.createIndex({ createdAt: -1 });
    await AccountModel.collection.createIndex({ 'reset.hash': 1 }, { sparse: true });
    await AuditModel.collection.createIndex({ targetId: 1, at: -1 });
    await AuditModel.collection.createIndex({ actorId: 1, at: -1 });
    await ControlModel.updateOne({ id: 'security' }, { $setOnInsert: { epoch: 0 } }, { upsert: true });
  })().catch(err => { securityReady = null; throw err; });
  await securityReady;
}
export interface SecurityTransaction {
  account(id: string): Promise<Account | null>;
  byReset(hash: string): Promise<Account | null>;
  patch(id: string, changes: Partial<Account>): Promise<void>;
  superAdmins(): Promise<number>;
  audit(entry: AuditEntry): Promise<void>;
  grant(id: string): Promise<SupportGrant | null>;
  putGrant(grant: SupportGrant): Promise<void>;
}
// Every security mutation is serialized, including the "last super admin" check.
// MongoDB transactions also make the mutation and its audit entry atomic.
export async function securityTransaction<T>(fn: (tx: SecurityTransaction) => Promise<T>): Promise<T> {
  if (!await useMongo()) return localTransaction(async store => fn({
    account: async id => normalizeAccount(store.accounts[id] || null),
    byReset: async hash => normalizeAccount(Object.values(store.accounts).find(a => a.reset?.hash === hash) || null),
    patch: async (id, changes) => { const a = store.accounts[id]; if (!a) throw new Error('Account not found'); Object.assign(a, changes); a.revision++; },
    superAdmins: async () => Object.values(store.accounts).filter(a => a.role === 'super_admin' && !a.deletedAt && a.status !== 'suspended').length,
    audit: async entry => { store.audits.push(entry); },
    grant: async id => store.grants[id] || null,
    putGrant: async grant => { store.grants[grant.id] = grant; },
  }));
  await initializeSecurity();
  let result: T;
  await mongoose.connection.transaction(async session => {
    await ControlModel.updateOne({ id: 'security' }, { $inc: { epoch: 1 } }, { session });
    result = await fn({
      account: async id => normalizeAccount(await AccountModel.findOne({ id }).session(session).lean() as unknown as Account | null),
      byReset: async hash => normalizeAccount(await AccountModel.findOne({ 'reset.hash': hash }).session(session).lean() as unknown as Account | null),
      patch: async (id, changes) => {
        const entries = Object.entries(changes), set = Object.fromEntries(entries.filter(([, v]) => v !== undefined)), unset = Object.fromEntries(entries.filter(([, v]) => v === undefined).map(([k]) => [k, 1]));
        await AccountModel.updateOne({ id }, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}), $inc: { revision: 1 } }, { session });
      },
      superAdmins: async () => AccountModel.countDocuments({ role: 'super_admin', deletedAt: null, status: { $ne: 'suspended' } }).session(session),
      audit: async entry => { await AuditModel.create([entry], { session }); },
      grant: async id => await GrantModel.findOne({ id }).session(session).lean() as unknown as SupportGrant | null,
      putGrant: async grant => { await GrantModel.updateOne({ id: grant.id }, { $set: grant }, { upsert: true, session }); },
    });
  });
  return result!;
}
export async function findGrant(id: string): Promise<SupportGrant | null> {
  if (!await useMongo()) return readStore().grants[id] || null;
  await initializeSecurity(); return await GrantModel.findOne({ id }).lean() as unknown as SupportGrant | null;
}
export async function accountRows(): Promise<Account[]> {
  // Exclude credentials, sessions, reset tokens and planner data from the table/dashboard query.
  if (await useMongo()) return await AccountModel.find({}, { passwordHash: 0, salt: 0, state: 0, sessions: 0, reset: 0 }).lean() as unknown as Account[];
  return Object.values(readAccounts()).map(({ passwordHash, salt, state, sessions, reset, ...a }) => a as Account);
}
export async function auditRows(targetId?: string): Promise<AuditEntry[]> {
  if (await useMongo()) { await initializeSecurity(); return await AuditModel.find(targetId ? { $or: [{ targetId }, { actorId: targetId }] } : {}).sort({ at: -1 }).limit(30).lean() as unknown as AuditEntry[]; }
  return readStore().audits.filter(e => !targetId || e.targetId === targetId || e.actorId === targetId).sort((a, b) => b.at.localeCompare(a.at));
}

const literal = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const metadata = { _id: 0, id: 1, userCode: 1, username: 1, name: 1, email: 1, role: 1, status: 1, createdAt: 1, lastLoginAt: 1, deletedAt: 1 };
export async function listAccounts({ q, role, status, page, pageSize }: { q: string; role: string; status: string; page: number; pageSize: number }) {
  if (await useMongo()) {
    const filters: any[] = [status === 'deleted' ? { deletedAt: { $ne: null } } : { deletedAt: null }];
    if (status === 'active') filters.push({ status: { $ne: 'suspended' } });
    else if (status === 'suspended') filters.push({ status: 'suspended' });
    else if (status && status !== 'deleted') filters.push({ id: { $exists: false } });
    if (role) filters.push({ role: role === 'user' ? { $in: ['user', null] } : role });
    if (q) filters.push({ $or: ['name', 'username', 'email', 'id', 'userCode'].map(key => ({ [key]: { $regex: literal(q), $options: 'i' } })) });
    const filter = { $and: filters };
    const [total, users] = await Promise.all([AccountModel.countDocuments(filter), AccountModel.find(filter, metadata).sort({ createdAt: -1, id: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean()]);
    return { total, users: users as unknown as Account[] };
  }
  const users = (await accountRows()).filter(a => {
    const s = a.deletedAt ? 'deleted' : a.status || 'active';
    return (!status ? s !== 'deleted' : s === status) && (!role || (a.role || 'user') === role) && (!q || [a.name, a.username, a.email, a.id, a.userCode].some(v => v?.toLowerCase().includes(q)));
  }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '') || a.id.localeCompare(b.id));
  return { total: users.length, users: users.slice((page - 1) * pageSize, page * pageSize) };
}
export async function accountOverview() {
  if (await useMongo()) {
    const rows = await AccountModel.aggregate([{ $group: { _id: null,
      total: { $sum: { $cond: [{ $not: ['$deletedAt'] }, 1, 0] } },
      active: { $sum: { $cond: [{ $and: [{ $not: ['$deletedAt'] }, { $ne: ['$status', 'suspended'] }] }, 1, 0] } },
      suspended: { $sum: { $cond: [{ $and: [{ $not: ['$deletedAt'] }, { $eq: ['$status', 'suspended'] }] }, 1, 0] } },
      deleted: { $sum: { $cond: ['$deletedAt', 1, 0] } },
      newUsers: { $sum: { $cond: [{ $and: [{ $not: ['$deletedAt'] }, { $gte: ['$createdAt', new Date(Date.now() - 7 * 86400000).toISOString()] }] }, 1, 0] } },
    } }]);
    const { _id, ...counts } = rows[0] || { total: 0, active: 0, suspended: 0, deleted: 0, newUsers: 0 };
    return counts;
  }
  const rows = await accountRows(), current = rows.filter(a => !a.deletedAt);
  return { total: current.length, active: current.filter(a => a.status !== 'suspended').length, suspended: current.filter(a => a.status === 'suspended').length, deleted: rows.length - current.length, newUsers: current.filter(a => Date.parse(a.createdAt || '') >= Date.now() - 7 * 86400000).length };
}
export async function listAudit(q: string, page: number) {
  if (await useMongo()) {
    await initializeSecurity();
    const filter = q ? { $or: ['actorName', 'action', 'targetId', 'reason'].map(key => ({ [key]: { $regex: literal(q), $options: 'i' } })) } : {};
    const [total, events] = await Promise.all([AuditModel.countDocuments(filter), AuditModel.find(filter, { _id: 0, __v: 0 }).sort({ at: -1, id: 1 }).skip((page - 1) * 20).limit(20).lean()]);
    return { total, events: events as unknown as AuditEntry[] };
  }
  const rows = (await auditRows()).filter(e => !q || [e.actorName, e.action, e.targetId, e.reason].some(v => v.toLowerCase().includes(q)));
  return { total: rows.length, events: rows.slice((page - 1) * 20, page * 20) };
}
