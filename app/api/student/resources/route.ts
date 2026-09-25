import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { addResourceProgress,createStudyResource,listResourceTracking } from '@/lib/resourceTracking';

const createSchema=z.object({
  action:z.literal('create'),
  title:z.string().trim().min(2).max(160),
  examType:z.string().trim().min(2).max(40),
  subject:z.string().trim().min(2).max(80),
  publisher:z.string().trim().max(120).optional().nullable(),
  totalPages:z.number().int().min(1).max(10000).optional().nullable()
});
const progressSchema=z.object({
  action:z.literal('progress'),
  resourceId:z.string().min(1),
  topic:z.string().trim().max(160).optional().nullable(),
  pageStart:z.number().int().min(1).max(10000).optional().nullable(),
  pageEnd:z.number().int().min(1).max(10000).optional().nullable(),
  questions:z.number().int().min(0).max(1000),
  correct:z.number().int().min(0).max(1000),
  wrong:z.number().int().min(0).max(1000),
  blank:z.number().int().min(0).max(1000)
}).superRefine((v,ctx)=>{
  if(v.correct+v.wrong+v.blank!==v.questions)ctx.addIssue({code:'custom',message:'Doğru + yanlış + boş, soru sayısına eşit olmalıdır.'});
  if(v.pageStart&&v.pageEnd&&v.pageEnd<v.pageStart)ctx.addIssue({code:'custom',message:'Bitiş sayfası başlangıç sayfasından küçük olamaz.'});
});
const schema=z.discriminatedUnion('action',[createSchema,progressSchema]);

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  return NextResponse.json({ok:true,resources:await listResourceTracking(user.student.id)});
}

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=await readJson(req,schema);
  if(input.action==='create'){
    const row=await createStudyResource(user.student.id,user.id,input);
    return NextResponse.json({ok:true,row,message:'Kaynak çalışma takibine eklendi.'});
  }
  try{
    const row=await addResourceProgress(user.student.id,input);
    return NextResponse.json({ok:true,id:row.id,message:'Kaynak ilerlemesi kaydedildi.'});
  }catch(error){
    if(error instanceof Error&&error.message==='RESOURCE_NOT_FOUND')return NextResponse.json({error:'Kaynak bulunamadı.'},{status:404});
    throw error;
  }
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
