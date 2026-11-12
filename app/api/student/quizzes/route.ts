import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const schema=z.object({examType:z.string().min(2),subject:z.string().min(2),topic:z.string().optional(),count:z.number().int().min(1).max(30).default(10),bank:z.enum(['KEKS_MAT_2026']).optional()});

async function POST__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student) return NextResponse.json({error:'Öğrenci profili bulunamadı.'},{status:400});
 const input=await readJson(req, schema);
 if(input.bank&&(input.examType!=='TYT'||input.subject!=='Matematik'))return NextResponse.json({error:'KEKS Matematik yalnız TYT Matematik için kullanılabilir.'},{status:400});
 const where={examType:input.examType,subject:input.subject,active:true,reviewStatus:'APPROVED',...(input.topic?{topic:input.topic}:{}),...(input.bank?{sourceKind:{startsWith:'KEKS_MAT_2026:'}}:{})};
 const poolSize=Math.max(input.count*3,input.count);
 const total=input.bank?await db.questionBankItem.count({where}):0;
 const questions=await db.questionBankItem.findMany({where,orderBy:{id:'asc'},
  skip:input.bank?Math.floor(Math.random()*Math.max(1,total-poolSize+1)):0,take:poolSize});
 if(!questions.length) return NextResponse.json({error:'Bu ders/konu için henüz soru bankası bulunmuyor.'},{status:404});
 const selected=questions.sort(()=>Math.random()-.5).slice(0,input.count);
 const quiz=await db.practiceQuiz.create({data:{studentId:user.student.id,title:(input.bank?'KEKS Matematik · ':'')+input.examType+' · '+input.subject+(input.topic?' · '+input.topic:''),examType:input.examType,subject:input.subject,topic:input.topic||null,questionIds:selected.map(q=>q.id),createdByUserId:user.id}});
 return NextResponse.json({ok:true,quiz:{id:quiz.id,title:quiz.title},questions:selected.map(q=>({id:q.id,prompt:q.prompt,options:q.options,sourceKind:q.sourceKind,sourceYear:q.sourceYear,officialSourceUrl:q.officialSourceUrl}))});
}

export const POST = withApiErrors(POST__handler);
