import type { DayRecord, HabitStreak, PlannerWorkspace, Task, User } from '../types';
import { parseWorkspace } from '../shared/workspace';
import { getAuthToken } from '../utils/auth';
import { enqueue, enqueueDay } from './syncQueue';
import { triggerSync } from './syncEngine';

export interface DbHealthStatus { connected: boolean; database?: string; error?: string; ipWhitelistNeeded?: boolean; }
export async function requestApi(path: string, body?: unknown): Promise<any> {
  const token = getAuthToken();
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('الخادم غير متاح');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'تعذر إكمال الطلب');
  return data;
}

export async function checkDbHealth(): Promise<DbHealthStatus> {
  try { return await requestApi('/health'); }
  catch (err) { return { connected: false, error: (err as Error).message }; }
}

export async function fetchDayFromDb(date: string): Promise<DayRecord | null> {
  try { const record = await requestApi(`/days/${date}`); return record.found ? record : null; }
  catch { return null; }
}
export async function fetchAllDaysFromDb(): Promise<Record<string, DayRecord>> {
  try { return (await requestApi('/days')).days || {}; } catch { return {}; }
}
export async function saveDayToDb(date: string, tasks: Task[], notes?: string): Promise<boolean> {
  enqueueDay({ date, tasks, notes, updatedAt: new Date().toISOString() });
  return true;
}
export async function fetchHabitsFromDb(): Promise<HabitStreak[]> {
  try { return (await requestApi('/habits')).habits; } catch { return []; }
}
export async function saveHabitsToDb(habits: HabitStreak[]): Promise<boolean> { enqueue('habits', habits); return true; }
export async function fetchRecurringFromDb(): Promise<any[]> {
  try { return (await requestApi('/recurring')).recurring; } catch { return []; }
}
export async function saveRecurringToDb(recurring: any[]): Promise<boolean> { enqueue('recurring', recurring); return true; }
export async function migrateLocalDataToMongo(days: Record<string, DayRecord>, habits: HabitStreak[]): Promise<{ success: boolean; importedCount?: number }> {
  for (const day of Object.values(days)) enqueueDay(day);
  enqueue('habits', habits);
  const success = await triggerSync(undefined, true);
  return { success, importedCount: success ? Object.keys(days).length : 0 };
}

type AuthResponse = { success: boolean; user?: User; token?: string; error?: string; workspace?: PlannerWorkspace };
async function authenticate(path: string, body: unknown): Promise<AuthResponse> {
  try {
    const result = await requestApi(path, body);
    if (!result.user?.id || !result.user?.userCode || !result.token) throw new Error('استجابة تسجيل الدخول غير صالحة');
    if (result.workspace) result.workspace = parseWorkspace(result.workspace);
    return result;
  } catch (err) { return { success: false, error: (err as Error).message }; }
}
export function loginApi(username: string, password: string): Promise<AuthResponse> {
  return authenticate('/auth/login', { username: username.trim().toLowerCase(), password });
}
export function registerApi(username: string, password: string, name: string, email?: string): Promise<AuthResponse> {
  return authenticate('/auth/register', { username: username.trim().toLowerCase(), password, name, email });
}
