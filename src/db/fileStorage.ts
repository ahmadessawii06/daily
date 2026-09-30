import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create data directory:', e);
}

function getFilePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

function readJsonFile<T>(filename: string, defaultValue: T): T {
  try {
    const filePath = getFilePath(filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content && content.trim()) {
        return JSON.parse(content);
      }
    }
  } catch (err) {
    console.warn(`Error reading ${filename}:`, err);
  }
  return defaultValue;
}

function writeJsonFile<T>(filename: string, data: T): void {
  try {
    const filePath = getFilePath(filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`Error writing ${filename}:`, err);
  }
}

// Persistent Stores
export interface FileUser {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  email?: string;
  createdAt: string;
}

export const fileStore = {
  // Users
  getUsers(): Record<string, FileUser> {
    return readJsonFile<Record<string, FileUser>>('users.json', {});
  },
  saveUser(user: FileUser): void {
    const users = this.getUsers();
    users[user.username.toLowerCase()] = user;
    writeJsonFile('users.json', users);
  },
  findUser(username: string): FileUser | null {
    const users = this.getUsers();
    return users[username.toLowerCase()] || null;
  },

  // Days
  getDays(userId: string): Record<string, any> {
    const allDays = readJsonFile<Record<string, Record<string, any>>>('days.json', {});
    return allDays[userId] || {};
  },
  saveDay(userId: string, date: string, dayData: any): void {
    const allDays = readJsonFile<Record<string, Record<string, any>>>('days.json', {});
    if (!allDays[userId]) allDays[userId] = {};
    allDays[userId][date] = { ...dayData, userId, date, updatedAt: new Date().toISOString() };
    writeJsonFile('days.json', allDays);
  },
  saveAllDays(userId: string, daysMap: Record<string, any>): void {
    const allDays = readJsonFile<Record<string, Record<string, any>>>('days.json', {});
    allDays[userId] = { ...(allDays[userId] || {}), ...daysMap };
    writeJsonFile('days.json', allDays);
  },

  // Habits
  getHabits(userId: string): any[] {
    const allHabits = readJsonFile<Record<string, any[]>>('habits.json', {});
    return allHabits[userId] || [];
  },
  saveHabits(userId: string, habits: any[]): void {
    const allHabits = readJsonFile<Record<string, any[]>>('habits.json', {});
    allHabits[userId] = habits;
    writeJsonFile('habits.json', allHabits);
  },

  // Settings
  getSettings(userId: string): any {
    const allSettings = readJsonFile<Record<string, any>>('settings.json', {});
    return allSettings[userId] || { theme: 'dark', lang: 'ar' };
  },
  saveSettings(userId: string, settings: any): void {
    const allSettings = readJsonFile<Record<string, any>>('settings.json', {});
    allSettings[userId] = { ...(allSettings[userId] || {}), ...settings, updatedAt: new Date().toISOString() };
    writeJsonFile('settings.json', allSettings);
  },
};
