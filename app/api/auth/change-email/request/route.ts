import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifySecret } from '@/lib/security';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { checkCodeSendLimit,reserveCodeSend } from '@/lib/authAbuse';
import { createAuthChallenge } from '@/lib/authChallenge';
import { sendEmailChangeCode } from '@/lib/mailer';
import { writeAudit } from '@/lib/audit';

const schema=z.object({
  currentPassword:z.string().min(1).max(128),
  newEmail:z.string().email().max(254)
});

function maskEmail(email:string){
  const [local,domain]=email.split('@');
  return (local?.slice(0,2)||'**')+'***@'+(domain||'***');
}

async function POST__handler(req:Request){
  const user=await currentUser();
  if(!user)return NextResponse.json({error:'Oturum açmanız gerekiyor.'},{status:401});
  if(!user.passwordHash)return NextResponse.json({error:'Bu hesapta doğrulanabilir bir şifre bulunmuyor.'},{status:409});
  const input=await readJson(req,schema);
  const newEmail=input.newEmail.trim().toLowerCase();

  if(!(await verifySecret(input.currentPassword,user.passwordHash))){
    await writeAudit({
      actorUserId:user.id,
      action:'EMAIL_CHANGE_FAILED',
      entityType:'User',
      entityId:user.id,
      summary:'E-posta değişikliği mevcut şifre doğrulamasında başarısız oldu.',
      metadata:{reason:'CURRENT_PASSWORD_MISMATCH'}
    });
    return NextResponse.json({error:'Mevcut şifre hatalı.'},{status:400});
  }
  if(user.role==='STUDENT'&&!newEmail.endsWith('@gmail.com')){
    return NextResponse.json({error:'Öğrenci hesabında Gmail adresi kullanın.'},{status:400});
  }
  if(user.email?.toLowerCase()===newEmail)return NextResponse.json({error:'Yeni e-posta mevcut e-posta ile aynı olamaz.'},{status:400});
  const existing=await db.user.findUnique({where:{email:newEmail},select:{id:true}});
  if(existing)return NextResponse.json({error:'Bu e-posta başka bir hesaba bağlı.'},{status:409});

  const limit=await checkCodeSendLimit('EMAIL_CHANGE',req,user.id,{accountDaily:5,ipDaily:20,cooldownSeconds:60});
  if(!limit.allowed)return NextResponse.json({
    error:limit.reason==='COOLDOWN'?'Yeni kod için 60 saniye bekleyin.':'Bugünkü e-posta değiştirme kodu sınırına ulaşıldı.',
    retryAfterSeconds:limit.retryAfterSeconds
  },{status:429,headers:{'Retry-After':String(limit.retryAfterSeconds)}});

  await reserveCodeSend('EMAIL_CHANGE',req,user.id);
  const challenge=await createAuthChallenge({
    user,
    purpose:'EMAIL_CHANGE',
    expiresIn:'10m',
    data:{newEmail}
  });
  const sent:any=await sendEmailChangeCode({email:newEmail,name:user.name,code:challenge.code});
  if(sent?.skipped||sent?.error)return NextResponse.json({error:'Yeni e-posta doğrulama kodu gönderilemedi.'},{status:503});

  await writeAudit({
    actorUserId:user.id,
    action:'EMAIL_CHANGE_REQUESTED',
    entityType:'User',
    entityId:user.id,
    summary:'Kullanıcı e-posta değişikliği için doğrulama başlattı.',
    metadata:{newEmail:maskEmail(newEmail)}
  });

  return NextResponse.json({ok:true,challenge:challenge.token,newEmail,message:'Yeni e-posta adresinize 6 haneli doğrulama kodu gönderildi.'});
}

export const POST=withApiErrors(POST__handler);
