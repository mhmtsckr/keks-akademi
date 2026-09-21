import { TENDENCY_PROFILES } from '@/lib/screeningForms';

export type Answer = { questionId: string; value: number };
export type Question = { id: string; dimension: string; reverse: boolean; kind?: 'TENDENCY'|'HABIT'; tendencyKey?: string; orderNo?: number; prompt?: string };

export function scoreAssessment(questions: Question[], answers: Answer[]) {
  const answerMap = new Map(answers.map(a => [a.questionId, a.value]));
  const buckets = new Map<string, number[]>();
  for (const q of questions) {
    if (q.kind === 'HABIT') continue;
    const raw = answerMap.get(q.id);
    if (raw == null) continue;
    const value = q.reverse ? 6 - raw : raw;
    const arr = buckets.get(q.dimension) ?? [];
    arr.push(value);
    buckets.set(q.dimension, arr);
  }
  return Object.fromEntries([...buckets.entries()].map(([dimension, values]) => [dimension, Number((values.reduce((a,b)=>a+b,0)/values.length).toFixed(2))]));
}

function tendencyKey(name:string){
  return name.match(/Tip\s+(\d)/i)?.[1]||'';
}

export function buildReport(scores: Record<string, number>, questions:Question[]=[], answers:Answer[]=[] ) {
  const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);
  const first=sorted[0]?.[1]??0,second=sorted[1]?.[1]??0,diff=Number((first-second).toFixed(2));
  const clarity=diff>=0.5?'BELİRGİN EĞİLİM':diff>=0.25?'ORTA AYRIŞMA':'KARIŞIK / YAKIN PROFİL';
  const answerMap=new Map(answers.map(a=>[a.questionId,a.value]));
  const habitSignals=questions.filter(q=>q.kind==='HABIT').map(q=>({
    orderNo:q.orderNo,
    prompt:q.prompt,
    response:answerMap.get(q.id)??null,
    interpretedScore:answerMap.has(q.id)?(q.reverse?6-Number(answerMap.get(q.id)):Number(answerMap.get(q.id))):null
  }));
  const values=answers.map(a=>a.value).filter(v=>Number.isFinite(v));
  const freq=new Map<number,number>(); for(const v of values)freq.set(v,(freq.get(v)||0)+1);
  const mean=values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
  const maxSame=values.length?Math.max(...freq.values())/values.length:0;
  const variance=values.length?values.reduce((s,v)=>s+Math.pow(v-mean,2),0)/values.length:0;
  const qualityWarnings:string[]=[];
  if(maxSame>=0.8)qualityWarnings.push('Yanıtların çok büyük bölümü aynı seçenekte yoğunlaşıyor; görüşmede yanıt kalitesi kontrol edilmelidir.');
  if(variance<0.15&&values.length>20)qualityWarnings.push('Yanıt çeşitliliği çok düşük; sonuçlar tek başına karar amacıyla kullanılmamalıdır.');
  const leadingDimensions=sorted.slice(0,3).map(([name,score])=>{
    const key=tendencyKey(name); const profile=TENDENCY_PROFILES[key];
    return {key,name,score,profile:profile?{name:profile.name,motivation:profile.motivation,strengths:profile.strengths,risks:profile.risks,tasks:profile.tasks,plan:profile.plan}:null};
  });
  const developmentFocus=leadingDimensions.flatMap(x=>x.profile?[x.profile.risks,x.profile.plan]:[]);
  return {
    title: 'KEKS – Eğitsel Çalışma ve Öz-Düzenleme Eğilimleri Taraması',
    disclaimer: 'Bu uygulama psikolojik tanı koymaz ve kesin kişilik tipi belirlemez. Sonuçlar görüşme, gözlem ve akademik performans verileriyle birlikte değerlendirilmelidir.',
    scores,
    leadingDimensions,
    dominance:{difference:diff,clarity},
    responseQuality:{sameAnswerRatio:Number(maxSame.toFixed(2)),variance:Number(variance.toFixed(2)),warnings:qualityWarnings,needsReview:qualityWarnings.length>0},
    habitSignals,
    developmentFocus,
    recommendedLearningMethods:['Aktif hatırlama','Aralıklı tekrar','Uygulama testi / soru çözümü','Yanlış analizi','Kapalı kaynak anlatım'],
    generatedAt: new Date().toISOString()
  };
}
