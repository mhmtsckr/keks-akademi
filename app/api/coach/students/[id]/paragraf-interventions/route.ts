import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {HttpError,readJson,withApiErrors} from '@/lib/apiGuard';
import {summarizeParagrafCoachEvidence} from '@/lib/paragrafCoachRemediation';
import {PARAGRAF_COACH_ACTION_SOURCE,PARAGRAF_INTERVENTIONS,
 summarizeParagrafInterventionImpact} from '@/lib/paragrafInterventionImpact';

type Ctx={params:Promise<{id:string}>};
const interventionCode=z.enum(Object.keys(PARAGRAF_INTERVENTIONS) as [
 keyof typeof PARAGRAF_INTERVENTIONS,...(keyof typeof PARAGRAF_INTERVENTIONS)[]
]);
const createSchema=z.object({
 topic:z.string().trim().min(2).max(120),
 interventionCode,
 coachNote:z.string().trim().min(20).max(700)
}).strict();
const closeSchema=z.object({
 actionId:z.string().min(5).max(100),
 decision:z.enum(['COMPLETED','CANCELED'])
}).strict();
const noStore={'Cache-Control':'private, no-store'} as const;
async function ownedStudent(id:string){
 const user=await requireRole(['COACH','ADMIN']);
 if(!user.coachProfile)throw new HttpError(403,'Koç profili bulunamadı.');
 const student=await db.student.findFirst({
  where:{id,coachId:user.coachProfile.id},
  select:{id:true,fullName:true}
 });
 if(!student)throw new HttpError(404,'Öğrenci bulunamadı.');
 return {user,student};
}
async function studentEvidence(id:string){
 const cutoff=new Date(Date.now()-90*86400000);
 const logs=await db.dailyLog.findMany({
  where:{studentId:id,date:{gte:cutoff}},
  select:{date:true,payload:true},orderBy:{date:'desc'},take:1501
 });
 if(logs.length>1500)throw new HttpError(409,
  'Öğrencinin kanıt kayıtları 1.500 satırı aşıyor; eksik veriden müdahale açılmamalı.');
 return logs;
}
async function GET__handler(_req:Request,{params}:Ctx){
 const {id}=await params;
 await ownedStudent(id);
 const [actions,logs]=await Promise.all([
  db.coachingAction.findMany({
   where:{studentId:id,planSource:PARAGRAF_COACH_ACTION_SOURCE,
    createdAt:{gte:new Date(Date.now()-60*86400000)}},
   orderBy:{createdAt:'desc'},take:50,
   select:{id:true,topic:true,title:true,description:true,status:true,
    createdAt:true,periodEnd:true,planSource:true}
  }),
  studentEvidence(id)
 ]);
 const impact=summarizeParagrafInterventionImpact(actions,logs);
 return NextResponse.json({ok:true,...impact,
  interventionChoices:PARAGRAF_INTERVENTIONS},{headers:noStore});
}
async function POST__handler(req:Request,{params}:Ctx){
 const {id}=await params;
 const {user}=await ownedStudent(id);
 const input=await readJson(req,createSchema);
 const logs=await studentEvidence(id);
 const topics=summarizeParagrafCoachEvidence(logs,[]).topics;
 if(!topics.some(x=>x.topic===input.topic&&x.wrong+x.blank>0))
  throw new HttpError(409,'Bu beceride öğrencinin doğrulanmış yanlış veya boş ilk optik kaydı yok.');
 const choice=PARAGRAF_INTERVENTIONS[input.interventionCode];
 const now=new Date();
 const end=new Date(now.getTime()+14*86400000);
 const result=await db.$transaction(async tx=>{
  // Serialize assignments for a student/skill to prevent concurrent duplicate actions.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${id}),hashtext(${input.topic})) IS NULL AS acquired`;
  const existing=await tx.coachingAction.findFirst({
   where:{studentId:id,topic:input.topic,subject:'Türkçe',
    planSource:PARAGRAF_COACH_ACTION_SOURCE,status:'ACTIVE'},
   select:{id:true}
  });
  if(existing)throw new HttpError(409,
   'Bu öğrencinin aynı paragraf becerisinde açık koç müdahalesi var; önce onu değerlendir.');
  return tx.coachingAction.create({data:{
   studentId:id,createdByUserId:user.id,subject:'Türkçe',topic:input.topic,
   title:'KEKS Paragraf · '+choice.label,
   description:choice.task+'\n\nKoç notu: '+input.coachNote,
   metricType:'QUESTIONS',targetValue:2,currentValue:0,cadence:'WEEKLY',
   periodStart:now,periodEnd:end,taskDate:now,
   planSource:PARAGRAF_COACH_ACTION_SOURCE,status:'ACTIVE'
  }});
 });
 return NextResponse.json({ok:true,id:result.id,topic:input.topic,
  intervention:choice.label,periodEnd:end,
  note:'Koç görevi kaydedildi. Öğrencinin sonraki bağımsız soru kayıtları değerlendirilir; tamamlanan görev veya doğru soru kalıcı öğrenme sayılmaz.'
 },{status:201,headers:noStore});
}
async function PATCH__handler(req:Request,{params}:Ctx){
 const {id}=await params;
 await ownedStudent(id);
 const input=await readJson(req,closeSchema);
 const updated=await db.coachingAction.updateMany({
  where:{id:input.actionId,studentId:id,
   planSource:PARAGRAF_COACH_ACTION_SOURCE,status:'ACTIVE'},
  data:{status:input.decision}
 });
 if(!updated.count)throw new HttpError(409,'Müdahale açık değil veya bu öğrenciye ait değil.');
 return NextResponse.json({ok:true,status:input.decision,
  note:'Koç aksiyonu kapatıldı. Bu işlem öğrencinin öğrenme hâkimiyetini veya tekrar takvimini değiştirmez.'
 },{headers:noStore});
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
export const PATCH=withApiErrors(PATCH__handler);
