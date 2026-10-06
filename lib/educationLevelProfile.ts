import {EDUCATION_LEVELS,normalizeLegacyEducationLevel} from '@/lib/educationLevels';

export type EducationLevelKey=keyof typeof EDUCATION_LEVELS;

export type EducationLevelProfile={
  key:EducationLevelKey;
  label:string;
  curriculumScope:string;
  examMode:'FOUNDATION'|'SCHOOL'|'TRANSITION'|'LGS'|'YKS_FOUNDATION'|'YKS'|'YKS_GRADUATE';
  subjects:string[];
  questionTypes:string[];
  study:{
    minDailyMinutes:number;
    defaultDailyMinutes:number;
    maxDailyMinutes:number;
    defaultFocusMinutes:number;
    questionLoadFactor:number;
    maxReviewsPerDay:number;
  };
  reportFocus:string[];
  recommendedPlanId:string;
};

const COMMON_PRIMARY_QUESTION_TYPES=['Okuduğunu anlama','Temel işlem','Problem çözme','Görsel/tablolu soru','Kısa cevap'];
const COMMON_MIDDLE_QUESTION_TYPES=['Kazanım temelli','Beceri temelli','Yeni nesil','Yorumlama','Grafik/tablo','Çok adımlı problem'];
const COMMON_HIGH_QUESTION_TYPES=['Kazanım temelli','Yorumlama','Analiz','Grafik/tablo','Çok adımlı problem','Süreli test'];
const COMMON_YKS_QUESTION_TYPES=['TYT beceri temelli','AYT alan bilgisi','Paragraf','Problem','Grafik/tablo','Deneme tipi'];

const TRACK_SUBJECTS:Record<string,string[]>={
  SAYISAL:['Türk Dili ve Edebiyatı','Matematik','Geometri','Fizik','Kimya','Biyoloji'],
  ESIT_AGIRLIK:['Türk Dili ve Edebiyatı','Matematik','Geometri','Tarih-1','Coğrafya-1'],
  'EŞİT AĞIRLIK':['Türk Dili ve Edebiyatı','Matematik','Geometri','Tarih-1','Coğrafya-1'],
  SOZEL:['Türk Dili ve Edebiyatı','Tarih','Coğrafya','Felsefe Grubu','Din Kültürü ve Ahlak Bilgisi'],
  'SÖZEL':['Türk Dili ve Edebiyatı','Tarih','Coğrafya','Felsefe Grubu','Din Kültürü ve Ahlak Bilgisi'],
  DIL:['Türk Dili ve Edebiyatı','İngilizce','Yabancı Dil'],
  'DİL':['Türk Dili ve Edebiyatı','İngilizce','Yabancı Dil']
};

