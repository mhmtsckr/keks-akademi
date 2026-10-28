import {educationLevelKey,type EducationLevelKey} from '@/lib/educationLevelProfile';
import {canonicalExamType} from '@/lib/curriculumPolicy2026';
import type {BankLearningReason} from '@/lib/subjectRecoveryPlan';

export type RecoveryBand=EducationLevelKey|'EXAM_CANDIDATE'|'UNRESOLVED';
export type LevelAwareRecovery={
  band:RecoveryBand;stage:string;guidedBy:string;
  suggestedFreshQuestions:number;maxSessionMinutes:number;
  blankReasonOptions:readonly string[];
  intervention:string;
  completionRule:'REVIEW_PLUS_NEW_QUESTION_EVIDENCE';
  note:string;
};
const BASIC_REASONS=['Bilmiyordum','Soruyu anlamadım','Yetiştiremedim','Henüz emin değilim'] as const;
const FULL_REASONS=['Bilgi eksikliği','Süre','Soru kökünü yanlış okuma','Yöntem','Dikkat','Kararsızlık','Henüz belirleyemedim'] as const;

const LEVEL_METHODS:Record<RecoveryBand,{
 stage:string;guide:string;count:number;minutes:number;step:string;basic?:boolean
}>={
 PRIMARY_123:{stage:'İlkokul 1–3',guide:'Öğretmen veya veli eşliğinde kısa, görselli çalışma',
  count:1,minutes:5,basic:true,step:'Bir örneği sesli veya görselle açıkla; farklı tek soruyu destekle çöz, sonrasında kendin dene.'},
 PRIMARY_4:{stage:'İlkokul 4',guide:'Kısa soru kökü kontrolü ve görsel örnek',
  count:2,minutes:7,basic:true,step:'Soru kökündeki isteneni işaretle; iki kısa, farklı soruyla stratejiyi kontrol et.'},
 MIDDLE_56:{stage:'Ortaokul 5–6',guide:'Somut örnek ve kısa kavram kontrolü',
  count:2,minutes:8,step:'Görsel, tablo veya kısa yeni metin üzerinden aynı beceriyi açıklayıp iki farklı soru dene.'},
 MIDDLE_7:{stage:'Ortaokul 7',guide:'Kazanım ve muhakeme adımlarını ayırma',
  count:2,minutes:9,step:'Çözüm adımlarını notlara bakmadan kur ve aynı beceride farklı iki soruda sınamayı dene.'},
 MIDDLE_8:{stage:'Ortaokul 8 / LGS',guide:'LGS beceri temelli yeni örnek ve süre farkı analizi',
  count:3,minutes:10,step:'Önce süresiz, sonra yeni nesil bir soruda süreyi izle; üç farklı soruda gerekçe yaz.'},
 HIGH_910:{stage:'Lise 9–10',guide:'Kavram yanılgısı ve veri/gerekçe çözümlemesi',
  count:3,minutes:10,step:'Kavramın geçerlilik koşulunu belirle; farklı üç soruda kanıtla.'},
 HIGH_11:{stage:'Lise 11',guide:'Okul/alan becerisi ve sınav sorusu eşleştirmesi',
  count:3,minutes:12,step:'Alan alt kazanımını kontrol et; farklı üç soruyu gerekçeli çöz.'},
 HIGH_12:{stage:'Lise 12 / YKS',guide:'TYT–AYT ayrımı, süre ve soru tipi analizi',
  count:4,minutes:12,step:'TYT/AYT kapsamını doğrula; aynı beceride dört farklı soru ve süre değerlendirmesi yap.'},
 GRADUATE_YKS:{stage:'Mezun / YKS',guide:'Konu açığı ve bağımsız yeni soru transferi',
  count:4,minutes:15,step:'Konu eksikliğini kısa tekrarla kapat; dört farklı soruda bağımsız transferi ve süreyi karşılaştır.'},
 EXAM_CANDIDATE:{stage:'ÖSYM sınav adayı',guide:'İlgili sınav kılavuzuna uygun kazanım ve yeni soru',
  count:4,minutes:15,step:'Sınav türünü ve kapsamını doğrula; aynı beceride farklı sorularla tekrar öğrenmeyi sınamayı dene.'},
 UNRESOLVED:{stage:'Eğitim düzeyi belirlenmedi',guide:'Önce sınıf veya sınav türünü kesinleştirme',
  count:0,minutes:0,step:'Eğitim düzeyini belirlemeden yaşa özgü soru yükü veya resmî kazanım atama.'}
};
const EXAMS=new Set(['AGS','ÖABT','KPSS','EKPSS','DGS','ALES','YDS','YÖKDİL']);
export function levelAwareErrorRecovery(input:{
 gradeLevel?:string|null;examType?:string|null;bankReason?:BankLearningReason
}):LevelAwareRecovery{
 const key=educationLevelKey(input.gradeLevel);
 const exam=canonicalExamType(input.examType);
 const band:RecoveryBand=key||(
  exam&&EXAMS.has(exam)?'EXAM_CANDIDATE':'UNRESOLVED'
 );
 const m=LEVEL_METHODS[band];
 return {
  band,stage:m.stage,guidedBy:m.guide,suggestedFreshQuestions:m.count,
  maxSessionMinutes:m.minutes,
  blankReasonOptions:m.basic?BASIC_REASONS:FULL_REASONS,
  intervention:input.bankReason==='BLANK'
   ?(m.basic?'Boş bırakma nedenini birlikte seç; bunu yanlış cevap olarak sayma.':
     'Boş bırakma nedenini bilgi, süre, yöntem ve karar verememe arasında ayır; ardından uygun yeni örnek seç.')
   :m.step,
  completionRule:'REVIEW_PLUS_NEW_QUESTION_EVIDENCE',
  note:band==='UNRESOLVED'
   ?'Sınıf/sınav bağlamı doğrulanmadan yeni soru sayısı önerilmez.'
   :'Soru sayısı hedef değil, kısa çalışma önerisidir. Gerçek içerik yalnız onaylı soru havuzundan seçilir; öğrenci açıklaması veya tek doğru cevap kalıcı öğrenme kanıtı değildir.'
 };
}
