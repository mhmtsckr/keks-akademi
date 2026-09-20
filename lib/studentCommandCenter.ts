import { db } from '@/lib/db';

function trKey(d:Date){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
}
function utcDateFromKey(key:string){
  const [y,m,d]=key.split('-').map(Number);
  return new Date(Date.UTC(y,m-1,d));
}
function addDaysKey(key:string,days:number){
  const d=utcDateFromKey(key);d.setUTCDate(d.getUTCDate()+days);return d;
}
function num(v:any){const n=Number(v);return Number.isFinite(n)?n:null;}

export async function rebalanceMissedTasks(studentId:string){
  const todayKey=trKey(new Date());
  const today=utcDateFromKey(todayKey);
  const missed=await db.coachingAction.findMany({
    where:{
      studentId,
      status:'ACTIVE',
      taskDate:{not:null,lt:today},
      submission:null,
      rescheduleSource:null
    },
    orderBy:{taskDate:'asc'},
    take:12
  });
  const created:any[]=[];
  for(const action of missed){
    const remaining=Math.max(0,Number(action.targetValue)-Number(action.currentValue));
    if(remaining<=0)continue;
    const firstDate=addDaysKey(todayKey,1);
    const secondDate=addDaysKey(todayKey,3);
    const parts=remaining>=20
      ? [Math.ceil(remaining*.6),Math.floor(remaining*.4)]
      : [remaining];
    const made=await db.$transaction(async tx=>{
      const ids:string[]=[];
      for(let i=0;i<parts.length;i++){
        if(parts[i]<=0)continue;
        const taskDate=i===0?firstDate:secondDate;
        const periodEnd=new Date(taskDate);periodEnd.setUTCDate(periodEnd.getUTCDate()+1);
        const row=await tx.coachingAction.create({data:{
          studentId,
          createdByUserId:action.createdByUserId,
          title:action.title+' · Telafi',
          description:(action.description? action.description+' · ':'')+'Kaçırılan görev otomatik olarak yeniden planlandı.',
          metricType:action.metricType,
          targetValue:parts[i],
          currentValue:0,
          cadence:'DAILY',
          periodStart:taskDate,
          periodEnd,
          status:'ACTIVE',
          subject:action.subject,
          topic:action.topic,
          taskDate,
          planSource:'AUTO_RESCHEDULE'
        }});
        ids.push(row.id);
      }
      await tx.coachingAction.update({where:{id:action.id},data:{status:'RESCHEDULED'}});
      await tx.taskReschedule.create({data:{
        studentId,
        sourceActionId:action.id,
        createdActionId:ids[0]||null,
        createdActionIds:ids as any,
        originalDate:action.taskDate||action.periodEnd,
        newDate:firstDate,
        movedTarget:remaining,
        reason:'AUTO_MISSED'
      }});
      return ids;
    });
    created.push({sourceActionId:action.id,createdActionIds:made,movedTarget:remaining});
  }
  return created;
}

