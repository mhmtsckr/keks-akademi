import {areEquivalentShortAnswers} from '@/lib/mathAnswerEquivalence';
import {resolveLearningCurriculumContext} from '@/lib/curriculumPolicy2026';
import {buildSubjectRecoveryPlan} from '@/lib/subjectRecoveryPlan';

export const QUIZ_RECOVERY_EVENT='QUIZ_WRONG_BLANK_RECOVERY_V1';
export const BLANK_REASON_CODES={
 BILGI_EKSIKLIGI:'Konuyu henüz bilmiyorum',
 SURE:'Sürem yetmedi',
 SORU_KOKU:'Sorunun ne istediğini anlayamadım',
 KARARSIZLIK:'Seçeneklerden emin olamadım',
 YONTEM_BILMEME:'Nasıl çözeceğimi bilemedim',
 UNUTMA:'Öğrendiğim bilgiyi hatırlayamadım',
 BELIRLENEMEDI:'Nedenini henüz belirleyemedim'
} as const;
export type BlankReason=keyof typeof BLANK_REASON_CODES;
export type Outcome='CORRECT'|'WRONG'|'BLANK';
export type QuizItem={
 id:string;subject:string;topic:string;examType:string;
 sourceKind:string;correctAnswer:string;explanation:string|null;
 reviewStatus:string
};
export type QuizAnswerOutcome={
 questionId:string;subject:string;topic:string;examType:string;
 status:Outcome;blankReason:BlankReason|null;
 correctAnswer:string;explanation:string|null;
 explanationSource:'APPROVED_CONTENT'|'USER_PROVIDED_UNVERIFIED'|'NOT_AVAILABLE';
 answerKeySource:'APPROVED_BANK'|'USER_PROVIDED_UNVERIFIED'|'UNVERIFIED_BANK'
};
const own=(object:Record<string,unknown>,key:string)=>Object.prototype.hasOwnProperty.call(object,key);
export function evaluateWrongBlankAnswers(
 questions:readonly QuizItem[],answers:Record<string,string|null>,
 blankReasons:Partial<Record<string,BlankReason>>={}
){
 const ids=new Set(questions.map(q=>q.id));
 if(questions.length===0||ids.size!==questions.length||questions.length>40)
  throw new Error('INVALID_QUIZ_QUESTION_SET');
 if(Object.keys(answers).some(id=>!ids.has(id))||Object.keys(blankReasons).some(id=>!ids.has(id)))
  throw new Error('UNEXPECTED_QUESTION_ID');
 const details:QuizAnswerOutcome[]=questions.map(q=>{
  const answer=own(answers,q.id)?answers[q.id]:null;
  const text=typeof answer==='string'?answer.trim():'';
  const status:Outcome=!text?'BLANK':
   (q.sourceKind.startsWith('STUDENT_WRONG:')?
     areEquivalentShortAnswers(text,q.correctAnswer):text===q.correctAnswer)?'CORRECT':'WRONG';
  const blankReason=status==='BLANK'?blankReasons[q.id]||null:null;
  return {
   questionId:q.id,subject:q.subject,topic:q.topic,examType:q.examType,status,blankReason,
   correctAnswer:q.correctAnswer,
   explanation:q.explanation,
   answerKeySource:q.sourceKind.startsWith('STUDENT_WRONG:')
     ?'USER_PROVIDED_UNVERIFIED':q.reviewStatus==='APPROVED'
     ?'APPROVED_BANK':'UNVERIFIED_BANK',
   explanationSource:q.explanation?
     q.sourceKind.startsWith('STUDENT_WRONG:')?'USER_PROVIDED_UNVERIFIED':
     q.reviewStatus==='APPROVED'?'APPROVED_CONTENT':'USER_PROVIDED_UNVERIFIED'
     :'NOT_AVAILABLE'
  };
 });
 const correct=details.filter(x=>x.status==='CORRECT').length;
 const wrong=details.filter(x=>x.status==='WRONG').length;
 const blank=details.filter(x=>x.status==='BLANK').length;
 return {correct,wrong,blank,details,
  queueIds:details.filter(x=>x.status!=='CORRECT').map(x=>x.questionId)};
}

