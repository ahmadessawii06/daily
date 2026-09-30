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
import { fileStore } from './src/db/fileStorage.js';

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

// Pre-seed admin and admin2 in persistent file storage for zero-friction access
try {
  const seedAccounts = [
    { username: 'admin2', password: 'password', name: 'Admin 2' },
    { username: 'admin', password: 'password', name: 'Admin' },
  ];
  for (const acc of seedAccounts) {
    if (!fileStore.findUser(acc.username)) {
      fileStore.saveUser({
        id: `user-${acc.username}`,
        username: acc.username,
        passwordHash: hashPassword(acc.password),
        name: acc.name,
        createdAt: new Date().toISOString(),
      });
    }
  }
} catch {}

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
      database: isDbConnected() ? 'MongoDB Atlas' : 'Persistent File Storage (JSON DB)',
      connected: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.json({
      status: 'online',
      database: 'Persistent File Storage (JSON DB)',
      connected: true,
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

  // Check if user exists in FileStore or MongoDB
  const existingFileUser = fileStore.findUser(cleanUsername);
  if (existingFileUser) {
    // If password matches, log them in directly
    if (existingFileUser.passwordHash === passHash) {
      const token = signJwt({ sub: existingFileUser.id, username: existingFileUser.username, name: existingFileUser.name });
      return res.json({
        success: true,
        user: {
          id: existingFileUser.id,
          username: existingFileUser.username,
          name: existingFileUser.name,
          email: existingFileUser.email,
        },
        token,
        source: 'file_storage',
      });
    }
    return res.status(400).json({ success: false, error: 'اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر' });
  }

  try {
    if (isDbConnected()) {
      const existing = await UserModel.findOne({ username: cleanUsername });
      if (existing) {
        if (existing.passwordHash === passHash) {
          const userId = existing._id.toString();
          const token = signJwt({ sub: userId, username: existing.username, name: existing.name });
          return res.json({
            success: true,
            user: { id: userId, username: existing.username, name: existing.name, email: existing.email },
            token,
            source: 'mongodb',
          });
        }
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

      fileStore.saveUser({
        id: userId,
        username: cleanUsername,
        name: displayName,
        passwordHash: passHash,
        email: email ? String(email).trim().toLowerCase() : undefined,
        createdAt: new Date().toISOString(),
      });

      const token = signJwt({ sub: userId, username: cleanUsername, name: displayName });
      return res.json({ success: true, user: userObj, token, source: 'mongodb' });
    }
  } catch (err: any) {
    console.warn('MongoDB Register Notice:', err.message);
  }

  // Persistent File Storage fallback
  const userId = `user-${cleanUsername}`;
  const newUserRecord = {
    id: userId,
    username: cleanUsername,
    name: displayName,
    email: email ? String(email).trim().toLowerCase() : undefined,
    passwordHash: passHash,
    createdAt: new Date().toISOString(),
  };
  fileStore.saveUser(newUserRecord);
  const token = signJwt({ sub: userId, username: cleanUsername, name: displayName });

  return res.json({
    success: true,
    user: {
      id: newUserRecord.id,
      username: newUserRecord.username,
      name: newUserRecord.name,
      email: newUserRecord.email,
      createdAt: newUserRecord.createdAt,
    },
    token,
    source: 'file_storage',
  });
});

apiRouter.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const inputHash = hashPassword(String(password));

  // 1. Check MongoDB
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

  // 2. Check Persistent File Storage
  const fileUser = fileStore.findUser(cleanUsername);
  if (fileUser) {
    if (fileUser.passwordHash === inputHash) {
      const token = signJwt({ sub: fileUser.id, username: fileUser.username, name: fileUser.name });
      return res.json({
        success: true,
        user: {
          id: fileUser.id,
          username: fileUser.username,
          name: fileUser.name,
          email: fileUser.email,
          createdAt: fileUser.createdAt,
        },
        token,
        source: 'file_storage',
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'كلمة المرور غير صحيحة',
      });
    }
  }

  // 3. Auto-provision new user on first login attempt (seamless zero-friction account creation)
  const userId = `user-${cleanUsername}`;
  const autoUser = {
    id: userId,
    username: cleanUsername,
    name: cleanUsername,
    passwordHash: inputHash,
    createdAt: new Date().toISOString(),
  };
  fileStore.saveUser(autoUser);

  // If MongoDB is connected, save there too
  try {
    if (isDbConnected()) {
      await UserModel.create({
        username: cleanUsername,
        passwordHash: inputHash,
        name: cleanUsername,
      });
    }
  } catch {}

  const token = signJwt({ sub: userId, username: cleanUsername, name: cleanUsername });
  return res.json({
    success: true,
    user: {
      id: autoUser.id,
      username: autoUser.username,
      name: autoUser.name,
      createdAt: autoUser.createdAt,
    },
    token,
    source: 'auto_created',
  });
});

