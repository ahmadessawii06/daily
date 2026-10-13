import { useEffect, useState } from 'react';
import type { PrayerTimesDayResponse } from '../types';
import { fetchOfficialPrayerTimes, getDefaultLocationConfig } from '../utils/prayerTimes';

export function useNablusPrayerTimes(date: string) {
  const [retry, setRetry] = useState({ date, count: 0 });
  const attempt = retry.date === date ? retry.count : 0;
  const [state, setState] = useState<{ date: string; data: PrayerTimesDayResponse | null; loading: boolean; error: boolean }>({ date, data: null, loading: true, error: false });
  useEffect(() => {
    let cancelled = false;
    setState({ date, data: null, loading: true, error: false });
    void fetchOfficialPrayerTimes(date, getDefaultLocationConfig(), attempt > 0).then(
      data => { if (!cancelled) setState({ date, data, loading: false, error: false }); },
      () => { if (!cancelled) setState({ date, data: null, loading: false, error: true }); },
    );
    return () => { cancelled = true; };
  }, [date, attempt]);
  // Never show the previous day's times while a new date is loading.
  const current = state.date === date ? state : { date, data: null, loading: true, error: false };
  return { ...current, refresh: () => setRetry(previous => ({ date, count: previous.date === date ? previous.count + 1 : 1 })) };
}
