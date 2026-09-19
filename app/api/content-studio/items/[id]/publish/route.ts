import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const schema=z.object({visibleToStudent:z.boolean(),visibleToParent:z.boolean()});

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['ADMIN','COACH']);
  const {id}=await params;
  const item=await db.generatedContent.findUnique({where:{id},include:{student:true}});
  if(!item) return NextResponse.json({error:'İçerik bulunamadı.'},{status:404});
  if(user.role==='COACH'&&(!user.coachProfile||item.student?.coachId!==user.coachProfile.id)) return NextResponse.json({error:'Yetkisiz.'},{status:403});
  const input=schema.parse(await req.json());
  const row=await db.generatedContent.update({where:{id},data:{visibleToStudent:input.visibleToStudent,visibleToParent:input.visibleToParent,status:(input.visibleToStudent||input.visibleToParent)?'PUBLISHED':'DRAFT'}});
  return NextResponse.json({ok:true,row:{id:row.id,status:row.status,visibleToStudent:row.visibleToStudent,visibleToParent:row.visibleToParent}});
}
