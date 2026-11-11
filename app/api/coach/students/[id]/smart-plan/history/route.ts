import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireRole} from '@/lib/auth';
import {HttpError,withApiErrors} from '@/lib/apiGuard';
import {isFeatureEnabled} from '@/lib/systemConfig';
import {compareWeeklyPlans} from '@/lib/smartPlanApproval';

function metaObject(raw:unknown):Record<string,unknown>{
  return raw&&typeof raw==='object'&&!Array.isArray(raw)
    ?raw as Record<string,unknown>:{};
}
async function GET__handler(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)throw new HttpError(403,'Koç profili bulunamadı.');
  const {id}=await params;
  const student=await db.student.findFirst({
    where:{id,coachId:user.coachProfile.id},
    select:{id:true,studentCode:true}
  });
  if(!student)throw new HttpError(404,'Öğrenci bulunamadı.');
  if(!(await isFeatureEnabled('SMART_COACH',student.studentCode)))
    throw new HttpError(403,'Akıllı Koç bu öğrenci için etkin değil.');
  const plans=await db.studyPlan.findMany({
    where:{studentId:id,title:{startsWith:'Akıllı Haftalık Program'}},
    orderBy:[{createdAt:'desc'},{id:'desc'}],
    select:{id:true,title:true,active:true,createdAt:true,payload:true},
    take:21
  });
  const visible=plans.slice(0,20);
  const audits=visible.length?await db.auditLog.findMany({
    where:{action:'SMART_WEEKLY_PLAN_ACTIVATED',entityType:'StudyPlan',
      entityId:{in:visible.map(x=>x.id)}},
    orderBy:{createdAt:'desc'},
    select:{entityId:true,createdAt:true,metadata:true,actor:{select:{name:true}}},
    take:40
  }):[];
  const auditByPlan=new Map<string,(typeof audits)[number]>();
  for(const audit of audits)
    if(audit.entityId&&!auditByPlan.has(audit.entityId))
      auditByPlan.set(audit.entityId,audit);
  const history=visible.map((record,i)=>{
    const audit=auditByPlan.get(record.id);
    const metadata=metaObject(audit?.metadata);
    const reason=typeof metadata.revisionReason==='string'?metadata.revisionReason:null;
    // Compare to the prior chronological plan, not a newly generated draft.
    const comparison=compareWeeklyPlans(visible[i+1]?.payload??null,record.payload);
    return {
      id:record.id,title:record.title,active:record.active,
      createdAt:record.createdAt,approvedBy:audit?.actor?.name??null,
      approvedAt:audit?.createdAt??null,
      revisionReason:reason,
      summary:comparison.proposed,
      versusPrevious:{
        deltaMinutes:comparison.deltaMinutes,
        deltaCoachTasks:comparison.deltaCoachTasks,
        deltaReviewQuestions:comparison.deltaReviewQuestions,
        addedTasks:comparison.addedTasks,removedTasks:comparison.removedTasks
      }
    };
  });
  return NextResponse.json({
    ok:true,history,truncated:plans.length>20,
    note:'Plan geçmişi yalnızca okuma içindir. Eski programın tekrar etkinleştirilmesi ayrı önizleme ve açık onay gerektirir. Gerekçe bulunmayan eski kayıtlar geriye dönük doldurulmaz.'
  },{headers:{'Cache-Control':'private, no-store'}});
}
export const GET=withApiErrors(GET__handler);
