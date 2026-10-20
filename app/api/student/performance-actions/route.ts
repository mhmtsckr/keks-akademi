import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {readJson,withApiErrors,HttpError} from '@/lib/apiGuard';
import {submitActionEvidence,actionAttempts,actionReviews} from '@/lib/tymmActionEvidenceReview';
import {buildRemediationImpactReport} from '@/lib/tymmRemediationImpact';
const inputSchema=z.object({
 assignmentId:z.string().min(5).max(100),
 reflection:z.string().trim().min(40).max(1800),
 confirmedOwnWork:z.literal(true)
}).strict();
function obj(x:unknown):Record<string,unknown>{
 return x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:{};
}
async function GET__handler(){
 const user=await requireRole(['STUDENT']);
 if(!user.student)throw new HttpError(403,'Öğrenci profili bulunamadı.');
 const rows=await db.dailyLog.findMany({
  where:{studentId:user.student.id,payload:{path:['type'],equals:'TYMM_RUBRIC_ACTION'}},
  orderBy:{createdAt:'desc'},take:100,select:{id:true,createdAt:true,payload:true}
 });
 const taskIds=[...new Set(rows.map(row=>String(obj(row.payload).taskId||'')).filter(Boolean))];
 const assessments=taskIds.length?await db.dailyLog.findMany({
  where:{studentId:user.student.id,OR:taskIds.map(taskId=>({
   payload:{path:['taskId'],equals:taskId}
  }))},
  orderBy:{createdAt:'desc'},take:500,
  select:{id:true,createdAt:true,payload:true}
 }):[];
 const evidenceRows=[...new Map([...rows,...assessments].map(row=>[row.id,row])).values()];
 const remediationImpact=buildRemediationImpactReport(evidenceRows);
 return NextResponse.json({ok:true,remediationSummary:remediationImpact.summary,
  remediationCaveat:remediationImpact.caveat,
  assignments:rows.flatMap(row=>{
  const p=obj(row.payload);
  if(p.type!=='TYMM_RUBRIC_ACTION')return [];
  return [{
   id:row.id,createdAt:row.createdAt,status:p.status,
   impact:remediationImpact.impacts.find(x=>x.assignmentId===row.id)||null,
   subject:p.subject,grade:p.grade,criterionLabel:p.criterionLabel,
   assignment:p.assignment,expectedEvidence:p.expectedEvidence,
   minutes:p.minutes,coachNote:p.coachNote,reflection:p.reflection||null,
   completedAt:p.completedAt||null,
   attemptCount:actionAttempts(p).length,review:p.review||null,
   reviewHistory:actionReviews(p).map(r=>({attempt:r.attempt,decision:r.decision,feedback:r.feedback,reviewedAt:r.reviewedAt}))
  }];
 }),note:'Bu telafi görevini bitirmek öğrenme hâkimiyeti veya tekrar programını otomatik değiştirmez.'});
}
async function PATCH__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student)throw new HttpError(403,'Öğrenci profili bulunamadı.');
 const input=await readJson(req,inputSchema);
 const row=await db.dailyLog.findFirst({
  where:{id:input.assignmentId,studentId:user.student.id},
  select:{id:true,payload:true}
 });
 if(!row)throw new HttpError(404,'Bu telafi çalışması sana ait değil.');
 const payload=obj(row.payload);
 if(payload.type!=='TYMM_RUBRIC_ACTION')throw new HttpError(404,'Bu kayıt telafi görevi değil.');
 if(!['ASSIGNED','REVISION_REQUIRED'].includes(String(payload.status)))
  throw new HttpError(409,'Bu çalışma gönderime açık değil; koç incelemesi bekleniyor veya sonuçlandı.');
 let next;
 try{next=submitActionEvidence(payload,input.reflection,new Date().toISOString());}
 catch(e){throw new HttpError(409,e instanceof Error?e.message:'Çalışma gönderilemedi.');}
 const updated=await db.dailyLog.updateMany({
  where:{id:row.id,studentId:user.student.id,
    payload:{path:['status'],equals:String(payload.status)}},
  data:{payload:next}
 });
 if(!updated.count)throw new HttpError(409,'Görev başka bir işlemde tamamlandı.');
 return NextResponse.json({ok:true,assignmentId:row.id,status:'SUBMITTED_FOR_REVIEW',
   message:'Çalışman koç incelemesine gönderildi. Koç kabul edebilir veya yeniden çalışma isteyebilir; kazanım otomatik Kalıcı olmadı.'});
}
export const GET=withApiErrors(GET__handler);
export const PATCH=withApiErrors(PATCH__handler);
