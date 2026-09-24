import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';
import { getSuspensionRetention, permanentlyDeleteSuspendedUserById, SUSPENSION_RETENTION_DAYS } from '@/lib/suspendedUserCleanup';
import { requiresEmailVerification,isEmailVerified } from '@/lib/emailVerification';

const patchSchema=z.object({
  userId:z.string(),
  status:z.enum(['PENDING','ACTIVE','SUSPENDED']).optional(),
  role:z.enum(['ADMIN','COACH','STUDENT','PARENT']).optional(),
  revokeSessions:z.boolean().optional()
});

async function GET__handler(req:Request){
  const admin=await requireRole(['ADMIN']);

  const {searchParams}=new URL(req.url);
  const role=searchParams.get('role') as any;
  const q=(searchParams.get('q')||'').trim();
  const where:any={};
  if(role&&['ADMIN','COACH','STUDENT','PARENT'].includes(role))where.role=role;
  if(q)where.OR=[{name:{contains:q,mode:'insensitive'}},{email:{contains:q,mode:'insensitive'}}];
  const users=await db.user.findMany({
    where,orderBy:{createdAt:'desc'},take:200,
    select:{id:true,name:true,email:true,role:true,status:true,createdAt:true,updatedAt:true,
      coachProfile:{select:{_count:{select:{students:true}}}},
      student:{select:{studentCode:true,gradeLevel:true,coach:{select:{user:{select:{name:true}}}}}},
      parentProfile:{select:{student:{select:{fullName:true,studentCode:true}}}}
    }
  });
  const visibleUsers=users.map(u=>{
    const retention=u.status==='SUSPENDED'?getSuspensionRetention(u.updatedAt):null;
    return {
    ...u,
    suspendedAt:retention?.suspendedAt||null,
    deleteAvailableAt:retention?.deleteAvailableAt||null,
    canPermanentlyDelete:retention?.canPermanentlyDelete||false,
    retentionDaysRemaining:retention?.retentionDaysRemaining||0,
    student:u.student?{
      studentCode:u.student.studentCode,
      gradeLevel:u.student.gradeLevel,
      coach:u.student.coach
    }:null
  }});
  return NextResponse.json({
    ok:true,
    users:visibleUsers,
    suspensionRetentionDays:SUSPENSION_RETENTION_DAYS
  });
}

const deleteSchema=z.union([
  z.object({userId:z.string().min(1),deleteAll:z.literal(false).optional()}),
  z.object({deleteAll:z.literal(true)})
]);

