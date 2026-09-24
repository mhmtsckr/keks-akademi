import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { isAgsOabtLabel } from '@/lib/agsExamOptions';
import { getOabtFieldApproval } from '@/lib/oabtFieldApproval';
import { withApiErrors } from '@/lib/apiGuard';

async function GET__handler(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili bulunamadı.'},{status:400});
  const {id}=await params;
  const student=await db.student.findFirst({
    where:{id,coachId:user.coachProfile.id},
    select:{id:true,fullName:true,studentCode:true,gradeLevel:true,academicTrack:true,profile:true,updatedAt:true}
  });
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  const applicable=isAgsOabtLabel(student.gradeLevel);
  const approval=getOabtFieldApproval(student.profile);
  return NextResponse.json({
    ok:true,
    applicable,
    status:approval.status,
    requestedField:approval.requestedField,
    approvedField:approval.status==='APPROVED'?(approval.approvedField||student.academicTrack):null,
    approvedAt:approval.approvedAt,
    rejectionNote:approval.rejectionNote,
    locked:approval.status==='APPROVED',
    updatedAt:student.updatedAt.toISOString()
  });
}
export const GET=withApiErrors(GET__handler);
