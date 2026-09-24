import { readJson, withApiErrors } from '@/lib/apiGuard';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashSecret, verifySecret } from '@/lib/security';
import { createSession } from '@/lib/auth';
import { checkCodeSendLimit,checkLoginLimit,recordLoginFailure,recordLoginSuccess,reserveCodeSend } from '@/lib/authAbuse';
import { createAuthChallenge } from '@/lib/authChallenge';
import { sendAdminTwoFactorCode } from '@/lib/mailer';

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
    if(!user.email)return NextResponse.json({error:'Yönetici hesabında 2FA için e-posta adresi bulunmuyor.'},{status:409});
    const sendGate=await checkCodeSendLimit('ADMIN_2FA',req,user.id,{accountDaily:15,ipDaily:40,cooldownSeconds:60});
    if(!sendGate.allowed){
      return NextResponse.json({
        error:sendGate.reason==='COOLDOWN'
          ?'Yeni yönetici doğrulama kodu için 60 saniye bekleyin.'
          :'Yönetici doğrulama kodu gönderim sınırına ulaşıldı.',
        retryAfterSeconds:sendGate.retryAfterSeconds
      },{status:429,headers:{'Retry-After':String(sendGate.retryAfterSeconds)}});
    }
    await reserveCodeSend('ADMIN_2FA',req,user.id);
    const challenge=await createAuthChallenge({user,purpose:'ADMIN_2FA',expiresIn:'10m',remember:input.remember});
    const sent:any=await sendAdminTwoFactorCode({email:user.email,name:user.name,code:challenge.code});
    if(sent?.skipped||sent?.error)return NextResponse.json({error:'Yönetici 2FA e-postası gönderilemedi.'},{status:503});
    return NextResponse.json({
      ok:true,
      requiresTwoFactor:true,
      challenge:challenge.token,
      message:'Yönetici doğrulama kodu e-posta adresinize gönderildi.'
    });
  }

  await createSession(user.id,input.remember,req);
  return NextResponse.json({ ok: true, role: user.role });
}

export const POST = withApiErrors(POST__handler);
