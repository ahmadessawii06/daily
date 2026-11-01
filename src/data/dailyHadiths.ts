export interface DailyHadith {
  textAr: string;
  textEn: string;
  narratorAr: string;
  narratorEn: string;
  sourceAr: string;
  sourceEn: string;
}

export const DAILY_HADITHS: DailyHadith[] = [
  {
    textAr: '«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى»',
    textEn: '“Actions are judged by motives, and each person will be rewarded according to what he intended.”',
    narratorAr: 'عن عمر بن الخطاب رضي الله عنه',
    narratorEn: 'Narrated by Umar ibn al-Khattab',
    sourceAr: 'متفق عليه (البخاري ومسلم)',
    sourceEn: 'Muttafaq Alayh (Bukhari & Muslim)',
  },
  {
    textAr: '«أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ تَعَالَى أَدْوَمُهَا وَإِنْ قَلَّ»',
    textEn: '“The most beloved deeds to Allah are those done regularly, even if small.”',
    narratorAr: 'عن عائشة رضي الله عنها',
    narratorEn: 'Narrated by Aisha',
    sourceAr: 'صحيح مسلم',
    sourceEn: 'Sahih Muslim',
  },
  {
    textAr: '«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»',
    textEn: '“The best among you is the one who learns the Quran and teaches it.”',
    narratorAr: 'عن عثمان بن عفان رضي الله عنه',
    narratorEn: 'Narrated by Uthman ibn Affan',
    sourceAr: 'صحيح البخاري',
    sourceEn: 'Sahih al-Bukhari',
  },
  {
    textAr: '«الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ، وَفِي كُلٍّ خَيْرٌ، احْرِصْ عَلَى مَا يَنْفَعُكَ، وَاسْتَعِنْ بِاللَّهِ وَلا تَعْجَزْ»',
    textEn: '“The strong believer is better and more beloved to Allah than the weak believer, while there is good in both. Strive for that which benefits you, seek help from Allah, and do not despair.”',
    narratorAr: 'عن أبي هريرة رضي الله عنه',
    narratorEn: 'Narrated by Abu Hurairah',
    sourceAr: 'صحيح مسلم',
    sourceEn: 'Sahih Muslim',
  },
  {
    textAr: '«كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلَتَانِ فِي الْمِيزَانِ، حَبِيبَتَانِ إِلَى الرَّحْمَنِ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ»',
    textEn: '“Two words are light on the tongue, heavy in the scale, beloved to the Most Merciful: Subhan Allah wa bihamdihi, Subhan Allah al-Adheem.”',
    narratorAr: 'عن أبي هريرة رضي الله عنه',
    narratorEn: 'Narrated by Abu Hurairah',
    sourceAr: 'متفق عليه (البخاري ومسلم)',
    sourceEn: 'Muttafaq Alayh (Bukhari & Muslim)',
  },
  {
    textAr: '«مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا، سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ»',
    textEn: '“Whoever takes a path in search of knowledge, Allah will make easy for him a path to Paradise.”',
    narratorAr: 'عن أبي هريرة رضي الله عنه',
    narratorEn: 'Narrated by Abu Hurairah',
    sourceAr: 'صحيح مسلم',
    sourceEn: 'Sahih Muslim',
  },
  {
    textAr: '«تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ»',
    textEn: '“Your smiling in the face of your brother is charity for you.”',
    narratorAr: 'عن أبي ذر رضي الله عنه',
    narratorEn: 'Narrated by Abu Dharr',
    sourceAr: 'جامع الترمذي',
    sourceEn: 'Jami at-Tirmidhi',
  },
  {
    textAr: '«مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ»',
    textEn: '“Whoever believes in Allah and the Last Day, let him speak goodness or remain silent.”',
    narratorAr: 'عن أبي هريرة رضي الله عنه',
    narratorEn: 'Narrated by Abu Hurairah',
    sourceAr: 'متفق عليه (البخاري ومسلم)',
    sourceEn: 'Muttafaq Alayh (Bukhari & Muslim)',
  },
  {
    textAr: '«عَجَبًا لأَمْرِ الْمُؤْمِنِ، إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ، وَلَيْسَ ذَاكَ لأَحَدٍ إِلا لِلْمُؤْمِنِ، إِنْ أَصَابَتْهُ سَرَّاءُ شَكَرَ فَكَانَ خَيْرًا لَهُ، وَإِنْ أَصَابَتْهُ ضَرَّاءُ صَبَرَ فَكَانَ خَيْرًا لَهُ»',
    textEn: '“Remarkable is the affair of the believer; his whole affair is good for him, and this belongs only to the believer. If prosperity comes, he is grateful and it is good for him; if adversity strikes, he is patient and it is good for him.”',
    narratorAr: 'عن صهيب رضي الله عنه',
    narratorEn: 'Narrated by Suhayb',
    sourceAr: 'صحيح مسلم',
    sourceEn: 'Sahih Muslim',
  },
  {
    textAr: '«اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ»',
    textEn: '“Be mindful of Allah wherever you are, follow up a bad deed with a good one to wipe it out, and treat people with good character.”',
    narratorAr: 'عن أبي ذر ومعاذ بن جبل رضي الله عنهما',
    narratorEn: 'Narrated by Abu Dharr & Muadh',
    sourceAr: 'سنن الترمذي',
    sourceEn: 'Sunan at-Tirmidhi',
  },
  {
    textAr: '«يَسِّرُوا وَلا تُعَسِّرُوا، وَبَشِّرُوا وَلا تُنَفِّرُوا»',
    textEn: '“Make things easy and do not make them difficult, give glad tidings and do not repel people.”',
    narratorAr: 'عن أنس بن مالك رضي الله عنه',
    narratorEn: 'Narrated by Anas ibn Malik',
    sourceAr: 'متفق عليه (البخاري ومسلم)',
    sourceEn: 'Muttafaq Alayh (Bukhari & Muslim)',
  },
  {
    textAr: '«احْفَظِ اللَّهَ يَحْفَظْكَ، احْفَظِ اللَّهَ تَجِدْهُ تُجَاهَكَ، إِذَا سَأَلْتَ فَاسْأَلِ اللَّهَ، وَإِذَا اسْتَعَنْتَ فَاسْتَعِنْ بِاللَّهِ»',
    textEn: '“Be mindful of Allah and He will protect you. Be mindful of Allah and you will find Him before you. If you ask, ask of Allah; if you seek help, seek help from Allah.”',
    narratorAr: 'عن عبد الله بن عباس رضي الله عنهما',
    narratorEn: 'Narrated by Ibn Abbas',
    sourceAr: 'سنن الترمذي',
    sourceEn: 'Sunan at-Tirmidhi',
  },
  {
    textAr: '«لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ»',
    textEn: '“None of you truly believes until he loves for his brother what he loves for himself.”',
    narratorAr: 'عن أنس بن مالك رضي الله عنه',
    narratorEn: 'Narrated by Anas ibn Malik',
    sourceAr: 'متفق عليه (البخاري ومسلم)',
    sourceEn: 'Muttafaq Alayh (Bukhari & Muslim)',
  },
  {
    textAr: '«مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ، وَمَا زَادَ اللَّهُ عَبْدًا بِعَفْوٍ إِلَّا عِزًّا، وَمَا تَوَاضَعَ أَحَدٌ لِلَّهِ إِلَّا رَفَعَهُ اللَّهُ»',
    textEn: '“Charity does not decrease wealth, and no servant pardons except that Allah increases him in honor, and no one humbles himself for Allah except that Allah elevates him.”',
    narratorAr: 'عن أبي هريرة رضي الله عنه',
    narratorEn: 'Narrated by Abu Hurairah',
    sourceAr: 'صحيح مسلم',
    sourceEn: 'Sahih Muslim',
  },
  {
    textAr: '«الْبِرُّ حُسْنُ الْخُلُقِ، وَالإِثْمُ مَا حَاكَ فِي نَفْسِكَ وَكَرِهْتَ أَنْ يَطَّلِعَ عَلَيْهِ النَّاسُ»',
    textEn: '“Righteousness is good character, and sin is that which wavers in your heart and you dislike people finding out about.”',
    narratorAr: 'عن النواس بن سمعان رضي الله عنه',
    narratorEn: 'Narrated by an-Nawwas ibn Saman',
    sourceAr: 'صحيح مسلم',
    sourceEn: 'Sahih Muslim',
  },
  {
    textAr: '«مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ»',
    textEn: '“Whoever guides to good will have a reward like that of its doer.”',
    narratorAr: 'عن أبي مسعود الأنصاري رضي الله عنه',
    narratorEn: 'Narrated by Abu Masud al-Ansari',
    sourceAr: 'صحيح مسلم',
    sourceEn: 'Sahih Muslim',
  },
  {
    textAr: '«إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ»',
    textEn: '“Verily, Allah loves that when one of you does a work, he perfects it.”',
    narratorAr: 'عن عائشة رضي الله عنها',
    narratorEn: 'Narrated by Aisha',
    sourceAr: 'شعب الإيمان للبيهقي (حسنه الألباني)',
    sourceEn: 'Shuab al-Iman (Hasan)',
  },
  {
    textAr: '«الدُّعَاءُ هُوَ الْعِبَادَةُ»',
    textEn: '“Supplication is the essence of worship.”',
    narratorAr: 'عن النعمان بن بشير رضي الله عنه',
    narratorEn: 'Narrated by an-Numan ibn Bashir',
    sourceAr: 'سنن أبي داود والترمذي',
    sourceEn: 'Sunan Abi Dawud & at-Tirmidhi',
  },
  {
    textAr: '«الصَّلَاةُ نُورٌ، وَالصَّدَقَةُ بُرْهَانٌ، وَالصَّبْرُ ضِيَاءٌ، وَالْقُرْآنُ حُجَّةٌ لَكَ أَوْ عَلَيْكَ»',
    textEn: '“Prayer is light, charity is proof, patience is illumination, and the Quran is an argument for you or against you.”',
    narratorAr: 'عن أبي مالك الأشعري رضي الله عنه',
    narratorEn: 'Narrated by Abu Malik al-Ashari',
    sourceAr: 'صحيح مسلم',
    sourceEn: 'Sahih Muslim',
  },
  {
    textAr: '«مَنْ صَلَّى عَلَيَّ صَلَاةً صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا»',
    textEn: '“Whoever sends blessings upon me once, Allah will send blessings upon him tenfold.”',
    narratorAr: 'عن أبي هريرة رضي الله عنه',
    narratorEn: 'Narrated by Abu Hurairah',
    sourceAr: 'صحيح مسلم',
    sourceEn: 'Sahih Muslim',
  },
  {
    textAr: '«خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ، وَأَنَا خَيْرُكُمْ لِأَهْلِي»',
    textEn: '“The best of you are those who are best to their families, and I am the best among you to my family.”',
    narratorAr: 'عن عائشة رضي الله عنها',
    narratorEn: 'Narrated by Aisha',
    sourceAr: 'سنن الترمذي',
    sourceEn: 'Sunan at-Tirmidhi',
  },
  {
    textAr: '«إِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ، وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ»',
    textEn: '“Truthfulness leads to righteousness, and righteousness leads to Paradise.”',
    narratorAr: 'عن عبد الله بن مسعود رضي الله عنه',
    narratorEn: 'Narrated by Ibn Masud',
    sourceAr: 'متفق عليه (البخاري ومسلم)',
    sourceEn: 'Muttafaq Alayh (Bukhari & Muslim)',
  },
  {
    textAr: '«مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ»',
    textEn: '“When Allah wishes good for someone, He bestows upon him the understanding of religion.”',
    narratorAr: 'عن معاوية رضي الله عنه',
    narratorEn: 'Narrated by Muawiyah',
    sourceAr: 'متفق عليه (البخاري ومسلم)',
    sourceEn: 'Muttafaq Alayh (Bukhari & Muslim)',
  },
  {
    textAr: '«لَا تَحْقِرَنَّ مِنَ الْمَعْرُوفِ شَيْئًا، وَلَوْ أَنْ تَلْقَى أَخَاكَ بِوَجْهٍ طَلْقٍ»',
    textEn: '“Do not look down upon any good deed, even if it is smiling in the face of your brother.”',
    narratorAr: 'عن أبي ذر رضي الله عنه',
    narratorEn: 'Narrated by Abu Dharr',
    sourceAr: 'صحيح مسلم',
    sourceEn: 'Sahih Muslim',
  },
  {
    textAr: '«أَفْضَلُ الذِّكْرِ لَا إِلَهَ إِلَّا اللَّهُ، وَأَفْضَلُ الدُّعَاءِ الْحَمْدُ لِلَّهِ»',
    textEn: '“The best remembrance is: La ilaha illallah, and the best supplication is: Al-hamdu lillah.”',
    narratorAr: 'عن جابر بن عبد الله رضي الله عنهما',
    narratorEn: 'Narrated by Jabir ibn Abdullah',
    sourceAr: 'سنن الترمذي',
    sourceEn: 'Sunan at-Tirmidhi',
  },
  {
    textAr: '«الْمُسْلِمُ أَخُو الْمُسْلِمِ لَا يَظْلِمُهُ وَلَا يُسْلِمُهُ، وَمَنْ كَانَ فِي حَاجَةِ أَخِيهِ كَانَ اللَّهُ فِي حَاجَتِهِ»',
    textEn: '“A Muslim is a brother of another Muslim; he does not oppress him nor forsake him. Whoever relieves a need of his brother, Allah will relieve his need.”',
    narratorAr: 'عن عبد الله بن عمر رضي الله عنهما',
    narratorEn: 'Narrated by Ibn Umar',
    sourceAr: 'متفق عليه (البخاري ومسلم)',
    sourceEn: 'Muttafaq Alayh (Bukhari & Muslim)',
  },
  {
    textAr: '«إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ، وَيُعْطِي عَلَى الرِّفْقِ مَا لَا يُعْطِي عَلَى الْعُنْفِ»',
    textEn: '“Allah is Gentle and loves gentleness, and grants for gentleness what He does not grant for harshness.”',
    narratorAr: 'عن عائشة رضي الله عنها',
    narratorEn: 'Narrated by Aisha',
    sourceAr: 'صحيح مسلم',
    sourceEn: 'Sahih Muslim',
  },
  {
    textAr: '«رِضَا الرَّبِّ فِي رِضَا الْوَالِدَيْنِ، وَسَخَطُ الرَّبِّ فِي سَخَطِهِمَا»',
    textEn: '“The pleasure of the Lord lies in the pleasure of the parents, and His wrath lies in their wrath.”',
    narratorAr: 'عن عبد الله بن عمرو رضي الله عنهما',
    narratorEn: 'Narrated by Ibn Amr',
    sourceAr: 'سنن الترمذي',
    sourceEn: 'Sunan at-Tirmidhi',
  },
  {
    textAr: '«طُوبَى لِمَنْ وَجَدَ فِي صَحِيفَتِهِ اسْتِغْفَارًا كَثِيرًا»',
    textEn: '“Glad tidings to whoever finds in his record an abundance of seeking forgiveness.”',
    narratorAr: 'عن عبد الله بن بسر رضي الله عنه',
    narratorEn: 'Narrated by Abdullah ibn Busr',
    sourceAr: 'سنن ابن ماجه',
    sourceEn: 'Sunan Ibn Majah',
  },
  {
    textAr: '«الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ، وَالْمُهَاجِرُ مَنْ هَجَرَ مَا نَهَى اللَّهُ عَنْهُ»',
    textEn: '“The true Muslim is the one from whose tongue and hand Muslims are safe, and the true emigrant is the one who abandons what Allah has forbidden.”',
    narratorAr: 'عن عبد الله بن عمرو رضي الله عنهما',
    narratorEn: 'Narrated by Ibn Amr',
    sourceAr: 'متفق عليه (البخاري ومسلم)',
    sourceEn: 'Muttafaq Alayh (Bukhari & Muslim)',
  },
];

/**
 * Returns a consistent daily hadith for the given date using a deterministic hash.
 */
export function getDailyHadith(dateStr?: string): DailyHadith {
  const date = dateStr && dateStr.trim().length > 0 ? dateStr.trim() : new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash << 5) - hash + date.charCodeAt(i);
    hash |= 0;
  }
  // Offset slightly from the verse hash so the pairing varies uniquely
  const index = Math.abs(hash + 7) % DAILY_HADITHS.length;
  return DAILY_HADITHS[index];
}
