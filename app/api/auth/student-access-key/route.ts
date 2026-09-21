import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { decryptPrivateCode } from '@/lib/security';
import { resendStudentAccessKey } from '@/lib/mailer';
import { writeAudit } from '@/lib/audit';
import { readJson,withApiErrors } from '@/lib/apiGuard';

const schema=z.object({
  studentCode:z.string().min(2).max(32),
  fullName:z.string().min(2).max(120),
  email:z.string().email().max(254)
});

function sameName(a:string,b:string){
  return a.trim().localeCompare(b.trim(),'tr',{sensitivity:'base'})===0;
}

async function POST__handler(req:Request){
  const input=await readJson(req,schema);
  const student=await db.student.findUnique({
    where:{studentCode:input.studentCode.trim()},
    include:{
      user:{select:{email:true}},
      coach:{select:{user:{select:{name:true}}}}
    }
  });

  const expectedEmail=student?.user?.email?.trim().toLowerCase();
  const suppliedEmail=input.email.trim().toLowerCase();
  if(!student||!expectedEmail||expectedEmail!==suppliedEmail||!sameName(student.fullName,input.fullName)){
    return NextResponse.json({error:'Öğrenci kodu, ad soyad veya kayıtlı Gmail bilgisi eşleşmedi.'},{status:400});
  }

  if(student.accessKeyExpiresAt&&student.accessKeyExpiresAt.getTime()<=Date.now()){
    return NextResponse.json({
      error:'Giriş anahtarınızın 1 yıllık geçerlilik süresi dolmuştur. Süresi dolmuş anahtar yeniden gönderilemez; yöneticiden yeni giriş anahtarı isteyin.',
      code:'ACCESS_KEY_EXPIRED'
    },{status:403});
  }

  if(!student.accessKeyCiphertext){
    return NextResponse.json({
      error:'Bu öğrenci eski kayıt sisteminden aktarılmış. Mevcut giriş anahtarı güvenlik nedeniyle geri çözülemiyor; yöneticiden yeni anahtar oluşturmasını isteyin.'
    },{status:409});
  }

  if(student.credentialsEmailedAt&&Date.now()-student.credentialsEmailedAt.getTime()<60_000){
    return NextResponse.json({error:'Giriş bilgileri kısa süre önce gönderildi. Lütfen 60 saniye sonra tekrar deneyin.'},{status:429});
  }

  let accessKey:string;
  try{accessKey=decryptPrivateCode(student.accessKeyCiphertext)}
  catch{return NextResponse.json({error:'Giriş anahtarı güvenli kayıttan okunamadı. Yönetici desteği gerekli.'},{status:500})}

  const mail:any=await resendStudentAccessKey({
    email:expectedEmail,
    studentName:student.fullName,
    studentCode:student.studentCode,
    accessKey,
    accessKeyExpiresAt:student.accessKeyExpiresAt
  });
  if(mail?.skipped||mail?.error){
    return NextResponse.json({error:'E-posta gönderim servisi şu anda hazır değil. Yöneticiyle iletişime geçin.'},{status:503});
  }

  await db.student.update({
    where:{id:student.id},
    data:{
      credentialsDeliveryStatus:'SENT',
      credentialsEmailedAt:new Date(),
      credentialEmailAttempts:{increment:1}
    }
  });
  await writeAudit({
    actorUserId:student.userId,
    action:'STUDENT_ACCESS_KEY_RESENT',
    entityType:'Student',
    entityId:student.id,
    summary:student.fullName+' öğrencisinin mevcut giriş anahtarı doğrulama sonrası kayıtlı e-posta adresine yeniden gönderildi.',
    metadata:{studentCode:student.studentCode}
  });

  return NextResponse.json({ok:true,message:'Bilgiler doğrulandı. Mevcut giriş anahtarınız kayıtlı Gmail adresinize yeniden gönderildi.'});
}

export const POST=withApiErrors(POST__handler);
