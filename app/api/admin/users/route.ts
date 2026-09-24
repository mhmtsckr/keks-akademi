import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';
import { decryptPrivateCode } from '@/lib/security';

const patchSchema=z.object({
  userId:z.string(),
  status:z.enum(['PENDING','ACTIVE','SUSPENDED']).optional(),
  role:z.enum(['ADMIN','COACH','STUDENT','PARENT']).optional()
});

async function GET__handler(req:Request){
  await requireRole(['ADMIN']);
  const {searchParams}=new URL(req.url);
  const role=searchParams.get('role') as any;
  const q=(searchParams.get('q')||'').trim();
  const where:any={};
  if(role&&['ADMIN','COACH','STUDENT','PARENT'].includes(role))where.role=role;
  if(q)where.OR=[{name:{contains:q,mode:'insensitive'}},{email:{contains:q,mode:'insensitive'}}];
  const users=await db.user.findMany({
    where,orderBy:{createdAt:'desc'},take:200,
    select:{id:true,name:true,email:true,role:true,status:true,createdAt:true,
      coachProfile:{select:{_count:{select:{students:true}}}},
      student:{select:{studentCode:true,gradeLevel:true,accessKeyCiphertext:true,accessKeyExpiresAt:true,credentialsDeliveryStatus:true,credentialsEmailedAt:true,coach:{select:{user:{select:{name:true}}}}}},
      parentProfile:{select:{student:{select:{fullName:true,studentCode:true}}}}
    }
  });
  const visibleUsers=users.map(u=>({
    ...u,
    student:u.student?{
      studentCode:u.student.studentCode,
      gradeLevel:u.student.gradeLevel,
      coach:u.student.coach,
      credentialsDeliveryStatus:u.student.credentialsDeliveryStatus,
      credentialsEmailedAt:u.student.credentialsEmailedAt,
      accessKey:u.student.accessKeyCiphertext?safeDecrypt(u.student.accessKeyCiphertext):null,
      accessKeyExpiresAt:u.student.accessKeyExpiresAt,
      accessKeyExpired:u.student.accessKeyExpiresAt.getTime()<=Date.now()
    }:null
  }));
  return NextResponse.json({ok:true,users:visibleUsers});
}

function safeDecrypt(value:string){
  try{return decryptPrivateCode(value)}catch{return null}
}

const deleteSchema=z.object({userId:z.string().min(1)});

async function PATCH__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req, patchSchema);
  if(admin.id===input.userId&&input.status==='SUSPENDED') return NextResponse.json({error:'Kendi hesabınızı askıya alamazsınız.'},{status:400});
  const before=await db.user.findUnique({where:{id:input.userId},select:{id:true,name:true,role:true,status:true}});
  if(!before)return NextResponse.json({error:'Kullanıcı bulunamadı.'},{status:404});
  const updated=await db.user.update({where:{id:input.userId},data:{
    ...(input.status?{status:input.status}:{}),
    ...(input.role?{role:input.role}:{}),
  },select:{id:true,name:true,email:true,role:true,status:true}});
  await writeAudit({actorUserId:admin.id,action:'USER_UPDATE',entityType:'User',entityId:updated.id,summary:updated.name+' kullanıcısı güncellendi.',metadata:{before,after:updated}});
  return NextResponse.json({ok:true,user:updated});
}

async function DELETE__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req,deleteSchema);

  if(admin.id===input.userId){
    return NextResponse.json({error:'Kendi yönetici hesabınızı silemezsiniz.'},{status:400});
  }

  const target=await db.user.findUnique({
    where:{id:input.userId},
    select:{
      id:true,name:true,email:true,role:true,status:true,
      student:{select:{id:true,studentCode:true}},
      coachProfile:{select:{id:true,_count:{select:{students:true}}}}
    }
  });
  if(!target)return NextResponse.json({error:'Kullanıcı bulunamadı.'},{status:404});
  if(target.status!=='SUSPENDED'){
    return NextResponse.json({error:'Kalıcı silme yalnızca askıya alınmış kullanıcılar için kullanılabilir.'},{status:409});
  }

  if(target.role==='ADMIN'){
    const otherActiveAdmins=await db.user.count({
      where:{role:'ADMIN',status:'ACTIVE',id:{not:target.id}}
    });
    if(otherActiveAdmins<1){
      return NextResponse.json({error:'Sistemde en az bir aktif yönetici kalmalıdır.'},{status:409});
    }
  }

  const deletedEmail=target.email;
  const deletedName=target.name;
  const deletedRole=target.role;
  const studentCode=target.student?.studentCode||null;
  const detachedStudents=target.coachProfile?._count.students||0;

  await db.$transaction(async tx=>{
    if(target.student){
      await tx.academyCode.deleteMany({where:{assignedStudentId:target.student.id}});
      await tx.student.delete({where:{id:target.student.id}});
    }
    await tx.user.delete({where:{id:target.id}});
  });

  await writeAudit({
    actorUserId:admin.id,
    action:'SUSPENDED_USER_DELETED',
    entityType:'User',
    entityId:target.id,
    summary:deletedName+' adlı askıya alınmış kullanıcı kalıcı olarak silindi.',
    metadata:{
      email:deletedEmail,
      role:deletedRole,
      studentCode,
      detachedStudents,
      emailReusable:Boolean(deletedEmail)
    }
  });

  return NextResponse.json({
    ok:true,
    deletedUserId:target.id,
    email:deletedEmail,
    emailReusable:Boolean(deletedEmail),
    message:deletedEmail
      ?'Kullanıcı kalıcı olarak silindi. '+deletedEmail+' adresiyle yeniden kayıt yapılabilir.'
      :'Kullanıcı kalıcı olarak silindi.'
  });
}

export const GET = withApiErrors(GET__handler);
export const PATCH = withApiErrors(PATCH__handler);
export const DELETE = withApiErrors(DELETE__handler);
