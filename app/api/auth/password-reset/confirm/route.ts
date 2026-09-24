import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashSecret } from '@/lib/security';
import { passwordPolicyMessage } from '@/lib/passwordPolicy';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { writeAudit } from '@/lib/audit';
import { readAuthChallenge,verifyAuthChallengeCode } from '@/lib/authChallenge';
import { checkChallengeLimit,markChallengeUsed,recordChallengeFailure } from '@/lib/authAbuse';

const schema=z.object({
  challenge:z.string().min(20),
  code:z.string().regex(/^\d{6}$/),
  password:z.string().min(12).max(128)
});

async function POST__handler(req:Request){
  const input=await readJson(req,schema);
  const passwordError=passwordPolicyMessage(input.password);
  if(passwordError)return NextResponse.json({error:passwordError},{status:400});

  let challenge;
  try{challenge=await readAuthChallenge(input.challenge,'PASSWORD_RESET')}
  catch{return NextResponse.json({error:'Doğrulama süresi dolmuş veya doğrulama bilgisi geçersiz. Yeni kod isteyin.'},{status:400})}

  const limit=await checkChallengeLimit(req,'PASSWORD_RESET',challenge.jti,5);
  if(!limit.allowed)return NextResponse.json({error:'Bu şifre sıfırlama isteği artık kullanılamaz. Yeni kod isteyin.'},{status:429});

  const user=await db.user.findUnique({where:{id:challenge.userId},select:{id:true,status:true,updatedAt:true}});
  if(!user||user.status==='SUSPENDED')return NextResponse.json({error:'Hesap şifre yenilemeye uygun değil.'},{status:403});
  if(user.updatedAt.toISOString()!==challenge.nonce)return NextResponse.json({error:'Bu doğrulama kodu artık geçerli değil. Yeni kod isteyin.'},{status:400});

  if(!verifyAuthChallengeCode(challenge,input.code)){
    const failed=await recordChallengeFailure(req,'PASSWORD_RESET',challenge.jti,user.id,5);
    return NextResponse.json({
      error:failed.invalidated?'5 hatalı deneme yapıldı. Bu doğrulama kodu iptal edildi. Yeni kod isteyin.':'Doğrulama kodu hatalı.',
      remainingAttempts:failed.remainingAttempts
    },{status:failed.invalidated?429:400});
  }

  await markChallengeUsed('PASSWORD_RESET',challenge.jti,user.id);
  const updated=await db.user.update({where:{id:user.id},data:{passwordHash:await hashSecret(input.password),updatedAt:new Date()},select:{id:true}});
  await writeAudit({
    actorUserId:updated.id,
    action:'PASSWORD_RESET_COMPLETED',
    entityType:'User',
    entityId:updated.id,
    summary:'Kullanıcı şifresini e-posta doğrulamasıyla yeniledi; tüm eski oturumlar geçersiz kılındı.',
    metadata:{allSessionsRevoked:true}
  });
  return NextResponse.json({ok:true,message:'Şifreniz yenilendi. Güvenlik için diğer tüm cihazlardaki oturumlar kapatıldı. Yeni şifrenizle giriş yapabilirsiniz.'});
}

export const POST=withApiErrors(POST__handler);
