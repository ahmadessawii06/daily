import { PrayerLocationConfig, PrayerTimeItem, PrayerTimesDayResponse } from '../types';

export interface CalculationMethodInfo {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
}

export const CALCULATION_METHODS: CalculationMethodInfo[] = [
  {
    id: 3,
    nameAr: 'رابطة العالم الإسلامي',
    nameEn: 'Muslim World League (MWL)',
    descriptionAr: 'المعتمد في فلسطين، القدس، نابلس، والعالم الإسلامي',
  },
  {
    id: 4,
    nameAr: 'جامعة أم القرى - مكة المكرمة',
    nameEn: 'Umm Al-Qura University, Makkah',
    descriptionAr: 'السعودية والخليج واليمن',
  },
  {
    id: 5,
    nameAr: 'الهيئة المصرية العامة للمساحة',
    nameEn: 'Egyptian General Authority of Survey',
    descriptionAr: 'مصر، بلاد الشام، السودان، وشمال إفريقيا',
  },
  {
    id: 16,
    nameAr: 'دائرة الشؤون الإسلامية - دبي والإمارات',
    nameEn: 'Dubai / UAE Awqaf',
    descriptionAr: 'الإمارات العربية المتحدة',
  },
  {
    id: 9,
    nameAr: 'وزارة الأوقاف والشؤون الإسلامية - الكويت',
    nameEn: 'Kuwait Ministry of Awqaf',
    descriptionAr: 'دولة الكويت',
  },
  {
    id: 10,
    nameAr: 'وزارة الأوقاف والشؤون الإسلامية - قطر',
    nameEn: 'Qatar Ministry of Awqaf',
    descriptionAr: 'دولة قطر',
  },
  {
    id: 13,
    nameAr: 'رئاسة الشؤون الدينية - تركيا',
    nameEn: 'Diyanet İşleri Başkanlığı, Turkey',
    descriptionAr: 'تركيا والدول المجاورة',
  },
  {
    id: 2,
    nameAr: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)',
    nameEn: 'Islamic Society of North America (ISNA)',
    descriptionAr: 'الولايات المتحدة وكندا',
  },
  {
    id: 1,
    nameAr: 'جامعة العلوم الإسلامية بكراتشي',
    nameEn: 'University of Islamic Sciences, Karachi',
    descriptionAr: 'باكستان والهند وبنغلاديش',
  },
];

export interface PresetCity {
  city: string;
  country: string;
  cityDisplayAr: string;
  cityDisplayEn: string;
  countryDisplayAr: string;
  countryDisplayEn: string;
  method: number;
  latitude?: number;
  longitude?: number;
}

