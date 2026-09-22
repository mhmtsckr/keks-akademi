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
  educationBand:z.enum(['ILKOKUL_1_2','ILKOKUL_3_4','ORTAOKUL_5_6','ORTAOKUL_7_8','LISE_9_10','LISE_11_12','YETISKIN_MEZUN','YETISKIN_SINAV','GENERAL']),
  questions:z.array(question).min(1).max(300)
});

async function POST__handler(req:Request){
  const user=await requireRole(['ADMIN']);
  const input=await readJson(req, schema);
  const normalizedBand=input.educationBand==='YETISKIN_MEZUN'?'LISE_11_12':input.educationBand;
  const targetVersion=input.version.startsWith('PREINT_V1_')
    ?input.version.replace('PREINT_V1_','PREINT_OPEN_V2_')
    :input.version;
  const titleByBand:Record<string,string>={
    ILKOKUL_1_2:'İlkokul 1–2',
    ILKOKUL_3_4:'İlkokul 3–4',
    ORTAOKUL_5_6:'Ortaokul 5–6',
    ORTAOKUL_7_8:'Ortaokul 7–8 / LGS',
    LISE_9_10:'Lise 9–10',
    LISE_11_12:'Lise 11–12 / YKS / Lise Mezunu',
    YETISKIN_MEZUN:'Lise 11–12 / YKS / Lise Mezunu',
    YETISKIN_SINAV:'Yetişkin Sınav Grubu',
    GENERAL:'Genel'
  };
  const targetTitle=titleByBand[normalizedBand]||input.title;

  await db.preInterviewForm.updateMany({where:{active:true,educationBand:normalizedBand,version:{not:targetVersion}},data:{active:false}});
  const form=await db.preInterviewForm.upsert({
    where:{version:targetVersion},
    create:{title:targetTitle,version:targetVersion,sourceUrl:input.sourceUrl||null,educationBand:normalizedBand,active:true},
    update:{title:targetTitle,sourceUrl:input.sourceUrl||null,educationBand:normalizedBand,active:true}
  });

  await db.preInterviewQuestion.deleteMany({where:{formId:form.id}});
  await db.preInterviewQuestion.createMany({data:input.questions.map(q=>({
    formId:form.id,
    orderNo:q.orderNo,
    dimension:q.dimension,
    prompt:q.prompt.trim(),
    responseType:q.responseType,
    options:(q.options??undefined) as any,
    reverse:q.reverse,
    motivationKey:q.motivationKey||null,
    required:q.required
  }))});

  return NextResponse.json({
    ok:true,
    formId:form.id,
    version:targetVersion,
    count:input.questions.length,
    mode:'MIXED',
    importedBy:user.id
  });
}

export const POST = withApiErrors(POST__handler);
