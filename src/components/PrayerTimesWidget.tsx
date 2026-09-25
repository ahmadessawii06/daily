import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Moon,
  Sunrise,
  Sun,
  Sunset,
  Clock,
  Settings2,
  Check,
  Plus,
  MapPin,
  RefreshCw,
  X,
  Compass,
  Calendar,
  Sparkles,
  Search,
} from 'lucide-react';
import { Language, PrayerLocationConfig, PrayerTimeItem, PrayerTimesDayResponse, Task } from '../types';
import {
  CALCULATION_METHODS,
  POPULAR_CITIES,
  fetchOfficialPrayerTimes,
  getStoredLocationConfig,
  saveStoredLocationConfig,
} from '../utils/prayerTimes';
import { timeToMinutes } from '../utils/storage';

interface PrayerTimesWidgetProps {
  currentDate: string; // "YYYY-MM-DD"
  lang: Language;
  onAddTaskToSchedule?: (title: string, time: string) => void;
  todayTasks?: Task[];
}

export const PrayerTimesWidget: React.FC<PrayerTimesWidgetProps> = ({
  currentDate,
  lang,
  onAddTaskToSchedule,
  todayTasks = [],
}) => {
  const [locationConfig, setLocationConfig] = useState<PrayerLocationConfig>(() =>
    getStoredLocationConfig()
  );
  const [prayerData, setPrayerData] = useState<PrayerTimesDayResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [customCityInput, setCustomCityInput] = useState<string>('');
  const [customCountryInput, setCustomCountryInput] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<number>(locationConfig.method);

  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Update current time every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch official prayer times whenever date or locationConfig changes
  const loadPrayerTimes = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        const data = await fetchOfficialPrayerTimes(currentDate, locationConfig);
        setPrayerData(data);
      } catch (err) {
        console.error('Failed to load prayer times:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [currentDate, locationConfig]
  );

  useEffect(() => {
    loadPrayerTimes();
  }, [loadPrayerTimes]);

  const handleSelectCity = (preset: (typeof POPULAR_CITIES)[0]) => {
    const newConfig: PrayerLocationConfig = {
      city: preset.city,
      country: preset.country,
      cityDisplayAr: preset.cityDisplayAr,
      cityDisplayEn: preset.cityDisplayEn,
      countryDisplayAr: preset.countryDisplayAr,
      countryDisplayEn: preset.countryDisplayEn,
      latitude: preset.latitude,
      longitude: preset.longitude,
      method: preset.method || locationConfig.method,
      useGeolocation: false,
    };
    setLocationConfig(newConfig);
    saveStoredLocationConfig(newConfig);
    setSelectedMethod(newConfig.method);
    setIsSettingsOpen(false);
  };

  const handleSaveCustomCity = () => {
    if (!customCityInput.trim()) return;
    const newConfig: PrayerLocationConfig = {
      city: customCityInput.trim(),
      country: customCountryInput.trim() || customCityInput.trim(),
      cityDisplayAr: customCityInput.trim(),
      cityDisplayEn: customCityInput.trim(),
      countryDisplayAr: customCountryInput.trim() || '',
      countryDisplayEn: customCountryInput.trim() || '',
      method: selectedMethod,
      useGeolocation: false,
    };
    setLocationConfig(newConfig);
    saveStoredLocationConfig(newConfig);
    setIsSettingsOpen(false);
  };

  const handleMethodChange = (methodId: number) => {
    setSelectedMethod(methodId);
    const newConfig: PrayerLocationConfig = {
      ...locationConfig,
      method: methodId,
    };
    setLocationConfig(newConfig);
    saveStoredLocationConfig(newConfig);
  };

  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      alert(lang === 'ar' ? 'المتصفح لا يدعم تحديد الموقع' : 'Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const newConfig: PrayerLocationConfig = {
          ...locationConfig,
          cityDisplayAr: 'موقعي الجغرافي (GPS)',
          cityDisplayEn: 'My Location (GPS)',
          latitude,
          longitude,
          useGeolocation: true,
        };
        setLocationConfig(newConfig);
        saveStoredLocationConfig(newConfig);
        setIsSettingsOpen(false);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        alert(
          lang === 'ar'
            ? 'تعذر الوصول للموقع الجغرافي. يمكنك اختيار مدينتك من القائمة.'
            : 'Could not access location. Please pick your city from the list.'
        );
      },
      { timeout: 8000 }
    );
  };

  const prayers = prayerData?.prayers || [
    { id: 'fajr', nameAr: 'الفجر', nameEn: 'Fajr', time: '04:45' },
    { id: 'dhuhr', nameAr: 'الظهر', nameEn: 'Dhuhr', time: '12:15' },
    { id: 'asr', nameAr: 'العصر', nameEn: 'Asr', time: '15:35' },
    { id: 'maghrib', nameAr: 'المغرب', nameEn: 'Maghrib', time: '18:10' },
    { id: 'isha', nameAr: 'العشاء', nameEn: 'Isha', time: '19:40' },
  ];

  // Determine which prayer is next (if today)
  const isViewingToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return currentDate === todayStr;
  }, [currentDate]);

  const nextPrayerId = useMemo(() => {
    if (!isViewingToday) return null;
    for (const p of prayers) {
      const pMinutes = timeToMinutes(p.time);
      if (pMinutes > currentTimeMinutes) {
        return p.id;
      }
    }
    return 'fajr';
  }, [prayers, currentTimeMinutes, isViewingToday]);

  const getPrayerIcon = (id: string) => {
    switch (id) {
      case 'fajr':
        return <Sunrise className="w-3.5 h-3.5" />;
      case 'dhuhr':
        return <Sun className="w-3.5 h-3.5" />;
      case 'asr':
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      case 'maghrib':
        return <Sunset className="w-3.5 h-3.5 text-orange-400" />;
      case 'isha':
      default:
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const formatTime12h = (time24: string) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const isPm = h >= 12;
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    const period = lang === 'ar' ? (isPm ? 'م' : 'ص') : isPm ? 'PM' : 'AM';
    return `${String(h).padStart(2, '0')}:${mStr} ${period}`;
  };

  const isPrayerScheduled = (prayerNameAr: string, timeStr: string) => {
    const hourPrefix = timeStr.split(':')[0] + ':';
    return todayTasks.some(
      (t) =>
        (t.title && t.title.includes(prayerNameAr)) ||
        (t.time && t.time.startsWith(hourPrefix) && t.category === 'worship')
    );
  };

  const filteredCities = useMemo(() => {
    if (!citySearchQuery.trim()) return POPULAR_CITIES;
    const q = citySearchQuery.toLowerCase().trim();
    return POPULAR_CITIES.filter(
      (c) =>
        c.cityDisplayAr.toLowerCase().includes(q) ||
        c.cityDisplayEn.toLowerCase().includes(q) ||
        c.countryDisplayAr.toLowerCase().includes(q) ||
        c.countryDisplayEn.toLowerCase().includes(q)
    );
  }, [citySearchQuery]);

  const currentCityDisplayName = useMemo(() => {
    const city = lang === 'ar' ? locationConfig.cityDisplayAr || locationConfig.city : locationConfig.cityDisplayEn || locationConfig.city;
    const country = lang === 'ar' ? locationConfig.countryDisplayAr : locationConfig.countryDisplayEn;
    if (country && country !== city) {
      return `${city}، ${country}`;
    }
    return city;
  }, [locationConfig, lang]);

  const currentMethodDisplayName = useMemo(() => {
    const found = CALCULATION_METHODS.find((m) => m.id === locationConfig.method);
    if (found) {
      return lang === 'ar' ? found.nameAr : found.nameEn;
    }
    return lang === 'ar' ? 'رابطة العالم الإسلامي' : 'Muslim World League';
  }, [locationConfig.method, lang]);

  const getTimezoneOffsetString = () => {
    const offsetMinutes = -new Date().getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const mins = Math.abs(offsetMinutes) % 60;
    const hoursStr = String(hours).padStart(2, '0');
    const minsStr = String(mins).padStart(2, '0');

    if (lang === 'ar') {
      const arabicDigits: { [key: string]: string } = {
        '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
        '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
      };
      const formattedHours = hoursStr.replace(/[0-9]/g, (w) => arabicDigits[w]);
      const formattedMins = minsStr.replace(/[0-9]/g, (w) => arabicDigits[w]);
      return `غرينتش${sign}${formattedHours}:${formattedMins}`;
    }
    return `GMT${sign}${hoursStr}:${minsStr}`;
  };

  return (
    <div className="bg-white dark:bg-[#11131a] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-3.5 sm:p-4 shadow-xs transition-colors">
      {/* Header of the Widget */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100 dark:border-white/[0.04]">
        
        {/* Left/Start: Title, Location, and Hijri Date */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 stroke-[2.3]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 font-['Alexandria'] truncate">
                {lang === 'ar' ? 'مواقيت الصلاة اليومية' : 'Daily Prayer Times'}
              </h3>
              
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{lang === 'ar' ? 'مرجع رسمي يومي' : 'Official Reference'}</span>
              </span>
            </div>

            {/* Location & Hijri Subtitle */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate font-medium">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                title={lang === 'ar' ? 'تغيير المدينة أو طريقة الحساب' : 'Change city or calculation method'}
              >
                <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="underline underline-offset-2 decoration-slate-300 dark:decoration-white/20">
                  {currentCityDisplayName}
                </span>
              </button>

              {prayerData?.hijriFormatted && (
                <>
                  <span className="text-slate-300 dark:text-white/20">•</span>
                  <span className="truncate">{prayerData.hijriFormatted}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right/End: Actions (Refresh & Settings) */}
        <div className="flex items-center gap-1.5 shrink-0 ms-auto">
          <button
            type="button"
            onClick={() => loadPrayerTimes(true)}
            disabled={isLoading}
            title={lang === 'ar' ? 'تحديث المواقيت' : 'Refresh prayer times'}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Refresh prayer times"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/[0.08] rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95 font-['Alexandria']"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'المدينة والحساب' : 'City & Method'}</span>
            <span className="sm:hidden">{lang === 'ar' ? 'تغيير' : 'City'}</span>
          </button>
        </div>
      </div>

      {/* Grid of 5 Prayers + Sunrise option */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {prayers.map((prayer) => {
          const isNext = prayer.id === nextPrayerId;
          const isScheduled = isPrayerScheduled(prayer.nameAr, prayer.time);

          return (
            <div
              key={prayer.id}
              className={`relative flex flex-col p-2.5 rounded-xl border transition-all duration-200 ${
                isNext
                  ? 'bg-emerald-500/[0.07] dark:bg-emerald-500/[0.09] border-emerald-500/40 dark:border-emerald-500/35 shadow-2xs ring-1 ring-emerald-500/20'
                  : 'bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/[0.1]'
              }`}
            >
              {/* Next Prayer Badge */}
              {isNext && (
                <span className="absolute -top-2 start-2 px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-[#10e588] text-slate-950 font-['Alexandria'] shadow-xs tracking-tight">
                  {lang === 'ar' ? 'الصلاة القادمة' : 'Next Prayer'}
                </span>
              )}

              {/* Top: Icon + Name */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-bold text-xs font-['Alexandria']">
                  <span className={`${isNext ? 'text-[#10e588]' : 'text-slate-500 dark:text-zinc-400'}`}>
                    {getPrayerIcon(prayer.id)}
                  </span>
                  <span>{lang === 'ar' ? prayer.nameAr : prayer.nameEn}</span>
                </div>

                {/* Quick Action: Add to Schedule */}
                {onAddTaskToSchedule && (
                  <button
                    type="button"
                    onClick={() => onAddTaskToSchedule(`صلاة ${prayer.nameAr}`, prayer.time)}
                    title={
                      isScheduled
                        ? lang === 'ar'
                          ? 'مدرجة بجدول اليوم'
                          : 'In schedule'
                        : lang === 'ar'
                        ? 'إدراج بالجدول'
                        : 'Add to schedule'
                    }
                    className={`p-1 rounded-md transition-all cursor-pointer ${
                      isScheduled
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 ring-1 ring-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10'
                    }`}
                  >
                    {isScheduled ? (
                      <Check className="w-3 h-3 stroke-[2.8]" />
                    ) : (
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    )}
                  </button>
                )}
              </div>

              {/* Time Display */}
              <div className="flex items-baseline justify-between mt-auto pt-1">
                <span
                  className={`font-mono font-bold text-xs sm:text-sm tracking-tight ${
                    isNext ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-zinc-100'
                  }`}
                >
                  {formatTime12h(prayer.time)}
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                  {prayer.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Source & Timezone Footer */}
      <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-['Alexandria']">
        <div className="flex items-center gap-1.5 font-medium">
          <span>
            {lang === 'ar' ? 'المصدر:' : 'Source:'} {currentMethodDisplayName}
          </span>
          <span className="text-slate-300 dark:text-white/20">·</span>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold hover:underline cursor-pointer transition-colors"
          >
            {lang === 'ar' ? 'تغيير' : 'Change'}
          </button>
        </div>

        <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
          <span>{getTimezoneOffsetString()}</span>
          <span>·</span>
          <span>
            {lang === 'ar'
              ? 'قد تختلف مواقيت الصلاة حَسَب الموقع الجغرافي.'
              : 'Prayer times may vary depending on geographic location.'}
          </span>
        </div>
      </div>
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#12151e] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-['Alexandria']">
                    {lang === 'ar' ? 'إعدادات مدينة مواقيت الصلاة' : 'Prayer Times Location Settings'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {lang === 'ar' ? 'جلب المواقيت اليومية الدقيقة تلقائياً' : 'Automated official daily timings'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pe-1">
              
              {/* GPS Auto Detect */}
              <div>
                <button
                  type="button"
                  onClick={handleUseGeolocation}
                  disabled={isLocating}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 font-bold text-xs transition-colors cursor-pointer font-['Alexandria']"
                >
                  <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>
                    {isLocating
                      ? lang === 'ar'
                        ? 'جارٍ تحديد موقعك بدقة...'
                        : 'Locating...'
                      : lang === 'ar'
                      ? 'تحديد موقعي الجغرافي تلقائياً (GPS)'
                      : 'Use current GPS location'}
                  </span>
                </button>
              </div>

              {/* Quick Search Preset Cities */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 font-['Alexandria']">
                  {lang === 'ar' ? 'اختر مدينتك من القائمة السريعة:' : 'Quick Select City:'}
                </label>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={citySearchQuery}
                    onChange={(e) => setCitySearchQuery(e.target.value)}
                    placeholder={lang === 'ar' ? 'ابحث عن مدينة (الرياض، القاهرة، دبي...)' : 'Search city...'}
                    className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10e588]"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] rounded-xl">
                  {filteredCities.map((c) => {
                    const isSelected =
                      locationConfig.city.toLowerCase() === c.city.toLowerCase() &&
                      !locationConfig.useGeolocation;

                    return (
                      <button
                        key={c.city}
                        type="button"
                        onClick={() => handleSelectCity(c)}
                        className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg text-start transition-colors cursor-pointer font-['Alexandria'] ${
                          isSelected
                            ? 'bg-[#10e588] text-slate-950 font-bold shadow-2xs'
                            : 'hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-800 dark:text-zinc-200 font-medium'
                        }`}
                      >
                        <span className="truncate">{lang === 'ar' ? c.cityDisplayAr : c.cityDisplayEn}</span>
                        {isSelected && <Check className="w-3 h-3 shrink-0 ms-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom City Manual Input */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 font-['Alexandria']">
                  {lang === 'ar' ? 'أو كتابة مدينة أخرى يدوياً:' : 'Or type custom city:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCityInput}
                    onChange={(e) => setCustomCityInput(e.target.value)}
                    placeholder={lang === 'ar' ? 'اسم المدينة (مثال: بريدة، طنطا)' : 'City name (e.g. Leeds)'}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10e588]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomCity}
                    disabled={!customCityInput.trim()}
                    className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-[#10e588] hover:bg-[#0fd07b] rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-['Alexandria']"
                  >
                    {lang === 'ar' ? 'تعيين' : 'Apply'}
                  </button>
                </div>
              </div>

              {/* Calculation Method Selection */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 font-['Alexandria']">
                  {lang === 'ar' ? 'طريقة الحساب والجهة الرسمية:' : 'Calculation Method & Authority:'}
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => handleMethodChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#10e588] font-['Alexandria']"
                >
                  {CALCULATION_METHODS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {lang === 'ar' ? `${m.nameAr} (${m.descriptionAr})` : `${m.nameEn}`}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/[0.06] flex justify-end">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-[#10e588] hover:bg-[#0fd07b] rounded-xl transition-colors cursor-pointer font-['Alexandria']"
              >
                {lang === 'ar' ? 'تم وحفظ' : 'Done'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
