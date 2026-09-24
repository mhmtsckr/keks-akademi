import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';
import { decryptPrivateCode } from '@/lib/security';
import { purgeSuspendedUserById } from '@/lib/suspendedUserCleanup';

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

const deleteSchema=z.union([
  z.object({userId:z.string().min(1),deleteAll:z.literal(false).optional()}),
  z.object({deleteAll:z.literal(true)})
]);

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

  if('deleteAll' in input&&input.deleteAll===true){
    const suspended=await db.user.findMany({
      where:{status:'SUSPENDED',id:{not:admin.id}},
      select:{id:true}
    });
    let deleted=0;
    const failed:string[]=[];
    for(const row of suspended){
      const result=await purgeSuspendedUserById(row.id,admin.id);
      if(result.ok)deleted+=1;
      else failed.push(row.id);
    }
    return NextResponse.json({
      ok:true,
      deleted,
      failed:failed.length,
      message:deleted+' askıya alınmış kullanıcı kalıcı olarak silindi. Bu hesapların e-posta adresleri yeniden kayıt için kullanılabilir.'
    });
  }

  const userId=input.userId;
  if(admin.id===userId){
    return NextResponse.json({error:'Kendi yönetici hesabınızı silemezsiniz.'},{status:400});
  }

  const result=await purgeSuspendedUserById(userId,admin.id);
  if(!result.ok){
    if(result.reason==='NOT_FOUND')return NextResponse.json({error:'Kullanıcı bulunamadı.'},{status:404});
    return NextResponse.json({error:'Kalıcı silme yalnızca askıya alınmış kullanıcılar için kullanılabilir.'},{status:409});
  }

  return NextResponse.json({
    ok:true,
    deletedUserId:result.userId,
    email:result.email,
    emailReusable:Boolean(result.email),
    message:result.email
      ?'Kullanıcı kalıcı olarak silindi. '+result.email+' adresiyle yeniden kayıt yapılabilir.'
      :'Kullanıcı kalıcı olarak silindi.'
  });
}

export const GET = withApiErrors(GET__handler);
export const PATCH = withApiErrors(PATCH__handler);
export const DELETE = withApiErrors(DELETE__handler);
