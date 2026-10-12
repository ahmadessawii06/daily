import {
  Bike, BookOpen, BookOpenText, Briefcase, BrushCleaning, Bug, Camera, Car, Code2,
  Coffee, Dumbbell, Droplets, Footprints, Gamepad2, Gift, GraduationCap,
  HeartHandshake, HeartPulse, House, Languages, Leaf, Mail, MapPin, MoonStar,
  Music, Palette, PawPrint, PenLine, PhoneCall, Pill, Plane, Server, ShoppingCart,
  Sparkles, Users, Utensils, Video, Wallet, Waves, Bed,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function normalizeTaskTitle(title: string): string {
  return title.normalize('NFKC').toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي');
}

// Specific activities precede broad categories: "study coding" is code, "read Quran" is Quran.
const rules: [LucideIcon, string[]][] = [
  [MoonStar, ['صلاة', 'صلوات', 'فجر', 'تراويح', 'تهجد', 'مسجد', 'قيام الليل', 'prayer', 'pray', 'prayers', 'fajr', 'mosque', 'isha']],
  [BookOpenText, ['قرآن', 'قران', 'تلاوة', 'أذكار', 'ذكر', 'دعاء', 'حفظ سورة', 'quran', 'recitation', 'dhikr', 'dua']],
  [HeartHandshake, ['صدقة', 'زكاة', 'تبرع', 'تطوع', 'charity', 'donate', 'donation', 'volunteer', 'volunteering']],
  [Pill, ['دواء', 'أدوية', 'ادوية', 'حبوب', 'فيتامين', 'فيتامينات', 'medicine', 'medication', 'vitamin', 'vitamins', 'pills']],
  [HeartPulse, ['طبيب', 'دكتور', 'مستشفى', 'عيادة', 'علاج', 'أسنان', 'فحص', 'صيدلية', 'تحليل', 'doctor', 'clinic', 'health', 'dentist', 'hospital', 'checkup']],
  [Bike, ['دراجة', 'دراجات', 'بسكليت', 'bike', 'biking', 'bicycle', 'cycling', 'cycle']],
  [Waves, ['سباحة', 'مسبح', 'swim', 'swimming', 'pool']],
  [Footprints, ['مشي', 'جري', 'ركض', 'تمشية', 'run', 'running', 'jog', 'jogging', 'walk', 'walking', 'hike', 'hiking']],
  [Dumbbell, ['رياضة', 'تمرين', 'تمارين', 'جيم', 'نادي', 'حديد', 'كارديو', 'لياقة', 'gym', 'workout', 'exercise', 'fitness', 'cardio', 'training']],
  [Droplets, ['ماء', 'مياه', 'مي', 'ترطيب', 'water', 'hydration', 'hydrate']],
  [Bed, ['نوم', 'أنام', 'قيلولة', 'راحة', 'استرخاء', 'استراحة', 'sleep', 'sleeping', 'nap', 'rest', 'relax', 'relaxation']],
  [Coffee, ['قهوة', 'كافيه', 'شاي', 'مشروب', 'عصير', 'coffee', 'tea', 'cafe', 'juice']],
  [Utensils, ['فطور', 'إفطار', 'غداء', 'عشاء', 'وجبة', 'سحور', 'طعام', 'أكل', 'اكل', 'طبخ', 'مطعم', 'سناك', 'meal', 'breakfast', 'lunch', 'dinner', 'food', 'eat', 'cooking', 'cook']],
  [Wallet, ['ميزانية', 'بنك', 'راتب', 'دفع', 'فاتورة', 'فواتير', 'ادخار', 'حسابات', 'budget', 'bank', 'salary', 'payment', 'pay', 'bill', 'bills', 'invoice', 'finance', 'savings']],
  [ShoppingCart, ['تسوق', 'شراء', 'مقاضي', 'بقالة', 'سوبرماركت', 'شوبينغ', 'shopping', 'shop', 'buy', 'grocery', 'groceries', 'market']],
  [PhoneCall, ['مكالمة', 'اتصال', 'تلفون', 'هاتف', 'call', 'calling', 'phone']],
  [Mail, ['بريد', 'ايميل', 'إيميل', 'رسائل', 'email', 'emails', 'mail', 'inbox']],
  [Users, ['اجتماع', 'ميتينج', 'زووم', 'تيمز', 'مقابلة', 'جلسة', 'زيارة', 'عائلة', 'meeting', 'meet', 'zoom', 'interview', 'family', 'visit']],
  [Bug, ['باج', 'عطل', 'أخطاء', 'bug', 'bugs', 'debug', 'debugging']],
  [Server, ['سيرفر', 'خادم', 'قاعدة بيانات', 'server', 'database', 'backend', 'api', 'deploy', 'deployment']],
  [Code2, ['برمجة', 'برمجه', 'كود', 'تطوير', 'موقع', 'تطبيق', 'code', 'coding', 'dev', 'developer', 'development', 'programming', 'github', 'frontend', 'javascript', 'typescript', 'react', 'python']],
  [Camera, ['تصوير', 'صور', 'camera', 'photo', 'photos', 'photography']],
  [Video, ['فيديو', 'مونتاج', 'video', 'videos', 'editing', 'filming']],
  [Music, ['موسيقى', 'غيتار', 'بيانو', 'بودكاست', 'music', 'guitar', 'piano', 'podcast']],
  [Palette, ['رسم', 'تصميم', 'فن', 'art', 'draw', 'drawing', 'design', 'painting', 'figma']],
  [PenLine, ['كتابة', 'تدوين', 'مقال', 'مقالات', 'يوميات', 'write', 'writing', 'journal', 'journaling', 'essay', 'blog']],
  [Languages, ['لغة', 'انجليزي', 'إنجليزية', 'انجليزية', 'ترجمة', 'مفردات', 'english', 'language', 'languages', 'vocabulary', 'translation', 'arabic']],
  [BookOpen, ['قراءة', 'كتاب', 'كتب', 'مطالعة', 'read', 'reading', 'book', 'books']],
  [GraduationCap, ['دراسة', 'مذاكرة', 'امتحان', 'اختبار', 'كويز', 'كورس', 'دورة', 'محاضرة', 'جامعة', 'مدرسة', 'واجب', 'بحث', 'study', 'studying', 'exam', 'test', 'course', 'lecture', 'homework', 'research', 'school']],
  [Plane, ['طيران', 'مطار', 'طيارة', 'flight', 'plane', 'airport', 'fly']],
  [Car, ['سيارة', 'مشوار', 'قيادة', 'مواصلات', 'car', 'drive', 'driving', 'commute', 'taxi', 'bus']],
  [MapPin, ['سفر', 'رحلة', 'حجز', 'travel', 'trip', 'booking']],
  [Briefcase, ['عمل', 'دوام', 'وظيفة', 'مكتب', 'مشروع', 'تقرير', 'برزنتيشن', 'عميل', 'زبون', 'تسليم', 'شركة', 'work', 'job', 'office', 'project', 'client', 'report', 'deadline']],
  [BrushCleaning, ['تنظيف', 'تنضيف', 'غسيل', 'ترتيب', 'كنس', 'clean', 'cleaning', 'laundry', 'tidy', 'tidying']],
  [Leaf, ['نبات', 'نباتات', 'حديقة', 'زراعة', 'plant', 'plants', 'garden', 'gardening']],
  [PawPrint, ['قط', 'قطط', 'قطة', 'كلب', 'حيوان', 'cat', 'cats', 'dog', 'dogs', 'pet', 'pets']],
  [Gift, ['هدية', 'هدايا', 'عيد ميلاد', 'gift', 'gifts', 'birthday', 'celebration']],
  [Gamepad2, ['لعبة', 'العاب', 'ألعاب', 'بلايستيشن', 'game', 'games', 'gaming', 'playstation']],
  [House, ['بيت', 'منزل', 'أعمال منزلية', 'home', 'house', 'chores']],
];

const preparedRules = rules.map(([icon, keywords]) => ({ icon, keywords: keywords.map(normalizeTaskTitle) }));
const arabicPrefixes = ['ال', 'وال', 'بال', 'كال', 'فال', 'لل', 'و', 'ف', 'ب', 'ل'];

export function resolveTaskIcon(title: string): LucideIcon {
  const tokens = normalizeTaskTitle(title).match(/[\p{L}\p{N}]+/gu) || [];
  const words = new Set(tokens);
  // Arabic conjunctions/prepositions can stack: و + ب + ال + دراجة.
  for (let depth = 0; depth < 3; depth++) {
    for (const token of [...words]) {
      if (!/[\u0621-\u064A]/.test(token)) continue;
      for (const prefix of arabicPrefixes) if (token.startsWith(prefix)) words.add(token.slice(prefix.length));
    }
  }
  const phrase = ` ${tokens.join(' ')} `;
  return preparedRules.find(rule => rule.keywords.some(keyword => keyword.includes(' ')
    ? phrase.includes(` ${keyword} `) : words.has(keyword)))?.icon || Sparkles;
}
