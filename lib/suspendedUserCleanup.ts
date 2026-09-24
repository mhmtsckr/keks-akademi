import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';

export const SUSPENSION_RETENTION_DAYS=30;
const RETENTION_MS=SUSPENSION_RETENTION_DAYS*24*60*60*1000;

export function getSuspensionRetention(suspendedAt:Date,now=new Date()){
  const deleteAvailableAt=new Date(suspendedAt.getTime()+RETENTION_MS);
  const remainingMs=Math.max(0,deleteAvailableAt.getTime()-now.getTime());
  return {
    suspendedAt,
    deleteAvailableAt,
    canPermanentlyDelete:remainingMs===0,
    retentionDaysRemaining:Math.ceil(remainingMs/(24*60*60*1000))
  };
}

export async function permanentlyDeleteSuspendedUserById(userId:string,actorUserId?:string|null){
  const target=await db.user.findUnique({
    where:{id:userId},
    select:{
      id:true,name:true,email:true,role:true,status:true,updatedAt:true,
      student:{select:{id:true,studentCode:true}},
      coachProfile:{select:{id:true,_count:{select:{students:true}}}}
    }
  });
  if(!target)return {ok:false as const,reason:'NOT_FOUND' as const};
  if(target.status!=='SUSPENDED')return {ok:false as const,reason:'NOT_SUSPENDED' as const};

  const retention=getSuspensionRetention(target.updatedAt);
  if(!retention.canPermanentlyDelete){
    return {
      ok:false as const,
      reason:'RETENTION_ACTIVE' as const,
      deleteAvailableAt:retention.deleteAvailableAt,
      retentionDaysRemaining:retention.retentionDaysRemaining
    };
  }

  const releasedEmail=target.email;
  const metadata={
    role:target.role,
    studentCode:target.student?.studentCode||null,
    detachedStudents:target.coachProfile?._count.students||0,
    suspendedAt:target.updatedAt.toISOString(),
    retentionDays:SUSPENSION_RETENTION_DAYS,
    emailReusable:Boolean(releasedEmail),
    terminalStatus:'DELETED'
  };

  await db.$transaction(async tx=>{
    if(target.student){
      await tx.academyCode.deleteMany({where:{assignedStudentId:target.student.id}});
      await tx.student.delete({where:{id:target.student.id}});
    }
    await tx.user.delete({where:{id:target.id}});
  });

  await writeAudit({
    actorUserId:actorUserId||null,
    action:'USER_PERMANENTLY_DELETED',
    entityType:'User',
    entityId:target.id,
    summary:target.name+' kullanıcısı 30 günlük askı koruma süresi sonrasında kalıcı olarak silindi.',
    metadata
  });

  return {
    ok:true as const,
    status:'DELETED' as const,
    userId:target.id,
    name:target.name,
    email:releasedEmail,
    role:target.role,
    studentCode:target.student?.studentCode||null,
    detachedStudents:target.coachProfile?._count.students||0
  };
}
