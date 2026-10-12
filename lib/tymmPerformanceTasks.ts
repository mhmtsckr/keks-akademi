/** Original KEKS TYMM performance tasks. These are assessment pilots, NOT automatic mastery. */
import {findAdditionalTymmOutcome} from './verifiedAdditionalTymmOutcomes';
import {VERIFIED_GRADE56_THEMES} from './verifiedGrade56Themes';
import {findVerifiedGeographyOutcome} from './verifiedGrade10GeographyOutcomes';
export type PerformanceTaskKind='OPEN_RESPONSE'|'EXPERIMENT_DESIGN'|'MODEL';
export type RubricCriterion={id:string;label:string;levels:Readonly<Record<0|1|2,string>>};
export type PerformanceTask={id:string;grade:number;subject:string;outcomeCode:string;version:number;kind:PerformanceTaskKind;title:string;instruction:string;steps:readonly string[];evidencePrompt:string;safety:string;criteria:readonly RubricCriterion[];sourceUrl:string;contentStatus:'PILOT'};
export const TYMM_PERFORMANCE_TASKS:readonly PerformanceTask[]=[
  {
    "id": "perf-g5-moon-model-v1",
    "grade": 5,
    "subject": "Fen Bilimleri",
    "outcomeCode": "FB.5.1.3",
    "version": 1,
    "kind": "MODEL",
    "title": "Ay evrelerini modelle açıkla",
    "instruction": "Güneş, Dünya ve Ay'ın konumunu basit bir çizim ya da model tasarımıyla düşün. Yeni ay ve dolunayın neden farklı göründüğünü kendi cümlelerinle açıkla.",
    "steps": [
      "Modelde Güneş, Dünya ve Ay'ı temsil edecek nesneleri veya çizimleri tanımla.",
      "Işığın hangi taraftan geldiğini ve gözlemcinin Dünya'da nerede olduğunu belirt.",
      "Yeni ay ve dolunayın görünen aydınlık yüzlerini karşılaştır; oluşum nedenini açıkla."
    ],
    "evidencePrompt": "Çizdiysen modelindeki konumları ve gözlemlediğin/öngördüğün aydınlık bölümleri metinle tarif et. Fotoğraf şart değildir.",
    "safety": "Güneş'e doğrudan bakma. Gerçek deneyde ısı üreten güçlü ışık kaynakları kullanma; kâğıt üzerinde model tasarlayabilirsin.",
    "criteria": [
      {
        "id": "geometry",
        "label": "Modelde üç gök cisminin rollerini ve göreli konumlarını belirtme",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "light",
        "label": "Ay'ın Güneş ışığını yansıttığını doğru açıklama",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "phases",
        "label": "Görünen aydınlık yüzün değişimiyle en az iki evreyi ilişkilendirme",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "reasoning",
        "label": "Yeni ay/dolunay farklılığını tutulmayla karıştırmadan gerekçelendirme",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      }
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/367",
    "contentStatus": "PILOT"
  },
  {
    "id": "perf-g5-cell-model-v1",
    "grade": 5,
    "subject": "Fen Bilimleri",
    "outcomeCode": "FB.5.3.1",
    "version": 1,
    "kind": "MODEL",
    "title": "Bitki ve hayvan hücresini karşılaştırmalı modelle",
    "instruction": "İki hücrenin benzer ve farklı yapılarını basit bir şema şeklinde planla. Gerçek hücre çizimi yapamıyorsan yazıyla modelin parçalarını ve yerlerini tarif et.",
    "steps": [
      "Her iki hücrede ortak yapıları seç.",
      "Bitkiye özgü yapıların işlevini belirt.",
      "Karşılaştırmayı gözlem/kavram bilgisiyle destekle."
    ],
    "evidencePrompt": "Şemanı metinle tarif et; hangi yapı hangi hücrede bulunuyor ve bunu nasıl gösterdin?",
    "safety": "Kesici alet veya laboratuvar malzemesi kullanma; defter üzerinde çizim veya sözel şema yeterlidir.",
    "criteria": [
      {
        "id": "common",
        "label": "Hücre zarı, sitoplazma ve çekirdek gibi ortak yapıları ayırma",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "plant",
        "label": "Hücre duvarı ve kloroplast gibi bitkiye özgü yapıları doğru belirtme",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "model",
        "label": "Şema/model üzerinde yapıları anlaşılır biçimde konumlandırma",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "comparison",
        "label": "Benzerlik ve farklılıklar için en az iki somut gerekçe sunma",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      }
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/388",
    "contentStatus": "PILOT"
  },
  {
    "id": "perf-g6-conductivity-plan-v1",
    "grade": 6,
    "subject": "Fen Bilimleri",
    "outcomeCode": "FB.6.6.1",
    "version": 1,
    "kind": "EXPERIMENT_DESIGN",
    "title": "İletkenlik deneyini güvenli tasarla",
    "instruction": "Metal ataş ve plastik parçayı karşılaştıran, yalnız küçük pille çalışan örnek bir devrenin deney planını yaz. Deneyi yapman gerekli değildir; gözlemi nasıl kaydedeceğini açıkla.",
    "steps": [
      "Araştırma sorusu ve beklediğin sonucu yaz.",
      "Sabit tutulacak değişkenler ile değiştirilecek malzemeyi ayır.",
      "Ampulün yanıp yanmamasına göre gözlem tablosunu ve sonuç ölçütünü açıkla."
    ],
    "evidencePrompt": "Pil, kablo, düşük gerilimli ampul, metal ve plastik için planını; gözlem tablosu başlıklarını ve güvenlik önlemlerini yaz.",
    "safety": "Ev prizine, şebeke gerilimine, hasarlı pile veya açıkta tehlikeli kabloya kesinlikle dokunma. Gerçek uygulama yalnız öğretmen gözetiminde, uygun düşük gerilimli eğitim setiyle yapılabilir.",
    "criteria": [
      {
        "id": "question",
        "label": "Sınanabilir araştırma sorusu ve tahmin oluşturma",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "variables",
        "label": "Değiştirilen malzemeyi ve kontrol edilen diğer koşulları belirtme",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "observations",
        "label": "Gözlem tablosunu ve ampul tepkisinin nasıl yorumlanacağını anlatma",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "safety",
        "label": "Düşük gerilim, öğretmen gözetimi ve prizden uzak durma önlemleri",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      }
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/414",
    "contentStatus": "PILOT"
  },
  {
    "id": "perf-g9-vectors-v1",
    "grade": 9,
    "subject": "Fizik",
    "outcomeCode": "FİZ.9.2.2",
    "version": 1,
    "kind": "OPEN_RESPONSE",
    "title": "Skaler ve vektörel büyüklükleri gerekçelendir",
    "instruction": "Bir öğrenci ‘20 m doğuya yer değiştirme’, ‘20 m yol’, ‘5 m/s sürat’ ve ‘5 m/s doğuya hız’ ifadelerini inceliyor. Hangileri skaler, hangileri vektörel? Yalnız sonuç değil gerekçe yaz.",
    "steps": [
      "Her ifadeyi kendi türüne göre sınıflandır.",
      "Büyüklük ve yönün nerede gerekli olduğunu belirt.",
      "Sürat–hız ve yol–yer değiştirme farkını en az bir örnekle açıkla."
    ],
    "evidencePrompt": "Dört ifade için sınıflandırma tablosu ve kısa gerekçe yaz.",
    "safety": "Bu görev yalnız kavramsal metin değerlendirmesidir; fiziksel deney gerektirmez.",
    "criteria": [
      {
        "id": "classification",
        "label": "Dört niceliği skaler/vektörel doğru sınıflandırma",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "direction",
        "label": "Yönün neden vektörel niceliklerde gerekli olduğunu açıklama",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "distinctions",
        "label": "Sürat–hız ve yol–yer değiştirme ayrımlarını yapma",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "evidence",
        "label": "Sınıflandırmayı tutarlı örnek ya da gerekçeyle destekleme",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      }
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/fizik-dersi/unite/57",
    "contentStatus": "PILOT"
  },
  {
    "id": "perf-g10-balance-equation-v1",
    "grade": 10,
    "subject": "Kimya",
    "outcomeCode": "KİM.10.1.6",
    "version": 1,
    "kind": "OPEN_RESPONSE",
    "title": "Denkleştirmeyi atom korunumuyla kanıtla",
    "instruction": "Al + O₂ → Al₂O₃ tepkimesini en küçük tam sayı katsayılarla denkleştir. Her elementin tepkime öncesi ve sonrası atom sayısını ayrı ayrı yaz.",
    "steps": [
      "Başlangıç atom sayılarını belirt.",
      "Yalnız katsayıları değiştirerek atom sayılarını eşitle.",
      "Al ve O için önce–sonra sayısını kontrol ederek gerekçe yaz."
    ],
    "evidencePrompt": "Denklem, katsayılar ve Al/O atom sayısı kontrolünü içeren çözüm adımlarını yaz.",
    "safety": "Kimyasal maddeyi karıştırma veya yakma; bu bir kâğıt üzerinde denklem çözme görevidir.",
    "criteria": [
      {
        "id": "coefficients",
        "label": "En küçük tam sayılı doğru katsayıları belirleme (4, 3, 2)",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "aluminium",
        "label": "Al atomlarının iki tarafta eşitliğini gösterme",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "oxygen",
        "label": "O atomlarının iki tarafta eşitliğini gösterme",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "method",
        "label": "Bileşik alt indislerini değiştirmeden katsayılarla denkleştirme",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      }
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/kimya-dersi/unite/138",
    "contentStatus": "PILOT"
  },
  {
    "id": "perf-g11-plant-response-v1",
    "grade": 11,
    "subject": "Biyoloji",
    "outcomeCode": "BİY.11.1.3",
    "version": 1,
    "kind": "EXPERIMENT_DESIGN",
    "title": "Işığa yönelme tepkisi için kontrollü gözlem planla",
    "instruction": "İki aynı tür bitkiyle, ışığın geliş yönünün sürgün yönelmesine etkisini inceleyen gözlem planı oluştur. Gerçek deney yapman şart değildir.",
    "steps": [
      "Işığın yönüyle ilgili test edilebilir hipotez kur.",
      "Saksı, bitki türü, sulama ve süre gibi koşulları nasıl kontrol edeceğini açıkla.",
      "Gözlem sıklığını, sonuç ölçütünü ve tropizma/nasti ayrımını belirt."
    ],
    "evidencePrompt": "Hipotez, bağımsız/bağımlı değişken, kontrol edilen koşullar, gözlem tablosu ve sonuç yorumunu yaz.",
    "safety": "Bitkilere zarar verecek ısı/kimyasal uygulama yapma; yapay güçlü ışık yerine kâğıt üzerinde plan hazırlanabilir.",
    "criteria": [
      {
        "id": "hypothesis",
        "label": "Sınanabilir ışık-yönelme hipotezini yazma",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "variables",
        "label": "Bağımsız, bağımlı ve kontrol edilen değişkenleri ayırma",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "records",
        "label": "Zaman içinde gözlem/ölçüm kayıt düzeni kurma",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      },
      {
        "id": "biology",
        "label": "Yönelmenin fototropizma olduğunu nasti hareketinden ayırma",
        "levels": {
          "0": "Yok, belirsiz veya yanlış",
          "1": "Kısmen doğru ancak eksik gerekçeli",
          "2": "Doğru, açık ve ilgili kanıtla destekli"
        }
      }
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/biyoloji-dersi/unite/13",
    "contentStatus": "PILOT"
  },
  {
    "id": "perf-g10-geo-map-geometry-v1",
    "grade": 10,
    "subject": "Coğrafya",
    "outcomeCode": "COĞ.10.2.2",
    "version": 1,
    "kind": "MODEL",
    "title": "Kurgusal mahalle için tematik harita tasarla",
    "instruction": "Gerçek ev adresi paylaşmadan hayalî bir mahallede üç sağlık noktası, iki yürüyüş güzergâhı ve bir park sınırı bulunan tematik harita planla. Hangi öğeyi nokta, çizgi ve alanla göstereceğini gerekçelendir.",
    "steps": [
      "Haritanın amacını, gösterilecek nesneleri ve kullanılacak ölçeği belirle.",
      "Nokta, çizgi ve alan geometrilerini hangi coğrafi öğeye ayırdığını açıkla.",
      "Lejant, yön oku ve veri kaynağı bilgilerini nasıl sunacağını yaz."
    ],
    "evidencePrompt": "Harita öğeleri, geometri türleri, lejant, ölçek, veri kaynağı ve özel adres paylaşmama planını metinle tarif et.",
    "safety": "Gerçek ev/öğrenci adreslerini, kişi konumlarını veya özel koordinatları paylaşma. Hayalî bir alan ve örnek veri kullan.",
    "criteria": [
      {
        "id": "purpose",
        "label": "Harita amacı ve kullanıcı ihtiyacını belirleme",
        "levels": {
          "0": "Yanlış, belirsiz veya kanıtsız",
          "1": "Kısmen doğru veya gerekçesi eksik",
          "2": "Doğru, açık ve gerekçeli kanıt"
        }
      },
      {
        "id": "geometry",
        "label": "Nokta, çizgi ve alan verilerini uygun kullanma",
        "levels": {
          "0": "Yanlış, belirsiz veya kanıtsız",
          "1": "Kısmen doğru veya gerekçesi eksik",
          "2": "Doğru, açık ve gerekçeli kanıt"
        }
      },
      {
        "id": "cartography",
        "label": "Ölçek, yön, lejant ve veri kaynağı belirtme",
        "levels": {
          "0": "Yanlış, belirsiz veya kanıtsız",
          "1": "Kısmen doğru veya gerekçesi eksik",
          "2": "Doğru, açık ve gerekçeli kanıt"
        }
      },
      {
        "id": "privacy",
        "label": "Kişisel konumu ifşa etmeden ve kaynakları belirterek harita tasarlama",
        "levels": {
          "0": "Yanlış, belirsiz veya kanıtsız",
          "1": "Kısmen doğru veya gerekçesi eksik",
          "2": "Doğru, açık ve gerekçeli kanıt"
        }
      }
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/58",
    "contentStatus": "PILOT"
  },
  {
    "id": "perf-g10-geo-disaster-evidence-v1",
    "grade": 10,
    "subject": "Coğrafya",
    "outcomeCode": "COĞ.10.6.1",
    "version": 1,
    "kind": "OPEN_RESPONSE",
    "title": "Kurgusal sel riski için önlem planını değerlendir",
    "instruction": "Varsayımsal bir mahallede şiddetli yağışla taşkın riski bulunuyor. Yerel risk haritası, erken uyarı ve tahliye eğitimi üzerinden hangi önlemlerin işe yaradığını gösterecek kanıtları yaz. Somut acil durum yönlendirmesi verme.",
    "steps": [
      "Tehlike, maruziyet ve kırılganlık değişkenlerini sınıflandır.",
      "Önlemin çalıştığını gösterecek ölçülebilir verileri belirle.",
      "Veri güvenilirliği, erişilebilirlik ve riskleri göz önünde tutarak gerekçeli öneri sun."
    ],
    "evidencePrompt": "Kurgusal risk haritası, kontrol edilecek kaynaklar, gösterge tablosu ve önlem değerlendirme ölçütlerini yaz.",
    "safety": "Gerçek afet anında okul/AFAD gibi yetkili kurumların güncel yönlendirmelerine uy; burada yalnız kurgusal eğitim vakasını analiz et.",
    "criteria": [
      {
        "id": "risk",
        "label": "Tehlike, maruziyet ve kırılganlık analizini açıklama",
        "levels": {
          "0": "Yanlış, belirsiz veya kanıtsız",
          "1": "Kısmen doğru veya gerekçesi eksik",
          "2": "Doğru, açık ve gerekçeli kanıt"
        }
      },
      {
        "id": "evidence",
        "label": "Kaynaklı ve ölçülebilir risk azaltma kanıtı belirleme",
        "levels": {
          "0": "Yanlış, belirsiz veya kanıtsız",
          "1": "Kısmen doğru veya gerekçesi eksik",
          "2": "Doğru, açık ve gerekçeli kanıt"
        }
      },
      {
        "id": "plan",
        "label": "Uygulanabilir ve kapsayıcı değerlendirme planı yazma",
        "levels": {
          "0": "Yanlış, belirsiz veya kanıtsız",
          "1": "Kısmen doğru veya gerekçesi eksik",
          "2": "Doğru, açık ve gerekçeli kanıt"
        }
      },
      {
        "id": "uncertainty",
        "label": "Yerel belirsizlik ve yetkili kaynak gereğini belirtme",
        "levels": {
          "0": "Yanlış, belirsiz veya kanıtsız",
          "1": "Kısmen doğru veya gerekçesi eksik",
          "2": "Doğru, açık ve gerekçeli kanıt"
        }
      }
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/94",
    "contentStatus": "PILOT"
  }
];
export function performanceTaskById(id:string,version?:number){return TYMM_PERFORMANCE_TASKS.find(x=>x.id===id&&(version===undefined||x.version===version))||null;}
export function performanceTasksForGrade(grade:number){return TYMM_PERFORMANCE_TASKS.filter(x=>x.grade===grade);}
export function performanceTaskEvidence(task:PerformanceTask){
 const fromGeo=findVerifiedGeographyOutcome(task.outcomeCode);
 if(fromGeo&&fromGeo.grade===task.grade&&fromGeo.subject===task.subject&&fromGeo.url===task.sourceUrl)
  return {outcomeCodeVerified:true,sourceUrl:fromGeo.url};
  const fromAdditional=findAdditionalTymmOutcome(task.outcomeCode);
 if(fromAdditional&&fromAdditional.grade===task.grade&&fromAdditional.subject===task.subject&&fromAdditional.url===task.sourceUrl)return {outcomeCodeVerified:true,sourceUrl:fromAdditional.url};
 const fromMiddle=VERIFIED_GRADE56_THEMES.find(x=>x.outcomeCode===task.outcomeCode&&x.grade===task.grade&&x.subject===task.subject&&x.sourceUrl===task.sourceUrl&&x.verification==='OUTCOME_CODE');
 return {outcomeCodeVerified:Boolean(fromMiddle),sourceUrl:fromMiddle?.sourceUrl||null};
}
export function evaluateHumanRubric(task:PerformanceTask,scores:Readonly<Record<string,number>>){
 if(task.criteria.length!==4)throw new Error('Rubrik dört ölçüt içermelidir.');
 const keys=Object.keys(scores);
 if(keys.length!==task.criteria.length||task.criteria.some(c=>!Number.isInteger(scores[c.id])||scores[c.id]<0||scores[c.id]>2)||keys.some(k=>!task.criteria.some(c=>c.id===k)))throw new Error('Rubrik eksik ya da puanları geçersiz.');
 const total=task.criteria.reduce((n,c)=>n+scores[c.id],0);
 return {total,max:task.criteria.length*2,percentage:Math.round(100*total/(task.criteria.length*2)),criterionScores:task.criteria.map(c=>({id:c.id,label:c.label,score:scores[c.id]})),requiresFurtherEvidence:total<task.criteria.length*2,masteryStatusUnchanged:true};
}
