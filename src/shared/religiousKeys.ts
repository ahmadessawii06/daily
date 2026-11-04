export function isReligiousSyncKey(key: string): boolean {
  return /^(islambook_(azkar_(morning|evening)_(counts|session|bookmark)|duas_quran_(counts|session|bookmark)|quranic_duas_(counts|session)|quran_wird_(page|completed|session))(_\d{4}-\d{2}-\d{2})?|religious_(quran_wird|dua_favorites))$/.test(key);
}
