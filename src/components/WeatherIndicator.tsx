import React, { useEffect, useState } from 'react';
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Moon,
  RefreshCw,
  Snowflake,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { Language } from '../types';
import { getStoredLocationConfig } from '../utils/prayerTimes';

interface WeatherIndicatorProps {
  lang: Language;
  compact?: boolean;
}

interface WeatherData {
  temp: number;
  code: number;
  isDay: number;
  cityName: string;
  timestamp: number;
}

const WEATHER_CACHE_KEY = 'mizan_weather_cache_v1';
const CACHE_TTL_MS = 25 * 60 * 1000; // 25 minutes cache

function getWeatherInfo(code: number, isDay: number, lang: Language): { label: string; icon: LucideIcon } {
  const ar = lang === 'ar';

  if (code === 0) {
    return {
      label: ar ? (isDay ? 'مشمس' : 'صافٍ') : (isDay ? 'Sunny' : 'Clear'),
      icon: isDay ? Sun : Moon,
    };
  }
  if (code === 1 || code === 2) {
    return {
      label: ar ? 'غائم جزئياً' : 'Partly Cloudy',
      icon: isDay ? CloudSun : CloudMoon,
    };
  }
  if (code === 3) {
    return {
      label: ar ? 'غائم' : 'Overcast',
      icon: Cloud,
    };
  }
  if (code === 45 || code === 48) {
    return {
      label: ar ? 'ضباب' : 'Foggy',
      icon: CloudFog,
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      label: ar ? 'ممطر' : 'Rainy',
      icon: CloudRain,
    };
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return {
      label: ar ? 'ثلج' : 'Snow',
      icon: Snowflake,
    };
  }
  if (code >= 95) {
    return {
      label: ar ? 'عاصف' : 'Thunderstorm',
      icon: CloudLightning,
    };
  }
  return {
    label: ar ? (isDay ? 'معتدل' : 'لطيف') : 'Mild',
    icon: isDay ? Sun : Moon,
  };
}

function readCachedWeather(): WeatherData | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherData;
    if (parsed && typeof parsed.temp === 'number' && typeof parsed.code === 'number') {
      return parsed;
    }
  } catch {
    // Ignore cache parse error
  }
  return null;
}

function writeCachedWeather(data: WeatherData): void {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage write error
  }
}

export const WeatherIndicator: React.FC<WeatherIndicatorProps> = ({ lang, compact = true }) => {
  const ar = lang === 'ar';
  const [weather, setWeather] = useState<WeatherData | null>(() => readCachedWeather());
  const [loading, setLoading] = useState(false);

  const fetchWeather = async (force = false) => {
    const cached = readCachedWeather();
    if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setWeather(cached);
      return;
    }

    try {
      setLoading(true);
      const loc = getStoredLocationConfig();
      const lat = loc.latitude ?? 32.2211;
      const lon = loc.longitude ?? 35.2544;
      const cityName = ar ? (loc.cityDisplayAr || loc.city) : (loc.cityDisplayEn || loc.city);

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`
      );

      if (!res.ok) throw new Error('Weather request failed');
      const data = await res.json();
      const current = data.current;

      const newWeather: WeatherData = {
        temp: Math.round(current.temperature_2m),
        code: current.weather_code ?? 0,
        isDay: current.is_day ?? 1,
        cityName,
        timestamp: Date.now(),
      };

      setWeather(newWeather);
      writeCachedWeather(newWeather);
    } catch {
      // Fallback gracefully to existing cache or mild default
      if (!weather) {
        const loc = getStoredLocationConfig();
        const cityName = ar ? (loc.cityDisplayAr || loc.city) : (loc.cityDisplayEn || loc.city);
        const fallback: WeatherData = {
          temp: 22,
          code: 1,
          isDay: 1,
          cityName,
          timestamp: Date.now(),
        };
        setWeather(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchWeather();
    // Refresh periodically every 30 minutes
    const interval = window.setInterval(() => {
      void fetchWeather();
    }, 30 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (!weather) return null;

  const info = getWeatherInfo(weather.code, weather.isDay, lang);
  const Icon = info.icon;

  const tooltip = ar
    ? `الطقس اليوم في ${weather.cityName}: ${info.label}، ${weather.temp}° مئوية — انقر للتحديث`
    : `Today's weather in ${weather.cityName}: ${info.label}, ${weather.temp}°C — click to refresh`;

  return (
    <button
      type="button"
      onClick={() => void fetchWeather(true)}
      title={tooltip}
      aria-label={tooltip}
      className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-white/85 px-2.5 text-[11px] font-semibold text-emerald-800 shadow-xs backdrop-blur-md transition-colors hover:border-emerald-500/50 hover:bg-emerald-50/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 select-none dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
      />
      {loading ? (
        <RefreshCw aria-hidden="true" strokeWidth={1.8} className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-600 dark:text-emerald-500" />
      ) : (
        <Icon aria-hidden="true" strokeWidth={1.8} className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
      )}
      <span className="font-bold tabular-nums">{weather.temp}°</span>
      <span className={compact ? 'hidden sm:inline' : undefined}>{info.label}</span>
    </button>
  );
};
