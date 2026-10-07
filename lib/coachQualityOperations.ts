import {db} from '@/lib/db';

export type CoachQualityStatus='GOOD'|'WATCH'|'ACTION'|'NO_DATA';

export type CoachQualityMetric={
  key:'RESPONSE_TIME'|'RESPONSE_SLA'|'SESSION_COMPLETION'|'SESSION_ACTION'|'INTERVENTION_LATENCY'|'REVIEW_FOLLOWUP'|'REPORT_COVERAGE';
  title:string;
  value:string;
  detail:string;
  numerator:number;
  denominator:number;
  status:CoachQualityStatus;
  evidence:string[];
};

export type CoachQualityOperationsResult={
  period:{start:Date;end:Date;days:number};
  metrics:CoachQualityMetric[];
  summary?:{
    studentCount:number;
    completedSessions:number;
    operationalSamples:number;
    standardsMet:number;
    standardsMeasured:number;
  };
  note:string;
};

function pct(done:number,total:number){
  return total>0?Math.round(done/total*100):null;
}
function hoursBetween(a:Date,b:Date){
  return Math.max(0,(b.getTime()-a.getTime())/3600000);
}
export function median(values:number[]){
  if(!values.length)return null;
  const sorted=[...values].sort((a,b)=>a-b);
  const mid=Math.floor(sorted.length/2);
  return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
}
export function qualityStatus(value:number|null,good=80,watch=60):CoachQualityStatus{
  if(value==null)return 'NO_DATA';
  if(value>=good)return 'GOOD';
  if(value>=watch)return 'WATCH';
  return 'ACTION';
}
function roundedHours(v:number|null){
  return v==null?null:Math.round(v*10)/10;
}
function groupBy<T>(rows:T[],key:(row:T)=>string|null|undefined){
  const map=new Map<string,T[]>();
  for(const row of rows){
    const k=key(row);
    if(!k)continue;
    const list=map.get(k)||[];
    list.push(row);
    map.set(k,list);
  }
  return map;
}

const STANDARD_METRIC_KEYS=new Set<CoachQualityMetric['key']>([
  'RESPONSE_TIME',
  'SESSION_COMPLETION',
  'SESSION_ACTION',
  'INTERVENTION_LATENCY',
  'REVIEW_FOLLOWUP',
  'REPORT_COVERAGE'
]);

