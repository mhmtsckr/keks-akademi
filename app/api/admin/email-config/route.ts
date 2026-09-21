import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { encryptPrivateCode } from '@/lib/security';
import { sendGmailSmtp } from '@/lib/gmailSmtp';
import { writeAudit } from '@/lib/audit';
import { readJson,withApiErrors } from '@/lib/apiGuard';

const SENDER='keksakademi@gmail.com';
const schema=z.object({appPassword:z.string().min(16).max(64)});

async function GET__handler(){
  await requireRole(['ADMIN']);
  const config=await db.emailSenderConfig.findUnique({where:{id:'gmail'}});
  return NextResponse.json({
    ok:true,
    configured:Boolean(config?.enabled),
    email:config?.email||SENDER,
    updatedAt:config?.updatedAt||null
  });
}

async function POST__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req,schema);
  const appPassword=input.appPassword.replace(/\s+/g,'');
  if(!/^[A-Za-z0-9]{16}$/.test(appPassword)){
    return NextResponse.json({error:'Google uygulama şifresi 16 karakter olmalıdır.'},{status:400});
  }

  try{
    await sendGmailSmtp({
      username:SENDER,
      appPassword,
      to:SENDER,
      subject:'KEKS Akademi | Gmail bağlantı testi',
      html:'<h2>KEKS Akademi Gmail bağlantısı başarılı</h2><p>Öğrenci kayıt e-postaları artık bu Gmail hesabı üzerinden otomatik gönderilebilir.</p>'
    });
  }catch(error){
    const detail=error instanceof Error?error.message:'GMAIL_CONNECTION_FAILED';
    return NextResponse.json({error:'Gmail bağlantısı doğrulanamadı. Uygulama şifresini ve 2 Adımlı Doğrulamayı kontrol edin.',detail},{status:400});
  }

  await db.emailSenderConfig.upsert({
    where:{id:'gmail'},
    update:{email:SENDER,appPasswordCiphertext:encryptPrivateCode(appPassword),enabled:true},
    create:{id:'gmail',email:SENDER,appPasswordCiphertext:encryptPrivateCode(appPassword),enabled:true}
  });

  await writeAudit({
    actorUserId:admin.id,
    action:'GMAIL_SENDER_CONNECTED',
    entityType:'EmailSenderConfig',
    entityId:'gmail',
    summary:'KEKS Akademi öğrenci kayıt e-postaları için Gmail göndericisi doğrulandı ve etkinleştirildi.',
    metadata:{email:SENDER}
  });

  return NextResponse.json({ok:true,email:SENDER,message:'Gmail bağlantısı doğrulandı. Kayıt e-postaları bu hesaptan otomatik gönderilecek.'});
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
