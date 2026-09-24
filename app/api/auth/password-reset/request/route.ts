import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { sendPasswordResetCode } from '@/lib/mailer';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { authHash,checkCodeSendLimit,reserveCodeSend } from '@/lib/authAbuse';
import { createAuthChallenge } from '@/lib/authChallenge';
import { writeAudit } from '@/lib/audit';

const schema=z.object({
  email:z.string().email(),
  role:z.enum(['STUDENT','COACH']),
  studentCode:z.string().trim().min(2).max(32).optional(),
  fullName:z.string().trim().min(2).max(120).optional()
});

async function POST__handler(req:Request){
  const input=await readJson(req,schema);
  const email=input.email.trim().toLowerCase();
  const user=await db.user.findUnique({where:{email},include:{student:{select:{studentCode:true}}}});

  const roleMatches=user&&user.role===input.role;
  const infoMatches=input.role==='STUDENT'
    ?Boolean(user?.student&&input.studentCode&&user.student.studentCode===input.studentCode.trim())
    :Boolean(user&&input.fullName&&user.name.trim().toLocaleLowerCase('tr-TR')===input.fullName.trim().toLocaleLowerCase('tr-TR'));

  if(!user||!roleMatches||!infoMatches||user.status==='SUSPENDED'){
    await writeAudit({
      action:'PASSWORD_RESET_REQUEST_REJECTED',
      entityType:'AuthSecurity',
      entityId:authHash(email),
      summary:'Şifre sıfırlama isteği hesap doğrulamasıyla eşleşmedi.',
      metadata:{reason:'IDENTITY_MISMATCH'}
    });
    return NextResponse.json({ok:true,sent:false,message:'Bilgiler kayıtlarla eşleşirse doğrulama kodu kayıtlı e-posta adresine gönderilir.'});
  }

  const limit=await checkCodeSendLimit('PASSWORD_RESET',req,user.id,{accountDaily:5,ipDaily:20,cooldownSeconds:60});
  if(!limit.allowed){
    await writeAudit({
      actorUserId:user.id,
      action:'PASSWORD_RESET_RATE_LIMITED',
      entityType:'User',
      entityId:user.id,
      summary:'Şifre sıfırlama kodu isteği hız sınırına takıldı.',
      metadata:{reason:limit.reason,retryAfterSeconds:limit.retryAfterSeconds}
    });
    return NextResponse.json({
      error:limit.reason==='COOLDOWN'
        ?'Yeni şifre sıfırlama kodu için 60 saniye bekleyin.'
        :'Bugünkü şifre sıfırlama kodu sınırına ulaşıldı. Daha sonra tekrar deneyin.',
      retryAfterSeconds:limit.retryAfterSeconds
    },{status:429,headers:{'Retry-After':String(limit.retryAfterSeconds)}});
  }

  await reserveCodeSend('PASSWORD_RESET',req,user.id);
  const challenge=await createAuthChallenge({user,purpose:'PASSWORD_RESET',expiresIn:'10m'});
  const sent:any=await sendPasswordResetCode({email,name:user.name,code:challenge.code});
  if(sent?.skipped||sent?.error){
    await writeAudit({
      actorUserId:user.id,
      action:'PASSWORD_RESET_DELIVERY_FAILED',
      entityType:'User',
      entityId:user.id,
      summary:'Şifre sıfırlama doğrulama e-postası gönderilemedi.',
      metadata:{reason:'MAIL_DELIVERY_FAILED'}
    });
    return NextResponse.json({error:'Doğrulama e-postası şu anda gönderilemiyor. Lütfen daha sonra tekrar deneyin.'},{status:503});
  }

  await writeAudit({
    actorUserId:user.id,
    action:'PASSWORD_RESET_CODE_SENT',
    entityType:'User',
    entityId:user.id,
    summary:'Şifre sıfırlama doğrulama kodu gönderildi.',
    metadata:{expiresInMinutes:10,maxAttempts:5}
  });

  return NextResponse.json({ok:true,sent:true,challenge:challenge.token,message:'6 haneli doğrulama kodu gönderildi. Kod 10 dakika ve en fazla 5 deneme için geçerlidir.'});
}

export const POST=withApiErrors(POST__handler);
