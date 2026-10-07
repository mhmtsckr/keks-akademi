export type RecommendationTerm='monthly'|'threeMonths'|'sixMonths'|'annual';
export type TrackingNeed='light'|'regular'|'intensive';
export type StudyRoutine='starting'|'irregular'|'regular';

export type PackageRecommendationInput={
  monthsToGoal:number;
  trackingNeed:TrackingNeed;
  studyRoutine:StudyRoutine;
};

export type PackageRecommendation={
  term:RecommendationTerm;
  title:string;
  explanation:string;
  reasons:string[];
  score:number;
};

const TERM_TITLES:Record<RecommendationTerm,string>={
  monthly:'Aylık Esnek Başlangıç',
  threeMonths:'3 Aylık KEKS Kamp',
  sixMonths:'6 Aylık Güçlenme',
  annual:'Yıllık KEKS 360'
};

const TIE_BREAK_ORDER:RecommendationTerm[]=['threeMonths','sixMonths','annual','monthly'];

function clampMonths(value:number){
  if(!Number.isFinite(value))return 1;
  return Math.max(1,Math.min(24,Math.round(value)));
}

function trackingLabel(value:TrackingNeed){
  if(value==='light')return 'esnek takip';
  if(value==='intensive')return 'yoğun takip';
  return 'düzenli takip';
}

function routineLabel(value:StudyRoutine){
  if(value==='starting')return 'çalışma düzenini yeni kuruyor olman';
  if(value==='regular')return 'mevcut düzenini uzun süre koruma hedefin';
  return 'çalışma düzenini istikrarlı hâle getirme ihtiyacın';
}

export function recommendPackageTerm(input:PackageRecommendationInput):PackageRecommendation{
  const months=clampMonths(input.monthsToGoal);
  const scores:Record<RecommendationTerm,number>={monthly:0,threeMonths:0,sixMonths:0,annual:0};

  if(months<=2){
    scores.monthly+=7;
    scores.threeMonths+=3;
  }else if(months<=4){
    scores.threeMonths+=7;
    scores.monthly+=1;
    scores.sixMonths+=2;
  }else if(months<=8){
    scores.sixMonths+=7;
    scores.threeMonths+=2;
    scores.annual+=1;
  }else if(months<=12){
    scores.annual+=7;
    scores.sixMonths+=3;
  }else{
    scores.annual+=8;
    scores.sixMonths+=1;
  }

  if(input.trackingNeed==='light'){
    scores.monthly+=3;
    scores.threeMonths+=1;
  }else if(input.trackingNeed==='regular'){
    scores.threeMonths+=2;
    scores.sixMonths+=3;
    scores.annual+=1;
  }else{
    scores.threeMonths+=1;
    scores.sixMonths+=3;
    scores.annual+=4;
  }

  if(input.studyRoutine==='starting'){
    scores.monthly+=1;
    scores.threeMonths+=3;
  }else if(input.studyRoutine==='irregular'){
    scores.threeMonths+=3;
    scores.sixMonths+=2;
  }else{
    scores.sixMonths+=3;
    scores.annual+=3;
  }

  const term=TIE_BREAK_ORDER.reduce((best,current)=>scores[current]>scores[best]?current:best,TIE_BREAK_ORDER[0]);
  const reasons=[
    `Sınava veya hedef döneme ${months} ay kalması`,
    `${trackingLabel(input.trackingNeed)} ihtiyacın`,
    routineLabel(input.studyRoutine)
  ];

  return {
    term,
    title:TERM_TITLES[term],
    explanation:`Sınava/hedefine ${months} ay kaldığı, ${trackingLabel(input.trackingNeed)} ihtiyacın olduğu ve ${routineLabel(input.studyRoutine)} için.`,
    reasons,
    score:scores[term]
  };
}
