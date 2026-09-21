import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const schema=z.object({visibleToStudent:z.boolean(),visibleToParent:z.boolean()});

async function PATCH__handler(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['ADMIN','COACH']);
  const {id}=await params;
  const item=await db.generatedContent.findUnique({where:{id},include:{student:true}});
  if(!item) return NextResponse.json({error:'İçerik bulunamadı.'},{status:404});
  if(user.role==='COACH'&&(!user.coachProfile||item.student?.coachId!==user.coachProfile.id)) return NextResponse.json({error:'Yetkisiz.'},{status:403});
  const input=await readJson(req, schema);
  const publishing=input.visibleToStudent||input.visibleToParent;
  const row=await db.generatedContent.update({where:{id},data:{
    visibleToStudent:input.visibleToStudent,
    visibleToParent:input.visibleToParent,
    status:publishing?'PUBLISHED':'DRAFT',
    approvedAt:publishing?new Date():null,
    approvedByUserId:publishing?user.id:null
  }});
  return NextResponse.json({ok:true,row:{id:row.id,status:row.status,visibleToStudent:row.visibleToStudent,visibleToParent:row.visibleToParent}});
}

export const PATCH = withApiErrors(PATCH__handler);
