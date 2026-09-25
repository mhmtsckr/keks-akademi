import {db} from '@/lib/db';

export type SmartNotificationKind='REVIEW_DUE'|'EXAM_STALE'|'PLAN_UPDATED'|'PARTIAL_TASK';
export type SmartNotificationPriority='HIGH'|'MEDIUM';

export type SmartNotification={
  id:string;
  kind:SmartNotificationKind;
  priority:SmartNotificationPriority;
  title:string;
  message:string;
  href:string;
  createdAt:string;
};

type CandidateInput={
  now:Date;
  dueReviewDates:Date[];
  latestExamAt:Date|null;
  latestPlan:{id:string;title:string;updatedAt:Date}|null;
  partialTasks:Array<{id:string;title:string;completionRate:number}>;
};

function record(v:unknown):Record<string,unknown>{
  return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}

export function trDateKey(date:Date){
  return new Intl.DateTimeFormat('en-CA',{
    timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'
  }).format(date);
}

export function trDayStart(date:Date){
  const key=trDateKey(date);
  return new Date(key+'T00:00:00+03:00');
}

export function weekKey(date:Date){
  const localStart=trDayStart(date);
  const localDay=Number(new Intl.DateTimeFormat('en-US',{
    timeZone:'Europe/Istanbul',weekday:'short'
  }).format(date)==='Sun'?0:
  ['Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(new Intl.DateTimeFormat('en-US',{
    timeZone:'Europe/Istanbul',weekday:'short'
  }).format(date))+1);
  const mondayOffset=localDay===0?6:localDay-1;
  const monday=new Date(localStart.getTime()-mondayOffset*86400000);
  return trDateKey(monday);
}

export function parseNotificationAck(payload:unknown){
  const p=record(payload);
  if(p.kind!=='SMART_NOTIFICATION_ACK'||typeof p.notificationId!=='string')return null;
  return p.notificationId;
}

export function buildNotificationCandidates(input:CandidateInput):SmartNotification[]{
  const now=input.now;
  const todayStart=trDayStart(now);
  const tomorrow=new Date(todayStart.getTime()+86400000);
  const todayKey=trDateKey(now);
  const result:SmartNotification[]=[];

  const due=input.dueReviewDates.filter(d=>d<tomorrow);
  if(due.length){
    const overdue=due.filter(d=>d<todayStart).length;
    result.push({
      id:'review-due:'+todayKey,
      kind:'REVIEW_DUE',
      priority:overdue>0||due.length>=3?'HIGH':'MEDIUM',
      title:due.length+' tekrarın zamanı geldi',
      message:overdue
        ?overdue+' tekrar gecikmiş durumda. Önce tekrar kuyruğunu tamamla.'
        :'Bugünkü tekrarlarını bitirerek unutma riskini düşür.',
      href:'#yanlis-soru-bankasi',
      createdAt:now.toISOString()
    });
  }

  const examGapDays=input.latestExamAt
    ?Math.floor((now.getTime()-input.latestExamAt.getTime())/86400000)
    :null;
  if(examGapDays==null||examGapDays>=7){
    result.push({
      id:'exam-stale:'+weekKey(now),
      kind:'EXAM_STALE',
      priority:'MEDIUM',
      title:examGapDays==null?'Henüz deneme kaydın yok':examGapDays+' gündür deneme girmedin',
      message:'Yeni bir ölçüm noktası olmadan programın etkisini değerlendirmek zorlaşır.',
      href:'#akademik-performans',
      createdAt:now.toISOString()
    });
  }

  if(input.latestPlan&&now.getTime()-input.latestPlan.updatedAt.getTime()<=7*86400000){
    result.push({
      id:'plan-updated:'+input.latestPlan.id+':'+input.latestPlan.updatedAt.toISOString(),
      kind:'PLAN_UPDATED',
      priority:'MEDIUM',
      title:'Çalışma programın güncellendi',
      message:'“'+input.latestPlan.title+'” planındaki güncel görev ve öncelikleri kontrol et.',
      href:'#programlar',
      createdAt:input.latestPlan.updatedAt.toISOString()
    });
  }

  if(input.partialTasks.length){
    const first=input.partialTasks[0];
    result.push({
      id:'partial-task:'+todayKey,
      kind:'PARTIAL_TASK',
      priority:'HIGH',
      title:input.partialTasks.length===1?'Dün yarım bıraktığın göreve devam et':input.partialTasks.length+' yarım görev dünden kaldı',
      message:input.partialTasks.length===1
        ?'“'+first.title+'” görevi %'+Math.round(first.completionRate)+' seviyesinde kaldı.'
        :'Yeni görev eklemek yerine önce yarım kalanları kapasiten dahilinde tamamla.',
      href:'#gunluk-gorevler',
      createdAt:now.toISOString()
    });
  }

  const order:Record<SmartNotificationPriority,number>={HIGH:0,MEDIUM:1};
  return result.sort((a,b)=>order[a.priority]-order[b.priority]||a.kind.localeCompare(b.kind));
}

export async function buildSmartNotifications(studentId:string,now=new Date(),includeAcknowledged=false){
  const todayStart=trDayStart(now);
  const yesterdayStart=new Date(todayStart.getTime()-86400000);
  const tomorrow=new Date(todayStart.getTime()+86400000);
  const ackSince=new Date(todayStart.getTime()-60*86400000);

  const [reviews,latestExam,latestPlan,yesterdayActions,logs]=await Promise.all([
    db.reviewQueueItem.findMany({
      where:{studentId,status:{in:['DUE','PENDING']},dueAt:{lt:tomorrow}},
      select:{dueAt:true}
    }),
    db.examResult.findFirst({
      where:{studentId},
      orderBy:{createdAt:'desc'},
      select:{createdAt:true}
    }),
    db.studyPlan.findFirst({
      where:{studentId,active:true},
      orderBy:{updatedAt:'desc'},
      select:{id:true,title:true,updatedAt:true}
    }),
    db.coachingAction.findMany({
      where:{studentId,taskDate:{gte:yesterdayStart,lt:todayStart}},
      select:{
        id:true,title:true,currentValue:true,targetValue:true,
        submission:{select:{completionRate:true}}
      }
    }),
    db.dailyLog.findMany({
      where:{studentId,date:{gte:ackSince}},
      select:{payload:true}
    })
  ]);

  const partialTasks=yesterdayActions
    .map(action=>{
      const rate=action.submission?.completionRate
        ??(action.targetValue>0?Math.round(action.currentValue/action.targetValue*100):0);
      return {id:action.id,title:action.title,completionRate:Number(rate)||0};
    })
    .filter(x=>x.completionRate>0&&x.completionRate<100);

  const candidates=buildNotificationCandidates({
    now,
    dueReviewDates:reviews.map(x=>x.dueAt),
    latestExamAt:latestExam?.createdAt||null,
    latestPlan:latestPlan||null,
    partialTasks
  });

  if(includeAcknowledged)return candidates;
  const acknowledged=new Set(logs.map(x=>parseNotificationAck(x.payload)).filter((x):x is string=>Boolean(x)));
  return candidates.filter(x=>!acknowledged.has(x.id));
}

export async function acknowledgeSmartNotification(studentId:string,notificationId:string,now=new Date()){
  const current=await buildSmartNotifications(studentId,now,false);
  const notification=current.find(x=>x.id===notificationId);
  if(!notification)return null;
  await db.dailyLog.create({
    data:{
      studentId,
      date:now,
      payload:{
        kind:'SMART_NOTIFICATION_ACK',
        notificationId,
        acknowledgedAt:now.toISOString()
      }
    }
  });
  return notification;
}
