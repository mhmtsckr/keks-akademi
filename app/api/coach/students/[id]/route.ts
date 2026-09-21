import { withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';

const schema=z.object({confirmationCode:z.string().min(1)});

async function DELETE__handler(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile) return NextResponse.json({error:'Koç profili bulunamadı.'},{status:403});

  const {id}=await params;
  let body:unknown;
  try{ body=await req.json(); }catch{
    return NextResponse.json({error:'Geçersiz silme isteği.'},{status:400});
  }
  const parsed=schema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:'Öğrenci kodu ile silme onayı gerekli.'},{status:400});
  const input=parsed.data;
  // Sorgu koça daraltılır: yabancı öğrenci diğer tüm route'lardaki gibi 404
  // alır, böylece 403 ile varlığı ele verilmez.
  const student=await db.student.findFirst({
    where:{id,coachId:user.coachProfile.id},
    include:{
      parentProfiles:{select:{userId:true}},
      user:{select:{id:true,role:true}}
    }
  });

  if(!student) return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  if(input.confirmationCode!==student.studentCode) return NextResponse.json({error:'Öğrenci kodu doğrulanamadı.'},{status:400});

  const linkedUserIds=[...new Set([
    ...(student.userId?[student.userId]:[]),
    ...student.parentProfiles.map(x=>x.userId)
  ])];

  await db.$transaction(async tx=>{
    await tx.academyCode.updateMany({
      where:{assignedStudentId:student.id},
      data:{assignedStudentId:null,active:false}
    });

    // Student ilişkilerinin çoğu onDelete: Cascade ile temizlenir.
    // Önce öğrenci kaydını silmek, kullanıcı ilişkilerinin beklenmedik
    // biçimde öğrenci kaydını önden kaldırmasını engeller.
    await tx.student.delete({where:{id:student.id}});

    if(linkedUserIds.length){
      await tx.user.deleteMany({where:{id:{in:linkedUserIds}}});
    }
  });

  await writeAudit({
    actorUserId:user.id,
    action:'STUDENT_DELETE',
    entityType:'Student',
    entityId:student.id,
    summary:student.fullName+' ('+student.studentCode+') öğrencisi ve ilişkili kayıtları silindi.',
    metadata:{
      studentCode:student.studentCode,
      gradeLevel:student.gradeLevel,
      linkedUserCount:linkedUserIds.length
    }
  });

  return NextResponse.json({ok:true,id:student.id});
}

export const DELETE = withApiErrors(DELETE__handler);
