import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { readJson, withApiErrors } from '@/lib/apiGuard';
import { verifySecret } from '@/lib/security';
import { writeAudit } from '@/lib/audit';

const schema=z.object({
  code:z.string().trim().min(6).max(64)
});

async function POST__handler(req:Request){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili bulunamadı.'},{status:403});
  const input=await readJson(req,schema);
  const normalized=input.code.toUpperCase();
  const hint=normalized.slice(-4);
  const now=new Date();

  const candidates=await db.coachAccessCode.findMany({
    where:{active:true,codeHint:hint,expiresAt:{gt:now}},
    orderBy:{createdAt:'desc'},
    take:20,
    include:{student:{select:{id:true,fullName:true,studentCode:true,gradeLevel:true,coachId:true}}}
  });

  let matched:(typeof candidates)[number]|null=null;
  for(const candidate of candidates){
    if(await verifySecret(normalized,candidate.codeHash)){matched=candidate;break;}
  }
  if(!matched)return NextResponse.json({error:'Erişim kodu geçersiz, süresi dolmuş veya daha önce kullanılmış.'},{status:400});

  const student=matched.student;
  if(student.coachId&&student.coachId!==user.coachProfile.id){
    return NextResponse.json({error:'Bu öğrenci başka bir koça bağlı. Koç değişikliği için yönetici onayı gerekir.'},{status:409});
  }

  await db.$transaction(async tx=>{
    if(!student.coachId){
      await tx.student.update({where:{id:student.id},data:{coachId:user.coachProfile!.id}});
    }
    await tx.coachAccessCode.update({
      where:{id:matched!.id},
      data:{active:false,usedAt:now,claimedByCoachId:user.coachProfile!.id}
    });
  });

  await writeAudit({
    actorUserId:user.id,
    action:'COACH_ACCESS_CODE_CLAIMED',
    entityType:'CoachAccessCode',
    entityId:matched.id,
    summary:student.fullName+' öğrencisinin test erişim kodu koç tarafından doğrulandı.',
    metadata:{studentId:student.id,studentCode:student.studentCode,codeHint:matched.codeHint}
  });

  return NextResponse.json({
    ok:true,
    student:{id:student.id,fullName:student.fullName,studentCode:student.studentCode,gradeLevel:student.gradeLevel},
    message:student.fullName+' öğrencisi koç panelinize tanımlandı.'
  });
}

export const POST=withApiErrors(POST__handler);
