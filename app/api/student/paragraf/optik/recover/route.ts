import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {HttpError,readJson,withApiErrors} from '@/lib/apiGuard';
import {REMEDIATION_REASONS} from '@/lib/wrongQuestionRemediation';
import {buildOpticalWrongLearningPlan,opticalAttemptLegacyId,toPrintedReviewQuestion} from '@/lib/paragrafWrongLearning';
import {detailedQuestions} from '@/lib/paragrafOptik';

export const runtime='nodejs';
const reason=z.enum(Object.keys(REMEDIATION_REASONS) as [
 keyof typeof REMEDIATION_REASONS,...(keyof typeof REMEDIATION_REASONS)[]
]);
const schema=z.object({
 testNo:z.number().int().min(1).max(50),
 encoded:z.string().regex(/^[A-EX]{30}$/),
 reasons:z.record(z.string().regex(/^(?:[1-9]|[12][0-9]|30)$/),reason).optional()
}).strict();
const noStore={'Cache-Control':'private, no-store'} as const;

function stored(input:unknown){
 return input&&typeof input==='object'&&!Array.isArray(input)?input as Record<string,unknown>:{};
}

async function POST__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student)throw new HttpError(403,'Öğrenci profili bulunamadı.');
 const input=await readJson(req,schema);
 const studentId=user.student.id;
 const legacyId=opticalAttemptLegacyId(studentId,input.testNo);
 const existing=await db.dailyLog.findUnique({where:{legacyId},select:{payload:true}});
 if(existing)return NextResponse.json({ok:true,alreadySaved:true,attempt:stored(existing.payload)},
  {headers:noStore});
 const plan=buildOpticalWrongLearningPlan(input.testNo,input.encoded,input.reasons);
 const source=detailedQuestions(input.testNo);
 if(!plan||!source)throw new HttpError(400,'Bu baskıya ait test ve cevap anahtarı doğrulanamadı.');
 // Only wrong or unanswered questions get queued; the student explicitly opts in.
 const now=new Date();
 const entry={
  kind:'PARAGRAF_OPTIK_WRONG_RECOVERY',version:1,edition:plan.edition,
  testNo:input.testNo,encoded:input.encoded,submittedAt:now.toISOString(),
  ...plan.summary,
  wrongTopics:plan.priorities.map(x=>x.topic),
  reasons:Object.fromEntries(plan.missed.filter(x=>x.reason).map(x=>[String(x.number),x.reason])),
  reviewQuestionIds:plan.missed.map(x=>x.reviewId),
  reasonSource:'STUDENT_SELF_REPORT',verifiedMastery:false
 };
 try{
  const result=await db.$transaction(async tx=>{
   // A unique first attempt per student/test prevents changing marks to earn new reports.
   const saved=await tx.dailyLog.findUnique({where:{legacyId},select:{payload:true}});
   if(saved)return {alreadySaved:true,attempt:stored(saved.payload)};
   await tx.dailyLog.create({data:{studentId,legacyId,date:now,payload:entry}});
   for(const missed of plan.missed){
    const original=source[missed.number-1];
    const row=toPrintedReviewQuestion(original);
    const actual=await tx.questionBankItem.upsert({where:{id:row.id},
      create:row,update:{}});
    // A paper edition/key mismatch must not silently cross-link a student's review.
    if(actual.sourceKind!==row.sourceKind||actual.correctAnswer!==row.correctAnswer
     ||actual.topic!==row.topic)throw new HttpError(409,'Basılı soru sürümüyle tekrar anahtarı uyuşmuyor.');
    await tx.reviewQueueItem.upsert({
     where:{studentId_questionId:{studentId,questionId:row.id}},
     create:{studentId,questionId:row.id,status:'DUE',dueAt:now,
       stepIndex:0,lastCorrect:false},
     update:{} // Never reset an already advanced 0-1-3-7-14-28 schedule.
    });
   }
   await tx.practiceLog.create({data:{
    studentId,examType:'TYT',subject:'Türkçe',topic:'KEKS Paragraf · Test '+input.testNo,
    correct:plan.summary.correct,wrong:plan.summary.wrong,blank:plan.summary.blank,
    net:plan.summary.net,total:30,date:now
   }});
   return {alreadySaved:false,attempt:entry};
  });
  return NextResponse.json({
   ok:true,...result,
   reviewLinked:result.alreadySaved
    ?Array.isArray(result.attempt.reviewQuestionIds)?result.attempt.reviewQuestionIds.length:0
    :plan.missed.length,
   reviewPath:'/ogrenci', // Personal queue is shown in the student panel.
   priorities:plan.priorities,
   note:'Konu çalışması ve öz bildirim tek başına kazanım hâkimiyeti değildir. Tekrar tarihleri bağımsız tekrar sonuçlarına göre ilerler.'
  },{headers:noStore});
 }catch(e){
  if((e as {code?:string}).code==='P2002'){
   const prior=await db.dailyLog.findUnique({where:{legacyId},select:{payload:true}});
   if(prior){
    const attempt=stored(prior.payload);
    return NextResponse.json({
     ok:true,alreadySaved:true,attempt,
     reviewLinked:Array.isArray(attempt.reviewQuestionIds)?attempt.reviewQuestionIds.length:0,
     reviewPath:'/ogrenci'
    },{headers:noStore});
   }
  }
  throw e;
 }
}

export const POST=withApiErrors(POST__handler);
