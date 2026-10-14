import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import mongoose from 'mongoose';
import '../backend/repository.js';
import { describeDbFailure } from '../backend/mongodb.js';
import { TransferError, prepareAccountTransfer, accountConflictQuery, assertNoAccountConflict, transferredAccountMatches, transferSummary } from './lib/accountTransfer.js';

async function main() {
  const args = process.argv.slice(2), username = args.shift();
  let source: string | undefined, apply = false;
  while (args.length) {
    const arg = args.shift();
    if (arg === '--source' && !source) source = args.shift();
    else if (arg === '--apply' && !apply) apply = true;
    else throw new TransferError('Usage: npm run account:transfer -- username --source accounts.json [--apply]');
  }
  if (!username || !source) throw new TransferError('Usage: npm run account:transfer -- username --source accounts.json [--apply]');
  const filename = path.resolve(source);
  const read = () => {
    try { return JSON.parse(fs.readFileSync(filename, 'utf8')); }
    catch { throw new TransferError('Cannot read the selected local account store'); }
  };
  const transfer = prepareAccountTransfer(read(), username);
  const uri = process.env.MONGODB_URI?.trim();
  const database = uri?.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/)?.[1];
  if (!uri || uri.includes('<') || !database || ['admin', 'config', 'local'].includes(database)) throw new TransferError('Set MONGODB_URI with an explicit application database name in .env. Never pass credentials as command arguments.');
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'read-only preflight', database, ...transferSummary(transfer) }));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 8000, autoCreate: false, autoIndex: false });
  const Account = mongoose.model('Account'), Audit = mongoose.model('AdminAudit'), Control = mongoose.model('AdminControl');
  const conflicts = accountConflictQuery(transfer.account);
  assertNoAccountConflict(await Account.findOne(conflicts).select({ id: 1 }).lean());
  const auditIds = transfer.audits.map(e => e.id);
  if (auditIds.length && await Audit.exists({ id: { $in: auditIds } })) throw new TransferError('Conflicting Atlas audit IDs; nothing was overwritten');
  if (!apply) { console.log('Preflight passed. Use --apply to copy the account and its audit history.'); return; }
  if (!isDeepStrictEqual(transfer, prepareAccountTransfer(read(), username))) throw new TransferError('The source account changed during preflight. Retry using the latest data.');

  const backupDirectory = path.resolve('data/transfer-backups');
  fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
  const backup = path.join(backupDirectory, `${username}-${randomUUID()}.json`);
  fs.writeFileSync(backup, JSON.stringify(transfer, null, 2), { mode: 0o600, flag: 'wx' });
  // Collections/indexes must exist before the transaction. Existing records are never updated.
  for (const model of [Account, Audit, Control]) { await model.createCollection(); await model.createIndexes(); }
  await Control.updateOne({ id: 'security' }, { $setOnInsert: { epoch: 0 } }, { upsert: true });
  await mongoose.connection.transaction(async session => {
    await Control.updateOne({ id: 'security' }, { $inc: { epoch: 1 } }, { session });
    assertNoAccountConflict(await Account.findOne(conflicts).select({ id: 1 }).session(session).lean());
    if (auditIds.length && await Audit.exists({ id: { $in: auditIds } }).session(session)) throw new TransferError('Conflicting Atlas audit IDs; transfer cancelled');
    if (!isDeepStrictEqual(transfer, prepareAccountTransfer(read(), username))) throw new TransferError('The source account changed. Transfer cancelled; retry.');
    await Account.create([transfer.account], { session });
    await Audit.insertMany([...transfer.audits, {
      id: randomUUID(), actorId: transfer.account.id, actorName: transfer.account.name || transfer.account.username,
      action: 'users.import', targetId: transfer.account.id, at: new Date().toISOString(),
      reason: 'Explicit operator-authorized local-to-Atlas account transfer; previous sessions and reset links excluded',
    }], { session });
  });
  const stored = await Account.findOne({ id: transfer.account.id }).lean();
  if (!transferredAccountMatches(transfer.account, stored)) throw new TransferError('Transfer committed but read-back verification failed. Do not retry with an overwrite.');
  const storedEvents = await Audit.find({ id: { $in: auditIds } }, { _id: 0, __v: 0 }).lean();
  if (!isDeepStrictEqual([...transfer.audits].sort((a, b) => a.id.localeCompare(b.id)), storedEvents.sort((a: any, b: any) => a.id.localeCompare(b.id)))) throw new TransferError('Transfer committed but audit read-back verification failed');
  console.log('Transfer committed and verified: identity, password hash, role, full planner state and audit history match. Previous sessions and reset links were excluded.');
  console.log('The local source remains intact. Sign in online with the same username and password.');
}

try { await main(); }
catch (error: any) {
  const message = error instanceof TransferError ? error.message : error?.code === 11000 ? 'Unique account/audit conflict: transfer rolled back; no existing account was overwritten.' : describeDbFailure(error);
  console.error(message); process.exitCode = 1;
} finally { await mongoose.disconnect(); }
