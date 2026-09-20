import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

const createSchema=z.object({
  title:z.string().min(2).max(180),
  description:z.string().max(2000).optional(),
  studentId:z.string().optional(),
  priority:z.enum(['LOW','MEDIUM','HIGH']).default('MEDIUM'),
  dueAt:z.string().optional()
});
const patchSchema=z.object({
  id:z.string(),
  status:z.enum(['OPEN','COMPLETED','CANCELED']).optional(),
  priority:z.enum(['LOW','MEDIUM','HIGH']).optional(),
  dueAt:z.string().nullable().optional()
});

export async function GET(){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const tasks=await db.coachTask.findMany({
    where:{coachId:user.coachProfile.id,status:{in:['OPEN','COMPLETED']}},
    include:{student:{select:{id:true,fullName:true}}},
    orderBy:[{status:'asc'},{dueAt:'asc'},{createdAt:'desc'}],
    take:100
  });
  return NextResponse.json({ok:true,tasks});
}

export async function POST(req:Request){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const input=createSchema.parse(await req.json());
  if(input.studentId){
    const student=await db.student.findFirst({where:{id:input.studentId,coachId:user.coachProfile.id},select:{id:true}});
    if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  }
  const task=await db.coachTask.create({data:{
    coachId:user.coachProfile.id,
    studentId:input.studentId||null,
    title:input.title,
    description:input.description||null,
    priority:input.priority,
    dueAt:input.dueAt?new Date(input.dueAt):null
  }});
  return NextResponse.json({ok:true,task});
}

export async function PATCH(req:Request){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const input=patchSchema.parse(await req.json());
  const task=await db.coachTask.findFirst({where:{id:input.id,coachId:user.coachProfile.id}});
  if(!task)return NextResponse.json({error:'Görev bulunamadı.'},{status:404});
  const status=input.status??task.status;
  const updated=await db.coachTask.update({where:{id:task.id},data:{
    status,
    priority:input.priority,
    dueAt:input.dueAt===undefined?undefined:(input.dueAt?new Date(input.dueAt):null),
    completedAt:status==='COMPLETED'?(task.completedAt||new Date()):(status==='OPEN'?null:task.completedAt)
  }});
  return NextResponse.json({ok:true,task:updated});
}
