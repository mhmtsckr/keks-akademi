export type InterventionKind=
  |'ACTIVE_RECALL'
  |'DAILY_PROBLEM_ROUTINE'
  |'REVIEW_PRIORITY'
  |'DIAGNOSTIC_SET'
  |'CAPACITY_REPLAN'
  |'ERROR_ANALYSIS'
  |'EXAM_ROUTINE'
  |'STUDY_ROUTINE'
  |'OTHER';

const SUBJECTS=[
  'Matematik','Geometri','Türkçe','Edebiyat','Tarih','Coğrafya','Biyoloji','Kimya','Fizik',
  'Fen','Vatandaşlık','İngilizce','Yabancı Dil','Sayısal','Sözel'
];

function norm(v:string){
  return v.toLocaleLowerCase('tr-TR').replace(/[âîû]/g,m=>({â:'a',î:'i',û:'u'}[m]||m));
}

export function classifyCoachDecision(text:string){
  const n=norm(text);
  let kind:InterventionKind='OTHER';
  if(n.includes('aktif hatırlama'))kind='ACTIVE_RECALL';
  else if((n.includes('problem')&&n.includes('günlük'))||n.includes('problem rutini'))kind='DAILY_PROBLEM_ROUTINE';
  else if(n.includes('tekrar')&&(n.includes('öncel')||n.includes('kuyruk')))kind='REVIEW_PRIORITY';
  else if(n.includes('tanılayıcı')||n.includes('kontrol seti'))kind='DIAGNOSTIC_SET';
  else if(n.includes('kapasite')||n.includes('yeniden dağıt')||n.includes('yeniden planla'))kind='CAPACITY_REPLAN';
  else if(n.includes('yanlış nedeni')||n.includes('hata analizi')||n.includes('yanlış analizi'))kind='ERROR_ANALYSIS';
  else if(n.includes('deneme')&&(n.includes('haftada')||n.includes('rutin')||n.includes('uygula')))kind='EXAM_ROUTINE';
  else if(n.includes('rutin')||n.includes('her gün')||n.includes('günlük'))kind='STUDY_ROUTINE';

  const subject=SUBJECTS.find(s=>n.includes(norm(s)))||null;
  return {kind,subject};
}

export function interventionKindLabel(kind:InterventionKind){
  const labels:Record<InterventionKind,string>={
    ACTIVE_RECALL:'Aktif hatırlama',
    DAILY_PROBLEM_ROUTINE:'Günlük problem rutini',
    REVIEW_PRIORITY:'Tekrar önceliği',
    DIAGNOSTIC_SET:'Tanılayıcı kontrol seti',
    CAPACITY_REPLAN:'Kapasiteye göre yeniden planlama',
    ERROR_ANALYSIS:'Yanlış nedeni analizi',
    EXAM_ROUTINE:'Deneme rutini',
    STUDY_ROUTINE:'Günlük çalışma rutini',
    OTHER:'Diğer koçluk kararı'
  };
  return labels[kind];
}

export type ImpactPracticeRow={date:Date;total:number;correct:number;blank:number};

export function summarizeImpactWindow(rows:ImpactPracticeRow[]){
  const questions=rows.reduce((n,x)=>n+x.total,0);
  const correct=rows.reduce((n,x)=>n+x.correct,0);
  const blank=rows.reduce((n,x)=>n+x.blank,0);
  return {
    questions,
    accuracy:questions?Math.round(correct/questions*100):null,
    blank
  };
}

export function buildImpactHeadline(input:{
  decision:string;kind:InterventionKind;subject:string|null;
  before:{accuracy:number|null;blank:number};after:{accuracy:number|null;blank:number};
  weeksAfter:number;
}){
  const label=interventionKindLabel(input.kind);
  const subject=input.subject?input.subject+' ':'';
  const accuracyDelta=input.before.accuracy!=null&&input.after.accuracy!=null
    ?input.after.accuracy-input.before.accuracy:null;
  const blankDelta=input.after.blank-input.before.blank;
  if(accuracyDelta!=null&&Math.abs(accuracyDelta)>=3){
    return label+' önerildi → '+input.weeksAfter+' hafta sonra '+subject+'doğruluk '+(accuracyDelta>0?'+':'')+'%'+accuracyDelta;
  }
  if(blankDelta!==0){
    return label+' eklendi → '+subject+'boş sayısı '+(blankDelta>0?'+':'')+blankDelta;
  }
  return label+' → ölçülen performansta belirgin değişim yok';
}

export function aggregateInterventionPatterns(rows:{
  kind:InterventionKind;accuracyDelta:number|null;blankDelta:number;beforeQuestions:number;afterQuestions:number;
}[]){
  const map=new Map<InterventionKind,{n:number;acc:number[];blank:number[];evidence:number}>();
  for(const row of rows){
    const x=map.get(row.kind)||{n:0,acc:[],blank:[],evidence:0};
    x.n++;
    if(row.accuracyDelta!=null)x.acc.push(row.accuracyDelta);
    x.blank.push(row.blankDelta);
    x.evidence+=row.beforeQuestions+row.afterQuestions;
    map.set(row.kind,x);
  }
  return [...map.entries()].map(([kind,x])=>({
    kind,
    label:interventionKindLabel(kind),
    cases:x.n,
    avgAccuracyDelta:x.acc.length?Number((x.acc.reduce((a,b)=>a+b,0)/x.acc.length).toFixed(1)):null,
    avgBlankDelta:x.blank.length?Number((x.blank.reduce((a,b)=>a+b,0)/x.blank.length).toFixed(1)):0,
    evidenceQuestions:x.evidence,
    confidence:x.n>=5&&x.evidence>=200?'GÜÇLÜ':x.n>=3&&x.evidence>=100?'ORTA':'ERKEN_SİNYAL',
    note:'Gözlemsel ilişki; nedensellik kanıtı değildir.'
  })).sort((a,b)=>b.cases-a.cases||b.evidenceQuestions-a.evidenceQuestions);
}
