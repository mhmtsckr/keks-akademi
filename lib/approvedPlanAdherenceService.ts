import {db} from '@/lib/db';
import {evaluateApprovedPlan,type ApprovedPlan,type PlannedDay} from '@/lib/planAdherence';
function plain(v:unknown):Record<string,unknown>{
  return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}
export async function approvedPlanAdherence(studentId:string,now=new Date()){
  const row=await db.studyPlan.findFirst({
    where:{studentId,active:true,title:{startsWith:'Akıllı Haftalık Program'}},
    orderBy:{createdAt:'desc'},select:{id:true,title:true,payload:true,createdAt:true}
  });
  if(!row)return {ok:true,approvedPlan:false,report:null,note:'Koç tarafından onaylanmış etkin Akıllı Haftalık Program bulunmuyor. Öğrencinin kendi taslağı aktif plan değildir.'};
  const payload=plain(row.payload);
  const days=Array.isArray(payload.days)?payload.days as PlannedDay[]:[];
  if(!days.length)return {ok:true,approvedPlan:true,report:null,
    note:'Etkin programda karşılaştırılabilir günlük plan bulunmuyor.'};
  const actionIds=[...new Set(days.flatMap(d=>
    Array.isArray(d.tasks)?d.tasks.filter(t=>t.type==='COACH_ACTION'&&typeof t.actionId==='string').map(t=>t.actionId!):[]
  ))].slice(0,150);
  const cutoff=new Date(Math.min(now.getTime(),row.createdAt.getTime()+9*86400000));
  const [submissions,sessions]=await Promise.all([
    actionIds.length?db.taskSubmission.findMany({
      where:{studentId,actionId:{in:actionIds},submittedAt:{gte:row.createdAt,lte:now}},
      select:{actionId:true,submittedAt:true,late:true}
    }):Promise.resolve([]),
    db.techniquePracticeSession.findMany({
      where:{studentId,startedAt:{gte:row.createdAt,lte:cutoff}},
      orderBy:{startedAt:'asc'},take:500,
      select:{startedAt:true,activeSeconds:true,completed:true}
    })
  ]);
  const report=evaluateApprovedPlan({
    id:row.id,title:row.title,createdAt:row.createdAt,days
  } satisfies ApprovedPlan,submissions,sessions,now);
  return {ok:true,approvedPlan:true,report,
    dataLimitReached:sessions.length===500||actionIds.length===150,
    note:'Yalnızca etkin ve koç tarafından onaylanmış haftalık program karşılaştırılır. Sonuçlar ölçülen kayıtları gösterir; öğrenci beyanı bağımsız öğrenme kanıtı değildir.'};
}
