/**
 * Draft-only priority allocator. It never changes assigned coach tasks or real
 * spaced-repetition due dates, and it never books more minutes than available.
 */
export type PriorityDay={key:string;budgetMinutes:number};
export type CoachAssignedWork={
  id:string;title:string;subject:string|null;topic:string|null;
  metricType:string;targetValue:number;taskDate:Date|null;periodEnd:Date;
};
export type DueReview={id:string;dueAt:Date};
export type PriorityBlock={
  type:'COACH_ACTION'|'REVIEW';title:string;duration:number;reason:string;
  actionId?:string;reviewIds?:string[];questions?:number;subject?:string|null;
  targetValue?:number;metricType?:string;
};
export type PriorityAllocation={
  byDay:Record<string,{tasks:PriorityBlock[];reservedMinutes:number}>;
  unallocatedCoachTasks:{id:string;title:string;scheduledFor:string;minutes:number;reason:string}[];
  pendingReviewCount:number;
  allocatedReviewCount:number;
};
const dayKey=(date:Date)=>new Intl.DateTimeFormat('en-CA',{
  timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'
}).format(date);
const norm=(v:number)=>Number.isFinite(v)?Math.max(0,Math.ceil(v)):0;
function coachMinutes(work:CoachAssignedWork){
  const target=norm(work.targetValue);
  if(work.metricType==='MINUTES')return Math.max(5,target);
  if(work.metricType==='QUESTIONS'){
    const subject=(work.subject||'').toLocaleUpperCase('tr-TR');
    const perQuestion=/MATEMATİK|GEOMETRİ|PROBLEM/.test(subject)?2.2
      :/TÜRKÇE|PARAGRAF/.test(subject)?1.5:1.5;
    return Math.max(5,Math.ceil(target*perQuestion));
  }
  return Math.max(10,Math.min(60,target*5));
}

export function allocateWeeklyPriorities(
  days:PriorityDay[],coaching:CoachAssignedWork[],reviews:DueReview[]
):PriorityAllocation{
  const byDay:PriorityAllocation['byDay']={};
  for(const day of days)byDay[day.key]={tasks:[],reservedMinutes:0};
  const unallocatedCoachTasks:PriorityAllocation['unallocatedCoachTasks']=[];
  if(!days.length)return {byDay,unallocatedCoachTasks,pendingReviewCount:reviews.length,allocatedReviewCount:0};
  const keys=new Set(days.map(x=>x.key));
  const first=days[0].key,last=days[days.length-1].key;
  const orderedActions=[...coaching].sort((a,b)=>{
    const ka=dayKey(a.taskDate||a.periodEnd),kb=dayKey(b.taskDate||b.periodEnd);
    return ka.localeCompare(kb)||a.id.localeCompare(b.id);
  });
  const processedActions=new Set<string>();
  for(const action of orderedActions){
    if(processedActions.has(action.id))continue;
    processedActions.add(action.id);
    const original=dayKey(action.taskDate||action.periodEnd);
    if(original>last)continue;
    const date=original<first?first:original;
    if(!keys.has(date))continue;
    const minutes=coachMinutes(action);
    const budget=days.find(x=>x.key===date)!.budgetMinutes;
    const slot=byDay[date];
    if(slot.reservedMinutes+minutes>budget){
      unallocatedCoachTasks.push({
        id:action.id,title:action.title,scheduledFor:original,minutes,
        reason:'Koçun atadığı görev '+minutes+' dk gerektiriyor; '+date+
          ' günü kalan kapasitesi '+(budget-slot.reservedMinutes)+' dk. Tarih koç onayı olmadan değiştirilmedi.'
      });
      continue;
    }
    slot.tasks.push({
      type:'COACH_ACTION',actionId:action.id,
      title:'Koç görevi · '+action.title,duration:minutes,
      reason:original<first
        ?'Koçun önceki tarihten kalan aktif görevi. Bu yalnızca taslak gösterimidir, teslim tarihi değiştirilmedi.'
        :'Koç tarafından atanan gerçek görev; yalnızca haftalık taslakta önceliklendirildi.',
      questions:action.metricType==='QUESTIONS'?norm(action.targetValue):undefined,
      subject:action.subject,metricType:action.metricType,targetValue:action.targetValue
    });
    slot.reservedMinutes+=minutes;
  }
  const validReviews=new Map<string,DueReview>();
  for(const r of reviews){
    if(!validReviews.has(r.id)&&Number.isFinite(r.dueAt.getTime()))
      validReviews.set(r.id,r);
  }
  const sortedReviews=[...validReviews.values()].sort((a,b)=>
    a.dueAt.getTime()-b.dueAt.getTime()||a.id.localeCompare(b.id));
  const allocated=new Set<string>();
  for(const day of days){
    const slot=byDay[day.key],budget=day.budgetMinutes;
    let reviewBlocks=0;
    while(reviewBlocks<2){
      const remaining=budget-slot.reservedMinutes;
      if(remaining<8)break;
      const due=sortedReviews.filter(r=>!allocated.has(r.id)&&dayKey(r.dueAt)<=day.key);
      if(!due.length)break;
      const n=Math.min(4,due.length,Math.floor(remaining/4));
      if(n<=0)break;
      const ids=due.slice(0,n).map(x=>x.id);
      const minutes=Math.max(8,ids.length*4);
      if(minutes>remaining)break;
      ids.forEach(id=>allocated.add(id));
      slot.reservedMinutes+=minutes;
      slot.tasks.push({
        type:'REVIEW',title:ids.length+' soru · 0–1–3–7–14–28 tekrarı',
        duration:minutes,reviewIds:ids,questions:ids.length,
        reason:'Tekrar kuyruğunun en eski vadesi gelen soruları; gerçek tekrar tarihi ve durumu değiştirilmedi.'
      });
      reviewBlocks++;
    }
  }
  return {
    byDay,unallocatedCoachTasks,
    pendingReviewCount:sortedReviews.filter(r=>!allocated.has(r.id)&&dayKey(r.dueAt)<=last).length,
    allocatedReviewCount:allocated.size
  };
}
