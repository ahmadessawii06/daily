import mongoose, { Schema, Document } from 'mongoose';
import { TaskCategory, TaskStatus } from '../types';

// Disable command buffering so queries fail-fast when DB is offline instead of hanging
mongoose.set('bufferCommands', false);

let authFailed = false;

function getMongoUri(): string | null {
  const uri = (process.env.MONGODB_URI || '').trim();
  if (!uri) return null;
  
  // Ignore placeholder strings
  if (
    uri.includes('<username>') || 
    uri.includes('<password>') || 
    uri.includes('<db_password>') ||
    uri.includes('<cluster>') ||
    uri.includes('<dbname>')
  ) {
    return null;
  }

  return uri;
}

let isConnected = false;
let connectionPromise: Promise<typeof mongoose | null> | null = null;
let lastError: string | null = null;

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getDbLastError(): string | null {
  return lastError;
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    lastError = null;
    return mongoose;
  }

  if (authFailed) {
    return null;
  }

  const uri = getMongoUri();
  if (!uri) {
    isConnected = false;
    lastError = 'MongoDB URI not set - operating in persistent local file database mode';
    return null;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      socketTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority',
    }).then(() => {
      isConnected = true;
      lastError = null;
      authFailed = false;
      return mongoose;
    });

    return await connectionPromise;
  } catch (err: any) {
    isConnected = false;
    const msg = err?.message || 'Connection failed';
    if (msg.includes('bad auth') || msg.includes('authentication failed')) {
      authFailed = true;
      lastError = 'MongoDB authentication invalid. Operating in persistent local file database mode.';
    } else {
      lastError = msg;
    }
    return null;
  } finally {
    connectionPromise = null;
  }
}

// 1. Task Subschema
export interface ITask {
  id: string;
  time: string;
  title: string;
  status: TaskStatus;
  category?: TaskCategory;
  period?: string;
  completedAt?: string;
  notes?: string;
  updatedAt?: string;
}

const TaskSubSchema = new Schema<ITask>(
  {
    id: { type: String, required: true },
    time: { type: String, default: '' },
    title: { type: String, default: '' },
    status: { type: String, enum: ['done', 'pending', 'not-done'], default: 'pending' },
    category: { type: String, default: 'work' },
    period: { type: String, default: 'fajr-dhuhr' },
    completedAt: { type: String },
    notes: { type: String },
    updatedAt: { type: String },
  },
  { _id: false }
);

// 2. Day Record Schema (Linked to userId)
export interface IDayRecord extends Document {
  userId: string;
  date: string; // "YYYY-MM-DD"
  tasks: ITask[];
  notes?: string;
  updatedAt: Date;
}

const DayRecordSchema = new Schema<IDayRecord>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    tasks: { type: [TaskSubSchema], default: [] },
    notes: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index: each user has their own unique date record
DayRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

// 3. Habit Schema (Linked to userId)
export interface IHabit extends Document {
  userId: string;
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
    userId: { type: String, required: true, index: true },
    id: { type: String, required: true, index: true },
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

HabitSchema.index({ userId: 1, id: 1 }, { unique: true });

// 4. User Settings Schema (Linked to userId)
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
    userId: { type: String, required: true, unique: true, index: true },
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    lang: { type: String, enum: ['ar', 'en'], default: 'ar' },
    prayerLocation: { type: Schema.Types.Mixed },
    prayerTimes: { type: [Schema.Types.Mixed] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 5. Simple User Model with unique User Code (e.g. A7K9P2)
export interface IUser extends Document {
  id: string;
  userCode: string;
  name?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userCode: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    name: { type: String, default: 'مستخدم ميزان' },
  },
  { timestamps: true }
);

export const DayModel = mongoose.models.DayRecord || mongoose.model<IDayRecord>('DayRecord', DayRecordSchema);
export const HabitModel = mongoose.models.Habit || mongoose.model<IHabit>('Habit', HabitSchema);
export const SettingsModel = mongoose.models.UserSettings || mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
