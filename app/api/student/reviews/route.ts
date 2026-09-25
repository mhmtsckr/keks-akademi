import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { REVIEW_DAYS } from '@/lib/smartCoach';
import { adaptiveReviewIntervalDays } from '@/lib/learningEngine';

const schema=z.object({id:z.string(),answer:z.string().min(1)});

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
  const item=await db.reviewQueueItem.findFirst({where:{id:input.id,studentId:user.student.id},include:{question:true}});
  if(!item) return NextResponse.json({error:'Tekrar kaydı bulunamadı.'},{status:404});
  if(item.status==='COMPLETED')return NextResponse.json({error:'Bu tekrar döngüsü zaten tamamlandı.'},{status:409});
  if(item.dueAt.getTime()>Date.now())return NextResponse.json({error:'Bu sorunun tekrar günü henüz gelmedi.'},{status:409});
  const correct=String(item.question.sourceKind).startsWith('STUDENT_WRONG:')
    ? normalizeAnswer(input.answer)===normalizeAnswer(item.question.correctAnswer)
    : input.answer===item.question.correctAnswer;
  const previousCorrect=item.lastCorrect;
  let step=item.stepIndex;
  if(correct) step=Math.min(step+1,REVIEW_DAYS.length);
  else step=Math.max(0,step-1);
  const completed=correct && step>=REVIEW_DAYS.length;
  const due=new Date();
  const nextIntervalDays=completed?null:adaptiveReviewIntervalDays({
    nextStep:step,
    correct,
    previousCorrect
  });
  if(!completed) due.setDate(due.getDate()+Number(nextIntervalDays||0));
  const row=await db.reviewQueueItem.update({where:{id:item.id},data:{
    stepIndex:step,lastCorrect:correct,status:completed?'COMPLETED':(Number(nextIntervalDays||0)===0?'DUE':'PENDING'),
    completedAt:completed?new Date():null,dueAt:due
  }});
  return NextResponse.json({
    ok:true,
    row,
    correct,
    correctAnswer:item.question.correctAnswer,
    explanation:item.question.explanation,
    completed,
    currentStage:correct?Math.min(step,REVIEW_DAYS.length-1):0,
    nextIntervalDays,
    nextDueAt:completed?null:due
  });
}

export const GET = withApiErrors(GET__handler);
export const POST = withApiErrors(POST__handler);
