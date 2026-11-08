import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {writeAudit} from '@/lib/audit';
import {coachSupportsEducationLevel,normalizePartnerLevels} from '@/lib/partnerCoachNetwork';

const schema=z.object({
  studentId:z.string().min(1),
  coachId:z.string().min(1)
});

async function GET__handler(){
  await requireRole(['ADMIN']);
  const students=await db.student.findMany({
    select:{
      id:true,studentCode:true,fullName:true,gradeLevel:true,academicTrack:true,coachId:true,
      coach:{select:{user:{select:{name:true}}}}
    },
    orderBy:{createdAt:'desc'},
    take:500
  });
  return NextResponse.json({ok:true,students:students.map(s=>({
    id:s.id,studentCode:s.studentCode,fullName:s.fullName,gradeLevel:s.gradeLevel,
    academicTrack:s.academicTrack,coachId:s.coachId,coachName:s.coach?.user.name||null
  }))});
}

async function PATCH__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req,schema);
  const result=await db.$transaction(async tx=>{
    const student=await tx.student.findUnique({
      where:{id:input.studentId},
      select:{id:true,fullName:true,gradeLevel:true,coachId:true}
    });
    if(!student)return {error:'Öğrenci bulunamadı.',status:404};
    const coach=await tx.coachProfile.findUnique({
      where:{id:input.coachId},
      select:{
        id:true,partnerStatus:true,acceptingStudents:true,maxActiveStudents:true,
        supportedEducationLevels:true,
        user:{select:{name:true,status:true,role:true}}
      }
    });
    if(!coach||coach.user.role!=='COACH'||coach.user.status!=='ACTIVE'||coach.partnerStatus!=='ACTIVE'){
      return {error:'Aktif Partner Koç bulunamadı.',status:400};
    }
    if(student.coachId===coach.id)return {ok:true,unchanged:true,studentId:student.id,coachId:coach.id,coachName:coach.user.name};
    if(!coach.acceptingStudents)return {error:'Partner Koç yeni öğrenci kabul etmiyor.',status:400};
    if(!coachSupportsEducationLevel(normalizePartnerLevels(coach.supportedEducationLevels),student.gradeLevel)){
      return {error:'Partner Koç öğrencinin eğitim düzeyini desteklemiyor.',status:400};
    }
    const count=await tx.student.count({where:{coachId:coach.id}});
    if(count>=coach.maxActiveStudents)return {error:'Partner Koç kontenjanı dolu.',status:409};
    await tx.student.update({where:{id:student.id},data:{coachId:coach.id}});
    return {ok:true,studentId:student.id,studentName:student.fullName,coachId:coach.id,coachName:coach.user.name,previousCoachId:student.coachId};
  });
  if('error' in result)return NextResponse.json({error:result.error},{status:result.status});
  if(!('unchanged' in result)){
    await writeAudit({
      actorUserId:admin.id,
      action:'ADMIN_PARTNER_COACH_STUDENT_ASSIGNED',
      entityType:'Student',
      entityId:result.studentId,
      summary:result.studentName+' öğrencisi '+result.coachName+' Partner Koç hesabına atandı.',
      metadata:{previousCoachId:result.previousCoachId,coachId:result.coachId}
    });
  }
  return NextResponse.json(result);
}

export const GET=withApiErrors(GET__handler);
export const PATCH=withApiErrors(PATCH__handler);
