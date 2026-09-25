import mongoose, { Schema, Document } from 'mongoose';
import { TaskCategory, TaskStatus } from '../types';

// Disable command buffering so queries fail-fast when DB is offline instead of hanging for 10s
mongoose.set('bufferCommands', false);

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://gamadmktol_db_user:bMkWKi23sJ44qZb7@cluster0.09l0tvf.mongodb.net/daily_tasks_app?retryWrites=true&w=majority';

let isConnected = false;
let connectionPromise: Promise<typeof mongoose> | null = null;
let lastError: string | null = null;

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getDbLastError(): string | null {
  return lastError;
}

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    lastError = null;
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      socketTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority',
    });

    await connectionPromise;
    isConnected = true;
    lastError = null;
    connectionPromise = null;
    console.log(' Successfully connected to MongoDB Atlas database:', mongoose.connection.name);
    return mongoose.connection;
  } catch (err: any) {
    connectionPromise = null;
    isConnected = false;
    lastError = err.message || 'Connection failed';
    console.warn(' MongoDB Atlas Notice:', err.message);
    throw err;
  }
}

// 1. Day Record Schema
export interface ITask {
  id: string;
  time: string;
  title: string;
  status: TaskStatus;
  category?: TaskCategory;
  period?: string;
  completedAt?: string;
  notes?: string;
}

export interface IDayRecord extends Document {
  date: string; // "YYYY-MM-DD"
  tasks: ITask[];
  notes?: string;
  updatedAt: Date;
}

const TaskSubSchema = new Schema<ITask>(
  {
    id: { type: String, required: true },
    time: { type: String, required: true },
    title: { type: String, default: '' },
    status: { type: String, enum: ['done', 'pending', 'not-done'], default: 'pending' },
    category: { type: String, default: 'work' },
    period: { type: String, default: 'fajr-dhuhr' },
    completedAt: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

const DayRecordSchema = new Schema<IDayRecord>(
  {
    date: { type: String, required: true, unique: true, index: true },
    tasks: { type: [TaskSubSchema], default: [] },
    notes: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 2. Habit Schema
export interface IHabit extends Document {
  id: string;
  title: string;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate?: string;
  icon?: string;
  history?: Record<string, boolean>;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    lastCompletedDate: { type: String },
    icon: { type: String, default: '⚡' },
    history: { type: Schema.Types.Mixed, default: {} },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 3. User Settings Schema
export interface IUserSettings extends Document {
  userId: string;
  theme: 'dark' | 'light';
  lang: 'ar' | 'en';
  prayerLocation?: Record<string, any>;
  prayerTimes?: Array<any>;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: String, required: true, unique: true, default: 'default_user' },
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    lang: { type: String, enum: ['ar', 'en'], default: 'ar' },
    prayerLocation: { type: Schema.Types.Mixed },
    prayerTimes: { type: [Schema.Types.Mixed] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const DayModel = mongoose.models.DayRecord || mongoose.model<IDayRecord>('DayRecord', DayRecordSchema);
export const HabitModel = mongoose.models.Habit || mongoose.model<IHabit>('Habit', HabitSchema);
export const SettingsModel = mongoose.models.UserSettings || mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