const BASE_PROFILES:Record<EducationLevelKey,EducationLevelProfile>={
  PRIMARY_123:{
    key:'PRIMARY_123',
    label:EDUCATION_LEVELS.PRIMARY_123,
    curriculumScope:'İlkokul 1-2-3 · temel okuryazarlık, matematiksel düşünme ve öğrenme alışkanlığı',
    examMode:'FOUNDATION',
    subjects:['Türkçe','Matematik','Hayat Bilgisi','Fen Bilimleri'],
    questionTypes:COMMON_PRIMARY_QUESTION_TYPES,
    study:{minDailyMinutes:30,defaultDailyMinutes:45,maxDailyMinutes:75,defaultFocusMinutes:20,questionLoadFactor:.6,maxReviewsPerDay:1},
    reportFocus:['okuma ve anlama','temel matematik','görev alışkanlığı','çalışma sürekliliği'],
    recommendedPlanId:'student-primary-12'
  },
  PRIMARY_4:{
    key:'PRIMARY_4',
    label:EDUCATION_LEVELS.PRIMARY_4,
    curriculumScope:'İlkokul 4 · Proje Ortaokuluna Hazırlık ve ortaokula geçiş becerileri',
    examMode:'TRANSITION',
    subjects:['Türkçe','Matematik','Fen Bilimleri','Sosyal Bilgiler','İngilizce'],
    questionTypes:[...COMMON_PRIMARY_QUESTION_TYPES,'Çıkarım','Süreli mini test'],
    study:{minDailyMinutes:45,defaultDailyMinutes:60,maxDailyMinutes:100,defaultFocusMinutes:25,questionLoadFactor:.75,maxReviewsPerDay:2},
    reportFocus:['ortaokula hazırlık','okuduğunu anlama','problem çözme','kaynak ve görev düzeni'],
    recommendedPlanId:'student-primary-34'
  },
  MIDDLE_56:{
    key:'MIDDLE_56',
    label:EDUCATION_LEVELS.MIDDLE_56,
    curriculumScope:'Ortaokul 5-6 · Türkiye Yüzyılı Maarif Modeli',
    examMode:'SCHOOL',
    subjects:['Türkçe','Matematik','Fen Bilimleri','Sosyal Bilgiler','İngilizce','Din Kültürü ve Ahlak Bilgisi'],
    questionTypes:COMMON_MIDDLE_QUESTION_TYPES,
    study:{minDailyMinutes:60,defaultDailyMinutes:90,maxDailyMinutes:135,defaultFocusMinutes:30,questionLoadFactor:.9,maxReviewsPerDay:2},
    reportFocus:['kazanım ilerlemesi','beceri temelli soru performansı','tekrar disiplini','çalışma sürekliliği'],
    recommendedPlanId:'student-middle-56'
  },
  MIDDLE_7:{
    key:'MIDDLE_7',
    label:EDUCATION_LEVELS.MIDDLE_7,
    curriculumScope:'Ortaokul 7 · Türkiye Yüzyılı Maarif Modeli ve LGS altyapısı',
    examMode:'TRANSITION',
    subjects:['Türkçe','Matematik','Fen Bilimleri','Sosyal Bilgiler','İngilizce','Din Kültürü ve Ahlak Bilgisi'],
    questionTypes:[...COMMON_MIDDLE_QUESTION_TYPES,'LGS öncülü beceri sorusu'],
    study:{minDailyMinutes:75,defaultDailyMinutes:105,maxDailyMinutes:165,defaultFocusMinutes:35,questionLoadFactor:1,maxReviewsPerDay:2},
    reportFocus:['8. sınıfa hazırlık','yeni nesil soru performansı','kazanım açıkları','süre ve doğruluk dengesi'],
    recommendedPlanId:'student-lgs-prep'
  },
  MIDDLE_8:{
    key:'MIDDLE_8',
    label:EDUCATION_LEVELS.MIDDLE_8,
    curriculumScope:'Ortaokul 8 · Türkiye Yüzyılı Maarif Modeli ve LGS hazırlığı',
    examMode:'LGS',
    subjects:['Türkçe','Matematik','Fen Bilimleri','T.C. İnkılap Tarihi ve Atatürkçülük','Din Kültürü ve Ahlak Bilgisi','İngilizce'],
    questionTypes:['LGS yeni nesil','Kazanım temelli','Muhakeme','Grafik/tablo','Çok adımlı problem','Süreli branş denemesi'],
    study:{minDailyMinutes:120,defaultDailyMinutes:150,maxDailyMinutes:225,defaultFocusMinutes:40,questionLoadFactor:1.2,maxReviewsPerDay:3},
    reportFocus:['LGS net ve deneme trendi','kazanım açıkları','yeni nesil soru performansı','süre yönetimi'],
    recommendedPlanId:'student-lgs-360'
  },
  HIGH_910:{
    key:'HIGH_910',
    label:EDUCATION_LEVELS.HIGH_910,
    curriculumScope:'Lise 9-10 · Türkiye Yüzyılı Maarif Modeli (1. Aşama) ve TYT altyapısı',
    examMode:'YKS_FOUNDATION',
    subjects:['Türk Dili ve Edebiyatı','Matematik','Fizik','Kimya','Biyoloji','Tarih','Coğrafya','Felsefe','İngilizce'],
    questionTypes:[...COMMON_HIGH_QUESTION_TYPES,'TYT altyapı'],
    study:{minDailyMinutes:90,defaultDailyMinutes:120,maxDailyMinutes:190,defaultFocusMinutes:40,questionLoadFactor:1,maxReviewsPerDay:3},
    reportFocus:['okul kazanımları','TYT altyapısı','paragraf/problem rutini','ders bazlı bilgi hâkimiyeti'],
    recommendedPlanId:'student-high-910'
  },
  HIGH_11:{
    key:'HIGH_11',
    label:EDUCATION_LEVELS.HIGH_11,
    curriculumScope:'Lise 11 · Türkiye Yüzyılı Maarif Modeli (Alan) ve TYT/AYT dengesi',
    examMode:'YKS',
    subjects:['Türk Dili ve Edebiyatı','Matematik','Geometri','Fizik','Kimya','Biyoloji','Tarih','Coğrafya','Felsefe Grubu','İngilizce'],
    questionTypes:COMMON_YKS_QUESTION_TYPES,
    study:{minDailyMinutes:120,defaultDailyMinutes:160,maxDailyMinutes:240,defaultFocusMinutes:45,questionLoadFactor:1.15,maxReviewsPerDay:3},
    reportFocus:['alan dersleri','TYT/AYT dengesi','hedef-net farkı','konu kapatma ve tekrar'],
    recommendedPlanId:'student-yks-prep'
  },
  HIGH_12:{
    key:'HIGH_12',
    label:EDUCATION_LEVELS.HIGH_12,
    curriculumScope:'Lise 12 · YKS (TYT/AYT) hazırlığı',
    examMode:'YKS',
    subjects:['Türkçe','Türk Dili ve Edebiyatı','Matematik','Geometri','Fizik','Kimya','Biyoloji','Tarih','Coğrafya','Felsefe Grubu','İngilizce'],
    questionTypes:COMMON_YKS_QUESTION_TYPES,
    study:{minDailyMinutes:150,defaultDailyMinutes:210,maxDailyMinutes:300,defaultFocusMinutes:50,questionLoadFactor:1.3,maxReviewsPerDay:4},
    reportFocus:['TYT/AYT net trendi','hedef-net farkı','deneme analizi','konu kapatma ve tekrar'],
    recommendedPlanId:'student-yks-360'
  },
  GRADUATE_YKS:{
    key:'GRADUATE_YKS',
    label:EDUCATION_LEVELS.GRADUATE_YKS,
    curriculumScope:'Mezun · YKS yoğun hazırlık ve konu kapatma döngüsü',
    examMode:'YKS_GRADUATE',
    subjects:['Türkçe','Türk Dili ve Edebiyatı','Matematik','Geometri','Fizik','Kimya','Biyoloji','Tarih','Coğrafya','Felsefe Grubu','İngilizce'],
    questionTypes:[...COMMON_YKS_QUESTION_TYPES,'Tam deneme','Branş denemesi'],
    study:{minDailyMinutes:180,defaultDailyMinutes:240,maxDailyMinutes:360,defaultFocusMinutes:50,questionLoadFactor:1.5,maxReviewsPerDay:4},
    reportFocus:['TYT/AYT deneme döngüsü','konu kapatma hızı','gerçek çalışma kapasitesi','sürdürülebilirlik'],
    recommendedPlanId:'student-mezun-360'
  }
};

