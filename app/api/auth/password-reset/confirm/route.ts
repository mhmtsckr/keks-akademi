import crypto from 'node:crypto';
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashSecret } from '@/lib/security';
import { passwordPolicyMessage } from '@/lib/passwordPolicy';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { writeAudit } from '@/lib/audit';

const schema=z.object({
  challenge:z.string().min(20),
  code:z.string().regex(/^\d{6}$/),
  password:z.string().min(12).max(128)
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
function safeEqualHex(a:string,b:string){
  const aa=Buffer.from(a,'hex');
  const bb=Buffer.from(b,'hex');
  return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);
}

async function POST__handler(req:Request){
  const input=await readJson(req,schema);
  const passwordError=passwordPolicyMessage(input.password);
  if(passwordError)return NextResponse.json({error:passwordError},{status:400});

  let payload:any;
  try{
    payload=(await jwtVerify(input.challenge,jwtSecret())).payload;
  }catch{
    return NextResponse.json({error:'Doğrulama süresi dolmuş veya doğrulama bilgisi geçersiz. Yeni kod isteyin.'},{status:400});
  }

  if(payload.purpose!=='password-reset'||!payload.sub||typeof payload.nonce!=='string'||typeof payload.codeHash!=='string'){
    return NextResponse.json({error:'Geçersiz şifre yenileme isteği.'},{status:400});
  }

  const user=await db.user.findUnique({where:{id:String(payload.sub)},select:{id:true,status:true,updatedAt:true}});
  if(!user||user.status==='SUSPENDED')return NextResponse.json({error:'Hesap şifre yenilemeye uygun değil.'},{status:403});
  if(user.updatedAt.toISOString()!==payload.nonce){
    return NextResponse.json({error:'Bu doğrulama kodu artık geçerli değil. Yeni kod isteyin.'},{status:400});
  }

  const actual=hashCode(user.id,input.code,payload.nonce);
  if(!safeEqualHex(actual,payload.codeHash)){
    return NextResponse.json({error:'Doğrulama kodu hatalı.'},{status:400});
  }

  const updated=await db.user.update({
    where:{id:user.id},
    data:{passwordHash:await hashSecret(input.password),updatedAt:new Date()},
    select:{id:true}
  });
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
