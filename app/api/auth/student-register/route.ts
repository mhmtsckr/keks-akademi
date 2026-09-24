import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import crypto from 'node:crypto';
import { encryptPrivateCode, hashSecret, randomCode,verifySecret } from '@/lib/security';
import { passwordPolicyMessage } from '@/lib/passwordPolicy';
import { writeAudit } from '@/lib/audit';
import { normalizeEducationLevelLabel } from '@/lib/taskEvaluation';
import { AGS_OABT_FIELDS,isAgsOabtLabel,isAgsYdsLabel } from '@/lib/agsExamOptions';
import { withOabtFieldApproval } from '@/lib/oabtFieldApproval';
import { isEmailVerified,issueEmailVerification,markEmailVerificationRequired } from '@/lib/emailVerification';

const schema=z.object({
  fullName:z.string().min(2).max(120),
  email:z.string().email().refine(v=>v.toLowerCase().endsWith('@gmail.com'),'Gmail adresi kullanın.'),
  gradeLevel:z.string().min(1).max(80),
  academicTrack:z.string().max(120).nullable().optional(),
  coachId:z.string().min(1),
  password:z.string().min(12).max(128)
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
  const passwordError=passwordPolicyMessage(input.password);
  if(passwordError)return NextResponse.json({error:passwordError},{status:400});
  const email=input.email.trim().toLowerCase();
  const gradeLevel=normalizeEducationLevelLabel(input.gradeLevel)||input.gradeLevel.trim();
  const isAgsOabt=isAgsOabtLabel(gradeLevel);
  const isAgsYds=isAgsYdsLabel(gradeLevel);
  const requestedTrack=(input.academicTrack||'').trim();
  if(isAgsOabt&&!AGS_OABT_FIELDS.includes(requestedTrack as any)){
    return NextResponse.json({error:'AGS/ÖABT için geçerli bir alan seçiniz.'},{status:400});
  }
  const registrationTime=new Date().toISOString();
  const academicTrack=isAgsOabt?requestedTrack:isAgsYds?'YDS':(requestedTrack||null);
  const initialProfile=isAgsOabt?withOabtFieldApproval(null,{
    status:'APPROVED',
    requestedField:requestedTrack,
    requestedAt:registrationTime,
    approvedField:requestedTrack,
    approvedAt:registrationTime,
    approvedByUserId:null,
    rejectedAt:null,
    rejectedByUserId:null,
    rejectionNote:null
  }):null;

  const existing=await db.user.findUnique({where:{email}});
  if(existing?.status==='SUSPENDED'){
    return NextResponse.json({error:'Bu Gmail adresi askıya alınmış bir hesaba bağlı. Hesap kalıcı olarak silinmeden aynı Gmail ile yeniden kayıt yapılamaz.'},{status:409});
  }
  if(existing){
    if(existing.role==='STUDENT'&&existing.status==='PENDING'&&existing.passwordHash&&await verifySecret(input.password,existing.passwordHash)&&!(await isEmailVerified(existing.id))){
      const pending=await db.user.findUnique({where:{id:existing.id},select:{id:true,email:true,name:true,updatedAt:true}});
      if(!pending)return NextResponse.json({error:'Kayıt bulunamadı.'},{status:404});
      const issued=await issueEmailVerification(req,pending);
      if(!issued.ok)return NextResponse.json({error:issued.error,retryAfterSeconds:'retryAfterSeconds' in issued?issued.retryAfterSeconds:undefined},{status:issued.status});
      return NextResponse.json({ok:true,verificationRequired:true,verificationChallenge:issued.challenge,email,message:issued.message});
    }
    return NextResponse.json({error:'Bu Gmail adresiyle daha önce hesap oluşturulmuş.'},{status:409});
  }

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
      data:{name:input.fullName,email,passwordHash:await hashSecret(input.password),role:'STUDENT',status:'PENDING'}
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
        ...(initialProfile?{profile:initialProfile as any}:{}),
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

  await markEmailVerificationRequired(created.user.id);
  const issued=await issueEmailVerification(req,{
    id:created.user.id,
    email:created.user.email,
    name:created.user.name,
    updatedAt:created.user.updatedAt
  });

  await writeAudit({
    actorUserId:created.user.id,
    action:'STUDENT_APPLICATION_CREATED',
    entityType:'Student',
    entityId:created.student.id,
    summary:input.fullName+' öğrenci başvurusu oluşturuldu, seçtiği koça bağlandı ve yönetici kayıtlarına otomatik KEKS ürün kodu eklendi.',
    metadata:{coachId:coach.id,gradeLevel,academicTrack,requestedOabtField:isAgsOabt?requestedTrack:null,oabtApprovalStatus:isAgsOabt?'APPROVED':null,oabtAutoApproved:isAgsOabt,email,automaticKeksProductCode:true}
  });

  return NextResponse.json({
    ok:true,
    verificationRequired:true,
    verificationChallenge:issued.ok?issued.challenge:null,
    email,
    message:issued.ok
      ?'Başvurunuz oluşturuldu. Hesabınızı aktifleştirmek için Gmail adresinize gönderilen 6 haneli kodu doğrulayın.'
      :'Başvurunuz oluşturuldu ancak doğrulama e-postası gönderilemedi. 60 saniye sonra yeni kod isteyebilirsiniz.'
  });
}

