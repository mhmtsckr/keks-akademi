import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashSecret,verifySecret } from '@/lib/security';
import { passwordPolicyMessage } from '@/lib/passwordPolicy';
import { isEmailVerified,issueEmailVerification,markEmailVerificationRequired } from '@/lib/emailVerification';

const schema=z.object({name:z.string().min(2),email:z.string().email(),password:z.string().min(12).max(128)});

async function POST__handler(req:Request){
  const input=await readJson(req,schema);
  const passwordError=passwordPolicyMessage(input.password);
  if(passwordError)return NextResponse.json({error:passwordError},{status:400});
  const email=input.email.trim().toLowerCase();

  const exists=await db.user.findUnique({where:{email},select:{id:true,email:true,name:true,role:true,status:true,passwordHash:true,updatedAt:true}});
  if(exists?.status==='SUSPENDED')return NextResponse.json({error:'Bu e-posta askıya alınmış bir hesaba bağlı. Hesap kalıcı olarak silinmeden aynı e-posta ile yeniden kayıt yapılamaz.'},{status:409});
  if(exists){
    if(exists.role==='COACH'&&exists.status==='PENDING'&&exists.passwordHash&&await verifySecret(input.password,exists.passwordHash)&&!(await isEmailVerified(exists.id))){
      const issued=await issueEmailVerification(req,exists);
      if(!issued.ok)return NextResponse.json({error:issued.error,retryAfterSeconds:'retryAfterSeconds' in issued?issued.retryAfterSeconds:undefined},{status:issued.status});
      return NextResponse.json({ok:true,userId:exists.id,verificationRequired:true,verificationChallenge:issued.challenge,email,message:issued.message});
    }
    return NextResponse.json({error:'Bu e-posta zaten kayıtlı.'},{status:409});
  }

  const user=await db.user.create({data:{name:input.name,email,passwordHash:await hashSecret(input.password),role:'COACH',status:'PENDING',coachProfile:{create:{}}}});
  await markEmailVerificationRequired(user.id);
  const issued=await issueEmailVerification(req,user);
  if(!issued.ok){
    return NextResponse.json({
      ok:true,userId:user.id,verificationRequired:true,verificationChallenge:null,email,
      message:'Koç hesabı oluşturuldu ancak doğrulama e-postası gönderilemedi. 60 saniye sonra kodu yeniden isteyebilirsiniz.'
    });
  }
  return NextResponse.json({ok:true,userId:user.id,verificationRequired:true,verificationChallenge:issued.challenge,email,message:'Koç hesabı oluşturuldu. Yönetici onayından önce e-posta adresinizi doğrulayın.'});
}

export const POST=withApiErrors(POST__handler);
