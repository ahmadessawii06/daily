import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import {
  connectToDatabase,
  isDbConnected,
  getDbLastError,
  DayModel,
  HabitModel,
  SettingsModel,
  UserModel,
} from './src/db/mongodb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'mizan_super_secure_jwt_secret_key_2026_948274910';

// Enable CORS for mobile browsers, PWAs, and cross-origin previews
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// Cryptographic Utilities
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_mizan_secure_salt_2026').digest('hex');
}

export interface JwtPayload {
  sub: string; // userId
  username: string;
  name?: string;
  iat: number;
  exp: number;
}

function signJwt(payload: { sub: string; username: string; name?: string }, expiresInSeconds = 30 * 24 * 60 * 60): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const data = `${b64Header}.${b64Payload}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');

  return `${data}.${signature}`;
}

function verifyJwt(token: string): JwtPayload | null {
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

    const payload: JwtPayload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

// Memory fallback stores strictly isolated per userId
const memoryDaysStore: Record<string, Record<string, any>> = {};
const memoryHabitsStore: Record<string, any[]> = {};
const memorySettingsStore: Record<string, any> = {};
const memoryUsersStore: Record<string, any> = {};

// Initial background connection attempt
connectToDatabase().catch(() => {});

// Authentication Middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'غير مصرح بالدخول، يرجى تسجيل الدخول' });
  }

  const token = authHeader.substring(7).trim();
  const payload = verifyJwt(token);
  if (!payload || !payload.sub) {
    return res.status(401).json({ success: false, error: 'جلسة تسجيل الدخول منتهية أو غير صالحة' });
  }

  (req as any).user = {
    id: payload.sub,
    username: payload.username,
    name: payload.name,
  };
  next();
}

// API Routes
const apiRouter = express.Router();

// 1. Health check & DB status
apiRouter.get('/health', async (_req, res) => {
  try {
    if (!isDbConnected()) {
      await connectToDatabase();
    }
    res.json({
      status: 'online',
      database: 'MongoDB Atlas',
      connected: isDbConnected(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.json({
      status: 'offline',
      database: 'MongoDB Atlas',
      connected: false,
      error: err.message,
    });
  }
});

// 2. Auth Routes
apiRouter.post('/auth/register', async (req, res) => {
  const { username, password, name, email } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'اسم المستخدم وكلمة المرور مطلوبان' });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const displayName = String(name || cleanUsername).trim();
  const passHash = hashPassword(String(password));

  try {
    if (isDbConnected()) {
      const existing = await UserModel.findOne({ username: cleanUsername });
      if (existing) {
        return res.status(400).json({ success: false, error: 'اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر' });
      }

      const newUser = await UserModel.create({
        username: cleanUsername,
        passwordHash: passHash,
        name: displayName,
        email: email ? String(email).trim().toLowerCase() : undefined,
      });

      const userId = newUser._id.toString();
      const userObj = {
        id: userId,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
      };

      const token = signJwt({ sub: userId, username: cleanUsername, name: displayName });
      memoryUsersStore[cleanUsername] = { ...userObj, passwordHash: passHash };

      return res.json({
        success: true,
        user: userObj,
        token,
        source: 'mongodb',
      });
    }
  } catch (err: any) {
    console.warn('MongoDB Register Notice:', err.message);
  }

  // Memory fallback
  if (memoryUsersStore[cleanUsername]) {
    return res.status(400).json({ success: false, error: 'اسم المستخدم مستخدم بالفعل' });
  }

  const userId = `user-${Date.now()}`;
  const memUser = {
    id: userId,
    username: cleanUsername,
    name: displayName,
    email: email ? String(email).trim().toLowerCase() : undefined,
    passwordHash: passHash,
    createdAt: new Date().toISOString(),
  };
  memoryUsersStore[cleanUsername] = memUser;
  const token = signJwt({ sub: userId, username: cleanUsername, name: displayName });

  return res.json({
    success: true,
    user: {
      id: memUser.id,
      username: memUser.username,
      name: memUser.name,
      email: memUser.email,
      createdAt: memUser.createdAt,
    },
    token,
    source: 'memory',
  });
});

apiRouter.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const inputHash = hashPassword(String(password));

  try {
    if (isDbConnected()) {
      const user = await UserModel.findOne({ username: cleanUsername });
      if (user && user.passwordHash === inputHash) {
        const userId = user._id.toString();
        const token = signJwt({ sub: userId, username: user.username, name: user.name });
        return res.json({
          success: true,
          user: {
            id: userId,
            username: user.username,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
          },
          token,
          source: 'mongodb',
        });
      }
    }
  } catch (err: any) {
    console.warn('MongoDB Login Notice:', err.message);
  }

  // Memory fallback
  const mem = memoryUsersStore[cleanUsername];
  if (mem && mem.passwordHash === inputHash) {
    const token = signJwt({ sub: mem.id, username: mem.username, name: mem.name });
    return res.json({
      success: true,
      user: {
        id: mem.id,
        username: mem.username,
        name: mem.name,
        email: mem.email,
        createdAt: mem.createdAt,
      },
      token,
      source: 'memory',
    });
  }

  return res.status(401).json({
    success: false,
    error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
  });
});

// User Session Verification Route
apiRouter.get('/auth/me', requireAuth, async (req, res) => {
  const authUser = (req as any).user;
  try {
    if (isDbConnected()) {
      const user = await UserModel.findById(authUser.id);
      if (user) {
        return res.json({
          success: true,
          user: {
            id: user._id.toString(),
            username: user.username,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
          },
        });
      }
    }
  } catch {}

  return res.json({
    success: true,
    user: {
      id: authUser.id,
      username: authUser.username,
      name: authUser.name || authUser.username,
    },
  });
});

// 3. User Days Endpoints (Strictly scoped to req.user.id)
apiRouter.get('/days/:date', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { date } = req.params;
  try {
    if (isDbConnected()) {
      const record = await DayModel.findOne({ userId, date }).lean();
      if (record) {
        return res.json({ ...record, found: true });
      }
    }
  } catch (err: any) {
    console.warn(`MongoDB query fallback for user ${userId} day ${date}:`, err.message);
  }

  // Fallback to user memory store
  const userDays = memoryDaysStore[userId] || {};
  const memRecord = userDays[date];
  if (memRecord) {
    return res.json({ ...memRecord, found: true });
  }
  return res.json({ date, tasks: [], notes: '', found: false });
});

apiRouter.post('/days/:date', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { date } = req.params;
  const { tasks, notes, clientUpdatedAt } = req.body;

  if (!memoryDaysStore[userId]) {
    memoryDaysStore[userId] = {};
  }

  const updatedDoc = {
    userId,
    date,
    tasks: Array.isArray(tasks) ? tasks : [],
    notes: notes || '',
    updatedAt: clientUpdatedAt ? new Date(clientUpdatedAt) : new Date(),
  };

  memoryDaysStore[userId][date] = updatedDoc;

  try {
    if (isDbConnected()) {
      const updated = await DayModel.findOneAndUpdate(
        { userId, date },
        {
          userId,
          date,
          tasks: Array.isArray(tasks) ? tasks : [],
          notes: notes || '',
          updatedAt: clientUpdatedAt ? new Date(clientUpdatedAt) : new Date(),
        },
        { upsert: true, new: true }
      ).lean();
      return res.json({ success: true, day: updated, source: 'mongodb' });
    }
  } catch (err: any) {
    console.warn(`MongoDB save fallback for user ${userId} day ${date}:`, err.message);
  }

  return res.json({ success: true, day: updatedDoc, source: 'memory_fallback' });
});

apiRouter.get('/days', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    if (isDbConnected()) {
      const records = await DayModel.find({ userId }).sort({ date: -1 }).lean();
      const daysMap: Record<string, any> = {};
      for (const r of records) {
        daysMap[r.date] = r;
      }
      return res.json({ days: daysMap, list: records, source: 'mongodb' });
    }
  } catch (err: any) {
    console.warn(`MongoDB query all days fallback for user ${userId}:`, err.message);
  }

  const userDays = memoryDaysStore[userId] || {};
  return res.json({ days: userDays, list: Object.values(userDays), source: 'memory' });
});

// 4. Batch Sync Endpoint (Processes offline queue atomically)
apiRouter.post('/sync/batch', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { days, habits, settings } = req.body;

  if (!memoryDaysStore[userId]) memoryDaysStore[userId] = {};

  try {
    if (isDbConnected()) {
      // Sync days
      if (days && typeof days === 'object') {
        for (const [date, data] of Object.entries(days as Record<string, any>)) {
          if (!date || !data) continue;
          await DayModel.findOneAndUpdate(
            { userId, date },
            {
              userId,
              date,
              tasks: Array.isArray(data.tasks) ? data.tasks : [],
              notes: data.notes || '',
              updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
            },
            { upsert: true }
          );
        }
      }

      // Sync habits
      if (Array.isArray(habits)) {
        for (const h of habits) {
          if (!h.id) continue;
          await HabitModel.findOneAndUpdate(
            { userId, id: h.id },
            {
              userId,
              id: h.id,
              title: h.title,
              currentStreak: h.currentStreak || 0,
              bestStreak: h.bestStreak || 0,
              lastCompletedDate: h.lastCompletedDate,
              icon: h.icon || '⚡',
              history: h.history || {},
              updatedAt: new Date(),
            },
            { upsert: true }
          );
        }
      }

      // Sync settings
      if (settings && typeof settings === 'object') {
        await SettingsModel.findOneAndUpdate(
          { userId },
          {
            userId,
            ...settings,
            updatedAt: new Date(),
          },
          { upsert: true }
        );
      }

      // Return fresh state from DB
      const freshDays = await DayModel.find({ userId }).sort({ date: -1 }).lean();
      const freshHabits = await HabitModel.find({ userId }).lean();
      const freshSettings = await SettingsModel.findOne({ userId }).lean();

      const daysMap: Record<string, any> = {};
      for (const r of freshDays) daysMap[r.date] = r;

      return res.json({
        success: true,
        days: daysMap,
        habits: freshHabits,
        settings: freshSettings,
        source: 'mongodb',
      });
    }
  } catch (err: any) {
    console.warn(`Batch sync fallback for user ${userId}:`, err.message);
  }

  // Memory update
  if (days && typeof days === 'object') {
    for (const [date, data] of Object.entries(days as Record<string, any>)) {
      if (date && data) memoryDaysStore[userId][date] = { userId, ...data };
    }
  }
  if (Array.isArray(habits)) {
    memoryHabitsStore[userId] = habits;
  }
  if (settings) {
    memorySettingsStore[userId] = { userId, ...settings };
  }

  return res.json({
    success: true,
    days: memoryDaysStore[userId] || {},
    habits: memoryHabitsStore[userId] || [],
    settings: memorySettingsStore[userId] || {},
    source: 'memory',
  });
});

// 5. Habits Endpoints (Strictly scoped to req.user.id)
apiRouter.get('/habits', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    if (isDbConnected()) {
      const habits = await HabitModel.find({ userId }).lean();
      return res.json({ habits, source: 'mongodb' });
    }
  } catch (err: any) {
    console.warn(`MongoDB habits query fallback for user ${userId}:`, err.message);
  }

  return res.json({ habits: memoryHabitsStore[userId] || [], source: 'memory' });
});

apiRouter.post('/habits', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { habits } = req.body;
  if (Array.isArray(habits)) {
    memoryHabitsStore[userId] = habits;
  }

  try {
    if (isDbConnected() && Array.isArray(habits)) {
      for (const h of habits) {
        if (!h.id) continue;
        await HabitModel.findOneAndUpdate(
          { userId, id: h.id },
          {
            userId,
            id: h.id,
            title: h.title,
            currentStreak: h.currentStreak || 0,
            bestStreak: h.bestStreak || 0,
            lastCompletedDate: h.lastCompletedDate,
            icon: h.icon || '⚡',
            history: h.history || {},
            updatedAt: new Date(),
          },
          { upsert: true, new: true }
        );
      }
      const saved = await HabitModel.find({ userId }).lean();
      return res.json({ success: true, habits: saved, source: 'mongodb' });
    }
  } catch (err: any) {
    console.warn(`MongoDB save habits fallback for user ${userId}:`, err.message);
  }

  return res.json({ success: true, habits: memoryHabitsStore[userId] || [], source: 'memory' });
});

// 6. User Settings Endpoints (Strictly scoped to req.user.id)
apiRouter.get('/settings', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    if (isDbConnected()) {
      const settings = await SettingsModel.findOne({ userId }).lean();
      if (settings) return res.json({ settings, source: 'mongodb' });
    }
  } catch (err: any) {
    console.warn(`MongoDB settings fallback for user ${userId}:`, err.message);
  }
  return res.json({ settings: memorySettingsStore[userId] || { theme: 'dark', lang: 'ar' }, source: 'memory' });
});

apiRouter.post('/settings', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { theme, lang, prayerLocation, prayerTimes } = req.body;
  memorySettingsStore[userId] = {
    ...(memorySettingsStore[userId] || {}),
    ...(theme && { theme }),
    ...(lang && { lang }),
    ...(prayerLocation && { prayerLocation }),
    ...(prayerTimes && { prayerTimes }),
  };

  try {
    if (isDbConnected()) {
      const settings = await SettingsModel.findOneAndUpdate(
        { userId },
        {
          userId,
          ...memorySettingsStore[userId],
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      ).lean();
      return res.json({ success: true, settings, source: 'mongodb' });
    }
  } catch (err: any) {
    console.warn(`MongoDB save settings fallback for user ${userId}:`, err.message);
  }

  return res.json({ success: true, settings: memorySettingsStore[userId], source: 'memory' });
});

// 7. Full Reset & Migration
apiRouter.post('/sync/reset-saturday-26', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { saturdayRecord, defaultHabits } = req.body;

  if (saturdayRecord && saturdayRecord.tasks) {
    if (!memoryDaysStore[userId]) memoryDaysStore[userId] = {};
    memoryDaysStore[userId]['2026-09-26'] = { userId, ...saturdayRecord };
  }
  if (Array.isArray(defaultHabits)) {
    memoryHabitsStore[userId] = defaultHabits;
  }

  try {
    if (isDbConnected()) {
      // Clear old records for this specific user ONLY
      await DayModel.deleteMany({ userId });
      await HabitModel.deleteMany({ userId });

      if (saturdayRecord && saturdayRecord.tasks) {
        await DayModel.create({
          userId,
          date: '2026-09-26',
          tasks: saturdayRecord.tasks,
          notes: saturdayRecord.notes || '',
        });
      }

      if (Array.isArray(defaultHabits)) {
        for (const h of defaultHabits) {
          if (!h.id) continue;
          await HabitModel.create({
            userId,
            id: h.id,
            title: h.title,
            currentStreak: h.currentStreak || 0,
            bestStreak: h.bestStreak || 0,
            lastCompletedDate: h.lastCompletedDate,
            icon: h.icon || '⚡',
            history: h.history || {},
          });
        }
      }

      return res.json({ success: true, source: 'mongodb' });
    }
  } catch (err: any) {
    console.warn(`MongoDB reset failed for user ${userId}:`, err.message);
  }

  return res.json({ success: true, source: 'memory' });
});

app.use('/api', apiRouter);

// Vite / Static Middleware
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(` Mizan Enterprise Server running on port ${PORT}`);
});
