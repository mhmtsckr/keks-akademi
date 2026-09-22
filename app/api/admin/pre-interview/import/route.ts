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

function openEndedSuffix(band:string){
  if(band==='ILKOKUL_1_2')return 'Bu durum sende nasıl oluyor? Kısaca kendi sözlerinle anlat ve mümkünse bir örnek ver.';
  if(band==='ILKOKUL_3_4')return 'Bu durumu kendi sözlerinle anlat. Ne zaman kolay, ne zaman zor olduğunu bir örnekle açıkla.';
  if(band==='ORTAOKUL_5_6')return 'Bu ifadeyi kendi durumuna göre açıkla. Ne zaman böyle oluyor, ne zaman olmuyor? Yakın zamandan bir örnek ver.';
  if(band==='ORTAOKUL_7_8')return 'Bu durumu kendi çalışma düzenine göre açıkla; nedenlerini ve yakın zamandan bir örneği yaz.';
  if(band==='LISE_9_10')return 'Bu durumu kendi çalışma düzenin açısından değerlendir; nedenlerini, seni kolaylaştıran/zorlaştıran etkenleri ve bir örneği yaz.';
  if(band==='LISE_11_12')return 'Bu durumu mevcut sınav hazırlığın açısından değerlendir; ne zaman işe yaradığını, ne zaman zorlandığını ve geliştirmek istediğin noktayı açıkla.';
  if(band==='YETISKIN_MEZUN')return 'Bu durumu mevcut sınav/öğrenme düzenin açısından değerlendir; nedenlerini, etkisini ve değiştirmek istediğin noktayı açıkla.';
  return 'Bu durumu kendi çalışma düzenin açısından açıkla ve mümkünse somut bir örnek ver.';
}

function toOpenEndedPrompt(q:z.infer<typeof question>,band:string){
  const prompt=q.prompt.trim();
  if(q.responseType==='TEXT')return prompt;
  if(q.responseType==='CHOICE')return prompt+' Seçenek işaretlemek yerine kendi düşünceni ve gerekçeni açıkça yaz.';
  return '“'+prompt+'” '+openEndedSuffix(band);
}

async function POST__handler(req:Request){
  const user=await requireRole(['ADMIN']);
  const input=await readJson(req, schema);
  const targetVersion=input.version.startsWith('PREINT_V1_')
    ?input.version.replace('PREINT_V1_','PREINT_OPEN_V2_')
    :input.version;
  const targetTitle=input.version.startsWith('PREINT_V1_')
    ?input.title.replace('v1.0','Açık Uçlu v2.0')
    :input.title;

  await db.preInterviewForm.updateMany({where:{active:true,educationBand:input.educationBand,version:{not:targetVersion}},data:{active:false}});
  const form=await db.preInterviewForm.upsert({
    where:{version:targetVersion},
    create:{title:targetTitle,version:targetVersion,sourceUrl:input.sourceUrl||null,educationBand:input.educationBand,active:true},
    update:{title:targetTitle,sourceUrl:input.sourceUrl||null,educationBand:input.educationBand,active:true}
  });

  await db.preInterviewQuestion.deleteMany({where:{formId:form.id}});
  await db.preInterviewQuestion.createMany({data:input.questions.map(q=>({
    formId:form.id,
    orderNo:q.orderNo,
    dimension:q.dimension,
    prompt:toOpenEndedPrompt(q,input.educationBand),
    responseType:'TEXT',
    options:undefined,
    reverse:false,
    motivationKey:q.motivationKey||null,
    required:q.required
  }))});

  return NextResponse.json({
    ok:true,
    formId:form.id,
    version:targetVersion,
    count:input.questions.length,
    mode:'OPEN_ENDED',
    importedBy:user.id
  });
}

export const POST = withApiErrors(POST__handler);
