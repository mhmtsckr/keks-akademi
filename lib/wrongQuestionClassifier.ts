import { EXAM_CATALOG } from '@/lib/examCatalog';

type Candidate={topic:string;signals:string[]};

const EXTRA:Record<string,Candidate[]>={
  'Matematik':[
    {topic:'Temel Kavramlar',signals:['temel kavram','tek çift','pozitif negatif','ardışık','asal']},
    {topic:'Bölme ve Bölünebilme',signals:['bölünebil','kalan','tam böl','ebob','ekok','obeb','okek']},
    {topic:'Rasyonel Sayılar',signals:['rasyonel','kesir','payda','pay']},
    {topic:'Üslü ve Köklü Sayılar',signals:['üslü','üs','kök','karekö','radikal']},
    {topic:'Denklem ve Eşitsizlik',signals:['denklem','eşitsiz','bilinmeyen','x kaç']},
    {topic:'Problemler',signals:['problem','yaş','işçi','havuz','hız','hareket','karışım','yüzde','kâr','zarar']},
    {topic:'Fonksiyon',signals:['fonksiyon','f(x)','g(x)','tanım kümesi','değer kümesi']},
    {topic:'Olasılık ve Sayma',signals:['olasılık','permütasyon','kombinasyon','kaç farklı','seçim']},
    {topic:'Geometri',signals:['üçgen','çember','daire','açı','dörtgen','çokgen','alan','hacim']}
  ],
  'Tarih':[
    {topic:'İlk Türk Devletleri ve Türk-İslam Tarihi',signals:['hun','göktürk','uygur','karahanlı','gazneli','selçuklu','türk islam']},
    {topic:'Osmanlı Tarihi',signals:['osmanlı','padişah','tanzimat','ıslahat','meşrutiyet','divan','tımar','kapıkulu']},
    {topic:'Millî Mücadele',signals:['milli mücadele','millî mücadele','kongre','amasya','erzurum','sivas','misak','tbmm','kurtuluş']},
    {topic:'Atatürk İlke ve İnkılapları',signals:['atatürk','inkılap','inkilap','cumhuriyetçilik','halkçılık','laiklik','devrim']},
    {topic:'Çağdaş Türk ve Dünya Tarihi',signals:['soğuk savaş','nato','birleşmiş milletler','kıbrıs','2. dünya','ikinci dünya']}
  ],
  'Coğrafya':[
    {topic:'Harita Bilgisi',signals:['harita','ölçek','izohips','koordinat','enlem','boylam']},
    {topic:'İklim Bilgisi',signals:['iklim','sıcaklık','yağış','basınç','rüzgar','nem']},
    {topic:'Yer Şekilleri',signals:['akarsu','delta','plato','ova','dağ','erozyon','karst','buzul']},
    {topic:'Nüfus ve Yerleşme',signals:['nüfus','göç','yerleşme','şehir','kırsal','demografi']},
    {topic:'Türkiye Coğrafyası',signals:['türkiye','bölge','marmara','ege','akdeniz','karadeniz','anadolu']},
    {topic:'Ekonomik Faaliyetler',signals:['tarım','sanayi','madencilik','enerji','turizm','ulaşım','ticaret']}
  ],
  'Eğitim Bilimleri':[
    {topic:'Gelişim Psikolojisi',signals:['gelişim','piaget','erikson','kohlberg','kritik dönem','hazırbulunuşluk']},
    {topic:'Öğrenme Psikolojisi',signals:['öğrenme','koşullanma','pekiştirme','ceza','bandura','pavlov','skinner','thorndike']},
    {topic:'Öğretim İlke ve Yöntemleri',signals:['öğretim','yöntem','teknik','strateji','buluş','sunuş','işbirlikli','tam öğrenme']},
    {topic:'Program Geliştirme',signals:['program','kazanım','hedef','içerik','eğitim durumu','değerlendirme','tyler','taba']},
    {topic:'Ölçme ve Değerlendirme',signals:['ölçme','geçerlik','güvenirlik','standart sapma','varyans','madde güçlük','korelasyon']},
    {topic:'Rehberlik ve Özel Eğitim',signals:['rehberlik','psikolojik danışma','oryantasyon','bireyi tanıma','özel eğitim','kaynaştırma']},
    {topic:'Sınıf Yönetimi',signals:['sınıf yönetimi','istenmeyen davranış','disiplin','kural','sınıf iklimi']}
  ],
  'Mevzuat':[
    {topic:'Millî Eğitim Temel İlkeleri',signals:['milli eğitim','millî eğitim','temel ilke','genellik','eşitlik','yöneltme','fırsat']},
    {topic:'Öğretmenlik Mesleği ve Personel',signals:['öğretmenlik','öğretmen','adaylık','kariyer','personel','memur','atama']},
    {topic:'Eğitim Yönetimi ve Kurumsal Yapı',signals:['bakanlık','müdürlük','kurul','görev','yetki','teşkilat','ilçe','il milli']},
    {topic:'Hak, Sorumluluk ve Disiplin',signals:['disiplin','izin','hak','sorumluluk','ceza','yasak','ödev']}
  ],
  'Türkçe':[
    {topic:'Paragraf',signals:['paragraf','ana düşünce','yardımcı düşünce','çıkarılamaz','değinilmemiş','anlatım']},
    {topic:'Sözcükte ve Cümlede Anlam',signals:['sözcükte anlam','cümlede anlam','yakın anlam','mecaz','çıkarım']},
    {topic:'Dil Bilgisi',signals:['fiilimsi','sözcük tür','öge','fiil','çatı','ses bilgisi','yapım eki','çekim eki']},
    {topic:'Yazım ve Noktalama',signals:['yazım','noktalama','virgül','kesme','büyük harf']}
  ],
  'Türk Dili ve Edebiyatı':[
    {topic:'Şiir Bilgisi',signals:['şiir','ölçü','uyak','kafiye','redif','nazım']},
    {topic:'Halk Edebiyatı',signals:['halk edebiyat','koşma','semai','mani','aşık','âşık']},
    {topic:'Divan Edebiyatı',signals:['divan','gazel','kaside','mesnevi','aruz']},
    {topic:'Tanzimat ve Servetifünun',signals:['tanzimat','servetifünun','servet-i fünun','fecriati']},
    {topic:'Millî Edebiyat ve Cumhuriyet',signals:['milli edebiyat','millî edebiyat','cumhuriyet dönemi','garip','ikinci yeni']}
  ]
};

