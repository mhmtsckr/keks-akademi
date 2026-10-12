import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {performanceTaskById,evaluateHumanRubric} from '@/lib/tymmPerformanceTasks';
import {transferVariantFor,compareTransferRubrics,readableRubric} from '@/lib/tymmDelayedTransfer';

const reviewSchema=z.object({
 submissionId:z.string().min(5).max(90),
 scores:z.record(z.number().int().min(0).max(2)),
 feedback:z.string().trim().min(30).max(1800),
 nextAction:z.enum(['RETRY_WITH_FEEDBACK','DIFFERENT_CONTEXT','DISCUSS_WITH_COACH'])
}).strict();

function obj(v:unknown):Record<string,unknown>{
 return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}
type ApiContext={params:Promise<{id:string}>};
async function ownedStudent(id:string){
 const user=await requireRole(['COACH','ADMIN']);
 if(!user.coachProfile)return {user,student:null};
 const student=await db.student.findFirst({
  where:{id,coachId:user.coachProfile.id},
  select:{id:true,fullName:true,gradeLevel:true}
 });
 return {user,student};
}
async function GET__handler(_req:Request,{params}:ApiContext){
 const {id}=await params;
 const {student}=await ownedStudent(id);
 if(!student)return NextResponse.json({error:'Bu öğrenci için koç yetkisi bulunamadı.'},{status:403});
 const rows=await db.dailyLog.findMany({
  where:{studentId:id,payload:{path:['type'],string_contains:'TYMM_'}},
  orderBy:{createdAt:'desc'},take:100,
  select:{id:true,createdAt:true,payload:true}
 });
 const submissions=rows.flatMap(log=>{
  const p=obj(log.payload),type=String(p.type||'');
  if(!['TYMM_PERFORMANCE_SUBMISSION','TYMM_PERFORMANCE_REVIEWED','TYMM_TRANSFER_SUBMISSION','TYMM_TRANSFER_REVIEWED'].includes(type))return [];
  const task=performanceTaskById(String(p.taskId||''),Number(p.taskVersion));
 const isTransfer=p.type==='TYMM_TRANSFER_SUBMISSION';
 const variant=isTransfer?transferVariantFor(String(p.taskId||'')):null;
  if(!task||task.grade!==p.grade)return [];
  const transfer=type.startsWith('TYMM_TRANSFER_');
  const variant=transfer?transferVariantFor(task.id):null;
  if(transfer&&(!variant||p.transferVariantId!==variant.id||p.transferVersion!==variant.version))return [];
  const criteria=variant?variant.criteria:task.criteria;
  return [{
    id:log.id,submittedAt:log.createdAt,
    status:type==='TYMM_PERFORMANCE_REVIEWED'||type==='TYMM_TRANSFER_REVIEWED'?'REVIEWED':'WAITING_FOR_COACH',
    phase:transfer?'TRANSFER':'BASELINE',
    task:{id:task.id,title:variant?.title||task.title,subject:task.subject,grade:task.grade,
      kind:task.kind,outcomeCode:task.outcomeCode,sourceUrl:task.sourceUrl,
      instruction:variant?.instruction||task.instruction,criteria,
      maxScore:criteria.length*2},
    response:String(p.response||''),observations:String(p.observations||''),
    baselineSubmissionId:transfer?String(p.baselineSubmissionId||''):null,
    review:type==='TYMM_PERFORMANCE_REVIEWED'||type==='TYMM_TRANSFER_REVIEWED'?obj(p.review):null
  }];
 });
 return NextResponse.json({
  ok:true,student:{id:student.id,fullName:student.fullName},
  submissions,waiting:submissions.filter(x=>x.status==='WAITING_FOR_COACH').length,
  note:'Rubrik koçun manuel kararıdır; tek puan öğrencinin kalıcı öğrenme düzeyini otomatik değiştirmez.'
 });
}

