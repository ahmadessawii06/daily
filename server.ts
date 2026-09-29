import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_daily_tasks_app_salt_2026').digest('hex');
}

const DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || '';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || '';
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || (DEFAULT_ADMIN_USERNAME ? `User (${DEFAULT_ADMIN_USERNAME})` : '');
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || '';

// Memory fallback store when MongoDB is connecting / pending IP whitelist
const memoryDaysStore: Record<string, any> = {};
let memoryHabitsStore: any[] = [];
let memorySettingsStore: any = { userId: 'default_user', theme: 'dark', lang: 'ar' };
const memoryUsersStore: Record<string, any> = {};

if (DEFAULT_ADMIN_USERNAME && DEFAULT_ADMIN_PASSWORD) {
  memoryUsersStore[DEFAULT_ADMIN_USERNAME.toLowerCase()] = {
    id: `user-${DEFAULT_ADMIN_USERNAME.toLowerCase()}`,
    username: DEFAULT_ADMIN_USERNAME,
    name: DEFAULT_ADMIN_NAME,
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
    createdAt: new Date().toISOString(),
  };
}

// Initial background connection attempt and user setup
connectToDatabase()
  .then(async () => {
    try {
      if (isDbConnected() && DEFAULT_ADMIN_USERNAME && DEFAULT_ADMIN_PASSWORD) {
        const passHash = hashPassword(DEFAULT_ADMIN_PASSWORD);
        await UserModel.findOneAndUpdate(
          { username: DEFAULT_ADMIN_USERNAME },
          {
            $set: {
              username: DEFAULT_ADMIN_USERNAME,
              passwordHash: passHash,
              name: DEFAULT_ADMIN_NAME,
              email: DEFAULT_ADMIN_EMAIL || undefined,
            },
          },
          { upsert: true, new: true }
        );
      }
    } catch {
      // ignore
    }
  })
  .catch(() => {
    // Gracefully handled; API won't crash
  });




// API Routes
const apiRouter = express.Router();

