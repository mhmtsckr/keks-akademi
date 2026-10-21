/** 
 * Subject-aware *learning method* suggestions, never alleged solutions to private uploads.
 * An identified subject alone is not proof of a specific topic, official outcome or mastery.
 */
export type BankLearningReason='WRONG'|'BLANK'|'MARKED';
export type LearningFamily='MATHEMATICS'|'TURKISH'|'LITERATURE'|'HISTORY'|'GEOGRAPHY'|'SCIENCE'|
 'ENGLISH'|'PHILOSOPHY'|'RELIGION'|'EDUCATION'|'LEGISLATION'|'OTHER';
export type RecoveryPlan={
  status:BankLearningReason;statusLabel:string;family:LearningFamily;method:string;
  diagnosticQuestion:string;steps:string[];reviewDays:readonly number[];
  needsTopicConfirmation:boolean;contentStatus:'GUIDED_IF_AVAILABLE'|'METHOD_ONLY';
  note:string;
};
export const PERSONAL_RECOVERY_DAYS=[0,1,3,7,14,28] as const;
function norm(s:string){return s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/\s+/g,' ').trim();}
export function classifyRecoveryFamily(subject:string):LearningFamily{
 const s=norm(subject);
 if(/matematik|geometri/.test(s))return 'MATHEMATICS';
 if(/turk dili ve edebiyat|edebiyat/.test(s))return 'LITERATURE';
 if(/turkce|dil ve anlatim|paragraf/.test(s))return 'TURKISH';
 if(/tarih|inkilap/.test(s))return 'HISTORY';
 if(/cografya|sosyal bilgiler/.test(s))return 'GEOGRAPHY';
 if(/fen bilimleri|fizik|kimya|biyoloji/.test(s))return 'SCIENCE';
 if(/ingilizce|almanca|fransizca|yabanci dil/.test(s))return 'ENGLISH';
 if(/felsefe|mantik|psikoloji|sosyoloji/.test(s))return 'PHILOSOPHY';
 if(/din kulturu|din bilgisi|ahlak bilgisi/.test(s))return 'RELIGION';
 if(/egitim bilimleri|ogretim|olcme ve degerlendirme/.test(s))return 'EDUCATION';
 if(/mevzuat|hukuk|anayasa/.test(s))return 'LEGISLATION';
 return 'OTHER';
}
const METHODS:Record<LearningFamily,{
 name:string;check:string;recall:string;transfer:string
}>={
 MATHEMATICS:{
  name:'Çözüm modeli ve işlem kontrolü',check:'Verilenleri, bilinmeyeni ve doğru işlem modelini ayrı yazabildim mi?',
  recall:'İşlem kuralını ve birim/işaret kontrolünü notlara bakmadan açıkla.',
  transfer:'Aynı alt becerinin sayıları değiştirilmiş farklı bir sorusunu bağımsız çöz.'
 },
 TURKISH:{
  name:'Metinsel kanıt ve seçenek eleme',check:'Sorunun kökünü ve her seçeneği eleyen metin kanıtını bulabiliyor muyum?',
  recall:'Soru kökünü ve metnin ana savını kendi cümlelerinle söyle.',
  transfer:'Başka bir metinde aynı soru türünü çöz; kapsam kayması ve aşırı genellemeyi denetle.'
 },
 LITERATURE:{
  name:'Dönem–yazar–eser ve bağlam',check:'Yazar, eser, tür ve dönem bilgisini birbirine karıştırmadan eşleştirdim mi?',
  recall:'Konuya uygun temel kavramları ve dönem–eser bağlantısını hatırla; örneklerin kaynağını doğrula.',
  transfer:'Farklı bir metin ya da eser üzerinden aynı edebî özelliği gerekçelendir.'
 },
 HISTORY:{
  name:'Kanıt, kronoloji ve neden–sonuç',check:'Olayın öncesini, sonrasını ve dayanağını doğru ayırdım mı?',
  recall:'Olayları zaman çizelgesine diz; sebep ile sonucu kaynakla kontrol et.',
  transfer:'Aynı döneme ait farklı bir belge veya olaydan çıkarım yap.'
 },
 GEOGRAPHY:{
  name:'Harita, konum ve süreç ilişkisi',check:'Konum, ölçek, grafik veya doğal sürecin etkisini doğru okudum mu?',
  recall:'Kavramı harita veya basit bir neden–sonuç şemasında göster.',
  transfer:'Farklı bir bölge, grafik veya harita üzerinden aynı ilişkiyi yorumla.'
 },
 SCIENCE:{
  name:'Kavram, değişken ve bilimsel kanıt',check:'Veriyle yorumu, bağımsız ve bağımlı değişkeni ayırabildim mi?',
  recall:'Kuralı ve koşullarını açıkla; formül varsa değişkenleri ve birimleri belirt.',
  transfer:'Farklı düzenek, grafik veya deneyde aynı kuralı yeniden sınayarak çöz.'
 },
 ENGLISH:{
  name:'Bağlam, dil bilgisi ve çeldirici',check:'Cümlenin zamanını, öznesini, anlamını ve bağlaç ipucunu belirledim mi?',
  recall:'Hedef kalıbı kendi örnek cümlende doğru bağlamla kullan.',
  transfer:'Benzer ama farklı bağlamda bir yeni cümle/tamamlama sorusunu yanıtla.'
 },
 PHILOSOPHY:{
  name:'Öncül–sonuç ve kavram ayrımı',check:'Yazarın savı ile örneği; öncül ile sonucu ayırabildim mi?',
  recall:'Kavramın tanımını ve karşı kavramdan farkını bir örnekle açıkla.',
  transfer:'Farklı bir argümanda geçerli çıkarımı ve dayanağını seç.'
 },
 RELIGION:{
  name:'Kavram, bağlam ve gerekçe',check:'Soru kökündeki değer veya kavramı bağlamına uygun yorumladım mı?',
  recall:'İlgili kavramın anlamını ve hangi bağlamda kullanıldığını kendi cümlenle anlat.',
  transfer:'Farklı bir örnek olayda aynı ilkeyi gerekçesiyle ayırt et.'
 },
 EDUCATION:{
  name:'Tanım, sınıf içi örnek ve karşı-örnek',check:'Öğretim/ölçme kavramının ayırt edici ölçütünü belirledim mi?',
  recall:'Kavramı tanımla ve benzer kavramdan farkını bir sınıf örneğiyle açıkla.',
  transfer:'Yeni bir eğitim/ölçme senaryosunda hangi ilkenin uygulandığını bul.'
 },
 LEGISLATION:{
  name:'Madde, kapsam ve güncellik denetimi',check:'Hükmün koşulunu, istisnasını ve güncel kaynağını teyit ettim mi?',
  recall:'İlgili mevzuatın güncel maddesini resmî kaynaktan kontrol ederek koşulları özetle.',
  transfer:'Farklı bir olayda aynı maddenin uygulanabilirliğini kontrol et; eski metne dayanma.'
 },
 OTHER:{
  name:'Konu doğrulama ve kanıta dayalı tekrar',check:'Önce hangi alt beceride zorlandığımı doğruladım mı?',
  recall:'Ders ve alt konuyu kesinleştirmeden özel bir kural veya cevap varsayma.',
  transfer:'Koçun belirlediği aynı alt beceriden yeni bir soruyla hatırlamayı denetle.'
 }
};
const SPECIFIC_TURKISH:readonly {pattern:RegExp;name:string;check:string;transfer:string}[]=[
 {pattern:/cumle tamamlama/,name:'Cümle tamamlama: anlam ve bağlaç kontrolü',
  check:'Boşluktan önce ve sonra gelen anlam ilişkisini, zamiri ve bağlacı ayrı ayrı denetledim mi?',
  transfer:'Yeni bir metindeki boşluğu önce kendi ifadenle tamamla, sonra seçenekleri ele.'},
 {pattern:/ikiye bolme|paragrafi bolme/,name:'Paragrafı ikiye bölme: konu dönüşümü',
  check:'İkinci paragrafın başladığı cümlede yeni konu veya bakış açısına geçiş var mı?',
  transfer:'Yeni beş cümlelik metinde konu devamlılığının kırıldığı sınırı işaretle.'},
 {pattern:/cumle siralama|cumle olusturma|karisik metin|paragrafta yapi/,name:'Cümle sıralama: gönderim ve bağdaşıklık',
  check:'Zamirlerin göndergelerini, bağlaçları ve ilk–son cümle koşullarını doğruladım mı?',
  transfer:'Farklı bir karışık metni önce zamir ve bağlaç ipuçlarıyla sırala.'}
];
export function buildSubjectRecoveryPlan(input:{
 subject:string;topic:string;bankReason?:string|null;classificationConfidence?:number|null;
 hasGuidedLesson?:boolean
}):RecoveryPlan{
 const status:BankLearningReason=input.bankReason==='BLANK'?'BLANK':input.bankReason==='MARKED'?'MARKED':'WRONG';
 const family=classifyRecoveryFamily(input.subject);
 const base=METHODS[family],topic=norm(input.topic||'');
 const specific=family==='TURKISH'?SPECIFIC_TURKISH.find(x=>x.pattern.test(topic)):null;
 const diagnosticQuestion=specific?.check||base.check;
 const needsTopicConfirmation=!input.topic.trim()||topic==='genel / karma'||topic==='paragraf'||
   (input.classificationConfidence!=null&&input.classificationConfidence<0.65);
 const first=status==='BLANK'
  ?'Boş bırakma nedenini belirle: bilgi, zaman, soru kökü, özgüven veya yöntem. Bilmiyorsan “belirleyemedim” de; bunu yanlış cevap sayma.'
  :status==='MARKED'
  ?'İşaretleme nedenini seç: emin olamama, zorlanma veya yeniden görme isteği.'
  :'Yanlış seçimi ve hangi adımda koptuğunu açıklamaya çalış; tahmini gerekçeyi kesin doğru sayma.';
 const method=specific?.name||base.name;
 return {
  status,statusLabel:status==='BLANK'?'Boş bırakılan soru':status==='MARKED'?'İşaretlenen soru':'Yanlış yapılan soru',
  family,method,diagnosticQuestion,
  steps:[
   first,
   needsTopicConfirmation?'Dersi ve alt beceriyi öğrenci/koç olarak doğrula; düşük güvenli sınıflandırmadan resmî kazanım üretme.':
     input.subject+' · '+input.topic+' becerisinde '+base.recall,
   input.hasGuidedLesson
    ?'Ayrı hazırlanmış KEKS mikro dersini çalış; alıştırma başarısı özgün soruda başarı değildir.'
    :'Bu alt beceriye özel onaylı çözümlü örnek yoksa öğretmen/koçtan örnek iste; yüklenen sorunun çözümünü uydurma.',
   specific?.transfer||base.transfer,
   'Özgün soruyu notlara bakmadan yeniden çöz; sonraki bağımsız 0–1–3–7–14–28 tekrarında sonucu kaydet.'
  ],
  reviewDays:PERSONAL_RECOVERY_DAYS,
  needsTopicConfirmation,
  contentStatus:input.hasGuidedLesson?'GUIDED_IF_AVAILABLE':'METHOD_ONLY',
  note:'Öz değerlendirme veya yönlendirmeli mikro ders, tek başına kalıcı öğrenme değildir. Resmî kazanım ve doğru cevap doğrulaması ayrıca gereklidir.'
 };
}
