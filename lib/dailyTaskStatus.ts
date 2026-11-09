/** Derived, read-only student-facing state. A student's client never chooses it. */
export type DailyTaskStatus='COMPLETED'|'LATE_COMPLETED'|'INCOMPLETE'|'UPCOMING';

const ISTANBUL='Europe/Istanbul';

export function dailyTaskDateKey(taskDate:Date|null,periodEnd:Date){
  const d=taskDate||periodEnd;
  return [d.getUTCFullYear(),String(d.getUTCMonth()+1).padStart(2,'0'),String(d.getUTCDate()).padStart(2,'0')].join('-');
}

/** Deadline is exactly 23:00 Istanbul time on the scheduled task date. */
export function dailyTaskDeadline(taskDate:Date|null,periodEnd:Date){
  const d=taskDate||periodEnd;
  // Türkiye uses UTC+03:00 year-round, so 23:00 local is 20:00 UTC.
  return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),20,0,0,0));
}

export function dailyTaskStatus(input:{
  taskDate:Date|null;
  periodEnd:Date;
  submittedAt:Date|null;
},now=new Date()):DailyTaskStatus{
  if(input.submittedAt){
    return input.submittedAt.getTime()>=dailyTaskDeadline(input.taskDate,input.periodEnd).getTime()
      ?'LATE_COMPLETED':'COMPLETED';
  }
  const today=new Intl.DateTimeFormat('en-CA',{
    timeZone:ISTANBUL,year:'numeric',month:'2-digit',day:'2-digit'
  }).format(now);
  return dailyTaskDateKey(input.taskDate,input.periodEnd)>today?'UPCOMING':'INCOMPLETE';
}
