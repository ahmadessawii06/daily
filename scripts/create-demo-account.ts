import 'dotenv/config';
import { randomBytes, randomUUID } from 'node:crypto';
import { createAccount, findAccount } from '../backend/repository.js';
import { hashPassword } from '../backend/security.js';
import { createWorkspace } from '../src/shared/workspace.js';

async function main() {
  const username = 'demo_user';
  const existing = await findAccount(username);
  if (existing) {
    console.log(`Demo account '${username}' already exists.`);
    return;
  }

  const salt = randomBytes(16).toString('hex');
  const passwordHash = await hashPassword('Password123', salt);

  const account = {
    id: randomUUID(),
    userCode: randomBytes(12).toString('hex').toUpperCase(),
    username,
    name: 'مستخدم تجريبي',
    email: 'demo@mizan.local',
    createdAt: new Date().toISOString(),
    salt,
    passwordHash,
    revision: 0,
    role: 'user' as const,
    status: 'active' as const,
    authVersion: 0,
    sessions: [],
    state: {
      days: {},
      habits: [],
      recurring: [],
      settings: {},
      versions: {},
      workspace: createWorkspace('cards', new Date().toISOString()),
    },
  };

  await createAccount(account);
  console.log(`Created demo account:
Username: demo_user
Password: Password123
User code: ${account.userCode}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
