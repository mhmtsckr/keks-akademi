import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const schema=z.object({
  state:z.record(z.string(),z.any()).default({}),
  score:z.number().min(0).max(100).optional(),
  completed:z.boolean().default(false)
});

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['STUDENT']);
  if(!user.student) return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const {id}=await params;
  const item=await db.generatedContent.findFirst({where:{id,studentId:user.student.id,visibleToStudent:true}});
  if(!item) return NextResponse.json({error:'İçerik bulunamadı.'},{status:404});
  const progress=await db.contentProgress.findUnique({where:{contentId_studentId:{contentId:id,studentId:user.student.id}}});
  return NextResponse.json({ok:true,progress});
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['STUDENT']);
  if(!user.student) return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const {id}=await params;
  const item=await db.generatedContent.findFirst({where:{id,studentId:user.student.id,visibleToStudent:true}});
  if(!item) return NextResponse.json({error:'İçerik bulunamadı.'},{status:404});
  const input=schema.parse(await req.json());
  const row=await db.contentProgress.upsert({
    where:{contentId_studentId:{contentId:id,studentId:user.student.id}},
    create:{contentId:id,studentId:user.student.id,state:input.state,score:input.score,completed:input.completed,completedAt:input.completed?new Date():null,lastOpenedAt:new Date()},
    update:{state:input.state,score:input.score,completed:input.completed,completedAt:input.completed?new Date():null,lastOpenedAt:new Date()}
  });
  return NextResponse.json({ok:true,row:{id:row.id,score:row.score,completed:row.completed,state:row.state}});
}
