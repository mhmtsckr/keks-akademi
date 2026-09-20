import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

const question=z.object({
  orderNo:z.number().int().positive(),
  dimension:z.string().min(1),
  prompt:z.string().min(2),
  responseType:z.enum(['LIKERT','TEXT','CHOICE']).default('LIKERT'),
  options:z.array(z.union([z.string(),z.number(),z.object({label:z.string(),value:z.union([z.string(),z.number()])})])).optional(),
  reverse:z.boolean().default(false),
  required:z.boolean().default(true)
});
const schema=z.object({
  title:z.string().min(2),
  version:z.string().min(1),
  sourceUrl:z.string().url().optional(),
  questions:z.array(question).min(1).max(300)
});

export async function POST(req:Request){
  const user=await requireRole(['ADMIN']);
  const input=schema.parse(await req.json());

  await db.preInterviewForm.updateMany({where:{active:true,version:{not:input.version}},data:{active:false}});
  const form=await db.preInterviewForm.upsert({
    where:{version:input.version},
    create:{title:input.title,version:input.version,sourceUrl:input.sourceUrl||null,active:true},
    update:{title:input.title,sourceUrl:input.sourceUrl||null,active:true}
  });

  await db.preInterviewQuestion.deleteMany({where:{formId:form.id}});
  await db.preInterviewQuestion.createMany({data:input.questions.map(q=>({
    formId:form.id,orderNo:q.orderNo,dimension:q.dimension,prompt:q.prompt,
    responseType:q.responseType,options:q.options??undefined,reverse:q.reverse,required:q.required
  }))});

  return NextResponse.json({ok:true,formId:form.id,count:input.questions.length,importedBy:user.id});
}
