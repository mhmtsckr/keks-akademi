import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';
import { isAgsOabtLabel,isAgsOabtStudentRecord } from '@/lib/agsExamOptions';
import { getEffectiveOabtField,isValidOabtField,withAutomaticOabtField } from '@/lib/oabtFieldApproval';
import { readJson,withApiErrors } from '@/lib/apiGuard';

const schema=z.object({field:z.string().min(2).max(120)});

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});

  const student=await db.student.findUnique({
    where:{id:user.student.id},
    select:{id:true,fullName:true,studentCode:true,gradeLevel:true,academicTrack:true,profile:true}
  });
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});

  const applicable=isAgsOabtStudentRecord({
    gradeLevel:student.gradeLevel,
    academicTrack:student.academicTrack,
    profile:student.profile
  });
  if(!applicable)return NextResponse.json({ok:true,applicable:false,status:'NONE',field:null,locked:false});

  const field=getEffectiveOabtField(student.academicTrack,student.profile);
  let repaired=false;
  if(field){
    const normalizedGrade=isAgsOabtLabel(student.gradeLevel)?student.gradeLevel:'AGS/ÖABT';
    const nextProfile=withAutomaticOabtField(student.profile,field);
    const currentProfile=JSON.stringify(student.profile||{});
    const nextProfileText=JSON.stringify(nextProfile);
    if(student.academicTrack!==field||student.gradeLevel!==normalizedGrade||currentProfile!==nextProfileText){
      await db.student.update({
        where:{id:student.id},
        data:{gradeLevel:normalizedGrade,academicTrack:field,profile:nextProfile as any}
      });
      repaired=true;
      await writeAudit({
        actorUserId:user.id,
        action:'OABT_FIELD_AUTO_CONFIRMED',
        entityType:'Student',
        entityId:student.id,
        summary:student.fullName+' öğrencisinin AGS/ÖABT alanı otomatik olarak kesinleştirildi: '+field,
        metadata:{studentCode:student.studentCode,field,legacyRepair:true}
      });
    }
  }

  return NextResponse.json({
    ok:true,
    applicable:true,
    status:field?'APPROVED':'NONE',
    field,
    approvedField:field,
    locked:Boolean(field),
    repaired
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
  if(!isAgsOabtStudentRecord({gradeLevel:student.gradeLevel,academicTrack:student.academicTrack,profile:student.profile})){
    return NextResponse.json({error:'Bu alan yalnız AGS/ÖABT öğrencileri içindir.'},{status:403});
  }

  const existingField=getEffectiveOabtField(student.academicTrack,student.profile);
  if(existingField){
    return NextResponse.json({error:'AGS/ÖABT alanınız '+existingField+' olarak kaydedilmiş ve kilitlenmiştir.'},{status:409});
  }

  const now=new Date().toISOString();
  await db.student.update({
    where:{id:student.id},
    data:{
      gradeLevel:'AGS/ÖABT',
      academicTrack:input.field,
      profile:withAutomaticOabtField(student.profile,input.field,now) as any
    }
  });

  await writeAudit({
    actorUserId:user.id,
    action:'OABT_FIELD_AUTO_ASSIGNED',
    entityType:'Student',
    entityId:student.id,
    summary:student.fullName+' AGS/ÖABT alanını kaydetti: '+input.field,
    metadata:{studentId:student.id,studentCode:student.studentCode,field:input.field,automatic:true}
  });

  return NextResponse.json({
    ok:true,
    status:'APPROVED',
    field:input.field,
    approvedField:input.field,
    locked:true,
    message:'AGS/ÖABT alanınız '+input.field+' olarak kaydedildi ve kilitlendi.'
  });
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