function normalizeText(value:string){
  return value.toLocaleUpperCase('tr-TR')
    .replace(/[İI]/g,'I')
    .replace(/[Ç]/g,'C')
    .replace(/[Ğ]/g,'G')
    .replace(/[Ö]/g,'O')
    .replace(/[Ş]/g,'S')
    .replace(/[Ü]/g,'U')
    .replace(/[^A-Z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function resolvedTrackSubjects(track?:string|null){
  if(!track)return null;
  const direct=TRACK_SUBJECTS[track.toLocaleUpperCase('tr-TR')];
  if(direct)return direct;
  const normalized=normalizeText(track);
  if(normalized.includes('SAYISAL'))return TRACK_SUBJECTS.SAYISAL;
  if(normalized.includes('ESIT AGIRLIK'))return TRACK_SUBJECTS.ESIT_AGIRLIK;
  if(normalized.includes('SOZEL'))return TRACK_SUBJECTS.SOZEL;
  if(normalized==='DIL'||normalized.includes('YABANCI DIL'))return TRACK_SUBJECTS.DIL;
  return null;
}

export function educationLevelKey(value?:string|null):EducationLevelKey|null{
  const normalized=normalizeLegacyEducationLevel(value);
  for(const key of Object.keys(EDUCATION_LEVELS) as EducationLevelKey[]){
    if(normalized===EDUCATION_LEVELS[key])return key;
  }
  const raw=(value||'').toLocaleUpperCase('tr-TR');
  const grade=Number((raw.match(/(?:^|\D)(1[0-2]|[1-9])(?:\D|$)/)||[])[1]);
  if(grade>=1&&grade<=3)return 'PRIMARY_123';
  if(grade===4)return 'PRIMARY_4';
  if(grade===5||grade===6)return 'MIDDLE_56';
  if(grade===7)return 'MIDDLE_7';
  if(grade===8)return 'MIDDLE_8';
  if(grade===9||grade===10)return 'HIGH_910';
  if(grade===11)return 'HIGH_11';
  if(grade===12)return 'HIGH_12';
  if(/MEZUN/.test(raw)&&/YKS/.test(raw))return 'GRADUATE_YKS';
  if(/İLKOKUL|ILKOKUL/.test(raw)&&/(?:^|\D)4(?:\D|$)/.test(raw))return 'PRIMARY_4';
  if(/İLKOKUL|ILKOKUL/.test(raw))return 'PRIMARY_123';
  if(/ORTAOKUL/.test(raw)&&/(?:^|\D)8(?:\D|$)|LGS/.test(raw))return 'MIDDLE_8';
  if(/ORTAOKUL/.test(raw)&&/(?:^|\D)7(?:\D|$)/.test(raw))return 'MIDDLE_7';
  if(/ORTAOKUL/.test(raw)&&/5\s*-\s*6|(?:^|\D)[56](?:\D|$)/.test(raw))return 'MIDDLE_56';
  if(/LİSE|LISE/.test(raw)&&/(?:^|\D)12(?:\D|$)/.test(raw))return 'HIGH_12';
  if(/LİSE|LISE/.test(raw)&&/(?:^|\D)11(?:\D|$)/.test(raw))return 'HIGH_11';
  if(/LİSE|LISE/.test(raw)&&/(?:^|\D)(?:9|10)(?:\D|$)/.test(raw))return 'HIGH_910';
  return null;
}

export function resolveEducationLevelProfile(gradeLevel?:string|null,academicTrack?:string|null):EducationLevelProfile|null{
  const key=educationLevelKey(gradeLevel);
  if(!key)return null;
  const base=BASE_PROFILES[key];
  if(!['HIGH_11','HIGH_12','GRADUATE_YKS'].includes(key))return base;
  const trackSubjects=resolvedTrackSubjects(academicTrack);
  if(!trackSubjects)return base;
  const common=key==='HIGH_11'
    ?['Türkçe','Matematik']
    :['Türkçe','Matematik','Geometri'];
  return {...base,subjects:[...new Set([...common,...trackSubjects])]};
}

export function subjectMatchesEducationLevel(subject:string,profile:EducationLevelProfile|null){
  if(!profile)return true;
  const target=normalizeText(subject);
  return profile.subjects.some(item=>{
    const allowed=normalizeText(item);
    return target===allowed||target.includes(allowed)||allowed.includes(target);
  });
}

export function scalePracticeQuestionsForEducationLevel(baseTarget:number,profile:EducationLevelProfile|null){
  if(!profile)return Math.max(5,Math.round(baseTarget));
  return Math.max(5,Math.round(baseTarget*profile.study.questionLoadFactor));
}

export function publicEducationContext(profile:EducationLevelProfile|null){
  if(!profile)return null;
  return {
    key:profile.key,
    label:profile.label,
    curriculumScope:profile.curriculumScope,
    examMode:profile.examMode,
    subjects:profile.subjects,
    questionTypes:profile.questionTypes,
    study:profile.study,
    reportFocus:profile.reportFocus,
    recommendedPlanId:profile.recommendedPlanId
  };
}
