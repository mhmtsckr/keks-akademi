import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {readJson,withApiErrors,HttpError} from '@/lib/apiGuard';
import {resolveLearningCurriculumContext} from '@/lib/curriculumPolicy2026';
import {TYMM_PERFORMANCE_TASKS,performanceTaskById,performanceTaskEvidence} from '@/lib/tymmPerformanceTasks';
import {transferVariantFor,transferDueAt,readableRubric} from '@/lib/tymmDelayedTransfer';

const inputSchema=z.object({
 baselineTaskId:z.string().min(6).max(150),
 grade:z.number().int().min(1).max(12),
 response:z.string().trim().min(50).max(6000),
 observations:z.string().trim().min(15).max(2000),
 confirmedIndependentWork:z.literal(true)
}).strict();
function obj(x:unknown):Record<string,unknown>{return x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:{}}
type EvidenceRow={id:string;createdAt:Date;payload:unknown};
function stateFor(taskId:string,logs:EvidenceRow[],now:Date){
 const lastTransfer=logs.find(x=>obj(x.payload).taskId===taskId
  &&['TYMM_TRANSFER_SUBMISSION','TYMM_TRANSFER_REVIEWED'].includes(String(obj(x.payload).type)));
 const baseline=logs.find(row=>{
  const p=obj(row.payload),review=obj(p.review);
  return p.type==='TYMM_PERFORMANCE_REVIEWED'&&p.taskId===taskId&&
   readableRubric(review)!==null&&typeof review.reviewedAt==='string'&&
   Number.isFinite(Date.parse(review.reviewedAt));
 });
 if(!baseline)return {status:'AWAITING_BASELINE' as const,dueAt:null,baselineId:null,transferId:lastTransfer?.id||null};
 const review=obj(obj(baseline.payload).review);
 const dueAt=transferDueAt(new Date(String(review.reviewedAt)));
 if(lastTransfer){
  return {status:obj(lastTransfer.payload).type==='TYMM_TRANSFER_REVIEWED'?'REVIEWED' as const:'WAITING_FOR_COACH' as const,
   dueAt:dueAt.toISOString(),baselineId:baseline.id,transferId:lastTransfer.id};
 }
 return {status:now>=dueAt?'AVAILABLE' as const:'LOCKED' as const,
   dueAt:dueAt.toISOString(),baselineId:baseline.id,transferId:null};
}

async function GET__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:403});
 const raw=new URL(req.url).searchParams.get('grade');
 if(raw&&!/^(?:[1-9]|1[0-2])$/.test(raw))throw new HttpError(400,'Sınıf geçersiz.');
 const context=resolveLearningCurriculumContext({
  gradeLevel:user.student.gradeLevel,selectedGrade:raw?Number(raw):null
 });
 const logs=await db.dailyLog.findMany({
  where:{studentId:user.student.id,payload:{path:['type'],string_contains:'TYMM_'}},
  orderBy:{createdAt:'desc'},take:400,select:{id:true,createdAt:true,payload:true}
 });
 const rows=context.framework==='TYMM'&&context.grade
  ?TYMM_PERFORMANCE_TASKS.filter(t=>t.grade===context.grade).map(task=>{
    const state=stateFor(task.id,logs,new Date());
    const variant=state.status==='AVAILABLE'?transferVariantFor(task.id):null;
    return {baselineTaskId:task.id,title:task.title,subject:task.subject,
      grade:task.grade,outcomeCode:task.outcomeCode,status:state.status,
      dueAt:state.dueAt,baselineId:state.baselineId,transferId:state.transferId,
      assignment:variant&&performanceTaskEvidence(task).outcomeCodeVerified?variant:null};
   }):[];
 const comparisons=logs.flatMap(row=>{
  const p=obj(row.payload);
  if(p.type!=='TYMM_TRANSFER_REVIEWED'||!rows.some(x=>x.baselineTaskId===p.taskId))return [];
  const rev=obj(p.review);
  return [{submissionId:row.id,taskId:p.taskId,comparison:rev.comparison||null,feedback:rev.feedback||null}];
 });
 return NextResponse.json({ok:true,academicYear:context.academicYear,
   curriculumContext:context,transfers:rows,comparisons,
   note:'Bağımsız görev ilk insan rubriği değerlendirmesinden en erken yedi gün sonra açılır. Tek görev kalıcı öğrenme kanıtı değildir.'});
}

async function POST__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:403});
 const input=await readJson(req,inputSchema);
 const context=resolveLearningCurriculumContext({
  gradeLevel:user.student.gradeLevel,selectedGrade:input.grade
 });
 if(context.framework!=='TYMM'||context.grade!==input.grade)throw new HttpError(403,'Bu sınıfta bağımsız görev açılamaz.');
 const task=performanceTaskById(input.baselineTaskId);
 const variant=transferVariantFor(input.baselineTaskId);
 if(!task||!variant||task.grade!==input.grade||!performanceTaskEvidence(task).outcomeCodeVerified)
  throw new HttpError(404,'Doğrulanmış görev bulunamadı.');
 const studentId=user.student.id;
 const created=await db.$transaction(async tx=>{
   // Serialize requests for the same student and baseline task; prevent double submissions.
   await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${studentId}),hashtext(${task.id}))`;
   const logs=await tx.dailyLog.findMany({
    where:{studentId,payload:{path:['type'],string_contains:'TYMM_'}},
    orderBy:{createdAt:'desc'},take:400,select:{id:true,createdAt:true,payload:true}
   });
   const state=stateFor(task.id,logs,new Date());
   if(state.status!=='AVAILABLE'||!state.baselineId){
     throw new HttpError(409,'Bu görev henüz açılmadı, ilk koç incelemesi eksik veya bağımsız görev zaten teslim edildi.');
   }
   const original=logs.find(x=>x.id===state.baselineId);
   if(!original)throw new HttpError(409,'İlk değerlendirme bulunamadı.');
   const first=obj(original.payload);
   const firstReview=obj(first.review);
   const firstScores=readableRubric(firstReview);
   if(!firstScores)throw new HttpError(409,'İlk rubrik karşılaştırma için geçerli değil.');
   return tx.dailyLog.create({data:{
    studentId,date:new Date(),payload:{
     type:'TYMM_TRANSFER_SUBMISSION',taskId:task.id,taskVersion:task.version,
     transferVariantId:variant.id,transferVersion:variant.version,
     baselineSubmissionId:original.id,baselineReviewedAt:firstReview.reviewedAt,
     grade:task.grade,subject:task.subject,outcomeCode:task.outcomeCode,
     response:input.response,observations:input.observations,
     firstScores,independentSelfReport:true,
     status:'WAITING_FOR_COACH',masteryStatusUnchanged:true,reviewScheduleUnchanged:true
    }
   }});
 });
 return NextResponse.json({ok:true,submissionId:created.id,status:'WAITING_FOR_COACH',
  message:'Yedi gün sonraki bağımsız performans görevi kaydedildi. Koç iki rubriği aynı ölçütler üzerinden karşılaştıracak; bilgi hâkimiyeti otomatik değişmez.'
 },{status:201});
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
