import {createHash} from 'node:crypto';

type Obj=Record<string,unknown>;
type PlanDay={date:string;plannedMinutes:number;capacityMinutes:number;tasks:PlanTask[]};
type PlanTask={type:string;title:string;duration:number;actionId?:string;reviewIds?:string[]};
export type PlanSummary={
  days:number;minutes:number;capacityMinutes:number;coachTasks:number;
  reviewQuestions:number;otherBlocks:number;daily:{date:string;minutes:number;capacityMinutes:number;taskCount:number}[];
};
export type PlanComparison={
  previous:PlanSummary|null;proposed:PlanSummary;
  deltaMinutes:number|null;
  deltaCoachTasks:number|null;
  deltaReviewQuestions:number|null;
  addedTasks:string[];removedTasks:string[];
  warning:string;
};
function obj(v:unknown):Obj{return v&&typeof v==='object'&&!Array.isArray(v)?v as Obj:{};}
function number(v:unknown){return typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.round(v)):0;}
function text(v:unknown){return typeof v==='string'?v.trim():'';}
function readDays(v:unknown):PlanDay[]{
  const days=obj(v).days;
  if(!Array.isArray(days))return [];
  return days.slice(0,14).flatMap(day=>{
    const d=obj(day),date=text(d.date);
    if(!Number.isFinite(new Date(date).getTime()))return [];
    const tasks=Array.isArray(d.tasks)?d.tasks.slice(0,120).map(item=>{
      const x=obj(item),id=text(x.actionId);
      return {
        type:text(x.type)||'UNKNOWN',title:text(x.title),
        duration:number(x.duration),
        ...(id?{actionId:id}:{}),
        ...(Array.isArray(x.reviewIds)?{reviewIds:x.reviewIds.filter(y=>typeof y==='string').sort()}: {})
      };
    }):[];
    return [{date,plannedMinutes:number(d.plannedMinutes),
      capacityMinutes:number(d.capacityMinutes),tasks}];
  });
}
function summarize(days:PlanDay[]):PlanSummary{
  return {
    days:days.length,
    minutes:days.reduce((n,x)=>n+x.plannedMinutes,0),
    capacityMinutes:days.reduce((n,x)=>n+x.capacityMinutes,0),
    coachTasks:days.reduce((n,x)=>n+x.tasks.filter(t=>t.type==='COACH_ACTION').length,0),
    reviewQuestions:days.reduce((n,x)=>n+x.tasks.filter(t=>t.type==='REVIEW')
      .reduce((n,t)=>n+(t.reviewIds?.length||0),0),0),
    otherBlocks:days.reduce((n,x)=>n+x.tasks.filter(t=>t.type!=='REVIEW'&&t.type!=='COACH_ACTION').length,0),
    daily:days.map(d=>({date:d.date,minutes:d.plannedMinutes,
      capacityMinutes:d.capacityMinutes,taskCount:d.tasks.length}))
  };
}
function taskKey(t:PlanTask){
  if(t.type==='COACH_ACTION'&&t.actionId)return 'COACH_ACTION|'+t.actionId;
  if(t.type==='REVIEW'&&t.reviewIds?.length)return 'REVIEW|'+t.reviewIds.join(',');
  return t.type+'|'+t.title;
}
function taskDescriptions(days:PlanDay[]){
  const x=new Map<string,string>();
  for(const d of days)for(const t of d.tasks){
    const k=taskKey(t);
    if(!x.has(k))x.set(k,t.title||t.type);
  }
  return x;
}
export function compareWeeklyPlans(previous:unknown,proposed:unknown):PlanComparison{
  const a=previous==null?null:readDays(previous),b=readDays(proposed);
  const old=a? summarize(a):null,next=summarize(b);
  const oldKeys=a?taskDescriptions(a):new Map<string,string>();
  const newKeys=taskDescriptions(b);
  return {
    previous:old,proposed:next,
    deltaMinutes:old?next.minutes-old.minutes:null,
    deltaCoachTasks:old?next.coachTasks-old.coachTasks:null,
    deltaReviewQuestions:old?next.reviewQuestions-old.reviewQuestions:null,
    addedTasks:[...newKeys].filter(([key])=>!oldKeys.has(key)).map(([,value])=>value).slice(0,12),
    removedTasks:[...oldKeys].filter(([key])=>!newKeys.has(key)).map(([,value])=>value).slice(0,12),
    warning:old
      ?'Planların gün aralıkları farklı olabilir; toplamlar iki ayrı yedi günlük taslağa aittir. Öneri bloklarının varlığı teslim kanıtı değildir.'
      :'Önceden etkin plan yok veya etkin planın günleri karşılaştırılamıyor. Yeni plan yalnız koçun açık onayıyla etkinleşir.'
  };
}
type ActivePlanVersion={id:string;updatedAt:Date|string};
export function planPreviewDigest(studentId:string,proposed:unknown,active:ActivePlanVersion[]){
  const days=readDays(proposed);
  const state=active.map(x=>({id:x.id,updatedAt:new Date(x.updatedAt).toISOString()}))
    .sort((a,b)=>a.id.localeCompare(b.id));
  return createHash('sha256').update(JSON.stringify({v:1,studentId,days,
    priority:obj(obj(proposed).prioritySummary),state})).digest('hex');
}
