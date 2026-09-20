export function evaluateTaskSubmission(input:{totalQuestions:number;correct:number;wrong:number;blank:number;targetValue:number;late:boolean}){
  const {totalQuestions,correct,wrong,blank,targetValue,late}=input;
  const net=Number((correct-wrong/4).toFixed(2));
  const accuracy=totalQuestions?Number((correct/totalQuestions*100).toFixed(1)):0;
  const completionRate=targetValue>0?Number((Math.min(totalQuestions/targetValue,1)*100).toFixed(1)):100;
  const flags:string[]=[];
  if(accuracy<50)flags.push('Doğruluk %50 altında');
  if(blank/Math.max(1,totalQuestions)>=0.15)flags.push('Boş oranı yüksek');
  if(completionRate<80)flags.push('Görev hedefinin %80 altında');
  if(late)flags.push('23.00 sonrası geç giriş');
  let level='İYİ';
  if(accuracy<50||completionRate<70)level='MÜDAHALE GEREKLİ';
  else if(accuracy<70||completionRate<90)level='İZLEM';
  const summary=level==='İYİ'
    ? 'Görev tamamlama ve doğruluk düzeyi yeterli.'
    : level==='İZLEM'
      ? 'Performans izlenmeli; yanlış/boş analizi ve kısa tekrar önerilir.'
      : 'Koç müdahalesi önerilir; görev hacmi, konu eksikleri ve hata nedenleri yeniden değerlendirilmelidir.';
  return {net,accuracy,completionRate,flags,level,summary,late};
}

export const INTERVIEW_DIMENSIONS=[
  'Süreklilik','Erteleme','Aktif Hatırlama','Tekrar','Soru Çözme','Sınav Stratejisi','Odak','Koçluk İhtiyacı'
] as const;

export function scoreInterview(questions:Array<{id:string;dimension:string;reverse:boolean}>,answers:Record<string,unknown>){
  const buckets=new Map<string,number[]>();
  for(const q of questions){
    const raw=Number(answers[q.id]);
    if(!Number.isFinite(raw))continue;
    const v=q.reverse?6-raw:raw;
    const arr=buckets.get(q.dimension)||[];arr.push(v);buckets.set(q.dimension,arr);
  }
  const scores:Record<string,number>={};
  for(const d of INTERVIEW_DIMENSIONS){
    const a=buckets.get(d)||[];
    scores[d]=a.length?Number((a.reduce((x,y)=>x+y,0)/a.length).toFixed(2)):0;
  }
  return scores;
}

const TRACK_SUBJECTS:Record<string,string[]>={
  SAYISAL:['Matematik','Fizik','Kimya','Biyoloji','Türkçe'],
  ESIT_AGIRLIK:['Matematik','Türk Dili ve Edebiyatı','Tarih-1','Coğrafya-1','Türkçe'],
  SOZEL:['Türk Dili ve Edebiyatı','Tarih','Coğrafya','Felsefe Grubu','Türkçe']
};

export function buildInterviewReport(scores:Record<string,number>,track:string){
  const sorted=Object.entries(scores).sort((a,b)=>a[1]-b[1]);
  const weakest=sorted.slice(0,3);
  const strongest=[...sorted].reverse().slice(0,2);
  const recommendations:string[]=[];
  for(const [d,s] of weakest){
    if(d==='Süreklilik')recommendations.push('Günlük minimum görev ve zincir takibi uygulanmalı.');
    if(d==='Erteleme')recommendations.push('Görevler 15–25 dakikalık başlangıç bloklarına bölünmeli.');
    if(d==='Aktif Hatırlama')recommendations.push('Her konu sonrasında kapalı kitap aktif hatırlama yapılmalı.');
    if(d==='Tekrar')recommendations.push('0–1–3–7–14–28 gün tekrar döngüsü kullanılmalı.');
    if(d==='Soru Çözme')recommendations.push('Her çalışma bloğu konuya özgü soru setiyle kapatılmalı.');
    if(d==='Sınav Stratejisi')recommendations.push('Haftalık süreli mini deneme ve hata türü analizi eklenmeli.');
    if(d==='Odak')recommendations.push('Pomodoro/odak blokları ve dikkat dağıtıcı kontrolü uygulanmalı.');
    if(d==='Koçluk İhtiyacı')recommendations.push('Koç kontrol sıklığı artırılmalı; kısa ara kontrol noktaları kullanılmalı.');
  }
  return {
    academicTrack:track,
    weakest:weakest.map(([dimension,score])=>({dimension,score})),
    strongest:strongest.map(([dimension,score])=>({dimension,score})),
    recommendations
  };
}

export function buildTrackPlans(track:string,scores:Record<string,number>,start=new Date()){
  const subjects=TRACK_SUBJECTS[track]||TRACK_SUBJECTS.SAYISAL;
  const weak=Object.entries(scores).sort((a,b)=>a[1]-b[1]).slice(0,3).map(x=>x[0]);
  const daily:any[]=[];
  for(let i=0;i<7;i++){
    const d=new Date(start);d.setDate(d.getDate()+i);
    const subject=subjects[i%subjects.length];
    const support=weak[i%Math.max(1,weak.length)]||'Süreklilik';
    const baseQuestions=track==='SAYISAL'?35:track==='ESIT_AGIRLIK'?30:25;
    daily.push({
      date:d.toISOString(),
      subject,
      title:subject+' günlük çalışma',
      questions:baseQuestions,
      durationMinutes:scores['Odak']&&scores['Odak']<3?50:70,
      method:support==='Aktif Hatırlama'?'Aktif hatırlama + soru':support==='Tekrar'?'Kısa tekrar + soru':'Konu çalışması + soru',
      supportDimension:support
    });
  }
  const weekly={
    title:'Alan Odaklı Haftalık Plan',
    track,
    goals:[
      subjects.slice(0,4).map(s=>s+' için en az 2 çalışma bloğu').join('; '),
      '1 süreli deneme + yanlış analizi',
      '0–1–3–7 tekrar döngüsüne göre tekrar'
    ],
    days:daily
  };
  const monthly={
    title:'Alan Odaklı Aylık Plan',
    track,
    weeks:[
      '1. hafta: temel eksiklerin tespiti ve düzen kurma',
      '2. hafta: soru hacmini artırma ve aktif hatırlama',
      '3. hafta: süreli uygulama ve deneme stratejisi',
      '4. hafta: karma deneme, yanlış analizi ve aylık değerlendirme'
    ],
    review:'Ay sonunda net, doğruluk, görev tamamlama ve odak süresi birlikte değerlendirilir.'
  };
  return {daily,weekly,monthly};
}
