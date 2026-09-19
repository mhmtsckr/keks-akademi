import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { buildWeeklyPlan } from '@/lib/smartCoach';

export async function POST(){
  const user=await requireRole(['STUDENT']);
  if(!user.student) return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const plan=await buildWeeklyPlan(user.student.id);
  const title='Akıllı Haftalık Program · '+new Date().toLocaleDateString('tr-TR');
  const row=await db.studyPlan.create({data:{studentId:user.student.id,title,payload:plan,active:true}});
  return NextResponse.json({ok:true,row,plan});
}
export async function GET(){
  const user=await requireRole(['STUDENT']);
  if(!user.student) return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const plan=await buildWeeklyPlan(user.student.id);
  return NextResponse.json({ok:true,plan});
}
