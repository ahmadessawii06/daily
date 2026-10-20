// Legacy photo metadata can be null or malformed. Reuse the record's edit time
// rather than inventing a newer time that could overwrite another device's photo.
export function normalizePhotoTimestamp(data: { dayPhotoUpdatedAt?: unknown; dayPhoto?: unknown; dayPhotos?: unknown }, updatedAt: string): string | undefined {
  if (typeof data.dayPhotoUpdatedAt === 'string' && Number.isFinite(Date.parse(data.dayPhotoUpdatedAt))) return data.dayPhotoUpdatedAt;
  if (data.dayPhotoUpdatedAt === undefined) return undefined;
  if ((typeof data.dayPhoto === 'string' || Array.isArray(data.dayPhotos)) && Number.isFinite(Date.parse(updatedAt))) return updatedAt;
  return undefined;
}
