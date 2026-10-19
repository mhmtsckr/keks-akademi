import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {withApiErrors,readJson,HttpError} from '@/lib/apiGuard';
import {performanceTaskById,evaluateHumanRubric} from '@/lib/tymmPerformanceTasks';
import {transferVariantFor,readableRubric} from '@/lib/tymmDelayedTransfer';
import {compareIndependentRubrics,validateModeratorEvidence} from '@/lib/tymmRubricModeration';

const schema=z.object({
 submissionId:z.string().min(6).max(100),
 scores:z.record(z.number().int().min(0).max(2)),
 criterionEvidence:z.record(z.string().trim().min(20).max(500)),
 note:z.string().trim().min(40).max(1800)
}).strict();
const ACTION='TYMM_INDEPENDENT_RUBRIC_MODERATION';
function obj(v:unknown):Record<string,unknown>{
 return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}
function candidate(log:{id:string;createdAt:Date;payload:unknown},adminId:string){
 const p=obj(log.payload);
 const phase=p.type==='TYMM_PERFORMANCE_REVIEWED'?'BASELINE':
             p.type==='TYMM_TRANSFER_REVIEWED'?'TRANSFER':null;
 if(!phase)return null;
 const task=performanceTaskById(String(p.taskId||''),Number(p.taskVersion));
 if(!task||task.grade!==p.grade)return null;
 const transfer=phase==='TRANSFER'?transferVariantFor(task.id):null;
 if(phase==='TRANSFER'&&(!transfer||p.transferVariantId!==transfer.id||p.transferVersion!==transfer.version))return null;
 const firstReview=obj(p.review);
 const rubric=readableRubric(firstReview);
 if(!rubric||typeof firstReview.evaluatedByUserId!=='string'||firstReview.evaluatedByUserId===adminId)return null;
 const criteria=transfer?transfer.criteria:task.criteria;
 if(criteria.length!==4||rubric.criterionScores.some(c=>!criteria.some(criterion=>criterion.id===c.id)))return null;
 return {
  id:log.id,submittedAt:log.createdAt,phase,
  task:{id:task.id,grade:task.grade,subject:task.subject,title:transfer?.title||task.title,
   outcomeCode:task.outcomeCode,sourceUrl:task.sourceUrl,criteria},
  instruction:transfer?.instruction||task.instruction,
  response:String(p.response||''),observations:String(p.observations||'')
 };
}

async function GET__handler(){
 const admin=await requireRole(['ADMIN']);
 const logs=await db.dailyLog.findMany({
  where:{OR:[
   {payload:{path:['type'],equals:'TYMM_PERFORMANCE_REVIEWED'}},
   {payload:{path:['type'],equals:'TYMM_TRANSFER_REVIEWED'}}
  ]},
  select:{id:true,createdAt:true,payload:true},
  orderBy:{createdAt:'desc'},take:160
 });
 const prior=logs.length?await db.auditLog.findMany({
  where:{action:ACTION,entityType:'DailyLog',entityId:{in:logs.map(x=>x.id)}},
  select:{entityId:true},take:160
 }):[];
 const processed=new Set(prior.map(x=>x.entityId));
 const unmoderated=logs
   .filter(x=>!processed.has(x.id))
   .map(log=>candidate(log,admin.id))
   .filter((x):x is NonNullable<typeof x>=>Boolean(x))
   .sort((a,b)=>a.submittedAt.getTime()-b.submittedAt.getTime())
   .slice(0,24);
 const history=await db.auditLog.findMany({
  where:{action:ACTION,entityType:'DailyLog'},
  orderBy:{createdAt:'desc'},take:30,
  select:{id:true,createdAt:true,entityId:true,metadata:true}
 });
 return NextResponse.json({
  ok:true,pending:unmoderated,
  history:history.map(x=>{
   const m=obj(x.metadata),report=obj(m.comparison);
   return {id:x.id,at:x.createdAt,
    decision:report.decision||'UNKNOWN',gap:report.absoluteTotalGap||0,
    criterionExactMatches:report.criterionExactMatches??null};
  }),
  partial:logs.length===160,
  note:'İkinci değerlendirici, ilk koçun puanlarını görmeden ayrı puan verir. Buradaki iç kalite incelemesi bağımsız alan öğretmeni onayı veya MEB akreditasyonu değildir.'
 });
}

async function POST__handler(req:Request){
 const admin=await requireRole(['ADMIN']);
 const input=await readJson(req,schema);
 const comparison=await db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('TYMM_MODERATION'),hashtext(${input.submissionId})) IS NULL AS acquired`;
  const existing=await tx.auditLog.findFirst({
   where:{action:ACTION,entityType:'DailyLog',entityId:input.submissionId},
   select:{id:true}
  });
  if(existing)throw new HttpError(409,'Bu görev zaten ikinci kez değerlendirildi.');
  const row=await tx.dailyLog.findUnique({
   where:{id:input.submissionId},select:{id:true,createdAt:true,payload:true}
  });
  if(!row)throw new HttpError(404,'İncelenecek performans görevi bulunamadı.');
  const evidence=candidate(row,admin.id);
  if(!evidence)throw new HttpError(403,'Görev tamamlanmamış, puanlar geçersiz veya ilk değerlendirmeyi siz yapmışsınız.');
  const payload=obj(row.payload);
  const first=obj(payload.review);
  const primary=readableRubric(first);
  if(!primary)throw new HttpError(409,'İlk rubrik doğrulanamadı.');
  const task=performanceTaskById(evidence.task.id);
  if(!task)throw new HttpError(409,'Görev sürümü değişti.');
  const variant=evidence.phase==='TRANSFER'?transferVariantFor(task.id):null;
  const actual=evidence.phase==='TRANSFER'&&variant?{...task,criteria:variant.criteria}:task;
  let second,notes;
  try{
   second=evaluateHumanRubric(actual,input.scores);
   notes=validateModeratorEvidence(actual.criteria.map(c=>c.id),input.criterionEvidence);
  }catch(e){
   throw new HttpError(400,e instanceof Error?e.message:'Rubrik geçersiz.');
  }
  let report;
  try{report=compareIndependentRubrics(primary,second)}
  catch{throw new HttpError(409,'Rubrikler karşılaştırılamadı.');}
  await tx.auditLog.create({data:{
   actorUserId:admin.id,action:ACTION,entityType:'DailyLog',entityId:row.id,
   summary:`TYMM rubrik bağımsız karşılaştırması · ${evidence.task.subject} · ${evidence.task.outcomeCode} · ${report.decision}`,
   metadata:{
    reviewType:'SECOND_RATER_BLIND_QUALITY_CHECK',outcomeCode:evidence.task.outcomeCode,
    taskId:task.id,taskVersion:task.version,phase:evidence.phase,
    firstReviewerUserId:String(first.evaluatedByUserId),secondReviewerUserId:admin.id,
    secondScores:second.criterionScores,criterionEvidence:notes,
    note:input.note,comparison:report,
    studentMasteryUnchanged:true,firstRubricUnchanged:true,
    performedAt:new Date().toISOString()
   }
  }});
  return report;
 });
 return NextResponse.json({
  ok:true,comparison,message:comparison.needsAcademicFollowUp
   ?'İki değerlendirici arasında önemli puan farkı saptandı. Branş uzmanı moderasyonu önerilir; öğrencinin ilk puanı değişmedi.'
   :'Bağımsız ikinci değerlendirme kaydedildi. İlk koç rubriği ve öğrencinin bilgi hâkimiyeti değiştirilmedi.'
 });
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
