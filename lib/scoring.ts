import { SCREENING_DISCLAIMER,TENDENCY_DIMENSION_KEYS,TENDENCY_PROFILES } from '@/lib/screeningForms';

export type Answer = { questionId: string; value: number };
export type Question = {
  id: string;
  dimension: string;
  reverse: boolean;
  kind?: 'TENDENCY'|'HABIT';
  tendencyKey?: string;
  habitKey?: string;
  orderNo?: number;
  prompt?: string
};

const HABIT_RECOMMENDATIONS:Record<string,string>={
  'Planlama ve Başlama':'Çalışma öncesinde ders, konu, süre ve bitiş ölçütünü belirle; başlamak zor gelirse ilk adımı 5 dakikalık küçük bir görev hâline getir.',
  'Odak ve Dikkat Yönetimi':'Telefon ve bildirimleri çalışma alanından çıkar; tek görevli odak blokları kullan ve blok bitmeden konu değiştirme.',
  'Süreklilik ve Erteleme Yönetimi':'Yoğun günler için uygulanabilir bir minimum çalışma hedefi belirle ve zinciri korumaya odaklan.',
  'Aktif Hatırlama ve Öğrenme Stratejisi':'Kaynağı kapatıp bilgiyi geri çağır, kendi cümlelerinle anlat ve çözümü görmeden önce bağımsız düşünme süresi kullan.',
  'Tekrar ve Kalıcılık':'Öğrenilen konuları farklı günlerde 0-1-3-7-14-28 tekrar döngüsüne bağla.',
  'Hata Analizi ve Sınav Stratejisi':'Yanlış sorularda hata nedenini sınıflandır; bilgi, dikkat, işlem, süre veya strateji kaynağını belirleyip tekrar planına ekle.'
};

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
  return Object.fromEntries([...buckets.entries()].map(([dimension, values]) => [
    dimension,
    Number((values.reduce((a,b)=>a+b,0)/values.length).toFixed(2))
  ]));
}

function tendencyKey(name:string){
  return TENDENCY_DIMENSION_KEYS[name]||name.match(/Tip\s+(\d)/i)?.[1]||'';
}

export function buildReport(scores: Record<string, number>, questions:Question[]=[], answers:Answer[]=[] ) {
  const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);
  const first=sorted[0]?.[1]??0,second=sorted[1]?.[1]??0,diff=Number((first-second).toFixed(2));
  const clarity=diff>=0.5?'BELİRGİN EĞİLİM':diff>=0.25?'ORTA AYRIŞMA':'KARIŞIK / YAKIN PROFİL';
  const answerMap=new Map(answers.map(a=>[a.questionId,a.value]));
  const habitSignals=questions.filter(q=>q.kind==='HABIT').map(q=>{
    const response=answerMap.get(q.id);
    return {
      key:q.habitKey||q.dimension.replace(/^Çalışma Alışkanlığı —\s*/,''),
      orderNo:q.orderNo,
      prompt:q.prompt,
      response:response??null,
      interpretedScore:response==null?null:(q.reverse?6-response:response)
    };
  });
  const habitBuckets=new Map<string,number[]>();
  for(const signal of habitSignals){
    if(signal.interpretedScore==null)continue;
    const values=habitBuckets.get(signal.key)||[];
    values.push(Number(signal.interpretedScore));
    habitBuckets.set(signal.key,values);
  }
  const habitScores=Object.fromEntries([...habitBuckets.entries()].map(([key,values])=>[
    key,
    Number((values.reduce((a,b)=>a+b,0)/values.length).toFixed(2))
  ]));
  const habitValues=Object.values(habitScores).filter(v=>Number.isFinite(v));
  const habitAverage=habitValues.length?Number((habitValues.reduce((a,b)=>a+b,0)/habitValues.length).toFixed(2)):null;
  const habitDevelopment=Object.entries(habitScores)
    .sort((a,b)=>a[1]-b[1])
    .map(([name,score])=>({
      name,
      score,
      level:score<=2?'ÖNCELİKLİ GELİŞİM':score===3?'İZLEM':'GÜÇLÜ / KORUNACAK',
      recommendation:HABIT_RECOMMENDATIONS[name]||''
    }));
  const priorityHabits=habitDevelopment.filter(x=>x.score<=3);
  const strongHabits=habitDevelopment.filter(x=>x.score>=4);

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
  const developmentFocus=[
    ...leadingDimensions.flatMap(x=>x.profile?[x.profile.risks,x.profile.plan]:[]),
    ...priorityHabits.map(x=>x.name+': '+x.recommendation)
  ];
  const developmentSummary={
    priorityHabits:priorityHabits.map(x=>x.name),
    strongHabits:strongHabits.map(x=>x.name),
    immediateActions:priorityHabits.slice(0,5).map(x=>x.recommendation),
    coachFocus:priorityHabits.slice(0,4).map(x=>x.name),
    reviewAfterDays:28
  };

  return {
    title: 'KEKS – Eğitsel Çalışma ve Öz-Düzenleme Eğilimleri Taraması',
    disclaimer: SCREENING_DISCLAIMER,
    validationStatus:'EDUCATIONAL_SCREENING',
    interpretationRule:'Sonuçlar tek başına tanı, kesin kişilik tipi, başarı/başarısızlık veya yüksek risk etiketi üretmez.',
    formSource:'KEKS Profesyonel Test Serisi · eğitim düzeyine özgü işaretlemeli başlangıç formu',
    scores,
    leadingDimensions,
    dominance:{difference:diff,clarity},
    responseQuality:{sameAnswerRatio:Number(maxSame.toFixed(2)),variance:Number(variance.toFixed(2)),warnings:qualityWarnings,needsReview:qualityWarnings.length>0},
    habitScores,
    habitAverage,
    habitSignals,
    habitDevelopment,
    developmentSummary,
    developmentFocus,
    recommendedLearningMethods:['Aktif hatırlama','Aralıklı tekrar','Uygulama testi / soru çözümü','Yanlış analizi','Kapalı kaynak anlatım'],
    generatedAt: new Date().toISOString()
  };
}
