// CRM analytics are observational: absence of a record is not proof that a student did no work.
export type CrmVerifiedPurchase={
  merchantOid:string;
  startedAt:Date;
  endsAt:Date|null;
  status:string;
};
export type CrmTask={taskDate:Date|null;status:string;updatedAt:Date;submittedAt:Date|null};
export type CrmPractice={date:Date};
export type CrmSession={startsAt:Date;endsAt:Date;status:string;completedAt:Date|null;updatedAt:Date};

export type CrmLifecycleStage=
  'LEAD'|'CONTACT'|'PACKAGE'|'UNVERIFIED_SALE'|'LOST_SALE'|
  'PURCHASED'|'FIRST_30_DAYS'|'ACTIVE'|'RENEWAL_DUE'|'RENEWED'|'CHURNED';

export type CrmLifecycleSnapshot={
  stage:CrmLifecycleStage;
  label:string;
  firstPurchaseAt:Date|null;
  day30At:Date|null;
  day30Matured:boolean;
  subscriptionAtDay30:boolean|null;
  activityAtDay30:boolean|null;
  retainedAtDay30:boolean|null;
  programCompletionPct:number|null;
  sessionAttendancePct:number|null;
  renewed:boolean;
  activeSubscriptionNow:boolean;
  renewalDate:Date|null;
  last7DaysActive:boolean|null;
  guidance:string;
};

const DAY=86400000;
export const CRM_LIFECYCLE_LABELS:Record<CrmLifecycleStage,string>={
  LEAD:'Lead',
  CONTACT:'Görüşme',
  PACKAGE:'Paket önerildi',
  UNVERIFIED_SALE:'Satış kaydı · doğrulama bekliyor',
  LOST_SALE:'Satış kaybedildi',
  PURCHASED:'Satın aldı',
  FIRST_30_DAYS:'İlk 30 günlük kullanım',
  ACTIVE:'30 gün sonrası kullanım',
  RENEWAL_DUE:'Yenileme takibi',
  RENEWED:'Yeniledi',
  CHURNED:'Ayrıldı'
};
function dayKey(d:Date){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
}
function range(d:Date,start:Date,end:Date){return d>=start&&d<end;}
function percent(n:number,den:number){return den?Math.round(n/den*100):null;}

