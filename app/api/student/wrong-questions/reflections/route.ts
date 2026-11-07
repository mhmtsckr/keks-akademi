import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {readJson,withApiErrors,HttpError} from '@/lib/apiGuard';
import {REMEDIATION_REASONS} from '@/lib/wrongQuestionRemediation';
import {WRONG_REFLECTION_TYPE,buildWrongRecovery} from '@/lib/wrongQuestionRecovery';
import {BLANK_REASON_CODES} from '@/lib/blankReasonEvidence';

const PRIVATE_PREFIX='STUDENT_WRONG:';
const reasonKeys=Object.keys(REMEDIATION_REASONS) as [keyof typeof REMEDIATION_REASONS,...(keyof typeof REMEDIATION_REASONS)[]];
const schema=z.object({
 questionId:z.string().min(5).max(90),
 reason:z.enum(reasonKeys),
 mistakenStep:z.string().trim().min(15).max(900),
 correctedPrinciple:z.string().trim().min(20).max(1000),
 nextTimeCheck:z.string().trim().min(15).max(800)
}).strict();
function rec(value:unknown):Record<string,unknown>{
 return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
}

async function GET__handler(){
 const user=await requireRole(['STUDENT']);
 if(!user.student)throw new HttpError(403,'Öğrenci profili bulunamadı.');
 const studentId=user.student.id;
 const [questions,reflections,guided,reviews]=await Promise.all([
  db.questionBankItem.findMany({
   where:{sourceKind:PRIVATE_PREFIX+studentId,reviewStatus:'STUDENT_PRIVATE'},
   orderBy:{createdAt:'desc'},take:50,select:{id:true,examType:true,topic:true,options:true}
  }),
  db.dailyLog.findMany({
   where:{studentId,payload:{path:['type'],equals:WRONG_REFLECTION_TYPE}},
   orderBy:{createdAt:'desc'},take:250,select:{id:true,createdAt:true,payload:true}
  }),
  db.dailyLog.findMany({
   where:{studentId,payload:{path:['type'],equals:'GUIDED_PRACTICE_RESULT'}},
   orderBy:{createdAt:'desc'},take:250,select:{id:true,createdAt:true,payload:true}
  }),
  db.dailyLog.findMany({
   where:{studentId,payload:{path:['type'],equals:'REVIEW_RESULT'}},
   orderBy:{createdAt:'desc'},take:250,select:{id:true,createdAt:true,payload:true}
  })
 ]);
 const ids=new Set(questions.map(q=>q.id));
 const events=[...reflections,...guided,...reviews].filter(row=>{
  const p=rec(row.payload);
  return ids.has(String(p.type=== 'GUIDED_PRACTICE_RESULT'?p.originQuestionId:p.questionId||''));
 });
 const items=questions.map(q=>{
  const options=rec(q.options);
  const rawKind=options.bankReason;
  return buildWrongRecovery(q.id,events,{
   bankReason:rawKind==='BLANK'||rawKind==='MARKED'?rawKind:'WRONG',
   gradeLevel:user.student!.gradeLevel,examType:q.examType,topic:q.topic,
   classificationConfidence:typeof options.classificationConfidence==='number'
    ?options.classificationConfidence:null
  });
 });
 const counts=items.reduce((acc,item)=>{
  acc[item.stage]=(acc[item.stage]||0)+1;
  return acc;
 },{} as Record<string,number>);
 const reasons=items.reduce((acc,item)=>{
  const k=item.reflection?.reason;
  if(k)acc[k]=(acc[k]||0)+1;
  return acc;
 },{} as Record<string,number>);
 return NextResponse.json({ok:true,items,summary:{
  totalPersonalQuestions:items.length,withReflection:items.filter(x=>x.reflection).length,
  guidedCorrect:items.filter(x=>x.evidence.guided?.correct===true).length,
  independentReviewCorrect:items.filter(x=>x.evidence.independentReview?.correct===true).length,
  stages:counts,reasons,
  reviewBlanks:items.reduce((n,x)=>n+x.evidence.blankReviews,0),
  repeatedDifficulties:items.filter(x=>x.evidence.consecutiveUnsuccessfulReviews>=2).length,
  coachReviewSuggested:items.filter(x=>x.nextTask.coachSupportSuggested).length
 },note:'Öğrencinin açıklaması öz bildirimdir; doğru çözüm veya öğretmen onayı olarak değerlendirilmez. Son 250 kayıt/türle sınırlı geçmiş görüntülenir.'});
}

async function POST__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student)throw new HttpError(403,'Öğrenci profili bulunamadı.');
 const input=await readJson(req,schema);
 const studentId=user.student.id;
 const question=await db.questionBankItem.findFirst({
  where:{id:input.questionId,sourceKind:PRIVATE_PREFIX+studentId,reviewStatus:'STUDENT_PRIVATE'},
  select:{id:true,subject:true,topic:true,examType:true,options:true}
 });
 if(!question)throw new HttpError(404,'Bu yanlış soru kaydı sana ait değil veya bulunamadı.');
 const questionOptions=rec(question.options);
 if(questionOptions.bankReason==='BLANK'&&!(input.reason in BLANK_REASON_CODES))
  throw new HttpError(400,'Boş bırakma için geçerli bir neden seçmelisin.');
 const createdAfter=new Date(Date.now()-24*60*60*1000);
 const updates=await db.dailyLog.count({where:{
  studentId,createdAt:{gte:createdAfter},
  AND:[{payload:{path:['type'],equals:WRONG_REFLECTION_TYPE}},
       {payload:{path:['questionId'],equals:question.id}}]
 }});
 if(updates>=3)throw new HttpError(429,'Bu soru için 24 saatte en fazla üç hata analizi kaydedilebilir.');
 const row=await db.dailyLog.create({data:{
  studentId,date:new Date(),payload:{
   type:WRONG_REFLECTION_TYPE,questionId:question.id,
   subject:question.subject,topic:question.topic,
   reason:input.reason,mistakenStep:input.mistakenStep,
   correctedPrinciple:input.correctedPrinciple,nextTimeCheck:input.nextTimeCheck,
   diagnosticSource:'STUDENT_SELF_REPORT',
   verifiedCorrectness:false,masteryStatusUnchanged:true,reviewScheduleUnchanged:true
  }
 }});
 const result=buildWrongRecovery(question.id,[row],{
  bankReason:questionOptions.bankReason==='BLANK'||questionOptions.bankReason==='MARKED'
   ?questionOptions.bankReason:'WRONG',
  gradeLevel:user.student.gradeLevel,examType:question.examType,topic:question.topic,
  classificationConfidence:typeof questionOptions.classificationConfidence==='number'
   ?questionOptions.classificationConfidence:null
 });
 return NextResponse.json({
  ok:true,item:result,
  message:'Hata nedenin ve düzeltme planın kaydedildi. Yeni örnekte ve sonraki bağımsız tekrarda kontrol et; bu not tek başına doğru çözüm kanıtı değildir.'
 },{status:201});
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
