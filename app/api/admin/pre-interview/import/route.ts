import { readJson, withApiErrors } from '@/lib/apiGuard';
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
  motivationKey:z.enum(['order','achievement','connection','meaning','mastery','security','novelty','autonomy','control','harmony']).optional(),
  required:z.boolean().default(true)
});
const schema=z.object({
  title:z.string().min(2),
  version:z.string().min(1),
  sourceUrl:z.string().url().optional(),
  educationBand:z.enum(['ILKOKUL_1_2','ILKOKUL_3_4','ORTAOKUL_5_6','ORTAOKUL_7_8','LISE_9_10','LISE_11_12','YETISKIN_MEZUN','GENERAL']),
  questions:z.array(question).min(1).max(300)
});

async function POST__handler(req:Request){
  const user=await requireRole(['ADMIN']);
  const input=await readJson(req, schema);

  await db.preInterviewForm.updateMany({where:{active:true,educationBand:input.educationBand,version:{not:input.version}},data:{active:false}});
  const form=await db.preInterviewForm.upsert({
    where:{version:input.version},
    create:{title:input.title,version:input.version,sourceUrl:input.sourceUrl||null,educationBand:input.educationBand,active:true},
    update:{title:input.title,sourceUrl:input.sourceUrl||null,educationBand:input.educationBand,active:true}
  });

  await db.preInterviewQuestion.deleteMany({where:{formId:form.id}});
  await db.preInterviewQuestion.createMany({data:input.questions.map(q=>({
    formId:form.id,orderNo:q.orderNo,dimension:q.dimension,prompt:q.prompt,
    responseType:q.responseType,options:(q.options??undefined) as any,reverse:q.reverse,motivationKey:q.motivationKey||null,required:q.required
  }))});

  return NextResponse.json({ok:true,formId:form.id,count:input.questions.length,importedBy:user.id});
}

export const POST = withApiErrors(POST__handler);
