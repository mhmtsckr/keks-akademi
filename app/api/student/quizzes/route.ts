import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const schema=z.object({examType:z.string().min(2),subject:z.string().min(2),topic:z.string().optional(),count:z.number().int().min(1).max(30).default(10)});

async function POST__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student) return NextResponse.json({error:'Öğrenci profili bulunamadı.'},{status:400});
 const input=await readJson(req, schema);
 const questions=await db.questionBankItem.findMany({
  where:{examType:input.examType,subject:input.subject,active:true,...(input.topic?{topic:input.topic}:{})},
  take:Math.max(input.count*3,input.count)
 });
 if(!questions.length) return NextResponse.json({error:'Bu ders/konu için henüz soru bankası bulunmuyor.'},{status:404});
 const selected=questions.slice(0,input.count);
 const quiz=await db.practiceQuiz.create({data:{studentId:user.student.id,title:input.examType+' · '+input.subject+(input.topic?' · '+input.topic:''),examType:input.examType,subject:input.subject,topic:input.topic||null,questionIds:selected.map(q=>q.id),createdByUserId:user.id}});
 return NextResponse.json({ok:true,quiz:{id:quiz.id,title:quiz.title},questions:selected.map(q=>({id:q.id,prompt:q.prompt,options:q.options,sourceKind:q.sourceKind,sourceYear:q.sourceYear,officialSourceUrl:q.officialSourceUrl}))});
}

export const POST = withApiErrors(POST__handler);
