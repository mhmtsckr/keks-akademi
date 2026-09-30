import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const schema=z.object({approved:z.boolean()});

async function PATCH__handler(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['ADMIN','COACH']);
  const {id}=await params;
  const upload=await db.contentUpload.findUnique({where:{id},include:{student:true}});
  if(!upload)return NextResponse.json({error:'Kaynak bulunamadı.'},{status:404});
  if(user.role==='COACH'&&(!user.coachProfile||upload.student?.coachId!==user.coachProfile.id)){
    return NextResponse.json({error:'Bu kaynağı onaylama yetkiniz yok.'},{status:403});
  }
  if(!upload.extractedText)return NextResponse.json({error:'Metni çıkarılamayan kaynak onaylanamaz.'},{status:422});

  const input=await readJson(req,schema);
  const status=input.approved?'APPROVED':'REJECTED';
  const row=await db.contentUpload.update({where:{id},data:{status}});
  await db.auditLog.create({data:{
    actorUserId:user.id,
    action:input.approved?'CONTENT_SOURCE_APPROVED':'CONTENT_SOURCE_REJECTED',
    entityType:'ContentUpload',
    entityId:id,
    summary:input.approved?'İçerik motoru kaynağı onaylandı.':'İçerik motoru kaynağı reddedildi.',
    metadata:{fileName:upload.fileName,studentId:upload.studentId}
  }});
  return NextResponse.json({ok:true,upload:{id:row.id,status:row.status,fileName:row.fileName}});
}

export const PATCH=withApiErrors(PATCH__handler);
