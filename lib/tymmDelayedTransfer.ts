/** Seven-day, different-context pilot; MEB output source is verified, KEKS prompts are not certified. */
import {performanceTaskById,type RubricCriterion} from './tymmPerformanceTasks';
export const TRANSFER_DELAY_DAYS=7;
export type TransferVariant={baselineTaskId:string;id:string;version:1;title:string;instruction:string;evidencePrompt:string;steps:readonly string[];criterionLabels:readonly string[]};
export const TYMM_TRANSFER_VARIANTS:readonly TransferVariant[]=[
  {
    "baselineTaskId": "perf-g5-moon-model-v1",
    "id": "perf-g5-moon-model-transfer-v1",
    "version": 1,
    "title": "İlk ve son dördünü yeni bir modelle açıkla",
    "instruction": "Yeni ay/dolunay yerine ilk dördün ve son dördün evrelerini açıklayan bir Güneş–Dünya–Ay modeli tasarla. Gözlemcinin gördüğü aydınlık yüzü gerekçelendir.",
    "evidencePrompt": "Kurduğun iki ayrı modelin konumlarını ve Dünya'dan görünen aydınlık yüzlerini yaz.",
    "steps": [
      "Eski cevabını tekrar etmeden yeni bağlamı analiz et.",
      "Bağımsız gerekçeni ve model/deney planını hazırla.",
      "Her rubrik ölçütünü destekleyen kanıtı belirt."
    ],
    "criterionLabels": [
      "Üç gök cismini uygun konumlandırma",
      "Ay'ın Güneş ışığını yansıttığını açıklama",
      "İlk/son dördün evrelerini ayırt etme",
      "Evreleri tutulmayla karıştırmadan gerekçelendirme"
    ]
  },
  {
    "baselineTaskId": "perf-g5-cell-model-v1",
    "id": "perf-g5-cell-model-transfer-v1",
    "version": 1,
    "title": "Yaprak ve yanak hücresini yeni şemada karşılaştır",
    "instruction": "Bir yaprak hücresiyle insan yanak hücresini karşılaştıran yeni şema oluştur. Ortak yapıları ve bitki hücresine özgü yapıları konumlandır.",
    "evidencePrompt": "Hücre şemalarını ve hangi yapıların hangi hücrede olduğunu yaz.",
    "steps": [
      "Eski cevabını tekrar etmeden yeni bağlamı analiz et.",
      "Bağımsız gerekçeni ve model/deney planını hazırla.",
      "Her rubrik ölçütünü destekleyen kanıtı belirt."
    ],
    "criterionLabels": [
      "Ortak hücresel yapıları ayırma",
      "Bitkiye özgü yapıları doğru ayırt etme",
      "Şemayı anlaşılır etiketleme",
      "Karşılaştırmayı iki kanıtla destekleme"
    ]
  },
  {
    "baselineTaskId": "perf-g6-conductivity-plan-v1",
    "id": "perf-g6-conductivity-plan-transfer-v1",
    "version": 1,
    "title": "Alüminyum ve kuru ahşap için deney planla",
    "instruction": "Önceki metal ataş/plastik karşılaştırması yerine alüminyum şerit ve kuru ahşap çubuğun iletkenliğini yalnız kâğıt üzerinde güvenli, küçük pilli bir devreyle nasıl test edeceğini planla. Gerçek deney şart değildir.",
    "evidencePrompt": "Hipotez, sabit koşullar, gözlem tablosu ve yalnız düşük gerilimli güvenlik önlemlerini yaz.",
    "steps": [
      "Eski cevabını tekrar etmeden yeni bağlamı analiz et.",
      "Bağımsız gerekçeni ve model/deney planını hazırla.",
      "Her rubrik ölçütünü destekleyen kanıtı belirt."
    ],
    "criterionLabels": [
      "Yeni malzemeler için sınanabilir tahmin",
      "Kontrol koşullarını ve değişkeni ayırma",
      "Gözlem tablosu ve karar ölçütü",
      "Prizsiz düşük gerilim/öğretmen gözetimi"
    ]
  },
  {
    "baselineTaskId": "perf-g9-vectors-v1",
    "id": "perf-g9-vectors-transfer-v1",
    "version": 1,
    "title": "Kuryenin yolunu ve yer değiştirmesini incele",
    "instruction": "Bir kurye 300 metre doğuya ve 100 metre batıya yürüyor. Toplam yol ve yer değiştirme niceliklerini hesaplayıp neden skaler/vektörel olduğunu açıkla; sürat/hız farkını da belirt.",
    "evidencePrompt": "Yol ve yer değiştirme hesaplarını ve yönü gerektiren niceliklerin gerekçesini yaz.",
    "steps": [
      "Eski cevabını tekrar etmeden yeni bağlamı analiz et.",
      "Bağımsız gerekçeni ve model/deney planını hazırla.",
      "Her rubrik ölçütünü destekleyen kanıtı belirt."
    ],
    "criterionLabels": [
      "Yol/yer değiştirmeyi sınıflandırma",
      "Vektörel yönü doğru açıklama",
      "Sürat/hız farkını ayırma",
      "Hesap ve gerekçenin tutarlılığı"
    ]
  },
  {
    "baselineTaskId": "perf-g10-balance-equation-v1",
    "id": "perf-g10-balance-equation-transfer-v1",
    "version": 1,
    "title": "Magnezyum oksit denklemini atom korunumuyla çöz",
    "instruction": "Önceki alüminyum oksit örneğinden farklı olarak Mg + O₂ → MgO denklemini en küçük tam sayılarla denkleştir. İki tarafta her atomun sayısını karşılaştır.",
    "evidencePrompt": "Katsayıları, Mg/O atom sayılarını ve neden alt indis değiştirilmediğini yaz.",
    "steps": [
      "Eski cevabını tekrar etmeden yeni bağlamı analiz et.",
      "Bağımsız gerekçeni ve model/deney planını hazırla.",
      "Her rubrik ölçütünü destekleyen kanıtı belirt."
    ],
    "criterionLabels": [
      "Katsayılar (2,1,2)",
      "Mg atom sayısını kontrol etme",
      "O atom sayısını kontrol etme",
      "Alt indis yerine katsayı değiştirme"
    ]
  },
  {
    "baselineTaskId": "perf-g11-plant-response-v1",
    "id": "perf-g11-plant-response-transfer-v1",
    "version": 1,
    "title": "Farklı ışık düzeninde fide yönelimini planla",
    "instruction": "Sürgün yönelmesini bu kez tek taraflı penceresi olan bir kutudan gelen ışıkla gözlemlemek için iki özdeş fideyle kâğıt üzerinde kontrollü plan tasarla. Güçlü lamba veya gerçek deney zorunlu değildir.",
    "evidencePrompt": "Hipotez, değişkenler, günlük gözlem tablosu ve tropizma/nasti yorumunu belirt.",
    "steps": [
      "Eski cevabını tekrar etmeden yeni bağlamı analiz et.",
      "Bağımsız gerekçeni ve model/deney planını hazırla.",
      "Her rubrik ölçütünü destekleyen kanıtı belirt."
    ],
    "criterionLabels": [
      "Sınanabilir hipotez",
      "Değişkenleri ayırma",
      "Günlük gözlem/ölçüm planı",
      "Fototropizma ve nastiyi ayırma"
    ]
  }
];
export function transferVariantFor(taskId:string){
 const v=TYMM_TRANSFER_VARIANTS.find(x=>x.baselineTaskId===taskId);
 const base=performanceTaskById(taskId);
 if(!v||!base||v.criterionLabels.length!==base.criteria.length)return null;
 const criteria:readonly RubricCriterion[]=base.criteria.map((c,i)=>({...c,label:v.criterionLabels[i]}));
 return {...v,grade:base.grade,subject:base.subject,outcomeCode:base.outcomeCode,
   sourceUrl:base.sourceUrl,kind:base.kind,safety:base.safety,criteria,contentStatus:'PILOT' as const};
}
export function transferDueAt(reviewedAt:Date){return new Date(reviewedAt.getTime()+TRANSFER_DELAY_DAYS*86400000);}
export type RubricSnapshot={total:number;max:number;criterionScores:readonly {id:string;score:number}[]};
export function compareTransferRubrics(before:RubricSnapshot,after:RubricSnapshot){
 if(!readableRubric(before)||!readableRubric(after))throw new Error('Rubrik puanları tutarsız veya eksik.');
 const old=new Map(before.criterionScores.map(x=>[x.id,x.score]));
 if(old.size!==4||after.criterionScores.length!==4||after.criterionScores.some(x=>!old.has(x.id)))throw new Error('Farklı rubrik ölçütleri karşılaştırılamaz.');
 const criteria=after.criterionScores.map(x=>({id:x.id,before:old.get(x.id)!,after:x.score,delta:x.score-old.get(x.id)!}));
 const delta=after.total-before.total;
 return {baselineTotal:before.total,transferTotal:after.total,max:8,delta,criteria,
   interpretation:delta>=2?'Yeni bağlamda gelişim sinyali':delta<=-2?'Yeni bağlamda güçlük sinyali':'Benzer düzeyde performans',
   disclaimer:'Koç rubriği karşılaştırmasıdır; görevlerin psikometrik eşdeğerliğini, kalıcı öğrenmeyi veya gerçek deney başarısını kanıtlamaz.',
   masteryStatusUnchanged:true,reviewScheduleUnchanged:true};
}
export function readableRubric(v:unknown):RubricSnapshot|null{
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const x=v as Record<string,unknown>;
 if(!Number.isInteger(x.total)||Number(x.total)<0||Number(x.total)>8||x.max!==8
    ||!Array.isArray(x.criterionScores)||x.criterionScores.length!==4)return null;
 const criteria=x.criterionScores as unknown[];
 if(!criteria.every(c=>{
   if(!c||typeof c!=='object'||Array.isArray(c))return false;
   const y=c as Record<string,unknown>;
   return typeof y.id==='string'&&y.id.length>0&&Number.isInteger(y.score)
     &&Number(y.score)>=0&&Number(y.score)<=2;
 }))return null;
 const scores=criteria as {id:string;score:number}[];
 if(new Set(scores.map(c=>c.id)).size!==4)return null;
 if(scores.reduce((sum,c)=>sum+c.score,0)!==Number(x.total))return null;
 return {total:Number(x.total),max:8,criterionScores:scores};
}

