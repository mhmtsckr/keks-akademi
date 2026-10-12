/** 2026 editorial pilot: concrete safe follow-up actions for human-scored weak rubric dimensions. */
import {performanceTaskById} from './tymmPerformanceTasks';
export type CriterionIntervention={taskId:string;criterionId:string;task:string;expectedEvidence:string;minutes:number;mode:'WRITTEN_SAFE_PRACTICE'};
export const CRITERION_INTERVENTIONS:readonly CriterionIntervention[]=[
  {
    "taskId": "perf-g5-moon-model-v1",
    "criterionId": "geometry",
    "task": "Bir kâğıda Güneş–Dünya–Ay konumunu üç daire ve okla göster; rollerini altlarına yaz.",
    "expectedEvidence": "Üç daireyi ve ışığın geliş yönünü sözel tarif et.",
    "minutes": 5,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g5-moon-model-v1",
    "criterionId": "light",
    "task": "Ay'ın kendi ışığını üretmediğini ve Güneş ışığını yansıttığını iki cümleyle açıkla.",
    "expectedEvidence": "Işık kaynağı ile yansıtan gök cismini ayrı yaz.",
    "minutes": 5,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g5-moon-model-v1",
    "criterionId": "phases",
    "task": "Yeni ay ile dolunayda Dünya'dan görülen aydınlık Ay yüzünü iki ayrı şemada göster.",
    "expectedEvidence": "İki şemanın farkını bir cümleyle gerekçelendir.",
    "minutes": 5,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g5-moon-model-v1",
    "criterionId": "reasoning",
    "task": "Ay evreleri ile Ay tutulmasını neden farklı olaylar saydığını yaz.",
    "expectedEvidence": "Dünya'nın gölgesinin hangi olayda etkili olduğunu açıkla.",
    "minutes": 5,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g5-cell-model-v1",
    "criterionId": "common",
    "task": "Hücre zarı, sitoplazma ve çekirdeği hem bitki hem hayvan hücresinde işaretleyen mini şema çiz.",
    "expectedEvidence": "Üç yapının iki hücrede ortak olduğunu yaz.",
    "minutes": 5,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g5-cell-model-v1",
    "criterionId": "plant",
    "task": "Hücre duvarı, kloroplast ve büyük kofulun bitki hücresi örneklerindeki yerini açıkla.",
    "expectedEvidence": "Hayvan hücresinde neden hücre duvarı olmadığını belirt.",
    "minutes": 5,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g5-cell-model-v1",
    "criterionId": "model",
    "task": "İki hücre için üçer ortak yapı ve iki ayırt edici özellik içeren etiketli taslak oluştur.",
    "expectedEvidence": "Kendi şemanın etiketlerini yaz.",
    "minutes": 5,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g5-cell-model-v1",
    "criterionId": "comparison",
    "task": "Bitki ve hayvan hücresi için iki benzerlik ve iki farklılık tablosu hazırla.",
    "expectedEvidence": "En az iki farklılığı kanıtlayan yapıları yaz.",
    "minutes": 5,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g6-conductivity-plan-v1",
    "criterionId": "question",
    "task": "Metal ile plastik arasındaki farkı sınamak için tek değişkenli bir araştırma sorusu ve hipotez yaz.",
    "expectedEvidence": "Hangi malzemenin akımı iletmesini beklediğini gerekçelendir.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g6-conductivity-plan-v1",
    "criterionId": "variables",
    "task": "Devrede pili ve lambayı sabit tutup sadece örnek malzemeyi değiştiren deney şeması yaz.",
    "expectedEvidence": "Bağımsız, bağımlı ve sabit değişkenleri ayrı adlandır.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g6-conductivity-plan-v1",
    "criterionId": "observations",
    "task": "İki malzeme için 'Malzeme–Ampul durumu–Yorum' sütunlu boş gözlem tablosu tasarla.",
    "expectedEvidence": "Ampulün yanması/yamanmasının nasıl yorumlanacağını açıkla.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g6-conductivity-plan-v1",
    "criterionId": "safety",
    "task": "Gerçek deney yapmadan güvenli bir pilli devre tasarımının dört güvenlik kuralını yaz.",
    "expectedEvidence": "Priz ve şebeke geriliminin kullanılmamasını, öğretmen gözetimini açıkça belirt.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g9-vectors-v1",
    "criterionId": "classification",
    "task": "Kütle, kuvvet, yol ve yer değiştirmeyi skaler/vektörel sınıflandıran bir tablo hazırla.",
    "expectedEvidence": "Her sınıfın nedenini tek cümleyle yaz.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g9-vectors-v1",
    "criterionId": "direction",
    "task": "'12 N kuzeye kuvvet' ve '12 N kuvvet' ifadelerinde yön bilgisinin rolünü açıkla.",
    "expectedEvidence": "Vektörel gösterimde yönü belirt.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g9-vectors-v1",
    "criterionId": "distinctions",
    "task": "100 m ileri gidip başlangıca dönen hareketin alınan yolu ile yer değiştirmesini hesapla.",
    "expectedEvidence": "Yol ile yer değiştirmenin neden farklı olduğunu yaz.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g9-vectors-v1",
    "criterionId": "evidence",
    "task": "Sürat ile hızı ayıran kendi günlük hayat örneğini oluştur.",
    "expectedEvidence": "Hangi nicelikte yön gerektiğini belirt.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g10-balance-equation-v1",
    "criterionId": "coefficients",
    "task": "N₂ + H₂ → NH₃ denklemini en küçük tam sayılı katsayılarla denkleştir.",
    "expectedEvidence": "Katsayıları ve kontrolünü yaz: 1, 3, 2.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g10-balance-equation-v1",
    "criterionId": "aluminium",
    "task": "2Al₂O₃ bileşiğindeki toplam Al atom sayısını hesaplayıp açıkla.",
    "expectedEvidence": "Katsayı ve alt indis çarpımını göster.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g10-balance-equation-v1",
    "criterionId": "oxygen",
    "task": "3O₂ ve 2Al₂O₃ ifadelerindeki O atom sayısını karşılaştır.",
    "expectedEvidence": "Her iki tarafta 6 O bulunduğunu işlemle açıkla.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g10-balance-equation-v1",
    "criterionId": "method",
    "task": "H₂ + O₂ → H₂O denkleminde alt indisleri değiştirmeden katsayılarla eşitle.",
    "expectedEvidence": "2H₂ + O₂ → 2H₂O sonucunun atom kontrolünü yaz.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g11-plant-response-v1",
    "criterionId": "hypothesis",
    "task": "Tek taraflı ışıktan gelen etkiyi sınamak için ölçülebilir fide yönelme hipotezi yaz.",
    "expectedEvidence": "Işığın yönünü değiştirdiğinde hangi yönelim sonucunu beklediğini açıkla.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g11-plant-response-v1",
    "criterionId": "variables",
    "task": "Fide türü, su, süre ve ışık yönünü kontrol eden küçük deney tablosu oluştur.",
    "expectedEvidence": "Bağımsız ve bağımlı değişkeni ayrı yaz.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g11-plant-response-v1",
    "criterionId": "records",
    "task": "Üç gün boyunca 'Gün–Işığın yönü–Fidenin büyüme yönü' gözlem tablosu tasarla.",
    "expectedEvidence": "Tekrarlı ölçümün neden yararlı olduğunu belirt.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g11-plant-response-v1",
    "criterionId": "biology",
    "task": "Fototropizma ile küstüm otunun dokunma sonrası kapanmasını karşılaştır.",
    "expectedEvidence": "Uyaranın yönüne bağlı tepkiyi doğru adlandır.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g10-geo-map-geometry-v1",
    "criterionId": "purpose",
    "task": "Kurgusal okul çevresi için güvenli bisiklet güzergâhı haritasının hedef kullanıcısını yaz.",
    "expectedEvidence": "Haritanın tek ana amacını belirt.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g10-geo-map-geometry-v1",
    "criterionId": "geometry",
    "task": "Kurgusal haritada okul için nokta, yol için çizgi ve park için alan sembolleri tasarla.",
    "expectedEvidence": "Her coğrafi nesnenin geometrik türünü gerekçelendir.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g10-geo-map-geometry-v1",
    "criterionId": "cartography",
    "task": "Bir kâğıt haritasına örnek yön oku, lejant ve ölçek açıklaması ekle.",
    "expectedEvidence": "Verinin kurgusal olduğunu ve varsayılan ölçek türünü açıkla.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g10-geo-map-geometry-v1",
    "criterionId": "privacy",
    "task": "Gerçek kişisel konum vermeden kurgusal üç durakla güvenli rota taslağı oluştur.",
    "expectedEvidence": "Adres, telefon veya öğrenci adı ekleme; gizlilik kararını açıkla.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g10-geo-disaster-evidence-v1",
    "criterionId": "risk",
    "task": "Kurgusal bir yerleşimde heyelan tehlikesi, maruziyet ve kırılganlığı üç sütuna ayır.",
    "expectedEvidence": "Her kavram için bir örnek yaz.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g10-geo-disaster-evidence-v1",
    "criterionId": "evidence",
    "task": "Sel veya heyelan riski için ölçülebilir iki gösterge ve güvenilir veri kaynağı türü öner.",
    "expectedEvidence": "Tahmin ile kanıtı ayır.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g10-geo-disaster-evidence-v1",
    "criterionId": "plan",
    "task": "Hayalî bir ilçede risk azaltma seçeneği için önce–sonra kontrol göstergeleri öner.",
    "expectedEvidence": "Planın hangi grupları kapsadığını yaz.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  },
  {
    "taskId": "perf-g10-geo-disaster-evidence-v1",
    "criterionId": "uncertainty",
    "task": "Kurgusal risk senaryosunda hangi bilgilerin belirsiz olduğunu ve neden yerel yetkili görüşü gerektiğini yaz.",
    "expectedEvidence": "Kesin güvenlik iddiasından kaçınan sonuç cümlesi kur.",
    "minutes": 10,
    "mode": "WRITTEN_SAFE_PRACTICE"
  }
];
export function interventionFor(taskId:string,criterionId:string){
 const lesson=performanceTaskById(taskId);
 if(!lesson||!lesson.criteria.some(c=>c.id===criterionId))return null;
 return CRITERION_INTERVENTIONS.find(x=>x.taskId===taskId&&x.criterionId===criterionId)||null;
}
export type ScoredCriterion={id:string;label:string;score:number};
export function suggestRubricInterventions(taskId:string,scores:readonly ScoredCriterion[],limit=2){
 const lesson=performanceTaskById(taskId);
 if(!lesson||scores.length!==lesson.criteria.length||!Number.isInteger(limit)||limit<1||limit>4)return [];
 const map=new Map(scores.map(c=>[c.id,c]));
 if(map.size!==lesson.criteria.length||lesson.criteria.some(c=>{
  const v=map.get(c.id);return !v||!Number.isInteger(v.score)||v.score<0||v.score>2;
 }))return [];
 return lesson.criteria
  .map((c,i)=>({criterion:c,score:map.get(c.id)!.score,rank:i,action:interventionFor(taskId,c.id)}))
  .filter(x=>x.score<2&&x.action!==null)
  .sort((a,b)=>a.score-b.score||a.rank-b.rank)
  .slice(0,limit)
  .map(({criterion,score,action})=>({criterionId:criterion.id,criterionLabel:criterion.label,score,outOf:2,
    task:action!.task,expectedEvidence:action!.expectedEvidence,minutes:action!.minutes,
    status:'SUGGESTED_NOT_ASSIGNED' as const,masteryStatusUnchanged:true}));
}
