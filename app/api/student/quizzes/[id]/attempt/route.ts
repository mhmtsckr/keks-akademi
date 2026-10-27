import { readJson, withApiErrors, HttpError } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { calcNet } from '@/lib/performance';
import { REVIEW_DAYS } from '@/lib/smartCoach';
import {areEquivalentShortAnswers} from '@/lib/mathAnswerEquivalence';
import {learnerRecoveryPolicy} from '@/lib/wrongBlankLearningPolicy';

const schema=z.object({
 answers:z.record(z.string().min(1),z.string().nullable())
  .refine(x=>Object.keys(x).length<=120,'Çok fazla cevap gönderildi.')
}).strict();
const asRec=(v:unknown):Record<string,unknown>=>
 v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};

/**
 * First submission alone is graded. Subsequent calls are idempotent, so they
 * can neither overwrite the original blank/wrong answer nor requeue reviews.
 * Database transaction and per-student/per-quiz advisory lock serialize
 * simultaneous submissions from two open browser tabs.
 */
async function POST__handler(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await requireRole(['STUDENT']);
 if(!user.student)throw new HttpError(403,'Öğrenci profili bulunamadı.');
 const {id}=await params;
 const studentId=user.student.id;
 const quiz=await db.practiceQuiz.findFirst({where:{id,studentId}});
 if(!quiz)throw new HttpError(404,'Test bulunamadı.');
 const input=await readJson(req,schema);
 if(!Array.isArray(quiz.questionIds)||quiz.questionIds.length===0||quiz.questionIds.length>120||
  !quiz.questionIds.every(x=>typeof x==='string'))
  throw new HttpError(409,'Testin soruları doğrulanamadı.');
 const ids=quiz.questionIds as string[];
 if(new Set(ids).size!==ids.length)throw new HttpError(409,'Testte tekrar eden soru kimliği var.');
 if(Object.keys(input.answers).some(q=>!ids.includes(q)))
  throw new HttpError(400,'Gönderilen cevaplardan biri bu teste ait değil.');
 const qs=await db.questionBankItem.findMany({where:{id:{in:ids}}});
 if(qs.length!==ids.length)throw new HttpError(409,'Bu testteki sorulardan biri erişilemiyor.');
 const key=new Map(qs.map(q=>[q.id,q]));
 // A private question is only gradeable for its owner; an assigned exam item
 // must be approved. No other student's uploads may be included in this quiz.
 if(qs.some(q=>q.sourceKind.startsWith('STUDENT_WRONG:')
  ?q.sourceKind!=='STUDENT_WRONG:'+studentId
  :!q.active||q.reviewStatus!=='APPROVED'))
   throw new HttpError(403,'Testte kullanılamayan veya başka öğrenciye ait soru var.');
 let correct=0,wrong=0,blank=0;
 const wrongIds:string[]=[],blankIds:string[]=[];
 const perQuestion=ids.map(questionId=>{
  const q=key.get(questionId)!;
  const raw=input.answers[questionId];
  const answer=typeof raw==='string'?raw.trim():'';
  if(!answer){blank++;blankIds.push(questionId);return {questionId,result:'BLANK' as const,subject:q.subject,topic:q.topic};}
  const isPrivate=q.sourceKind.startsWith('STUDENT_WRONG:');
  const passed=isPrivate?areEquivalentShortAnswers(answer,q.correctAnswer):answer===q.correctAnswer;
  if(passed){correct++;return {questionId,result:'CORRECT' as const,subject:q.subject,topic:q.topic};}
  wrong++;wrongIds.push(questionId);
  return {questionId,result:'WRONG' as const,subject:q.subject,topic:q.topic};
 });
 const net=calcNet(correct,wrong);
 const policy=learnerRecoveryPolicy({
  gradeLevel:user.student.gradeLevel,academicTrack:user.student.academicTrack,
  examType:quiz.examType,wrong,blank
 });
 const outcome=await db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${studentId}),hashtext(${quiz.id})) IS NULL AS acquired`;
  const prior=await tx.practiceQuizAttempt.findFirst({
   where:{quizId:quiz.id,studentId},orderBy:{createdAt:'asc'}
  });
  if(prior){
   return {attempt:prior,alreadySubmitted:true,
    reportId:null as string|null,reviewAdded:0,wrongReviewAdded:0,blankReviewAdded:0};
  }
  const attempt=await tx.practiceQuizAttempt.create({data:{
   quizId:quiz.id,studentId,
   // Only submitted answers are stored; original blank is retained as null.
   answers:Object.fromEntries(ids.map(q=>[q,input.answers[q]??null])),
   correct,wrong,blank,net
  }});
  const dueAt=new Date();
  dueAt.setDate(dueAt.getDate()+REVIEW_DAYS[0]);
  for(const questionId of [...wrongIds,...blankIds]){
   await tx.reviewQueueItem.upsert({
    where:{studentId_questionId:{studentId,questionId}},
    create:{
     studentId,questionId,sourceAttemptId:attempt.id,stepIndex:0,dueAt,
     status:'DUE',lastCorrect:false
    },
    update:{
     sourceAttemptId:attempt.id,stepIndex:0,dueAt,
     status:'DUE',lastCorrect:false,completedAt:null
    }
   });
  }
  await tx.dailyLog.create({data:{
   studentId,date:dueAt,
   payload:{
    type:'QUIZ_WRONG_BLANK_V2',quizId:quiz.id,attemptId:attempt.id,
    examType:quiz.examType,subject:quiz.subject,topic:quiz.topic,
    educationLevelKey:policy.levelKey,grade:policy.grade,framework:policy.framework,
    correct,wrong,blank,total:ids.length,
    // Separate sources for review queue & honest coach evidence.
    wrongQuestionIds:wrongIds,blankQuestionIds:blankIds,
    perQuestion,
    evidence:'ANSWER_KEY_VERIFIED',independentMasteryVerified:false
   }
  }});
  if(quiz.examType!=='KISISEL'){
   await tx.practiceLog.create({data:{
    studentId,examType:quiz.examType,subject:quiz.subject,topic:quiz.topic,
    correct,wrong,blank,total:ids.length,net
   }});
  }
  const report=await tx.studentReport.create({data:{
   studentId,
   title:'Otomatik Test Performans Raporu · '+quiz.title,
   summary:`D ${correct} · Y ${wrong} · B ${blank} · Net ${net}`,
   content:`${quiz.title} testinde ${correct} doğru, ${wrong} yanlış, ${blank} boş ve ${net} net elde edildi. Yanlış ile boş ayrı kaydedildi; ${wrong+blank} soru kişisel tekrar sırasına alındı. Koç, bunların nedenlerini ayrı değerlendirmeli. Tekrar başarısı otomatik kalıcı öğrenme kanıtı değildir.`,
   createdByUserId:user.id,visibleToStudent:true,visibleToParent:true
  }});
  return {
   attempt,alreadySubmitted:false,reportId:report.id,
   reviewAdded:wrongIds.length+blankIds.length,
   wrongReviewAdded:wrongIds.length,blankReviewAdded:blankIds.length
  };
 });
 const returnedPolicy=learnerRecoveryPolicy({
  gradeLevel:user.student.gradeLevel,academicTrack:user.student.academicTrack,
  examType:quiz.examType,wrong:outcome.attempt.wrong,blank:outcome.attempt.blank
 });
 return NextResponse.json({
  ok:true,
  attempt:{
   id:outcome.attempt.id,correct:outcome.attempt.correct,
   wrong:outcome.attempt.wrong,blank:outcome.attempt.blank,net:outcome.attempt.net
  },
  reportId:outcome.reportId,reviewAdded:outcome.reviewAdded,
  wrongReviewAdded:outcome.wrongReviewAdded,blankReviewAdded:outcome.blankReviewAdded,
  alreadySubmitted:outcome.alreadySubmitted,
  remediation:{
   ...returnedPolicy,
   evidenceStatus:'ANSWER_KEY_VERIFIED_SUBMISSION_NOT_MASTERY',
   wrongAndBlankSeparated:true
  }
 },{headers:{'Cache-Control':'private, no-store'}});
}
export const POST=withApiErrors(POST__handler);
