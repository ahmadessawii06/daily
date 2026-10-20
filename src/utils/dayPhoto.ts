import type { DayRecord } from '../types';

// Upgrade legacy photos without dropping images or changing their edit timestamp.
export async function prepareDayForSync(day: DayRecord): Promise<DayRecord> {
  const normalize = async (photo: unknown): Promise<string> => {
    if (typeof photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo)) throw new Error('Invalid day photo');
    if (photo.startsWith('data:image/jpeg;') && photo.length <= 100000) return photo;
    const [header, encoded] = photo.split(',');
    const bytes = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
    return prepareDayPhoto(new File([bytes], 'day-photo', { type: header.slice(5, header.indexOf(';')) }));
  };
  try {
    const result = { ...day };
    if (Array.isArray(day.dayPhotos)) result.dayPhoto = '';
    else if (day.dayPhoto === null) result.dayPhoto = '';
    else if (day.dayPhoto !== undefined && day.dayPhoto !== '') result.dayPhoto = await normalize(day.dayPhoto);
    if (day.dayPhotos === null) delete result.dayPhotos;
    else if (day.dayPhotos !== undefined) {
      if (!Array.isArray(day.dayPhotos)) throw new Error('Invalid day photos');
      result.dayPhotos = [];
      for (const photo of day.dayPhotos) result.dayPhotos.push(await normalize(photo));
    }
    return result;
  } catch {
    throw new Error(`Invalid day photo (${day.date})`);
  }
}

// Re-encode to a compact JPEG; this also removes camera metadata.
export async function prepareDayPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('format');
  if (file.size > 20 * 1024 * 1024) throw new Error('size');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    const ratio = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('decode');
    for (let attempt = 0; attempt < 6; attempt++) {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.8, 0.65, 0.5, 0.35]) {
        const result = canvas.toDataURL('image/jpeg', quality);
        if (result.length <= 100000 && result.startsWith('data:image/jpeg;base64,')) return result;
      }
      canvas.width = Math.max(1, Math.round(canvas.width * 0.75));
      canvas.height = Math.max(1, Math.round(canvas.height * 0.75));
    }
    throw new Error('size');
  } finally { URL.revokeObjectURL(url); }
}
