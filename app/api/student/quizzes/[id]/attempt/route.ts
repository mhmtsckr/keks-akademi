import {readJson,withApiErrors,HttpError} from '@/lib/apiGuard';
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {requireRole} from '@/lib/auth';
import {calcNet} from '@/lib/performance';
import {REVIEW_DAYS} from '@/lib/smartCoach';
import {gradePersonalQuiz} from '@/lib/quizErrorLearning';

const schema=z.object({
 answers:z.record(z.string().max(100),z.string().max(2000).nullable())
  .refine(v=>Object.keys(v).length<=100,{message:'En fazla 100 soru yanıtı gönderilebilir.'})
}).strict();

async function POST__handler(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await requireRole(['STUDENT']);
 if(!user.student)return NextResponse.json({error:'Öğrenci profili bulunamadı.'},{status:400});
 const {id}=await params;
 const studentId=user.student.id;
 const input=await readJson(req,schema);
 const result=await db.$transaction(async tx=>{
   // Serializes two simultaneous submissions of the same test without a migration.
   await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${id}), 2026) IS NULL AS locked`;
   const quiz=await tx.practiceQuiz.findFirst({where:{id,studentId}});
   if(!quiz)throw new HttpError(404,'Test bulunamadı.');
   const existing=await tx.practiceQuizAttempt.findFirst({
    where:{quizId:id,studentId},select:{id:true}
   });
   if(existing)throw new HttpError(409,'Bu testin sonucu daha önce kaydedildi. Yeniden değerlendirmek için yeni test oluştur.');

   const ids=Array.isArray(quiz.questionIds)?quiz.questionIds.filter(
     (x):x is string=>typeof x==='string'&&x.length>0&&x.length<=100
   ):[];
   if(ids.length===0||ids.length>100||new Set(ids).size!==ids.length)
     throw new HttpError(409,'Testin soru listesi eksik veya tekrar içeriyor.');
   const questions=await tx.questionBankItem.findMany({where:{id:{in:ids}}});
   if(questions.length!==ids.length)throw new HttpError(409,'Testteki bazı sorular artık bulunamıyor.');
   const byId=new Map(questions.map(q=>[q.id,q]));
   const ordered=ids.map(qid=>byId.get(qid)!);
   // Never grade another student's private upload or a withdrawn public question.
   for(const q of ordered){
    const privateQuestion=q.sourceKind.startsWith('STUDENT_WRONG:');
    if(privateQuestion){
     if(q.sourceKind!=='STUDENT_WRONG:'+studentId||q.reviewStatus!=='STUDENT_PRIVATE')
       throw new HttpError(409,'Testte başka öğrenciye ait veya erişilemeyen özel soru var.');
    }else if(!q.active||q.reviewStatus!=='APPROVED'){
      throw new HttpError(409,'Testte onayı kaldırılmış soru var. Yeni test oluştur.');
    }
   }
   if(Object.keys(input.answers).some(k=>!byId.has(k)))
     throw new HttpError(400,'Gönderilen yanıtlar arasında teste ait olmayan soru var.');

   const grade=gradePersonalQuiz(ordered,input.answers);
   const net=calcNet(grade.correct,grade.wrong);
   const attempt=await tx.practiceQuizAttempt.create({
     data:{quizId:quiz.id,studentId,answers:grade.answers,
       correct:grade.correct,wrong:grade.wrong,blank:grade.blank,net}
   });
   const now=new Date();
   const dueAt=new Date(now.getTime()+REVIEW_DAYS[0]*86400000);
   for(const questionId of [...grade.wrongIds,...grade.blankIds]){
     const wasBlank=grade.blankIds.includes(questionId);
     await tx.reviewQueueItem.upsert({
       where:{studentId_questionId:{studentId,questionId}},
       create:{studentId,questionId,sourceAttemptId:attempt.id,
         stepIndex:0,dueAt,status:'DUE',lastCorrect:wasBlank?null:false},
       update:{sourceAttemptId:attempt.id,stepIndex:0,dueAt,status:'DUE',
         lastCorrect:wasBlank?null:false,completedAt:null}
     });
   }
   if(quiz.examType!=='KISISEL'){
     await tx.practiceLog.create({data:{
       studentId,examType:quiz.examType,subject:quiz.subject,topic:quiz.topic,
       correct:grade.correct,wrong:grade.wrong,blank:grade.blank,
       total:ordered.length,net
     }});
   }
   const report=await tx.studentReport.create({data:{
     studentId,title:'Otomatik Test Performans Raporu · '+quiz.title,
     summary:`D ${grade.correct} · Y ${grade.wrong} · B ${grade.blank} · Net ${net}`,
     content:`${quiz.title}: ${grade.correct} doğru, ${grade.wrong} yanlış, ${grade.blank} boş. Yanlışlar ve boşlar ayrı nedenlerle 0. gün tekrarına alındı. Koç, kazanım düzeyinde boş bırakma nedeni ve yeni soru kanıtlarını ayrıca değerlendirmelidir.`,
     createdByUserId:user.id,visibleToStudent:true,visibleToParent:true
   }});
   return {attempt:{id:attempt.id,correct:grade.correct,wrong:grade.wrong,blank:grade.blank,net},
     reportId:report.id,wrongAdded:grade.wrongIds.length,blankAdded:grade.blankIds.length};
 });
 return NextResponse.json({
  ok:true,...result,reviewAdded:result.wrongAdded+result.blankAdded,
  reviewScheduleDays:REVIEW_DAYS,
  evidenceStatus:'SERVER_GRADED_NOT_MASTERY',
  note:'Boş bırakılan sorular yanlışlardan ayrı işaretlendi; ikisi de 0. gün tekrarına alındı. Tekrar başarısı tek başına kalıcı öğrenme kanıtı değildir.'
 });
}

export const POST=withApiErrors(POST__handler);
