import {createHash} from 'node:crypto';
import {Prisma} from '@prisma/client';
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {requireRole} from '@/lib/auth';
import {HttpError,readJson,withApiErrors} from '@/lib/apiGuard';
import {readAcademicPerformance} from '@/lib/academicPerformanceService';
import {academicInterventionKey,selectAcademicPlanRecommendations} from '@/lib/academicPlanRecommendations';
import {evaluateAcademicCrossSourceOutcome} from '@/lib/academicCrossSourceOutcome';

const bodySchema=z.object({
  action:z.literal('REQUEST_RECHECK'),
  examType:z.string().trim().min(1).max(100),
  subject:z.string().trim().min(1).max(180),
  topic:z.string().trim().min(1).max(180),
  decisionReason:z.string().trim().min(15).max(500)
});
function meta(raw:unknown){
  return raw&&typeof raw==='object'&&!Array.isArray(raw)
    ?raw as Record<string,unknown>:{};
}
async function ownedStudent(studentId:string){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)throw new HttpError(403,'Koç profili bulunamadı.');
  const student=await db.student.findFirst({
    where:{id:studentId,coachId:user.coachProfile.id},
    select:{id:true}
  });
  if(!student)throw new HttpError(404,'Öğrenci bulunamadı.');
  return {user,student};
}
async function POST__handler(req:Request,{params}:{params:Promise<{id:string}>}){
  const {id:studentId}=await params;
  const {user}=await ownedStudent(studentId);
  const input=await readJson(req,bodySchema);
  const report=await readAcademicPerformance(studentId);
  if(report.limited)throw new HttpError(409,
    'Kanıt listesi üst sınıra ulaştı. Eksik veriye dayanarak takip görevi açılmadı.');
  const options=selectAcademicPlanRecommendations(report.topicConcordance,30);
  const proposal=options.find(x=>academicInterventionKey(x)===academicInterventionKey(input));
  if(!proposal)throw new HttpError(409,
    'Bu konu için iki kaynakta yeterli gün ve soru kanıtı yok veya öneri güncelliğini yitirdi. Raporu yenileyin.');
  const sourceId=createHash('sha256')
    .update(JSON.stringify([studentId,academicInterventionKey(proposal)])).digest('hex');
  const now=new Date();
  try{
    const result=await db.$transaction(async tx=>{
      const existing=await tx.coachTask.findFirst({
        where:{studentId,coachId:user.coachProfile!.id,
          sourceType:'ACADEMIC_CROSS_SOURCE_RECHECK',
          sourceId,status:'OPEN'},
        select:{id:true}
      });
      if(existing)return {id:existing.id,alreadyOpen:true};
      const created=await tx.coachTask.create({data:{
        coachId:user.coachProfile!.id,studentId,
        sourceType:'ACADEMIC_CROSS_SOURCE_RECHECK',sourceId,
        title:('Akademik kanıt incelemesi · '+proposal.examType+' · '+proposal.subject+' · '+proposal.topic).slice(0,250),
        description:[
          'Koçun inceleyeceği akademik performans sinyali: '+proposal.status,
          'Pratik: '+proposal.practiceQuestions+' soru / '+proposal.practiceDays+' gün; doğruluk %'+proposal.practiceAccuracy,
          'Deneme analizi: '+proposal.examQuestions+' soru / '+proposal.examDays+' gün; doğruluk %'+proposal.examAccuracy,
          'Kaynaklar arası fark: '+proposal.differencePoints+' yüzde puan.',
          'Koç kararı: '+input.decisionReason,
          proposal.instruction,
          'Bu kayıt öğrenci için zorunlu bir çalışma görevi oluşturmaz; mevcut programı, koç görevlerini veya tekrar tarihlerini değiştirmez.'
        ].join('\n'),
        status:'OPEN',priority:proposal.priority,
        dueAt:new Date(now.getTime()+3*86400000)
      }});
      await tx.auditLog.create({data:{
        actorUserId:user.id,
        action:'ACADEMIC_CROSS_SOURCE_RECHECK_REQUESTED',
        entityType:'CoachTask',entityId:created.id,
        summary:'Koç akademik kanıt karşılaştırması için takip incelemesi açtı; öğrenci planı değiştirilmedi.',
        metadata:{
          studentId,examType:proposal.examType,subject:proposal.subject,topic:proposal.topic,
          state:proposal.status,decisionReason:input.decisionReason,
          practiceQuestions:proposal.practiceQuestions,examQuestions:proposal.examQuestions,
          practiceAccuracy:proposal.practiceAccuracy,examAccuracy:proposal.examAccuracy,
          proposedAt:now.toISOString()
        }
      }});
      return {id:created.id,alreadyOpen:false};
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,maxWait:6000,timeout:15000});
    return NextResponse.json({
      ok:true,coachTaskId:result.id,alreadyOpen:result.alreadyOpen,
      message:result.alreadyOpen?'Bu konuyla ilgili açık koç incelemesi zaten var.'
        :'Koç incelemesi kaydedildi. Öğrenciye yeni zorunlu görev eklenmedi.'
    },{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){
    if((error as {code?:string})?.code==='P2034')
      throw new HttpError(409,'Başka bir koç incelemesi aynı anda güncellendi. Sayfayı yenileyin.');
    throw error;
  }
}
async function GET__handler(_req:Request,{params}:{params:Promise<{id:string}>}){
  const {id:studentId}=await params;
  const {user}=await ownedStudent(studentId);
  const now=new Date();
  const tasks=await db.coachTask.findMany({
    where:{studentId,coachId:user.coachProfile!.id,
      sourceType:'ACADEMIC_CROSS_SOURCE_RECHECK',
      createdAt:{gte:new Date(now.getTime()-45*86400000)}},
    orderBy:[{createdAt:'desc'},{id:'desc'}],
    take:21,select:{id:true,createdAt:true,status:true}
  });
  const selected=tasks.slice(0,20);
  if(!selected.length)return NextResponse.json({
    ok:true,items:[],truncated:false,
    note:'Son 45 günde koç tarafından açılmış akademik kanıt incelemesi yok.'
  },{headers:{'Cache-Control':'private, no-store'}});
  const [audits,practice,exams]=await Promise.all([
    db.auditLog.findMany({
      where:{action:'ACADEMIC_CROSS_SOURCE_RECHECK_REQUESTED',
        entityType:'CoachTask',entityId:{in:selected.map(x=>x.id)}},
      orderBy:{createdAt:'desc'},take:50,
      select:{entityId:true,metadata:true}
    }),
    db.practiceLog.findMany({
      where:{studentId,date:{gte:new Date(now.getTime()-60*86400000),lte:now}},
      orderBy:[{date:'desc'},{id:'desc'}],take:1200,
      select:{examType:true,subject:true,topic:true,date:true,
        correct:true,wrong:true,blank:true}
    }),
    db.examAnalyticsRecord.findMany({
      where:{studentId,examDate:{gte:new Date(now.getTime()-60*86400000),lte:now}},
      orderBy:[{examDate:'desc'},{id:'desc'}],take:650,
      select:{examType:true,subject:true,topic:true,examDate:true,
        correct:true,wrong:true,blank:true}
    })
  ]);
  const metadata=new Map<string,{examType:string;subject:string;topic:string}>();
  for(const audit of audits){
    if(!audit.entityId||metadata.has(audit.entityId))continue;
    const m=meta(audit.metadata);
    if(typeof m.examType==='string'&&typeof m.subject==='string'&&typeof m.topic==='string')
      metadata.set(audit.entityId,{examType:m.examType,subject:m.subject,topic:m.topic});
  }
  const outcomeExams=exams.map(x=>({...x,date:x.examDate}));
  const items=selected.flatMap(task=>{
    const info=metadata.get(task.id);
    return info?[evaluateAcademicCrossSourceOutcome({...task,...info},practice,outcomeExams,now)]:[];
  });
  return NextResponse.json({
    ok:true,items,
    truncated:tasks.length>20||practice.length===1200||exams.length===650||audits.length===50,
    note:'Ölçüm öncesi ve sonrası, inceleme görevinin açılış tarihi esas alınarak tanımlayıcı biçimde karşılaştırılır; gerçek müdahalenin uygulanması ya da nedensel sonuç doğrulanmış değildir.'
  },{headers:{'Cache-Control':'private, no-store'}});
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
