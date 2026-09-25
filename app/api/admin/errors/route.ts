import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';

async function GET__handler(req:Request){
  await requireRole(['ADMIN']);
  const {searchParams}=new URL(req.url);
  const scope=searchParams.get('scope')||'open';
  const where:any={};
  if(scope==='open')where.resolvedAt=null;
  const [events,openCount,total]=await Promise.all([
    db.errorEvent.findMany({where,orderBy:{createdAt:'desc'},take:200}),
    db.errorEvent.count({where:{resolvedAt:null}}),
    db.errorEvent.count()
  ]);
  return NextResponse.json({ok:true,events,openCount,total});
}

const patch=z.object({id:z.string(),resolved:z.boolean()});

async function PATCH__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const {id,resolved}=await readJson(req, patch);
  const row=await db.errorEvent.update({where:{id},data:{resolvedAt:resolved?new Date():null}});
  await writeAudit({
    actorUserId:admin.id,
    action:'ERROR_EVENT_REVIEW',
    entityType:'ErrorEvent',
    entityId:row.id,
    summary:'Hata kaydı '+(resolved?'çözüldü olarak işaretlendi':'yeniden açıldı')+'.',
    metadata:{requestId:row.requestId,path:row.path,errorClass:row.errorClass}
  });
  return NextResponse.json({ok:true,row});
}

export const GET = withApiErrors(GET__handler);
export const PATCH = withApiErrors(PATCH__handler);
