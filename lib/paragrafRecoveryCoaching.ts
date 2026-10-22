import type {ParagrafDetailedSolution} from '@/lib/paragrafDetailedSolutions';
import {REMEDIATION_REASONS} from '@/lib/wrongQuestionRemediation';

/** These labels describe student-reported blockers, NOT AI diagnoses. */
export const OPTICAL_BLANK_REASONS={
  BOS_SURE:{label:'Süre yetmedi',instruction:'Önce süre olmadan kökü ve kanıtı bul. Ardından ayrı bir benzer soruyu süre tutarak çöz.'},
  BOS_IKI_SIK:{label:'İki seçenek arasında kaldım',instruction:'İki güçlü seçeneği yan yana yaz. Her biri için metinden bir kanıt bul ve metne eklenen kesinliği ayıkla.'},
  BOS_METNI_ANLAMADIM:{label:'Metni / kökü anlayamadım',instruction:'Kökü kendi cümlenle yeniden yaz. Paragrafın ana savını ve karşıtlık işaretlerini belirle.'},
  BOS_YONTEM:{label:'Nasıl başlayacağımı bilemedim',instruction:'Sorunun türüne ait ilk çözüm hamlesini uygula; henüz cevap harfine bakmadan bir seçenek öner.'},
  BOS_EMIN_OLAMADIM:{label:'İşaretlemekten emin olamadım',instruction:'Önce kanıtını bulduğun seçeneği geçici olarak işaretle; diğer dört seçeneği neden elediğini yaz.'}
} as const;
export type OpticalBlankReason=keyof typeof OPTICAL_BLANK_REASONS;
export type OpticalRecoveryReason=keyof typeof REMEDIATION_REASONS|OpticalBlankReason;

export const OPTICAL_RECOVERY_REASONS={
 ...REMEDIATION_REASONS,...OPTICAL_BLANK_REASONS
} as const;

