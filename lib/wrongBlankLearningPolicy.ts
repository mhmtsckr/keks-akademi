import {resolveEducationLevelProfile} from '@/lib/educationLevelProfile';
import {resolveLearningCurriculumContext} from '@/lib/curriculumPolicy2026';

export type WrongBlankReason='WRONG'|'BLANK'|'MARKED';
export type RecoveryEvidence='ANSWER_KEY_VERIFIED'|'STUDENT_SELF_REPORT'|'UNVERIFIED';

export type LearnerRecoveryPolicy={
 levelKey:string|null;label:string;grade:number|null;
 framework:string;examType:string|null;
 dailyReviewTarget:number;newQuestionTarget:number;
 recommendedMinutes:number;supportMode:'GUIDED'|'SCAFFOLDED'|'INDEPENDENT';
 requiresGradeConfirmation:boolean;
 wrongInstruction:string;blankInstruction:string;
 nextEvidence:string;
 masteryVerified:false;
};

const int=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,Math.round(v)));
export const RECOVERY_REVIEW_DAYS=[0,1,3,7,14,28] as const;
export function recoveryReasonFromAnswers(
 questionId:string,
 attemptAnswers:unknown,
 uploadedReason?:unknown
):WrongBlankReason{
 if(uploadedReason==='BLANK')return 'BLANK';
 if(uploadedReason==='MARKED')return 'MARKED';
 if(uploadedReason==='WRONG')return 'WRONG';
 if(!attemptAnswers||typeof attemptAnswers!=='object'||Array.isArray(attemptAnswers))return 'WRONG';
 const answer=(attemptAnswers as Record<string,unknown>)[questionId];
 return typeof answer!=='string'||answer.trim()===''?'BLANK':'WRONG';
}

/** A separate learning response for wrong versus omitted questions, for every
 * registered education level. Recommendations are workload hints, not
 * medical/psychological assessments or an automatically granted mastery state.
 * Multi-grade registrations must never be represented as a verified grade. */
export function learnerRecoveryPolicy(input:{
 gradeLevel?:string|null;academicTrack?:string|null;examType?:string|null;
 selectedGrade?:number|null;wrong?:number;blank?:number
}):LearnerRecoveryPolicy{
 const profile=resolveEducationLevelProfile(input.gradeLevel,input.academicTrack);
 const context=resolveLearningCurriculumContext({
  gradeLevel:input.gradeLevel,
  selectedGrade:input.selectedGrade,
  examType:input.examType
 });
 const key=profile?.key||null;
 const initial=key==='PRIMARY_123'||key==='PRIMARY_4';
 const guided=key==='PRIMARY_123';
 const examCandidate=context.framework==='OSYM';
 const high=examCandidate||['HIGH_910','HIGH_11','HIGH_12','GRADUATE_YKS'].includes(key||'');
 const daily=profile?.study.maxReviewsPerDay??(examCandidate?4:2);
 const newQuestions=guided?1:initial?2:high?4:3;
 const blanks=int(input.blank||0,0,500);
 const wrongs=int(input.wrong||0,0,500);
 const ratio=blanks+wrongs?blanks/(blanks+wrongs):0;
 const blocked=context.framework==='UNRESOLVED';
 return {
  levelKey:key,label:profile?.label||(examCandidate?
    'ÖSYM sınav hazırlık grubu · '+(context.examType||'Sınav'):'Eğitim düzeyi doğrulanmadı'),
  grade:context.grade,framework:context.framework,examType:context.examType,
  dailyReviewTarget:daily,
  newQuestionTarget:Math.max(1,Math.min(newQuestions,blanks+wrongs||newQuestions)),
  recommendedMinutes:guided?3:initial?5:high?12:8,
  supportMode:guided?'GUIDED':initial||!high?'SCAFFOLDED':'INDEPENDENT',
  requiresGradeConfirmation:blocked,
  wrongInstruction:guided
   ?'Yanlış soruda doğruyu hemen söyleme: soru kökünü birlikte oku, öğrencinin düşündüğü adımı dinle ve somut/şekilli örnekle yeniden dene.'
   :initial?'Yanlış adımı öğrencinin bulmasına yardım et; ardından benzer ama yeni bir soruyla kontrol et.'
   :'Yanlış çözümde kavram, işlem, yorum ve yöntem adımlarını ayır; düzeltmeyi yeni soruda yardım almadan sınat.',
  blankInstruction:guided
   ?'Boş soru için okumayı ve yönergeyi yetişkin desteğiyle kontrol et; hata diye etiketleme ve tek kısa yeni örnekle başla.'
   :ratio>=0.5
   ?'Boşlar yoğun: bilgi eksikliği, yönergeyi anlayamama ve süre sorununu ayrı sorgula; önce süresiz bir yeni örnek dene.'
   :'Boş soruda yanlıştan farklı olarak neden cevap verilemediğini sor; önce süresiz yeni örnekte yöntemi göster.',
  nextEvidence:blocked
   ?'Sınıf/sınav grubu doğrulanmadan yaşa özgü otomatik soru seçimi yapılmamalı.'
   :'Kısa açıklamadan sonra aynı kazanımdan daha önce görülmemiş, düzeye uygun onaylı soru çözülmeli. 0–1–3–7–14–28 tekrarları kazanım kanıtı değildir.',
  masteryVerified:false
 };
}
