/** Soru türü odaklı, kanıttan bağımsız ezber yerine okuma eylemini öğreten yönlendirme.
 * Bu katalog özgün basılı soru metinlerini değiştirmez veya yeni soru varmış gibi davranmaz.
 */
export type GuidedReading={skill:string;focus:string;hints:[string,string,string];selfCheck:string};
const GUIDE:Record<string,Omit<GuidedReading,'skill'>>={
 'ana düşünce':{
  focus:'Bütün paragrafı kapsayan tek ana yargıyı bul; örnek ayrıntıyı ana düşünce sanma.',
  hints:['İlk ve son cümlenin ortak kavramını bul.','Yazarın asıl savını kendine tek cümleyle anlat.','Bir örnekle sınırlanan veya metinden daha kesin konuşan seçenekleri ele.'],
  selfCheck:'Seçtiğin şık paragrafın bütününe uyuyor mu, yoksa yalnız bir örneği mi anlatıyor?'
 },
 'yardımcı düşünce':{
  focus:'Metnin desteklediği özel bir yargıyı bul; ana düşünceyi yardımcı ayrıntıyla karıştırma.',
  hints:['Soru kökündeki olumlu/olumsuz ifadeyi işaretle.','Şıkkı destekleyen açık cümleyi metinden bul.','Bir seçenek metinde geçmiyorsa onu kişisel bilginle doğrulama.'],
  selfCheck:'Bu şıkkın metindeki tam dayanağını gösterebiliyor musun?'
 },
 'örtük anlam':{
  focus:'Açıkça söylenmeyen, fakat metnin kanıtlarından çıkabilen sınırlı sonucu bul.',
  hints:['Doğrudan verilen iki bilgiyi belirle.','Bu iki bilgiden zorunlu çıkan ilişkiyi düşün.','Metinde bulunmayan kesinlik, zaman veya neden-sonuç ekleyen seçenekleri ele.'],
  selfCheck:'Bu çıkarım için metne yeni bir varsayım eklemen gerekiyor mu?'
 },
 'çıkarım':{
  focus:'Yalnız metinden desteklenebilen sonucu işaretle; dış bilgi ve tahmin ekleme.',
  hints:['Metnin temel savını yaz.','Seçtiğin şıkla sav arasında doğrudan mantıksal bağ ara.','Her, daima, sadece gibi kesinlikleri ayrıca denetle.'],
  selfCheck:'Metinde buna karşılık gelen kanıt tam olarak nerede?'
 },
 'ulaşılamaz yargı':{
  focus:'Bu olumsuz kökte diğer dört seçeneği kanıtlayıp dayanağı olmayanı ayır.',
  hints:['Kökte ulaşılamaz dendiğini yeniden oku.','Desteklenen seçenekleri metinden alıntıyla ele.','Geriye kalanı metne dışarıdan bilgi eklemeden değerlendir.'],
  selfCheck:'İşaretlediğin yargıyı metinden kanıtlamaya çalıştığında gerçekten kanıt bulamıyor musun?'
 },
 'kavramsal ayrım':{
  focus:'Metnin karşılaştırdığı iki kavram ve değerlendirme ölçütünü belirle.',
  hints:['Yazarın karşılaştırdığı iki yaklaşımı ayrı yaz.','Farkı yaratan koşul veya gerekçeyi bul.','Metinde konuşulmayan kişi, tarih veya teknik ayrıntıları ele.'],
  selfCheck:'Seçtiğin şık iki kavram arasındaki gerçek ölçüt farkını gösteriyor mu?'
 },
 'başlık':{
  focus:'Metni tümüyle kapsayan, ne fazla dar ne de fazla geniş başlığı seç.',
  hints:['Metni tek cümlede özetle.','Tek bir örneği başlık sanma.','Metinden daha geniş, kesin veya konu dışı önerileri ele.'],
  selfCheck:'Bu başlığı gören kişi metnin genelini doğru tahmin edebilir mi?'
 },
 'kapsam ve koşul':{
  focus:'Yazarın hangi genellemeyi sınırladığına ve hangi koşulu eklediğine dikkat et.',
  hints:['Yazarın itiraz ettiği kesin ifadeyi bul.','Ancak, oysa, yalnızca, koşuluyla gibi geçişleri işaretle.','Temkinli savı, eleştirilen aşırı savla karıştırma.'],
  selfCheck:'Yazar bu iddianın hangi durumda geçerli olmadığını söylüyor?'
 },
 'düşünceyi temellendirme':{
  focus:'Yazarın savını hangi kanıt ve örnekleme yöntemiyle açıkladığını belirle.',
  hints:['Ana iddiayı bir cümlede yaz.','İddiayı destekleyen örneği veya karşılaştırmayı bul.','Gerçekte kullanılmayan sayı, tanık, kronoloji yöntemlerini ele.'],
  selfCheck:'Parçadan gerçekten hangi kanıtı gösterebilirsin?'
 },
 'eleştirel tutum':{
  focus:'Yazarın onayladığı çözümle açıkça eleştirdiği yaklaşımı ayır.',
  hints:['Olumsuzlanan yaklaşımı metinden bul.','Yazarın yerine önerdiği ölçüt veya koşulu ayır.','Eleştirilen ile benimsenen görüşü tersine çeviren şıkları ele.'],
  selfCheck:'Bu düşünceyi yazar mı savunuyor, yoksa buna mı karşı çıkıyor?'
 },
 'yazarın amacı':{
  focus:'Metnin ne anlattığından çok yazarın niçin bunu anlattığını saptamaya çalış.',
  hints:['Yazarın tartışmayı başlatan düşüncesini bul.','Hangi düşünceyi değiştirmek veya düşündürmek istediğini belirle.','Bütün düşünceleri yok sayma veya kesin hüküm gibi aşırı amaçları ele.'],
  selfCheck:'Yazar metnin sonunda okurun hangi düşüncesini değiştirmeye çalışıyor?'
 },
 'cümle tamamlama':{
  focus:'Boşluğun öncesi ve sonrası arasındaki anlam, bağlaç ve gönderim ilişkisini koru.',
  hints:['Boşluğun hemen öncesiyle sonrasındaki anahtar kavramı işaretle.','Ancak, çünkü, bu nedenle gibi bağlaçları ve zamirleri denetle.','Konuca ilgili olsa da düşünce akışını kıran cümleleri ele.'],
  selfCheck:'Seçeneği boşluğa koyup iki cümleyi art arda okuduğunda mantık ve dil akıyor mu?'
 },
 'paragrafı ikiye bölme':{
  focus:'İkinci paragrafın başladığı yerde konu, bakış açısı veya örnekleme yönü değişir.',
  hints:['Her cümlenin anahtar kavramını kısa not et.','Konu değişimini gösteren ilk cümleyi bul.','Sadece çünkü, ancak gibi bir bağlaca dayanarak karar verme.'],
  selfCheck:'Böldüğün yerde ikinci paragraf kendi içinde anlamlı bir bütün oluşturuyor mu?'
 },
 'cümle sıralama':{
  focus:'Karışık cümleleri konu bütünlüğü, gönderim ve mantıksal ilerlemeyle sırala.',
  hints:['Tanıtıcı ve kendinden önce açıklama gerektirmeyen başlangıç cümlesini bul.','Bu, söz konusu, böylece gibi gönderimlerin öncülünü bul.','Neden-sonuç, örnek-genelleme ve zaman bağlarını kontrol et.'],
  selfCheck:'Her cümlenin önceki cümleyle kanıtlanabilir bir bağı var mı?'
 },
 'cümle oluşturma':{
  focus:'Verilen karışık parçaları anlamlı, kurallı ve bağdaşık bir cümleye dönüştür.',
  hints:['Yüklemi, özneyi ve tamlamaları belirle.','Sözcükler arasında dil bilgisel bağları kur.','Anlamı bozmadan kalan tek söz dizimini kontrol et.'],
  selfCheck:'Ortaya çıkan cümlede ögeler hem dil bilgisel hem anlamsal olarak uyumlu mu?'
 }
};
export function paragrafReadingGuide(topic:string):GuidedReading{
 const key=topic.toLocaleLowerCase('tr-TR').trim();
 const fallback:Omit<GuidedReading,'skill'>={
  focus:'Soru kökünü ve metnin sav–örnek–sınır ilişkisini birlikte değerlendir.',
  hints:['Soru kökündeki isteneni kendi cümlenle açıkla.','Paragraftan somut kanıt bul.','Her şıkkı bu kanıtla ve metnin sınırıyla karşılaştır.'],
  selfCheck:'Seçiminin dayanağını metinden gösterebiliyor musun?'
 };
 return {skill:topic,...(GUIDE[key]||fallback)};
}
export function opticalRecoveryPriority(input:{wrong:number;blank:number;reasons?:string[]}){
 const timeBlanks=(input.reasons||[]).filter(x=>x==='SURE').length;
 // Yanlış, bilinmeyen boş ve süre nedeniyle boş aynı teşhis değildir.
 return input.wrong*3+Math.max(0,input.blank-timeBlanks)*2+timeBlanks;
}
export function opticalReasonAction(reason:string|null,blank:boolean){
 if(reason==='SURE')return 'Önce süre sınırı olmadan soruyu çöz, kanıtı göster; ardından yeni bir soruda zaman tut.';
 if(reason==='KARARSIZLIK')return 'En güçlü iki şıkkı yan yana yaz; her biri için metinden kanıt göster ve eksik kanıtı belirle.';
 if(reason==='SORU_KOKU')return 'Soru kökündeki olumlu/olumsuz yüklemi işaretle; sorunun istediğini bir cümleyle tekrar et.';
 if(reason==='BILGI_EKSIKLIGI')return 'Önce soru türüne ait okuma kuralını öğren; çözümü görmeden bir örnekte uygula.';
 if(reason==='YONTEM_BILMEME')return 'Soru türünün üç adımlı çözüm stratejisini sırayla uygula ve her adımın kanıtını yaz.';
 if(reason==='DIKKAT')return 'Kökü ikinci kez oku, anahtar bağlaçları işaretle ve işaretlediğin seçeneği tekrar kontrol et.';
 if(reason==='UNUTMA')return 'Kuralı notlara bakmadan hatırla; kısa örnekle doğrula ve sonraki tekrar gününe kadar sakla.';
 return blank
  ?'Bu soruyu boş bırakma nedenin kesin bilinmiyor. Süresiz, cevabı görmeden yeniden dene; takıldığın adımı not et.'
  :'Seçtiğin şıkla metindeki kanıtı karşılaştır; yanlış seçeneği eleyen ifadeyi kendi cümlenle açıkla.';
}