export type TransferEvidenceRow={id:string;createdAt:Date;payload:unknown};
function record(v:unknown):Record<string,unknown>{
 return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}
export function transferEligibility(taskId:string,logs:readonly TransferEvidenceRow[],now:Date){
 const exists=logs.find(row=>record(row.payload).taskId===taskId&&
  ['TYMM_TRANSFER_SUBMISSION','TYMM_TRANSFER_REVIEWED'].includes(String(record(row.payload).type)));
 const baseline=logs.find(row=>{
  const p=record(row.payload),review=record(p.review);
  const scored=readableRubric(review);
  const task=performanceTaskById(taskId);
  const expected=task?.criteria.map(c=>c.id)||[];
  return p.type==='TYMM_PERFORMANCE_REVIEWED'&&p.taskId===taskId&&
   p.taskVersion===task?.version&&scored!==null&&
   expected.length===4&&expected.every(id=>scored.criterionScores.some(c=>c.id===id))&&
   typeof review.reviewedAt==='string'&&Number.isFinite(Date.parse(review.reviewedAt))&&
   Date.parse(review.reviewedAt)>=row.createdAt.getTime();
 });
 if(!baseline)return {status:'AWAITING_BASELINE' as const,dueAt:null,baselineId:null,transferId:exists?.id||null};
 const dueAt=transferDueAt(new Date(String(record(record(baseline.payload).review).reviewedAt)));
 if(exists)return {
  status:record(exists.payload).type==='TYMM_TRANSFER_REVIEWED'?'REVIEWED' as const:'WAITING_FOR_COACH' as const,
  dueAt:dueAt.toISOString(),baselineId:baseline.id,transferId:exists.id
 };
 return {status:now.getTime()>=dueAt.getTime()?'AVAILABLE' as const:'LOCKED' as const,
  dueAt:dueAt.toISOString(),baselineId:baseline.id,transferId:null};
}
