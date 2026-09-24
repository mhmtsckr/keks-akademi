import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyExternalAssessmentToken } from '@/lib/externalAssessment';
import { buildReport } from '@/lib/scoring';
import { detectEducationBand } from '@/lib/taskEvaluation';
import { sendAssessmentReport } from '@/lib/mailer';

const ALLOWED_ORIGIN='https://kazandiran-egitim-kocluk.mhmtsckr029.chatgpt.site';

const schema=z.object({
  token:z.string().min(20),
  formVersion:z.string().min(1).max(100).default('CHATGPT_SITE_V1'),
  answers:z.unknown().optional(),
  scores:z.record(z.number().finite().min(0).max(5)),
  report:z.record(z.unknown()).optional(),
  externalSubmissionId:z.string().max(128).optional(),
  completedAt:z.string().datetime().optional()
}).refine(v=>Object.keys(v.scores).length>0&&Object.keys(v.scores).length<=30,{
  message:'Geçerli eğilim puanları gerekli.'
});

function corsHeaders(){
  return {
    'Access-Control-Allow-Origin':ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Max-Age':'86400',
    'Vary':'Origin'
  };
}

function json(data:unknown,status=200){
  return NextResponse.json(data,{status,headers:corsHeaders()});
}

export async function OPTIONS(req:Request){
  const origin=req.headers.get('origin');
  if(origin&&origin!==ALLOWED_ORIGIN)return new Response(null,{status:403});
  return new Response(null,{status:204,headers:corsHeaders()});
}

export async function POST(req:Request){
  const origin=req.headers.get('origin');
  if(origin&&origin!==ALLOWED_ORIGIN)return json({error:'Bu kaynaktan gönderime izin verilmiyor.'},403);

  let input:z.infer<typeof schema>;
  try{
    input=schema.parse(await req.json());
  }catch(error){
    return json({error:'Tarama sonucu biçimi geçersiz.',details:error instanceof Error?error.message:undefined},400);
  }

  let claims:{studentId:string;accessId:string};
  try{
    claims=await verifyExternalAssessmentToken(input.token);
  }catch{
    return json({error:'Tarama oturumu geçersiz veya süresi dolmuş.'},401);
  }

  const access=await db.testAccess.findUnique({where:{id:claims.accessId}});
  if(!access||access.studentId!==claims.studentId)return json({error:'Tarama erişimi bulunamadı.'},403);

  if(access.status==='USED'){
    const existing=await db.assessment.findFirst({
      where:{studentId:claims.studentId,completedAt:{gte:access.createdAt}},
      orderBy:{completedAt:'desc'}
    });
    if(existing)return json({ok:true,alreadySubmitted:true,assessmentId:existing.id});
    return json({error:'Bu tarama erişimi daha önce kullanılmış.'},409);
  }
  if(access.status!=='READY')return json({error:'Tarama erişimi aktif değil.'},403);

  const student=await db.student.findUnique({
    where:{id:claims.studentId},
    select:{id:true,studentCode:true,fullName:true,gradeLevel:true,coachId:true}
  });
  if(!student)return json({error:'Öğrenci bulunamadı.'},404);

  const baseReport=buildReport(input.scores);
  const report={
    ...baseReport,
    ...(input.report||{}),
    scores:input.scores,
    source:'CHATGPT_SITE',
    externalSubmissionId:input.externalSubmissionId||null,
    receivedAt:new Date().toISOString()
  };

  const educationBand=detectEducationBand(student.gradeLevel);
  const activeForm=student.coachId?await db.preInterviewForm.findFirst({
    where:{active:true,educationBand},
    orderBy:{createdAt:'desc'}
  }):null;

  let preInterviewOpened=false;
  let assessmentId='';

  try{
    await db.$transaction(async tx=>{
      const claim=await tx.testAccess.updateMany({
        where:{id:access.id,studentId:student.id,status:'READY'},
        data:{status:'USED',usedAt:new Date()}
      });
      if(claim.count!==1)throw new Error('ACCESS_ALREADY_USED');

      const assessment=await tx.assessment.create({data:{
        studentId:student.id,
        formVersion:input.formVersion,
        answers:(input.answers??{}) as any,
        scores:input.scores as any,
        report:report as any,
        completedAt:input.completedAt?new Date(input.completedAt):new Date()
      }});
      assessmentId=assessment.id;

      if(student.coachId&&activeForm){
        const current=await tx.preInterviewAssignment.findFirst({
          where:{
            studentId:student.id,
            coachId:student.coachId,
            status:{in:['ASSIGNED','COMPLETED','APPROVED']},
            revokedAt:null
          },
          orderBy:{assignedAt:'desc'}
        });
        if(!current){
          await tx.preInterviewAssignment.create({data:{
            studentId:student.id,
            coachId:student.coachId,
            formId:activeForm.id,
            status:'ASSIGNED'
          }});
          preInterviewOpened=true;
        }
      }

      await tx.coachAlert.create({data:{
        studentId:student.id,
        kind:'ASSESSMENT:'+assessment.id,
        severity:'MEDIUM',
        title:'KEKS Eğilim Taraması tamamlandı',
        message:preInterviewOpened
          ?'Eğilim taraması tamamlandı ve sonuçlar koç incelemesine alındı. Ön görüşme formu öğrenciye otomatik açıldı.'
          :'Eğilim taraması tamamlandı ve ayrıntılı sonuçlar koç paneline aktarıldı.'
      }});
    });
  }catch(error){
    if(error instanceof Error&&error.message==='ACCESS_ALREADY_USED'){
      const existing=await db.assessment.findFirst({
        where:{studentId:student.id,completedAt:{gte:access.createdAt}},
        orderBy:{completedAt:'desc'}
      });
      if(existing)return json({ok:true,alreadySubmitted:true,assessmentId:existing.id});
    }
    console.error('EXTERNAL_ASSESSMENT_SAVE_FAILED',error);
    return json({error:'Tarama sonucu KEKS sistemine kaydedilemedi.'},500);
  }

  try{
    await sendAssessmentReport({
      studentCode:student.studentCode,
      studentName:student.fullName,
      assessmentId,
      report
    });
    await db.assessment.update({where:{id:assessmentId},data:{emailedAt:new Date()}});
  }catch(error){
    console.error('EXTERNAL_ASSESSMENT_EMAIL_FAILED',error);
  }

  return json({
    ok:true,
    assessmentId,
    preInterviewOpened,
    message:'Tarama sonucu KEKS hesabına aktarıldı.'
  });
}
