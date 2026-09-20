import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { encryptPrivateCode, hashSecret, randomCode } from '@/lib/security';
import { sendStudentCredentials } from '@/lib/mailer';
import { writeAudit } from '@/lib/audit';

const schema=z.object({
  fullName:z.string().min(2).max(120),
  email:z.string().email().refine(v=>v.toLowerCase().endsWith('@gmail.com'),'Gmail adresi kullanın.'),
  gradeLevel:z.string().min(1).max(80),
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

  const existing=await db.user.findUnique({where:{email}});
  if(existing)return NextResponse.json({error:'Bu Gmail adresiyle daha önce hesap oluşturulmuş.'},{status:409});

  const coach=await db.coachProfile.findFirst({
    where:{id:input.coachId,user:{status:'ACTIVE',role:'COACH'}},
    include:{user:{select:{name:true}}}
  });
  if(!coach)return NextResponse.json({error:'Seçilen koç aktif değil veya bulunamadı.'},{status:400});

  const studentCode=await uniqueStudentCode();
  const accessKey=randomCode('STD');
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
        fullName:input.fullName,
        gradeLevel:input.gradeLevel,
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

  const mail:any=await sendStudentCredentials({
    email,
    studentName:input.fullName,
    studentCode,
    accessKey,
    coachName:coach.user.name
  });

  const mailFailed=Boolean(mail?.skipped||mail?.error);
  if(mailFailed){
    await db.$transaction(async tx=>{
      await tx.academyCode.updateMany({where:{assignedStudentId:created.student.id},data:{assignedStudentId:null,active:false}});
      await tx.student.delete({where:{id:created.student.id}});
      await tx.user.delete({where:{id:created.user.id}});
    });
    return NextResponse.json({error:'Giriş bilgileri Gmail adresinize gönderilemedi. Lütfen daha sonra tekrar deneyin.'},{status:503});
  }

  await writeAudit({
    actorUserId:created.user.id,
    action:'STUDENT_APPLICATION_CREATED',
    entityType:'Student',
    entityId:created.student.id,
    summary:input.fullName+' öğrenci başvurusu oluşturuldu ve seçtiği koça bağlandı.',
    metadata:{coachId:coach.id,gradeLevel:input.gradeLevel,email}
  });

  return NextResponse.json({
    ok:true,
    message:'Başvurunuz alınmıştır. Öğrenci kodunuz ve giriş anahtarınız Gmail adresinize gönderildi. Seçtiğiniz koçun Öğrencilerim paneline eklendiniz.'
  });
}
