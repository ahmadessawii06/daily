import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { dataDir, isServerless } from './repository';

const scrypt = promisify(crypto.scrypt);
let localSecret: string | undefined;

function secret(): string {
  const configured = process.env.JWT_SECRET?.trim();
  if (configured) {
    if (configured.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
    return configured;
  }
  if (isServerless() || process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production');
  if (!localSecret) {
    fs.mkdirSync(dataDir(), { recursive: true });
    const filename = path.join(dataDir(), '.session-secret');
    if (!fs.existsSync(filename)) fs.writeFileSync(filename, crypto.randomBytes(48).toString('hex'), { flag: 'wx', mode: 0o600 });
    localSecret = fs.readFileSync(filename, 'utf8').trim();
  }
  return localSecret;
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return (await scrypt(password, salt, 64) as Buffer).toString('hex');
}

export async function matchesPassword(password: string, salt: string, stored: string): Promise<boolean> {
  const actual = Buffer.from(await hashPassword(password, salt), 'hex');
  const expected = Buffer.from(stored, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function signToken(id: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 30 * 86400 })).toString('base64url');
  const data = `${header}.${payload}`;
  return `${data}.${crypto.createHmac('sha256', secret()).update(data).digest('base64url')}`;
}

export function verifyToken(token: string): string | null {
  const key = secret();
  try {
    const [header, payload, signature, extra] = token.split('.');
    if (!header || !payload || !signature || extra) return null;
    if (JSON.parse(Buffer.from(header, 'base64url').toString()).alg !== 'HS256') return null;
    const expected = crypto.createHmac('sha256', key).update(`${header}.${payload}`).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof parsed.sub === 'string' && typeof parsed.exp === 'number' && parsed.exp > Date.now() / 1000 ? parsed.sub : null;
  } catch { return null; }
}
