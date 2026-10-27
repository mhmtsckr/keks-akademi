/**
 * Coach-facing, evidence-constrained wrong/blank summaries for quiz attempts.
 * Never infer that a successful same-question repetition proves transfer.
 */
type Log={date:Date;payload:unknown};
type Outcome='CORRECT'|'WRONG'|'BLANK';
const item=(v:unknown):Record<string,unknown>=>
 v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
export function summarizeQuizWrongBlankEvidence(logs:Log[],now=new Date()){
 const byTopic=new Map<string,{
  subject:string;topic:string;wrong:number;blank:number;correct:number;
  lastAt:string;sampleQuestions:number
 }>();
 const attempts=new Set<string>();
 const aggregate={tests:0,wrong:0,blank:0,correct:0};
 for(const row of [...logs].sort((a,b)=>b.date.getTime()-a.date.getTime())){
  if(!(row.date instanceof Date)||!Number.isFinite(row.date.getTime())||
    row.date.getTime()>now.getTime())continue;
  const p=item(row.payload);
  if(p.type!=='QUIZ_WRONG_BLANK_V2'||p.evidence!=='ANSWER_KEY_VERIFIED'||
     p.independentMasteryVerified!==false||
     typeof p.attemptId!=='string'||!p.attemptId||attempts.has(p.attemptId)||
     !Array.isArray(p.perQuestion)||!p.perQuestion.length||p.perQuestion.length>120)continue;
  const questions=p.perQuestion.map(item);
  if(questions.some(q=>typeof q.questionId!=='string'||!q.questionId||
    typeof q.subject!=='string'||!q.subject||
    typeof q.topic!=='string'||!q.topic||
    !['CORRECT','WRONG','BLANK'].includes(String(q.result))))continue;
  const unique=new Set(questions.map(x=>x.questionId));
  if(unique.size!==questions.length)continue;
  const counts={
   correct:questions.filter(x=>x.result==='CORRECT').length,
   wrong:questions.filter(x=>x.result==='WRONG').length,
   blank:questions.filter(x=>x.result==='BLANK').length
  };
  if(counts.correct!==p.correct||counts.wrong!==p.wrong||counts.blank!==p.blank||
    questions.length!==p.total)continue;
  attempts.add(p.attemptId);
  aggregate.tests++;
  aggregate.correct+=counts.correct;aggregate.wrong+=counts.wrong;aggregate.blank+=counts.blank;
  for(const q of questions){
   const key=String(q.subject)+'\u0000'+String(q.topic);
   const entry=byTopic.get(key)||{
    subject:String(q.subject),topic:String(q.topic),correct:0,wrong:0,blank:0,
    sampleQuestions:0,lastAt:row.date.toISOString()
   };
   entry.sampleQuestions++;
   entry[q.result==='CORRECT'?'correct':q.result==='WRONG'?'wrong':'blank']++;
   byTopic.set(key,entry);
  }
 }
 const topics=[...byTopic.values()]
  .filter(x=>x.wrong+x.blank>0)
  .sort((a,b)=>b.wrong+b.blank-(a.wrong+a.blank)||b.blank-a.blank)
  .slice(0,10).map(x=>({
   ...x,
   priority:x.blank>x.wrong?'BLANK_DIAGNOSTIC':'ERROR_ANALYSIS',
   action:x.blank>x.wrong
    ?'Önce öğrencinin neden cevap veremediğini ayır: bilgi, yönerge, yöntem veya süre. Yeni soruda süresiz kontrol yap.'
    :'Yanlış çözümün hangi adımında kopulduğunu kaydet ve düzeye uygun, görülmemiş soruyla doğrula.',
   evidenceType:'SERVER_GRADED_QUIZ',
   transferVerified:false as const,masteryVerified:false as const
  }));
 return {
  ...aggregate,topics,observedAttempts:attempts.size,
  evidenceType:'SERVER_GRADED_QUIZ' as const,
  transferVerified:false as const,masteryVerified:false as const,
  note:'Yalnız ilk kez sunucuda değerlendirilen quizlerin yanlış/boşları ayrı sayılır. Öğrencinin tekrar veya tek doğru sonucu kalıcı öğrenme kanıtı değildir.'
 };
}
