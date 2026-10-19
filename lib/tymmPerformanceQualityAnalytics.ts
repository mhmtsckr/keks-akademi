/**
 * Privacy-limited operational telemetry for human-reviewed TYMM pilot tasks.
 * Cohort = submissions created within query window; NOT all historical learners.
 * Never serialize student names, raw answers, notes or the underlying log IDs.
 */
export type PerformanceLogRow={createdAt:Date;payload:unknown};
type Phase='BASELINE'|'TRANSFER';
type Group={grade:number;subject:string;submissions:number;awaitingCoach:number;over48Hours:number;reviewed:number;transferReviewed:number};
const TYPES={
 TYMM_PERFORMANCE_SUBMISSION:{phase:'BASELINE',reviewed:false},
 TYMM_PERFORMANCE_REVIEWED:{phase:'BASELINE',reviewed:true},
 TYMM_TRANSFER_SUBMISSION:{phase:'TRANSFER',reviewed:false},
 TYMM_TRANSFER_REVIEWED:{phase:'TRANSFER',reviewed:true}
} as const;
function record(x:unknown):Record<string,unknown>{
 return x!==null&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:{};
}
function validGrade(v:unknown):v is number{return Number.isInteger(v)&&Number(v)>=1&&Number(v)<=12;}
function reviewedAt(v:unknown,submittedAt:Date):number|null{
 if(typeof v!=='string')return null;
 const ms=Date.parse(v);
 return Number.isFinite(ms)&&ms>=submittedAt.getTime()?ms:null;
}
export function performanceQualitySnapshot(rows:readonly PerformanceLogRow[],asOf:Date,opts:{days?:number;truncated?:boolean}={}){
 const days=opts.days??90;
 const windowStart=new Date(asOf.getTime()-days*86400000);
 const included=rows.filter(row=>
  row.createdAt instanceof Date&&Number.isFinite(row.createdAt.getTime())&&
  row.createdAt>=windowStart&&row.createdAt<=asOf);
 let submitted=0,baselineSubmitted=0,transferSubmitted=0,reviewed=0,baselineReviewed=0,transferReviewed=0;
 let awaitingCoach=0,over48Hours=0,validRubrics=0,lateReviews=0,lagTotal=0,lagCount=0;
 let comparisonCount=0,improved=0,struggled=0,similar=0,comparisonDeltaTotal=0;
 let missingReviewRationale=0;
 const groups=new Map<string,Group>();
 const outcomes=new Set<string>();
 for(const row of included){
  const p=record(row.payload),kind=TYPES[String(p.type) as keyof typeof TYPES];
  if(!kind)continue;
  submitted++;
  const isTransfer=kind.phase==='TRANSFER';
  if(isTransfer)transferSubmitted++;else baselineSubmitted++;
  if(typeof p.outcomeCode==='string'&&p.outcomeCode.length<=45)outcomes.add(p.outcomeCode);
  const grade=validGrade(p.grade)?p.grade:null;
  const subject=typeof p.subject==='string'&&p.subject.length<=70?p.subject:'Ders bilinmiyor';
  let group:Group|null=null;
  if(grade!==null){
    const key=grade+'|'+subject;
    group=groups.get(key)||{grade,subject,submissions:0,awaitingCoach:0,over48Hours:0,reviewed:0,transferReviewed:0};
    group.submissions++;groups.set(key,group);
  }
  if(!kind.reviewed){
    awaitingCoach++;if(group)group.awaitingCoach++;
    if(asOf.getTime()-row.createdAt.getTime()>=48*3600000){
      over48Hours++;if(group)group.over48Hours++;
    }
    continue;
  }
  reviewed++;if(group)group.reviewed++;
  if(isTransfer){transferReviewed++;if(group)group.transferReviewed++;}
  else baselineReviewed++;
  const rev=record(p.review),scores=Array.isArray(rev.criterionScores)?rev.criterionScores:[];
  if(rev.max===8&&Number.isInteger(rev.total)&&scores.length===4&&
    scores.every(x=>{const c=record(x);return Number.isInteger(c.score)&&Number(c.score)>=0&&Number(c.score)<=2;})&&
    scores.reduce<number>((n,x)=>n+Number(record(x).score),0)===rev.total)validRubrics++;
  const lagMs=reviewedAt(rev.reviewedAt,row.createdAt);
  if(lagMs!==null){
    const lag=lagMs-row.createdAt.getTime();
    lagTotal+=lag;lagCount++;if(lag>=48*3600000)lateReviews++;
  }
  const rationale=record(rev.criterionEvidence);
  if(scores.some(x=>Number(record(x).score)<2&&
    (typeof rationale[String(record(x).id)]!=='string'||String(rationale[String(record(x).id)]).trim().length<20)))missingReviewRationale++;
  if(isTransfer){
    const c=record(rev.comparison),delta=c.delta;
    if(typeof delta==='number'&&Number.isInteger(delta)&&delta>=-8&&delta<=8&&
      Number.isInteger(c.baselineTotal)&&Number.isInteger(c.transferTotal)&&
      Number(c.transferTotal)-Number(c.baselineTotal)===delta){
      comparisonCount++;comparisonDeltaTotal+=delta;
      if(delta>=2)improved++;else if(delta<=-2)struggled++;else similar++;
    }
  }
 }
 const averageReviewHours=lagCount>0?Math.round((lagTotal/lagCount/3600000)*10)/10:null;
 return {
  periodDays:days,periodStart:windowStart.toISOString(),asOf:asOf.toISOString(),truncated:Boolean(opts.truncated),
  submitted,baselineSubmitted,transferSubmitted,reviewed,baselineReviewed,transferReviewed,
  awaitingCoach,over48Hours,validRubrics,lateReviews,averageReviewHours,
  missingReviewRationale,distinctOutcomeCodes:outcomes.size,
  transfersWithValidComparison:comparisonCount,improved,struggled,similar,
  averageTransferDelta:comparisonCount?Math.round(comparisonDeltaTotal/comparisonCount*10)/10:null,
  byGradeAndSubject:[...groups.values()].sort((a,b)=>a.grade-b.grade||a.subject.localeCompare(b.subject,'tr')),
  disclaimers:[
    'Bu rapor son '+days+' günde oluşturulmuş pilot görev kayıtlarını içerir; tüm kullanıcıların başarı oranı değildir.',
    'İlk ve ikinci rubrik farkları öğretimsel sinyaldir. Görevlerin psikometrik eşdeğerliği ve kalıcı öğrenme kanıtlanmış değildir.',
    'İnceleme gecikmesi öğrenci gönderim saatinden hesaplanır; kişisel yanıt, koç notu veya öğrenci kimliği bu raporda gösterilmez.',
    Boolean(opts.truncated)?'Kayıt limiti aşıldı; sayılar bütün dönemi değil, en yeni kayıt örneklemini temsil eder.':'Kayıt limiti aşılmadı; tarih aralığı içindeki bulunan kayıtlar hesaplandı.'
  ]
 };
}