export function calculateCrmLifecycle(input:{
  leadStatus:string;
  linked:boolean;
  purchases:CrmVerifiedPurchase[];
  tasks?:CrmTask[];
  practices?:CrmPractice[];
  sessions?:CrmSession[];
  now?:Date;
}):CrmLifecycleSnapshot{
  const now=input.now||new Date();
  const purchases=[...input.purchases].sort((a,b)=>a.startedAt.getTime()-b.startedAt.getTime());
  const first=purchases[0];
  const day30At=first?new Date(first.startedAt.getTime()+30*DAY):null;
  const matured=Boolean(day30At&&now>=day30At);
  const activeNow=purchases.some(p=>p.status==='ACTIVE'&&p.startedAt<=now&&(!p.endsAt||p.endsAt>now));
  // Historic day-30 entitlement is only observable for non-cancelled paid subscriptions.
  const activeAt30=day30At&&matured?purchases.some(p=>
    ['ACTIVE','EXPIRED'].includes(p.status)&&p.startedAt<=day30At&&(!p.endsAt||p.endsAt>day30At)
  ):null;
  const renewalDate=purchases.filter(p=>p.status==='ACTIVE'&&p.endsAt&&p.endsAt>now)
    .map(p=>p.endsAt as Date).sort((a,b)=>a.getTime()-b.getTime())[0]||null;
  const renewed=purchases.length>=2;
  const windowStart=day30At?new Date(day30At.getTime()-7*DAY):null;
  const tasks=(input.tasks||[]).filter(t=>Boolean(windowStart&&day30At&&t.taskDate&&range(t.taskDate,windowStart,day30At)));
  const completedTasks=tasks.filter(t=>Boolean(day30At&&(
    (t.submittedAt&&t.submittedAt<day30At)||
    (t.status==='COMPLETED'&&t.updatedAt<day30At)
  )));
  const programCompletionPct=matured?percent(completedTasks.length,tasks.length):null;
  const activeDays=new Set<string>();
  for(const p of input.practices||[])if(windowStart&&day30At&&range(p.date,windowStart,day30At))activeDays.add(dayKey(p.date));
  for(const t of completedTasks){
    const at=t.submittedAt||t.updatedAt;
    if(windowStart&&day30At&&range(at,windowStart,day30At))activeDays.add(dayKey(at));
  }
  const activityAt30=matured?activeDays.size>0:null;
  // "Gözlenen 30-gün tutundurma" needs both a valid entitlement and evidence of usage.
  const retainedAtDay30=matured?(activeAt30===true&&activityAt30===true):null;
  const sessions=(input.sessions||[]).filter(s=>first&&day30At&&range(s.startsAt,first.startedAt,day30At)&&s.status!=='CANCELLED'&&s.endsAt<=day30At);
  const completedSessions=sessions.filter(s=>Boolean(day30At&&(
    (s.completedAt&&s.completedAt<=day30At)||
    (s.status==='COMPLETED'&&s.updatedAt<=day30At)
  )));
  const sessionAttendancePct=matured?percent(completedSessions.length,sessions.length):null;
  const last7Start=new Date(now.getTime()-7*DAY);
  const last7DaysActive=first?Boolean(
    (input.practices||[]).some(p=>range(p.date,last7Start,now))||
    (input.tasks||[]).some(t=>t.submittedAt&&range(t.submittedAt,last7Start,now))
  ):null;

  let stage:CrmLifecycleStage='LEAD';
  let guidance='İlk görüşme için uygun zamanı belirleyin.';
  if(!first){
    if(input.leadStatus==='LOST'){stage='LOST_SALE';guidance='Kaybedilme nedenini kaydedin; bunu abonelik ayrılması saymayın.';}
    else if(input.leadStatus==='WON'){stage='UNVERIFIED_SALE';guidance='Gerçek satın alma için öğrenciyi bağlayıp doğrulanmış ödemeyi kontrol edin.';}
    else if(input.leadStatus==='PACKAGE_RECOMMENDED'){stage='PACKAGE';guidance='Önerilen pakete ilişkin geri dönüş alın.';}
    else if(['SPOKEN','CALLED'].includes(input.leadStatus)){stage='CONTACT';guidance='Görüşmeyi tamamlayıp uygun paketi önerin.';}
    if(!input.linked)guidance+=' Öğrenci kodu doğrulanmadan kullanım verisi gösterilmez.';
  }else if(!matured){
    stage=now.getTime()-first.startedAt.getTime()<DAY?'PURCHASED':'FIRST_30_DAYS';
    guidance='İlk 30 gün boyunca program kaydı ve koç görüşmesi katılımını izleyin.';
  }else if(activeNow){
    if(renewed){stage='RENEWED';guidance='Yenileme sonrasında uygulama düzeninin sürdüğünü kontrol edin.';}
    else if(renewalDate&&renewalDate.getTime()-now.getTime()<=14*DAY){
      stage='RENEWAL_DUE';guidance='Abonelik bitişinden önce yenileme görüşmesi planlayın.';
    }else{stage='ACTIVE';guidance='Program uygulaması ve koç görüşmelerindeki devamlılığı izleyin.';}
    if(last7DaysActive===false)guidance='Son 7 günde kayıtlı çalışma yok; koçla birlikte temasa geçin.';
  }else{
    const latestEnd=purchases.map(p=>p.endsAt).filter((d):d is Date=>d!==null).sort((a,b)=>b.getTime()-a.getTime())[0];
    if(latestEnd&&now.getTime()-latestEnd.getTime()>=7*DAY){
      stage='CHURNED';guidance='Abonelik bitmiş ve 7 gün geçmiştir; ayrılma nedenini takip edin.';
    }else{stage='RENEWAL_DUE';guidance='Abonelik süresi bitmiş olabilir; yenileme durumunu doğrulayın.';}
  }
  return {
    stage,label:CRM_LIFECYCLE_LABELS[stage],firstPurchaseAt:first?.startedAt||null,
    day30At,day30Matured:matured,subscriptionAtDay30:activeAt30,activityAtDay30,
    retainedAtDay30,programCompletionPct,sessionAttendancePct,
    renewed,activeSubscriptionNow:activeNow,renewalDate,last7DaysActive,guidance
  };
}

export function summarizeCrmLifecycle(rows:CrmLifecycleSnapshot[]){
  const matured=rows.filter(x=>x.day30Matured);
  const measuredPrograms=matured.filter(x=>x.programCompletionPct!==null);
  const measuredSessions=matured.filter(x=>x.sessionAttendancePct!==null);
  const count=(items:CrmLifecycleSnapshot[],test:(x:CrmLifecycleSnapshot)=>boolean)=>items.filter(test).length;
  const enrolled=rows.filter(x=>x.firstPurchaseAt!==null);
  return {
    linkedPurchasers:enrolled.length,
    day30Eligible:matured.length,
    retainedDay30:count(matured,x=>x.retainedAtDay30===true),
    retainedDay30Pct:percent(count(matured,x=>x.retainedAtDay30===true),matured.length),
    programMeasured:measuredPrograms.length,
    programApplied:count(measuredPrograms,x=>(x.programCompletionPct||0)>=60),
    programAppliedPct:percent(count(measuredPrograms,x=>(x.programCompletionPct||0)>=60),measuredPrograms.length),
    sessionsMeasured:measuredSessions.length,
    attendedCoachSessions:count(measuredSessions,x=>(x.sessionAttendancePct||0)>0),
    attendedCoachPct:percent(count(measuredSessions,x=>(x.sessionAttendancePct||0)>0),measuredSessions.length),
    renewed:count(enrolled,x=>x.renewed),
    churned:count(enrolled,x=>x.stage==='CHURNED')
  };
}
