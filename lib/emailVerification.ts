import { db } from '@/lib/db';
import { createAuthChallenge } from '@/lib/authChallenge';
import { checkCodeSendLimit,reserveCodeSend } from '@/lib/authAbuse';
import { sendEmailVerificationCode } from '@/lib/mailer';

export async function isEmailVerified(userId:string){
  return (await db.auditLog.count({
    where:{action:'EMAIL_VERIFIED',entityType:'User',entityId:userId}
  }))>0;
}

export async function requiresEmailVerification(userId:string){
  return (await db.auditLog.count({
    where:{action:'EMAIL_VERIFICATION_REQUIRED',entityType:'User',entityId:userId}
  }))>0;
}

export async function markEmailVerificationRequired(userId:string){
  if(await requiresEmailVerification(userId))return;
  await db.auditLog.create({data:{
    actorUserId:userId,
    action:'EMAIL_VERIFICATION_REQUIRED',
    entityType:'User',
    entityId:userId,
    summary:'Kayıt e-posta doğrulaması bekliyor.',
    metadata:{required:true}
  }});
}

export async function markEmailVerified(userId:string){
  if(await isEmailVerified(userId))return;
  await db.auditLog.create({data:{
    actorUserId:userId,
    action:'EMAIL_VERIFIED',
    entityType:'User',
    entityId:userId,
    summary:'Kullanıcının e-posta adresi doğrulandı.',
    metadata:{verified:true}
  }});
}

export async function issueEmailVerification(req:Request,user:{id:string;email:string|null;name:string;updatedAt:Date}){
  if(!user.email)return {ok:false as const,error:'Hesapta doğrulanabilir e-posta adresi bulunmuyor.',status:400};
  const limit=await checkCodeSendLimit('EMAIL_VERIFY',req,user.id,{accountDaily:10,ipDaily:30,cooldownSeconds:60});
  if(!limit.allowed)return {
    ok:false as const,
    error:limit.reason==='COOLDOWN'
      ?'Yeni doğrulama kodu için 60 saniye bekleyin.'
      :'Bugünkü e-posta doğrulama kodu sınırına ulaşıldı. Daha sonra tekrar deneyin.',
    status:429,
    retryAfterSeconds:limit.retryAfterSeconds
  };

  await reserveCodeSend('EMAIL_VERIFY',req,user.id);
  const challenge=await createAuthChallenge({user,purpose:'EMAIL_VERIFY',expiresIn:'10m'});
  const sent:any=await sendEmailVerificationCode({email:user.email,name:user.name,code:challenge.code});
  if(sent?.skipped||sent?.error)return {ok:false as const,error:'Doğrulama e-postası gönderilemedi. Daha sonra yeniden kod isteyin.',status:503};
  return {ok:true as const,challenge:challenge.token,message:'6 haneli e-posta doğrulama kodu gönderildi. Kod 10 dakika geçerlidir.'};
}
