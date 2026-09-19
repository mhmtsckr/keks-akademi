import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const pref=z.object({action:z.literal('preference'),techniqueKey:z.string().min(2),config:z.record(z.string(),z.any())});
const session=z.object({action:z.literal('session'),techniqueKey:z.string().min(2),title:z.string().min(2),config:z.record(z.string(),z.any()).default({}),result:z.record(z.string(),z.any()).default({}),durationMinutes:z.number().int().min(0).max(1440),completed:z.boolean().default(true)});
const schema=z.discriminatedUnion('action',[pref,session]);

export async function POST(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student) return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=schema.parse(await req.json());
  if(input.action==='preference'){
    const row=await db.techniquePreference.upsert({
      where:{studentId_techniqueKey:{studentId:user.student.id,techniqueKey:input.techniqueKey}},
      create:{studentId:user.student.id,techniqueKey:input.techniqueKey,config:input.config},
      update:{config:input.config}
    });
    return NextResponse.json({ok:true,row});
  }
  const row=await db.techniquePracticeSession.create({data:{
    studentId:user.student.id,techniqueKey:input.techniqueKey,title:input.title,config:input.config,result:input.result,
    durationMinutes:input.durationMinutes,completed:input.completed,completedAt:input.completed?new Date():null
  }});
  return NextResponse.json({ok:true,row});
}

export async function GET(){
  const user=await requireRole(['STUDENT']);
  if(!user.student) return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const [preferences,sessions]=await Promise.all([
    db.techniquePreference.findMany({where:{studentId:user.student.id}}),
    db.techniquePracticeSession.findMany({where:{studentId:user.student.id},orderBy:{createdAt:'desc'},take:20})
  ]);
  return NextResponse.json({ok:true,preferences,sessions});
}
