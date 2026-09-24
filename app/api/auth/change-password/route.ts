import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSession,currentSessionClaims,currentUser,endCurrentSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { hashSecret,verifySecret } from '@/lib/security';
import { passwordPolicyMessage } from '@/lib/passwordPolicy';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { writeAudit } from '@/lib/audit';

const schema=z.object({
  currentPassword:z.string().min(1).max(128),
  newPassword:z.string().min(12).max(128),
  logoutOtherSessions:z.boolean().optional().default(true)
});

async function POST__handler(req:Request){
  const user=await currentUser();
  if(!user)return NextResponse.json({error:'Oturum açmanız gerekiyor.'},{status:401});
  if(!user.passwordHash)return NextResponse.json({error:'Bu hesapta değiştirilebilir bir şifre bulunmuyor.'},{status:409});

  const input=await readJson(req,schema);
  const priorSession=await currentSessionClaims();
  if(!(await verifySecret(input.currentPassword,user.passwordHash))){
    return NextResponse.json({error:'Mevcut şifre hatalı.'},{status:400});
  }

  const policyError=passwordPolicyMessage(input.newPassword);
  if(policyError)return NextResponse.json({error:policyError},{status:400});
  if(await verifySecret(input.newPassword,user.passwordHash)){
    return NextResponse.json({error:'Yeni şifre mevcut şifrenizle aynı olamaz.'},{status:400});
  }

  await db.user.update({
    where:{id:user.id},
    data:{passwordHash:await hashSecret(input.newPassword),updatedAt:new Date()}
  });
  await writeAudit({
    actorUserId:user.id,
    action:'PASSWORD_CHANGED',
    entityType:'User',
    entityId:user.id,
    summary:input.logoutOtherSessions
      ?'Kullanıcı şifresini değiştirdi; tüm aktif oturumlar güvenlik amacıyla iptal edildi.'
      :'Kullanıcı şifresini değiştirdi; diğer cihazlardaki oturumlar iptal edildi ve mevcut cihaz için yeni oturum oluşturuldu.',
    metadata:{allSessionsRevoked:true,currentDeviceKept:!input.logoutOtherSessions}
  });

  if(input.logoutOtherSessions){
    await endCurrentSession('PASSWORD_CHANGED');
    return NextResponse.json({
      ok:true,
      loggedOut:true,
      allSessionsRevoked:true,
      message:'Şifreniz değiştirildi. Bu cihaz dahil tüm cihazlardaki oturumlar kapatıldı.'
    });
  }

  await createSession(user.id,priorSession?.remember||false,req);
  return NextResponse.json({
    ok:true,
    loggedOut:false,
    allSessionsRevoked:true,
    message:'Şifreniz değiştirildi. Diğer cihazlardaki oturumlar kapatıldı; bu cihazda oturumunuz devam ediyor.'
  });
}

export const POST=withApiErrors(POST__handler);
