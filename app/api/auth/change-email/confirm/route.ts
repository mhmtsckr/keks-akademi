import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser,endCurrentSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { readAuthChallenge,verifyAuthChallengeCode } from '@/lib/authChallenge';
import { checkChallengeLimit,markChallengeUsed,recordChallengeFailure } from '@/lib/authAbuse';
import { writeAudit } from '@/lib/audit';

const schema=z.object({challenge:z.string().min(20),code:z.string().regex(/^\d{6}$/)});

function maskEmail(email:string|null){
  if(!email)return '—';
  const [local,domain]=email.split('@');
  return (local?.slice(0,2)||'**')+'***@'+(domain||'***');
}

async function POST__handler(req:Request){
  const sessionUser=await currentUser();
  if(!sessionUser)return NextResponse.json({error:'Oturum açmanız gerekiyor.'},{status:401});
  const input=await readJson(req,schema);

  let challenge;
  try{challenge=await readAuthChallenge(input.challenge,'EMAIL_CHANGE')}
  catch{return NextResponse.json({error:'E-posta doğrulama kodunun süresi dolmuş veya istek geçersiz.'},{status:400})}

  if(challenge.userId!==sessionUser.id)return NextResponse.json({error:'Bu doğrulama isteği mevcut hesaba ait değil.'},{status:403});
  const newEmail=String(challenge.data.newEmail||'').trim().toLowerCase();
  if(!newEmail)return NextResponse.json({error:'Yeni e-posta bilgisi bulunamadı.'},{status:400});

  const limit=await checkChallengeLimit(req,'EMAIL_CHANGE',challenge.jti,5);
  if(!limit.allowed)return NextResponse.json({error:'Bu doğrulama isteği artık kullanılamaz. Yeniden e-posta değişikliği başlatın.'},{status:429});

  const user=await db.user.findUnique({where:{id:sessionUser.id},select:{id:true,email:true,status:true,updatedAt:true}});
  if(!user||user.status!=='ACTIVE')return NextResponse.json({error:'Hesap e-posta değişikliğine uygun değil.'},{status:403});
  if(user.updatedAt.toISOString()!==challenge.nonce)return NextResponse.json({error:'Hesap güvenliği değişti. E-posta değişikliğini yeniden başlatın.'},{status:400});

  if(!verifyAuthChallengeCode(challenge,input.code)){
    const failed=await recordChallengeFailure(req,'EMAIL_CHANGE',challenge.jti,user.id,5);
    await writeAudit({
      actorUserId:user.id,
      action:'EMAIL_CHANGE_FAILED',
      entityType:'User',
      entityId:user.id,
      summary:'Yeni e-posta doğrulama kodu hatalı girildi.',
      metadata:{reason:'CODE_MISMATCH',remainingAttempts:failed.remainingAttempts}
    });
    return NextResponse.json({error:failed.invalidated?'5 hatalı deneme yapıldı. Kod iptal edildi.':'Doğrulama kodu hatalı.',remainingAttempts:failed.remainingAttempts},{status:failed.invalidated?429:400});
  }

  const existing=await db.user.findUnique({where:{email:newEmail},select:{id:true}});
  if(existing&&existing.id!==user.id)return NextResponse.json({error:'Bu e-posta artık başka bir hesaba bağlı.'},{status:409});

  await markChallengeUsed('EMAIL_CHANGE',challenge.jti,user.id);
  await db.user.update({where:{id:user.id},data:{email:newEmail,updatedAt:new Date()}});
  await writeAudit({
    actorUserId:user.id,
    action:'EMAIL_CHANGED',
    entityType:'User',
    entityId:user.id,
    summary:'Kullanıcının e-posta adresi doğrulama sonrasında değiştirildi.',
    metadata:{before:maskEmail(user.email),after:maskEmail(newEmail),allSessionsRevoked:true}
  });
  await endCurrentSession('EMAIL_CHANGED');

  return NextResponse.json({ok:true,loggedOut:true,message:'E-posta adresiniz değiştirildi. Güvenlik için tüm oturumlar kapatıldı; yeni e-posta adresinizle yeniden giriş yapın.'});
}

export const POST=withApiErrors(POST__handler);
