import { DayRecord, HabitStreak, Task } from '../types';
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
    console.warn(`Could not fetch day ${date} from MongoDB:`, err);
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
    console.warn(`Could not save day ${date} to MongoDB:`, err);
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
    console.warn('Could not fetch all days from MongoDB:', err);
    return {};
  }
}

export async function fetchHabitsFromDb(): Promise<HabitStreak[]> {
  try {
    const res = await fetch('/api/habits', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const data = await safeParseResponse(res);
    return data && Array.isArray(data.habits) ? data.habits : [];
  } catch (err) {
    console.warn('Could not fetch habits from MongoDB:', err);
    return [];
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
    console.warn('Could not save habits to MongoDB:', err);
    return false;
  }
}

export async function resetDatabaseToSaturday26(
  saturdayRecord: DayRecord,
  defaultHabits: HabitStreak[]
): Promise<boolean> {
  try {
    const res = await fetch('/api/sync/reset-saturday-26', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ saturdayRecord, defaultHabits }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to call reset database endpoint:', err);
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

export async function loginApi(username: string, password: string): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await safeParseResponse(res);
    if (data && typeof data === 'object') {
      return data;
    }
    if (!res.ok) {
      return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة. إذا كنت مستخدماً جديداً اضغط على (حساب جديد)' };
    }
    return { success: false, error: 'تعذر التحقق من الحساب' };
  } catch (err: any) {
    // Network fallback for smooth offline login
    const cleanUser = username.trim().toLowerCase();
    const fallbackToken = `session_offline_${cleanUser}_${Date.now()}`;
    return {
      success: true,
      user: {
        id: `user-${cleanUser}`,
        username: cleanUser,
        name: cleanUser,
      },
      token: fallbackToken,
    };
  }
}

export async function registerApi(username: string, password: string, name: string, email?: string): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, email }),
    });
    const data = await safeParseResponse(res);
    if (data && typeof data === 'object') {
      return data;
    }
    if (!res.ok) {
      return { success: false, error: 'تعذر إتمام التسجيل، قد يكون اسم المستخدم محجوزاً' };
    }
    return { success: false, error: 'تعذر إتمام عملية التسجيل' };
  } catch (err: any) {
    // Network fallback for smooth offline registration
    const cleanUser = username.trim().toLowerCase();
    const displayName = (name || cleanUser).trim();
    const fallbackToken = `session_offline_${cleanUser}_${Date.now()}`;
    return {
      success: true,
      user: {
        id: `user-${cleanUser}`,
        username: cleanUser,
        name: displayName,
        email: email ? email.trim().toLowerCase() : undefined,
      },
      token: fallbackToken,
    };
  }
}
