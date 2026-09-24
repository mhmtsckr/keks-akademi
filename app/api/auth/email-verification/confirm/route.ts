import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { readAuthChallenge,verifyAuthChallengeCode } from '@/lib/authChallenge';
import { checkChallengeLimit,markChallengeUsed,recordChallengeFailure } from '@/lib/authAbuse';
import { isEmailVerified,markEmailVerified } from '@/lib/emailVerification';

const schema=z.object({challenge:z.string().min(20),code:z.string().regex(/^\d{6}$/)});

async function POST__handler(req:Request){
  const input=await readJson(req,schema);
  let challenge;
  try{challenge=await readAuthChallenge(input.challenge,'EMAIL_VERIFY')}
  catch{return NextResponse.json({error:'E-posta doğrulama kodunun süresi dolmuş. Yeni kod isteyin.'},{status:400})}

  const limit=await checkChallengeLimit(req,'EMAIL_VERIFY',challenge.jti,5);
  if(!limit.allowed)return NextResponse.json({error:'Bu doğrulama isteği artık kullanılamaz. Yeni kod isteyin.'},{status:429});

  const user=await db.user.findUnique({where:{id:challenge.userId},select:{id:true,role:true,status:true,updatedAt:true}});
  if(!user||user.status==='SUSPENDED')return NextResponse.json({error:'Hesap e-posta doğrulamaya uygun değil.'},{status:403});
  if(await isEmailVerified(user.id)){
    return NextResponse.json({ok:true,role:user.role,activated:user.status==='ACTIVE',message:'E-posta adresiniz zaten doğrulanmış.'});
  }
  if(user.updatedAt.toISOString()!==challenge.nonce)return NextResponse.json({error:'Kayıt bilgileriniz değişti. Yeni doğrulama kodu isteyin.'},{status:400});

  if(!verifyAuthChallengeCode(challenge,input.code)){
    const failed=await recordChallengeFailure(req,'EMAIL_VERIFY',challenge.jti,user.id,5);
    return NextResponse.json({
      error:failed.invalidated?'5 hatalı deneme yapıldı. Kod iptal edildi. Yeni kod isteyin.':'Doğrulama kodu hatalı.',
      remainingAttempts:failed.remainingAttempts
    },{status:failed.invalidated?429:400});
  }

  await markChallengeUsed('EMAIL_VERIFY',challenge.jti,user.id);
  await markEmailVerified(user.id);

  if(user.role==='STUDENT'){
    await db.user.update({where:{id:user.id},data:{status:'ACTIVE'}});
    await createSession(user.id,false,req);
    return NextResponse.json({ok:true,role:'STUDENT',activated:true,message:'E-posta doğrulandı. Öğrenci hesabınız aktif edildi.'});
  }
  if(user.role==='COACH'){
    return NextResponse.json({ok:true,role:'COACH',activated:false,message:'E-posta doğrulandı. Koç hesabınız yönetici onayı bekliyor.'});
  }
  return NextResponse.json({ok:true,role:user.role,activated:user.status==='ACTIVE',message:'E-posta doğrulandı.'});
}

export const POST=withApiErrors(POST__handler);