// Auth Routes (MongoDB User Accounts & Security)
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

      const userObj = {
        id: newUser._id.toString(),
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
      };

      memoryUsersStore[cleanUsername] = { ...userObj, passwordHash: passHash };

      return res.json({
        success: true,
        user: userObj,
        token: `session_${cleanUsername}_${Date.now()}`,
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

  const memUser = {
    id: `user-${Date.now()}`,
    username: cleanUsername,
    name: displayName,
    email: email ? String(email).trim().toLowerCase() : undefined,
    passwordHash: passHash,
    createdAt: new Date().toISOString(),
  };
  memoryUsersStore[cleanUsername] = memUser;

  return res.json({
    success: true,
    user: {
      id: memUser.id,
      username: memUser.username,
      name: memUser.name,
      email: memUser.email,
      createdAt: memUser.createdAt,
    },
    token: `session_${cleanUsername}_${Date.now()}`,
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
        return res.json({
          success: true,
          user: {
            id: user._id.toString(),
            username: user.username,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
          },
          token: `session_${cleanUsername}_${Date.now()}`,
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
    return res.json({
      success: true,
      user: {
        id: mem.id,
        username: mem.username,
        name: mem.name,
        email: mem.email,
        createdAt: mem.createdAt,
      },
      token: `session_${cleanUsername}_${Date.now()}`,
      source: 'memory',
    });
  }

  return res.status(401).json({
    success: false,
    error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
  });
});

// 1. Health check & DB status
apiRouter.get('/health', async (req, res) => {
  try {
    if (!isDbConnected()) {
      await connectToDatabase();
    }
    res.json({
      status: 'online',
      database: 'MongoDB Atlas',
      connected: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    const isWhitelistIssue =
      err.message?.includes('whitelist') ||
      err.message?.includes('Could not connect to any servers') ||
      err.name === 'MongooseServerSelectionError';

    res.json({
      status: 'offline',
      database: 'MongoDB Atlas',
      connected: false,
      error: err.message,
      ipWhitelistNeeded: isWhitelistIssue,
      whitelistInstruction: isWhitelistIssue
        ? 'Please add 0.0.0.0/0 in MongoDB Atlas -> Network Access -> Add IP Address'
        : undefined,
    });
  }
});

// 2. Get single day record
apiRouter.get('/days/:date', async (req, res) => {
  const { date } = req.params;
  try {
    if (isDbConnected()) {
      const record = await DayModel.findOne({ date }).lean();
      if (record) {
        return res.json({ ...record, found: true });
      }
    } else {
      // Try background connect
      connectToDatabase().catch(() => {});
    }
  } catch (err: any) {
    console.warn(`MongoDB query fallback for day ${date}:`, err.message);
  }

  // Fallback to memory / client storage
  const memRecord = memoryDaysStore[date];
  if (memRecord) {
    return res.json({ ...memRecord, found: true });
  }
  return res.json({ date, tasks: [], notes: '', found: false });
});

// 3. Save / Update single day record (upsert)
apiRouter.post('/days/:date', async (req, res) => {
  const { date } = req.params;
  const { tasks, notes } = req.body;

  // Always keep in memory store
  memoryDaysStore[date] = {
    date,
    tasks: Array.isArray(tasks) ? tasks : [],
    notes: notes || '',
    updatedAt: new Date().toISOString(),
  };

  try {
    if (isDbConnected()) {
      const updated = await DayModel.findOneAndUpdate(
        { date },
        {
          date,
          tasks: Array.isArray(tasks) ? tasks : [],
          notes: notes || '',
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      ).lean();
      return res.json({ success: true, day: updated, source: 'mongodb' });
    } else {
      connectToDatabase().catch(() => {});
    }
  } catch (err: any) {
    console.warn(`MongoDB save fallback for day ${date}:`, err.message);
  }

  return res.json({ success: true, day: memoryDaysStore[date], source: 'memory_fallback' });
});

// 4. Get all days (for archives, weekly summary, and stats)
apiRouter.get('/days', async (req, res) => {
  try {
    if (isDbConnected()) {
      const records = await DayModel.find({}).sort({ date: -1 }).lean();
      const daysMap: Record<string, any> = {};
      for (const r of records) {
        daysMap[r.date] = r;
      }
      return res.json({ days: daysMap, list: records, source: 'mongodb' });
    } else {
      connectToDatabase().catch(() => {});
    }
  } catch (err: any) {
    console.warn('MongoDB query fallback for all days:', err.message);
  }

  return res.json({ days: memoryDaysStore, list: Object.values(memoryDaysStore), source: 'memory' });
});

// 5. Habits Endpoints
apiRouter.get('/habits', async (req, res) => {
  try {
    if (isDbConnected()) {
      const habits = await HabitModel.find({}).lean();
      return res.json({ habits, source: 'mongodb' });
    } else {
      connectToDatabase().catch(() => {});
    }
  } catch (err: any) {
    console.warn('MongoDB habits fallback:', err.message);
  }

  return res.json({ habits: memoryHabitsStore, source: 'memory' });
});

apiRouter.post('/habits', async (req, res) => {
  const { habits } = req.body;
  if (Array.isArray(habits)) {
    memoryHabitsStore = habits;
  }

  try {
    if (isDbConnected() && Array.isArray(habits)) {
      for (const h of habits) {
        if (!h.id) continue;
        await HabitModel.findOneAndUpdate(
          { id: h.id },
          {
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
      const saved = await HabitModel.find({}).lean();
      return res.json({ success: true, habits: saved, source: 'mongodb' });
    } else {
      connectToDatabase().catch(() => {});
    }
  } catch (err: any) {
    console.warn('MongoDB save habits fallback:', err.message);
  }

  return res.json({ success: true, habits: memoryHabitsStore, source: 'memory' });
});

// 6. User Settings
apiRouter.get('/settings', async (req, res) => {
  try {
    if (isDbConnected()) {
      const settings = await SettingsModel.findOne({ userId: 'default_user' }).lean();
      if (settings) return res.json({ settings, source: 'mongodb' });
    }
  } catch (err: any) {
    console.warn('MongoDB settings fallback:', err.message);
  }
  return res.json({ settings: memorySettingsStore, source: 'memory' });
});

apiRouter.post('/settings', async (req, res) => {
  const { theme, lang, prayerLocation, prayerTimes } = req.body;
  memorySettingsStore = {
    ...memorySettingsStore,
    ...(theme && { theme }),
    ...(lang && { lang }),
    ...(prayerLocation && { prayerLocation }),
    ...(prayerTimes && { prayerTimes }),
  };

  try {
    if (isDbConnected()) {
      const settings = await SettingsModel.findOneAndUpdate(
        { userId: 'default_user' },
        {
          userId: 'default_user',
          ...memorySettingsStore,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      ).lean();
      return res.json({ success: true, settings, source: 'mongodb' });
    } else {
      connectToDatabase().catch(() => {});
    }
  } catch (err: any) {
    console.warn('MongoDB save settings fallback:', err.message);
  }

  return res.json({ success: true, settings: memorySettingsStore, source: 'memory' });
});

// 7. Full Migration from Client
apiRouter.post('/sync/migrate-all', async (req, res) => {
  const { days, habits } = req.body;

  // Save to memory
  let importedCount = 0;
  if (days && typeof days === 'object') {
    for (const [date, data] of Object.entries(days as Record<string, any>)) {
      if (date && data) {
        memoryDaysStore[date] = data;
        importedCount++;
      }
    }
  }
  if (Array.isArray(habits)) {
    memoryHabitsStore = habits;
  }

  try {
    if (!isDbConnected()) {
      await connectToDatabase();
    }

    if (isDbConnected()) {
      if (days && typeof days === 'object') {
        for (const [date, data] of Object.entries(days as Record<string, any>)) {
          if (!date || !data) continue;
          await DayModel.findOneAndUpdate(
            { date },
            {
              date,
              tasks: Array.isArray(data.tasks) ? data.tasks : [],
              notes: data.notes || '',
              updatedAt: new Date(),
            },
            { upsert: true }
          );
        }
      }

      if (Array.isArray(habits)) {
        for (const h of habits) {
          if (!h.id) continue;
          await HabitModel.findOneAndUpdate(
            { id: h.id },
            {
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

      return res.json({
        success: true,
        message: 'Successfully synchronized to MongoDB Atlas',
        importedDaysCount: importedCount,
        database: 'MongoDB Atlas',
      });
    }
  } catch (err: any) {
    console.warn('MongoDB migration fallback:', err.message);
  }

  return res.json({
    success: true,
    message: 'Data saved locally and in memory (MongoDB Atlas connecting in background)',
    importedDaysCount: importedCount,
    fallback: true,
  });
});

// 8. Full Reset Endpoint: Clear all past data and start clean from Saturday 2026-09-26
apiRouter.post('/sync/reset-database-to-saturday-26', async (req, res) => {
  const { saturdayRecord, habits } = req.body;

  // 1. Reset memory store
  for (const k of Object.keys(memoryDaysStore)) {
    delete memoryDaysStore[k];
  }
  if (saturdayRecord) {
    memoryDaysStore['2026-09-26'] = saturdayRecord;
  }
  if (Array.isArray(habits)) {
    memoryHabitsStore = habits;
  }

  // 2. Reset MongoDB if connected
  try {
    if (!isDbConnected()) {
      await connectToDatabase().catch(() => {});
    }

    if (isDbConnected()) {
      // Remove all old dummy dates
      await DayModel.deleteMany({ date: { $ne: '2026-09-26' } });
      
      if (saturdayRecord) {
        await DayModel.findOneAndUpdate(
          { date: '2026-09-26' },
          {
            date: '2026-09-26',
            tasks: saturdayRecord.tasks || [],
            notes: saturdayRecord.notes || saturdayRecord.dayNote || '',
            updatedAt: new Date(),
          },
          { upsert: true }
        );
      }

      if (Array.isArray(habits)) {
        await HabitModel.deleteMany({});
        for (const h of habits) {
          await HabitModel.create({
            id: h.id,
            title: h.title,
            currentStreak: 0,
            bestStreak: 0,
            icon: h.icon || '⚡',
            history: {},
            updatedAt: new Date(),
          });
        }
      }

      return res.json({
        success: true,
        message: 'All past data reset! Starting from Saturday 2026-09-26 from zero.',
      });
    }
  } catch (err: any) {
    console.warn('MongoDB reset warning:', err.message);
  }

  return res.json({
    success: true,
    message: 'Reset completed in local cache and memory.',
  });
});

// Mount API router
app.use('/api', apiRouter);

// Vite in dev mode or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(` Server running on http://0.0.0.0:${PORT} with resilient MongoDB integration`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
