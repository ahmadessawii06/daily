import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  connectToDatabase,
  isDbConnected,
  getDbLastError,
  DayModel,
  HabitModel,
  SettingsModel,
} from './src/db/mongodb.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Memory fallback store when MongoDB is connecting / pending IP whitelist
const memoryDaysStore: Record<string, any> = {};
let memoryHabitsStore: any[] = [];
let memorySettingsStore: any = { userId: 'default_user', theme: 'dark', lang: 'ar' };

// Initial background connection attempt
connectToDatabase().catch(() => {
  // Gracefully handled; API won't crash
});

// API Routes
const apiRouter = express.Router();

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
