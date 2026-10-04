export const FIRST_30_DAYS=[
  {range:'1–3. gün',title:'Başlangıç fotoğrafını çıkar',text:'Çalışma düzeni, hedef, mevcut performans, tekrar alışkanlığı ve ihtiyaç alanların ölçülür.'},
  {range:'4–7. gün',title:'Kişisel planını kur',text:'Günlük kapasiten, ders önceliklerin ve hedeflerine göre uygulanabilir bir çalışma akışı oluşturulur.'},
  {range:'8–14. gün',title:'Uygula ve veri üret',text:'Görev, soru, süre, doğru–yanlış–boş ve çalışma davranışların kaydedilmeye başlar.'},
  {range:'15–21. gün',title:'Tekrar ve yanlış döngüsünü çalıştır',text:'Geciken tekrarlar, yanlış sorular ve bilgi hâkimiyeti durumları görünür hâle gelir; plan buna göre güncellenir.'},
  {range:'22–30. gün',title:'Yeniden ölç ve yönünü netleştir',text:'İlk ay verisi karşılaştırılır; güçlü gelişen alanlar, müdahale gereken noktalar ve sonraki ayın ana hedefleri belirlenir.'}
] as const;

export const KEKS_GUARANTEES=[
  {title:'Ölçmeden plan yok',text:'Planın yalnız beyana göre değil, sisteme kaydedilen performans ve çalışma davranışı verilerine göre şekillenir.'},
  {title:'Kaçan görev kaybolmaz',text:'Tamamlanmayan işler kapasiteye göre yeniden dağıtılır; yalnızca ertesi güne yığılmaz.'},
  {title:'Tekrar görünür kalır',text:'Geciken tekrarlar ve yanlış sorular takip döngüsünde yeniden önüne gelir.'},
  {title:'Gelişim açıklanabilir olur',text:'Koç ve öğrenci yalnız bir puan değil; neden, değişim, risk sinyali ve önerilen aksiyonu görür.'}
] as const;

export const MARKETING_FAQ=[
  ['KEKS Akademi tam olarak nedir?','KEKS; ölçüm, kişisel planlama, uygulama takibi, yanlış soru yönetimi, tekrar, gelişim raporlama ve koç aksiyonlarını tek sistemde birleştiren eğitim ve koçluk platformudur.'],
  ['İlk 30 günde kesin net artışı olur mu?','KEKS belirli bir net, puan veya sıralama sonucu garanti etmez. İlk 30 günün amacı çalışma düzenini ölçülebilir hâle getirmek, kişisel sistemi kurmak ve sonraki müdahaleler için güvenilir veri oluşturmaktır.'],
  ['Aylık paketi istediğim zaman iptal edebilir miyim?','Aylık paket her ay yenilenir. Yenileme öncesinde iptal talebi verebilirsiniz. Güncel iptal ve iade koşulları İptal & İade sayfasında yer alır.'],
  ['3, 6 ve 12 aylık paketlerin farkı nedir?','Temel KEKS çalışma mantığı aynı kalır; süre uzadıkça takip döngüsü daha uzun bir gelişim dönemini kapsar ve toplam fiyat avantajı artar.'],
  ['MİZA insan koçun yerini mi alıyor?','Hayır. MİZA veri analizi, hatırlatma ve karar desteği sağlar. KEKS Partner Koç ise görüşme, takip, yorumlama ve gerekli insan müdahalesini yürütür.'],
  ['KEKS Partner Koç nedir?','KEKS ana markası ve metodolojisi içinde çalışan profesyonel koçtur. Öğrenci deneyimi, MİZA, ölçüm, planlama, tekrar ve raporlama KEKS Akademi altyapısıyla yürütülür.'],
  ['Hangi eğitim ve sınav grupları destekleniyor?','İlkokul, ortaokul, LGS, lise, YKS/mezun, KPSS/EKPSS, DGS, ALES, YDS/YÖKDİL, AGS/YDS ve AGS/ÖABT grupları için farklılaştırılmış planlar bulunur.'],
  ['Paket seçmeden önce görüşebilir miyim?','Evet. Sizi Arayalım formunu doldurabilir veya sayfadaki WhatsApp butonundan doğrudan KEKS Akademi ile iletişime geçebilirsiniz.']
] as const;

export const COACHING_COMPARISON=[
  {feature:'Başlangıç fiyatı',standard:'Hizmet sağlayıcıya göre değişir',keks:'Düzeye göre indirimli ilk ay'},
  {feature:'Kişiye özel çalışma planı',standard:'Var',keks:'Var'},
  {feature:'Günlük görev ekranı',standard:'Koça göre değişir',keks:'Var'},
  {feature:'Kaçan görevleri kapasiteye göre yeniden dağıtma',standard:'Genellikle manuel',keks:'Var'},
  {feature:'0–1–3–7–14–28 tekrar motoru',standard:'Genellikle manuel',keks:'Var'},
  {feature:'Yanlış soru bankası ve tekrar döngüsü',standard:'Genellikle ayrı takip',keks:'Var'},
  {feature:'Deneme, net ve konu hâkimiyeti analizi',standard:'Değişken',keks:'Var'},
  {feature:'MİZA yapay zekâ karar desteği',standard:'Genellikle yok',keks:'Var'},
  {feature:'Veli gelişim görünümü',standard:'Değişken',keks:'Var'},
  {feature:'Aylık gelişim raporu',standard:'Değişken',keks:'Var'},
  {feature:'Koça açıklanabilir aksiyon önerileri',standard:'Genellikle manuel',keks:'Var'}
] as const;
