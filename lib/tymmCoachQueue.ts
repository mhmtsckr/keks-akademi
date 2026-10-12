import {performanceTaskById} from './tymmPerformanceTasks';
export type CoachQueueStudent={id:string;fullName:string;gradeLevel:string|null};
export type CoachQueueLog={id:string;studentId:string;createdAt:Date;payload:unknown};
export type CoachQueueItem={
 id:string;studentId:string;studentName:string;gradeLevel:string|null;
 taskId:string;title:string;grade:number;subject:string;outcomeCode:string;
 phase:'BASELINE'|'TRANSFER';submittedAt:string;hoursWaiting:number;priority:'OVERDUE'|'WAITING';
};
function record(x:unknown):Record<string,unknown>{
 return x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:{};
}
export function buildCoachPerformanceQueue(
 students:readonly CoachQueueStudent[],logs:readonly CoachQueueLog[],now:Date
):CoachQueueItem[]{
 const allowed=new Map(students.map(s=>[s.id,s]));
 return logs.flatMap(log=>{
  const student=allowed.get(log.studentId);
  if(!student)return [];
  const payload=record(log.payload);
  if(!['TYMM_PERFORMANCE_SUBMISSION','TYMM_TRANSFER_SUBMISSION'].includes(String(payload.type)))return [];
  const task=performanceTaskById(String(payload.taskId||''),Number(payload.taskVersion));
  if(!task||task.grade!==payload.grade)return [];
  const time=log.createdAt.getTime();
  if(!Number.isFinite(time)||time>now.getTime())return [];
  const isTransfer=payload.type==='TYMM_TRANSFER_SUBMISSION';
  const hoursWaiting=Math.floor((now.getTime()-time)/3600000);
  return [{
   id:log.id,studentId:student.id,studentName:student.fullName,
   gradeLevel:student.gradeLevel,taskId:task.id,title:task.title,
   grade:task.grade,subject:task.subject,outcomeCode:task.outcomeCode,
   phase:isTransfer?'TRANSFER' as const:'BASELINE' as const,
   submittedAt:log.createdAt.toISOString(),hoursWaiting,
   priority:hoursWaiting>=24?'OVERDUE' as const:'WAITING' as const
  }];
 }).sort((a,b)=>(a.priority===b.priority?b.hoursWaiting-a.hoursWaiting:a.priority==='OVERDUE'?-1:1));
}
