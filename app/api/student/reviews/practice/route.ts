import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {resolveLearningCurriculumContext} from '@/lib/curriculumPolicy2026';
import {buildSubjectRecoveryPlan} from '@/lib/subjectRecoveryPlan';
import {chooseFreshSubjectPractice,SUBJECT_PRACTICE_DAILY_LIMIT,
 SUBJECT_PRACTICE_HISTORY_LIMIT} from '@/lib/subjectIndependentPractice';

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
  const originMeta=record(origin.options);
  const curriculum=resolveLearningCurriculumContext({
    gradeLevel:user.student.gradeLevel,
    selectedGrade:typeof originMeta.educationGrade==='number'?originMeta.educationGrade:null,
    examType:origin.examType
  });
  if(curriculum.framework==='UNRESOLVED')return NextResponse.json({
    error:'Öğrencinin gerçek sınıfı veya sınav kapsamı belirli değil. Farklı soru sunmadan önce eğitim düzeyini doğrulayın.',
    code:'EDUCATION_LEVEL_UNRESOLVED',curriculum
  },{status:409});
  // All previous generated quizzes count as exposure, even if never submitted.
  // Also avoid giving the student a question already in their personal review queue.
  const [priorQuizzes,reviewedQuestions,dailyCount,candidates]=await Promise.all([
    db.practiceQuiz.findMany({
      where:{studentId:user.student.id},
      select:{questionIds:true},orderBy:{createdAt:'desc'},
      take:SUBJECT_PRACTICE_HISTORY_LIMIT+1
    }),
    db.reviewQueueItem.findMany({
      where:{studentId:user.student.id},
      select:{questionId:true},take:SUBJECT_PRACTICE_HISTORY_LIMIT+1
    }),
    db.practiceQuiz.count({where:{
      studentId:user.student.id,examType:'KAZANIM_TEKRAR',
      createdAt:{gte:new Date(Date.now()-86400000)}
    }}),
    db.questionBankItem.findMany({
      where:{examType:origin.examType,subject:origin.subject,topic:origin.topic,
       active:true,reviewStatus:'APPROVED'},
      orderBy:{createdAt:'desc'},take:120
    })
  ]);
  if(priorQuizzes.length>SUBJECT_PRACTICE_HISTORY_LIMIT||
     reviewedQuestions.length>SUBJECT_PRACTICE_HISTORY_LIMIT)
    return NextResponse.json({
      error:'Önceden görüntülenen soruların kayıt sınırı doldu. Eski soru yeniymiş gibi sunulmasın diye otomatik seçim durduruldu.',
      code:'EXPOSURE_HISTORY_INCOMPLETE'
    },{status:409});
  if(dailyCount>=SUBJECT_PRACTICE_DAILY_LIMIT)return NextResponse.json({
    error:'Son 24 saatteki kazanım pekiştirme sınırına ulaştın. Kişisel tekrarlarına devam et.'
  },{status:429});
  const seen=new Set<string>(reviewedQuestions.map(x=>x.questionId));
  for(const quiz of priorQuizzes){
    if(!Array.isArray(quiz.questionIds))continue;
    for(const item of quiz.questionIds)if(typeof item==='string')seen.add(item);
  }
  const selected=chooseFreshSubjectPractice(origin,candidates,seen,curriculum,2);
  if(!selected.length)return NextResponse.json({
    error:'Bu beceri için eğitim düzeyi ve sınav kapsamına uygun, daha önce gösterilmemiş onaylı soru bulunamadı. Koçundan uygun yeni bir örnek iste.',
    code:'NO_NEW_APPROVED_GRADE_MATCH'
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
    ok:true,quiz:{id:quiz.id,title:quiz.title},
    curriculum:{grade:curriculum.grade,framework:curriculum.framework,academicYear:curriculum.academicYear},
    evidenceStatus:'UNSEEN_APPROVED_QUESTION_NOT_MASTERY',
    learningPlan:buildSubjectRecoveryPlan({
      subject:origin.subject,topic:origin.topic,
      bankReason:typeof originMeta.bankReason==='string'?originMeta.bankReason:null,
      classificationConfidence:typeof originMeta.classificationConfidence==='number'?originMeta.classificationConfidence:null
    }),
    questions:selected.map(q=>{
      const opts=record((q as typeof candidates[number]).options);
      const options=Object.fromEntries(Object.entries(opts).filter(([key,val])=>
        /^[A-E]$/.test(key)&&typeof val==='string'
      ));
      return {
        id:q.id,subject:q.subject,topic:q.topic,prompt:q.prompt,options,
        inputMode:Object.keys(options).length?'CHOICE':'TEXT'
      };
    })
  });
}

export const POST=withApiErrors(POST__handler);
