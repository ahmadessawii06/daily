export type ReligiousSection = 'prayers' | 'morning' | 'evening' | 'quran' | 'duas';

export interface DhikrItem {
  id: string;
  title: string;
  text: string;
  count: number;
  source: string;
  sourceUrl: string;
}

export const MORNING_ADHKAR: DhikrItem[] = [
  { id: 'morning-1', title: 'رضيت بالله ربًا', text: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا.', count: 3, source: 'حصن المسلم 87', sourceUrl: 'https://sunnah.com/hisn:87' },
  { id: 'morning-2', title: 'بسم الله الذي لا يضر', text: 'بِسْمِ اللهِ الَّذِي لا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلا فِي السَّمَاءِ وَهُوَ السَّمِيعُ العَلِيمُ.', count: 3, source: 'حصن المسلم 86', sourceUrl: 'https://sunnah.com/hisn:86' },
  { id: 'morning-3', title: 'سبحان الله وبحمده', text: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ.', count: 3, source: 'حصن المسلم 94', sourceUrl: 'https://sunnah.com/hisn:94' },
];

export const EVENING_ADHKAR: DhikrItem[] = [
  { id: 'evening-1', title: 'رضيت بالله ربًا', text: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا.', count: 3, source: 'حصن المسلم 87', sourceUrl: 'https://sunnah.com/hisn:87' },
  { id: 'evening-2', title: 'بسم الله الذي لا يضر', text: 'بِسْمِ اللهِ الَّذِي لا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلا فِي السَّمَاءِ وَهُوَ السَّمِيعُ العَلِيمُ.', count: 3, source: 'حصن المسلم 86', sourceUrl: 'https://sunnah.com/hisn:86' },
  { id: 'evening-3', title: 'سبحان الله وبحمده', text: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ.', count: 3, source: 'حصن المسلم 94', sourceUrl: 'https://sunnah.com/hisn:94' },
];

export interface DuaItem {
  id: string;
  category: 'رزق' | 'استغفار' | 'الوالدين' | 'النوم' | 'الهم والحزن' | 'عام';
  text: string;
  source: string;
  sourceUrl: string;
}

export const DUAS: DuaItem[] = [
  { id: 'rizq-1', category: 'رزق', text: 'رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ', source: 'القرآن الكريم، القصص 24', sourceUrl: 'https://quran.com/28/24' },
  { id: 'parents-1', category: 'الوالدين', text: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', source: 'القرآن الكريم، الإسراء 24', sourceUrl: 'https://quran.com/17/24' },
  { id: 'sleep-1', category: 'النوم', text: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', source: 'صحيح البخاري', sourceUrl: 'https://sunnah.com/bukhari:6324' },
  { id: 'worry-1', category: 'الهم والحزن', text: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الهَمِّ وَالحَزَنِ، وَأَعُوذُ بِكَ مِنَ العَجْزِ وَالكَسَلِ، وَأَعُوذُ بِكَ مِنَ الجُبْنِ وَالبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ', source: 'صحيح البخاري', sourceUrl: 'https://sunnah.com/bukhari:6369' },
  { id: 'forgive-1', category: 'استغفار', text: 'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الخَاسِرِينَ', source: 'القرآن الكريم، الأعراف 23', sourceUrl: 'https://quran.com/7/23' },
  { id: 'general-1', category: 'عام', text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', source: 'القرآن الكريم، البقرة 201', sourceUrl: 'https://quran.com/2/201' },
];

export const QURAN_READING_SAMPLES = [
  { reference: 'الفاتحة، 2', text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', url: 'https://quran.com/1/2' },
  { reference: 'الشرح، 5', text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', url: 'https://quran.com/94/5' },
  { reference: 'الشرح، 6', text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', url: 'https://quran.com/94/6' },
];
