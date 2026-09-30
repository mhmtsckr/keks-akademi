import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const schema=z.object({visibleToStudent:z.boolean(),visibleToParent:z.boolean()});
const MIN_QUALITY=75;

async function PATCH__handler(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['ADMIN','COACH']);
  const {id}=await params;
  const item=await db.generatedContent.findUnique({where:{id},include:{student:true,upload:true}});
  if(!item) return NextResponse.json({error:'İçerik bulunamadı.'},{status:404});
  if(user.role==='COACH'&&(!user.coachProfile||item.student?.coachId!==user.coachProfile.id)) return NextResponse.json({error:'Yetkisiz.'},{status:403});

  const input=await readJson(req, schema);
  const publishing=input.visibleToStudent||input.visibleToParent;

  if(publishing){
    if(item.upload.status!=='APPROVED') return NextResponse.json({error:'Kaynak onaylı değil. Önce kaynağı koç/yönetici onayından geçirin.'},{status:409});
    if((item.qualityScore??0)<MIN_QUALITY||item.status==='QUALITY_FAILED'){
      return NextResponse.json({error:'İçerik kalite filtresini geçmedi. Yayın için kalite puanı en az '+MIN_QUALITY+' olmalı.'},{status:409});
    }
  }

  const row=await db.generatedContent.update({where:{id},data:{
    visibleToStudent:publishing?input.visibleToStudent:false,
    visibleToParent:publishing?input.visibleToParent:false,
    status:publishing?'PUBLISHED':'DRAFT',
    approvedAt:publishing?new Date():null,
    approvedByUserId:publishing?user.id:null
  }});

  await db.auditLog.create({data:{
    actorUserId:user.id,
    action:publishing?'GENERATED_CONTENT_PUBLISHED':'GENERATED_CONTENT_UNPUBLISHED',
    entityType:'GeneratedContent',
    entityId:id,
    summary:publishing?'Kalite filtresini geçen içerik insan onayıyla yayınlandı.':'İçerik taslağa alındı.',
    metadata:{qualityScore:item.qualityScore,sourceStatus:item.upload.status,visibleToStudent:row.visibleToStudent,visibleToParent:row.visibleToParent}
  }});

  return NextResponse.json({ok:true,row:{id:row.id,status:row.status,visibleToStudent:row.visibleToStudent,visibleToParent:row.visibleToParent}});
}

export const PATCH = withApiErrors(PATCH__handler);