async function POST__handler(req:Request,{params}:ApiContext){
 const {id}=await params;
 const {user,student}=await ownedStudent(id);
 if(!student||!user.coachProfile)return NextResponse.json({error:'Bu öğrenci için koç yetkisi bulunamadı.'},{status:403});
 const input=await readJson(req,reviewSchema);
 const row=await db.dailyLog.findFirst({where:{id:input.submissionId,studentId:id}});
 if(!row)return NextResponse.json({error:'Öğrenci gönderimi bulunamadı.'},{status:404});
 const p=obj(row.payload);
 if(['TYMM_PERFORMANCE_REVIEWED','TYMM_TRANSFER_REVIEWED'].includes(String(p.type)))
  return NextResponse.json({error:'Bu gönderim zaten değerlendirildi; önceki rubrik değiştirilemez.'},{status:409});
 if(!['TYMM_PERFORMANCE_SUBMISSION','TYMM_TRANSFER_SUBMISSION'].includes(String(p.type)))
  return NextResponse.json({error:'Bu kayıt performans görevi değildir.'},{status:409});
 const task=performanceTaskById(String(p.taskId||''),Number(p.taskVersion));
 if(!task||p.grade!==task.grade||isTransfer&&(!variant||p.transferVariantId!==variant.id||p.transferVersion!==variant.version))
  return NextResponse.json({error:'İçerik sürümü, görev çeşidi veya sınıf uyuşmuyor.'},{status:409});
 let comparisonInput=null;
 if(isTransfer){
  const baseline=await db.dailyLog.findFirst({
    where:{id:String(p.baselineSubmissionId||''),studentId:id}
  });
  const baseMeta=obj(baseline?.payload);
  if(baseMeta.type!=='TYMM_PERFORMANCE_REVIEWED'||baseMeta.taskId!==task.id)
   return NextResponse.json({error:'İlk koç değerlendirmesi doğrulanamadı.'},{status:409});
  const reviewedBaseline=readableRubric(obj(baseMeta.review));
  if(!reviewedBaseline)return NextResponse.json({error:'İlk rubrik kaydı geçersiz.'},{status:409});
  comparisonInput=reviewedBaseline;
 }
 let score;
 try{score=evaluateHumanRubric(isTransfer?{...task,criteria:variant!.criteria}:task,input.scores);}catch{
  return NextResponse.json({error:'Rubriğin dört ölçütünün tamamı 0, 1 veya 2 puanla değerlendirilmeli.'},{status:400});
 }
 const comparison=comparisonInput?compareTransferRubrics(comparisonInput,score):null;
 const reviewedAt=new Date().toISOString();
 const review={
  ...score,comparison,feedback:input.feedback,nextAction:input.nextAction,
  evaluatedByUserId:user.id,evaluatedByCoachId:user.coachProfile.id,
  reviewedAt,assessmentType:isTransfer?'HUMAN_COACH_TRANSFER_RUBRIC':'HUMAN_COACH_RUBRIC',
  evidence:'Student written submission; no in-person experimental observation verified',
  masteryStatusUnchanged:true
 };
 const result=await db.dailyLog.updateMany({
  where:{id:row.id,studentId:id,payload:{path:['type'],equals:isTransfer?'TYMM_TRANSFER_SUBMISSION':'TYMM_PERFORMANCE_SUBMISSION'}},
  data:{payload:{...p,type:isTransfer?'TYMM_TRANSFER_REVIEWED':'TYMM_PERFORMANCE_REVIEWED',status:'REVIEWED',review}}
 });
 if(!result.count)return NextResponse.json({error:'Bu gönderim eş zamanlı olarak değerlendirildi.'},{status:409});
 return NextResponse.json({
  ok:true,submissionId:row.id,review,
  message:isTransfer?'Gecikmeli bağımsız görevin rubriği ve ölçüt bazlı gelişim karşılaştırması kaydedildi. Kalıcı öğrenme iddiası oluşturulmadı.':'İlk koç rubriği kaydedildi; bağımsız yeni bağlam görevi yedi gün sonra açılabilir.'
 });
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
