import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';
import { isAgsOabtLabel } from '@/lib/agsExamOptions';
import { getOabtFieldApproval,isValidOabtField,withOabtFieldApproval } from '@/lib/oabtFieldApproval';
import { readJson,withApiErrors } from '@/lib/apiGuard';

const schema=z.object({field:z.string().min(2).max(120)});

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const student=await db.student.findUnique({
    where:{id:user.student.id},
    select:{id:true,gradeLevel:true,academicTrack:true,profile:true}
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
    locked:approval.status==='APPROVED'
  });
}

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=await readJson(req,schema);
  if(!isValidOabtField(input.field))return NextResponse.json({error:'Geçerli bir ÖABT alanı seçiniz.'},{status:400});

  const student=await db.student.findUnique({
    where:{id:user.student.id},
    select:{id:true,fullName:true,studentCode:true,gradeLevel:true,academicTrack:true,profile:true}
  });
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  if(!isAgsOabtLabel(student.gradeLevel))return NextResponse.json({error:'Bu alan yalnız AGS/ÖABT öğrencileri içindir.'},{status:403});

  const approval=getOabtFieldApproval(student.profile);
  if(approval.status==='APPROVED'){
    return NextResponse.json({error:'ÖABT alanınız yönetici tarafından onaylandı ve kilitlendi. Değiştirilemez.'},{status:409});
  }
  if(approval.status==='PENDING'){
    return NextResponse.json({error:'ÖABT alan seçiminiz zaten yönetici onayı bekliyor.'},{status:409});
  }

  const now=new Date().toISOString();
  await db.student.update({
    where:{id:student.id},
    data:{
      academicTrack:null,
      profile:withOabtFieldApproval(student.profile,{
        status:'PENDING',
        requestedField:input.field,
        requestedAt:now,
        approvedField:null,
        approvedAt:null,
        approvedByUserId:null,
        rejectedAt:null,
        rejectedByUserId:null,
        rejectionNote:null
      }) as any
    }
  });

  await writeAudit({
    actorUserId:user.id,
    action:'OABT_FIELD_SUBMITTED',
    entityType:'Student',
    entityId:student.id,
    summary:student.fullName+' ÖABT alan seçimini yönetici onayına gönderdi: '+input.field,
    metadata:{studentId:student.id,studentCode:student.studentCode,field:input.field}
  });

  return NextResponse.json({
    ok:true,
    status:'PENDING',
    requestedField:input.field,
    message:'ÖABT alan seçiminiz yönetici onayına gönderildi. Onaylanana kadar değiştirilemez.'
  });
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
