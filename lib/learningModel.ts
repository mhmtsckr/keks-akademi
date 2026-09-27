export type MasteryState='NEW'|'LEARNING'|'REINFORCING'|'DURABLE'|'RISKY';

export type LearningMetricInput={
  examType:string;
  subject:string;
  topic?:string|null;
  correct:number;
  wrong:number;
  blank:number;
  durationSeconds?:number|null;
  questionType?:string|null;
  problemType?:string|null;
  activeRecallScore?:number|null;
  reviewSuccessScore?:number|null;
  connectionScore?:number|null;
  conceptScore?:number|null;
  misconception?:string|null;
  difficulty?:number|null;
};

export type HistoricalMetric={
  date:Date;
  masteryScore?:number|null;
  metricPayload?:unknown;
};

const clamp=(n:number)=>Math.max(0,Math.min(100,n));
const norm=(s:string)=>s.toLocaleUpperCase('tr-TR');

export function examProfile(examType:string){
  const e=norm(examType);
  if(e==='TYT')return {speed:1.15,depth:.9,recall:.9};
  if(e==='AYT')return {speed:.8,depth:1.2,recall:1};
  if(e==='ALES')return {speed:1.3,depth:.85,recall:.7};
  if(e==='DGS')return {speed:1.3,depth:.85,recall:.7};
  if(e==='AGS')return {speed:.75,depth:1,recall:1.3};
  if(e==='KPSS')return {speed:.8,depth:.95,recall:1.25};
  if(e==='YDS')return {speed:1.05,depth:1,recall:1.05};
  if(e==='OABT' || e.includes('ÖABT'))return {speed:.75,depth:1.3,recall:1.1};
  return {speed:1,depth:1,recall:1};
}

function subjectKind(subject:string){
  const s=norm(subject);
  if(/MATEMATİK|GEOMETRİ|SAYISAL/.test(s))return 'MATH';
  if(/TÜRKÇE|SÖZEL/.test(s))return 'TURKISH';
  if(/TARİH|İNKILAP/.test(s))return 'HISTORY';
  if(/EDEBİYAT/.test(s))return 'LITERATURE';
  if(/FİZİK|KİMYA|BİYOLOJİ|FEN/.test(s))return 'SCIENCE';
  if(/İNGİLİZCE|YDS|YABANCI DİL/.test(s))return 'LANGUAGE';
  return 'GENERAL';
}

function speedScore(input:LearningMetricInput){
  if(!input.durationSeconds || input.durationSeconds<=0)return 65;
  const kind=subjectKind(input.subject);
  const target=kind==='MATH'?100:kind==='TURKISH'||kind==='LANGUAGE'?75:90;
  return clamp(100-(input.durationSeconds-target)*.65);
}

function numeric(v:number|null|undefined,fallback=65){return typeof v==='number'&&Number.isFinite(v)?clamp(v):fallback}

export function calculateLearningSnapshot(input:LearningMetricInput,history:HistoricalMetric[]=[]){
  const total=input.correct+input.wrong+input.blank;
  const accuracy=total?input.correct/total*100:0;
  const speed=speedScore(input);
  const profile=examProfile(input.examType);
  const kind=subjectKind(input.subject);
  const recall=numeric(input.activeRecallScore);
  const review=numeric(input.reviewSuccessScore);
  const connection=numeric(input.connectionScore);
  const concept=numeric(input.conceptScore);
  const misconceptionPenalty=input.misconception?.trim()?22:0;
  const typeEvidence=(input.problemType||input.questionType)?.trim()?78:60;

  let raw=accuracy;
  if(kind==='MATH')raw=accuracy*.45+(speed*profile.speed)*.28+typeEvidence*.17+numeric(input.difficulty?input.difficulty*20:null)*.10;
  else if(kind==='TURKISH'||kind==='LANGUAGE')raw=accuracy*.48+(speed*profile.speed)*.30+typeEvidence*.22;
  else if(kind==='HISTORY')raw=accuracy*.20+(recall*profile.recall)*.42+(review*profile.recall)*.38;
  else if(kind==='LITERATURE')raw=accuracy*.25+(connection*profile.depth)*.45+(recall*profile.recall)*.30;
  else if(kind==='SCIENCE')raw=accuracy*.38+(concept*profile.depth)*.38+(100-misconceptionPenalty)*.24;
  else raw=accuracy*.55+(recall*profile.recall)*.25+(concept*profile.depth)*.20;

  const now=Date.now();
  const recent=history.filter(h=>now-h.date.getTime()<=28*86400000);
  const oldEnough=history.filter(h=>now-h.date.getTime()>=7*86400000);
  const historicalScores=recent.map(h=>typeof h.masteryScore==='number'?h.masteryScore:null).filter((x):x is number=>x!==null);
  const historyAverage=historicalScores.length?historicalScores.reduce((a,b)=>a+b,0)/historicalScores.length:raw;
  const stability=history.length?Math.min(100,55+Math.min(history.length,6)*7.5):45;
  let score=clamp(raw*.62+historyAverage*.23+stability*.15);

  if(input.misconception?.trim())score=clamp(score-10);
  if(oldEnough.length&&historyAverage<55)score=clamp(score-8);

  let state:MasteryState='NEW';
  if(history.length===0)state='NEW';
  else if(score<50 || (oldEnough.length>0&&historyAverage<55))state='RISKY';
  else if(score<65)state='LEARNING';
  else if(score<82 || history.length<3)state='REINFORCING';
  else state='DURABLE';

  const priority=state==='RISKY'?'HIGH':state==='LEARNING'?'MEDIUM':state==='REINFORCING'?'NORMAL':'LOW';
  const nextAction=
    kind==='HISTORY'&&recall<70?'Aktif hatırlama testi + 1–3–7–14–28 tekrar':
    kind==='LITERATURE'&&connection<70?'Dönem–yazar–eser bağlantı eşleştirmesi':
    kind==='SCIENCE'&&input.misconception?.trim()?'Kavram yanılgısını düzelt + kısa tanılayıcı test':
    (kind==='MATH'||kind==='TURKISH'||kind==='LANGUAGE')&&speed<65?'Süreli mikro set + aynı soru türünde hız çalışması':
    score<65?'Konu tekrarı + kısa uygulama seti':'Aralıklı tekrar ile koru';

  return {
    score:Math.round(score*10)/10,
    state,
    priority,
    nextAction,
    diagnostics:{accuracy:Math.round(accuracy),speed:Math.round(speed),recall:Math.round(recall),review:Math.round(review),connection:Math.round(connection),concept:Math.round(concept),kind}
  };
}

export function masteryLabel(state:MasteryState|string){
  return ({NEW:'Yeni',LEARNING:'Öğreniliyor',REINFORCING:'Pekiştiriliyor',DURABLE:'Kalıcı',RISKY:'Riskli'} as Record<string,string>)[state]||state;
}
