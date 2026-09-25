import { withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { buildWeeklyPlan } from '@/lib/smartCoach';
import { isFeatureEnabled } from '@/lib/systemConfig';

async function POST__handler(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile) return NextResponse.json({error:'Koç profili yok.'},{status:400});
  const {id}=await params;
  const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id},select:{id:true,studentCode:true}});
  if(!student) return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  if(!(await isFeatureEnabled('SMART_COACH',student.studentCode))){
    return NextResponse.json({error:'Akıllı Koç bu öğrenci için feature flag ile kapalı.'},{status:403});
  }
  const plan=await buildWeeklyPlan(id);
  const row=await db.studyPlan.create({data:{studentId:id,title:'Akıllı Haftalık Program · '+new Date().toLocaleDateString('tr-TR'),payload:plan,active:true}});
  return NextResponse.json({ok:true,row,plan});
}

export const POST = withApiErrors(POST__handler);