export async function buildCoachQualityOperationsBatch(coachIds:string[],now=new Date()){
  const ids=[...new Set(coachIds.filter(Boolean))];
  const result:Record<string,CoachQualityOperationsResult|null>={};
  if(!ids.length)return result;

  const start=new Date(now.getTime()-30*86400000);
  const coaches=await db.coachProfile.findMany({
    where:{id:{in:ids}},
    select:{
      id:true,userId:true,responseTargetHours:true,
      students:{select:{id:true,fullName:true,createdAt:true}}
    }
  });
  const studentToCoach=new Map<string,string>();
  const studentName=new Map<string,string>();
  for(const coach of coaches){
    for(const student of coach.students){
      studentToCoach.set(student.id,coach.id);
      studentName.set(student.id,student.fullName);
    }
  }
  const studentIds=[...studentToCoach.keys()];

  const [tasks,sessions,signals,actions,reviews,reports]=await Promise.all([
    db.coachTask.findMany({
      where:{
        coachId:{in:ids},
        OR:[
          {createdAt:{gte:start,lte:now}},
          {completedAt:{gte:start,lte:now}},
          {dueAt:{gte:start,lte:now}}
        ]
      },
      select:{id:true,coachId:true,title:true,createdAt:true,dueAt:true,status:true,completedAt:true,studentId:true}
    }),
    db.coachingSession.findMany({
      where:{
        coachId:{in:ids},
        endsAt:{gte:start,lte:now},
        status:{not:'CANCELLED'}
      },
      select:{
        id:true,coachId:true,title:true,startsAt:true,endsAt:true,status:true,completedAt:true,studentId:true,
        actions:{select:{id:true,createdAt:true,createdByUserId:true}}
      }
    }),
    studentIds.length?db.taskSubmission.findMany({
      where:{
        studentId:{in:studentIds},
        submittedAt:{gte:start,lte:now},
        OR:[{late:true},{alarmLevel:{in:['MEDIUM','HIGH']}}]
      },
      select:{id:true,studentId:true,submittedAt:true,late:true,alarmLevel:true}
    }):Promise.resolve([]),
    studentIds.length?db.coachingAction.findMany({
      where:{studentId:{in:studentIds},createdAt:{gte:start,lte:now}},
      select:{id:true,studentId:true,title:true,createdAt:true,sessionId:true,createdByUserId:true}
    }):Promise.resolve([]),
    studentIds.length?db.reviewQueueItem.findMany({
      where:{studentId:{in:studentIds},dueAt:{gte:start,lte:now}},
      select:{id:true,studentId:true,dueAt:true,status:true,completedAt:true}
    }):Promise.resolve([]),
    studentIds.length?db.studentReport.findMany({
      where:{studentId:{in:studentIds},createdAt:{gte:start,lte:now}},
      select:{id:true,studentId:true,createdAt:true,title:true,createdByUserId:true}
    }):Promise.resolve([])
  ]);

  const tasksByCoach=groupBy(tasks,x=>x.coachId);
  const sessionsByCoach=groupBy(sessions,x=>x.coachId);
  const signalsByCoach=groupBy(signals,x=>studentToCoach.get(x.studentId));
  const actionsByCoach=groupBy(actions,x=>studentToCoach.get(x.studentId));
  const reviewsByCoach=groupBy(reviews,x=>studentToCoach.get(x.studentId));
  const reportsByCoach=groupBy(reports,x=>studentToCoach.get(x.studentId));

  for(const coach of coaches){
    if(!coach.students.length){
      result[coach.id]={
        period:{start,end:now,days:30},
        metrics:[],
        note:'Henüz bağlı öğrenci olmadığı için operasyon kalitesi hesaplanmıyor.'
      };
      continue;
    }

    const coachTasks=tasksByCoach.get(coach.id)||[];
    const coachSessions=sessionsByCoach.get(coach.id)||[];
    const coachSignals=signalsByCoach.get(coach.id)||[];
    const coachActions=(actionsByCoach.get(coach.id)||[]).filter(x=>x.createdByUserId===coach.userId);
    const coachReviews=reviewsByCoach.get(coach.id)||[];
    const coachReports=(reportsByCoach.get(coach.id)||[]).filter(x=>x.createdByUserId===coach.userId);

    // 0) Takip yanıt süresi: açılan koç işinden tamamlanmasına kadar geçen medyan süre.
    const responseTasks=coachTasks.filter(x=>x.completedAt&&x.completedAt>=start&&x.completedAt<=now);
    const responseHours=responseTasks.map(x=>hoursBetween(x.createdAt,x.completedAt as Date));
    const medianResponse=roundedHours(median(responseHours));
    const responseTargetHours=Math.max(1,coach.responseTargetHours||24);
    const responseTimeStatus:CoachQualityStatus=medianResponse==null
      ?'NO_DATA'
      :medianResponse<=responseTargetHours
        ?'GOOD'
        :medianResponse<=responseTargetHours*2?'WATCH':'ACTION';

    // 1) Zamanında geri dönüş: vadesi bu dönemde olan takip işlerinin SLA içinde kapanması.
    const slaEligible=coachTasks.filter(x=>x.dueAt&&x.dueAt>=start&&x.dueAt<=now);
    const slaOnTime=slaEligible.filter(x=>x.completedAt&&x.dueAt&&x.completedAt<=x.dueAt);
    const slaPct=pct(slaOnTime.length,slaEligible.length);

    // 2) Görüşme disiplini: yalnız bitiş zamanı geçmiş, iptal edilmemiş görüşmeler ölçülür.
    const completedSessions=coachSessions.filter(session=>Boolean(session.completedAt)||session.status==='COMPLETED');
    const sessionCompletionPct=pct(completedSessions.length,coachSessions.length);

    // 3) Görüşme sonrası aksiyon: tamamlanmış görüşmeden sonra 24 saat içinde aksiyon.
    const sessionsWithAction=completedSessions.filter(session=>{
      const completedAt=session.completedAt||session.endsAt;
      const deadline=new Date(completedAt.getTime()+24*3600000);
      return session.actions.some(a=>a.createdByUserId===coach.userId&&a.createdAt>=completedAt&&a.createdAt<=deadline);
    });
    const sessionPct=pct(sessionsWithAction.length,completedSessions.length);

    // 4) Program müdahale süresi: öğrenci geç/uyarı sinyalinden sonraki ilk koç aksiyonuna kadar süre.
    const interventionHours:number[]=[];
    let interventionWithin48=0;
    const interventionEvidence:string[]=[];
    for(const signal of coachSignals){
      const next=coachActions
        .filter(a=>a.studentId===signal.studentId&&a.createdAt>=signal.submittedAt)
        .sort((a,b)=>a.createdAt.getTime()-b.createdAt.getTime())[0];
      if(!next)continue;
      const h=hoursBetween(signal.submittedAt,next.createdAt);
      interventionHours.push(h);
      if(h<=48)interventionWithin48++;
      if(interventionEvidence.length<3)interventionEvidence.push((studentName.get(signal.studentId)||'Öğrenci')+' · '+Math.round(h)+' saatte müdahale');
    }
    const interventionPct=pct(interventionWithin48,coachSignals.length);
    const medianIntervention=roundedHours(median(interventionHours));

    // 5) Tekrar takibi: geciken tekrar yaşayan öğrencilerde 72 saat içinde koç aksiyonu oluşması.
    const firstOverdueByStudent=new Map<string,{dueAt:Date;name:string}>();
    for(const item of coachReviews){
      const becameOverdue=item.completedAt?item.completedAt>item.dueAt:item.dueAt<now;
      if(!becameOverdue)continue;
      const old=firstOverdueByStudent.get(item.studentId);
      if(!old||item.dueAt<old.dueAt)firstOverdueByStudent.set(item.studentId,{dueAt:item.dueAt,name:studentName.get(item.studentId)||'Öğrenci'});
    }
    let repeatFollowed=0;
    const repeatEvidence:string[]=[];
    for(const [studentId,incident] of firstOverdueByStudent){
      const deadline=new Date(incident.dueAt.getTime()+72*3600000);
      const follow=coachActions.find(a=>a.studentId===studentId&&a.createdAt>=incident.dueAt&&a.createdAt<=deadline);
      if(follow){
        repeatFollowed++;
        if(repeatEvidence.length<3)repeatEvidence.push(incident.name+' · 72 saat içinde takip');
      }
    }
    const repeatPct=pct(repeatFollowed,firstOverdueByStudent.size);

    // 6) Rapor tamamlama: en az 7 gündür koça bağlı öğrencilerde son 30 günde koç raporu.
    const reportEligible=coach.students.filter(s=>s.createdAt<=new Date(now.getTime()-7*86400000));
    const reportStudentIds=new Set(coachReports.map(x=>x.studentId));
    const reportDone=reportEligible.filter(s=>reportStudentIds.has(s.id));
    const reportPct=pct(reportDone.length,reportEligible.length);

    const metrics:CoachQualityMetric[]=[
      {
        key:'RESPONSE_TIME',
        title:'Takip yanıt süresi',
        value:medianResponse==null?'Veri yok':medianResponse+' saat medyan',
        detail:'Koç takip işinin açılmasından tamamlanmasına kadar geçen medyan süre. KEKS hedefi: '+responseTargetHours+' saat veya daha kısa.',
        numerator:responseHours.filter(x=>x<=responseTargetHours).length,denominator:responseHours.length,status:responseTimeStatus,
        evidence:responseTasks.slice(0,3).map(x=>(x.studentId?studentName.get(x.studentId)||'Öğrenci':'Genel iş')+' · '+Math.round(hoursBetween(x.createdAt,x.completedAt as Date))+' saat')
      },
      {
        key:'RESPONSE_SLA',
        title:'Zamanında geri dönüş',
        value:slaPct==null?'Veri yok':'%'+slaPct,
        detail:'Vadesi dolan koç takip işlerinin zamanında kapatılma oranı.',
        numerator:slaOnTime.length,denominator:slaEligible.length,status:qualityStatus(slaPct,85,65),
        evidence:slaEligible.filter(x=>x.completedAt&&x.dueAt).slice(0,3).map(x=>(x.studentId?studentName.get(x.studentId)||'Öğrenci':'Genel iş')+' · '+x.title)
      },
      {
        key:'SESSION_COMPLETION',
        title:'Görüşme tamamlama oranı',
        value:sessionCompletionPct==null?'Veri yok':'%'+sessionCompletionPct,
        detail:'Son 30 günde süresi dolmuş ve iptal edilmemiş görüşmelerin tamamlama oranı. KEKS hedefi: en az %85.',
        numerator:completedSessions.length,denominator:coachSessions.length,status:qualityStatus(sessionCompletionPct,85,70),
        evidence:completedSessions.slice(0,3).map(x=>(studentName.get(x.studentId)||'Öğrenci')+' · '+x.title)
      },
      {
        key:'SESSION_ACTION',
        title:'Görüşme sonrası aksiyon',
        value:sessionPct==null?'Veri yok':'%'+sessionPct,
        detail:'Tamamlanan görüşmelerden sonra 24 saat içinde öğrenciye bağlı aksiyon oluşturma oranı.',
        numerator:sessionsWithAction.length,denominator:completedSessions.length,status:qualityStatus(sessionPct,80,60),
        evidence:sessionsWithAction.slice(0,3).map(x=>(studentName.get(x.studentId)||'Öğrenci')+' · '+x.title)
      },
      {
        key:'INTERVENTION_LATENCY',
        title:'Program müdahale süresi',
        value:medianIntervention==null?'Veri yok':medianIntervention+' saat medyan',
        detail:'Geç görev veya orta/yüksek alarm sinyalinden sonraki ilk koç aksiyonuna kadar geçen süre. Hedef: 48 saat içinde.',
        numerator:interventionWithin48,denominator:coachSignals.length,status:qualityStatus(interventionPct,80,60),
        evidence:interventionEvidence
      },
      {
        key:'REVIEW_FOLLOWUP',
        title:'Tekrar takibi',
        value:repeatPct==null?'Veri yok':'%'+repeatPct,
        detail:'Gecikmiş tekrar yaşayan öğrenciler için 72 saat içinde koç aksiyonu oluşturma kapsaması.',
        numerator:repeatFollowed,denominator:firstOverdueByStudent.size,status:qualityStatus(repeatPct,80,60),
        evidence:repeatEvidence
      },
      {
        key:'REPORT_COVERAGE',
        title:'Rapor tamamlama',
        value:reportPct==null?'Veri yok':'%'+reportPct,
        detail:'En az 7 gündür koça bağlı öğrencilerde son 30 günde koç tarafından tamamlanan rapor kapsaması.',
        numerator:reportDone.length,denominator:reportEligible.length,status:qualityStatus(reportPct,80,60),
        evidence:coachReports.slice(0,3).map(x=>(studentName.get(x.studentId)||'Öğrenci')+' · '+x.title)
      }
    ];

    const standardMetrics=metrics.filter(x=>STANDARD_METRIC_KEYS.has(x.key));
    result[coach.id]={
      period:{start,end:now,days:30},
      metrics,
      summary:{
        studentCount:coach.students.length,
        completedSessions:completedSessions.length,
        operationalSamples:metrics.reduce((s,x)=>s+x.denominator,0),
        standardsMet:standardMetrics.filter(x=>x.status==='GOOD').length,
        standardsMeasured:standardMetrics.filter(x=>x.status!=='NO_DATA').length
      },
      note:'Bu ekran tek bir koç puanı üretmez. Her gösterge yalnız koçun operasyonel olarak kontrol edebildiği süreç adımlarını ve gerçek örneklem büyüklüğünü gösterir.'
    };
  }

  for(const id of ids){
    if(!(id in result))result[id]=null;
  }
  return result;
}

export async function buildCoachQualityOperations(coachId:string,now=new Date()){
  const rows=await buildCoachQualityOperationsBatch([coachId],now);
  return rows[coachId]||null;
}