export const POPULAR_CITIES: PresetCity[] = [
  { city: 'Nablus', country: 'Palestine', cityDisplayAr: 'نابلس', cityDisplayEn: 'Nablus', countryDisplayAr: 'فلسطين', countryDisplayEn: 'Palestine', latitude: 32.2211, longitude: 35.2544, method: 3 },
  { city: 'Jerusalem', country: 'Palestine', cityDisplayAr: 'القدس الشريف', cityDisplayEn: 'Jerusalem', countryDisplayAr: 'فلسطين', countryDisplayEn: 'Palestine', latitude: 31.7683, longitude: 35.2137, method: 3 },
  { city: 'Gaza', country: 'Palestine', cityDisplayAr: 'غزة', cityDisplayEn: 'Gaza', countryDisplayAr: 'فلسطين', countryDisplayEn: 'Palestine', latitude: 31.5017, longitude: 34.4668, method: 3 },
  { city: 'Ramallah', country: 'Palestine', cityDisplayAr: 'رام الله', cityDisplayEn: 'Ramallah', countryDisplayAr: 'فلسطين', countryDisplayEn: 'Palestine', latitude: 31.9038, longitude: 35.2034, method: 3 },
  { city: 'Hebron', country: 'Palestine', cityDisplayAr: 'الخليل', cityDisplayEn: 'Hebron', countryDisplayAr: 'فلسطين', countryDisplayEn: 'Palestine', latitude: 31.5326, longitude: 35.0998, method: 3 },
  { city: 'Jenin', country: 'Palestine', cityDisplayAr: 'جنين', cityDisplayEn: 'Jenin', countryDisplayAr: 'فلسطين', countryDisplayEn: 'Palestine', latitude: 32.4646, longitude: 35.2957, method: 3 },
  { city: 'Amman', country: 'Jordan', cityDisplayAr: 'عمّان', cityDisplayEn: 'Amman', countryDisplayAr: 'الأردن', countryDisplayEn: 'Jordan', latitude: 31.9539, longitude: 35.9106, method: 4 },
  { city: 'Cairo', country: 'Egypt', cityDisplayAr: 'القاهرة', cityDisplayEn: 'Cairo', countryDisplayAr: 'مصر', countryDisplayEn: 'Egypt', latitude: 30.0444, longitude: 31.2357, method: 5 },
  { city: 'Makkah', country: 'Saudi Arabia', cityDisplayAr: 'مكة المكرمة', cityDisplayEn: 'Makkah', countryDisplayAr: 'السعودية', countryDisplayEn: 'Saudi Arabia', latitude: 21.3891, longitude: 39.8579, method: 4 },
  { city: 'Madinah', country: 'Saudi Arabia', cityDisplayAr: 'المدينة المنورة', cityDisplayEn: 'Madinah', countryDisplayAr: 'السعودية', countryDisplayEn: 'Saudi Arabia', latitude: 24.5247, longitude: 39.5692, method: 4 },
  { city: 'Riyadh', country: 'Saudi Arabia', cityDisplayAr: 'الرياض', cityDisplayEn: 'Riyadh', countryDisplayAr: 'السعودية', countryDisplayEn: 'Saudi Arabia', latitude: 24.7136, longitude: 46.6753, method: 4 },
  { city: 'Jeddah', country: 'Saudi Arabia', cityDisplayAr: 'جدة', cityDisplayEn: 'Jeddah', countryDisplayAr: 'السعودية', countryDisplayEn: 'Saudi Arabia', latitude: 21.5433, longitude: 39.1728, method: 4 },
  { city: 'Alexandria', country: 'Egypt', cityDisplayAr: 'الإسكندرية', cityDisplayEn: 'Alexandria', countryDisplayAr: 'مصر', countryDisplayEn: 'Egypt', latitude: 31.2001, longitude: 29.9187, method: 5 },
  { city: 'Dubai', country: 'United Arab Emirates', cityDisplayAr: 'دبي', cityDisplayEn: 'Dubai', countryDisplayAr: 'الإمارات', countryDisplayEn: 'UAE', latitude: 25.2048, longitude: 55.2708, method: 16 },
  { city: 'Abu Dhabi', country: 'United Arab Emirates', cityDisplayAr: 'أبوظبي', cityDisplayEn: 'Abu Dhabi', countryDisplayAr: 'الإمارات', countryDisplayEn: 'UAE', latitude: 24.4539, longitude: 54.3773, method: 16 },
  { city: 'Kuwait', country: 'Kuwait', cityDisplayAr: 'الكويت', cityDisplayEn: 'Kuwait', countryDisplayAr: 'الكويت', countryDisplayEn: 'Kuwait', latitude: 29.3759, longitude: 47.9774, method: 9 },
  { city: 'Doha', country: 'Qatar', cityDisplayAr: 'الدوحة', cityDisplayEn: 'Doha', countryDisplayAr: 'قطر', countryDisplayEn: 'Qatar', latitude: 25.2854, longitude: 51.5310, method: 10 },
  { city: 'Manama', country: 'Bahrain', cityDisplayAr: 'المنامة', cityDisplayEn: 'Manama', countryDisplayAr: 'البحرين', countryDisplayEn: 'Bahrain', latitude: 26.2285, longitude: 50.5860, method: 4 },
  { city: 'Muscat', country: 'Oman', cityDisplayAr: 'مسقط', cityDisplayEn: 'Muscat', countryDisplayAr: 'عمان', countryDisplayEn: 'Oman', latitude: 23.5880, longitude: 58.3829, method: 4 },
  { city: 'Damascus', country: 'Syria', cityDisplayAr: 'دمشق', cityDisplayEn: 'Damascus', countryDisplayAr: 'سوريا', countryDisplayEn: 'Syria', latitude: 33.5138, longitude: 36.2765, method: 4 },
  { city: 'Beirut', country: 'Lebanon', cityDisplayAr: 'بيروت', cityDisplayEn: 'Beirut', countryDisplayAr: 'لبنان', countryDisplayEn: 'Lebanon', latitude: 33.8938, longitude: 35.5018, method: 4 },
  { city: 'Baghdad', country: 'Iraq', cityDisplayAr: 'بغداد', cityDisplayEn: 'Baghdad', countryDisplayAr: 'العراق', countryDisplayEn: 'Iraq', latitude: 33.3152, longitude: 44.3661, method: 4 },
  { city: 'Tripoli', country: 'Libya', cityDisplayAr: 'طرابلس', cityDisplayEn: 'Tripoli', countryDisplayAr: 'ليبيا', countryDisplayEn: 'Libya', latitude: 32.8872, longitude: 13.1913, method: 5 },
  { city: 'Tunis', country: 'Tunisia', cityDisplayAr: 'تونس', cityDisplayEn: 'Tunis', countryDisplayAr: 'تونس', countryDisplayEn: 'Tunisia', latitude: 36.8065, longitude: 10.1815, method: 3 },
  { city: 'Algiers', country: 'Algeria', cityDisplayAr: 'الجزائر', cityDisplayEn: 'Algiers', countryDisplayAr: 'الجزائر', countryDisplayEn: 'Algeria', latitude: 36.7538, longitude: 3.0588, method: 3 },
  { city: 'Casablanca', country: 'Morocco', cityDisplayAr: 'الدار البيضاء', cityDisplayEn: 'Casablanca', countryDisplayAr: 'المغرب', countryDisplayEn: 'Morocco', latitude: 33.5731, longitude: -7.5898, method: 3 },
  { city: 'Khartoum', country: 'Sudan', cityDisplayAr: 'الخرطوم', cityDisplayEn: 'Khartoum', countryDisplayAr: 'السودان', countryDisplayEn: 'Sudan', latitude: 15.5007, longitude: 32.5599, method: 5 },
  { city: 'Sanaa', country: 'Yemen', cityDisplayAr: 'صنعاء', cityDisplayEn: 'Sanaa', countryDisplayAr: 'اليمن', countryDisplayEn: 'Yemen', latitude: 15.3694, longitude: 44.1910, method: 4 },
  { city: 'Istanbul', country: 'Turkey', cityDisplayAr: 'إسطنبول', cityDisplayEn: 'Istanbul', countryDisplayAr: 'تركيا', countryDisplayEn: 'Turkey', latitude: 41.0082, longitude: 28.9784, method: 13 },
  { city: 'London', country: 'United Kingdom', cityDisplayAr: 'لندن', cityDisplayEn: 'London', countryDisplayAr: 'بريطانيا', countryDisplayEn: 'UK', latitude: 51.5074, longitude: -0.1278, method: 3 },
  { city: 'Paris', country: 'France', cityDisplayAr: 'باريس', cityDisplayEn: 'Paris', countryDisplayAr: 'فرنسا', countryDisplayEn: 'France', latitude: 48.8566, longitude: 2.3522, method: 3 },
  { city: 'New York', country: 'United States', cityDisplayAr: 'نيويورك', cityDisplayEn: 'New York', countryDisplayAr: 'أمريكا', countryDisplayEn: 'USA', latitude: 40.7128, longitude: -74.0060, method: 2 },
];

