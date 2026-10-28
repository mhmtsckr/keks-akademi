import {getEducationCurriculum} from '@/lib/educationCurriculumMap';
import {buildSubjectRecoveryPlan} from '@/lib/subjectRecoveryPlan';
import {findMicroLesson} from '@/lib/bankFreeMicroLessons';
import {resolveLearningCurriculumContext,lessonAllowedForContext} from '@/lib/curriculumPolicy2026';

export const REMEDIATION_REASONS={
  BILGI_EKSIKLIGI:{label:'Bilgi eksikliği',instruction:'Önce temel kavramı ve kuralı kendi cümlelerinle özetle; ardından çözümlü örneği incele.'},
  ISLEM_HATASI:{label:'İşlem hatası',instruction:'İşlemleri adım adım yeniden yaz, ara sonuçları kontrol et ve farklı sayılarla dene.'},
  DIKKAT:{label:'Dikkat',instruction:'Verilenleri ve isteneni ayrı işaretle. Sonuca geçmeden birim ve işaret kontrolü yap.'},
  SORU_KOKU:{label:'Soru kökünü yanlış okuma',instruction:'Sorunun son cümlesini yeniden oku; istenen büyüklüğü bir cümlede ifade et.'},
  SURE:{label:'Süre yönetimi',instruction:'Önce süre sınırı olmadan doğru çöz; sonra benzer soruda çözüm süresini ölç.'},
  KARARSIZLIK:{label:'İki seçenek arasında kararsızlık',instruction:'İki şık için de metindeki somut dayanağı göster; yalnız sezgiyle eleme yapma.'},
  YONTEM_BILMEME:{label:'Yöntem bilmeme',instruction:'Uygun çözüm stratejisini seç; neden bu stratejiyi kullandığını açıklayıp yeni örnekte uygula.'},
  UNUTMA:{label:'Unutma',instruction:'Notlara bakmadan kuralı hatırlamayı dene; ardından örnekle doğrula ve yakın tekrar yap.'},
  BELIRLENEMEDI:{label:'Henüz belirleyemedim',instruction:'Hata veya boş bırakma nedenini kesin varsayma; soruyu koçunla inceleyerek önce soru kökü ve alt konuyu belirle.'}
} as const;

export type RemediationReason=keyof typeof REMEDIATION_REASONS;

export function isRemediationReason(value:unknown):value is RemediationReason{
  return typeof value==='string'&&Object.prototype.hasOwnProperty.call(REMEDIATION_REASONS,value);
}

function normalized(text:string){
  return text.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}

export type RemediationQuestion={
  id:string;examType:string;subject:string;topic:string;prompt:string;
  active:boolean;reviewStatus:string;sourceKind:string;
};

export function selectRemediationQuestions(
  source:Pick<RemediationQuestion,'id'|'examType'|'subject'|'topic'>,
  candidates:RemediationQuestion[],
  limit=2
){
  // Do not mix exam curricula, expose private uploads, or repeat the same question.
  return candidates.filter(q=>q.id!==source.id&&q.active&&q.reviewStatus==='APPROVED'
    &&!q.sourceKind.startsWith('STUDENT_WRONG:')&&q.examType===source.examType
    &&normalized(q.subject)===normalized(source.subject)
    &&normalized(q.topic)===normalized(source.topic))
    .slice(0,Math.max(0,Math.min(5,limit)));
}

export function buildWrongQuestionSupport(input:{
  subject:string;topic:string;examType?:string;gradeLevel?:string|null;academicTrack?:string|null;
  explanation?:string|null;classificationConfidence?:number|null;errorReason?:RemediationReason|null;
  bankReason?:string|null;hasGuidedLesson?:boolean;
  prompt?:string|null;practiceSkillId?:string|null;educationGrade?:number|null;
}){
  const curriculum=getEducationCurriculum(input.gradeLevel,input.academicTrack);
  const subject=curriculum?.subjects.find(s=>normalized(s.name)===normalized(input.subject));
  // A fallback to the first curriculum topic would falsely attribute an official acquisition.
  const matches=subject?.units.flatMap(unit=>unit.topics.flatMap(topic=>topic.subTopics.flatMap(sub=>
    sub.acquisitions.map(acquisition=>({unit:unit.name,topic:topic.name,subTopic:sub.name,acquisition}))
  ))).filter(x=>normalized(x.topic)===normalized(input.topic)||normalized(x.subTopic)===normalized(input.topic))||[];
  // Multiple outcomes under a broad topic cannot be disambiguated by the topic label alone.
  const matched=matches.length===1?matches[0]:null;
  const reason=input.errorReason&&isRemediationReason(input.errorReason)?REMEDIATION_REASONS[input.errorReason]:null;
  const suppliedExplanation=input.explanation?.trim()||null;
  const selectedLesson=findMicroLesson({
    subject:input.subject,topic:input.topic,prompt:input.prompt,
    selectedLessonId:input.practiceSkillId||null
  });
  const ctx=resolveLearningCurriculumContext({
    gradeLevel:input.gradeLevel,examType:input.examType,selectedGrade:input.educationGrade
  });
  const hasGuidedLesson=input.hasGuidedLesson??Boolean(selectedLesson&&lessonAllowedForContext(selectedLesson,ctx));
  return {
    subject:input.subject,
    topic:input.topic,
    learningPlan:buildSubjectRecoveryPlan({
      subject:input.subject,topic:input.topic,bankReason:input.bankReason,
      classificationConfidence:input.classificationConfidence,hasGuidedLesson,
      gradeLevel:input.gradeLevel,examType:input.examType
    }),
    acquisition:matched?{id:matched.acquisition.id,label:matched.acquisition.label,unit:matched.unit,subTopic:matched.subTopic}:null,
    topicConfirmationNeeded:input.classificationConfidence!=null&&input.classificationConfidence<0.65,
    reason:input.errorReason||null,
    reasonLabel:reason?.label||null,
    instruction:reason?.instruction||'Önce konunun temel kuralını hatırla; yanlış yaptığın adımı bul ve farklı bir örnekle kontrol et.',
    explanation:suppliedExplanation,
    hasVerifiedExplanation:false,
    explanationStatus:suppliedExplanation?'USER_PROVIDED_UNVERIFIED':'MISSING',
    steps:[
      'Konu ve varsa eşleştirilmiş kazanımı kontrol et.',
      suppliedExplanation?'Kaydedilmiş kısa çözümü incele ve nedenini kendi cümlelerinle anlat.':'Çözüm açıklaması yoksa öğretmen veya koçundan açıklama iste.',
      'Aynı konudan farklı bir soruyu yardım almadan çöz.',
      'Sonuca göre 0–1–3–7–14–28 tabanlı kişisel tekrar takvimini sürdür.'
    ]
  };
}
