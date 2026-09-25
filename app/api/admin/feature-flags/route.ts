import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { FEATURE_FLAG_DEFINITIONS,listFeatureFlags,saveFeatureFlag } from '@/lib/systemConfig';

const schema=z.object({
  key:z.enum(['SMART_COACH','ADAPTIVE_RECOMMENDATION','GAMIFICATION']),
  mode:z.enum(['ALL','OFF','PILOT']),
  studentCodes:z.array(z.string().trim().min(1).max(32)).max(250).default([])
});

async function GET__handler(){
  await requireRole(['ADMIN']);
  return NextResponse.json({ok:true,flags:await listFeatureFlags()});
}

async function PATCH__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req,schema);
  const codes=[...new Set(input.studentCodes.map(x=>x.trim()).filter(Boolean))];
  if(input.mode==='PILOT'){
    if(!codes.length)return NextResponse.json({error:'Pilot modunda en az bir öğrenci kodu girilmelidir.'},{status:400});
    const found=await db.student.findMany({where:{studentCode:{in:codes}},select:{studentCode:true}});
    const known=new Set(found.map(x=>x.studentCode));
    const unknown=codes.filter(x=>!known.has(x));
    if(unknown.length)return NextResponse.json({error:'Bulunamayan öğrenci kodları: '+unknown.join(', ')},{status:400});
  }
  const flag=await saveFeatureFlag(admin.id,{key:input.key,mode:input.mode,studentCodes:input.mode==='PILOT'?codes:[]});
  return NextResponse.json({ok:true,flag,definition:FEATURE_FLAG_DEFINITIONS[input.key],message:'Özellik bayrağı güncellendi. Değişiklik yeni isteklerde anında uygulanır.'});
}

export const GET=withApiErrors(GET__handler);
export const PATCH=withApiErrors(PATCH__handler);
