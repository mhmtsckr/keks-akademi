import { readJson, withApiErrors } from '@/lib/apiGuard';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashSecret, verifySecret } from '@/lib/security';
import { createSession } from '@/lib/auth';
import { checkLoginLimit,recordLoginFailure,recordLoginSuccess } from '@/lib/authAbuse';

const schema = z.object({
  email:z.string().email(),
  password:z.string().min(1),
  remember:z.boolean().optional().default(false)
});

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

async function POST__handler(req: Request) {
  const input = await readJson(req, schema);
  const email = input.email.trim().toLowerCase();
  const gate=await checkLoginLimit(req,email);
  if(!gate.allowed){
    return NextResponse.json({
      error:'Çok fazla başarısız giriş denemesi yapıldı. Lütfen bir süre sonra tekrar deneyin.',
      retryAfterSeconds:gate.retryAfterSeconds
    },{status:429,headers:{'Retry-After':String(gate.retryAfterSeconds)}});
  }

  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    await recordLoginFailure(req,email);
    return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 });
  }

  let passwordOk=false;
  if (!user.passwordHash) {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || '';
    const canBootstrap = user.role === 'ADMIN' && email === adminEmail && initialPassword && safeEqual(input.password, initialPassword);
    if(canBootstrap){
      user=await db.user.update({where:{id:user.id},data:{passwordHash:await hashSecret(input.password),status:'ACTIVE'}});
      passwordOk=true;
    }
  }else{
    passwordOk=await verifySecret(input.password,user.passwordHash);
  }

  if(!passwordOk){
    await recordLoginFailure(req,email);
    return NextResponse.json({
      error:user.role==='STUDENT'&&!user.passwordHash
        ?'Bu eski öğrenci hesabında henüz şifre oluşturulmamış. Şifremi unuttum bağlantısını kullanarak şifre oluşturun.'
        :'E-posta veya şifre hatalı.'
    },{status:401});
  }

  if (user.status === 'SUSPENDED') return NextResponse.json({ error: 'Bu hesap askıya alınmış durumda.' }, { status: 403 });
  if (user.status !== 'ACTIVE') return NextResponse.json({ error: 'Hesap henüz aktif değil.' }, { status: 403 });

  await recordLoginSuccess(req,email,user.id);

  if(user.role==='ADMIN'){
    await createSession(user.id,input.remember,req);
    return NextResponse.json({ok:true,role:'ADMIN'});
  }

  await createSession(user.id,input.remember,req);
  return NextResponse.json({ ok: true, role: user.role });
}

export const POST = withApiErrors(POST__handler);
