import {createHash} from 'node:crypto';
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {readJson,withApiErrors,HttpError} from '@/lib/apiGuard';
import {buildLearningDiagnostics} from '@/lib/learningDiagnostics';
import {buildLearningFollowUp} from '@/lib/learningFollowUp';

const inputSchema=z.object({
  subject:z.string().trim().min(1).max(180),
  topic:z.string().trim().min(1).max(180)
});

function normalize(s:string){return s.trim().toLocaleLowerCase('tr-TR');}

async function POST__handler(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)throw new HttpError(403,'Koç profili bulunamadı.');
  const {id:studentId}=await params;
  const student=await db.student.findFirst({
    where:{id:studentId,coachId:user.coachProfile.id},
    select:{id:true}
  });
  if(!student)throw new HttpError(404,'Öğrenci bulunamadı.');
  const {subject,topic}=await readJson(req,inputSchema);
  const now=new Date();
  const rows=await db.practiceLog.findMany({
    where:{studentId,date:{gte:new Date(now.getTime()-35*86400000),lte:now}},
    select:{subject:true,topic:true,date:true,total:true,correct:true,wrong:true,blank:true,taskSubmissionId:true},
    orderBy:{date:'desc'},take:500
  });
  const diagnostics=buildLearningDiagnostics(rows,now,30);
  const diagnostic=diagnostics.find(x=>normalize(x.subject)===normalize(subject)&&normalize(x.topic)===normalize(topic));
  if(!diagnostic)throw new HttpError(404,'Bu konu için güncel bir ölçüm kaydı bulunamadı.');
  const proposal=buildLearningFollowUp(diagnostic,now);
  const sourceId=createHash('sha256').update(JSON.stringify([studentId,normalize(subject),normalize(topic)])).digest('hex');
  const where={
    studentId,coachId:user.coachProfile.id,
    sourceType:'MIZA_TOPIC_RECHECK',
    sourceId,status:'OPEN'
  };
  const existing=await db.coachTask.findFirst({where,select:{id:true}});
  if(existing){
    return NextResponse.json({ok:true,alreadyPending:true,coachTaskId:existing.id,proposal});
  }
  const title=('MİZA · Yeniden ölç: '+diagnostic.subject+' · '+diagnostic.topic).slice(0,240);
  const message=[
    'ÖĞRENME SİNYALİ: '+diagnostic.signal,
    'Kanıt düzeyi: '+diagnostic.confidence,
    proposal.rationale,
    'Önerilen kontrol: '+proposal.instruction,
    'Ölçüm kaynağı: '+proposal.sourceNote,
    'Hedef: '+proposal.questionCount+' YENİ soru. Önceki soruları aynen tekrar etmek yerine benzer kazanım ve güçlükte kontrol yap.',
    'Koç kendi kararını vermeden öğrenci görev planı değiştirilmez.'
  ].join('\n');
  const task=await db.coachTask.create({
    data:{
      studentId,coachId:user.coachProfile.id,
      title,description:message,
      priority:diagnostic.signal==='REGRESSING'||diagnostic.signal==='AT_RISK'?'HIGH':'MEDIUM',
      status:'OPEN',dueAt:new Date(proposal.dueAt),
      sourceType:'MIZA_TOPIC_RECHECK',sourceId
    }
  });
  await db.auditLog.create({data:{
    actorUserId:user.id,
    action:'MIZA_LEARNING_FOLLOW_UP_REQUESTED',
    entityType:'CoachTask',
    entityId:task.id,
    summary:'Koç konu yeniden ölçüm önerisini takip görevine dönüştürdü; öğrenci çalışma planı değiştirilmedi.',
    metadata:{studentId,subject:diagnostic.subject,topic:diagnostic.topic,signal:diagnostic.signal,dueDate:proposal.dueDate}
  }});
  return NextResponse.json({ok:true,alreadyPending:false,coachTaskId:task.id,proposal});
}
export const POST=withApiErrors(POST__handler);
