import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { calcNet } from '@/lib/performance';

const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('topic'),examType:z.string().min(2),subject:z.string().min(2),topic:z.string().min(2),completed:z.boolean()}),
 z.object({action:z.literal('practice'),examType:z.string().min(2),subject:z.string().min(2),topic:z.string().optional(),correct:z.number().int().min(0),wrong:z.number().int().min(0),blank:z.number().int().min(0),errorReason:z.enum(['BILGI_EKSIKLIGI','DIKKAT','ISLEM_HATASI','SURE','SORUYU_ANLAMA','STRATEJI','DIGER']).optional()}),
]);

async function POST__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student) return NextResponse.json({error:'Öğrenci profili bulunamadı.'},{status:400});
 const input=await readJson(req, schema);
 if(input.action==='topic'){
   const row=await db.topicProgress.upsert({
    where:{studentId_examType_subject_topic:{studentId:user.student.id,examType:input.examType,subject:input.subject,topic:input.topic}},
    create:{studentId:user.student.id,examType:input.examType,subject:input.subject,topic:input.topic,completed:input.completed,completedAt:input.completed?new Date():null},
    update:{completed:input.completed,completedAt:input.completed?new Date():null},
   });
   return NextResponse.json({ok:true,row});
 }
 const total=input.correct+input.wrong+input.blank;
 const net=calcNet(input.correct,input.wrong);
 const row=await db.practiceLog.create({data:{studentId:user.student.id,examType:input.examType,subject:input.subject,topic:input.topic||null,correct:input.correct,wrong:input.wrong,blank:input.blank,total,net,errorReason:input.errorReason||null}});
 return NextResponse.json({ok:true,row});
}

export const POST = withApiErrors(POST__handler);
