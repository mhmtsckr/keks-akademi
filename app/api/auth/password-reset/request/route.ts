import crypto from 'node:crypto';
import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { sendPasswordResetCode } from '@/lib/mailer';
import { readJson,withApiErrors } from '@/lib/apiGuard';

const schema=z.object({
  email:z.string().email(),
  role:z.enum(['STUDENT','COACH']),
  studentCode:z.string().trim().min(2).max(32).optional(),
  fullName:z.string().trim().min(2).max(120).optional()
});

function jwtSecret(){
  const secret=process.env.AUTH_SECRET;
  if(!secret)throw new Error('AUTH_SECRET_MISSING');
  return new TextEncoder().encode(secret);
}
function hashCode(userId:string,code:string,nonce:string){
  const secret=process.env.AUTH_SECRET||'';
  return crypto.createHmac('sha256',secret).update(userId+'|'+nonce+'|'+code).digest('hex');
}

async function POST__handler(req:Request){
  const input=await readJson(req,schema);
  const email=input.email.trim().toLowerCase();
  const user=await db.user.findUnique({
    where:{email},
    include:{student:{select:{studentCode:true}}}
  });

  const roleMatches=user&&user.role===input.role;
  const infoMatches=input.role==='STUDENT'
    ?Boolean(user?.student&&input.studentCode&&user.student.studentCode===input.studentCode.trim())
    :Boolean(user&&input.fullName&&user.name.trim().toLocaleLowerCase('tr-TR')===input.fullName.trim().toLocaleLowerCase('tr-TR'));

  if(!user||!roleMatches||!infoMatches||user.status==='SUSPENDED'){
    return NextResponse.json({
      ok:true,
      sent:false,
      message:'Bilgiler kayıtlarla eşleşirse doğrulama kodu kayıtlı e-posta adresine gönderilir.'
    });
  }

  const code=String(crypto.randomInt(100000,1000000));
  const nonce=user.updatedAt.toISOString();
  const codeHash=hashCode(user.id,code,nonce);
  const challenge=await new SignJWT({
    purpose:'password-reset',
    role:input.role,
    nonce,
    codeHash
  })
    .setProtectedHeader({alg:'HS256'})
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(jwtSecret());

  const sent=await sendPasswordResetCode({email,name:user.name,code});
  if((sent as any)?.skipped){
    return NextResponse.json({error:'Doğrulama e-postası şu anda gönderilemiyor. Lütfen daha sonra tekrar deneyin.'},{status:503});
  }

  return NextResponse.json({
    ok:true,
    sent:true,
    challenge,
    message:'6 haneli doğrulama kodu e-posta adresinize gönderildi. Kod 10 dakika geçerlidir.'
  });
}

export const POST=withApiErrors(POST__handler);
