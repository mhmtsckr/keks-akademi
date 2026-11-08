import {readJson,withApiErrors,HttpError} from '@/lib/apiGuard';
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {requireRole} from '@/lib/auth';
import {calcNet} from '@/lib/performance';
import {REVIEW_DAYS} from '@/lib/smartCoach';
import {gradePersonalQuiz} from '@/lib/quizErrorLearning';
import {BLANK_REASON_CODES,QUIZ_RECOVERY_EVIDENCE_TYPE,blankReasonAction} from '@/lib/blankReasonEvidence';
import {buildSubjectRecoveryPlan} from '@/lib/subjectRecoveryPlan';

const blankReasonCodes=Object.keys(BLANK_REASON_CODES) as [
 keyof typeof BLANK_REASON_CODES,...(keyof typeof BLANK_REASON_CODES)[]
];
const schema=z.object({
 answers:z.record(z.string().max(100),z.string().max(2000).nullable())
  .refine(v=>Object.keys(v).length<=100,{message:'En fazla 100 soru yanıtı gönderilebilir.'}),
 blankReasons:z.record(z.string().max(100),z.enum(blankReasonCodes))
  .refine(v=>Object.keys(v).length<=100).optional()
}).strict();

async function POST__handler(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await requireRole(['STUDENT']);
 if(!user.student)return NextResponse.json({error:'Öğrenci profili bulunamadı.'},{status:400});
 const {id}=await params;
 const studentId=user.student.id;
 const input=await readJson(req,schema);
 const result=await db.$transaction(async tx=>{
   // Serializes two simultaneous submissions of the same test without a migration.
   await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${id}), 2026) IS NULL AS locked`;
   const quiz=await tx.practiceQuiz.findFirst({where:{id,studentId}});
   if(!quiz)throw new HttpError(404,'Test bulunamadı.');
   const existing=await tx.practiceQuizAttempt.findFirst({
    where:{quizId:id,studentId},select:{id:true}
   });
   if(existing)throw new HttpError(409,'Bu testin sonucu daha önce kaydedildi. Yeniden değerlendirmek için yeni test oluştur.');

   const ids=Array.isArray(quiz.questionIds)?quiz.questionIds.filter(
     (x):x is string=>typeof x==='string'&&x.length>0&&x.length<=100
   ):[];
   if(ids.length===0||ids.length>100||new Set(ids).size!==ids.length)
     throw new HttpError(409,'Testin soru listesi eksik veya tekrar içeriyor.');
   const questions=await tx.questionBankItem.findMany({where:{id:{in:ids}}});
   if(questions.length!==ids.length)throw new HttpError(409,'Testteki bazı sorular artık bulunamıyor.');
   const byId=new Map(questions.map(q=>[q.id,q]));
   const ordered=ids.map(qid=>byId.get(qid)!);
   // Never grade another student's private upload or a withdrawn public question.
   for(const q of ordered){
    const privateQuestion=q.sourceKind.startsWith('STUDENT_WRONG:');
    if(privateQuestion){
     if(q.sourceKind!=='STUDENT_WRONG:'+studentId||q.reviewStatus!=='STUDENT_PRIVATE')
       throw new HttpError(409,'Testte başka öğrenciye ait veya erişilemeyen özel soru var.');
    }else if(!q.active||q.reviewStatus!=='APPROVED'){
      throw new HttpError(409,'Testte onayı kaldırılmış soru var. Yeni test oluştur.');
    }
   }
   if(Object.keys(input.answers).some(k=>!byId.has(k)))
     throw new HttpError(400,'Gönderilen yanıtlar arasında teste ait olmayan soru var.');

   const grade=gradePersonalQuiz(ordered,input.answers);
   const reasons=input.blankReasons||{};
   if(Object.keys(reasons).some(qid=>!byId.has(qid)||
      !grade.blankIds.includes(qid)))
     throw new HttpError(400,'Boş bırakma nedeni yalnız teste ait ve gerçekten boş sorular için kaydedilebilir.');
   const net=calcNet(grade.correct,grade.wrong);
   const attempt=await tx.practiceQuizAttempt.create({
     data:{quizId:quiz.id,studentId,answers:grade.answers,
       correct:grade.correct,wrong:grade.wrong,blank:grade.blank,net}
   });
   const now=new Date();
   const dueAt=new Date(now.getTime()+REVIEW_DAYS[0]*86400000);
   for(const questionId of [...grade.wrongIds,...grade.blankIds]){
     const wasBlank=grade.blankIds.includes(questionId);
     await tx.reviewQueueItem.upsert({
       where:{studentId_questionId:{studentId,questionId}},
       create:{studentId,questionId,sourceAttemptId:attempt.id,
         stepIndex:0,dueAt,status:'DUE',lastCorrect:wasBlank?null:false},
       update:{sourceAttemptId:attempt.id,stepIndex:0,dueAt,status:'DUE',
         lastCorrect:wasBlank?null:false,completedAt:null}
     });
   }
   if(quiz.examType!=='KISISEL'){
     await tx.practiceLog.create({data:{
       studentId,examType:quiz.examType,subject:quiz.subject,topic:quiz.topic,
       correct:grade.correct,wrong:grade.wrong,blank:grade.blank,
       total:ordered.length,net
     }});
   }
   const sourceEvents=ordered.filter(q=>grade.wrongIds.includes(q.id)||grade.blankIds.includes(q.id)).map(q=>({
     questionId:q.id,subject:q.subject,topic:q.topic,examType:q.examType,
     outcome:grade.blankIds.includes(q.id)?'BLANK':'WRONG',
     blankReason:grade.blankIds.includes(q.id)?reasons[q.id]||null:null,
     answerKeySource:q.sourceKind.startsWith('STUDENT_WRONG:')?
       'USER_PROVIDED_UNVERIFIED':'APPROVED_BANK'
   }));
   // Store an immutable, teacher-readable evidence trail, not answer keys or
   // raw responses. Learner reason is only an optional self-report.
   await tx.dailyLog.create({data:{studentId,date:now,payload:{
     type:QUIZ_RECOVERY_EVIDENCE_TYPE,version:3,
     quizId:quiz.id,attemptId:attempt.id,
     correct:grade.correct,wrong:grade.wrong,blank:grade.blank,
     outcomes:sourceEvents,
     outcomeSource:'SERVER_ANSWER_KEY',
     reasonSource:'STUDENT_SELF_REPORT_WHEN_PROVIDED',
     verifiedMastery:false
   }}});
   const report=await tx.studentReport.create({data:{
     studentId,title:'Otomatik Test Performans Raporu · '+quiz.title,
     summary:`D ${grade.correct} · Y ${grade.wrong} · B ${grade.blank} · Net ${net}`,
     content:`${quiz.title}: ${grade.correct} doğru, ${grade.wrong} yanlış, ${grade.blank} boş. Yanlışlar ve boşlar ayrı nedenlerle 0. gün tekrarına alındı. Koç, kazanım düzeyinde boş bırakma nedeni ve yeni soru kanıtlarını ayrıca değerlendirmelidir.`,
     createdByUserId:user.id,visibleToStudent:true,visibleToParent:true
   }});
   const feedback=ordered.filter(q=>grade.wrongIds.includes(q.id)||grade.blankIds.includes(q.id)).map(q=>{
     const isBlank=grade.blankIds.includes(q.id);
     const reason=isBlank?reasons[q.id]||null:null;
     const plan=buildSubjectRecoveryPlan({
       subject:q.subject,topic:q.topic,bankReason:isBlank?'BLANK':'WRONG',
       gradeLevel:user.student!.gradeLevel,examType:q.examType,
       academicTrack:user.student!.academicTrack,errorReason:reason
     });
     return {
       questionId:q.id,subject:q.subject,topic:q.topic,outcome:isBlank?'BLANK':'WRONG',
       blankReason:reason,
       blankReasonLabel:reason?BLANK_REASON_CODES[reason]:null,
       firstStep:isBlank?blankReasonAction(reason):'Hatanın oluştuğu çözüm adımını belirle.',
       method:plan.method,level:plan.adaptation.stage,
       advancedProgram:plan.advancedProgram,
       recommendedQuestions:plan.adaptation.suggestedFreshQuestions,
       answerKeySource:q.sourceKind.startsWith('STUDENT_WRONG:')?
        'USER_PROVIDED_UNVERIFIED':'APPROVED_BANK',
       observation:'Bu kayıt bir tekrar ihtiyacı gösterir; kalıcı öğrenme veya doğrulanmış kazanım değildir.'
     };
   });
   const reviewDetails=ordered.map(q=>{
     const selected=grade.answers[q.id]||null;
     const outcome=grade.blankIds.includes(q.id)?'BLANK':grade.wrongIds.includes(q.id)?'WRONG':'CORRECT';
     return {questionId:q.id,subject:q.subject,topic:q.topic,outcome,
       selectedAnswer:selected,correctAnswer:q.correctAnswer,explanation:q.explanation||null,
       sourceVerified:!q.sourceKind.startsWith('STUDENT_WRONG:')};
   });
   const topicMap=new Map<string,{subject:string;topic:string;correct:number;wrong:number;blank:number}>();
   for(const detail of reviewDetails){
     const key=detail.subject+' · '+detail.topic;
     const stats=topicMap.get(key)||{subject:detail.subject,topic:detail.topic,correct:0,wrong:0,blank:0};
     if(detail.outcome==='CORRECT')stats.correct++;
     else if(detail.outcome==='WRONG')stats.wrong++;
     else stats.blank++;
     topicMap.set(key,stats);
   }
   return {details:reviewDetails,topicAnalysis:[...topicMap.values()],
     attempt:{id:attempt.id,correct:grade.correct,wrong:grade.wrong,blank:grade.blank,net},
     feedback,reportId:report.id,wrongAdded:grade.wrongIds.length,blankAdded:grade.blankIds.length};
 });
 return NextResponse.json({
  ok:true,...result,reviewAdded:result.wrongAdded+result.blankAdded,
  reviewScheduleDays:REVIEW_DAYS,
  evidenceStatus:'SERVER_GRADED_NOT_MASTERY',
  note:'Boş bırakılan sorular yanlışlardan ayrı işaretlendi; ikisi de 0. gün tekrarına alındı. Tekrar başarısı tek başına kalıcı öğrenme kanıtı değildir.'
 });
}


async function GET__handler(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili bulunamadı.'},{status:403});
  const {id}=await params;
  const quiz=await db.practiceQuiz.findFirst({where:{id,studentId:user.student.id}});
  if(!quiz)return NextResponse.json({error:'Test bulunamadı.'},{status:404});
  const attempt=await db.practiceQuizAttempt.findFirst({
    where:{quizId:id,studentId:user.student.id},orderBy:{createdAt:'desc'}
  });
  if(!attempt)return NextResponse.json({error:'Test henüz teslim edilmedi.'},{status:404});
  const ids=Array.isArray(quiz.questionIds)?quiz.questionIds.filter((x):x is string=>typeof x==='string'):[];
  const questions=await db.questionBankItem.findMany({where:{id:{in:ids}}});
  const byId=new Map(questions.map(q=>[q.id,q]));
  const answers=attempt.answers&&typeof attempt.answers==='object'&&!Array.isArray(attempt.answers)?attempt.answers as Record<string,unknown>:{};
  const topicMap=new Map<string,{subject:string;topic:string;correct:number;wrong:number;blank:number}>();
  const details=ids.flatMap(qid=>{
    const q=byId.get(qid);if(!q)return [];
    const selected=typeof answers[qid]==='string'?answers[qid] as string:null;
    const outcome=!selected?'BLANK':selected===q.correctAnswer?'CORRECT':'WRONG';
    const key=q.subject+' · '+q.topic;
    const s=topicMap.get(key)||{subject:q.subject,topic:q.topic,correct:0,wrong:0,blank:0};
    if(outcome==='CORRECT')s.correct++;else if(outcome==='WRONG')s.wrong++;else s.blank++;
    topicMap.set(key,s);
    return [{questionId:q.id,subject:q.subject,topic:q.topic,outcome,selectedAnswer:selected,
      correctAnswer:q.correctAnswer,explanation:q.explanation||null,
      sourceVerified:!q.sourceKind.startsWith('STUDENT_WRONG:')}];
  });
  const evidence=await db.dailyLog.findFirst({
    where:{studentId:user.student.id,payload:{path:['attemptId'],equals:attempt.id}},
    orderBy:{createdAt:'desc'}
  });
  const evidencePayload=evidence?.payload&&typeof evidence.payload==='object'&&!Array.isArray(evidence.payload)?evidence.payload as Record<string,unknown>:{};
  const outcomes=Array.isArray(evidencePayload.outcomes)?evidencePayload.outcomes:[];
  const recordedReasons=new Map<string,keyof typeof BLANK_REASON_CODES>();
  for(const event of outcomes){
    if(!event||typeof event!=='object')continue;
    const item=event as Record<string,unknown>;
    if(typeof item.questionId==='string'&&typeof item.blankReason==='string'&&Object.prototype.hasOwnProperty.call(BLANK_REASON_CODES,item.blankReason))
      recordedReasons.set(item.questionId,item.blankReason as keyof typeof BLANK_REASON_CODES);
  }
  const feedback=details.filter(d=>d.outcome!=='CORRECT').map(d=>{
    const reason=d.outcome==='BLANK'?recordedReasons.get(d.questionId)||null:null;
    const plan=buildSubjectRecoveryPlan({
      subject:d.subject,topic:d.topic,bankReason:d.outcome==='BLANK'?'BLANK':'WRONG',
      gradeLevel:user.student!.gradeLevel,examType:quiz.examType,
      academicTrack:user.student!.academicTrack,errorReason:reason
    });
    return {questionId:d.questionId,subject:d.subject,topic:d.topic,
      outcome:d.outcome,blankReason:reason,blankReasonLabel:reason?BLANK_REASON_CODES[reason]:null,
      firstStep:d.outcome==='BLANK'?blankReasonAction(reason):'Hatanın oluştuğu çözüm adımını belirle.',
      method:plan.method,recommendedQuestions:plan.adaptation.suggestedFreshQuestions};
  });
  return NextResponse.json({ok:true,attempt:{id:attempt.id,correct:attempt.correct,
    wrong:attempt.wrong,blank:attempt.blank,net:attempt.net},
    details,topicAnalysis:[...topicMap.values()],feedback,
    note:'Bu sınav tek bir gözlemdir; farklı günlerde yeni sorularla öğrenme yeniden ölçülmelidir.'});
}

export const GET=withApiErrors(GET__handler);

export const POST=withApiErrors(POST__handler);
