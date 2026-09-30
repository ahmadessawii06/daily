import mongoose, { Schema, Document } from 'mongoose';
import { TaskCategory, TaskStatus } from '../types';

// Disable command buffering so queries fail-fast when DB is offline instead of hanging
mongoose.set('bufferCommands', false);

function getMongoUri(): string {
  let uri = process.env.MONGODB_URI || '';
  if (uri.includes('<db_password>') && process.env.MONGODB_PASSWORD) {
    uri = uri.replace('<db_password>', process.env.MONGODB_PASSWORD);
  }
  return uri.trim();
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

  const uri = getMongoUri();
  if (!uri) {
    isConnected = false;
    lastError = 'MONGODB_URI not configured - operating in isolated memory/local storage mode';
    return null;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
      socketTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority',
    }).then(() => {
      isConnected = true;
      lastError = null;
      console.log(' Successfully connected to MongoDB Atlas database:', mongoose.connection.name);
      return mongoose;
    });

    return await connectionPromise;
  } catch (err: any) {
    isConnected = false;
    lastError = err.message || 'Connection failed';
    console.warn(' MongoDB Atlas Notice:', err.message);
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

export interface IDayRecord extends Document {
  userId: string;
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
    updatedAt: { type: String },
  },
  { _id: false }
);

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

// Compound index so each user has their own unique date record
DayRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

// 2. Habit Schema (Per-user)
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

// 3. User Settings Schema (Per-user)
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

// 4. User Account Schema
export interface IUser extends Document {
  username: string;
  passwordHash: string;
  name: string;
  email?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
  },
  { timestamps: true }
);

export const DayModel = mongoose.models.DayRecord || mongoose.model<IDayRecord>('DayRecord', DayRecordSchema);
export const HabitModel = mongoose.models.Habit || mongoose.model<IHabit>('Habit', HabitSchema);
export const SettingsModel = mongoose.models.UserSettings || mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