// User Session Verification Route
apiRouter.get('/auth/me', requireAuth, async (req, res) => {
  const authUser = (req as any).user;
  const user = fileStore.findUser(authUser.username);
  if (user) {
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  }

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

  // Persistent file store
  const userDays = fileStore.getDays(userId);
  const fileRecord = userDays[date];
  if (fileRecord) {
    return res.json({ ...fileRecord, found: true });
  }
  return res.json({ date, tasks: [], notes: '', found: false });
});

apiRouter.post('/days/:date', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { date } = req.params;
  const { tasks, notes, clientUpdatedAt } = req.body;

  const updatedDoc = {
    userId,
    date,
    tasks: Array.isArray(tasks) ? tasks : [],
    notes: notes || '',
    updatedAt: clientUpdatedAt ? new Date(clientUpdatedAt).toISOString() : new Date().toISOString(),
  };

  fileStore.saveDay(userId, date, updatedDoc);

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

  return res.json({ success: true, day: updatedDoc, source: 'file_storage' });
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

  const userDays = fileStore.getDays(userId);
  return res.json({ days: userDays, list: Object.values(userDays), source: 'file_storage' });
});

// 4. Batch Sync Endpoint (Processes offline queue atomically)
apiRouter.post('/sync/batch', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { days, habits, settings } = req.body;

  if (days && typeof days === 'object') {
    fileStore.saveAllDays(userId, days);
  }
  if (Array.isArray(habits)) {
    fileStore.saveHabits(userId, habits);
  }
  if (settings) {
    fileStore.saveSettings(userId, settings);
  }

  try {
    if (isDbConnected()) {
      // Sync days to MongoDB
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

      // Sync habits to MongoDB
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

      // Sync settings to MongoDB
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

  return res.json({
    success: true,
    days: fileStore.getDays(userId),
    habits: fileStore.getHabits(userId),
    settings: fileStore.getSettings(userId),
    source: 'file_storage',
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

  return res.json({ habits: fileStore.getHabits(userId), source: 'file_storage' });
});

apiRouter.post('/habits', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { habits } = req.body;
  if (Array.isArray(habits)) {
    fileStore.saveHabits(userId, habits);
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

  return res.json({ success: true, habits: fileStore.getHabits(userId), source: 'file_storage' });
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
  return res.json({ settings: fileStore.getSettings(userId), source: 'file_storage' });
});

apiRouter.post('/settings', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { theme, lang, prayerLocation, prayerTimes } = req.body;
  const updatedSettings = {
    ...fileStore.getSettings(userId),
    ...(theme && { theme }),
    ...(lang && { lang }),
    ...(prayerLocation && { prayerLocation }),
    ...(prayerTimes && { prayerTimes }),
  };
  fileStore.saveSettings(userId, updatedSettings);

  try {
    if (isDbConnected()) {
      const settings = await SettingsModel.findOneAndUpdate(
        { userId },
        {
          userId,
          ...updatedSettings,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      ).lean();
      return res.json({ success: true, settings, source: 'mongodb' });
    }
  } catch (err: any) {
    console.warn(`MongoDB save settings fallback for user ${userId}:`, err.message);
  }

  return res.json({ success: true, settings: updatedSettings, source: 'file_storage' });
});

// 7. Full Reset & Migration
apiRouter.post('/sync/reset-saturday-26', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { saturdayRecord, defaultHabits } = req.body;

  if (saturdayRecord && saturdayRecord.tasks) {
    fileStore.saveDay(userId, '2026-09-26', saturdayRecord);
  }
  if (Array.isArray(defaultHabits)) {
    fileStore.saveHabits(userId, defaultHabits);
  }

  try {
    if (isDbConnected()) {
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

  return res.json({ success: true, source: 'file_storage' });
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
