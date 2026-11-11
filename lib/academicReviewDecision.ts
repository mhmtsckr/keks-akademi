/** A decision documents the coach's review, not student learning or task completion. */
export type AcademicReviewDecision='CLOSE_REVIEW'|'COLLECT_MORE_EVIDENCE'|'DISMISS_SIGNAL';
export function dateKeyIstanbul(now=new Date()){
  return new Intl.DateTimeFormat('en-CA',{
    timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'
  }).format(now);
}
function dayNumber(day:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;
  const time=new Date(day+'T12:00:00Z');
  if(!Number.isFinite(time.getTime())||time.toISOString().slice(0,10)!==day)return null;
  return Math.floor(Date.parse(day+'T00:00:00Z')/86400000);
}
export function scheduledRecheckDueAt(day:string,now=new Date()){
  const today=dayNumber(dateKeyIstanbul(now)),target=dayNumber(day);
  if(today==null||target==null||target-today<1||target-today>28)return null;
  // Europe/Istanbul remains UTC+03:00; 20:00Z corresponds to 23:00 local.
  return new Date(day+'T20:00:00Z');
}
export function academicReviewDecisionLabel(decision:AcademicReviewDecision){
  if(decision==='CLOSE_REVIEW')return 'Koç incelemeyi gerekçeli biçimde tamamladı';
  if(decision==='COLLECT_MORE_EVIDENCE')return 'Koç ek ölçüm gereksinimi kaydetti';
  return 'Koç kanıtla desteklenmeyen sinyali iptal etti';
}
