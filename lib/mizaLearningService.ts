import {db} from '@/lib/db';
import type {buildMizaTodayOrchestration} from '@/lib/mizaOrchestrator';

type MizaOrchestration=ReturnType<typeof buildMizaTodayOrchestration>;

function dateBounds(dateKey:string){
  const start=new Date(dateKey+'T00:00:00+03:00');
  return {start,end:new Date(start.getTime()+86400000)};
}

export async function recordMizaDailySummary(studentId:string,orchestration:MizaOrchestration){
  const {start,end}=dateBounds(orchestration.date);
  const now=new Date();
  const totalTasks=orchestration.tasks.length;
  const completedTasks=orchestration.tasks.filter(x=>x.completed).length;
  const completedMinutes=orchestration.tasks
    .filter(x=>x.completed)
    .reduce((sum,x)=>sum+x.estimatedMinutes,0);
  const remainingMinutes=orchestration.tasks
    .filter(x=>!x.completed)
    .reduce((sum,x)=>sum+x.estimatedMinutes,0);
  const payload={
    type:'MIZA_DAILY_ORCHESTRATION_SUMMARY',
    date:orchestration.date,
    engineVersion:orchestration.engineVersion,
    totalTasks,
    completedTasks,
    remainingTasks:orchestration.remainingTasks,
    completionRate:totalTasks?Math.round(completedTasks/totalTasks*100):100,
    completedEstimatedMinutes:completedMinutes,
    remainingEstimatedMinutes:remainingMinutes,
    dueReviews:orchestration.dueReviews,
    coachTasks:orchestration.coachTasks,
    remainingTitles:orchestration.tasks.filter(x=>!x.completed).slice(0,5).map(x=>x.title),
    authority:'COACH_OVERRIDES_MIZA',
    updatedAt:now.toISOString()
  };

  const existing=await db.dailyLog.findFirst({
    where:{
      studentId,
      date:{gte:start,lt:end},
      payload:{path:['type'],equals:'MIZA_DAILY_ORCHESTRATION_SUMMARY'}
    },
    orderBy:{createdAt:'desc'},
    select:{id:true}
  });

  return existing
    ?db.dailyLog.update({where:{id:existing.id},data:{date:now,payload}})
    :db.dailyLog.create({data:{studentId,date:now,payload}});
}
