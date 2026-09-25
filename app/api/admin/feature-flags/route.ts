import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';
import { FEATURE_FLAGS, featureFlagDef } from '@/lib/featureFlags';

async function resolveRollout(studentIds:string[]){
  if(studentIds.length===0)return [] as {id:string;code:string;name:string}[];
  const students=await db.student.findMany({
    where:{id:{in:studentIds}},
    select:{id:true,studentCode:true,fullName:true}
  });
  const byId=new Map(students.map(s=>[s.id,s]));
  return studentIds.map(id=>{
    const s=byId.get(id);
    return {id,code:s?.studentCode||'—',name:s?.fullName||'(silinmiş öğrenci)'};
  });
}

async function GET__handler(){
  await requireRole(['ADMIN']);
  const rows=await db.featureFlag.findMany();
  const byKey=new Map(rows.map(r=>[r.key,r]));
  const flags=await Promise.all(FEATURE_FLAGS.map(async def=>{
    const row=byKey.get(def.key);
    return {
      key:def.key,
      label:def.label,
      description:def.description,
      enabled:row?.enabled||false,
      updatedAt:row?.updatedAt||null,
      rollout:await resolveRollout(row?.rolloutStudentIds||[])
    };
  }));
  return NextResponse.json({ok:true,flags});
}

const patch=z.object({
  key:z.string(),
  enabled:z.boolean().optional(),
  rolloutStudentCodes:z.array(z.string().min(1).max(64)).max(500).optional()
});

async function PATCH__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req, patch);
  const def=featureFlagDef(input.key);
  if(!def)return NextResponse.json({error:'Bilinmeyen özellik bayrağı.'},{status:400});

  const data:{enabled?:boolean;rolloutStudentIds?:string[];updatedByUserId:string}={updatedByUserId:admin.id};
  let unknownCodes:string[]=[];

  if(typeof input.enabled==='boolean')data.enabled=input.enabled;

  if(input.rolloutStudentCodes){
    const codes=[...new Set(input.rolloutStudentCodes.map(c=>c.trim().toUpperCase()).filter(Boolean))];
    const students=codes.length?await db.student.findMany({where:{studentCode:{in:codes}},select:{id:true,studentCode:true}}):[];
    const foundCodes=new Set(students.map(s=>s.studentCode));
    unknownCodes=codes.filter(c=>!foundCodes.has(c));
    data.rolloutStudentIds=students.map(s=>s.id);
  }

  const existing=await db.featureFlag.findUnique({where:{key:input.key}});
  const row=await db.featureFlag.upsert({
    where:{key:input.key},
    create:{
      key:input.key,
      enabled:data.enabled||false,
      rolloutStudentIds:data.rolloutStudentIds||[],
      updatedByUserId:admin.id
    },
    update:data
  });

  await writeAudit({
    actorUserId:admin.id,
    action:'FEATURE_FLAG_UPDATE',
    entityType:'FeatureFlag',
    entityId:row.id,
    summary:'"'+def.label+'" özelliği '+(row.enabled?'açıldı':'kapatıldı')+' · pilot '+row.rolloutStudentIds.length+' öğrenci.',
    metadata:{
      key:row.key,
      beforeEnabled:existing?.enabled??false,
      afterEnabled:row.enabled,
      rolloutCount:row.rolloutStudentIds.length
    }
  });

  return NextResponse.json({
    ok:true,
    enabled:row.enabled,
    rollout:await resolveRollout(row.rolloutStudentIds),
    unknownCodes
  });
}

export const GET = withApiErrors(GET__handler);
export const PATCH = withApiErrors(PATCH__handler);