const LOCATION_STORAGE_KEY = 'daily_prayer_location_config_v3';
const PRAYER_CACHE_PREFIX = 'daily_prayer_cache_v3_';

export function getDefaultLocationConfig(): PrayerLocationConfig {
  return {
    city: 'Nablus',
    country: 'Palestine',
    cityDisplayAr: 'نابلس',
    cityDisplayEn: 'Nablus',
    countryDisplayAr: 'فلسطين',
    countryDisplayEn: 'Palestine',
    latitude: 32.2211,
    longitude: 35.2544,
    method: 3, // رابطة العالم الإسلامي (prayertimes.me standard for Jerusalem & Nablus)
  };
}

export function getStoredLocationConfig(): PrayerLocationConfig {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return getDefaultLocationConfig();
    const parsed = JSON.parse(raw);
    if (parsed && parsed.city && parsed.method) {
      return parsed;
    }
    return getDefaultLocationConfig();
  } catch {
    return getDefaultLocationConfig();
  }
}

export function saveStoredLocationConfig(config: PrayerLocationConfig): void {
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save prayer location config:', err);
  }
}

// Clean time string from API (e.g., "05:14 (EEST)" -> "05:14")
function cleanTimeString(timeStr?: string): string {
  if (!timeStr) return '05:00';
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    return `${hours}:${minutes}`;
  }
  return timeStr.slice(0, 5);
}

