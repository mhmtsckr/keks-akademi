import {readJson,withApiErrors,HttpError} from '@/lib/apiGuard';
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {requireRole} from '@/lib/auth';
import {calcNet} from '@/lib/performance';
import {BLANK_REASON_CODES,QUIZ_RECOVERY_EVENT,evaluateWrongBlankAnswers,
 recoveryNextStep,getRecoveryLevel} from '@/lib/levelAwareWrongBlank';

const reasonCodes=Object.keys(BLANK_REASON_CODES) as [
 keyof typeof BLANK_REASON_CODES,...(keyof typeof BLANK_REASON_CODES)[]
];
const schema=z.object({
 answers:z.record(z.string().min(1).max(90),z.string().max(2000).nullable())
   .refine(x=>Object.keys(x).length<=40),
 blankReasons:z.record(z.string().min(1).max(90),z.enum(reasonCodes))
   .refine(x=>Object.keys(x).length<=40).optional()
}).strict();

async function POST__handler(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await requireRole(['STUDENT']);
 if(!user.student)throw new HttpError(403,'Öğrenci profili bulunamadı.');
 const studentId=user.student.id;
 const {id}=await params;
 const quiz=await db.practiceQuiz.findFirst({where:{id,studentId}});
 if(!quiz)throw new HttpError(404,'Test bulunamadı.');
 const input=await readJson(req,schema);
 const ids=Array.isArray(quiz.questionIds)?quiz.questionIds:[];
 if(ids.length===0||ids.length>40||ids.some(x=>typeof x!=='string'||!x)||
    new Set(ids).size!==ids.length)
  throw new HttpError(409,'Testin soru listesi geçersiz.');
 const questions=await db.questionBankItem.findMany({where:{id:{in:ids as string[]}}});
 if(questions.length!==ids.length||
    questions.some(q=>q.sourceKind.startsWith('STUDENT_WRONG:')&&q.sourceKind!=='STUDENT_WRONG:'+studentId))
  throw new HttpError(409,'Testte eksik veya başka öğrenciye ait soru var.');
 // Preserve authored quiz order instead of database query order.
 const byId=new Map(questions.map(q=>[q.id,q]));
 const ordered=ids.map(id=>byId.get(id as string)!);
 const inputs=input.answers as Record<string,string|null>;
 const blankReasons=input.blankReasons||{};
 if(Object.keys(inputs).some(k=>!byId.has(k))||
    Object.keys(blankReasons).some(k=>!byId.has(k)))
  throw new HttpError(400,'Bu testte bulunmayan soru kimliği gönderildi.');
 if(Object.entries(blankReasons).some(([key])=>String(inputs[key]||'').trim()!==''))
  throw new HttpError(400,'Boş bırakma nedeni, yanıtlanmış soru için girilemez.');
 const graded=evaluateWrongBlankAnswers(ordered,inputs,blankReasons);
 const net=calcNet(graded.correct,graded.wrong);
 const level=getRecoveryLevel(user.student.gradeLevel,ordered[0]?.examType||quiz.examType);
 const now=new Date();
 const committed=await db.$transaction(async tx=>{
  // PostgreSQL transaction advisory lock prevents two simultaneous requests from
  // creating duplicate attempts, review resets, reports and learning events.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${studentId}),hashtext(${quiz.id})) IS NULL AS acquired`;
  const old=await tx.practiceQuizAttempt.findFirst({
   where:{quizId:quiz.id,studentId},select:{id:true}
  });
  if(old)throw new HttpError(409,'Bu testin sonucu daha önce kaydedildi. Yeni tekrar için yeni test oluştur.');
  const attempt=await tx.practiceQuizAttempt.create({data:{
   quizId:quiz.id,studentId,answers:inputs,
   correct:graded.correct,wrong:graded.wrong,blank:graded.blank,net
  }});
  // Empty answers are genuine learning gaps, not wrong choices. Both get a
  // zero-day repeat, while their source reason remains different in the event.
  for(const questionId of graded.queueIds){
   await tx.reviewQueueItem.upsert({
    where:{studentId_questionId:{studentId,questionId}},
    create:{studentId,questionId,sourceAttemptId:attempt.id,
     stepIndex:0,dueAt:now,status:'DUE',lastCorrect:false},
    update:{sourceAttemptId:attempt.id,stepIndex:0,dueAt:now,
     status:'DUE',lastCorrect:false,completedAt:null}
   });
  }
  if(quiz.examType!=='KISISEL'){
   await tx.practiceLog.create({data:{
    studentId,examType:quiz.examType,subject:quiz.subject,topic:quiz.topic,
    correct:graded.correct,wrong:graded.wrong,blank:graded.blank,
    total:graded.details.length,net
   }});
  }
  const report=await tx.studentReport.create({data:{
   studentId,title:'Otomatik Test Performans Raporu · '+quiz.title,
   summary:`D ${graded.correct} · Y ${graded.wrong} · B ${graded.blank} · Net ${net}`,
   content:`${quiz.title} testinde ${graded.correct} doğru, ${graded.wrong} yanlış, ${graded.blank} boş ve ${net} net kaydedildi. Yanlış ve boş sorular ayrı neden etiketleriyle 0. gün tekrara alındı; öğretmen/koç destek planını eğitim düzeyine göre oluşturmalıdır.`,
   createdByUserId:user.id,visibleToStudent:true,visibleToParent:true
  }});
  const recovery=graded.details.filter(q=>q.status!=='CORRECT').map(q=>({
   questionId:q.questionId,subject:q.subject,topic:q.topic,examType:q.examType,
   status:q.status,blankReason:q.blankReason
  }));
  await tx.dailyLog.create({data:{studentId,date:now,payload:{
   type:QUIZ_RECOVERY_EVENT,version:1,quizId:quiz.id,attemptId:attempt.id,
   level:{stage:level.stage,grade:level.grade,framework:level.framework,
    needsGradeConfirmation:level.needsGradeConfirmation},
   correct:graded.correct,wrong:graded.wrong,blank:graded.blank,
   outcomes:recovery,gradedSource:'SERVER_ANSWER_KEY',
   reasoningSource:'STUDENT_SELF_REPORT_WHEN_PROVIDED',
   masteryVerified:false
  }}});
  return {attempt,reportId:report.id};
 });
 const feedback=graded.details.map(q=>({
  questionId:q.questionId,status:q.status,subject:q.subject,topic:q.topic,
  blankReason:q.blankReason,correctAnswer:q.correctAnswer,
  explanation:q.explanation,explanationSource:q.explanationSource,
  nextAction:q.status==='CORRECT'?null:recoveryNextStep({
   gradeLevel:user.student!.gradeLevel,subject:q.subject,topic:q.topic,
   examType:q.examType,outcome:q.status,
   blankReason:q.blankReason
  })
 }));
 return NextResponse.json({
  ok:true,attempt:{id:committed.attempt.id,correct:graded.correct,
   wrong:graded.wrong,blank:graded.blank,net},
  reportId:committed.reportId,reviewAdded:graded.queueIds.length,
  reviewAddedWrong:graded.wrong,reviewAddedBlank:graded.blank,
  recoveryLevel:level,feedback,
  evidenceStatus:'SERVER_GRADED_NOT_MASTERY',
  note:'Yanlış ve boş cevaplar ayrı kaydedildi. Boş nedeni öğrencinin beyanıdır, kesin tanı değildir. Yeni soru ve gecikmeli tekrar başarısı ayrıca ölçülür.'
 });
}
export const POST=withApiErrors(POST__handler);