export function getRecoveryLevel(gradeLevel:string|null|undefined,examType:string){
 const ctx=resolveLearningCurriculumContext({gradeLevel,examType});
 const group=ctx.educationLevelKey;
 const stage=group==='PRIMARY_123'||group==='PRIMARY_4'?'PRIMARY':
  group==='MIDDLE_56'||group==='MIDDLE_7'||group==='MIDDLE_8'?'MIDDLE':
  group==='HIGH_910'||group==='HIGH_11'||group==='HIGH_12'?'HIGH':
  group==='GRADUATE_YKS'?'EXAM':'UNRESOLVED';
 return {stage,grade:ctx.grade,framework:ctx.framework,
  needsGradeConfirmation:ctx.grade===null&&stage!=='EXAM',
  curriculumVerified:ctx.curriculumVerified,
  academicYear:ctx.academicYear,exam:ctx.examType};
}

/** Guidance varies by level, but is not an official attainment statement. */
export function recoveryNextStep(input:{
 gradeLevel:string|null|undefined;subject:string;topic:string;examType:string;
 outcome:'WRONG'|'BLANK';blankReason?:BlankReason|null
}){
 const level=getRecoveryLevel(input.gradeLevel,input.examType);
 const plan=buildSubjectRecoveryPlan({subject:input.subject,topic:input.topic,
  bankReason:input.outcome});
 const opening=input.outcome==='BLANK'?
  input.blankReason==='SURE'?'İlk denemeyi süre tutmadan yap. Sonra yeni soruda süreyi ölç.':
  input.blankReason==='BILGI_EKSIKLIGI'?'Önce temel kavramı kısa bir örnekle öğren.':
  input.blankReason==='SORU_KOKU'?'Soru kökünde isteneni bir cümleyle açıkla.':
  input.blankReason==='YONTEM_BILMEME'?'Çözüm yöntemini örnek üzerinden incele.':
  input.blankReason==='UNUTMA'?'Notuna bakmadan hatırla, sonra örnekle kontrol et.':
  input.blankReason==='KARARSIZLIK'?'Olası seçeneklerin dayanaklarını karşılaştır.':
  'Önce neden boş bıraktığını belirle; henüz belli değilse tahminde bulunma.'
  :'Yanlış sonucun hangi adımda oluştuğunu belirle.';
 const levelStep=level.stage==='PRIMARY'
   ?'Kısa, somut bir örnek üzerinde çalış; gerekiyorsa öğretmen/veli rehberliği al ve tek yeni soru dene.'
   :level.stage==='MIDDLE'
   ?'Kazanımı kendi cümlelerinle anlat, çözümlü örneği incele ve aynı beceriden yeni bir soru çöz.'
   :level.stage==='HIGH'
   ?'Çözümün gerekçesini yaz, çeldiricileri veya işlem basamaklarını kontrol et ve farklı soru tipinde dene.'
   :level.stage==='EXAM'
   ?'Sınav soru kökü, yöntem ve süreyi analiz et; farklı, onaylı soruda bağımsız transfer uygula.'
   :'Eğitim düzeyini doğrula; uygun içerik belirlenmeden zorluk derecesi veya kazanım iddia etme.';
 return {
  level,method:plan.method,diagnostic:plan.diagnosticQuestion,
  opening,levelStep,reviewDays:plan.reviewDays,
  status:input.outcome,
  evidenceStatus:'SERVER_GRADED_ANSWER_NOT_VERIFIED_MASTERY' as const,
  note:'Tek bir tekrarın doğru olması kalıcı öğrenmeyi kanıtlamaz. Yeniden ölçüm ve farklı soru gerekir.'
 };
}
