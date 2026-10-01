import { DayRecord, HabitStreak, Task, User, RecurringItem } from '../types';
import { getAuthToken } from '../utils/auth';

export interface DbHealthStatus {
  connected: boolean;
  database?: string;
  error?: string;
  ipWhitelistNeeded?: boolean;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['x-user-code'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function safeParseResponse(res: Response): Promise<any> {
  try {
    const text = await res.text();
    if (!text || text.trim() === '') return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function checkDbHealth(): Promise<DbHealthStatus> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      return { connected: false, error: `HTTP ${res.status}` };
    }
    const data = await safeParseResponse(res);
    if (!data) {
      return { connected: false, error: 'استجابة غير صالحة من الخادم' };
    }
    return {
      connected: data.connected === true,
      database: data.database,
      error: data.error,
    };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}

// 1. Create New User (Generates User Code e.g. A7K9P2)
export async function createUserApi(name?: string): Promise<{ success: boolean; user?: User; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await safeParseResponse(res);
    if (data && typeof data === 'object') {
      return data;
    }
    return { success: false, error: 'تعذر إنشاء كود جديد، يرجى المحاولة ثانية' };
  } catch (err: any) {
    return { success: false, error: 'تعذر الاتصال بالخادم' };
  }
}

// 2. Access Existing User by User Code (e.g. from Laptop, Phone, iPad)
export async function accessUserApi(userCode: string): Promise<{ success: boolean; user?: User; message?: string; error?: string }> {
  try {
    const cleanCode = userCode.trim().toUpperCase();
    const res = await fetch('/api/users/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userCode: cleanCode }),
    });
    const data = await safeParseResponse(res);
    if (data && typeof data === 'object') {
      return data;
    }
    return { success: false, error: 'تعذر التحقق من كود ميزان' };
  } catch (err: any) {
    return { success: false, error: 'تعذر الاتصال بالخادم، تأكد من اتصال الإنترنت' };
  }
}

// Legacy aliases for backward compatibility
export async function loginApi(userCodeOrUser: string, _password?: string) {
  return accessUserApi(userCodeOrUser);
}

export async function registerApi(userCodeOrUser: string, _pass?: string, name?: string) {
  return createUserApi(name);
}

// 3. User Days Endpoints
export async function fetchDayFromDb(date: string): Promise<DayRecord | null> {
  try {
    const res = await fetch(`/api/days/${date}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const data = await safeParseResponse(res);
    if (data && data.found && Array.isArray(data.tasks)) {
      return {
        date: data.date,
        tasks: data.tasks,
        notes: data.notes || '',
        updatedAt: data.updatedAt,
      };
    }
    return null;
  } catch (err) {
    console.warn(`Could not fetch day ${date}:`, err);
    return null;
  }
}

export async function saveDayToDb(date: string, tasks: Task[], notes?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/days/${date}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tasks, notes }),
    });
    return res.ok;
  } catch (err) {
    console.warn(`Could not save day ${date}:`, err);
    return false;
  }
}

export async function fetchAllDaysFromDb(): Promise<Record<string, DayRecord>> {
  try {
    const res = await fetch('/api/days', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return {};
    const data = await safeParseResponse(res);
    return data?.days || {};
  } catch (err) {
    console.warn('Could not fetch all days:', err);
    return {};
  }
}

// 4. Batch Sync
export async function batchSyncWithMongo(
  days: Record<string, DayRecord>,
  habits?: HabitStreak[],
  settings?: any
): Promise<{ success: boolean; days?: Record<string, DayRecord>; habits?: any[]; settings?: any }> {
  try {
    const res = await fetch('/api/sync/batch', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ days, habits, settings }),
    });
    if (!res.ok) return { success: false };
    const data = await safeParseResponse(res);
    return {
      success: true,
      days: data?.days,
      habits: data?.habits,
      settings: data?.settings,
    };
  } catch (err) {
    console.warn('Batch sync notice:', err);
    return { success: false };
  }
}

// 5. Habits Endpoints
export async function fetchHabitsFromDb(): Promise<HabitStreak[] | null> {
  try {
    const res = await fetch('/api/habits', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const data = await safeParseResponse(res);
    return data?.habits || null;
  } catch (err) {
    console.warn('Could not fetch habits:', err);
    return null;
  }
}

export async function saveHabitsToDb(habits: HabitStreak[]): Promise<boolean> {
  try {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ habits }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not save habits:', err);
    return false;
  }
}

// 6. User Settings Endpoints
export async function fetchSettingsFromDb(): Promise<any | null> {
  try {
    const res = await fetch('/api/settings', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const data = await safeParseResponse(res);
    return data?.settings || null;
  } catch (err) {
    console.warn('Could not fetch settings:', err);
    return null;
  }
}

export async function saveSettingsToDb(settings: {
  theme?: string;
  lang?: string;
  prayerLocation?: any;
  prayerTimes?: any;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not save settings:', err);
    return false;
  }
}

// 8. Migration & Reset Endpoints
export async function resetDatabaseToSaturday26(
  saturdayRecord: DayRecord,
  defaultHabits: HabitStreak[]
): Promise<boolean> {
  try {
    const res = await fetch('/api/sync/batch', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        days: { '2026-09-26': saturdayRecord },
        habits: defaultHabits,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to call reset database endpoint:', err);
    return false;
  }
}

export async function fetchRecurringFromDb(): Promise<RecurringItem[] | null> {
  try {
    const res = await fetch('/api/habits', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const data = await safeParseResponse(res);
    return data?.habits || null;
  } catch {
    return null;
  }
}

export async function saveRecurringToDb(items: RecurringItem[]): Promise<boolean> {
  try {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ habits: items }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function migrateLocalDataToMongo(
  days: Record<string, DayRecord>,
  habits: HabitStreak[]
): Promise<{ success: boolean; importedCount?: number }> {
  try {
    const res = await fetch('/api/sync/batch', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ days, habits }),
    });
    if (!res.ok) return { success: false };
    const data = await safeParseResponse(res);
    return { success: !!data?.success, importedCount: Object.keys(days || {}).length };
  } catch (err) {
    console.error('Migration failed:', err);
    return { success: false };
  }
}
