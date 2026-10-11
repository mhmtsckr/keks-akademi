import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {selectRemediationQuestions} from '@/lib/wrongQuestionRemediation';

const schema=z.object({reviewId:z.string().min(1)});
function record(v:unknown):Record<string,unknown>{
  return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}
async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=await readJson(req,schema);
  const review=await db.reviewQueueItem.findFirst({
    where:{id:input.reviewId,studentId:user.student.id},include:{question:true}
  });
  if(!review)return NextResponse.json({error:'Tekrar kaydı bulunamadı.'},{status:404});

  const origin=review.question;
  // Pool is limited to public, pedagogically approved questions; never include student uploads.
  const candidates=await db.questionBankItem.findMany({
    where:{examType:origin.examType,subject:origin.subject,topic:origin.topic,active:true,reviewStatus:'APPROVED'},
    orderBy:{createdAt:'desc'},take:40
  });
  const selected=selectRemediationQuestions(origin,candidates,2);
  if(!selected.length)return NextResponse.json({
    error:'Bu kazanımda onaylı farklı soru bulunamadı. Konu açıklamasını incele ve koçundan yeni örnek iste.'
  },{status:404});

  const questionIds=selected.map(q=>q.id);
  const quiz=await db.practiceQuiz.create({data:{
    studentId:user.student.id,
    title:'Kazanım Pekiştirme · '+origin.subject+' / '+origin.topic,
    examType:'KAZANIM_TEKRAR',
    subject:origin.subject,topic:origin.topic,
    questionIds,
    createdByUserId:user.id
  }});

  return NextResponse.json({
    ok:true,quiz:{id:quiz.id,title:quiz.title},questions:selected.map(q=>{
      const opts=record((q as typeof candidates[number]).options);
      const options=Object.fromEntries(Object.entries(opts).filter(([key,val])=>
        !key.startsWith('_')&&!['imageUrl','uploadId','originalStudentAnswer','classificationConfidence','classificationMethod'].includes(key)
        &&typeof val==='string'
      ));
      return {
        id:q.id,subject:q.subject,topic:q.topic,prompt:q.prompt,options,
        inputMode:Object.keys(options).length?'CHOICE':'TEXT'
      };
    })
  });
}

export const POST=withApiErrors(POST__handler);
