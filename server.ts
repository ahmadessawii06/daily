import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  connectToDatabase,
  isDbConnected,
  DayModel,
  HabitModel,
  SettingsModel,
  UserModel,
} from './src/db/mongodb.js';
import { fileStore, generateUserCode } from './src/db/fileStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Enable CORS for mobile devices, laptops, iPads, and cross-origin previews
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-code');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// Initial background DB connection attempt
connectToDatabase().catch(() => {});

/**
 * Simple User Resolution Middleware:
 * Resolves user by their unique User Code (e.g. A7K9P2) or userId
 * provided via Header (x-user-code, Authorization) or Query/Body.
 */
async function requireUserCode(req: express.Request, res: express.Response, next: express.NextFunction) {
  let rawCode = (
    req.headers['x-user-code'] ||
    req.headers.authorization?.replace('Bearer ', '') ||
    req.query.userCode ||
    req.body.userCode
  ) as string;

  if (!rawCode || typeof rawCode !== 'string') {
    return res.status(401).json({
      success: false,
      error: 'يرجى إدخال كود المستخدم (User Code) للمتابعة',
    });
  }

  const cleanCode = rawCode.trim().toUpperCase();

  // 1. Check File Storage
  let user = fileStore.findUserByCode(cleanCode) || fileStore.findUserById(cleanCode);

  // 2. Check MongoDB if connected and not found in memory
  if (!user && isDbConnected()) {
    try {
      const dbUser = await UserModel.findOne({
        $or: [{ userCode: cleanCode }, { id: cleanCode }],
      }).lean();
      if (dbUser) {
        user = {
          id: dbUser.id || `usr_${dbUser.userCode}`,
          userCode: dbUser.userCode,
          name: dbUser.name || `مستخدم ${dbUser.userCode}`,
          createdAt: dbUser.createdAt ? dbUser.createdAt.toISOString() : new Date().toISOString(),
        };
        fileStore.saveUser(user);
      }
    } catch {}
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      error: `كود المستخدم (${cleanCode}) غير موجود، يرجى التأكد من الكود أو إنشاء كود جديد`,
    });
  }

  (req as any).user = user;
  next();
}

// API Router
const apiRouter = express.Router();

// 1. Health & Database Status
apiRouter.get('/health', async (_req, res) => {
  try {
    if (!isDbConnected()) {
      await connectToDatabase();
    }
    res.json({
      status: 'online',
      database: isDbConnected() ? 'MongoDB Atlas' : 'Persistent File Database (JSON DB)',
      connected: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.json({
      status: 'online',
      database: 'Persistent File Database (JSON DB)',
      connected: true,
      error: err.message,
    });
  }
});

// 2. Create New User (Generates unique 6-char User Code e.g. A7K9P2)
apiRouter.post('/users/create', async (req, res) => {
  const { name } = req.body;
  const customName = typeof name === 'string' && name.trim() ? name.trim() : undefined;

  // Generate in FileStore
  const newUser = fileStore.createUser(customName);

  // Save to MongoDB if connected
  if (isDbConnected()) {
    try {
      await UserModel.create({
        id: newUser.id,
        userCode: newUser.userCode,
        name: newUser.name,
      });
    } catch (err: any) {
      console.warn('MongoDB User Creation Notice:', err.message);
    }
  }

  return res.status(201).json({
    success: true,
    user: newUser,
    message: `تم إنشاء كود ميزان الخاص بك بنجاح: ${newUser.userCode}`,
  });
});

// 3. Access Existing User by User Code (e.g. from Laptop, Phone, iPad)
apiRouter.post('/users/access', async (req, res) => {
  const { userCode } = req.body;

  if (!userCode || typeof userCode !== 'string' || !userCode.trim()) {
    return res.status(400).json({
      success: false,
      error: 'يرجى إدخال كود ميزان (User Code)',
    });
  }

  const cleanCode = userCode.trim().toUpperCase();

  // 1. Search in FileStore
  let user = fileStore.findUserByCode(cleanCode) || fileStore.findUserById(cleanCode);

  // 2. Search in MongoDB if connected
  if (!user && isDbConnected()) {
    try {
      const dbUser = await UserModel.findOne({
        $or: [{ userCode: cleanCode }, { id: cleanCode }],
      }).lean();
      if (dbUser) {
        user = {
          id: dbUser.id || `usr_${dbUser.userCode}`,
          userCode: dbUser.userCode,
          name: dbUser.name || `مستخدم ${dbUser.userCode}`,
          createdAt: dbUser.createdAt ? dbUser.createdAt.toISOString() : new Date().toISOString(),
        };
        fileStore.saveUser(user);
      }
    } catch {}
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      error: `كود ميزان (${cleanCode}) غير مسجل في قاعدة البيانات، يرجى التأكد من كتابة الكود أو إنشاء كود جديد`,
    });
  }

  return res.json({
    success: true,
    user,
    message: `أهلاً بك مجدداً، ${user.name}!`,
  });
});

