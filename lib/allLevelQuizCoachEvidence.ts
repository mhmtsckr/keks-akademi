import {gradePersonalQuiz} from '@/lib/quizErrorLearning';
import {levelAwareErrorRecovery} from '@/lib/levelAwareErrorRecovery';
import {BLANK_REASON_CODES,blankReasonAction,type BlankReasonCode} from '@/lib/blankReasonEvidence';
import {verifiedBlankReasonsForAttempt} from '@/lib/quizBlankReasonTriage';

export type QuizCoachAttempt={
 id:string;quizId:string;createdAt:Date;correct:number;wrong:number;blank:number;
 answers:unknown;quiz:{questionIds:unknown}
};
export type QuizCoachQuestion={
 id:string;subject:string;topic:string;sourceKind:string;correctAnswer:string;examType?:string
};
const obj=(v:unknown):Record<string,unknown>=>
 v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};

/**
 * Teacher reporting only: re-grade the student's immutable submitted answers
 * against server-side question records. A free-form DailyLog cannot forge scores.
 * This is descriptive evidence, not independent transfer or durable mastery.
 */
export function summarizeAllLevelQuizCoachEvidence(
 attempts:QuizCoachAttempt[],questions:readonly QuizCoachQuestion[],
 studentId:string,{truncated=false,reasonLogs=[],gradeLevel=null,reasonsTruncated=false}:{
  truncated?:boolean;reasonLogs?:Array<{date:Date;payload:unknown}>;
  gradeLevel?:string|null;reasonsTruncated?:boolean
 }={}
){
 const byId=new Map(questions.map(q=>[q.id,q]));
 const seenQuizzes=new Set<string>();
 const topics=new Map<string,{
  subject:string;topic:string;correct:number;wrong:number;blank:number;
  attempts:number;privateKeyCount:number;examType:string;
  reasonCounts:Partial<Record<BlankReasonCode,number>>
 }>();
 let tests=0,correct=0,wrong=0,blank=0,excluded=0;
 let reasonVerifiedAttempts=0;
 const ordered=[...attempts].sort((a,b)=>a.createdAt.getTime()-b.createdAt.getTime());
 for(const attempt of ordered){
  const ids=Array.isArray(attempt.quiz.questionIds)?attempt.quiz.questionIds:[];
  const answers=obj(attempt.answers);
  if(seenQuizzes.has(attempt.quizId))continue;
  if(!ids.length||ids.length>100||ids.some(id=>typeof id!=='string'||!id)||
   new Set(ids).size!==ids.length||Object.keys(answers).some(k=>!ids.includes(k))){
   excluded++;continue;
  }
  const rows=ids.map(id=>byId.get(id));
  if(rows.some(q=>!q||q.sourceKind.startsWith('STUDENT_WRONG:')&&
    q.sourceKind!=='STUDENT_WRONG:'+studentId)){excluded++;continue;}
  const selected=rows as QuizCoachQuestion[];
  const grade=gradePersonalQuiz(selected,
   Object.fromEntries(Object.entries(answers).map(([key,value])=>[
    key,typeof value==='string'?value:null
   ])));
  if(grade.correct!==attempt.correct||grade.wrong!==attempt.wrong||
    grade.blank!==attempt.blank){excluded++;continue;}
  seenQuizzes.add(attempt.quizId);
  tests++;correct+=grade.correct;wrong+=grade.wrong;blank+=grade.blank;
  const reasonMap=verifiedBlankReasonsForAttempt(attempt,grade,reasonLogs);
  if(reasonMap!==null)reasonVerifiedAttempts++;
  for(const question of selected){
   const key=question.subject+'\u0000'+question.topic;
   const row=topics.get(key)||{subject:question.subject,topic:question.topic,
    correct:0,wrong:0,blank:0,attempts:0,privateKeyCount:0,
    examType:question.examType||'',reasonCounts:{}};
   const status=grade.blankIds.includes(question.id)?'blank':
    grade.wrongIds.includes(question.id)?'wrong':'correct';
   row[status]++;
   row.attempts++;
   if(question.sourceKind.startsWith('STUDENT_WRONG:'))row.privateKeyCount++;
   if(status==='blank'){
    const reason=reasonMap?.get(question.id);
    if(reason)row.reasonCounts[reason]=(row.reasonCounts[reason]||0)+1;
   }
   topics.set(key,row);
  }
 }
 return {
  tests,correct,wrong,blank,excluded,truncated,
  reasonVerifiedAttempts,reasonsTruncated,
  topics:[...topics.values()].filter(t=>t.wrong+t.blank>0)
   .sort((a,b)=>b.blank+b.wrong-(a.blank+a.wrong)||b.blank-a.blank)
   .slice(0,10).map(t=>{
    const level=levelAwareErrorRecovery({gradeLevel,examType:t.examType});
    const reported=Object.entries(t.reasonCounts).sort((a,b)=>b[1]-a[1]);
    const dominant=reported.length?reported[0][0] as BlankReasonCode:null;
    const reasonLabel=dominant?BLANK_REASON_CODES[dominant]:null;
    const base=dominant?blankReasonAction(dominant):
      t.blank>t.wrong?
       'Önce neden boş bırakıldığını öğrenciyle birlikte belirle.':
       'Yanlış çözüm adımını soru köküyle birlikte incele.';
    const action=level.band==='UNRESOLVED'?
      'Eğitim düzeyini ve sınav kapsamını doğrula; sınıfa özgü soru sayısı atama.':
      base+' '+level.guidedBy+'; ardından uygun onaylı, daha önce görülmemiş bir soruda kontrol et.';
    return {
      subject:t.subject,topic:t.topic,examType:t.examType,correct:t.correct,wrong:t.wrong,blank:t.blank,
      attempts:t.attempts,privateKeyCount:t.privateKeyCount,
      reasonCounts:t.reasonCounts,reasonCoverage:Object.values(t.reasonCounts)
       .reduce((sum,n)=>sum+(n||0),0),
      primaryBlankReason:reasonLabel,
      reasonSource:'STUDENT_SELF_REPORT_NOT_DIAGNOSIS' as const,
      level:level.stage,band:level.band,maxSessionMinutes:level.maxSessionMinutes,
      suggestedFreshQuestions:level.suggestedFreshQuestions,
      interventionPriority:t.wrong+t.blank>=4?'PROMPT_COACH_REVIEW':
        t.wrong+t.blank>=2?'TARGETED_PRACTICE':'MONITOR',
      action,needsHumanKeyReview:t.privateKeyCount>0
    };
   }),
  evidenceType:'RE_GRADED_DATABASE_QUIZ_ATTEMPTS' as const,
  verifiedMastery:false as const,
  note:'Sonuçlar öğrencinin kayıtlı quiz yanıtlarından gerçek soru anahtarıyla yeniden hesaplanır. Boş bırakma nedeni sadece kaydedilmiş ilk test ve gerçek boş yanıtıyla eşleşiyorsa öz bildirim olarak gösterilir; tanı değildir. Öğrencinin özel cevap anahtarı insan onaylı sayılmaz. Tekrar başarısı kalıcı öğrenme/koç etkisi kanıtı değildir.'
 };
}