export async function buildStudentCommandCenter(studentId:string){
  const now=new Date();
  const todayKey=trKey(now);
  const today=utcDateFromKey(todayKey);
  const tomorrow=new Date(today);tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
  const sevenDaysAgo=new Date(now.getTime()-7*86400000);
  const [todayTasks,reviews,nextSession,target,latestExam,practice,submissions,techniqueSessions,latestReflection,missedCount]=await Promise.all([
    db.coachingAction.findMany({where:{studentId,taskDate:{gte:today,lt:tomorrow},status:{in:['ACTIVE','COMPLETED']}},include:{submission:true},orderBy:{createdAt:'asc'}}),
    db.reviewQueueItem.findMany({where:{studentId,status:{in:['DUE','PENDING']},dueAt:{lte:now}},include:{question:true},orderBy:{dueAt:'asc'},take:30}),
    db.coachingSession.findFirst({where:{studentId,status:'SCHEDULED',startsAt:{gte:now}},orderBy:{startsAt:'asc'}}),
    db.studentTarget.findFirst({where:{studentId,active:true},orderBy:{createdAt:'desc'}}),
    db.examResult.findFirst({where:{studentId},orderBy:{createdAt:'desc'}}),
    db.practiceLog.findMany({where:{studentId,date:{gte:new Date(now.getTime()-30*86400000)}},orderBy:{date:'desc'},take:200}),
    db.taskSubmission.findMany({where:{studentId,submittedAt:{gte:sevenDaysAgo}},orderBy:{submittedAt:'desc'}}),
    db.techniquePracticeSession.findMany({where:{studentId,createdAt:{gte:sevenDaysAgo}},orderBy:{createdAt:'desc'}}),
    db.weeklyReflection.findFirst({where:{studentId},orderBy:{weekStart:'desc'}}),
    db.coachingAction.count({where:{studentId,status:'ACTIVE',taskDate:{not:null,lt:today},submission:null,rescheduleSource:null}})
  ]);

  const weak=new Map<string,{subject:string;topic:string;total:number;correct:number;wrong:number;blank:number;reasons:Record<string,number>}>();
  for(const p of practice){
    const key=p.subject+'|'+(p.topic||'Genel/Karma');
    const x=weak.get(key)||{subject:p.subject,topic:p.topic||'Genel/Karma',total:0,correct:0,wrong:0,blank:0,reasons:{}};
    x.total+=p.total;x.correct+=p.correct;x.wrong+=p.wrong;x.blank+=p.blank;
    if(p.errorReason)x.reasons[p.errorReason]=(x.reasons[p.errorReason]||0)+1;
    weak.set(key,x);
  }
  const weaknessMap=[...weak.values()].map(x=>({
    ...x,
    accuracy:x.total?Math.round(x.correct/x.total*100):0,
    primaryReason:Object.entries(x.reasons).sort((a,b)=>b[1]-a[1])[0]?.[0]||null
  })).sort((a,b)=>a.accuracy-b.accuracy).slice(0,10);

  const payload:any=latestExam?.payload||{};
  let targetValue:number|null=null,currentValue:number|null=null,targetLabel='';
  if(target){
    if(target.examLevel==='LGS'){
      targetValue=target.score??null;currentValue=num(payload.score);targetLabel='LGS puanı';
    }else if(target.examLevel==='KPSS'){
      targetValue=target.officialMinScore??target.score??null;currentValue=num(payload.score);targetLabel='KPSS puanı';
    }else if(target.examLevel==='AGS_OBAT'){
      targetValue=target.officialEligibilityScore??target.score??null;currentValue=num(payload.score);targetLabel='MEB-AGS puanı';
    }else{
      targetValue=target.score??null;currentValue=num(payload.score);targetLabel='YKS puanı';
    }
  }
  const difference=targetValue!=null&&currentValue!=null?Number((targetValue-currentValue).toFixed(2)):null;

  const completedToday=todayTasks.filter(x=>x.submission||x.status==='COMPLETED').length;
  const totalQuestions=submissions.reduce((n,x)=>n+x.totalQuestions,0);
  const correct=submissions.reduce((n,x)=>n+x.correct,0);
  const accuracy=totalQuestions?Math.round(correct/totalQuestions*100):0;
  const activeMinutes=Math.round(techniqueSessions.reduce((n,x)=>n+(x.activeSeconds||0),0)/60);
  const continuity=Math.round((submissions.length/Math.max(1,7))*100);

  return {
    today:{
      date:todayKey,
      tasks:todayTasks,
      totalTasks:todayTasks.length,
      completedTasks:completedToday,
      targetQuestions:todayTasks.reduce((n,x)=>n+(x.metricType==='QUESTIONS'?Number(x.targetValue):0),0),
      dueReviews:reviews.length,
      nextSession
    },
    weaknessMap,
    goal:target?{
      examLevel:target.examLevel,
      institutionName:target.institutionName,
      departmentName:target.departmentName,
      targetValue,currentValue,difference,targetLabel,
      appointmentCount:target.appointmentCount,
      officialScoreType:target.officialScoreType,
      officialPeriod:target.officialPeriod,
      netsStatus:target.officialNetsStatus
    }:null,
    progressAxes:{
      continuity:Math.min(100,continuity),
      accuracy,
      reviewDiscipline:Math.max(0,100-Math.min(100,reviews.length*8)),
      focusMinutes:activeMinutes
    },
    latestReflection,
    missedEligibleCount:missedCount
  };
}
