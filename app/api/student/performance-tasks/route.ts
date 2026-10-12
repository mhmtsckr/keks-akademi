import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {readJson,withApiErrors} from '@/lib/apiGuard';
import {resolveLearningCurriculumContext} from '@/lib/curriculumPolicy2026';
import {performanceTaskById,performanceTasksForGrade,performanceTaskEvidence} from '@/lib/tymmPerformanceTasks';

const schema=z.object({
 taskId:z.string().min(3).max(130),
 grade:z.number().int().min(1).max(12),
 response:z.string().trim().min(50).max(6000),
 observations:z.string().trim().min(15).max(2000),
 confirmedOwnWork:z.literal(true)
}).strict();

function object(v:unknown):Record<string,unknown>{
 return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}

async function GET__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student)return NextResponse.json({error:'Öğrenci profili bulunamadı.'},{status:403});
 const raw=new URL(req.url).searchParams.get('grade');
 if(raw&&!/^(?:[1-9]|1[0-2])$/.test(raw))return NextResponse.json({error:'Sınıf değeri geçersiz.'},{status:400});
 const grade=raw?Number(raw):null;
 const context=resolveLearningCurriculumContext({gradeLevel:user.student.gradeLevel,selectedGrade:grade});
 const tasks=context.grade===null?[]:performanceTasksForGrade(context.grade)
  .map(t=>({...t,sourceEvidence:performanceTaskEvidence(t)}));
 const logs=await db.dailyLog.findMany({
  where:{studentId:user.student.id,payload:{path:['type'],string_contains:'TYMM_PERFORMANCE_'}},
  orderBy:{createdAt:'desc'},take:80,
  select:{id:true,createdAt:true,payload:true}
 });
 const history=logs.map(log=>{
  const p=object(log.payload);
  if(!['TYMM_PERFORMANCE_SUBMISSION','TYMM_PERFORMANCE_REVIEWED'].includes(String(p.type)))return null;
  if(!tasks.some(t=>t.id===p.taskId&&t.version===p.taskVersion))return null;
  return {
    id:log.id,taskId:p.taskId,version:p.taskVersion,submittedAt:log.createdAt,
    status:p.type==='TYMM_PERFORMANCE_REVIEWED'?'REVIEWED':'WAITING_FOR_COACH',
    response:p.response,observations:p.observations,
    review:p.type==='TYMM_PERFORMANCE_REVIEWED'?object(p.review):null
  };
 }).filter(Boolean);
 return NextResponse.json({
   ok:true,curriculumContext:context,
   tasks,history,
   note:'Puanlama yalnız yetkili koçun rubrik değerlendirmesiyle yapılır. Çalışmayı teslim etmek bilgi hâkimiyetini veya tekrar takvimini otomatik değiştirmez.'
 });
}

async function POST__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student)return NextResponse.json({error:'Öğrenci profili bulunamadı.'},{status:403});
 const input=await readJson(req,schema);
 const context=resolveLearningCurriculumContext({gradeLevel:user.student.gradeLevel,selectedGrade:input.grade});
 if(context.grade!==input.grade||context.framework!=='TYMM')
  return NextResponse.json({error:'Bu performans görevi öğrencinin gerçek sınıfına ve yürürlükteki programa uygun değil.'},{status:403});
 const task=performanceTaskById(input.taskId);
 if(!task||task.grade!==input.grade)
  return NextResponse.json({error:'Seçilen görev bu sınıfa ait değil.'},{status:404});
 if(!performanceTaskEvidence(task).outcomeCodeVerified)
  return NextResponse.json({error:'Görevin resmî öğrenme çıktısı kaynağı doğrulanmamış.'},{status:409});
 const recently=await db.dailyLog.findMany({
   where:{studentId:user.student.id,createdAt:{gte:new Date(Date.now()-7*86400000)},
     payload:{path:['type'],string_contains:'TYMM_PERFORMANCE_'}},
   take:80,select:{payload:true}
 });
 const taskRecent=recently.filter(row=>object(row.payload).taskId===task.id);
 if(taskRecent.length>=3)return NextResponse.json({
   error:'Bu görev için yedi günde en fazla üç teslim yapılabilir. Önce koçundan geribildirim al.'
 },{status:429});
 const submitted=await db.dailyLog.create({
   data:{studentId:user.student.id,date:new Date(),payload:{
     type:'TYMM_PERFORMANCE_SUBMISSION',taskId:task.id,taskVersion:task.version,
     grade:task.grade,subject:task.subject,outcomeCode:task.outcomeCode,
     response:input.response,observations:input.observations,
     selfReportedOriginal:true,academicYear:context.academicYear,
     status:'WAITING_FOR_COACH',masteryStatusUnchanged:true
   }}
 });
 return NextResponse.json({
   ok:true,submissionId:submitted.id,status:'WAITING_FOR_COACH',
   message:'Özgün yanıtın kaydedildi. Rubrik puanını ve geribildirimi koçun verecek; KEKS otomatik doğru kabul etmez.',
   masteryStatusUnchanged:true
 },{status:201});
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
