import { DayRecord, HabitStreak, Task, Theme } from '../types';

export interface DbHealthStatus {
  connected: boolean;
  database?: string;
  error?: string;
  ipWhitelistNeeded?: boolean;
}

export async function checkDbHealth(): Promise<DbHealthStatus> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      return { connected: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return {
      connected: data.connected === true,
      database: data.database,
      error: data.error,
      ipWhitelistNeeded: data.ipWhitelistNeeded === true,
    };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}

export async function fetchDayFromDb(date: string): Promise<DayRecord | null> {
  try {
    const res = await fetch(`/api/days/${date}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.found && Array.isArray(data.tasks)) {
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
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch('/api/days');
    if (!res.ok) return {};
    const data = await res.json();
    return data.days || {};
  } catch (err) {
    console.warn('Could not fetch all days from MongoDB:', err);
    return {};
  }
}

export async function fetchHabitsFromDb(): Promise<HabitStreak[]> {
  try {
    const res = await fetch('/api/habits');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.habits) ? data.habits : [];
  } catch (err) {
    console.warn('Could not fetch habits from MongoDB:', err);
    return [];
  }
}

export async function saveHabitsToDb(habits: HabitStreak[]): Promise<boolean> {
  try {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  habits: HabitStreak[]
): Promise<boolean> {
  try {
    const res = await fetch('/api/sync/reset-database-to-saturday-26', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saturdayRecord, habits }),
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
    const res = await fetch('/api/sync/migrate-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days, habits }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, importedCount: data.importedDaysCount };
  } catch (err) {
    console.error('Migration failed:', err);
    return { success: false };
  }
}
