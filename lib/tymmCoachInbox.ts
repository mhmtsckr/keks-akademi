/** Per-coach TYMM evidence inbox; aggregate metadata only, never return student answers. */
import {TYMM_PERFORMANCE_TASKS,performanceTaskById} from './tymmPerformanceTasks';
import {transferEligibility,transferVariantFor} from './tymmDelayedTransfer';

export type TymmInboxStudent={id:string;fullName:string;gradeLevel:string|null};
export type TymmInboxLog={id:string;studentId:string;createdAt:Date;payload:unknown};
export type TymmInboxItem={
 id:string;studentId:string;studentName:string;grade:number;subject:string;
 taskId:string;title:string;kind:'BASELINE_REVIEW'|'TRANSFER_REVIEW'|'TRANSFER_READY'|'TRANSFER_UPCOMING';
 timestamp:string;waitingHours:number|null;overdue:boolean;
};
function record(value:unknown):Record<string,unknown>{
 return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
}
function hoursSince(date:Date,now:Date){
 return Math.max(0,Math.floor((now.getTime()-date.getTime())/3600000));
}
export function summarizeCoachTymmInbox(students:readonly TymmInboxStudent[],logs:readonly TymmInboxLog[],now:Date){
 const names=new Map(students.map(x=>[x.id,x.fullName]));
 const allowedIds=new Set(names.keys());
 const byStudent=new Map<string,TymmInboxLog[]>();
 const entries:TymmInboxItem[]=[];
 for(const item of logs){
  if(!allowedIds.has(item.studentId))continue;
  const rows=byStudent.get(item.studentId)||[];rows.push(item);byStudent.set(item.studentId,rows);
  const p=record(item.payload),kind=String(p.type||'');
  if(kind!=='TYMM_PERFORMANCE_SUBMISSION'&&kind!=='TYMM_TRANSFER_SUBMISSION')continue;
  const task=performanceTaskById(String(p.taskId||''),Number(p.taskVersion));
  if(!task||task.grade!==p.grade)continue;
  const transfer=kind==='TYMM_TRANSFER_SUBMISSION';
  const variant=transfer?transferVariantFor(task.id):null;
  if(transfer&&(!variant||p.transferVariantId!==variant.id||p.transferVersion!==variant.version))continue;
  const elapsed=hoursSince(item.createdAt,now);
  entries.push({
   id:item.id,studentId:item.studentId,studentName:names.get(item.studentId)!,
   grade:task.grade,subject:task.subject,taskId:task.id,
   title:variant?.title||task.title,
   kind:transfer?'TRANSFER_REVIEW':'BASELINE_REVIEW',
   timestamp:item.createdAt.toISOString(),waitingHours:elapsed,overdue:elapsed>=48
  });
 }
 for(const student of students){
  const rows=byStudent.get(student.id)||[];
  for(const task of TYMM_PERFORMANCE_TASKS){
   const state=transferEligibility(task.id,rows,now);
   if(!state.dueAt)continue;
   const due=new Date(state.dueAt);
   const upcoming=state.status==='LOCKED'&&due.getTime()-now.getTime()<=48*3600000;
   if(state.status!=='AVAILABLE'&&!upcoming)continue;
   entries.push({
    id:'due:'+student.id+':'+task.id,
    studentId:student.id,studentName:student.fullName,
    grade:task.grade,subject:task.subject,taskId:task.id,title:task.title,
    kind:state.status==='AVAILABLE'?'TRANSFER_READY':'TRANSFER_UPCOMING',
    timestamp:state.dueAt,waitingHours:null,overdue:state.status==='AVAILABLE'&&now.getTime()-due.getTime()>=48*3600000
   });
  }
 }
 const rank:Record<TymmInboxItem['kind'],number>={
  TRANSFER_REVIEW:0,BASELINE_REVIEW:1,TRANSFER_READY:2,TRANSFER_UPCOMING:3
 };
 entries.sort((a,b)=>rank[a.kind]-rank[b.kind]||
  (a.kind==='TRANSFER_UPCOMING'?a.timestamp.localeCompare(b.timestamp):
   a.kind==='TRANSFER_READY'?a.timestamp.localeCompare(b.timestamp):
   a.timestamp.localeCompare(b.timestamp))||a.studentName.localeCompare(b.studentName,'tr'));
 const counts={
  awaitingCoach:entries.filter(x=>x.kind==='BASELINE_REVIEW'||x.kind==='TRANSFER_REVIEW').length,
  waitingOver48Hours:entries.filter(x=>x.waitingHours!==null&&x.waitingHours>=48).length,
  transferReady:entries.filter(x=>x.kind==='TRANSFER_READY').length,
  transferUpcoming48Hours:entries.filter(x=>x.kind==='TRANSFER_UPCOMING').length
 };
 return {counts,items:entries,note:'Koç için operasyonel takip listesi: yalnız ilgili koça atanmış öğrenciler. Geciken transfer öğrenciye hatırlatılabilir; koç yerine teslim yapılmaz. Kalıcı öğrenme otomatik belirlenmez.'};
}
