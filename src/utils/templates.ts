import { Task, TaskCategory } from '../types';

export interface ScheduleTemplate {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  categoryTag: TaskCategory;
  tasks: Omit<Task, 'id' | 'createdAt'>[];
}

export const SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  {
    id: 'study-day',
    nameAr: 'يوم دراسة مكثف',
    nameEn: 'Intensive Study Day',
    descriptionAr: 'جدول متوازن للطلاب وأصحاب المشاريع: تركيز صباحي، مراجعة بومودورو، ومساحة للعبادة والراحة.',
    descriptionEn: 'Balanced schedule for students & builders: morning focus, review blocks, worship, and rest.',
    icon: 'GraduationCap',
    categoryTag: 'study',
    tasks: [
      { time: '00:00', endTime: '05:00', duration: 300, title: 'نوم واستعادة طاقة', status: 'done', category: 'sleep' },
      { time: '05:00', endTime: '06:00', duration: 60, title: 'صلاة الفجر + أذكار الصباح', status: 'done', category: 'worship' },
      { time: '06:00', endTime: '08:00', duration: 120, title: 'جلسة دراسة ومذاكرة عميقة (تركيز ذهني)', status: 'pending', category: 'study' },
      { time: '08:00', endTime: '09:00', duration: 60, title: 'فطور صحي واستراحة', status: 'pending', category: 'health' },
      { time: '09:00', endTime: '12:00', duration: 180, title: 'محاضرات ومتابعة مشاريع الجامعة', status: 'pending', category: 'study' },
      { time: '12:00', endTime: '13:00', duration: 60, title: 'صلاة الظهر + راحة خفيفة', status: 'pending', category: 'worship' },
      { time: '13:00', endTime: '16:00', duration: 180, title: 'حل التمارين والواجبات البرمجية', status: 'pending', category: 'study' },
      { time: '16:00', endTime: '17:00', duration: 60, title: 'صلاة العصر + مشي ورياضة خفيفة', status: 'pending', category: 'health' },
      { time: '17:00', endTime: '19:00', duration: 120, title: 'مراجعة ختامية وتلخيص اليوم', status: 'pending', category: 'study' },
      { time: '19:00', endTime: '20:30', duration: 90, title: 'صلاة المغرب والعشاء + جلسة عائلية', status: 'pending', category: 'worship' },
      { time: '20:30', endTime: '22:30', duration: 120, title: 'قراءة كتاب حر وتطوير مهارات', status: 'pending', category: 'rest' },
      { time: '22:30', endTime: '24:00', duration: 90, title: 'استرخاء وتجهيز للغد والنوم المبكر', status: 'pending', category: 'sleep' },
    ],
  },
  {
    id: 'exam-day',
    nameAr: 'يوم امتحان واختبارات',
    nameEn: 'Exam Day Sprint',
    descriptionAr: 'مخصص لأيام الاختبارات: مراجعة خفيفة، تجنب التوتر، راحة ذهنية، ونوم كافٍ ومريح.',
    descriptionEn: 'Focused on exam performance: light review, zero burnout, calm rest, and solid sleep.',
    icon: 'FileCheck',
    categoryTag: 'study',
    tasks: [
      { time: '00:00', endTime: '05:00', duration: 300, title: 'نوم عميق ومريح قبل الاختبار', status: 'done', category: 'sleep' },
      { time: '05:00', endTime: '06:00', duration: 60, title: 'صلاة الفجر + دعاء التوفيق', status: 'done', category: 'worship' },
      { time: '06:00', endTime: '07:30', duration: 90, title: 'استعراض سريع للخرائط الذهنية وأهم القوانين', status: 'pending', category: 'study' },
      { time: '07:30', endTime: '08:30', duration: 60, title: 'فطور خفيف والتوجه لقاعة الامتحان', status: 'pending', category: 'health' },
      { time: '08:30', endTime: '11:30', duration: 180, title: 'أداء الاختبار النهائي بتركيز كامل', status: 'pending', category: 'study' },
      { time: '11:30', endTime: '13:00', duration: 90, title: 'تفريغ ذهني واستراحة مريحة مع الزملاء', status: 'pending', category: 'rest' },
      { time: '13:00', endTime: '14:30', duration: 90, title: 'صلاة الظهر + وجبة غداء مغذية', status: 'pending', category: 'worship' },
      { time: '14:30', endTime: '16:30', duration: 120, title: 'قيلولة واسترجاع طاقة الجسم', status: 'pending', category: 'sleep' },
      { time: '16:30', endTime: '19:30', duration: 180, title: 'صلاة العصر وبدء تصفح مادة الاختبار القادم', status: 'pending', category: 'study' },
      { time: '19:30', endTime: '21:30', duration: 120, title: 'صلاة المغرب والعشاء + جلسة استرخاء', status: 'pending', category: 'worship' },
      { time: '21:30', endTime: '24:00', duration: 150, title: 'نوم مبكر استعداداً للجولة القادمة', status: 'pending', category: 'sleep' },
    ],
  },
  {
    id: 'rest-day',
    nameAr: 'يوم راحة واستجمام',
    nameEn: 'Rest & Recharge Day',
    descriptionAr: 'إعادة شحن البطارية النفسية والجسدية: نوم كافٍ، هوايات ممتعة، لقاء الأحبة ونشاط خفيف.',
    descriptionEn: 'Full mental and physical recharge: restful sleep, hobbies, family time, and relaxation.',
    icon: 'Sparkles',
    categoryTag: 'rest',
    tasks: [
      { time: '00:00', endTime: '07:00', duration: 420, title: 'نوم كافٍ ومريح بدون منبه مزعج', status: 'done', category: 'sleep' },
      { time: '07:00', endTime: '08:30', duration: 90, title: 'صلاة الفجر وقعدة تأمل وهدوء مع شاي الصباح', status: 'pending', category: 'worship' },
      { time: '08:30', endTime: '10:30', duration: 120, title: 'فطور رايق ومشي خفيف في الهواء الطلق', status: 'pending', category: 'health' },
      { time: '10:30', endTime: '13:00', duration: 150, title: 'ممارسة هواية شخصية (قراءة / ألعاب / رسم)', status: 'pending', category: 'rest' },
      { time: '13:00', endTime: '15:00', duration: 120, title: 'صلاة الظهر وغداء عائلي شهي', status: 'pending', category: 'worship' },
      { time: '15:00', endTime: '17:00', duration: 120, title: 'استرخاء ومشاهدة فيلم أو بودكاست مفيد', status: 'pending', category: 'rest' },
      { time: '17:00', endTime: '20:00', duration: 180, title: 'صلاة العصر والمغرب + لقاء الأصدقاء ونزهة', status: 'pending', category: 'rest' },
      { time: '20:00', endTime: '22:00', duration: 120, title: 'صلاة العشاء وعشاء خفيف', status: 'pending', category: 'worship' },
      { time: '22:00', endTime: '24:00', duration: 120, title: 'تأمل وكتابة خواطر ونوم هادئ', status: 'pending', category: 'sleep' },
    ],
  },
  {
    id: 'worship-friday',
    nameAr: 'يوم الجمعة والعبادة',
    nameEn: 'Friday & Worship Day',
    descriptionAr: 'يوم الجمعة المبارك: التبكير لصلاة الجمعة، قراءة سورة الكهف، صلة الرحم، وساعة الاستجابة.',
    descriptionEn: 'Blessed Friday routine: early prayer, Surah Al-Kahf, family bonds, and duaa hours.',
    icon: 'MoonStar',
    categoryTag: 'worship',
    tasks: [
      { time: '00:00', endTime: '05:00', duration: 300, title: 'نوم واستعداد ليوم الجمعة المبارك', status: 'done', category: 'sleep' },
      { time: '05:00', endTime: '07:00', duration: 120, title: 'صلاة الفجر في جماعة + أذكار الصباح والتهليل', status: 'done', category: 'worship' },
      { time: '07:00', endTime: '09:00', duration: 120, title: 'قراءة وتدبر سورة الكهف والصلاة على النبي', status: 'pending', category: 'worship' },
      { time: '09:00', endTime: '10:30', duration: 90, title: 'فطور عائلي وجلسة دافئة', status: 'pending', category: 'rest' },
      { time: '10:30', endTime: '11:30', duration: 60, title: 'غسل الجمعة، الطيب، ولبس أحسن الثياب', status: 'pending', category: 'worship' },
      { time: '11:30', endTime: '13:30', duration: 120, title: 'التبكير للمسجد، الاستماع للخطبة وصلاة الجمعة', status: 'pending', category: 'worship' },
      { time: '13:30', endTime: '15:30', duration: 120, title: 'غداء الجمعة وصلة الرحم وزيارة الوالدين والأهل', status: 'pending', category: 'rest' },
      { time: '15:30', endTime: '17:30', duration: 120, title: 'صلاة العصر وجلسة الدعاء في ساعة الاستجابة', status: 'pending', category: 'worship' },
      { time: '17:30', endTime: '19:30', duration: 120, title: 'صلاة المغرب ورياضة مشي مسائية خفيفة', status: 'pending', category: 'health' },
      { time: '19:30', endTime: '21:30', duration: 120, title: 'صلاة العشاء وعشاء خفيف', status: 'pending', category: 'worship' },
      { time: '21:30', endTime: '24:00', duration: 150, title: 'تخطيط للأسبوع القادم واستعداد للنوم', status: 'pending', category: 'study' },
    ],
  },
  {
    id: 'hourly-24',
    nameAr: 'قالب الـ 24 ساعة التفصيلي',
    nameEn: '24-Hour Slot Matrix',
    descriptionAr: 'تقسيم اليوم إلى 24 ساعة منفصلة بنمط الساعات للتخطيط الدقيق ساعة بساعة.',
    descriptionEn: 'Full 24 individual hour slots for fine-grained, hour-by-hour planning.',
    icon: 'Clock',
    categoryTag: 'general',
    tasks: Array.from({ length: 24 }).map((_, h) => ({
      time: `${String(h).padStart(2, '0')}:00`,
      endTime: `${String((h + 1) % 24).padStart(2, '0')}:00`,
      duration: 60,
      title: '',
      status: 'pending' as const,
      category: h < 6 || h >= 23 ? 'sleep' : 'general',
    })),
  },
];
