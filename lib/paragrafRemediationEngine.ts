/** KEKS Paragraf: evidence-led learning AFTER an incorrect or unanswered answer.
 * This is a formative learning plan, not a diagnosis or claim of mastery.
 */
export const BLANK_CAUSES={
 SURE_YETMEDI:'Sürem yetmedi',
 KARARSIZ_KALDIM:'İki seçenek arasında kararsız kaldım',
 METNI_ANLAMADIM:'Metnin anlamını kuramadım',
 YONTEM_BILMIYORUM:'Bu tür sorunun yöntemini bilmiyorum',
 HENUZ_BILMIYORUM:'Neden boş bıraktığımı henüz bilmiyorum'
} as const;
export type BlankCause=keyof typeof BLANK_CAUSES;
export type MissedKind='YANLIŞ'|'BOŞ';

export function isBlankCause(v:unknown):v is BlankCause{
 return typeof v==='string'&&Object.prototype.hasOwnProperty.call(BLANK_CAUSES,v);
}
export function canonicalParagrafSkill(topic:string){
 const s=String(topic||'').toLocaleLowerCase('tr-TR').replace(/\s+/g,' ').trim();
 if(/cümle tamamlama|boşlu[kğ]a.*cümle/.test(s))return 'Cümle tamamlama';
 if(/ikiye bölme|iki paragrafa/.test(s))return 'Paragrafı ikiye bölme';
 if(/cümle sıralama|karışık.*cümle|cümlelerden.*paragraf/.test(s))return 'Cümle sıralama';
 if(/akışı bozan|anlam akışını bozan/.test(s))return 'Akışı bozan cümle';
 if(/ana düşünce|ana fikir/.test(s))return 'Ana düşünce';
 if(/yardımcı düşünce/.test(s))return 'Yardımcı düşünce';
 if(/ulaşılamaz|çıkarılamaz/.test(s))return 'Ulaşılamaz yargı';
 if(/örtük/.test(s))return 'Örtük anlam';
 if(/kavramsal ayrım/.test(s))return 'Kavramsal ayrım';
 if(/kapsam|koşul/.test(s))return 'Kapsam ve koşul';
 if(/başlık/.test(s))return 'Başlık';
 if(/düşünceyi temellendirme/.test(s))return 'Düşünceyi temellendirme';
 if(/eleştirel|eleştirilen/.test(s))return 'Eleştirel tutum';
 if(/yazarın amacı|yazılış amacı/.test(s))return 'Yazarın amacı';
 if(/metinler arası/.test(s))return 'Metinler arası çıkarım';
 if(/çıkarım|yorum/.test(s))return 'Çıkarım';
 return 'Paragraf yorumlama';
}
type SkillGuide={
 goal:string;
 steps:readonly [string,string,string];
 check:string;
 trap:string;
};
const DEFAULT:SkillGuide={
 goal:'Soru kökünü, metnin ana savını ve seçeneklerdeki kanıtı birbirine bağlamak',
 steps:[
  'Soru kökünde istenen yargıyı kendi sözlerinle yeniden kur.',
  'Paragrafta o yargıya dayanak olan cümleyi bul ve altını çiz.',
  'Her şıkkı metinle karşılaştır; metinde olmayan kesinlik veya bağlam ekleme.'
 ],
 check:'Seçtiğin ve elediğin şık için ayrı ayrı bir metin kanıtı gösterebiliyor musun?',
 trap:'Kulağa doğru gelmesi bir ifadenin metinden çıkarıldığını göstermez.'
};
const GUIDES:Record<string,SkillGuide>={
 'Cümle tamamlama':{
  goal:'Boşluk öncesi–sonrası düşünce bağını, gönderimleri ve bağlaç işlevini çözmek',
  steps:[
   'Boşluğun önündeki cümlede anahtar kavramı ve yargının yönünü belirle.',
   'Boşluktan sonraki bağlaç ve zamirlerin önceki cümleden ne beklediğini açıkla.',
   'Her şıkkı boşluğa koyup iki yönden oku: anlam, zaman ve kişi gönderimleri kopuyor mu?'
  ],
  check:'Seçenekten önceki ve sonraki cümle arasındaki mantıksal geçişi bir cümlede açıkla.',
  trap:'Yalnız boşluğun önüne uyan bir cümle, boşluktan sonra ilişkiyi bozabilir.'
 },
 'Paragrafı ikiye bölme':{
  goal:'Bir düşüncenin tamamlandığı ve yeni bir düşüncenin başladığı sınırı yakalamak',
  steps:[
   'Numaralı cümlelerde her cümlenin işlevini belirle: giriş, gerekçe, örnek, sonuç.',
   'Konu ya da bakış açısının ilk değiştiği cümleyi işaretle.',
   'Önerdiğin sınırın iki tarafını bağımsız paragraf olarak oku; bağlantı ve bütünlük korunuyor mu?'
  ],
  check:'İkinci paragrafı başlatan cümle hangi yeni odağı getiriyor? Önceki cümle neden ilk paragrafta kalmalı?',
  trap:'Sadece yeni bir örnek verilmesi her zaman yeni paragraf başladığını göstermez.'
 },
 'Cümle sıralama':{
  goal:'Cümleleri giriş, gönderim ve sonuç ilişkilerine göre tutarlı bir paragraf hâline getirmek',
  steps:[
   'Önce kendinden önce bir ifade gerektirmeyen giriş cümlesini ayır.',
   '“Bu, böyle, ancak, dolayısıyla” gibi gönderim ve bağlaçların hangi cümleyi izlediğini bul.',
   'Olası dizilişi baştan sona oku; zaman, özne ve neden-sonuç zincirini denetle.'
  ],
  check:'Her cümlenin önceki cümleye hangi sözcük veya düşünceyle bağlandığını göster.',
  trap:'Tek başına anlamlı bir cümle, doğru sırada olduğu anlamına gelmez.'
 },
 'Akışı bozan cümle':{
  goal:'Metnin ortak konusu ile işlevine uymayan ayrık cümleyi gerekçelendirmek',
  steps:[
   'Paragrafın merkezindeki konuyu tek cümleyle belirt.',
   'Numaralı cümlelerin bu konuya ne eklediğini karşılaştır.',
   'Şüpheli cümleyi çıkararak önceki ve sonraki cümlenin bağını yeniden oku.'
  ],
  check:'Hangi cümleyi çıkardığında anlam zinciri belirgin biçimde güçleniyor?',
  trap:'Farklı örnek vermek, paragrafın akışını mutlaka bozmaz.'
 },
 'Ana düşünce':{
  goal:'Örnekleri kapsayan, yazarın temel ve sınırlı yargısını ayırmak',
  steps:[
   'İlk ve son yargının ortak anahtar kavramını bul.',
   'Örnekleri geçici olarak ayırıp yazarın savını tek cümleye indir.',
   'Kapsamı aşan kesin şıkları ve yalnız örneği tekrar eden şıkları ele.'
  ],
  check:'Doğru dediğin seçenek metindeki bütün örnekleri açıklıyor mu?',
  trap:'Paragraftaki dikkat çekici örnek genellikle ana düşünce değildir.'
 },
 'Ulaşılamaz yargı':{
  goal:'Kanıtlanmayan yargıyı, desteklenen yargılardan ayırmak',
  steps:[
   'Kökteki “ulaşılamaz/çıkarılamaz” olumsuzluğunu belirgin biçimde işaretle.',
   'Dört desteklenen yargının metindeki karşılıklarını bul.',
   'Kalan iddianın neden kanıtlanmadığını veya hangi sınıra aykırı olduğunu anlat.'
  ],
  check:'Elediğin seçeneklerin her biri için açık metin kanıtı gösterebiliyor musun?',
  trap:'Metinden çıkarılabilen doğru bir yargı, olumsuz kökün doğru cevabı değildir.'
 },
 'Örtük anlam':{
  goal:'Açık metin kanıtlarından koşullarını koruyan çıkarım yapmak',
  steps:[
   'Metinde açıkça verilen olguları ayır.',
   'Bu olgular birlikteyken zorunlu veya makul hangi sonuç çıkıyor, açıkla.',
   'Metnin söylemediği nedensellik ve kesinlik ekleyen şıkları ele.'
  ],
  check:'Bu çıkarım için en az bir doğrudan metin dayanağın var mı?',
  trap:'Metne dışarıdan eklenen makul bilgiler bile metnin örtük anlamı sayılamaz.'
 },
 'Yardımcı düşünce':{
  goal:'Metinde açıkça desteklenen yan yargıları ana düşünceden ayırmak',
  steps:[
   'Paragrafta verilmiş temel yargıyı belirle.',
   'Örneği, açıklamayı ve destekleyici bilgileri birbirinden ayır.',
   'Soru köküne göre şıkkın gerçekten metinde bulunup bulunmadığını kontrol et.'
  ],
  check:'Bu yardımcı yargının paragraftaki dayanak cümlesi hangisi?',
  trap:'Metnin konusuyla ilgili olması, bir seçeneğin metinde desteklendiği anlamına gelmez.'
 },
 'Kavramsal ayrım':{
  goal:'Metinde karşılaştırılan iki yaklaşımın ortak ölçütünü ve farkını bulmak',
  steps:[
   'Metinde karşılaştırılan iki kavram veya yaklaşımı işaretle.',
   'Her yaklaşımın gerekçesini ve sınırını ayrı ayrı yaz.',
   'Şıkları, farkın temel ölçütünü doğru yansıtıp yansıtmadığına göre ele.'
  ],
  check:'İki kavram hangi ölçütte ayrılıyor ve metin bu farkı nerede açıklıyor?',
  trap:'İki kavramın birlikte anılması, onların asıl karşıtlık olduğu anlamına gelmez.'
 },
 'Kapsam ve koşul':{
  goal:'Yazarın hangi yargıyı hangi koşul altında kabul ettiğini ayırt etmek',
  steps:[
   '“Ancak, yalnız, kimi zaman, koşuluyla” gibi sınırlayıcı sözleri belirle.',
   'Genel iddiayı ve bu iddianın hangi durumda değiştiğini ayrı ayrı yaz.',
   'Şıklarda sınırı kaldıran kesin genellemeleri işaretleyip ele.'
  ],
  check:'Bu yargının hangi koşul olmadan savunulamayacağını söyleyebilir misin?',
  trap:'Sınır cümlesini yok saymak, kısmen doğru bir ifadeyi yanlış genellemeye dönüştürür.'
 },
 'Düşünceyi temellendirme':{
  goal:'Savın hangi yöntem ve kanıtlarla desteklendiğini ayırt etmek',
  steps:[
   'Önce yazarın savını belirle.',
   'Yazarın örnek, karşılaştırma, tanımlama veya sayısal veriden hangisini gerçekten kullandığını bul.',
   'Kullanılmayan yöntemleri yalnız isimleri tanıdık olduğu için seçme.'
  ],
  check:'Bu paragrafta yargıyı destekleyen somut kanıt türü hangisi?',
  trap:'Bir kavramdan bahsedilmesi, o kavramın yöntem olarak kullanıldığı anlamına gelmez.'
 },
 'Çıkarım':{
  goal:'Metinle desteklenen fakat birebir söylenmemiş sonuca ulaşmak',
  steps:[
   'Metnin kesin olarak söylediği iki veya üç dayanağı belirle.',
   'Çıkarımın dayandığı koşulu kendi sözlerinle ifade et.',
   'Şıklarda yeni neden, yeni kişi veya koşulsuz hüküm ekleyen ifadeleri ele.'
  ],
  check:'Bu çıkarımı destekleyen hangi açık ifadeleri birlikte kullandın?',
  trap:'Yorum yaparken günlük bilgileri metne yeni kanıt olarak ekleme.'
 },
 'Eleştirel tutum':{
  goal:'Yazarın karşı çıktığı görüş ile savunduğu düzeltmeyi ayırt etmek',
  steps:[
   'Eleştirilen yargının geçtiği cümleyi bul.',
   'Yazarın buna karşı getirdiği gerekçeyi ve örneği işaretle.',
   'Şıklarda eleştirilen iddia yerine yazarın benimsediği görüşü sunanları ele.'
  ],
  check:'Yazar hangi görüşe neden katılmıyor, bunu metinle gösterebilir misin?',
  trap:'Metinde anılan bir düşüncenin mutlaka yazar tarafından desteklendiğini sanma.'
 },
 'Yazarın amacı':{
  goal:'Yazarın okurda gerçekleştirmek istediği düşünsel işlemi belirlemek',
  steps:[
   'Yazarın ne anlattığından ayrı olarak, bunu niçin tartıştığını sor.',
   'Metindeki örneklerin hangi temel iddiayı sorgulattığını veya desteklediğini belirle.',
   'Metinde olmayan aşırı iddialı amaç seçeneklerini ele.'
  ],
  check:'Yazar bu paragrafı yazmasaydı hangi uyarı veya düşünce eksik kalırdı?',
  trap:'Paragrafın konusu ile yazılış amacını karıştırma.'
 },
 'Metinler arası çıkarım':{
  goal:'İki metnin ortak görüşünü ve ayrıldığı koşulları kanıta dayalı karşılaştırmak',
  steps:[
   'Her metnin savını ayrı birer cümleyle yaz.',
   'İkisinin aynı gerekçeye dayandığı ve farklılaştığı noktaları karşılaştır.',
   'Şıkta bir metne ait yargının yanlışlıkla diğerine yüklenip yüklenmediğini kontrol et.'
  ],
  check:'Her iki metinden de en az bir kanıt göstererek sonuca ulaşabildin mi?',
  trap:'Birinci metnin yargısını ikinci metin de savunuyormuş gibi varsayma.'
 },
 'Başlık':{
  goal:'Metnin bütününü ve düşünce yönünü yansıtan kısa ifade seçmek',
  steps:[
   'Metnin ana kavramını ve yazarın o kavram hakkındaki yargısını belirle.',
   'Yalnız örnekleri konu alan dar başlıkları ele.',
   'Aşırı geniş veya metinde olmayan kesinliği içeren başlıkları ele.'
  ],
  check:'Başlık, yalnız bir cümleyi mi yoksa bütün metni mi karşılıyor?',
  trap:'İlgi çekici bir ifade mutlaka metnin en uygun başlığı değildir.'
 }
};
export function buildParagrafRemediation(input:{
 topic:string;status:MissedKind;blankCause?:unknown;wrongReason?:string|null;
 selectedChoice?:string|null;wrongChoiceExplanation?:string|null;
}){
 const skill=canonicalParagrafSkill(input.topic);
 const guide=GUIDES[skill]||DEFAULT;
 const cause=input.status==='BOŞ'&&isBlankCause(input.blankCause)?input.blankCause:null;
 const diagnostic=input.status==='BOŞ'?'BOŞ - nedeni öğrenci belirleyecek':'YANLIŞ - seçilen çeldirici incelenecek';
 const firstStep=input.status==='BOŞ'
  ?cause==='SURE_YETMEDI'
   ?'Süre sınırı olmadan çöz; yöntemi açıklayabildikten sonra benzer soruyu süre tutarak dene.'
   :cause==='KARARSIZ_KALDIM'
    ?'Kararsız kaldığın iki şıkkın her birini metindeki farklı kanıtlarla karşılaştır.'
    :cause==='METNI_ANLAMADIM'
     ?'Paragrafı iki kez oku ve her bölümün ne söylediğini kısa bir cümleyle özetle.'
     :cause==='YONTEM_BILMIYORUM'
      ?'Önce aşağıdaki soru türü yöntemini incele ve kendi cümlenle yeniden anlat.'
      :'Soruyu boş bırakma nedenini varsayma; önce hangi aşamada zorlandığını bul.'
  :input.wrongReason==='SORU_KOKU'
   ?'Soru kökünü yeniden oku ve olumsuz/olumlu yönünü işaretle.'
   :input.wrongReason==='SURE'
    ?'Süre olmadan çözüm mantığını kur; sonraki farklı soruda süreyi ölç.'
    :input.wrongReason==='DIKKAT'
     ?'Metinde işaretlediğin kanıtı seçtiğin şıkla sözcük sözcük karşılaştır.'
     :'Seçtiğin şıkkın neden elendiğini metindeki ifadeyle açıkla.';
 return {
  skill,goal:guide.goal,diagnostic,blankCause:cause,
  lessonSteps:[firstStep,...guide.steps],
  errorEvidence:input.status==='YANLIŞ'?(input.wrongChoiceExplanation||null):null,
  trap:guide.trap,selfCheck:guide.check,
  transferTask:'Şimdi aynı beceriden daha önce görmediğin, onaylı farklı bir soruyu çöz; asıl kalıcılık bununla ölçülür.',
  repeatDays:[0,1,3,7,14,28] as const,
  note:'Bu plan öğrenme yönergesidir. Açıklamayı okumak, aynı soruyu ikinci kez doğru yapmak veya öz bildirim tek başına konu hâkimiyeti sayılmaz.'
 };
}
