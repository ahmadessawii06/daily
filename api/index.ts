import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'mizan_secure_jwt_secret_2026_auth_platform';

// In-memory / serverless cache for Vercel lambdas
const memoryUsers: Record<string, any> = {};
const memoryDays: Record<string, any> = {};
const memoryHabits: Record<string, any> = {};
const memorySettings: Record<string, any> = {};

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function signJwt(payload: { sub: string; username: string; name: string }, expiresInSeconds = 30 * 24 * 60 * 60): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const data = `${b64Header}.${b64Payload}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');

  return `${data}.${signature}`;
}

function verifyJwt(token: string): any | null {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [b64Header, b64Payload, signature] = parts;
    const data = `${b64Header}.${b64Payload}`;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const cleanUrl = url.replace(/^\/api/, '').split('?')[0];

  // 1. Health
  if (cleanUrl === '/health') {
    return res.status(200).json({
      status: 'online',
      platform: 'Vercel Serverless Function',
      connected: true,
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Register
  if (cleanUrl === '/auth/register' && req.method === 'POST') {
    const { username, password, name, email } = req.body || {};

    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال اسم المستخدم' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'يجب أن تكون كلمة المرور 6 أحرف أو أرقام على الأقل' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const displayName = String(name || cleanUsername).trim();

    if (memoryUsers[cleanUsername]) {
      return res.status(400).json({
        success: false,
        error: 'اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم مستخدم آخر',
      });
    }

    const salt = generateSalt();
    const passHash = hashPassword(password, salt);
    const userId = `usr_${cleanUsername}_${Date.now()}`;

    const user = {
      id: userId,
      username: cleanUsername,
      passwordHash: passHash,
      salt,
      name: displayName,
      email: email ? String(email).trim().toLowerCase() : undefined,
      createdAt: new Date().toISOString(),
    };

    memoryUsers[cleanUsername] = user;

    const token = signJwt({ sub: userId, username: cleanUsername, name: displayName });

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  }

  // 3. Login
  if (cleanUrl === '/auth/login' && req.method === 'POST') {
    const { username, password } = req.body || {};

    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال اسم المستخدم' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'يرجى إدخال كلمة المرور' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = memoryUsers[cleanUsername];

    if (!user) {
      // In serverless cold start if memory is reset, return helpful guidance or authenticate safely
      return res.status(404).json({
        success: false,
        error: 'اسم المستخدم غير مسجل، يرجى إنشاء حساب جديد أولاً بالضغط على (حساب جديد)',
      });
    }

    const inputHash = hashPassword(password, user.salt);
    if (inputHash !== user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: 'كلمة المرور غير صحيحة، يرجى التأكد والمحاولة ثانية',
      });
    }

    const token = signJwt({ sub: user.id, username: user.username, name: user.name });

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  }

  // Authenticated route helper
  const authHeader = req.headers?.authorization;
  let currentUser: any = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    currentUser = verifyJwt(token);
  }

  // 4. Auth Me
  if (cleanUrl === '/auth/me') {
    if (!currentUser) {
      return res.status(401).json({ success: false, error: 'غير مصرح بالدخول' });
    }
    return res.status(200).json({ success: true, user: currentUser });
  }

  // 5. Days
  if (cleanUrl.startsWith('/days')) {
    const userId = currentUser ? currentUser.sub : 'guest';
    if (!memoryDays[userId]) memoryDays[userId] = {};

    if (req.method === 'POST') {
      const date = cleanUrl.replace(/^\/days\/?/, '') || req.body?.date;
      if (date && req.body) {
        memoryDays[userId][date] = { ...req.body, userId, date, updatedAt: new Date().toISOString() };
        return res.status(200).json({ success: true, day: memoryDays[userId][date] });
      }
    }

    if (req.method === 'GET') {
      const date = cleanUrl.replace(/^\/days\/?/, '');
      if (date && memoryDays[userId][date]) {
        return res.status(200).json({ ...memoryDays[userId][date], found: true });
      }
      return res.status(200).json({ days: memoryDays[userId], list: Object.values(memoryDays[userId]) });
    }
  }

  // 6. Sync batch
  if (cleanUrl === '/sync/batch' && req.method === 'POST') {
    const userId = currentUser ? currentUser.sub : 'guest';
    const { days, habits, settings } = req.body || {};
    if (days) memoryDays[userId] = { ...(memoryDays[userId] || {}), ...days };
    if (habits) memoryHabits[userId] = habits;
    if (settings) memorySettings[userId] = { ...(memorySettings[userId] || {}), ...settings };

    return res.status(200).json({
      success: true,
      days: memoryDays[userId] || {},
      habits: memoryHabits[userId] || [],
      settings: memorySettings[userId] || {},
    });
  }

  // Default
  return res.status(200).json({ success: true, message: 'Mizan API Running' });
}
