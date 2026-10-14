import 'dotenv/config';
import mongoose from 'mongoose';
import { bootstrapSuperAdmin } from '../backend/admin.js';
const username = process.argv[2];
if (!username || !/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) { console.error('Usage: npm run admin:bootstrap -- existing_username'); process.exitCode = 1; }
else {
  try { const name = await bootstrapSuperAdmin(username); console.log(`Super admin enabled for ${name}. Sign in again to obtain a new session.`); }
  catch (error) { console.error((error as Error).message); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
}
