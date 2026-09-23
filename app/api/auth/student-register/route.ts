import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { encryptPrivateCode, hashSecret, randomCode } from '@/lib/security';
import { createSession } from '@/lib/auth';
import { sendStudentCredentials } from '@/lib/mailer';
import { writeAudit } from '@/lib/audit';
import { normalizeEducationLevelLabel } from '@/lib/taskEvaluation';
import { AGS_OABT_FIELDS,isAgsOabtLabel,isAgsYdsLabel } from '@/lib/agsExamOptions';

const schema=z.object({
  fullName:z.string().min(2).max(120),
  email:z.string().email().refine(v=>v.toLowerCase().endsWith('@gmail.com'),'Gmail adresi kullanın.'),
  gradeLevel:z.string().min(1).max(80),
  academicTrack:z.string().max(120).nullable().optional(),
  coachId:z.string().min(1)
});

async function uniqueStudentCode(){
  for(let i=0;i<25;i++){
    const code=String(Math.floor(100000+Math.random()*900000));
    if(!(await db.student.findUnique({where:{studentCode:code}})))return code;
  }
  throw new Error('STUDENT_CODE_EXHAUSTED');
}

export async function POST(req:Request){
  let body:unknown;
  try{body=await req.json()}catch{return NextResponse.json({error:'Geçersiz kayıt isteği.'},{status:400})}
  const parsed=schema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||'Kayıt bilgileri eksik.'},{status:400});
  const input=parsed.data;
  const email=input.email.toLowerCase();
  const gradeLevel=normalizeEducationLevelLabel(input.gradeLevel)||input.gradeLevel.trim();
  const isAgsOabt=isAgsOabtLabel(gradeLevel);
  const isAgsYds=isAgsYdsLabel(gradeLevel);
  const requestedTrack=(input.academicTrack||'').trim();
  if(isAgsOabt&&!AGS_OABT_FIELDS.includes(requestedTrack as any)){
    return NextResponse.json({error:'AGS/ÖABT için geçerli bir alan seçiniz.'},{status:400});
  }
  const academicTrack=isAgsOabt?requestedTrack:isAgsYds?'YDS':(requestedTrack||null);

  const existing=await db.user.findUnique({where:{email}});
  if(existing)return NextResponse.json({error:'Bu Gmail adresiyle daha önce hesap oluşturulmuş.'},{status:409});

  const coach=await db.coachProfile.findFirst({
    where:{id:input.coachId,user:{status:'ACTIVE',role:'COACH'}},
    include:{user:{select:{name:true}}}
  });
  if(!coach)return NextResponse.json({error:'Seçilen koç aktif değil veya bulunamadı.'},{status:400});

  const studentCode=await uniqueStudentCode();
  const accessKey=randomCode('STD');
  const accessKeyExpiresAt=new Date();
  accessKeyExpiresAt.setUTCFullYear(accessKeyExpiresAt.getUTCFullYear()+1);
  const monthlyCode=randomCode('KEKS');

  const created=await db.$transaction(async tx=>{
    const user=await tx.user.create({
      data:{name:input.fullName,email,role:'STUDENT',status:'ACTIVE'}
    });
    const student=await tx.student.create({
      data:{
        userId:user.id,
        studentCode,
        accessKeyHash:await hashSecret(accessKey),
        accessKeyCiphertext:encryptPrivateCode(accessKey),
        accessKeyExpiresAt,
        credentialsDeliveryStatus:'PENDING',
        credentialEmailAttempts:0,
        fullName:input.fullName,
        gradeLevel,
        academicTrack,
        coachId:coach.id
      }
    });
    await tx.academyCode.create({
      data:{
        codeHash:await hashSecret(monthlyCode),
        codeHint:monthlyCode.slice(-4),
        codeCiphertext:encryptPrivateCode(monthlyCode),
        assignedStudentId:student.id,
        maxUses:1,
        useCount:0,
        active:true,
        monthlyRecurring:true,
        createdByUserId:coach.userId
      }
    });
    return {user,student};
  });

  let mailSent=false;
  try{
    const mail:any=await sendStudentCredentials({
      email,
      studentName:input.fullName,
      studentCode,
      accessKey,
      accessKeyExpiresAt,
      coachName:coach.user.name
    });
    mailSent=!Boolean(mail?.skipped||mail?.error);
  }catch{
    mailSent=false;
  }

  await db.student.update({
    where:{id:created.student.id},
    data:{
      credentialsDeliveryStatus:mailSent?'SENT':'PENDING',
      credentialsEmailedAt:mailSent?new Date():null,
      credentialEmailAttempts:{increment:1}
    }
  });

  await writeAudit({
    actorUserId:created.user.id,
    action:'STUDENT_APPLICATION_CREATED',
    entityType:'Student',
    entityId:created.student.id,
    summary:input.fullName+' öğrenci başvurusu oluşturuldu, seçtiği koça bağlandı ve yönetici kayıtlarına otomatik KEKS ürün kodu eklendi.',
    metadata:{coachId:coach.id,gradeLevel,academicTrack,email,automaticKeksProductCode:true}
  });

  await createSession(created.user.id);

  return NextResponse.json({
    ok:true,
    emailStatus:mailSent?'SENT':'PENDING',
    message:mailSent
      ? 'Başvurunuz alınmıştır. Öğrenci kodunuz ve 1 yıl geçerli giriş anahtarınız Gmail adresinize gönderildi. Seçtiğiniz koçun Öğrencilerim paneline eklendiniz.'
      : 'Başvurunuz alınmıştır ve seçtiğiniz koça bağlandınız. Gmail gönderimi şu anda bekliyor; bilgileriniz sistemde güvenli biçimde saklandı ve tekrar gönderilebilir.'
  });
}