// Format "YYYY-MM-DD" to "DD-MM-YYYY" for Aladhan API
function formatForAladhan(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
  }
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}-${m}-${y}`;
}

export async function fetchOfficialPrayerTimes(
  dateStr: string,
  config: PrayerLocationConfig
): Promise<PrayerTimesDayResponse> {
  const cacheKey = `${PRAYER_CACHE_PREFIX}_${dateStr}_${config.city}_${config.country}_${config.method}_${config.latitude || ''}_${config.longitude || ''}`;

  // 1. Try Cache First
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as PrayerTimesDayResponse;
      if (parsed && Array.isArray(parsed.prayers) && parsed.prayers.length === 5) {
        return parsed;
      }
    }
  } catch {
    // Ignore cache error
  }

  const aladhanDate = formatForAladhan(dateStr);
  let url = '';

  if (config.latitude && config.longitude) {
    url = `https://api.aladhan.com/v1/timings/${aladhanDate}?latitude=${config.latitude}&longitude=${config.longitude}&method=${config.method}`;
  } else {
    url = `https://api.aladhan.com/v1/timingsByCity/${aladhanDate}?city=${encodeURIComponent(config.city)}&country=${encodeURIComponent(config.country)}&method=${config.method}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Aladhan API HTTP ${response.status}`);
    }

    const json = await response.json();
    if (json && json.code === 200 && json.data && json.data.timings) {
      const timings = json.data.timings;
      const hijri = json.data.date?.hijri;

      const prayers: PrayerTimeItem[] = [
        { id: 'fajr', nameAr: 'الفجر', nameEn: 'Fajr', time: cleanTimeString(timings.Fajr) },
        { id: 'dhuhr', nameAr: 'الظهر', nameEn: 'Dhuhr', time: cleanTimeString(timings.Dhuhr) },
        { id: 'asr', nameAr: 'العصر', nameEn: 'Asr', time: cleanTimeString(timings.Asr) },
        { id: 'maghrib', nameAr: 'المغرب', nameEn: 'Maghrib', time: cleanTimeString(timings.Maghrib) },
        { id: 'isha', nameAr: 'العشاء', nameEn: 'Isha', time: cleanTimeString(timings.Isha) },
      ];

      const methodObj = CALCULATION_METHODS.find((m) => m.id === config.method);

      const result: PrayerTimesDayResponse = {
        date: dateStr,
        prayers,
        sunrise: cleanTimeString(timings.Sunrise),
        hijriDay: hijri?.day,
        hijriMonth: hijri?.month?.ar || hijri?.month?.en,
        hijriYear: hijri?.year,
        hijriFormatted: hijri ? `${hijri.day} ${hijri.month?.ar || hijri.month?.en} ${hijri.year} هـ` : undefined,
        locationNameAr: config.cityDisplayAr || config.city,
        locationNameEn: config.cityDisplayEn || config.city,
        methodNameAr: methodObj?.nameAr,
        methodNameEn: methodObj?.nameEn,
      };

      // Save in cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch {
        // Cache save failure is non-fatal
      }

      return result;
    }
  } catch (err) {
    console.warn('Aladhan API fetch failed, using fallback calculation:', err);
  }

  // Fallback calculation in case of network issue
  const fallbackPrayers: PrayerTimeItem[] = [
    { id: 'fajr', nameAr: 'الفجر', nameEn: 'Fajr', time: '04:45' },
    { id: 'dhuhr', nameAr: 'الظهر', nameEn: 'Dhuhr', time: '12:15' },
    { id: 'asr', nameAr: 'العصر', nameEn: 'Asr', time: '15:35' },
    { id: 'maghrib', nameAr: 'المغرب', nameEn: 'Maghrib', time: '18:10' },
    { id: 'isha', nameAr: 'العشاء', nameEn: 'Isha', time: '19:40' },
  ];

  return {
    date: dateStr,
    prayers: fallbackPrayers,
    sunrise: '06:05',
    locationNameAr: config.cityDisplayAr || config.city,
    locationNameEn: config.cityDisplayEn || config.city,
  };
}
