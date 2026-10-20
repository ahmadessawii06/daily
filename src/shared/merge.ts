import type { DayRecord, Task } from '../types';

export function timestamp(value?: string): number {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
}

// Deletions travel with the record so offline devices cannot resurrect tasks.
export function mergeDay(local: DayRecord | undefined, incoming: DayRecord): DayRecord {
  if (!local) local = { ...incoming, tasks: [], deletedTaskIds: {} };
  const deleted = { ...local.deletedTaskIds };
  for (const [id, time] of Object.entries(incoming.deletedTaskIds || {})) {
    if (timestamp(time) >= timestamp(deleted[id])) deleted[id] = time;
  }
  const tasks = new Map<string, Task>();
  for (const record of [local, incoming]) {
    for (const task of record.tasks) {
      const normalized = { ...task, updatedAt: task.updatedAt || task.createdAt || record.updatedAt };
      const previous = tasks.get(task.id);
      if (!previous || timestamp(normalized.updatedAt) >= timestamp(previous.updatedAt)) tasks.set(task.id, normalized);
    }
  }
  for (const [id, task] of tasks) {
    if (deleted[id] && timestamp(deleted[id]) >= timestamp(task.updatedAt)) tasks.delete(id);
  }
  const newest = timestamp(incoming.updatedAt) >= timestamp(local.updatedAt) ? incoming : local;
  const hasPhotos = (record: DayRecord) => record.dayPhoto !== undefined || record.dayPhotos !== undefined;
  const photo = !hasPhotos(incoming) ? local : !hasPhotos(local) ? incoming : timestamp(incoming.dayPhotoUpdatedAt) >= timestamp(local.dayPhotoUpdatedAt) ? incoming : local;
  return { ...newest, dayPhoto: photo.dayPhoto, dayPhotos: photo.dayPhotos, dayPhotoUpdatedAt: photo.dayPhotoUpdatedAt, tasks: [...tasks.values()], deletedTaskIds: deleted };
}

export function nextRecordTimestamp(record?: DayRecord): string {
  const previous = [record?.updatedAt, ...Object.values(record?.deletedTaskIds || {}), ...(record?.tasks || []).map(t => t.updatedAt || t.createdAt)];
  return new Date(Math.max(Date.now(), ...previous.map(value => timestamp(value) + 1))).toISOString();
}
