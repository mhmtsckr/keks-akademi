import {db} from '@/lib/db';
import {EXAM_CATALOG,type ExamType} from '@/lib/examCatalog';

export type ExamMapLeaf={
  examType:string;
  subject:string;
  topic:string;
  subTopic:string;
  acquisition:string;
  questionType:string;
};

type DetailedTopic={
  subTopics:{
    name:string;
    acquisitions:{name:string;questionTypes:string[]}[];
  }[];
};

const DETAILED_MAP:Record<string,DetailedTopic>={
  'TYT|Matematik|Problemler':{
    subTopics:[
      {name:'Yüzde-Kâr-Zarar',acquisitions:[
        {name:'Yüzde artış-azalış ilişkisini problem durumlarında uygular.',questionTypes:['Yüzde değişim','Kâr-zarar','İndirim-zam','Ardışık yüzde değişimi']},
        {name:'Maliyet, satış ve kâr oranı arasındaki ilişkiyi modeller.',questionTypes:['Maliyet-satış','Kâr yüzdesi','Zarar yüzdesi']}
      ]},
      {name:'Hareket Problemleri',acquisitions:[
        {name:'Hız, zaman ve yol ilişkisini problem durumlarında uygular.',questionTypes:['Karşılaşma','Yetişme','Ortalama hız','Hareket grafiği']}
      ]},
      {name:'İşçi-Havuz',acquisitions:[
        {name:'İş yapma hızlarını ortak iş problemlerinde kullanır.',questionTypes:['Birlikte çalışma','İşçi problemi','Havuz dolma-boşalma']}
      ]},
      {name:'Yaş Problemleri',acquisitions:[
        {name:'Yaşlar arasındaki zamana bağlı doğrusal ilişkiyi kurar.',questionTypes:['Geçmiş-gelecek yaş','Yaş farkı','Yaş oranı']}
      ]},
      {name:'Karışım Problemleri',acquisitions:[
        {name:'Karışımlarda miktar ve oran ilişkisini modeller.',questionTypes:['Tuz-su','Saflık oranı','Karışım ekleme-çıkarma']}
      ]},
      {name:'Sayı-Kesir Problemleri',acquisitions:[
        {name:'Sayı ve kesir ilişkilerini problem bağlamında denkleme dönüştürür.',questionTypes:['Sayı problemi','Kesir problemi','Paylaştırma']}
      ]}
    ]
  },
  'TYT|Türkçe|Paragraf':{
    subTopics:[
      {name:'Anlam ve Ana Düşünce',acquisitions:[
        {name:'Paragrafın ana düşüncesini ve yardımcı düşüncelerini belirler.',questionTypes:['Ana düşünce','Yardımcı düşünce','Başlık']}
      ]},
      {name:'Çıkarım ve Yorum',acquisitions:[
        {name:'Metinden açık ve örtük çıkarım yapar.',questionTypes:['Çıkarım','Yorum','Ulaşılamaz yargı']}
      ]},
      {name:'Paragraf Yapısı',acquisitions:[
        {name:'Paragrafın yapısal bütünlüğünü ve cümle ilişkilerini çözümler.',questionTypes:['Cümle sıralama','Paragraf tamamlama','Akışı bozan cümle']}
      ]}
    ]
  },
  'AYT|Biyoloji|Genden Proteine':{
    subTopics:[
      {name:'DNA ve Genetik Bilgi',acquisitions:[
        {name:'DNA’nın yapısı ve genetik bilginin aktarımını açıklar.',questionTypes:['DNA yapısı','Replikasyon','Gen-kromozom ilişkisi']}
      ]},
      {name:'Protein Sentezi',acquisitions:[
        {name:'Transkripsiyon ve translasyon süreçlerini ilişkilendirir.',questionTypes:['Transkripsiyon','Translasyon','Kod-kodon-antikodon']}
      ]}
    ]
  }
};

function norm(v:string){
  return v.toLocaleLowerCase('tr-TR').replace(/[‐‑–—]/g,'-').replace(/s+/g,' ').trim();
}

export function getExamMapTopic(examType:string,subject:string,topic:string):DetailedTopic{
  const detailed=DETAILED_MAP[examType+'|'+subject+'|'+topic];
  if(detailed)return detailed;
  return {
    subTopics:[{
      name:topic,
      acquisitions:[{
        name:topic+' konusundaki temel bilgi ve becerileri uygular.',
        questionTypes:['Genel']
      }]
    }]
  };
}

export function resolveExamMapLeaf(input:{
  examType:string;subject:string;topic:string;
  subTopic?:string|null;acquisition?:string|null;questionType?:string|null;problemType?:string|null;
}):ExamMapLeaf{
  const map=getExamMapTopic(input.examType,input.subject,input.topic);
  const candidate=norm(input.subTopic||input.problemType||'');
  let sub=map.subTopics.find(x=>candidate&&(norm(x.name).includes(candidate)||candidate.includes(norm(x.name))));
  if(!sub&&candidate){
    sub=map.subTopics.find(x=>x.acquisitions.some(a=>a.questionTypes.some(q=>norm(q).includes(candidate)||candidate.includes(norm(q)))));
  }
  sub=sub||map.subTopics[0];

  const qCandidate=norm(input.questionType||input.problemType||'');
  let acq=sub.acquisitions.find(a=>
    (input.acquisition&&norm(a.name)===norm(input.acquisition))||
    (qCandidate&&a.questionTypes.some(q=>norm(q).includes(qCandidate)||qCandidate.includes(norm(q))))
  );
  acq=acq||sub.acquisitions[0];
  const questionType=input.questionType||input.problemType||
    (qCandidate?acq.questionTypes.find(q=>norm(q).includes(qCandidate)||qCandidate.includes(norm(q))):null)||
    acq.questionTypes[0];

  return {
    examType:input.examType,
    subject:input.subject,
    topic:input.topic,
    subTopic:input.subTopic||sub.name,
    acquisition:input.acquisition||acq.name,
    questionType
  };
}

