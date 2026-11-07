/**
 * Observational, student-scoped topic transfer evidence from immutable quiz attempts.
 * Re-grade with server-side keys. Same-question retries, student-private keys, guided
 * examples and same-day responses NEVER establish delayed/new-question transfer.
 */
import {gradePersonalQuiz} from '@/lib/quizErrorLearning';

const DAY=86400000;
export const TOPIC_TRANSFER_WINDOW_DAYS=90;
export const TOPIC_TRANSFER_ATTEMPT_LIMIT=150;
export type TopicTransferAttempt={
 id:string;quizId:string;createdAt:Date;correct:number;wrong:number;blank:number;answers:unknown;
 quiz:{questionIds:unknown;createdAt:Date;examType:string};
};
export type TopicTransferQuestion={
 id:string;subject:string;topic:string;examType:string;sourceKind:string;
 correctAnswer:string;active:boolean;reviewStatus:string;
};
export type TopicTransferStatus='NEEDS_NEW_QUESTIONS'|'NEEDS_DELAYED_EVIDENCE'|
 'NEEDS_SUPPORT'|'PROGRESS_OBSERVED'|'STRONG_TRANSFER_SIGNAL';
export type TopicTransferRow={
 examType:string;subject:string;topic:string;
 baselineAt:string;baselineWrong:number;baselineBlank:number;
 newQuestions:number;immediateQuestions:number;
 delayedQuestions:number;delayedCorrect:number;delayedWrong:number;delayedBlank:number;
 delayedDays:number;hasDay7Evidence:boolean;accuracyPercent:number|null;
 mostRecentDelayedAt:string|null;status:TopicTransferStatus;statusLabel:string;
 nextAction:string;independentTransferObserved:boolean;verifiedMastery:false;
};
type Classified={id:string;at:number;quizCreatedAt:number;outcome:'CORRECT'|'WRONG'|'BLANK'};
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const dayKey=(ts:number)=>new Intl.DateTimeFormat('en-CA',{
 timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'
}).format(new Date(ts));
const keyFor=(q:TopicTransferQuestion)=>JSON.stringify([q.examType,q.subject,q.topic]);
function validDate(value:unknown):value is Date{
 return value instanceof Date&&Number.isFinite(value.getTime());
}

