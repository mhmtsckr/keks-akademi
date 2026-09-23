import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { REVIEW_DAYS } from '@/lib/smartCoach';
import { classifyWrongQuestion } from '@/lib/wrongQuestionClassifier';
import { readJson,withApiErrors } from '@/lib/apiGuard';

const PRIVATE_PREFIX='STUDENT_WRONG:';
const patchSchema=z.object({questionId:z.string().min(1),topic:z.string().min(2).max(120)});

function sourceKind(studentId:string){return PRIVATE_PREFIX+studentId}
function meta(v:unknown){
  return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const studentId=user.student.id;
  const rows=await db.questionBankItem.findMany({
    where:{sourceKind:sourceKind(studentId),reviewStatus:'STUDENT_PRIVATE'},
    include:{reviewQueue:{where:{studentId},select:{id:true,stepIndex:true,dueAt:true,status:true,lastCorrect:true}}},
    orderBy:{createdAt:'desc'},
    take:50
  });
  return NextResponse.json({ok:true,items:rows.map(q=>{
    const m=meta(q.options);
    return {
      id:q.id,examType:q.examType,subject:q.subject,topic:q.topic,prompt:q.prompt,
      explanation:q.explanation,createdAt:q.createdAt,
      imageUrl:typeof m.imageUrl==='string'?m.imageUrl:null,
      originalStudentAnswer:typeof m.originalStudentAnswer==='string'?m.originalStudentAnswer:null,
      classificationConfidence:Number(m.classificationConfidence||0),
      classificationMethod:String(m.classificationMethod||''),
      review:q.reviewQueue[0]||null
    };
  })});
}

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const studentId=user.student.id;
  const fd=await req.formData();
  const examType=String(fd.get('examType')||'GENEL').trim().slice(0,50);
  const subject=String(fd.get('subject')||'').trim().slice(0,100);
  const questionText=String(fd.get('questionText')||'').trim().slice(0,6000);
  const correctAnswer=String(fd.get('correctAnswer')||'').trim().slice(0,1000);
  const originalStudentAnswer=String(fd.get('originalStudentAnswer')||'').trim().slice(0,1000);
  const explanation=String(fd.get('explanation')||'').trim().slice(0,3000);
  if(subject.length<2)return NextResponse.json({error:'Ders seçiniz.'},{status:400});
  if(correctAnswer.length<1)return NextResponse.json({error:'Doğru cevabı yazınız.'},{status:400});

  const rawFile=fd.get('image');
  const file=rawFile instanceof File&&rawFile.size>0?rawFile:null;
  if(!questionText&& !file)return NextResponse.json({error:'Soru metni veya soru fotoğrafı yüklemelisiniz.'},{status:400});
  if(file){
    if(file.size>5*1024*1024)return NextResponse.json({error:'Soru fotoğrafı en fazla 5 MB olabilir.'},{status:400});
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))return NextResponse.json({error:'Yalnız JPG, PNG veya WebP görsel yükleyebilirsiniz.'},{status:400});
  }

  const classificationText=[questionText,explanation,correctAnswer].filter(Boolean).join(' ');
  const classified=classifyWrongQuestion({examType,subject,text:classificationText});
  const now=new Date();

  const result=await db.$transaction(async tx=>{
    let uploadId:string|null=null;
    let imageUrl:string|null=null;
    if(file){
      const bytes=Buffer.from(await file.arrayBuffer());
      const upload=await tx.contentUpload.create({data:{
        studentId,ownerUserId:user.id,fileName:file.name||'yanlis-soru',
        mimeType:file.type,fileSize:file.size,fileData:bytes,
        sha256:createHash('sha256').update(bytes).digest('hex'),
        extractedText:questionText||null,category:'WRONG_QUESTION',isQuestionSource:true,status:'READY'
      }});
      uploadId=upload.id;
      imageUrl='/api/student/wrong-questions/image/'+upload.id;
    }

    const q=await tx.questionBankItem.create({data:{
      examType,subject,topic:classified.topic,
      prompt:questionText||'Görsel yanlış soru',
      options:{
        _kind:'STUDENT_WRONG',
        imageUrl,
        uploadId,
        originalStudentAnswer:originalStudentAnswer||null,
        classificationConfidence:classified.confidence,
        classificationMethod:classified.method
      },
      correctAnswer,
      explanation:explanation||null,
      sourceKind:sourceKind(studentId),
      active:false,
      reviewStatus:'STUDENT_PRIVATE'
    }});

    const review=await tx.reviewQueueItem.create({data:{
      studentId,questionId:q.id,stepIndex:0,dueAt:now,status:'DUE',lastCorrect:false
    }});
    return {q,review,imageUrl};
  });

  return NextResponse.json({
    ok:true,
    item:{
      id:result.q.id,examType,subject,topic:result.q.topic,prompt:result.q.prompt,
      imageUrl:result.imageUrl,classificationConfidence:classified.confidence,
      classificationMethod:classified.method,dueAt:result.review.dueAt,stepIndex:0
    },
    message:subject+' · '+result.q.topic+' olarak sınıflandırıldı ve 0. gün tekrar görevine eklendi.',
    scheduleDays:REVIEW_DAYS
  });
}

async function PATCH__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=await readJson(req,patchSchema);
  const q=await db.questionBankItem.findFirst({
    where:{id:input.questionId,sourceKind:sourceKind(user.student.id),reviewStatus:'STUDENT_PRIVATE'}
  });
  if(!q)return NextResponse.json({error:'Yanlış soru kaydı bulunamadı.'},{status:404});
  const row=await db.questionBankItem.update({where:{id:q.id},data:{topic:input.topic}});
  return NextResponse.json({ok:true,topic:row.topic});
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
export const PATCH=withApiErrors(PATCH__handler);