// 4. User Days Endpoints (Strictly scoped to req.user.id)
apiRouter.get('/days/:date', requireUserCode, async (req, res) => {
  const userId = (req as any).user.id;
  const { date } = req.params;

  try {
    if (isDbConnected()) {
      const record = await DayModel.findOne({ userId, date }).lean();
      if (record) {
        return res.json({ ...record, found: true });
      }
    }
  } catch {}

  const userDays = fileStore.getDays(userId);
  const fileRecord = userDays[date];
  if (fileRecord) {
    return res.json({ ...fileRecord, found: true });
  }
  return res.json({ date, tasks: [], notes: '', found: false });
});

apiRouter.post('/days/:date', requireUserCode, async (req, res) => {
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
  } catch {}

  return res.json({ success: true, day: updatedDoc, source: 'file_storage' });
});

apiRouter.get('/days', requireUserCode, async (req, res) => {
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
  } catch {}

  const userDays = fileStore.getDays(userId);
  return res.json({ days: userDays, list: Object.values(userDays), source: 'file_storage' });
});

// 5. Batch Sync Endpoint (Strictly isolated by req.user.id)
apiRouter.post('/sync/batch', requireUserCode, async (req, res) => {
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
  } catch {}

  return res.json({
    success: true,
    days: fileStore.getDays(userId),
    habits: fileStore.getHabits(userId),
    settings: fileStore.getSettings(userId),
    source: 'file_storage',
  });
});

// 6. Habits Endpoints (Strictly isolated by req.user.id)
apiRouter.get('/habits', requireUserCode, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    if (isDbConnected()) {
      const habits = await HabitModel.find({ userId }).lean();
      return res.json({ habits, source: 'mongodb' });
    }
  } catch {}

  return res.json({ habits: fileStore.getHabits(userId), source: 'file_storage' });
});

apiRouter.post('/habits', requireUserCode, async (req, res) => {
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
  } catch {}

  return res.json({ success: true, habits: fileStore.getHabits(userId), source: 'file_storage' });
});

// 7. User Settings Endpoints (Strictly isolated by req.user.id)
apiRouter.get('/settings', requireUserCode, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    if (isDbConnected()) {
      const settings = await SettingsModel.findOne({ userId }).lean();
      if (settings) return res.json({ settings, source: 'mongodb' });
    }
  } catch {}
  return res.json({ settings: fileStore.getSettings(userId), source: 'file_storage' });
});

apiRouter.post('/settings', requireUserCode, async (req, res) => {
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
  } catch {}

  return res.json({ success: true, settings: updatedSettings, source: 'file_storage' });
});

// 8. Analytics & Summary Endpoint (For rich queries & statistical analysis)
apiRouter.get('/analytics/summary', requireUserCode, async (req, res) => {
  const userId = (req as any).user.id;
  const userDays = fileStore.getDays(userId);
  const habits = fileStore.getHabits(userId);

  let totalTasks = 0;
  let doneTasks = 0;
  let totalStudyMinutes = 0;
  let completedPrayers = 0;

  for (const day of Object.values(userDays)) {
    if (Array.isArray(day.tasks)) {
      for (const t of day.tasks) {
        if (!t.title || !t.title.trim()) continue;
        totalTasks++;
        if (t.status === 'done') {
          doneTasks++;
          if (t.category === 'study' || t.title.includes('دراسة') || t.title.includes('مذاكرة')) {
            totalStudyMinutes += t.duration || 60;
          }
          if (t.category === 'worship' || t.title.includes('صلاة') || t.title.includes('فجر') || t.title.includes('ظهر')) {
            completedPrayers++;
          }
        }
      }
    }
  }

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return res.json({
    userId,
    userCode: (req as any).user.userCode,
    totalTasks,
    doneTasks,
    completionRate,
    totalStudyHours: +(totalStudyMinutes / 60).toFixed(1),
    completedPrayers,
    activeHabitsCount: habits.length,
    timestamp: new Date().toISOString(),
  });
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
  console.log(` Mizan User Code Server running on port ${PORT}`);
});
