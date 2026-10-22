import type {ParagrafDetailedSolution} from '@/lib/paragrafDetailedSolutions';
import {gradeOptical,detailedQuestions,type Mark} from '@/lib/paragrafOptik';
import {OPTICAL_RECOVERY_REASONS,paragraphRecoveryCoaching,opticalRecoveryReason,normalizeOpticalSelfCheck,
 type OpticalRecoveryReason} from '@/lib/paragrafRecoveryCoaching';

export const OPTIK_LEARNING_EDITION='KEKS_PARAGRAF_OPTIK_50_V1';
export const OPTIK_IMPORT_PREFIX='PARAGRAF_OPTIK_FIRST:';
export const OPTIK_PRINT_SOURCE='PARAGRAF_PRINT_A3_V1';

export type ConfirmedErrorReason=OpticalRecoveryReason|'BELIRLENMEDI';
export const ERROR_REASON_CHOICES={
 BELIRLENMEDI:'Henüz belirleyemedim',
 ...Object.fromEntries(Object.entries(OPTICAL_RECOVERY_REASONS).map(([key,x])=>[key,x.label]))
} as Record<ConfirmedErrorReason,string>;

export function opticalAttemptLegacyId(studentId:string,test:number){
 if(!studentId||!Number.isInteger(test)||test<1||test>50)throw new Error('Geçersiz öğrenci veya test.');
 return OPTIK_IMPORT_PREFIX+studentId+':'+String(test).padStart(2,'0');
}
export function opticalPrintedQuestionId(q:Pick<ParagrafDetailedSolution,'testNo'|'questionNo'|'id'>){
 const n=(q.testNo-1)*30+q.questionNo;
 if(n<1||n>1500||q.id!==String(n).padStart(5,'0'))throw new Error('Basılı soru kimliği farklı.');
 return 'KEKS_PRINT_A3_V1_Q'+q.id;
}
export function toPrintedReviewQuestion(q:ParagrafDetailedSolution){
 const id=opticalPrintedQuestionId(q);
 const choices=q.question?.choices;
 if(!choices||['A','B','C','D','E'].some(k=>typeof choices[k as keyof typeof choices]!=='string'||
   !(choices[k as keyof typeof choices]||'').trim()))throw new Error('Basılı soru seçenekleri eksik.');
 return {
  id,examType:'TYT',subject:'Türkçe',topic:q.topic,
  prompt:q.question.passage+'\n\n'+q.question.stem,
  options:{...choices},
  correctAnswer:q.answer,
  explanation:q.content,
  sourceKind:OPTIK_PRINT_SOURCE,
  active:false,reviewStatus:'PRINT_PROOF'
 } as const;
}
export function buildOpticalWrongLearningPlan(test:number,encoded:string,reasons:Record<string,string>={},
 selfChecks:Record<string,unknown>={}){
 const grade=gradeOptical(test,encoded);
 const questions=detailedQuestions(test);
 if(!grade||!questions)return null;
 const missed=grade.details.filter(q=>q.status!=='DOĞRU').map(item=>{
  const source=questions[item.number-1];
  const reported=opticalRecoveryReason(reasons[String(item.number)],item.status==='BOŞ'?'BOŞ':'YANLIŞ');
  const coaching=paragraphRecoveryCoaching(source,item.status==='BOŞ'?'BOŞ':'YANLIŞ',reported);
  const selfCheck=normalizeOpticalSelfCheck(selfChecks[String(item.number)]);
  const actualChoice=item.chosen==='X'?null:item.chosen as Exclude<Mark,'X'>;
  const wrongExplanation=actualChoice?source.teaching.analysis[actualChoice]?.explanation:null;
  const supportInstruction=coaching.reasonInstruction;
  return {
   number:item.number,questionId:source.id,reviewId:opticalPrintedQuestionId(source),
   topic:source.topic,status:item.status,marked:item.chosen,correct:item.answer,
   reason:reported,reasonSource:reported?'STUDENT_SELF_REPORT':'UNCLASSIFIED',
   coaching,
   selfCheck:selfCheck?{...selfCheck,attemptCorrect:selfCheck.answer===source.answer,
     evidenceProvided:Boolean(selfCheck.evidence),masteryVerified:false}:null,
   errorReasonKnown:!!reported,lesson:source.teaching.lesson,
   misconception:wrongExplanation||null,
   rightEvidence:source.teaching.analysis[source.answer as 'A'|'B'|'C'|'D'|'E']?.explanation||null,
   firstAction:supportInstruction,
   secondAction:'Sorunun türüne özgü adımı uygula: '+coaching.practice+' Ayrıntılı çözümde beş şıkkı gerekçeleriyle karşılaştır.',
   thirdAction:coaching.verify
  };
 });
 const topicCount=new Map<string,{topic:string,wrong:number,blank:number,questionNos:number[]}>();
 for(const e of missed){
  const row=topicCount.get(e.topic)||{topic:e.topic,wrong:0,blank:0,questionNos:[]};
  if(e.status==='YANLIŞ')row.wrong++;else row.blank++;
  row.questionNos.push(e.number);topicCount.set(e.topic,row);
 }
 const priorities=[...topicCount.values()].sort((a,b)=>b.wrong-a.wrong||b.blank-a.blank||a.topic.localeCompare(b.topic,'tr'));
 return {
  edition:OPTIK_LEARNING_EDITION,testNo:test,attempt:encoded,
  summary:{correct:grade.correct,wrong:grade.wrong,blank:grade.blank,net:grade.net,reviewCount:missed.length},
  missed,priorities,reviewDays:[0,1,3,7,14,28],
  note:'Hata nedeni öğrenci öz bildirimidir. İlk QR sonucu tekrar başarısı veya doğrulanmış konu hâkimiyeti değildir.'
 };
}
