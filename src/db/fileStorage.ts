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

export interface StoredUser {
  id: string;
  userCode: string;
  name?: string;
  createdAt: string;
}

// Generate an easy-to-read, memorable 6-character alphanumeric code (e.g. A7K9P2)
// Avoiding easily confused characters (like 0 and O, 1 and I)
export function generateUserCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  return code;
}

export const fileStore = {
  // Users Store
  getUsers(): Record<string, StoredUser> {
    return readJsonFile<Record<string, StoredUser>>('users.json', {});
  },

  findUserByCode(code: string): StoredUser | null {
    if (!code) return null;
    const users = this.getUsers();
    const clean = code.trim().toUpperCase();
    return users[clean] || null;
  },

  findUserById(userId: string): StoredUser | null {
    if (!userId) return null;
    const users = this.getUsers();
    return Object.values(users).find((u) => u.id === userId) || null;
  },

  createUser(customName?: string): StoredUser {
    const users = this.getUsers();
    
    // Generate a guaranteed unique code
    let code = generateUserCode();
    while (users[code]) {
      code = generateUserCode();
    }

    const userId = `usr_${code}`;
    const newUser: StoredUser = {
      id: userId,
      userCode: code,
      name: (customName && customName.trim()) ? customName.trim() : `مستخدم ${code}`,
      createdAt: new Date().toISOString(),
    };

    users[code] = newUser;
    writeJsonFile('users.json', users);
    return newUser;
  },

  saveUser(user: StoredUser): void {
    const users = this.getUsers();
    users[user.userCode.trim().toUpperCase()] = user;
    writeJsonFile('users.json', users);
  },

  // Days Store (Strictly isolated by userId)
  getDays(userId: string): Record<string, any> {
    if (!userId) return {};
    const allDays = readJsonFile<Record<string, Record<string, any>>>('days.json', {});
    return allDays[userId] || {};
  },

  saveDay(userId: string, date: string, dayData: any): void {
    if (!userId || !date) return;
    const allDays = readJsonFile<Record<string, Record<string, any>>>('days.json', {});
    if (!allDays[userId]) allDays[userId] = {};
    allDays[userId][date] = { ...dayData, userId, date, updatedAt: new Date().toISOString() };
    writeJsonFile('days.json', allDays);
  },

  saveAllDays(userId: string, daysMap: Record<string, any>): void {
    if (!userId || !daysMap) return;
    const allDays = readJsonFile<Record<string, Record<string, any>>>('days.json', {});
    allDays[userId] = { ...(allDays[userId] || {}), ...daysMap };
    writeJsonFile('days.json', allDays);
  },

  // Habits Store (Strictly isolated by userId)
  getHabits(userId: string): any[] {
    if (!userId) return [];
    const allHabits = readJsonFile<Record<string, any[]>>('habits.json', {});
    return allHabits[userId] || [];
  },

  saveHabits(userId: string, habits: any[]): void {
    if (!userId || !Array.isArray(habits)) return;
    const allHabits = readJsonFile<Record<string, any[]>>('habits.json', {});
    allHabits[userId] = habits;
    writeJsonFile('habits.json', allHabits);
  },

  // Settings Store (Strictly isolated by userId)
  getSettings(userId: string): any {
    if (!userId) return { theme: 'dark', lang: 'ar' };
    const allSettings = readJsonFile<Record<string, any>>('settings.json', {});
    return allSettings[userId] || { theme: 'dark', lang: 'ar' };
  },

  saveSettings(userId: string, settings: any): void {
    if (!userId || !settings) return;
    const allSettings = readJsonFile<Record<string, any>>('settings.json', {});
    allSettings[userId] = { ...(allSettings[userId] || {}), ...settings, updatedAt: new Date().toISOString() };
    writeJsonFile('settings.json', allSettings);
  },
};
