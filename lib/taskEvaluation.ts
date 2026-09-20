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

export const PROGRAM_DIMENSIONS=[
  'Başlama ve Süreklilik',
  'Görev Yapısı ve Planlama',
  'Motivasyon ve Pekiştirme',
  'Odak ve Çalışma Ortamı',
  'Aktif Hatırlama ve Tekrar',
  'Soru Çözme ve Hata Analizi',
  'Sınav ve Zaman Yönetimi',
  'Koçluk Bağımsızlığı'
] as const;

export type EducationBand=
  | 'ILKOKUL_1_2'
  | 'ILKOKUL_3_4'
  | 'ORTAOKUL_5_6'
  | 'ORTAOKUL_7_8'
  | 'LISE_9_10'
  | 'LISE_11_12'
  | 'YETISKIN_MEZUN'
  | 'GENERAL';

export function detectEducationBand(gradeLevel?:string|null):EducationBand{
  const raw=(gradeLevel||'').toLocaleUpperCase('tr-TR').replace(/\s+/g,' ');
  if(/MEZUN|YETİŞKİN|YETISKIN|KPSS|DGS|ALES/.test(raw))return 'YETISKIN_MEZUN';
  if(/LGS/.test(raw))return 'ORTAOKUL_7_8';
  if(/YKS|TYT|AYT/.test(raw)&&!/9|10/.test(raw))return 'LISE_11_12';
  const n=Number((raw.match(/(?:^|\D)(1[0-2]|[1-9])(?:\D|$)/)||[])[1]);
  if(n===1||n===2)return 'ILKOKUL_1_2';
  if(n===3||n===4)return 'ILKOKUL_3_4';
  if(n===5||n===6)return 'ORTAOKUL_5_6';
  if(n===7||n===8)return 'ORTAOKUL_7_8';
  if(n===9||n===10)return 'LISE_9_10';
  if(n===11||n===12)return 'LISE_11_12';
  if(/İLKOKUL|ILKOKUL/.test(raw))return 'ILKOKUL_3_4';
  if(/ORTAOKUL/.test(raw))return 'ORTAOKUL_7_8';
  if(/LİSE|LISE/.test(raw))return 'LISE_11_12';
  return 'GENERAL';
}

export function scoreInterview(questions:Array<{id:string;dimension:string;reverse:boolean}>,answers:Record<string,unknown>){
  const buckets=new Map<string,number[]>();
  for(const q of questions){
    const raw=Number(answers[q.id]);
    if(!Number.isFinite(raw))continue;
    const v=q.reverse?6-raw:raw;
    const arr=buckets.get(q.dimension)||[];
    arr.push(v);buckets.set(q.dimension,arr);
  }
  const dimensions=new Set<string>([...PROGRAM_DIMENSIONS,...questions.map(q=>q.dimension)]);
  const scores:Record<string,number>={};
  for(const d of dimensions){
    const a=buckets.get(d)||[];
    if(a.length)scores[d]=Number((a.reduce((x,y)=>x+y,0)/a.length).toFixed(2));
  }
  return scores;
}

function assessmentMotivationSupports(raw:unknown){
  if(!raw||typeof raw!=='object')return [] as string[];
  const entries=Object.entries(raw as Record<string,unknown>)
    .map(([k,v])=>[k,Number(v)] as const)
    .filter(([,v])=>Number.isFinite(v))
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3);
  const supports:string[]=[];
  for(const [key] of entries){
    const k=key.toLocaleLowerCase('tr-TR');
    if(/tip\s*1|ilke|düzen|standart/.test(k))supports.push('Net ölçütler, kontrol listesi ve kalite standardı kullan.');
    else if(/tip\s*2|yardım|ilişki/.test(k))supports.push('Kısa koç geri bildirimi ve destekleyici sosyal pekiştirme kullan.');
    else if(/tip\s*3|başarı|sonuç|hedef/.test(k))supports.push('Görünür hedef, puan ve ilerleme göstergeleri kullan.');
    else if(/tip\s*4|anlam|özgün|kimlik/.test(k))supports.push('Görevin kişisel anlamını ve seçim hakkını görünür kıl.');
    else if(/tip\s*5|bilgi|yetkin|uzman/.test(k))supports.push('Derin öğrenme için kesintisiz odak blokları ve ön hazırlık ver.');
    else if(/tip\s*6|güven|hazırlık/.test(k))supports.push('Önceden belli rutin, net beklenti ve yedek plan kullan.');
    else if(/tip\s*7|çeşit|yenilik/.test(k))supports.push('Görevlerde çeşitlilik, kısa bloklar ve dönüşümlü ders kullan.');
    else if(/tip\s*8|kontrol|güç/.test(k))supports.push('Seçenek, meydan okuma ve öğrenciye kontrol alanı ver.');
    else if(/tip\s*9|uyum|sakin/.test(k))supports.push('Düşük baskılı başlangıç, yumuşak geçiş ve küçük ilk görev kullan.');
  }
  return [...new Set(supports)];
}

