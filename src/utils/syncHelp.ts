import type { Language } from '../types';

export function syncHelp(error: string | undefined, lang: Language): string {
  const ar = lang === 'ar';
  if (/invalid day photos?|invalid photo timestamp/i.test(error || '')) return ar
    ? 'تعذرت مزامنة صورة اليوم بسبب صيغة أو حجم غير مدعوم، أو بيانات صورة تالفة. افتح اليوم المذكور وأعد إضافة الصورة بصيغة JPG أو PNG أو WebP بحجم أقل من 20 ميغابايت. احتفظ بنسخة من الصورة قبل استبدالها.'
    : 'A day photo has an unsupported format or size, or damaged data. Open the indicated day and add the photo again as JPG, PNG, or WebP under 20 MB. Keep a copy before replacing it.';
  if (/401|session|expired|unauthorized|تسجيل الدخول|الجلسة/i.test(error || '')) return ar
    ? 'انتهت جلسة الحساب أو لم تعد صالحة. سجّل الدخول مجددًا ثم أعد المزامنة.'
    : 'Your session is no longer valid. Sign in again, then retry sync.';
  if (/413|too large|entity too large/i.test(error || '')) return ar
    ? 'حجم التعديلات أكبر من الحد المسموح للطلب. جرّب صورًا أصغر ثم أعد المزامنة.'
    : 'The pending changes exceed the request size limit. Try smaller photos, then retry.';
  return ar
    ? 'تحقق من اتصال الإنترنت ثم أعد المحاولة. إذا استمرت المشكلة فقد يكون الخادم أو قاعدة البيانات غير متاحين مؤقتًا؛ جرّب لاحقًا. تعديلاتك المعلقة تبقى على هذا الجهاز، فلا تمسح بيانات المتصفح.'
    : 'Check your internet connection and retry. If it continues, the server or database may be temporarily unavailable; try later. Pending changes remain on this device, so keep your browser data.';
}
