import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireRole} from '@/lib/auth';
import {HttpError,withApiErrors} from '@/lib/apiGuard';
import {evaluateLearningInterventionOutcome} from '@/lib/learningInterventionOutcome';

function record(value:unknown):Record<string,unknown>{
  return value&&typeof value==='object'&&!Array.isArray(value)
    ?value as Record<string,unknown>:{};
}
async function GET__handler(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)throw new HttpError(403,'Koç profili bulunamadı.');
  const {id:studentId}=await params;
  const student=await db.student.findFirst({
    where:{id:studentId,coachId:user.coachProfile.id},
    select:{id:true}
  });
  if(!student)throw new HttpError(404,'Öğrenci bulunamadı.');
  const now=new Date();
  const cutoff=new Date(now.getTime()-45*86400000);
  const tasks=await db.coachTask.findMany({
    where:{
      studentId,coachId:user.coachProfile.id,
      sourceType:'MIZA_TOPIC_RECHECK',createdAt:{gte:cutoff}
    },
    select:{id:true,createdAt:true,dueAt:true,status:true},
    orderBy:{createdAt:'desc'},take:25
  });
  if(!tasks.length)return NextResponse.json({
    ok:true,items:[],truncated:false,description:'Son 45 günde koç tarafından açılan yeniden ölçüm takibi yok.'
  },{headers:{'Cache-Control':'private, no-store'}});
  const [audits,rows]=await Promise.all([
    db.auditLog.findMany({
      where:{entityType:'CoachTask',action:'MIZA_LEARNING_FOLLOW_UP_REQUESTED',
        entityId:{in:tasks.map(x=>x.id)}},
      select:{entityId:true,metadata:true},
      orderBy:{createdAt:'desc'},take:100
    }),
    db.practiceLog.findMany({
      where:{studentId,date:{gte:new Date(now.getTime()-60*86400000),lte:now}},
      select:{subject:true,topic:true,date:true,total:true,correct:true,wrong:true,blank:true,taskSubmissionId:true},
      orderBy:{date:'desc'},take:1200
    })
  ]);
  const metadata=new Map<string,{subject:string;topic:string}>();
  for(const audit of audits){
    if(!audit.entityId||metadata.has(audit.entityId))continue;
    const m=record(audit.metadata);
    if(typeof m.subject==='string'&&m.subject.trim()
      &&typeof m.topic==='string'&&m.topic.trim()){
      metadata.set(audit.entityId,{subject:m.subject,topic:m.topic});
    }
  }
  const items=tasks.flatMap(task=>{
    const info=metadata.get(task.id);
    if(!info)return [];
    return [evaluateLearningInterventionOutcome({...task,...info},rows,now)];
  });
  return NextResponse.json({
    ok:true,
    items,
    truncated:rows.length===1200||tasks.length===25,
    description:'Karşılaştırmalar bir koç takip işi açıldığı tarihten öncesi ve sonrası için gözlemseldir. Gerçek müdahale uygulanma zamanı, soru eşdeğerliği ve nedensel etki doğrulanmamıştır.'
  },{headers:{'Cache-Control':'private, no-store'}});
}
export const GET=withApiErrors(GET__handler);
