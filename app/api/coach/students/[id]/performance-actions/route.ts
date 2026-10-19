import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {readJson,withApiErrors,HttpError} from '@/lib/apiGuard';
import {performanceTaskById} from '@/lib/tymmPerformanceTasks';
import {readableRubric} from '@/lib/tymmDelayedTransfer';
import {interventionFor,suggestRubricInterventions} from '@/lib/tymmRubricInterventions';
import {actionAttempts,actionReviews,reviewActionEvidence} from '@/lib/tymmActionEvidenceReview';

type Ctx={params:Promise<{id:string}>};
const reviewSchema=z.object({
 assignmentId:z.string().min(5).max(100),
 decision:z.enum(['ACCEPT','REVISE']),
 feedback:z.string().trim().min(30).max(1800)
}).strict();
const schema=z.object({
 reviewSubmissionId:z.string().min(5).max(100),
 criterionId:z.string().min(2).max(60),
 coachNote:z.string().trim().min(20).max(1000)
}).strict();
function obj(value:unknown):Record<string,unknown>{
 return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
}
async function ownedStudent(studentId:string){
 const user=await requireRole(['COACH','ADMIN']);
 const student=user.coachProfile?await db.student.findFirst({
  where:{id:studentId,coachId:user.coachProfile.id},
  select:{id:true,gradeLevel:true}
 }):null;
 if(!student||!user.coachProfile)throw new HttpError(403,'Öğrencinin atanmış koçu değilsiniz.');
 return {user,student};
}
function isHumanReview(p:Record<string,unknown>){
 return ['TYMM_PERFORMANCE_REVIEWED','TYMM_TRANSFER_REVIEWED'].includes(String(p.type));
}
async function GET__handler(_req:Request,{params}:Ctx){
 const {id}=await params;
 await ownedStudent(id);
 const rows=await db.dailyLog.findMany({
  where:{studentId:id,OR:[
   {payload:{path:['type'],string_contains:'TYMM_PERFORMANCE_REVIEWED'}},
   {payload:{path:['type'],string_contains:'TYMM_TRANSFER_REVIEWED'}},
   {payload:{path:['type'],equals:'TYMM_RUBRIC_ACTION'}}
  ]},
  orderBy:{createdAt:'desc'},take:250,select:{id:true,createdAt:true,payload:true}
 });
 const existing=rows.flatMap(row=>{
  const p=obj(row.payload);
  if(p.type!=='TYMM_RUBRIC_ACTION')return [];
  return [{id:row.id,reviewSubmissionId:String(p.reviewSubmissionId||''),
   criterionId:String(p.criterionId||''),status:String(p.status||''),
   taskId:String(p.taskId||''),criterionLabel:String(p.criterionLabel||''),
   assignment:String(p.assignment||''),expectedEvidence:String(p.expectedEvidence||''),
   minutes:Number(p.minutes||0),coachNote:String(p.coachNote||''),
   reflection:typeof p.reflection==='string'?p.reflection:null,
   attemptCount:actionAttempts(p).length,review:p.review||null,
   reviewHistory:actionReviews(p).map(r=>({attempt:r.attempt,decision:r.decision,feedback:r.feedback,reviewedAt:r.reviewedAt})),
   submittedAt:typeof p.submittedAt==='string'?p.submittedAt:null,
   assignedAt:row.createdAt,completedAt:typeof p.completedAt==='string'?p.completedAt:null}];
 });
 const reviewRows=rows.flatMap(row=>{
  const p=obj(row.payload);
  if(!isHumanReview(p))return [];
  const task=performanceTaskById(String(p.taskId||''),Number(p.taskVersion));
  const rubric=readableRubric(obj(p.review));
  if(!task||!rubric||p.grade!==task.grade)return [];
  const scored=rubric.criterionScores.map(c=>({
   id:c.id,score:c.score,label:task.criteria.find(x=>x.id===c.id)?.label||c.id
  }));
  return [{
   id:row.id,taskId:task.id,grade:task.grade,subject:task.subject,
   title:task.title,phase:p.type==='TYMM_TRANSFER_REVIEWED'?'TRANSFER':'BASELINE',
   reviewedAt:String(obj(p.review).reviewedAt||row.createdAt.toISOString()),
   suggestions:suggestRubricInterventions(task.id,scored,2).map(x=>({
    ...x,assigned:existing.some(a=>a.reviewSubmissionId===row.id&&a.criterionId===x.criterionId)
   }))
  }];
 });
 return NextResponse.json({ok:true,reviews:reviewRows,assignments:existing,
  note:'Koç kararıyla atanabilir somut beceri çalışmalarını gösterir. Sadece rubrik puanı esas alınır; tanı veya kalıcı öğrenme sonucu çıkarılmaz.'});
}
async function POST__handler(req:Request,{params}:Ctx){
 const {id}=await params;
 const {user}=await ownedStudent(id);
 const input=await readJson(req,schema);
 const row=await db.dailyLog.findFirst({
  where:{id:input.reviewSubmissionId,studentId:id},
  select:{id:true,payload:true}
 });
 if(!row)throw new HttpError(404,'İlgili öğrencinin koç rubriği bulunamadı.');
 const p=obj(row.payload),review=obj(p.review);
 if(!isHumanReview(p))throw new HttpError(409,'İlk koç rubriği değerlendirilmeden telafi görevi atanamaz.');
 const task=performanceTaskById(String(p.taskId||''),Number(p.taskVersion));
 const rubric=readableRubric(review);
 if(!task||!rubric||p.grade!==task.grade)throw new HttpError(409,'Görev veya rubrik verisi geçersiz.');
 const scored=rubric.criterionScores.find(x=>x.id===input.criterionId);
 const action=interventionFor(task.id,input.criterionId);
 if(!scored||scored.score>=2||!action)
  throw new HttpError(409,'Bu ölçütte doğrulanmış eksik ve güvenli bir telafi görevi bulunmuyor.');
 // A teacher's approval is never inferred from the existence of this entry.
 const created=await db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${id}),hashtext(${row.id+'|'+input.criterionId})) IS NULL AS acquired`;
  const dup=await tx.dailyLog.findFirst({where:{
   studentId:id,payload:{path:['reviewCriterionKey'],equals:row.id+'|'+input.criterionId}
  }});
  if(dup)throw new HttpError(409,'Bu koç rubriği ve ölçüt için telafi görevi zaten atandı.');
  return tx.dailyLog.create({data:{studentId:id,date:new Date(),payload:{
   type:'TYMM_RUBRIC_ACTION',status:'ASSIGNED',
   reviewSubmissionId:row.id,reviewCriterionKey:row.id+'|'+input.criterionId,
   taskId:task.id,taskVersion:task.version,grade:task.grade,subject:task.subject,
   criterionId:input.criterionId,
   criterionLabel:task.criteria.find(c=>c.id===input.criterionId)?.label||input.criterionId,
   originalRubricScore:scored.score,
   assignment:action.task,expectedEvidence:action.expectedEvidence,minutes:action.minutes,
   coachNote:input.coachNote,assignedByCoachId:user.coachProfile!.id,
   assignedByUserId:user.id,masteryStatusUnchanged:true,reviewScheduleUnchanged:true
  }}});
 });
 return NextResponse.json({ok:true,assignmentId:created.id,
  message:'Somut telafi çalışması öğrenciye atandı. Öğrencinin tamamlaması bilgi hâkimiyetini otomatik yükseltmez.'
 },{status:201});
}
async function PATCH__handler(req:Request,{params}:Ctx){
 const {id}=await params;
 const {user}=await ownedStudent(id);
 const input=await readJson(req,reviewSchema);
 const row=await db.dailyLog.findFirst({
  where:{id:input.assignmentId,studentId:id},
  select:{id:true,payload:true}
 });
 if(!row)throw new HttpError(404,'Bu öğrenciye ait telafi çalışması bulunamadı.');
 const payload=obj(row.payload);
 if(payload.type!=='TYMM_RUBRIC_ACTION')throw new HttpError(404,'Kayıt bir telafi çalışması değil.');
 if(payload.status!=='SUBMITTED_FOR_REVIEW')throw new HttpError(409,'Bu çalışma koç incelemesine açık değil.');
 // A current assigned coach can review the student. No automated accept is allowed.
 let next;
 try{
  next=reviewActionEvidence(payload,{
   decision:input.decision,feedback:input.feedback,
   reviewedAt:new Date().toISOString(),
   coachUserId:user.id,coachProfileId:user.coachProfile!.id
  });
 }catch(e){throw new HttpError(409,e instanceof Error?e.message:'Rubrik kanıtı değerlendirilemedi.');}
 const updated=await db.dailyLog.updateMany({
  where:{id:row.id,studentId:id,
    payload:{path:['status'],equals:'SUBMITTED_FOR_REVIEW'}},
  data:{payload:next}
 });
 if(!updated.count)throw new HttpError(409,'Bu kanıt başka bir inceleme sırasında işlendi.');
 return NextResponse.json({ok:true,assignmentId:row.id,status:next.status,
  review:next.review,
  message:next.status==='VERIFIED'?
   'Öğrencinin sunduğu kanıt koç tarafından kabul edildi. Kalıcı öğrenme otomatik işaretlenmedi.':
   next.status==='COACH_DISCUSSION_REQUIRED'?
   'Üçüncü çalışma da yeterli görülmedi. Yeni gönderim yerine koç görüşmesi önerildi.':
   'Öğrencinin kanıtı değerlendirilerek eksik yönler için yeniden çalışma istendi.'
 });
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
export const PATCH=withApiErrors(PATCH__handler);
