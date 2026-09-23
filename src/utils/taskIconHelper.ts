import React from 'react';
import { 
  Sparkles, 
  Flame, 
  BookOpen, 
  GraduationCap,
  Briefcase, 
  Code2, 
  Bed, 
  Utensils, 
  Coffee, 
  ShoppingCart, 
  HeartPulse, 
  PhoneCall, 
  Car, 
  Palette, 
  Clock, 
  CheckCircle2,
  MoonStar
} from 'lucide-react';

export interface TaskContextIconInfo {
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  iconClass: string;
}

// Unified theme styling matching Daily Track's signature emerald & dark palette
const UNIFIED_THEME_STYLE = {
  bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 dark:border-emerald-500/30 shadow-2xs',
  iconClass: 'text-emerald-700 dark:text-emerald-300 stroke-[2.2]',
};

const EMPTY_SLOT_STYLE = {
  bgClass: 'bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08]',
  iconClass: 'text-slate-400 dark:text-zinc-500 stroke-[2]',
};

/**
 * Dynamically resolves a sleek, highly contextual icon matching the task title,
 * with a unified color palette that harmonizes perfectly with the app theme.
 */
export function getTaskContextIcon(title?: string): TaskContextIconInfo {
  if (!title || !title.trim()) {
    return {
      icon: Clock,
      ...EMPTY_SLOT_STYLE,
    };
  }

  const t = title.toLowerCase().trim();

  // 1. Prayer & Spiritual
  if (
    t.includes('صلاة') || 
    t.includes('فجر') || 
    t.includes('ظهر') || 
    t.includes('عصر') || 
    t.includes('مغرب') || 
    t.includes('عشاء') || 
    t.includes('قيام') || 
    t.includes('وتر') || 
    t.includes('قرآن') || 
    t.includes('تلاوة') || 
    t.includes('أذكار') || 
    t.includes('اذكار') || 
    t.includes('مسجد') || 
    t.includes('تراويح') || 
    t.includes('دعاء') ||
    t.includes('prayer') || 
    t.includes('quran') || 
    t.includes('fajr') ||
    t.includes('mosque')
  ) {
    return {
      icon: MoonStar,
      ...UNIFIED_THEME_STYLE,
    };
  }

  // 2. Workout & Fitness
  if (
    t.includes('رياضة') || 
    t.includes('تمرين') || 
    t.includes('تمارين') || 
    t.includes('جيم') || 
    t.includes('نادي') || 
    t.includes('حديد') || 
    t.includes('كارديو') || 
    t.includes('مشي') || 
    t.includes('جري') || 
    t.includes('ركض') || 
    t.includes('سباحة') || 
    t.includes('لياقة') || 
    t.includes('gym') || 
    t.includes('workout') || 
    t.includes('fitness') || 
    t.includes('run') || 
    t.includes('walk') || 
    t.includes('cardio')
  ) {
    return {
      icon: Flame,
      ...UNIFIED_THEME_STYLE,
    };
  }

  // 3. Study & Education
  if (
    t.includes('دراسة') || 
    t.includes('مذاكرة') || 
    t.includes('قراءة') || 
    t.includes('كتاب') || 
    t.includes('امتحان') || 
    t.includes('اختبار') || 
    t.includes('كويز') || 
    t.includes('كورس') || 
    t.includes('دورة') || 
    t.includes('محاضرة') || 
    t.includes('جامعة') || 
    t.includes('مدرسة') || 
    t.includes('واجب') || 
    t.includes('بحث') || 
    t.includes('study') || 
    t.includes('exam') || 
    t.includes('reading') || 
    t.includes('book') || 
    t.includes('course') || 
    t.includes('lecture')
  ) {
    return {
      icon: GraduationCap,
      ...UNIFIED_THEME_STYLE,
    };
  }

  // 4. Programming & Tech
  if (
    t.includes('برمجة') || 
    t.includes('كود') || 
    t.includes('برمجه') || 
    t.includes('تطوير') || 
    t.includes('موقع') || 
    t.includes('تطبيق') || 
    t.includes('سيرفر') || 
    t.includes('باج') || 
    t.includes('code') || 
    t.includes('coding') || 
    t.includes('dev') || 
    t.includes('developer') || 
    t.includes('programming') || 
    t.includes('github') || 
    t.includes('frontend') || 
    t.includes('backend') || 
    t.includes('api') || 
    t.includes('figma')
  ) {
    return {
      icon: Code2,
      ...UNIFIED_THEME_STYLE,
    };
  }

  // 5. Work & Office
  if (
    t.includes('عمل') || 
    t.includes('دوام') || 
    t.includes('وظيفة') || 
    t.includes('مكتب') || 
    t.includes('مشروع') || 
    t.includes('تقرير') || 
    t.includes('برزنتيشن') || 
    t.includes('عميل') || 
    t.includes('زبون') || 
    t.includes('تسليم') || 
    t.includes('شركة') || 
    t.includes('work') || 
    t.includes('job') || 
    t.includes('office') || 
    t.includes('project') || 
    t.includes('client') || 
    t.includes('report') || 
    t.includes('deadline')
  ) {
    return {
      icon: Briefcase,
      ...UNIFIED_THEME_STYLE,
    };
  }

  // 6. Sleep & Rest
  if (
    t.includes('نوم') || 
    t.includes('أنام') || 
    t.includes('انام') || 
    t.includes('قيلولة') || 
    t.includes('راحة') || 
    t.includes('استرخاء') || 
    t.includes('استراحة') || 
    t.includes('sleep') || 
    t.includes('nap') || 
    t.includes('rest') || 
    t.includes('relax')
  ) {
    return {
      icon: Bed,
      ...UNIFIED_THEME_STYLE,
    };
  }

  // 7. Coffee & Drinks
  if (
    t.includes('قهوة') || 
    t.includes('كافيه') || 
    t.includes('شاي') || 
    t.includes('مشروب') || 
    t.includes('عصير') || 
    t.includes('coffee') || 
    t.includes('tea') || 
    t.includes('cafe')
  ) {
    return {
      icon: Coffee,
      ...UNIFIED_THEME_STYLE,
    };
  }

  // 8. Food & Meals
  if (
    t.includes('فطور') || 
    t.includes('إفطار') || 
    t.includes('افطار') || 
    t.includes('غداء') || 
    t.includes('عشاء') || 
    t.includes('وجبة') || 
    t.includes('سحور') || 
    t.includes('طعام') || 
    t.includes('اكل') || 
    t.includes('أكل') || 
    t.includes('طبخ') || 
    t.includes('مطعم') || 
    t.includes('سناك') || 
    t.includes('meal') || 
    t.includes('breakfast') || 
    t.includes('lunch') || 
    t.includes('dinner') || 
    t.includes('food') || 
    t.includes('eat')
  ) {
    return {
      icon: Utensils,
      ...UNIFIED_THEME_STYLE,
    };
  }

  // 9. Shopping & Groceries
  if (
    t.includes('تسوق') || 
    t.includes('شراء') || 
    t.includes('مقاضي') || 
    t.includes('بقالة') || 
    t.includes('سوبرماركت') || 
    t.includes('ميزانية') || 
    t.includes('بنك') || 
    t.includes('راتب') || 
    t.includes('دفع') || 
    t.includes('فاتورة') || 
    t.includes('شوبينغ') || 
    t.includes('shopping') || 
    t.includes('buy') || 
    t.includes('grocery') || 
    t.includes('market') || 
    t.includes('bill')
  ) {
    return {
      icon: ShoppingCart,
      ...UNIFIED_THEME_STYLE,
    };
  }

  // 10. Health & Medicine
  if (
    t.includes('طبيب') || 
    t.includes('دكتور') || 
    t.includes('مستشفى') || 
    t.includes('عيادة') || 
    t.includes('دواء') || 
    t.includes('علاج') || 
    t.includes('أسنان') || 
    t.includes('فحص') || 
    t.includes('صيدلية') || 
    t.includes('تحليل') || 
    t.includes('doctor') || 
    t.includes('medicine') || 
    t.includes('clinic') || 
    t.includes('health') || 
    t.includes('dentist')
  ) {
    return {
      icon: HeartPulse,
      ...UNIFIED_THEME_STYLE,
    };
  }

  // 11. Meetings & Calls
  if (
    t.includes('اجتماع') || 
    t.includes('ميتينج') || 
    t.includes('مكالمة') || 
    t.includes('اتصال') || 
    t.includes('تلفون') || 
    t.includes('زووم') || 
    t.includes('تيمز') || 
    t.includes('مقابلة') || 
    t.includes('جلسة') || 
    t.includes('meeting') || 
    t.includes('call') || 
    t.includes('zoom') || 
    t.includes('interview') || 
    t.includes('phone')
  ) {
    return {
      icon: PhoneCall,
      ...UNIFIED_THEME_STYLE,
    };
  }

  // 12. Travel & Commute
  if (
    t.includes('سفر') || 
    t.includes('طيران') || 
    t.includes('مطار') || 
    t.includes('رحلة') || 
    t.includes('حجز') || 
    t.includes('سيارة') || 
    t.includes('مشوار') || 
    t.includes('قيادة') || 
    t.includes('travel') || 
    t.includes('flight') || 
    t.includes('trip') || 
    t.includes('car') || 
    t.includes('drive')
  ) {
    return {
      icon: Car,
      ...UNIFIED_THEME_STYLE,
    };
  }

  // 13. Creative & Art & Writing
  if (
    t.includes('رسم') || 
    t.includes('تصوير') || 
    t.includes('فيديو') || 
    t.includes('مونتاج') || 
    t.includes('موسيقى') || 
    t.includes('بودكاست') || 
    t.includes('كتابة') || 
    t.includes('art') || 
    t.includes('video') || 
    t.includes('music') || 
    t.includes('photo')
  ) {
    return {
      icon: Palette,
      ...UNIFIED_THEME_STYLE,
    };
  }

  // General default task with title
  return {
    icon: Sparkles,
    ...UNIFIED_THEME_STYLE,
  };
}
