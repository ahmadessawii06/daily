import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import mongoose, { Schema } from 'mongoose';
import { connectToDatabase, getDbLastError, isDbConnected } from './mongodb.js';
import type { DayRecord, HabitStreak, PlannerWorkspace, RecurringItem, User } from '../src/types';

export interface Account extends User {
  username: string;
  passwordHash: string;
  salt: string;
  revision: number;
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

function readAccounts(): Record<string, Account> {
  const filename = path.join(dataDir(), 'accounts.json');
  if (!fs.existsSync(filename)) return {};
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function writeAccounts(accounts: Record<string, Account>): void {
  fs.mkdirSync(dataDir(), { recursive: true });
  const filename = path.join(dataDir(), 'accounts.json');
  const temporary = `${filename}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(accounts, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, filename);
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
    const accounts = readAccounts();
    if (Object.values(accounts).some(a => a.username === account.username || (account.email && a.email === account.email))) {
      throw Object.assign(new Error('Account already exists'), { code: 11000 });
    }
    accounts[account.id] = account;
    writeAccounts(accounts);
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
  const accounts = readAccounts();
  const account = normalizeAccount(accounts[id]);
  if (!account) throw new Error('Account not found');
  mutate(account.state);
  account.revision++;
  writeAccounts(accounts);
  return account.state;
}