export function buildInterviewReport(scores:Record<string,number>,track:string,assessmentScores?:unknown,educationBand:EducationBand='GENERAL'){
  const sorted=Object.entries(scores).sort((a,b)=>a[1]-b[1]);
  const weakest=sorted.slice(0,3);
  const strongest=[...sorted].reverse().slice(0,2);
  const recommendations:string[]=[];
  for(const [d] of weakest){
    if(d==='Başlama ve Süreklilik')recommendations.push('Günlük görevleri küçük başlangıç adımlarına böl; ilk blok 15–25 dakika olsun ve görev zinciri görünür tutulsun.');
    if(d==='Görev Yapısı ve Planlama')recommendations.push('Her görevde ders, konu, soru/adım hedefi ve bitiş ölçütünü açık yaz; aynı gün en fazla 3 ana hedef kullan.');
    if(d==='Motivasyon ve Pekiştirme')recommendations.push('Kısa dönem hedef, görünür ilerleme ve öğrenciye uygun pekiştirme kullan; uzun hedefleri haftalık kilometre taşlarına böl.');
    if(d==='Odak ve Çalışma Ortamı')recommendations.push('Dikkat dağıtıcıları azalt; kısa odak bloklarıyla başla ve gerçek odak süresine göre blokları kademeli artır.');
    if(d==='Aktif Hatırlama ve Tekrar')recommendations.push('Kapalı kitap aktif hatırlama ile 0–1–3–7–14–28 tekrar döngüsünü programa zorunlu bileşen olarak ekle.');
    if(d==='Soru Çözme ve Hata Analizi')recommendations.push('Her konu bloğunu soru setiyle kapat; yanlış ve boşları neden koduyla inceleyip tekrar kuyruğuna ekle.');
    if(d==='Sınav ve Zaman Yönetimi')recommendations.push('Süreli mini denemelerle başlayıp sınav grubuna göre deneme sıklığını kademeli artır; süre ve sıra stratejisini ayrıca izle.');
    if(d==='Koçluk Bağımsızlığı')recommendations.push('İlk haftalarda daha sık kısa koç kontrolü uygula; görev tamamlama istikrarı arttıkça kontrol sıklığını azalt.');
  }
  const motivationSupports=assessmentMotivationSupports(assessmentScores);
  const blockMinutes=(scores['Odak ve Çalışma Ortamı']||3)<2.5?25:(scores['Odak ve Çalışma Ortamı']||3)<3.5?40:55;
  const checkIn=(scores['Koçluk Bağımsızlığı']||3)<2.5?'GÜNLÜK':(scores['Koçluk Bağımsızlığı']||3)<3.5?'HAFTADA_2':'HAFTALIK';
  const taskSize=(scores['Başlama ve Süreklilik']||3)<2.5?'KÜÇÜK':(scores['Başlama ve Süreklilik']||3)<3.5?'ORTA':'NORMAL';
  return {
    academicTrack:track,
    educationBand,
    weakest:weakest.map(([dimension,score])=>({dimension,score})),
    strongest:strongest.map(([dimension,score])=>({dimension,score})),
    recommendations,
    motivationSupports,
    programParameters:{
      focusBlockMinutes:blockMinutes,
      coachCheckIn:checkIn,
      taskSize,
      spacedReview:(scores['Aktif Hatırlama ve Tekrar']||3)<3.5,
      explicitTaskStructure:(scores['Görev Yapısı ve Planlama']||3)<3.5,
      progressReinforcement:(scores['Motivasyon ve Pekiştirme']||3)<3.5,
      timedPractice:(scores['Sınav ve Zaman Yönetimi']||3)<3.5
    }
  };
}

const TRACK_SUBJECTS:Record<string,string[]>={
  SAYISAL:['Matematik','Fizik','Kimya','Biyoloji','Türkçe'],
  ESIT_AGIRLIK:['Matematik','Türk Dili ve Edebiyatı','Tarih-1','Coğrafya-1','Türkçe'],
  SOZEL:['Türk Dili ve Edebiyatı','Tarih','Coğrafya','Felsefe Grubu','Türkçe'],
  GENERAL:['Türkçe','Matematik','Fen','Sosyal']
};

