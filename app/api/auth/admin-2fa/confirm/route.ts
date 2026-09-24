import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { readAuthChallenge,verifyAuthChallengeCode } from '@/lib/authChallenge';
import { checkChallengeLimit,markChallengeUsed,recordChallengeFailure,recordLoginSuccess } from '@/lib/authAbuse';

const schema=z.object({challenge:z.string().min(20),code:z.string().regex(/^\d{6}$/)});

async function POST__handler(req:Request){
  const input=await readJson(req,schema);
  let challenge;
  try{challenge=await readAuthChallenge(input.challenge,'ADMIN_2FA')}
  catch{return NextResponse.json({error:'Yönetici doğrulama kodunun süresi dolmuş veya istek geçersiz.'},{status:400})}

  const limit=await checkChallengeLimit(req,'ADMIN_2FA',challenge.jti,5);
  if(!limit.allowed)return NextResponse.json({error:'Bu doğrulama isteği artık kullanılamaz. Yeniden giriş yapın.'},{status:429});

  const user=await db.user.findUnique({where:{id:challenge.userId},select:{id:true,email:true,role:true,status:true,updatedAt:true}});
  if(!user||user.role!=='ADMIN'||user.status!=='ACTIVE'||!user.email)return NextResponse.json({error:'Yönetici hesabı girişe uygun değil.'},{status:403});
  if(user.updatedAt.toISOString()!==challenge.nonce)return NextResponse.json({error:'Hesap güvenliği değişti. Yeniden giriş yapın.'},{status:400});

  if(!verifyAuthChallengeCode(challenge,input.code)){
    const failed=await recordChallengeFailure(req,'ADMIN_2FA',challenge.jti,user.id,5);
    return NextResponse.json({
      error:failed.invalidated?'5 hatalı deneme yapıldı. Doğrulama isteği iptal edildi.':'Doğrulama kodu hatalı.',
      remainingAttempts:failed.remainingAttempts
    },{status:failed.invalidated?429:400});
  }

  await markChallengeUsed('ADMIN_2FA',challenge.jti,user.id);
  await createSession(user.id,challenge.remember);
  await recordLoginSuccess(req,user.email,user.id);
  return NextResponse.json({ok:true,role:'ADMIN'});
}

export const POST=withApiErrors(POST__handler);
