/**
 * Approved weekly-plan audit. A coach's assignment receipt is not a timer.
 * Suggested (TOPIC/PRACTICE/REVIEW) blocks have no reliable completion
 * receipt in the approved plan; never label them as missed or fulfilled.
 */
export type PlannedBlock={type?:string;actionId?:string;title?:string;duration?:number};
export type PlannedDay={date?:string;plannedMinutes?:number;capacityMinutes?:number;tasks?:PlannedBlock[]};
export type ApprovedPlan={id:string;title:string;createdAt:Date|string;days:PlannedDay[]};
export type ActionReceipt={actionId:string;submittedAt:Date|string;late?:boolean};
export type FocusSession={startedAt:Date|string;activeSeconds:number;completed?:boolean};
type DayStatus='FUTURE'|'TODAY'|'PAST';
export type AdherenceDay={
  date:string;status:DayStatus;plannedMinutes:number;capacityMinutes:number;
  coachAssigned:number;coachConfirmed:number;coachMissing:number;coachPending:number;
  coachLate:number;suggestedBlocks:number;
  observedFocusMinutes:number|null;focusSessions:number;
};
export type PlanAdherenceResult={
  planId:string;title:string;createdAt:string;days:AdherenceDay[];
  summary:{expectedCoachTasks:number;confirmedCoachTasks:number;missedCoachTasks:number;
    pendingCoachTasks:number;lateCoachTasks:number;completedDays:number;
    observedFocusDays:number;unverifiedSuggestionBlocks:number;coachCompletionPercent:number|null};
  recommendations:{priority:'HIGH'|'MEDIUM'|'INFO';reason:string;action:string}[];
  evidenceNote:string;
};
export function istanbulDayKey(date:Date){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
function safeDate(v:Date|string){const d=new Date(v);return Number.isFinite(d.getTime())?d:null;}
function positiveMinutes(v:unknown){return typeof v==='number'&&Number.isFinite(v)&&v>0?Math.min(720,Math.round(v)):0;}

export function evaluateApprovedPlan(
  plan:ApprovedPlan,receipts:ActionReceipt[],focus:FocusSession[],now=new Date()
):PlanAdherenceResult{
  const created=safeDate(plan.createdAt);
  if(!created)throw new Error('Geçersiz onay tarihi.');
  const today=istanbulDayKey(now);
  const submitted=new Map<string,{time:Date;late:boolean}>();
  for(const r of receipts){
    const d=safeDate(r.submittedAt);
    if(!r.actionId||!d||d>now||d<created)continue;
    const prev=submitted.get(r.actionId);
    if(!prev||d<prev.time)submitted.set(r.actionId,{time:d,late:Boolean(r.late)});
  }
  const sessionsByDay=new Map<string,{seconds:number;count:number}>();
  for(const s of focus){
    const start=safeDate(s.startedAt);
    if(!start||start<created||start>now||!Number.isSafeInteger(s.activeSeconds)
      ||s.activeSeconds<=0||s.activeSeconds>43200)continue;
    const key=istanbulDayKey(start);
    const prev=sessionsByDay.get(key)||{seconds:0,count:0};
    prev.seconds+=s.activeSeconds;prev.count++;
    sessionsByDay.set(key,prev);
  }
  const uniqueActions=new Set<string>();
  const days:AdherenceDay[]=[];
  for(const day of plan.days.slice(0,14)){
    const date=safeDate(day.date||'');
    if(!date)continue;
    const dateKey=istanbulDayKey(date);
    const status:DayStatus=dateKey>today?'FUTURE':dateKey===today?'TODAY':'PAST';
    const blocks=Array.isArray(day.tasks)?day.tasks:[];
    let coachAssigned=0,coachConfirmed=0,coachMissing=0,coachPending=0,coachLate=0,suggestedBlocks=0;
    for(const block of blocks){
      if(block.type!=='COACH_ACTION'||!block.actionId){suggestedBlocks++;continue;}
      if(uniqueActions.has(block.actionId))continue;
      uniqueActions.add(block.actionId);
      coachAssigned++;
      const receipt=submitted.get(block.actionId);
      if(receipt){
        coachConfirmed++;
        if(receipt.late)coachLate++;
      }else if(status==='PAST')coachMissing++;
      else coachPending++;
    }
    const measured=sessionsByDay.get(dateKey);
    days.push({
      date:dateKey,status,
      plannedMinutes:positiveMinutes(day.plannedMinutes),
      capacityMinutes:positiveMinutes(day.capacityMinutes),
      coachAssigned,coachConfirmed,coachMissing,coachPending,coachLate,suggestedBlocks,
      observedFocusMinutes:measured?Math.round(measured.seconds/60):null,
      focusSessions:measured?.count||0
    });
  }
  const total=(key:keyof Pick<AdherenceDay,'coachAssigned'|'coachConfirmed'|'coachMissing'|'coachPending'|'coachLate'|'suggestedBlocks'>)=>
    days.reduce((sum,day)=>sum+day[key],0);
  const expectedCoachTasks=total('coachAssigned');
  const confirmedCoachTasks=total('coachConfirmed');
  const missedCoachTasks=total('coachMissing');
  const lateCoachTasks=total('coachLate');
  const pendingCoachTasks=total('coachPending');
  const completedDays=days.filter(x=>x.status==='PAST').length;
  const observedFocusDays=days.filter(x=>x.status!=='FUTURE'&&x.focusSessions>0).length;
  const recommendations:PlanAdherenceResult['recommendations']=[];
  if(missedCoachTasks>=2){
    recommendations.push({priority:'HIGH',
      reason:missedCoachTasks+' koç görevi için geçmiş günlerde öğrenci teslimi yok.',
      action:'Koç, gerçek engeli görüşmede belirleyip görevleri kapasiteye göre yeniden değerlendirmeli; tarihler otomatik değiştirilmemeli.'});
  }else if(missedCoachTasks===1){
    recommendations.push({priority:'MEDIUM',
      reason:'Bir geçmiş koç görevine ait teslim kaydı yok.',
      action:'Öğrenciye tamamlanma durumunu sor; gerekirse koç takvimi revize etsin.'});
  }
  if(lateCoachTasks>=2)recommendations.push({
    priority:'MEDIUM',reason:lateCoachTasks+' koç görevi geç teslim edildi.',
    action:'Verimli çalışma zamanını, akşam yoğunluğunu ve görev dağılımını öğrenciyle yeniden gözden geçir.'});
  if(completedDays>=2&&observedFocusDays===0){
    recommendations.push({priority:'INFO',
      reason:'Geçmiş günlerde ölçülmüş odak oturumu kaydı yok.',
      action:'Süreyi sıfır sayma; öğrenci isterse sonraki çalışmasında zamanlayıcıyı kullanarak güvenilir süre verisi oluştur.'});
  }
  if(!expectedCoachTasks)recommendations.push({priority:'INFO',
    reason:'Bu onaylı plan taslağında teslim kaydıyla doğrulanabilen koç görevi bulunmuyor.',
    action:'Öneri bloklarını tamamlanmadı diye işaretleme; gerekirse koç ölçülebilir görev tanımlasın.'});
  return {
    planId:plan.id,title:plan.title,createdAt:created.toISOString(),days,
    summary:{
      expectedCoachTasks,confirmedCoachTasks,missedCoachTasks,pendingCoachTasks,
      lateCoachTasks,completedDays,observedFocusDays,
      unverifiedSuggestionBlocks:total('suggestedBlocks'),
      coachCompletionPercent:expectedCoachTasks?Math.round(confirmedCoachTasks/expectedCoachTasks*100):null
    },
    recommendations,
    evidenceNote:'Koç görevi teslim oranı yalnız sunucuda saklanan öğrenci teslimlerine dayanır; bağımsız öğrenme kanıtı değildir. Odak dakikaları yalnız kaydedilmiş zamanlayıcı oturumlarından gelir. Öneri/tekrar blokları için göreve özgü güvenilir tamamlanma kanıtı olmadığından bunların gerçekleşmesi ölçülmez. Geçmiş teslim kaydının yokluğu çalışmanın kesinlikle yapılmadığını göstermez.'
  };
}
