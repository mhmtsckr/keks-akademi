import { HttpError, readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { REVIEW_DAYS } from '@/lib/smartCoach';
import { adaptiveReviewIntervalDays,reviewIntervalReason } from '@/lib/learningEngine';

const schema=z.object({id:z.string(),answer:z.string().min(1).max(2000),microSessionId:z.string().optional()});

function normalizeAnswer(v:string){
  return v.toLocaleLowerCase('tr-TR')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,' ').trim();
}
function questionMeta(v:unknown){
  return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student) return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const items=await db.reviewQueueItem.findMany({
    where:{studentId:user.student.id,status:{in:['DUE','PENDING']}},
    include:{question:true},
    orderBy:{dueAt:'asc'},
    take:50
  });
  const now=Date.now();
  return NextResponse.json({
    ok:true,
    scheduleDays:REVIEW_DAYS,
    items:items.map(x=>({
      id:x.id,
      stepIndex:x.stepIndex,
      dueAt:x.dueAt,
      status:new Date(x.dueAt).getTime()<=now?'DUE':'PENDING',
      lastCorrect:x.lastCorrect,
      question:{
        id:x.question.id,
        examType:x.question.examType,
        subject:x.question.subject,
        topic:x.question.topic,
        prompt:x.question.prompt,
        options:String(x.question.sourceKind).startsWith('STUDENT_WRONG:')?{}:x.question.options,
        sourceKind:x.question.sourceKind,
        sourceYear:x.question.sourceYear,
        officialSourceUrl:x.question.officialSourceUrl,
        inputMode:String(x.question.sourceKind).startsWith('STUDENT_WRONG:')?'TEXT':'CHOICE',
        imageUrl:String(x.question.sourceKind).startsWith('STUDENT_WRONG:')
          ? String(questionMeta(x.question.options).imageUrl||'')||null
          : null
      }
    }))
  });
}

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student) return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=await readJson(req, schema);
  const microSession=input.microSessionId?await db.dailyLog.findFirst({where:{id:input.microSessionId,studentId:user.student.id}}):null;
  const microMeta=(microSession?.payload||{}) as Record<string,any>;
  if(input.microSessionId&&(!microSession||microMeta.kind!=='WRONG_1'||microMeta.reviewId!==input.id))throw new HttpError(404,'Mikro tekrar oturumu bulunamadı.');
  if(input.microSessionId&&microMeta.type==='MICRO_RESULT')return NextResponse.json({ok:true,...microMeta.reviewResult});
  if(input.microSessionId&&(microMeta.type!=='MICRO_STARTED'||Date.now()-microSession!.createdAt.getTime()>86400000))throw new HttpError(409,'Tekrar oturumunun süresi doldu.');
  const item=await db.reviewQueueItem.findFirst({where:{id:input.id,studentId:user.student.id},include:{question:true}});
  if(!item) return NextResponse.json({error:'Tekrar kaydı bulunamadı.'},{status:404});
  if(item.status==='COMPLETED')return NextResponse.json({error:'Bu tekrar döngüsü zaten tamamlandı.'},{status:409});
  if(item.dueAt.getTime()>Date.now())return NextResponse.json({error:'Bu sorunun tekrar günü henüz gelmedi.'},{status:409});
  const correct=String(item.question.sourceKind).startsWith('STUDENT_WRONG:')
    ? normalizeAnswer(input.answer)===normalizeAnswer(item.question.correctAnswer)
    : input.answer===item.question.correctAnswer;
  const previousCorrect=item.lastCorrect;
  const recentLogs=await db.dailyLog.findMany({
    where:{studentId:user.student.id,date:{gte:new Date(Date.now()-120*86400000)}},
    orderBy:{date:'desc'},take:250,select:{date:true,payload:true}
  });
  const reviewHistory=recentLogs.flatMap(log=>{
    const p=(log.payload&&typeof log.payload==='object'&&!Array.isArray(log.payload)?log.payload:{}) as Record<string,any>;
    if(p.type!=='REVIEW_RESULT'||p.questionId!==item.questionId)return [];
    return [{correct:Boolean(p.correct),at:log.date}];
  });
  let correctStreak=correct?1:0;
  let incorrectStreak=correct?0:1;
  for(const h of reviewHistory){
    if(correct&&h.correct)correctStreak++;
    else if(!correct&&!h.correct)incorrectStreak++;
    else break;
  }
  const recentWindow=reviewHistory.slice(0,5);
  const recentAccuracy=recentWindow.length
    ?Math.round(recentWindow.filter(x=>x.correct).length/recentWindow.length*100)
    :null;

  let step=item.stepIndex;
  if(correct) step=Math.min(step+1,REVIEW_DAYS.length);
  else step=Math.max(0,step-1);
  const completed=correct && step>=REVIEW_DAYS.length;
  const due=new Date();
  const adaptiveInput={
    nextStep:step,
    correct,
    previousCorrect,
    correctStreak,
    incorrectStreak,
    recentAccuracy
  };
  const nextIntervalDays=completed?null:adaptiveReviewIntervalDays(adaptiveInput);
  const intervalReason=completed
    ?'Aktif tekrar döngüsü başarıyla tamamlandı.'
    :reviewIntervalReason(adaptiveInput,Number(nextIntervalDays||0));
  if(!completed) due.setDate(due.getDate()+Number(nextIntervalDays||0));
  const row=await db.$transaction(async tx=>{
    if(microSession){
      const result={correct,correctAnswer:item.question.correctAnswer,explanation:item.question.explanation,completed,nextIntervalDays,intervalReason,nextDueAt:completed?null:due.toISOString()};
      const claimed=await tx.dailyLog.updateMany({where:{id:microSession.id,studentId:user.student!.id,payload:{path:['type'],equals:'MICRO_STARTED'}},data:{date:new Date(),payload:{...microMeta,type:'MICRO_RESULT',durationSeconds:Math.min(300,Math.max(1,Math.round((Date.now()-microSession.createdAt.getTime())/1000))),correct:correct?1:0,wrong:correct?0:1,blank:0,total:1,reviewResult:result}}});
      if(!claimed.count)throw new HttpError(409,'Bu tekrar zaten kaydedildi.');
    }
    // Guard against a simultaneous submission through another session or the review page.
    const locked=await tx.reviewQueueItem.updateMany({where:{id:item.id,studentId:user.student!.id,dueAt:item.dueAt,stepIndex:item.stepIndex,status:item.status},data:{dueAt:due,stepIndex:step,status:completed?'COMPLETED':(Number(nextIntervalDays||0)===0?'DUE':'PENDING')}});
    if(!locked.count)throw new HttpError(409,'Bu soru başka bir oturumda güncellendi.');
    const updated=await tx.reviewQueueItem.update({where:{id:item.id},data:{
      stepIndex:step,lastCorrect:correct,status:completed?'COMPLETED':(Number(nextIntervalDays||0)===0?'DUE':'PENDING'),
      completedAt:completed?new Date():null,dueAt:due
    }});
    await tx.dailyLog.create({data:{
      studentId:user.student!.id,
      date:new Date(),
      payload:{
        type:'REVIEW_RESULT',
        reviewQueueItemId:item.id,
        questionId:item.questionId,
        subject:item.question.subject,
        topic:item.question.topic,
        correct,
        correctStreak,
        incorrectStreak,
        recentAccuracy,
        previousStep:item.stepIndex,
        nextStep:step,
        nextIntervalDays,
        intervalReason,
        nextDueAt:completed?null:due.toISOString()
      }
    }});
    return updated;
  });
  return NextResponse.json({
    ok:true,
    row,
    correct,
    correctAnswer:item.question.correctAnswer,
    explanation:item.question.explanation,
    completed,
    currentStage:correct?Math.min(step,REVIEW_DAYS.length-1):0,
    nextIntervalDays,
    intervalReason,
    correctStreak,
    incorrectStreak,
    recentAccuracy,
    nextDueAt:completed?null:due
  });
}

export const GET = withApiErrors(GET__handler);
export const POST = withApiErrors(POST__handler);