export function examMapForExam(examType:ExamType){
  const catalog=EXAM_CATALOG[examType] as Record<string,readonly string[]>;
  return Object.entries(catalog).map(([subject,topics])=>({
    subject,
    topics:topics.map(topic=>({topic,...getExamMapTopic(examType,subject,topic)}))
  }));
}

type Evidence={
  leaf:ExamMapLeaf;
  correct:number;wrong:number;blank:number;
  durationSeconds:number|null;
  errorReason:string|null;
  source:'PRACTICE'|'EXAM';
};

export function aggregateExamMapEvidence(rows:Evidence[]){
  const map=new Map<string,{
    leaf:ExamMapLeaf;correct:number;wrong:number;blank:number;durations:number[];
    errorReasons:Record<string,number>;sources:Set<string>;
  }>();
  for(const row of rows){
    const k=[row.leaf.examType,row.leaf.subject,row.leaf.topic,row.leaf.subTopic,row.leaf.acquisition,row.leaf.questionType].join('|');
    const x=map.get(k)||{leaf:row.leaf,correct:0,wrong:0,blank:0,durations:[],errorReasons:{},sources:new Set<string>()};
    x.correct+=row.correct;x.wrong+=row.wrong;x.blank+=row.blank;
    if(row.durationSeconds!=null&&row.durationSeconds>0)x.durations.push(row.durationSeconds);
    if(row.errorReason&&row.wrong>0)x.errorReasons[row.errorReason]=(x.errorReasons[row.errorReason]||0)+row.wrong;
    x.sources.add(row.source);
    map.set(k,x);
  }
  return [...map.values()].map(x=>{
    const total=x.correct+x.wrong+x.blank;
    const accuracy=total?Math.round(x.correct/total*100):null;
    const avgSeconds=x.durations.length?Number((x.durations.reduce((a,b)=>a+b,0)/x.durations.length).toFixed(1)):null;
    const primaryError=Object.entries(x.errorReasons).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
    const status=total<5?'VERI_AZ':accuracy!=null&&accuracy<60?'ZAYIF':accuracy!=null&&accuracy<75?'GELISIYOR':'GUCLU';
    return {
      ...x.leaf,total,correct:x.correct,wrong:x.wrong,blank:x.blank,accuracy,avgSeconds,
      primaryError,status,sources:[...x.sources]
    };
  }).sort((a,b)=>{
    const rank=(v:string)=>v==='ZAYIF'?0:v==='GELISIYOR'?1:v==='VERI_AZ'?2:3;
    return rank(a.status)-rank(b.status)||(a.accuracy??101)-(b.accuracy??101)||b.total-a.total;
  });
}

export async function buildStudentExamMap(studentId:string){
  const [practice,logs,examAnalytics]=await Promise.all([
    db.practiceLog.findMany({where:{studentId},orderBy:{date:'desc'},take:500}),
    db.dailyLog.findMany({where:{studentId},orderBy:{date:'desc'},take:1000,select:{payload:true}}),
    db.examAnalyticsRecord.findMany({where:{studentId},orderBy:{examDate:'desc'},take:1000})
  ]);
  const metrics=new Map<string,Record<string,unknown>>();
  for(const log of logs){
    const p=log.payload&&typeof log.payload==='object'&&!Array.isArray(log.payload)?log.payload as Record<string,unknown>:{};
    if(p.type==='LEARNING_METRIC'&&typeof p.practiceLogId==='string')metrics.set(p.practiceLogId,p);
  }

  const evidence:Evidence[]=[];
  for(const row of practice){
    if(!row.topic)continue;
    const m=metrics.get(row.id)||{};
    const leaf=resolveExamMapLeaf({
      examType:row.examType,subject:row.subject,topic:row.topic,
      subTopic:typeof m.subTopic==='string'?m.subTopic:null,
      acquisition:typeof m.acquisition==='string'?m.acquisition:null,
      questionType:typeof m.questionType==='string'?m.questionType:null,
      problemType:typeof m.problemType==='string'?m.problemType:null
    });
    evidence.push({
      leaf,correct:row.correct,wrong:row.wrong,blank:row.blank,
      durationSeconds:typeof m.durationSeconds==='number'?m.durationSeconds:null,
      errorReason:row.errorReason,source:'PRACTICE'
    });
  }
  for(const row of examAnalytics){
    const leaf=resolveExamMapLeaf({
      examType:row.examType,subject:row.subject,topic:row.topic,questionType:row.questionType
    });
    evidence.push({
      leaf,correct:row.correct,wrong:row.wrong,blank:row.blank,
      durationSeconds:row.avgSeconds,errorReason:null,source:'EXAM'
    });
  }

  const leaves=aggregateExamMapEvidence(evidence);
  const weakest=leaves.filter(x=>x.status==='ZAYIF').slice(0,8);
  const exams=[...new Set(leaves.map(x=>x.examType))];
  return {
    exams,
    leaves,
    weakest,
    headline:weakest[0]
      ?weakest[0].examType+' '+weakest[0].topic+' > '+weakest[0].subTopic+' > '+weakest[0].questionType+' soru tipi zayıf'
      :'Henüz en az 5 soruluk zayıf alt beceri sinyali oluşmadı.',
    note:'Konu ve kazanım kapsamı MEB/ÖSYM sınav alanlarıyla eşleştirilir; soru tipi katmanı KEKS’in analitik sınıflandırmasıdır.'
  };
}