function bandConfig(band:EducationBand,track:string){
  if(band==='ILKOKUL_1_2')return {subjects:['Okuma','Türkçe','Matematik','Hayat Bilgisi'],questions:8,minutes:20};
  if(band==='ILKOKUL_3_4')return {subjects:['Türkçe','Matematik','Fen Bilimleri','Sosyal Bilgiler'],questions:15,minutes:30};
  if(band==='ORTAOKUL_5_6')return {subjects:['Türkçe','Matematik','Fen Bilimleri','Sosyal Bilgiler','İngilizce'],questions:25,minutes:45};
  if(band==='ORTAOKUL_7_8')return {subjects:['Türkçe','Matematik','Fen Bilimleri','T.C. İnkılap Tarihi','Din Kültürü','İngilizce'],questions:35,minutes:60};
  if(band==='LISE_9_10')return {subjects:['Türk Dili ve Edebiyatı','Matematik','Fizik','Kimya','Biyoloji','Tarih','Coğrafya'],questions:30,minutes:65};
  if(band==='LISE_11_12')return {subjects:TRACK_SUBJECTS[track]||TRACK_SUBJECTS.GENERAL,questions:40,minutes:75};
  if(band==='YETISKIN_MEZUN')return {subjects:TRACK_SUBJECTS[track]||TRACK_SUBJECTS.GENERAL,questions:45,minutes:80};
  return {subjects:TRACK_SUBJECTS[track]||TRACK_SUBJECTS.GENERAL,questions:30,minutes:60};
}

export function buildTrackPlans(track:string,scores:Record<string,number>,start=new Date(),educationBand:EducationBand='GENERAL',assessmentScores?:unknown){
  const config=bandConfig(educationBand,track);
  const weak=Object.entries(scores).sort((a,b)=>a[1]-b[1]).slice(0,3).map(x=>x[0]);
  const report=buildInterviewReport(scores,track,assessmentScores,educationBand);
  const p=report.programParameters;
  const daily:any[]=[];
  for(let i=0;i<28;i++){
    const d=new Date(start);d.setDate(d.getDate()+i);
    const subject=config.subjects[i%config.subjects.length];
    const support=weak[i%Math.max(1,weak.length)]||'Başlama ve Süreklilik';
    const ramp=i<7?0.85:i<14?0.95:i<21?1:1.1;
    const sizeFactor=p.taskSize==='KÜÇÜK'?0.75:p.taskSize==='ORTA'?0.9:1;
    const questions=Math.max(5,Math.round(config.questions*ramp*sizeFactor));
    const durationMinutes=Math.min(config.minutes,Math.max(15,p.focusBlockMinutes));
    let method='Konu çalışması + soru';
    if(support==='Aktif Hatırlama ve Tekrar')method='Aktif hatırlama + aralıklı tekrar + soru';
    else if(support==='Soru Çözme ve Hata Analizi')method='Konuya özgü soru + yanlış nedeni analizi';
    else if(support==='Odak ve Çalışma Ortamı')method=durationMinutes+' dk kesintisiz odak + kısa kapanış';
    else if(support==='Başlama ve Süreklilik')method='5 dakikalık başlatma adımı + ana çalışma bloğu';
    else if(support==='Görev Yapısı ve Planlama')method='Net bitiş ölçütlü görev + kontrol listesi';
    else if(support==='Motivasyon ve Pekiştirme')method='Görünür hedef + tamamlanınca kısa pekiştirme';
    else if(support==='Sınav ve Zaman Yönetimi')method='Süreli mini uygulama + hız/doğruluk kontrolü';
    else if(support==='Koçluk Bağımsızlığı')method='Görev öncesi kısa plan + görev sonrası öz değerlendirme';
    daily.push({
      date:d.toISOString(),
      subject,
      title:subject+' günlük çalışma',
      questions,
      durationMinutes,
      method,
      supportDimension:support
    });
  }
  const weekly={
    title:'Kişisel Haftalık Çalışma Planı',
    track,
    educationBand,
    programParameters:p,
    motivationSupports:report.motivationSupports,
    goals:[
      'Haftanın ana derslerinde düzenli çalışma bloğu',
      educationBand==='ILKOKUL_1_2'||educationBand==='ILKOKUL_3_4'?'Haftalık kısa gelişim kontrolü':'Haftada en az 1 süreli uygulama/deneme ve yanlış analizi',
      '0–1–3–7–14–28 tekrar döngüsüne göre tekrar'
    ],
    weeks:[0,1,2,3].map(w=>({week:w+1,days:daily.slice(w*7,w*7+7)}))
  };
  const monthly={
    title:'Kişisel Aylık Çalışma Planı',
    track,
    educationBand,
    programParameters:p,
    motivationSupports:report.motivationSupports,
    weeks:[
      '1. hafta: düzen kurma, gerçek çalışma kapasitesini ölçme',
      '2. hafta: güçlü rutini koruyup zayıf program boyutuna müdahale',
      '3. hafta: soru/uygulama hacmini ve bağımsız çalışmayı artırma',
      '4. hafta: karma uygulama, hata analizi ve aylık değerlendirme'
    ],
    review:'Ay sonunda görev tamamlama, doğruluk, gerçek odak süresi, tekrar devamlılığı ve koç müdahale ihtiyacı birlikte değerlendirilir.'
  };
  return {daily,weekly,monthly,report};
}
