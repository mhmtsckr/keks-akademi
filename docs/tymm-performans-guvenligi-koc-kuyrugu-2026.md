# KEKS Akademi — Performans Görevleri: Eksik Kalan Güvenlik ve Koç İş Kuyruğu

**12 Ekim 2026.** Bu sürüm yeni ders veya soru eklemez. Mevcut **46 mikro ders / 184 alıştırma / 6 ilk ve 6 gecikmeli bağımsız performans görevindeki** operasyon ve veri güvenilirliği eksiklerini ele alır.

## Tamamlanan teknik güvenceler

- İlk görevde koçun dört rubrik puanının toplamı 8 puanlık sonuçla aynı değilse kayıt **gecikmeli ölçüm için geçerli kanıt sayılmaz**. Aynı ölçüt adı tekrarlandıysa, dört ayrı ölçüt yoksa, puanlar 0–2 dışında kalırsa veya toplam 0–8 dışında ise reddedilir.
- İlk değerlendirmenin görev sürümü güncel değilse ya da kayıt, ilk öğrenci tesliminden **önce** değerlendirilmiş gibi görünüyorsa ikinci görevin kilidi açılmaz.
- İkinci görev karşılaştırmasında iki rubrik de yeniden doğrulanır: dört benzersiz ölçüt, aynı ölçüt kimlikleri ve doğru puan toplamları gerekir.
- Öğrenciye özel gecikmeli görev yüklemesi ve gönderimi, son 400 genel günlük kayıt üzerinden tahmin edilmez: sadece ilgili öğrencinin gerçek **TYMM görev kimlikleri** ile eşleşen günlük kayıtlar sorgulanır. Uzun genel kullanım geçmişi, daha eski transfer teslimini gizleyemez.
- Sunucudaki PostgreSQL transaction lock, aynı görev için aynı anda çift teslimi engeller. Öğrenci hangi kaydın temel rubrik olacağını kendisi seçemez.
- Rubrik değerlendirmesinin **tek başına kalıcı öğrenme** olduğuna yönelik otomatik sonuç üretilmez; tekrar takvimi değiştirilmez.

## Koç performans inceleme kuyruğu

- Koç komuta merkezi açıldığında yalnız kendisine atanmış öğrencilerin **henüz puanlanmamış ilk/transfer görevleri** yüklenir.
- Bekleyen toplam, hedef süreyi aşan iş, öğrenci, eğitim düzeyi, görev başlığı ve beklenen süre sunulur; öğrenci yanıt metni ve kişisel yorumları toplu listede gösterilmez.
- Hedef süre 24 saat sabitlenmez; koç profilindeki `responseTargetHours` (1–168 saat güvenlik sınırıyla) esas alınır.
- Her satırdan yalnız yetkili koçun erişebildiği öğrenci detayına gidilir. Gerçek öğrenme değerlendirmesini tekrar koç rubriği formu gerektirir; iş kuyruğundan otomatik puan verilmez.
- Gösterim ilk 500 kayıtla sınırlandırılırsa `partial=true` açıklaması verilir; kısmi sayılar kesin toplam olarak iddia edilmez.

## Test ve doğrulama

- Dört ölçütün toplamıyla uyuşmayan rubrik ve yinelenen kriter adı reddi.
- Geçersiz görev sürümü; zamansal olarak imkânsız değerlendirme tarihi.
- İlk/ikinci görev durum geçişleri ve 7×24 saatlik kilit.
- Atanmamış öğrenci, geçersiz görev ve yanlış sınıf gönderimleri listede yok.
- Koç hedef süreleri 12, 24 ve 36 saat olduğunda kuyruk önceliği değişiyor.
- CI TypeScript, birim/güvenlik, PostgreSQL entegrasyonu ve production build aşamalarından geçmeden sürüm ana dala alınmaz.

## Hâlâ yapılması gerekenler

- Gerçek öğrenci ve koç hesaplarıyla **oturumlu uçtan uca tarayıcı testi** yapılmadı; yalnız kod ve CI kontrolleri yeterli değil.
- Altı performans görevinde **alan öğretmeni onayı, ikinci bağımsız değerlendirici ve puanlayıcılar arası uyum testi** yapılmadı.
- Açık uçlu yanıtlar yalnız metin; fotoğraf/video/dosya kanıt yükleme ve gerçek laboratuvar gözlemi yok.
- MEB/ÖSYM bütün düzeylerin bütün kazanımlarını kapsayan doğrulanmış konu dizini tamamlanmadı; içerik üretimi sonraki ayrı işleri gerektiriyor.
