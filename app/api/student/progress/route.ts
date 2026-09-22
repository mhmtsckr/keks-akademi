import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { calcNet } from '@/lib/performance';
import { REVIEW_DAYS } from '@/lib/smartCoach';

const TOPIC_REVIEW_SOURCE='TOPIC_REVIEW_01371428';

function turkeyDayStart(offsetDays=0){
 const key=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const d=new Date(key+'T00:00:00+03:00');
 d.setUTCDate(d.getUTCDate()+offsetDays);
 return d;
}

const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('topic'),examType:z.string().min(2),subject:z.string().min(2),topic:z.string().min(2),completed:z.boolean()}),
 z.object({action:z.literal('practice'),examType:z.string().min(2),subject:z.string().min(2),topic:z.string().optional(),correct:z.number().int().min(0),wrong:z.number().int().min(0),blank:z.number().int().min(0),errorReason:z.enum(['BILGI_EKSIKLIGI','DIKKAT','ISLEM_HATASI','SURE','SORUYU_ANLAMA','STRATEJI','DIGER']).optional()}),
]);

async function POST__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student) return NextResponse.json({error:'Öğrenci profili bulunamadı.'},{status:400});
 const studentId:string=user.student.id;
 const input=await readJson(req, schema);
 if(input.action==='topic'){
   const completedAt=input.completed?new Date():null;
   const row=await db.$transaction(async tx=>{
    const progress=await tx.topicProgress.upsert({
      where:{studentId_examType_subject_topic:{studentId:studentId,examType:input.examType,subject:input.subject,topic:input.topic}},
      create:{studentId:studentId,examType:input.examType,subject:input.subject,topic:input.topic,completed:input.completed,completedAt},
      update:{completed:input.completed,completedAt},
    });

    await tx.coachingAction.updateMany({
      where:{
        studentId:studentId,
        subject:input.subject,
        topic:input.topic,
        planSource:TOPIC_REVIEW_SOURCE,
        status:'ACTIVE'
      },
      data:{status:'CANCELLED'}
    });

    if(input.completed){
      for(const day of REVIEW_DAYS){
        const taskDate=turkeyDayStart(day);
        const periodEnd=new Date(taskDate);periodEnd.setUTCDate(periodEnd.getUTCDate()+1);
        await tx.coachingAction.create({data:{
          studentId:studentId,
          createdByUserId:user.id,
          title:`${input.subject} · ${input.topic} · ${day}. gün konu tekrarı`,
          description:`0–1–3–7–14–28. Gün Tekrar Sistemi · ${day}. gün · ${input.subject} / ${input.topic}`,
          metricType:'COUNT',
          targetValue:1,
          currentValue:0,
          cadence:'SPACED_REVIEW',
          periodStart:taskDate,
          periodEnd,
          subject:input.subject,
          topic:input.topic,
          taskDate,
          planSource:TOPIC_REVIEW_SOURCE
        }});
      }
    }
    return progress;
   });

   const reviewSchedule=input.completed?REVIEW_DAYS.map(day=>({
     day,
     label:day+'. gün',
     date:turkeyDayStart(day).toISOString()
   })):[];
   return NextResponse.json({ok:true,row,reviewSchedule});
 }
 const total=input.correct+input.wrong+input.blank;
 const net=calcNet(input.correct,input.wrong);
 const row=await db.practiceLog.create({data:{studentId:studentId,examType:input.examType,subject:input.subject,topic:input.topic||null,correct:input.correct,wrong:input.wrong,blank:input.blank,total,net,errorReason:input.errorReason||null}});
 return NextResponse.json({ok:true,row});
}

export const POST = withApiErrors(POST__handler);
