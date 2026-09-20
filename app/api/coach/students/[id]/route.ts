import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';

const schema=z.object({confirmationCode:z.string().min(1)});

export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile) return NextResponse.json({error:'Koç profili bulunamadı.'},{status:403});

  const {id}=await params;
  const input=schema.parse(await req.json());
  const student=await db.student.findUnique({
    where:{id},
    include:{
      parentProfiles:{select:{userId:true}},
      user:{select:{id:true,role:true}}
    }
  });

  if(!student) return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  if(student.coachId!==user.coachProfile.id) return NextResponse.json({error:'Bu öğrenciyi silme yetkiniz yok.'},{status:403});
  if(input.confirmationCode!==student.studentCode) return NextResponse.json({error:'Öğrenci kodu doğrulanamadı.'},{status:400});

  const linkedUserIds=[
    ...(student.userId?[student.userId]:[]),
    ...student.parentProfiles.map(x=>x.userId)
  ];

  await db.$transaction(async tx=>{
    await tx.academyCode.updateMany({
      where:{assignedStudentId:student.id},
      data:{assignedStudentId:null,active:false}
    });

    if(linkedUserIds.length){
      await tx.user.deleteMany({where:{id:{in:linkedUserIds}}});
    }

    await tx.student.delete({where:{id:student.id}});
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