export type OpticalSelfCheck={answer:'A'|'B'|'C'|'D'|'E';evidence?:string};
export function opticalRecoveryReason(value:unknown,status:'YANLIŞ'|'BOŞ'):OpticalRecoveryReason|null{
 if(typeof value!=='string'||!Object.prototype.hasOwnProperty.call(OPTICAL_RECOVERY_REASONS,value))return null;
 if(value.startsWith('BOS_')&&status!=='BOŞ')return null;
 return value as OpticalRecoveryReason;
}
function key(s:string){
 return s.toLocaleLowerCase('tr-TR').normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/\s+/g,' ').trim();
}
type Strategy={skill:string;diagnostic:string;practice:string;trap:string};
export function paragraphSkillStrategy(raw:string):Strategy{
 const s=key(raw);
 if(s.includes('cumle tamamla'))return {
  skill:'Cümle tamamlama',
  diagnostic:'Boşluğun öncesindeki ve sonrasındaki neden–sonuç, karşıtlık ve gönderme bağlarını belirle.',
  practice:'Seçenekleri okumadan boşluğu kendi cümlenle tamamla; ardından anlamı ve dil bilgisini iki yönde kontrol et.',
  trap:'Yalnız önceki cümleye uyan, sonraki cümlenin anlam bağını bozan seçenekleri ele.'
 };
 if(s.includes('ikiye bol'))return {
  skill:'Paragrafı ikiye bölme',
  diagnostic:'Her cümlenin konusunu ve geçişteki bakış açısını ayır; yeni paragrafın yeni odak başlatıp başlatmadığını belirle.',
  practice:'Önerdiğin sınırın iki yanına kısa başlık koy. Her iki bölüm kendi içinde anlamlı olmalı.',
  trap:'Sırf “ancak/oysa” geçtiği için veya cümle uzun olduğu için bölme; konu/bakış değişimini ara.'
 };
 if(s.includes('sirala')||s.includes('karisik metin')||s.includes('cumle olustur'))return {
  skill:'Cümle sıralama / karışık metin',
  diagnostic:'Açılışta önceki cümleye gönderme yapan “bu, böylece, söz konusu” türü ifadeleri ele.',
  practice:'Özne, zamir, zaman ve neden–sonuç ilişkileriyle cümleler arasında bağlantı zinciri kur; son cümleyi kontrol et.',
  trap:'Tek bir anahtar sözcük ortaklığı bütün cümlelerin sırasını kanıtlamaz.'
 };
 if(s.includes('ulasila')||s.includes('cikarilama'))return {
  skill:'Ulaşılamayan yargı',
  diagnostic:'Kökteki olumsuzluğu işaretle. Her seçenek için metinde açık bir dayanak var mı diye sor.',
  practice:'Desteklenen dört seçeneğin kanıtını bul; kalan seçeneğin metne eklediği iddiayı belirle.',
  trap:'Genel kültürüne göre doğru olsa bile metinde bulunmayan yargı desteklenmiş sayılmaz.'
 };
 if(s.includes('ana dusunce')||s.includes('baslik'))return {
  skill:'Ana düşünce / başlık',
  diagnostic:'Metnin ana iddiasını, örnekten ve ayrıntıdan ayır; kapsamını bir cümlede ifade et.',
  practice:'Paragrafı tek cümleyle özetleyip bütün örneklerle sınayarak seçenekleri ele.',
  trap:'Doğru bir ayrıntı, metnin bütününü kapsayan ana düşünce değildir.'
 };
 if(s.includes('yardimci dusunce'))return {
  skill:'Yardımcı düşünce',
  diagnostic:'Ana savı destekleyen yan gerekçeyi veya örneği bul; soru kökünün istediği ayrıntıya dön.',
  practice:'Metindeki ilgili cümleyi işaretleyerek seçeneği birebir kanıtla.',
  trap:'Metinden desteklenmeyen, aşırı genişletilmiş bir yargı yardımcı düşünce olamaz.'
 };
 if(s.includes('kapsam')||s.includes('kosul')||s.includes('kavramsal ayrim'))return {
  skill:'Kapsam ve koşul',
  diagnostic:'“Her”, “yalnızca”, “bazen”, “ancak” gibi sınırlayıcı sözcükleri işaretle.',
  practice:'Savı, geçerli olduğu koşulla birlikte kur; kesin ifadeleri yeniden sınırla.',
  trap:'Koşullu bir yargıyı bütün durumlarda geçerliymiş gibi okumak çeldiricidir.'
 };
 if(s.includes('cikarim')||s.includes('ortuk'))return {
  skill:'Çıkarım ve örtük anlam',
  diagnostic:'Yazarın açıkça söylediği ile kanıtlardan güvenle çıkarılabileni ayır.',
  practice:'Çıkarımı destekleyen iki metin ipucunu not al ve aralarında bir gerekçe kur.',
  trap:'Dış bilgiyi veya sezgini kanıt gibi kullanma.'
 };
 if(s.includes('akisi bozan')||s.includes('paragrafta yapi'))return {
  skill:'Paragrafta yapı',
  diagnostic:'Cümleler arasında konu ve gönderme zincirini izle; zinciri koparan cümleyi belirle.',
  practice:'Sorunlu cümle çıkarıldığında önceki ve sonraki cümlenin akışını sesli oku.',
  trap:'Tek başına doğru bir cümle paragrafın düşünce akışına uygun olmak zorunda değildir.'
 };
 return {
  skill:raw,
  diagnostic:'Kökün istediği beceriyi ve paragrafın ana savını ayrı ayrı belirt.',
  practice:'Metindeki kanıtı işaretle; beş seçeneği aynı ölçütle karşılaştır.',
  trap:'Metinde bulunmayan kesin bilgi, örnek–sav karışıklığı ve kapsam kaymalarına dikkat et.'
 };
}
export function paragraphRecoveryCoaching(q:ParagrafDetailedSolution,status:'YANLIŞ'|'BOŞ',reason:OpticalRecoveryReason|null){
 const strategy=paragraphSkillStrategy(q.teaching?.skill||q.topic);
 const reasonInstruction=reason?OPTICAL_RECOVERY_REASONS[reason].instruction:
  status==='BOŞ'
   ?'Boş bırakma nedenini belirtmek istersen seç. Henüz nedenini bilmiyorsan önce kökü ve metni yeniden incele.'
   :'Bu yanlışın nedenini kesin olarak bilmiyoruz; önce seçtiğin şıkkın metne dayanağını kontrol et.';
 const firstProbe=status==='BOŞ'
  ?'Çözümü açmadan önce A–E arasından geçici bir cevap seç; metinden en az bir kanıt belirt.'
  :'Seçtiğin yanlış seçeneğin metinde hangi sözle desteklendiğini sandığını not al; sonra karşı kanıtı bul.';
 return {
  ...strategy,reasonInstruction,firstProbe,
  evidenceHint:q.teaching.thesis,contextBoundary:q.teaching.boundary,
  verify:'Çözümü kapatıp aynı beceriyi farklı bir soruda yardım almadan tekrar dene. İkinci denemedeki doğru cevap, tek başına kalıcı öğrenme göstergesi değildir.',
  blankFirst:status==='BOŞ'
 };
}
export function normalizeOpticalSelfCheck(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const x=value as Record<string,unknown>;
 if(typeof x.answer!=='string'||!/^[A-E]$/.test(x.answer))return null;
 if(x.evidence!==undefined&&(typeof x.evidence!=='string'||x.evidence.length>500))return null;
 return {answer:x.answer as OpticalSelfCheck['answer'],evidence:typeof x.evidence==='string'?x.evidence.trim():''};
}
