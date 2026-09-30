import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const schema=z.object({approved:z.boolean(),note:z.string().trim().max(500).optional()});

async function PATCH__handler(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['ADMIN','COACH']);
  const {id}=await params;
  const row=await db.contentUpload.findUnique({where:{id},include:{student:true}});
  if(!row)return NextResponse.json({error:'Kaynak bulunamadı.'},{status:404});
  if(user.role==='COACH'&&(!user.coachProfile||row.student?.coachId!==user.coachProfile.id)){
    return NextResponse.json({error:'Bu kaynağı onaylama yetkiniz yok.'},{status:403});
  }
  const input=await readJson(req,schema);
  const status=input.approved?'APPROVED':'REJECTED';
  const updated=await db.contentUpload.update({where:{id},data:{status}});
  await db.auditLog.create({data:{
    actorUserId:user.id,
    action:input.approved?'CONTENT_SOURCE_APPROVED':'CONTENT_SOURCE_REJECTED',
    entityType:'ContentUpload',
    entityId:id,
    summary:(input.approved?'İçerik kaynağı onaylandı.':'İçerik kaynağı reddedildi.')+(input.note?' '+input.note:''),
    metadata:{fileName:row.fileName,studentId:row.studentId,status}
  }});
  return NextResponse.json({ok:true,upload:{id:updated.id,status:updated.status}});
}

export const PATCH=withApiErrors(PATCH__handler);