function normalize(v:string){
  return v.toLocaleLowerCase('tr-TR')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9çğıöşü\s]/gi,' ')
    .replace(/\s+/g,' ').trim();
}

function catalogCandidates(examType:string,subject:string):Candidate[]{
  const catalog=(EXAM_CATALOG as any)[examType];
  const topics=(catalog&&catalog[subject])||[];
  return topics.map((topic:string)=>({
    topic,
    signals:normalize(topic).split(' ').filter(x=>x.length>2)
  }));
}

export function classifyWrongQuestion(input:{examType:string;subject:string;text:string}){
  const body=normalize(input.text);
  const candidates=[...catalogCandidates(input.examType,input.subject),...(EXTRA[input.subject]||[])];
  const unique=[...new Map(candidates.map(x=>[x.topic,x])).values()];
  let best:{topic:string;score:number}|null=null;
  for(const c of unique){
    let score=0;
    for(const raw of c.signals){
      const signal=normalize(raw);
      if(!signal)continue;
      if(body.includes(signal))score+=signal.includes(' ')?4:2;
      else{
        const parts=signal.split(' ').filter(x=>x.length>3);
        score+=parts.filter(x=>body.includes(x)).length;
      }
    }
    const topicWords=normalize(c.topic).split(' ').filter(x=>x.length>3);
    score+=topicWords.filter(x=>body.includes(x)).length;
    if(!best||score>best.score)best={topic:c.topic,score};
  }
  if(!best||best.score<=0){
    const fallback=unique[0]?.topic||'Genel / Karma';
    return {topic:fallback,confidence:0.25,method:'SUBJECT_FALLBACK'};
  }
  const confidence=Math.min(0.98,0.45+best.score*0.08);
  return {topic:best.topic,confidence:Number(confidence.toFixed(2)),method:'KEYWORD_CATALOG'};
}