export function summarizeTopicTransferEvidence(
 attempts:readonly TopicTransferAttempt[],questions:readonly TopicTransferQuestion[],
 studentId:string,opts:{truncated?:boolean;asOf?:Date}={}
){
 const now=validDate(opts.asOf)?opts.asOf!.getTime():Date.now();
 const cutoff=now-TOPIC_TRANSFER_WINDOW_DAYS*DAY;
 const byQuestion=new Map(questions.map(q=>[q.id,q]));
 const seenQuizzes=new Set<string>();
 const seenQuestionIds=new Set<string>();
 const rows=new Map<string,{q:TopicTransferQuestion;events:Classified[]}>();
 let verifiedQuizzes=0,excludedQuizzes=0,privateOrUnapprovedExcluded=0,repeatedQuestionsExcluded=0;
 for(const attempt of [...attempts].sort((a,b)=>
   a.createdAt.getTime()-b.createdAt.getTime()||a.id.localeCompare(b.id))){
  if(!validDate(attempt.createdAt)||!attempt.quiz||!validDate(attempt.quiz.createdAt)||
    attempt.createdAt.getTime()>now||attempt.createdAt.getTime()<cutoff||
    attempt.quiz.createdAt.getTime()>attempt.createdAt.getTime()||
    seenQuizzes.has(attempt.quizId))continue;
  const ids=attempt.quiz.questionIds;
  const answers=object(attempt.answers);
  if(!Array.isArray(ids)||ids.length===0||ids.length>100||
    ids.some(x=>typeof x!=='string'||!x)||new Set(ids).size!==ids.length||
    Object.keys(answers).some(id=>!ids.includes(id))){
   excludedQuizzes++;continue;
  }
  const selected=ids.map(id=>byQuestion.get(id));
  if(selected.some(q=>!q||q.sourceKind.startsWith('STUDENT_WRONG:')&&
    q.sourceKind!=='STUDENT_WRONG:'+studentId)){
   excludedQuizzes++;continue;
  }
  const typed=selected as TopicTransferQuestion[];
  if(typed.some(q=>!q.correctAnswer.trim())){
   excludedQuizzes++;continue;
  }
  const grade=gradePersonalQuiz(typed,Object.fromEntries(
    Object.entries(answers).map(([id,a])=>[id,typeof a==='string'?a:null])
  ));
  if(grade.correct!==attempt.correct||grade.wrong!==attempt.wrong||
     grade.blank!==attempt.blank){
   excludedQuizzes++;continue;
  }
  seenQuizzes.add(attempt.quizId);
  verifiedQuizzes++;
  for(const q of typed){
   // Private user-provided answer keys cannot substantiate topic recovery.
   if(q.sourceKind.startsWith('STUDENT_WRONG:')||q.reviewStatus!=='APPROVED'||!q.active){
    privateOrUnapprovedExcluded++;continue;
   }
   // First recorded attempt only: repeated old questions are not novel evidence.
   if(seenQuestionIds.has(q.id)){repeatedQuestionsExcluded++;continue;}
   seenQuestionIds.add(q.id);
   const subject=q.subject.trim(),topic=q.topic.trim(),exam=q.examType.trim();
   if(!subject||!topic||!exam||/^(GENEL|KARMA|BELIRSIZ|BELİRSİZ)$/i.test(topic))continue;
   const key=keyFor(q);
   if(!rows.has(key))rows.set(key,{q,events:[]});
   rows.get(key)!.events.push({
    id:q.id,at:attempt.createdAt.getTime(),quizCreatedAt:attempt.quiz.createdAt.getTime(),
    outcome:grade.blankIds.includes(q.id)?'BLANK':grade.wrongIds.includes(q.id)?'WRONG':'CORRECT'
   });
  }
 }
 const topics:TopicTransferRow[]=[];
 for(const {q,events} of rows.values()){
  const ordered=events.sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
  const baseline=ordered.find(e=>e.outcome!=='CORRECT');
  if(!baseline)continue;
  const baselineAt=baseline.at;
  const firstSession=ordered.filter(e=>e.at===baselineAt&&e.outcome!=='CORRECT');
  const baselineWrong=firstSession.filter(e=>e.outcome==='WRONG').length;
  const baselineBlank=firstSession.filter(e=>e.outcome==='BLANK').length;
  const subsequent=ordered.filter(e=>e.at>baselineAt&&e.quizCreatedAt>baselineAt);
  const delayed=subsequent.filter(e=>e.at-baselineAt>=DAY);
  const days=new Set(delayed.map(e=>dayKey(e.at)));
  const delayedCorrect=delayed.filter(e=>e.outcome==='CORRECT').length;
  const delayedWrong=delayed.filter(e=>e.outcome==='WRONG').length;
  const delayedBlank=delayed.filter(e=>e.outcome==='BLANK').length;
  const accuracyPercent=delayed.length?Math.round(100*delayedCorrect/delayed.length):null;
  const hasDay7Evidence=delayed.some(e=>e.at-baselineAt>=7*DAY);
  const lastTwo=delayed.slice(-2);
  const recentFailure=lastTwo.some(e=>e.outcome!=='CORRECT');
  // Strong transfer is only an observational *signal*, not a mastered status.
  const strong=!opts.truncated&&delayed.length>=4&&days.size>=2&&
    hasDay7Evidence&&accuracyPercent!==null&&accuracyPercent>=80&&!recentFailure;
  let status:TopicTransferStatus;
  let nextAction:string;
  if(!subsequent.length){
   status='NEEDS_NEW_QUESTIONS';
   nextAction='Aynı beceriden daha önce görülmemiş onaylı sorular çöz; aynı soruyu yeniden yapmak yeni soru kanıtı değildir.';
  }else if(!delayed.length||days.size<2){
   status='NEEDS_DELAYED_EVIDENCE';
   nextAction='Yeni soruları en az 24 saat sonra ve başka bir günde yeniden ölç. Tek gün performansından kalıcılık çıkarma.';
  }else if(recentFailure||accuracyPercent!==null&&accuracyPercent<60){
   status='NEEDS_SUPPORT';
   nextAction='Yeni ve gecikmeli sorularda yanlış/boş sürüyor. Hata nedenini koçla incele; kısa konu onarımından sonra farklı onaylı soruyla yeniden ölç.';
  }else if(strong){
   status='STRONG_TRANSFER_SIGNAL';
   nextAction='Farklı sorularda ve günlerde olumlu aktarım gözlendi. 14 ve 28. günlerde farklı sorularla sürdür; kesin kazanım hâkimiyeti ilan etme.';
  }else{
   status='PROGRESS_OBSERVED';
   nextAction='Olumlu yeni soru sonuçları var; daha uzun aralıkta ve farklı günlerde ölçümle kanıtı güçlendir.';
  }
  const labels:Record<TopicTransferStatus,string>={
   NEEDS_NEW_QUESTIONS:'Farklı soru kanıtı bekleniyor',
   NEEDS_DELAYED_EVIDENCE:'Farklı gün kanıtı yetersiz',
   NEEDS_SUPPORT:'Koç desteği öneriliyor',
   PROGRESS_OBSERVED:'İlerleme işareti var',
   STRONG_TRANSFER_SIGNAL:'Güçlü aktarım işareti'
  };
  topics.push({
   examType:q.examType,subject:q.subject,topic:q.topic,
   baselineAt:new Date(baselineAt).toISOString(),baselineWrong,baselineBlank,
   newQuestions:subsequent.length,immediateQuestions:subsequent.length-delayed.length,
   delayedQuestions:delayed.length,delayedCorrect,delayedWrong,delayedBlank,
   delayedDays:days.size,hasDay7Evidence,
   accuracyPercent,mostRecentDelayedAt:delayed.length?
    new Date(delayed[delayed.length-1].at).toISOString():null,
   status,statusLabel:labels[status],nextAction,
   independentTransferObserved:delayed.length>0,verifiedMastery:false
  });
 }
 const priority:Record<TopicTransferStatus,number>={
  NEEDS_SUPPORT:0,NEEDS_NEW_QUESTIONS:1,NEEDS_DELAYED_EVIDENCE:2,
  PROGRESS_OBSERVED:3,STRONG_TRANSFER_SIGNAL:4
 };
 topics.sort((a,b)=>priority[a.status]-priority[b.status]||
   b.delayedWrong+b.delayedBlank-a.delayedWrong-a.delayedBlank||
   a.subject.localeCompare(b.subject,'tr')||a.topic.localeCompare(b.topic,'tr'));
 return {
  windowDays:TOPIC_TRANSFER_WINDOW_DAYS,verifiedQuizzes,excludedQuizzes,
  privateOrUnapprovedExcluded,repeatedQuestionsExcluded,truncated:Boolean(opts.truncated),
  topics:topics.slice(0,30),
  summary:{
   topics:topics.length,needsSupport:topics.filter(t=>t.status==='NEEDS_SUPPORT').length,
   awaitingEvidence:topics.filter(t=>t.status==='NEEDS_NEW_QUESTIONS'||t.status==='NEEDS_DELAYED_EVIDENCE').length,
   progressing:topics.filter(t=>t.status==='PROGRESS_OBSERVED').length,
   strongSignals:topics.filter(t=>t.status==='STRONG_TRANSFER_SIGNAL').length
  },
  evidenceType:'SERVER_REGRADED_IMMUTABLE_QUIZ_ATTEMPTS' as const,
  verifiedMastery:false as const,
  note:'Bu ölçüm son 90 gündeki onaylı soru anahtarıyla yeniden değerlendirilen testlerden oluşur. Yeni soruların ilk kaydı ve en az 24 saat aralıklı, farklı günlere yayılmış sonuçlar esas alınır. Öğrenci yüklemeleri, yönlendirmeli örnekler, aynı soru tekrarları ve doğrulanamayan testler olumlu aktarım sayılmaz. Güçlü işaret bile kalıcı öğrenmeyi veya bir müdahalenin nedensel etkisini ispatlamaz.'
 };
}
