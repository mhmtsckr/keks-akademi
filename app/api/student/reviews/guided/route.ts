import {randomInt} from 'node:crypto';
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {areEquivalentShortAnswers} from '@/lib/mathAnswerEquivalence';
import {ALL_MICRO_LESSONS,findMicroLesson,microLessonById} from '@/lib/bankFreeMicroLessons';
import {getMicroLessonReviewStatusMap} from '@/lib/microLessonReview';
import {resolveLearningCurriculumContext,lessonAllowedForContext} from '@/lib/curriculumPolicy2026';

const schema=z.discriminatedUnion('action',[
  z.object({action:z.literal('start'),reviewId:z.string().min(1)}),
  z.object({action:z.literal('submit'),sessionId:z.string().min(1),answer:z.string().min(1).max(250)})
]);

function record(value:unknown):Record<string,unknown>{
  return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
}

async function GET__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const url=new URL(req.url);
  const rawGrade=url.searchParams.get('grade');
  const selectedGrade=rawGrade&&/^\\d{1,2}$/.test(rawGrade)?Number(rawGrade):null;
  const examType=url.searchParams.get('examType')||user.student.gradeLevel;
  const context=resolveLearningCurriculumContext({
    gradeLevel:user.student.gradeLevel,selectedGrade,examType
  });
  const states=await getMicroLessonReviewStatusMap();
  return NextResponse.json({
    ok:true,academicYear:context.academicYear,curriculumContext:context,
    lessons:ALL_MICRO_LESSONS.filter(x=>lessonAllowedForContext(x,context)).map(x=>({
      id:x.id,version:x.version,subject:x.subject,title:x.title,
      skill:x.skill,topicTags:x.topicTags||[],contentStatus:states.get(x.id)?.status||'PILOT',
      sourceUrl:x.sourceUrl||null
    }))
  });
}

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const studentId=user.student.id;
  const input=await readJson(req,schema);

  if(input.action==='start'){
    const review=await db.reviewQueueItem.findFirst({
      where:{id:input.reviewId,studentId},include:{question:true}
    });
    if(!review)return NextResponse.json({error:'Tekrar görevi bulunamadı.'},{status:404});
    // Only relate a curated example to an uploaded question when its skill can be
    // identified confidently. Image-only/ambiguous questions must not be guessed.
    const options=record(review.question.options);
    const savedGrade=typeof options.educationGrade==='number'?options.educationGrade:null;
    const context=resolveLearningCurriculumContext({
      gradeLevel:user.student.gradeLevel,selectedGrade:savedGrade,examType:review.question.examType
    });
    const lesson=findMicroLesson({
      subject:review.question.subject,
      topic:review.question.topic,
      prompt:review.question.prompt,
      selectedLessonId:typeof options.practiceSkillId==='string'?String(options.practiceSkillId):null
    });
    if(lesson&&!lessonAllowedForContext(lesson,context))
      return NextResponse.json({
        error:'Bu çözümlü örnek öğrencinin doğrulanmış sınıfına veya sınavına uygun değil. Sınıf bilgisini kontrol et.',
        code:'LEVEL_MISMATCH',curriculumContext:context
      },{status:409});
    if(!lesson)return NextResponse.json({
      ok:false,code:'NO_GUIDED_EXAMPLE',
      error:'Bu alt beceri için hazırlanmış çözümlü örnek henüz yok. Orijinal sorunun çözümünü uydurmak yerine koçundan konu örneği eklemesini iste.'
    },{status:404});
    const publication=(await getMicroLessonReviewStatusMap()).get(lesson.id)?.status||'PILOT';
    const variantIndex=randomInt(lesson.exercises.length);
    const session=await db.dailyLog.create({data:{
      studentId,date:new Date(),payload:{
        type:'GUIDED_PRACTICE_STARTED',reviewId:review.id,
        originQuestionId:review.questionId,
        subject:review.question.subject,topic:review.question.topic,
        lessonId:lesson.id,lessonVersion:lesson.version,variantIndex,
        contentStatus:publication,
        educationGrade:context.grade,framework:context.framework,academicYear:context.academicYear
      }
    }});
    return NextResponse.json({
      ok:true,mode:'GUIDED_EXAMPLE',sessionId:session.id,
      lesson:{
        id:lesson.id,version:lesson.version,subject:lesson.subject,title:lesson.title,
        skill:lesson.skill,explanation:lesson.explanation,misconception:lesson.misconception,
        worked:lesson.worked,contentStatus:publication,
        curriculumContext:{grade:context.grade,framework:context.framework,academicYear:context.academicYear},
        outcomeVerified:false
      },
      exercise:{
        prompt:lesson.exercises[variantIndex].prompt,
        options:lesson.exercises[variantIndex].options||null,
        inputMode:lesson.exercises[variantIndex].options?'CHOICE':'TEXT'
      },
      note:publication==='APPROVED'
        ?'Özgün KEKS örneği yönetici içerik incelemesinden geçmiştir; yüklenen sorunun birebir çözümü değildir.'
        :'Özgün KEKS pilot içeriğidir; uzman onayı verilmiş sayılmaz ve yüklenen sorunun birebir çözümü değildir.'
    });
  }

  const session=await db.dailyLog.findFirst({where:{id:input.sessionId,studentId}});
  if(!session)return NextResponse.json({error:'Alıştırma oturumu bulunamadı.'},{status:404});
  const payload=record(session.payload);
  if(payload.type==='GUIDED_PRACTICE_RESULT')
    return NextResponse.json({ok:true,alreadySubmitted:true,...record(payload.result)});
  if(payload.type!=='GUIDED_PRACTICE_STARTED')
    return NextResponse.json({error:'Alıştırma oturumu geçerli değil.'},{status:409});
  if(Date.now()-session.createdAt.getTime()>24*60*60*1000)
    return NextResponse.json({error:'Alıştırma oturumunun süresi doldu. Yeni örnek başlat.'},{status:409});

  const lesson=microLessonById(String(payload.lessonId||''),Number(payload.lessonVersion||0));
  const index=Number(payload.variantIndex);
  const exercise=lesson&&Number.isInteger(index)?lesson.exercises[index]:null;
  if(!exercise)return NextResponse.json({error:'Bu örneğin sürümü bulunamadı.'},{status:409});
  const correct=areEquivalentShortAnswers(input.answer,exercise.answer);
  const result={
    correct,correctAnswer:exercise.answer,explanation:exercise.explanation,
    reviewScheduleUnchanged:true,
    guidance:correct
      ?'Farklı örneği doğru çözdün. Kalıcılık için sonraki günlerde yeniden, yardım almadan ölçülmelisin.'
      :'Örnek çözümünü incele; tekrar görevin ayrı olarak devam edecek.'
  };
  const updated=await db.dailyLog.updateMany({
    where:{id:session.id,studentId,payload:{path:['type'],equals:'GUIDED_PRACTICE_STARTED'}},
    data:{date:new Date(),payload:{
      ...payload,type:'GUIDED_PRACTICE_RESULT',completedAt:new Date().toISOString(),
      correct,answered:true,result
    }}
  });
  if(!updated.count)return NextResponse.json({error:'Alıştırma başka bir oturumda kaydedildi.'},{status:409});
  return NextResponse.json({ok:true,...result});
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
