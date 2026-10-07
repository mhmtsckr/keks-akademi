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

export async function buildCoachQualityOperations(coachId:string,now=new Date()){
  const start=new Date(now.getTime()-30*86400000);
  const coach=await db.coachProfile.findUnique({
    where:{id:coachId},
    select:{
      id:true,userId:true,
      students:{select:{id:true,fullName:true,createdAt:true}}
    }
  });
  if(!coach)return null;

  const studentIds=coach.students.map(x=>x.id);
  if(!studentIds.length){
    return {
      period:{start,end:now,days:30},
      metrics:[] as CoachQualityMetric[],
      note:'Henüz bağlı öğrenci olmadığı için operasyon kalitesi hesaplanmıyor.'
    };
  }

  const [tasks,sessions,signals,actions,reviews,reports]=await Promise.all([
    db.coachTask.findMany({
      where:{coachId,dueAt:{gte:start,lte:now}},
      select:{id:true,title:true,createdAt:true,dueAt:true,status:true,completedAt:true,student:{select:{fullName:true}}}
    }),
    db.coachingSession.findMany({
      where:{coachId,startsAt:{gte:start,lte:now},status:{not:'CANCELLED'}},
      select:{
        id:true,title:true,startsAt:true,status:true,completedAt:true,
        student:{select:{id:true,fullName:true}},
        actions:{select:{id:true,createdAt:true,createdByUserId:true}}
      }
    }),
    db.taskSubmission.findMany({
      where:{
        studentId:{in:studentIds},
        submittedAt:{gte:start,lte:now},
        OR:[{late:true},{alarmLevel:{in:['MEDIUM','HIGH']}}]
      },
      select:{
        id:true,studentId:true,submittedAt:true,late:true,alarmLevel:true,
        student:{select:{fullName:true}},
        action:{select:{title:true}}
      },
      orderBy:{submittedAt:'asc'}
    }),
    db.coachingAction.findMany({
      where:{
        studentId:{in:studentIds},
        createdByUserId:coach.userId,
        createdAt:{gte:start,lte:now}
      },
      select:{id:true,studentId:true,title:true,createdAt:true,sessionId:true}
    }),
    db.reviewQueueItem.findMany({
      where:{studentId:{in:studentIds},dueAt:{gte:start,lte:now}},
      select:{id:true,studentId:true,dueAt:true,status:true,completedAt:true,student:{select:{fullName:true}}}
    }),
    db.studentReport.findMany({
      where:{
        studentId:{in:studentIds},
        createdByUserId:coach.userId,
        createdAt:{gte:start,lte:now}
      },
      select:{id:true,studentId:true,createdAt:true,title:true}
    })
  ]);

  // 0) Takip yanıt süresi: açılan koç işinden tamamlanmasına kadar geçen medyan süre.
  const responseHours=tasks
    .filter(x=>x.completedAt)
    .map(x=>hoursBetween(x.createdAt,x.completedAt as Date));
  const medianResponse=roundedHours(median(responseHours));
  const responseTargetHours=24;
  const responseTimeStatus:CoachQualityStatus=medianResponse==null?'NO_DATA':medianResponse<=responseTargetHours?'GOOD':medianResponse<=48?'WATCH':'ACTION';

  // 1) Zamanında geri dönüş: vadesi dolan koç işlerinin SLA içinde kapanması.
  const slaEligible=tasks.filter(x=>x.dueAt);
  const slaOnTime=slaEligible.filter(x=>x.completedAt&&x.dueAt&&x.completedAt<=x.dueAt);
  const slaPct=pct(slaOnTime.length,slaEligible.length);

  // 2) Görüşme sonrası aksiyon: tamamlanan görüşmeye bağlı aksiyonun 24 saat içinde oluşturulması.
  const completedSessions=sessions.filter(session=>Boolean(session.completedAt)||session.status==='COMPLETED');
  const sessionCompletionPct=pct(completedSessions.length,sessions.length);

  const sessionsWithAction=completedSessions.filter(session=>{
    if(!session.completedAt)return false;
    const deadline=new Date(session.completedAt.getTime()+24*3600000);
    return session.actions.some(a=>a.createdByUserId===coach.userId&&a.createdAt<=deadline);
  });
  const sessionPct=pct(sessionsWithAction.length,completedSessions.length);

  // 3) Program müdahale süresi: öğrenci geç/uyarı sinyalinden sonraki ilk koç aksiyonuna kadar süre.
  const interventionHours:number[]=[];
  let interventionWithin48=0;
  const interventionEvidence:string[]=[];
  for(const signal of signals){
    const next=actions
      .filter(a=>a.studentId===signal.studentId&&a.createdAt>=signal.submittedAt)
      .sort((a,b)=>a.createdAt.getTime()-b.createdAt.getTime())[0];
    if(!next)continue;
    const h=hoursBetween(signal.submittedAt,next.createdAt);
    interventionHours.push(h);
    if(h<=48)interventionWithin48++;
    if(interventionEvidence.length<3)interventionEvidence.push(signal.student.fullName+' · '+Math.round(h)+' saatte müdahale');
  }
  const interventionPct=pct(interventionWithin48,signals.length);
  const medianIntervention=roundedHours(median(interventionHours));

  // 4) Tekrar takibi: geciken tekrar yaşayan öğrencilerde 72 saat içinde koç aksiyonu oluşması.
  const firstOverdueByStudent=new Map<string,{dueAt:Date;name:string}>();
  for(const item of reviews){
    const becameOverdue=item.completedAt?item.completedAt>item.dueAt:item.dueAt<now;
    if(!becameOverdue)continue;
    const old=firstOverdueByStudent.get(item.studentId);
    if(!old||item.dueAt<old.dueAt)firstOverdueByStudent.set(item.studentId,{dueAt:item.dueAt,name:item.student.fullName});
  }
  let repeatFollowed=0;
  const repeatEvidence:string[]=[];
  for(const [studentId,incident] of firstOverdueByStudent){
    const deadline=new Date(incident.dueAt.getTime()+72*3600000);
    const follow=actions.find(a=>a.studentId===studentId&&a.createdAt>=incident.dueAt&&a.createdAt<=deadline);
    if(follow){
      repeatFollowed++;
      if(repeatEvidence.length<3)repeatEvidence.push(incident.name+' · 72 saat içinde takip');
    }
  }
  const repeatPct=pct(repeatFollowed,firstOverdueByStudent.size);

  // 5) Rapor tamamlama: en az 7 gündür koça bağlı öğrencilerde son 30 günde koç raporu.
  const reportEligible=coach.students.filter(s=>s.createdAt<=new Date(now.getTime()-7*86400000));
  const reportStudentIds=new Set(reports.map(x=>x.studentId));
  const reportDone=reportEligible.filter(s=>reportStudentIds.has(s.id));
  const reportPct=pct(reportDone.length,reportEligible.length);

  const metrics:CoachQualityMetric[]=[
    {
      key:'RESPONSE_TIME',
      title:'Takip yanıt süresi',
      value:medianResponse==null?'Veri yok':medianResponse+' saat medyan',
      detail:'Koç takip işinin açılmasından tamamlanmasına kadar geçen medyan süre. KEKS hedefi: 24 saat veya daha kısa.',
      numerator:responseHours.filter(x=>x<=responseTargetHours).length,denominator:responseHours.length,status:responseTimeStatus,
      evidence:tasks.filter(x=>x.completedAt).slice(0,3).map(x=>(x.student?.fullName||'Genel iş')+' · '+Math.round(hoursBetween(x.createdAt,x.completedAt as Date))+' saat')
    },
    {
      key:'RESPONSE_SLA',
      title:'Zamanında geri dönüş',
      value:slaPct==null?'Veri yok':'%'+slaPct,
      detail:'Vadesi dolan koç takip işlerinin zamanında kapatılma oranı.',
      numerator:slaOnTime.length,denominator:slaEligible.length,status:qualityStatus(slaPct,85,65),
      evidence:slaEligible.filter(x=>x.completedAt&&x.dueAt).slice(0,3).map(x=>(x.student?.fullName||'Genel iş')+' · '+x.title)
    },
    {
      key:'SESSION_COMPLETION',
      title:'Görüşme tamamlama oranı',
      value:sessionCompletionPct==null?'Veri yok':'%'+sessionCompletionPct,
      detail:'Son 30 günde zamanı gelen ve iptal edilmemiş görüşmelerin tamamlanma oranı. KEKS hedefi: en az %85.',
      numerator:completedSessions.length,denominator:sessions.length,status:qualityStatus(sessionCompletionPct,85,70),
      evidence:completedSessions.slice(0,3).map(x=>x.student.fullName+' · '+x.title)
    },
    {
      key:'SESSION_ACTION',
      title:'Görüşme sonrası aksiyon',
      value:sessionPct==null?'Veri yok':'%'+sessionPct,
      detail:'Tamamlanan görüşmelerden sonra 24 saat içinde öğrenciye bağlı aksiyon oluşturma oranı.',
      numerator:sessionsWithAction.length,denominator:completedSessions.length,status:qualityStatus(sessionPct,80,60),
      evidence:sessionsWithAction.slice(0,3).map(x=>x.student.fullName+' · '+x.title)
    },
    {
      key:'INTERVENTION_LATENCY',
      title:'Program müdahale süresi',
      value:medianIntervention==null?'Veri yok':medianIntervention+' saat medyan',
      detail:'Geç görev veya orta/yüksek alarm sinyalinden sonraki ilk koç aksiyonuna kadar geçen süre. Hedef: 48 saat içinde.',
      numerator:interventionWithin48,denominator:signals.length,status:qualityStatus(interventionPct,80,60),
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
      evidence:reports.slice(0,3).map(x=>coach.students.find(s=>s.id===x.studentId)?.fullName+' · '+x.title)
    }
  ];

  return {
    period:{start,end:now,days:30},
    metrics,
    summary:{
      studentCount:coach.students.length,
      completedSessions:completedSessions.length,
      operationalSamples:metrics.reduce((s,x)=>s+x.denominator,0),
      standardsMet:metrics.filter(x=>x.status==='GOOD').length,
      standardsMeasured:metrics.filter(x=>x.status!=='NO_DATA').length
    },
    note:'Bu ekran tek bir koç puanı üretmez. Her gösterge yalnız koçun operasyonel olarak kontrol edebildiği süreç adımlarını ve gerçek örneklem büyüklüğünü gösterir.'
  };
}
