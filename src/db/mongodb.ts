import mongoose, { Schema, Document } from 'mongoose';
import { TaskCategory, TaskStatus } from '../types';

// Disable command buffering so queries fail-fast when DB is offline instead of hanging for 10s
mongoose.set('bufferCommands', false);

function getMongoUri(): string {
  let uri = process.env.MONGODB_URI || '';
  if (uri.includes('<db_password>') || uri.includes('<password>')) {
    uri = uri.replace('<db_password>', 'l8QCwdKq9QM4ygj6').replace('<password>', 'l8QCwdKq9QM4ygj6');
  }
  if (!uri) {
    uri =
      'mongodb+srv://gamadmktol_db_user:l8QCwdKq9QM4ygj6@cluster0.09l0tvf.mongodb.net/daily_tasks_app?retryWrites=true&w=majority&appName=Cluster0';
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

  const uri = getMongoUri();
  if (!uri) {
    isConnected = false;
    lastError = 'MONGODB_URI not configured - operating in resilient local/memory mode';
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
    if (err.message && (err.message.includes('bad auth') || err.message.includes('authentication failed'))) {
      console.warn(' MongoDB Atlas Notice: Authentication failed. Please check MONGODB_URI in environment settings.');
    } else {
      console.warn(' MongoDB Atlas Notice:', err.message);
    }
    return null;
  } finally {
    connectionPromise = null;
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

// 5. Recurring Item Schema (V2 Life Balance & Routine)
export interface IRecurringItemDoc extends Document {
  id: string;
  title: string;
  category: string;
  frequency: string;
  selectedDays?: number[];
  everyXDays?: number;
  targetDuration?: number;
  preferredTime?: string;
  priority?: string;
  icon?: string;
  isActive: boolean;
  startDate: string;
  lastCompletedDate?: string;
  currentStreak: number;
  bestStreak: number;
  completionHistory: Record<string, boolean>;
  userId?: string;
  updatedAt: Date;
}

const RecurringItemSchema = new Schema<IRecurringItemDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    category: { type: String, default: 'general' },
    frequency: { type: String, default: 'daily' },
    selectedDays: { type: [Number], default: [] },
    everyXDays: { type: Number, default: 1 },
    targetDuration: { type: Number, default: 30 },
    preferredTime: { type: String },
    priority: { type: String, default: 'medium' },
    icon: { type: String, default: '🔁' },
    isActive: { type: Boolean, default: true },
    startDate: { type: String, required: true },
    lastCompletedDate: { type: String },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    completionHistory: { type: Schema.Types.Mixed, default: {} },
    userId: { type: String, default: 'default_user' },
  },
  { timestamps: true }
);

export const DayModel = mongoose.models.DayRecord || mongoose.model<IDayRecord>('DayRecord', DayRecordSchema);
export const HabitModel = mongoose.models.Habit || mongoose.model<IHabit>('Habit', HabitSchema);
export const SettingsModel = mongoose.models.UserSettings || mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const RecurringModel = mongoose.models.RecurringItem || mongoose.model<IRecurringItemDoc>('RecurringItem', RecurringItemSchema);


