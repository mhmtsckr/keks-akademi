import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { REVIEW_DAYS } from '@/lib/smartCoach';

const schema=z.object({id:z.string(),answer:z.string().min(1)});

export async function GET(){
  const user=await requireRole(['STUDENT']);
  if(!user.student) return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const items=await db.reviewQueueItem.findMany({
    where:{studentId:user.student.id,status:{in:['DUE','PENDING']}},
    include:{question:true},
    orderBy:{dueAt:'asc'},
    take:50
  });
  return NextResponse.json({ok:true,items:items.map(x=>({...x,fileData:undefined}))});
}

export async function POST(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student) return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=schema.parse(await req.json());
  const item=await db.reviewQueueItem.findFirst({where:{id:input.id,studentId:user.student.id},include:{question:true}});
  if(!item) return NextResponse.json({error:'Tekrar kaydı bulunamadı.'},{status:404});
  const correct=input.answer===item.question.correctAnswer;
  let step=item.stepIndex;
  if(correct) step=Math.min(step+1,REVIEW_DAYS.length);
  else step=0;
  const completed=correct && step>=REVIEW_DAYS.length;
  const due=new Date();
  if(!completed) due.setDate(due.getDate()+REVIEW_DAYS[step]);
  const row=await db.reviewQueueItem.update({where:{id:item.id},data:{
    stepIndex:step,lastCorrect:correct,status:completed?'COMPLETED':'PENDING',
    completedAt:completed?new Date():null,dueAt:due
  }});
  return NextResponse.json({ok:true,row,correct,correctAnswer:item.question.correctAnswer,explanation:item.question.explanation});
}
