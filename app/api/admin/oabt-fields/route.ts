import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';
import { isAgsOabtLabel } from '@/lib/agsExamOptions';
import { getOabtFieldApproval,isValidOabtField,withOabtFieldApproval } from '@/lib/oabtFieldApproval';
import { readJson,withApiErrors } from '@/lib/apiGuard';

const schema=z.object({
  studentId:z.string().min(1),
  action:z.enum(['APPROVE','REJECT']),
  note:z.string().max(500).optional()
});

async function GET__handler(){
  await requireRole(['ADMIN']);
  const students=await db.student.findMany({
    select:{
      id:true,fullName:true,studentCode:true,gradeLevel:true,academicTrack:true,profile:true,
      coach:{select:{user:{select:{name:true,email:true}}}}
    },
    orderBy:{updatedAt:'desc'}
  });
  const rows=students.filter(s=>isAgsOabtLabel(s.gradeLevel)).map(s=>{
    const approval=getOabtFieldApproval(s.profile);
    return {
      id:s.id,
      fullName:s.fullName,
      studentCode:s.studentCode,
      gradeLevel:s.gradeLevel,
      academicTrack:s.academicTrack,
      coachName:s.coach?.user?.name||null,
      coachEmail:s.coach?.user?.email||null,
      ...approval
    };
  }).filter(x=>x.status!=='NONE'||!x.academicTrack);
  return NextResponse.json({
    ok:true,
    items:rows,
    pending:rows.filter(x=>x.status==='PENDING').length
  });
}

async function POST__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req,schema);
  const student=await db.student.findUnique({
    where:{id:input.studentId},
    select:{id:true,fullName:true,studentCode:true,gradeLevel:true,academicTrack:true,profile:true,coachId:true}
  });
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  if(!isAgsOabtLabel(student.gradeLevel))return NextResponse.json({error:'Öğrenci AGS/ÖABT grubunda değil.'},{status:400});

  const approval=getOabtFieldApproval(student.profile);
  if(approval.status==='APPROVED'){
    return NextResponse.json({error:'Bu öğrencinin ÖABT alanı daha önce onaylanmış ve kilitlenmiş.'},{status:409});
  }
  if(approval.status!=='PENDING'||!approval.requestedField||!isValidOabtField(approval.requestedField)){
    return NextResponse.json({error:'Onay bekleyen geçerli bir ÖABT alan talebi bulunmuyor.'},{status:409});
  }

  const now=new Date().toISOString();
  if(input.action==='APPROVE'){
    await db.$transaction(async tx=>{
      await tx.student.update({
        where:{id:student.id},
        data:{
          academicTrack:approval.requestedField,
          profile:withOabtFieldApproval(student.profile,{
            status:'APPROVED',
            approvedField:approval.requestedField,
            approvedAt:now,
            approvedByUserId:admin.id,
            rejectedAt:null,
            rejectedByUserId:null,
            rejectionNote:null
          }) as any
        }
      });
      if(student.coachId){
        await tx.coachAlert.create({data:{
          studentId:student.id,
          kind:'OABT_FIELD_APPROVED',
          severity:'MEDIUM',
          title:'ÖABT alanı yönetici tarafından onaylandı',
          message:student.fullName+' öğrencisinin ÖABT alanı '+approval.requestedField+' olarak onaylandı ve kilitlendi.'
        }});
      }
    });
    await writeAudit({
      actorUserId:admin.id,
      action:'OABT_FIELD_APPROVED',
      entityType:'Student',
      entityId:student.id,
      summary:student.fullName+' öğrencisinin ÖABT alanı onaylandı ve kilitlendi: '+approval.requestedField,
      metadata:{studentId:student.id,field:approval.requestedField}
    });
    return NextResponse.json({ok:true,status:'APPROVED',field:approval.requestedField});
  }

  await db.student.update({
    where:{id:student.id},
    data:{
      academicTrack:null,
      profile:withOabtFieldApproval(student.profile,{
        status:'REJECTED',
        approvedField:null,
        approvedAt:null,
        approvedByUserId:null,
        rejectedAt:now,
        rejectedByUserId:admin.id,
        rejectionNote:input.note?.trim()||'Yönetici alan seçiminin yeniden yapılmasını istedi.'
      }) as any
    }
  });
  await writeAudit({
    actorUserId:admin.id,
    action:'OABT_FIELD_REJECTED',
    entityType:'Student',
    entityId:student.id,
    summary:student.fullName+' öğrencisinin ÖABT alan seçimi yeniden seçim için reddedildi.',
    metadata:{studentId:student.id,field:approval.requestedField,note:input.note||null}
  });
  return NextResponse.json({ok:true,status:'REJECTED'});
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