async function PATCH__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req, patchSchema);
  if(admin.id===input.userId&&input.status==='SUSPENDED') return NextResponse.json({error:'Kendi hesabınızı askıya alamazsınız.'},{status:400});
  const before=await db.user.findUnique({where:{id:input.userId},select:{id:true,name:true,email:true,role:true,status:true}});

  if(!before)return NextResponse.json({error:'Kullanıcı bulunamadı.'},{status:404});

  if(input.status==='ACTIVE'){
    const verificationRequired=await requiresEmailVerification(before.id);
    if(verificationRequired&&!(await isEmailVerified(before.id))){
      return NextResponse.json({error:'E-posta doğrulanmadan hesap aktif edilemez.'},{status:409});
    }
  }

  if(input.revokeSessions){
    await db.user.update({where:{id:input.userId},data:{updatedAt:new Date()}});
    await writeAudit({
      actorUserId:admin.id,
      action:'ADMIN_SESSION_REVOCATION',
      entityType:'User',
      entityId:input.userId,
      summary:before.name+' kullanıcısının tüm aktif oturumları yönetici tarafından iptal edildi.',
      metadata:{reason:'ADMIN_SECURITY_ACTION'}
    });
    return NextResponse.json({ok:true,message:'Kullanıcının tüm cihazlardaki oturumları iptal edildi.'});
  }

  if(input.status==='SUSPENDED'){
    if(before.status==='SUSPENDED'){
      const retention=getSuspensionRetention((await db.user.findUnique({where:{id:input.userId},select:{updatedAt:true}}))!.updatedAt);
      return NextResponse.json({
        ok:true,
        user:before,
        suspended:true,
        deleteAvailableAt:retention.deleteAvailableAt,
        retentionDaysRemaining:retention.retentionDaysRemaining,
        message:'Kullanıcı zaten askıda. Verileri 30 günlük koruma süresi boyunca saklanır.'
      });
    }
    const suspended=await db.user.update({
      where:{id:input.userId},
      data:{status:'SUSPENDED',updatedAt:new Date(),...(input.role?{role:input.role}:{})},
      select:{id:true,name:true,email:true,role:true,status:true,updatedAt:true}
    });
    const retention=getSuspensionRetention(suspended.updatedAt);
    await writeAudit({
      actorUserId:admin.id,
      action:'USER_SUSPENDED',
      entityType:'User',
      entityId:suspended.id,
      summary:suspended.name+' kullanıcısı askıya alındı. Hesap verileri 30 gün korunacak.',
      metadata:{deleteAvailableAt:retention.deleteAvailableAt.toISOString(),retentionDays:SUSPENSION_RETENTION_DAYS}
    });
    return NextResponse.json({
      ok:true,
      user:suspended,
      suspended:true,
      deleteAvailableAt:retention.deleteAvailableAt,
      retentionDaysRemaining:retention.retentionDaysRemaining,
      message:'Kullanıcı askıya alındı. Hesap silinmedi; veriler 30 gün korunacak.'
    });
  }

  const updated=await db.user.update({where:{id:input.userId},data:{
    ...(input.status?{status:input.status}:{}),
    ...(input.role?{role:input.role}:{}),
  },select:{id:true,name:true,email:true,role:true,status:true}});
  await writeAudit({actorUserId:admin.id,action:'USER_UPDATE',entityType:'User',entityId:updated.id,summary:updated.name+' kullanıcısı güncellendi.',metadata:{before,after:updated}});
  return NextResponse.json({ok:true,user:updated,message:'Kullanıcı durumu güncellendi.'});
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
      const result=await permanentlyDeleteSuspendedUserById(row.id,admin.id);
      if(result.ok)deleted+=1;
      else failed.push(row.id);
    }
    return NextResponse.json({
      ok:true,
      deleted,
      failed:failed.length,
      status:'DELETED',
      message:deleted+' hesabın 30 günlük koruma süresi dolduğu için kalıcı silme tamamlandı. '+failed.length+' hesap henüz koruma süresinde veya silinemedi.'
    });
  }

  const userId=input.userId;
  if(admin.id===userId){
    return NextResponse.json({error:'Kendi yönetici hesabınızı silemezsiniz.'},{status:400});
  }

  const result=await permanentlyDeleteSuspendedUserById(userId,admin.id);
  if(!result.ok){
    if(result.reason==='NOT_FOUND')return NextResponse.json({error:'Kullanıcı bulunamadı.'},{status:404});
    if(result.reason==='RETENTION_ACTIVE')return NextResponse.json({
      error:'Bu hesap 30 günlük askı koruma süresinde. Koruma süresi dolmadan kalıcı silinemez.',
      deleteAvailableAt:result.deleteAvailableAt,
      retentionDaysRemaining:result.retentionDaysRemaining
    },{status:409});
    return NextResponse.json({error:'Kalıcı silme yalnızca askıya alınmış kullanıcılar için kullanılabilir.'},{status:409});
  }

  return NextResponse.json({
    ok:true,
    deletedUserId:result.userId,
    email:result.email,
    emailReusable:Boolean(result.email),
    status:'DELETED',
    message:result.email
      ?'Kullanıcı kalıcı olarak silindi. '+result.email+' adresi artık yeniden kayıt için kullanılabilir.'
      :'Kullanıcı kalıcı olarak silindi.'
  });
}

export const GET = withApiErrors(GET__handler);
export const PATCH = withApiErrors(PATCH__handler);
export const DELETE = withApiErrors(DELETE__handler);
