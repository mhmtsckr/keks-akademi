import {gradePersonalQuiz} from '@/lib/quizErrorLearning';

export type QuizCoachAttempt={
 id:string;quizId:string;createdAt:Date;correct:number;wrong:number;blank:number;
 answers:unknown;quiz:{questionIds:unknown}
};
export type QuizCoachQuestion={
 id:string;subject:string;topic:string;sourceKind:string;correctAnswer:string
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
 studentId:string,{truncated=false}:{truncated?:boolean}={}
){
 const byId=new Map(questions.map(q=>[q.id,q]));
 const seenQuizzes=new Set<string>();
 const topics=new Map<string,{
  subject:string;topic:string;correct:number;wrong:number;blank:number;
  attempts:number;privateKeyCount:number
 }>();
 let tests=0,correct=0,wrong=0,blank=0,excluded=0;
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
  for(const question of selected){
   const key=question.subject+'\u0000'+question.topic;
   const row=topics.get(key)||{subject:question.subject,topic:question.topic,
    correct:0,wrong:0,blank:0,attempts:0,privateKeyCount:0};
   const status=grade.blankIds.includes(question.id)?'blank':
    grade.wrongIds.includes(question.id)?'wrong':'correct';
   row[status]++;
   row.attempts++;
   if(question.sourceKind.startsWith('STUDENT_WRONG:'))row.privateKeyCount++;
   topics.set(key,row);
  }
 }
 return {
  tests,correct,wrong,blank,excluded,truncated,
  topics:[...topics.values()].filter(t=>t.wrong+t.blank>0)
   .sort((a,b)=>b.blank+b.wrong-(a.blank+a.wrong)||b.blank-a.blank)
   .slice(0,10).map(t=>({
    ...t,
    action:t.blank>t.wrong?
     'Önce boş bırakma nedenini öğrenciyle belirle; sınıfına uygun kısa açıklama ve farklı bir soruyla kontrol et.':
     'Yanlış çözüm adımını ve soru kökünü incele; seviyeye uygun onaylı yeni soru ile yeniden değerlendir.',
    needsHumanKeyReview:t.privateKeyCount>0
   })),
  evidenceType:'RE_GRADED_DATABASE_QUIZ_ATTEMPTS' as const,
  verifiedMastery:false as const,
  note:'Sonuçlar öğrencinin ilk kayıtlı quiz yanıtlarından gerçek soru anahtarıyla yeniden hesaplanır. Öğrenci tarafından girilen özel soru cevapları insan onaylı değildir. Aynı sorunun tekrar başarısı veya bu sayılar kalıcı öğrenme/koç etkisi kanıtı değildir.'
 };
}
