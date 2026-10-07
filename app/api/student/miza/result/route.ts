import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {HttpError,readJson,withApiErrors} from '@/lib/apiGuard';
import {ensureTodayLearningPlan} from '@/lib/learningEngine';
import {buildMizaTodayOrchestration} from '@/lib/mizaOrchestrator';
import {isFeatureEnabled} from '@/lib/systemConfig';
import {recordMizaDailySummary} from '@/lib/mizaLearningService';

const schema=z.object({
  taskId:z.string().min(1).max(300),
  achievedValue:z.number().min(0).max(10000).optional(),
  completed:z.boolean().default(true)
});

function dayBounds(){
  const key=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const start=new Date(key+'T00:00:00+03:00');
  return {start,end:new Date(start.getTime()+86400000)};
}

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)throw new HttpError(400,'Öğrenci profili yok.');
  if(!(await isFeatureEnabled('MIZA_ORCHESTRATOR',user.student.studentCode)))throw new HttpError(403,'MİZA Öğrenme Orkestratörü bu hesap için etkin değil.');
  if(!(await isFeatureEnabled('TODAY_PLAN',user.student.studentCode)))throw new HttpError(403,'Bugünün Planı bu hesap için etkin değil.');

  const input=await readJson(req,schema);
  const today=await ensureTodayLearningPlan(user.student.id);
  const orchestration=buildMizaTodayOrchestration(today);
  const task=orchestration.tasks.find(x=>x.id===input.taskId);
  if(!task)throw new HttpError(404,'Bugünkü MİZA görevi bulunamadı.');
  if(!['ACTION_PROGRESS','SIMPLE_COMPLETE'].includes(task.resultMode)){
    throw new HttpError(409,'Bu görev kendi ölçüm akışından kaydedilmelidir.');
  }

  const target=Math.max(0,Number(task.targetValue||0));
  const achieved=Math.max(0,Number(input.achievedValue??(input.completed?target:0)));
  const completed=input.completed&&(target<=0||achieved>=target);
  const now=new Date();

  if(task.resultMode==='ACTION_PROGRESS'){
    if(!task.actionId)throw new HttpError(409,'Koç görevi bağlantısı bulunamadı.');
    const action=await db.coachingAction.findFirst({where:{id:task.actionId,studentId:user.student.id}});
    if(!action)throw new HttpError(404,'Koç görevi bulunamadı.');
    await db.coachingAction.update({
      where:{id:action.id},
      data:{
        currentValue:Math.min(achieved,action.targetValue),
        status:completed?'COMPLETED':'ACTIVE'
      }
    });
  }

  const {start,end}=dayBounds();
  const existing=await db.dailyLog.findFirst({
    where:{
      studentId:user.student.id,
      date:{gte:start,lt:end},
      AND:[
        {payload:{path:['type'],equals:'MIZA_TODAY_TASK_RESULT'}},
        {payload:{path:['taskId'],equals:task.id}}
      ]
    },
    orderBy:{createdAt:'desc'}
  });

  const payload={
    type:'MIZA_TODAY_TASK_RESULT',
    taskId:task.id,
    source:task.source,
    actionId:task.actionId,
    subject:task.subject,
    topic:task.topic,
    metricType:task.metricType,
    targetValue:target,
    achievedValue:achieved,
    completed,
    recordedBy:'STUDENT',
    authority:'RESULT_ONLY_COACH_PLAN_UNCHANGED'
  };

  const log=existing
    ?await db.dailyLog.update({where:{id:existing.id},data:{date:now,payload}})
    :await db.dailyLog.create({data:{studentId:user.student.id,date:now,payload}});

  await db.auditLog.create({data:{
    actorUserId:user.id,
    action:'MIZA_TASK_RESULT_RECORDED',
    entityType:'StudentDailyPlan',
    entityId:user.student.id+':'+task.id,
    summary:'MİZA günlük görev sonucu kaydedildi; koç planı değiştirilmedi.',
    metadata:{taskId:task.id,source:task.source,metricType:task.metricType,targetValue:target,achievedValue:achieved,completed}
  }});

  const refreshedToday=await ensureTodayLearningPlan(user.student.id);
  await recordMizaDailySummary(user.student.id,buildMizaTodayOrchestration(refreshedToday));

  return NextResponse.json({ok:true,taskId:task.id,completed,achievedValue:achieved,logId:log.id});
}

export const POST=withApiErrors(POST__handler);
