import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';

export async function purgeSuspendedUserById(userId:string,actorUserId?:string|null){
  const target=await db.user.findUnique({
    where:{id:userId},
    select:{
      id:true,name:true,email:true,role:true,status:true,
      student:{select:{id:true,studentCode:true}},
      coachProfile:{select:{id:true,_count:{select:{students:true}}}}
    }
  });
  if(!target)return {ok:false as const,reason:'NOT_FOUND' as const};
  if(target.status!=='SUSPENDED')return {ok:false as const,reason:'NOT_SUSPENDED' as const};

  const metadata={
    email:target.email,
    role:target.role,
    studentCode:target.student?.studentCode||null,
    detachedStudents:target.coachProfile?._count.students||0
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
    action:'SUSPENDED_USER_DELETED',
    entityType:'User',
    entityId:target.id,
    summary:target.name+' adlı askıya alınmış kullanıcı kalıcı olarak silindi.',
    metadata:{...metadata,emailReusable:Boolean(target.email)}
  });

  return {
    ok:true as const,
    userId:target.id,
    name:target.name,
    email:target.email,
    role:target.role,
    studentCode:target.student?.studentCode||null,
    detachedStudents:target.coachProfile?._count.students||0
  };
}

export async function purgeSuspendedUserByEmail(email:string){
  const normalized=email.trim().toLowerCase();
  const target=await db.user.findUnique({where:{email:normalized},select:{id:true,status:true}});
  if(!target||target.status!=='SUSPENDED')return null;
  return purgeSuspendedUserById(target.id,null);
}
