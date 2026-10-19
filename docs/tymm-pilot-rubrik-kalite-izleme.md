# KEKS Akademi — TYMM Pilot Rubrik Kalite İzleme (2026)

## Amaç
TYMM açık uçlu, model ve deney-planı **pilot** performans görevlerinin işleyiş kalitesini izlemek. Bu işlev, öğrenci başarısını puanlamaz; öğrencinin bireysel öğretim sonucunu veya kalıcı bilgi hâkimiyetini tayin etmez.

## Konum
Yönetici → Akademik İçerik → Çözümlü Örnek Kataloğu Onay Merkezi → **TYMM pilot rubrik kalite izlemesi**.

## Veri tanımı
API: `GET /api/admin/performance-quality` (yalnız ADMIN). Son **90 gün içinde oluşturulmuş** performans görev kayıtları incelenir. Öğrencinin başvurusu ve koç rubriği aynı `DailyLog` satırında tutulduğundan mevcut satırın son durumu kullanılır.

- İlk performans teslimleri, yedi gün sonraki bağımsız ikinci teslimler, koç tarafından değerlendirilmiş teslimler ve bekleyenler.
- **48 saati aşan** bekleyiş sayısı; bu kalite uyarısıdır, sözleşmeye bağlı yanıt süresi garantisi değildir.
- Dört ölçütlü 0–2 puan rubriklerinin teknik doğruluğu ve düşük puan için somut yazılı gerekçe eksiği.
- Gönderim–insan değerlendirmesi arasındaki doğrulanabilir ortalama süre. Tarih damgaları yok/ters ise ortalamaya katılmaz.
- Yalnız doğrulanabilir iki rubriği olan ikinci görevlerin farkına dayalı gelişim, benzer düzey ve güçlük sinyali. **İki görevin eşdeğer veya öğrenmenin kalıcı olduğu varsayılmaz.**
- Sınıf ve ders bazında yalnız sayısal gruplama. Kullanıcı ID, isim, e-posta, teslim edilen metin, bireysel puan veya koç notu gösterilmez.

## Analiz sınırı
Sunucu en son 90 gündeki en fazla **2500** uygun `DailyLog` satırını işler ve 2501. satırı sadece limitin aşılıp aşılmadığını belirlemek için kullanır. Aşıldığında yönetici ekranda *kısmi kayıt* uyarısı görür; rakamlar dönem genelinde kesin toplam olarak sunulmaz. Raporda veri yoksa 0 görünür; bu başarısız öğrenme göstergesi değildir.

## Güvenlik ve sınırlar
- Sunucu tarafında `requireRole(['ADMIN'])` zorunlu.
- HTTP `Cache-Control: private, no-store`.
- Rapor yalnız istatistikleri döndürür; öğrenci veya koç kimliği, ham yanıt, özel not, günlük kayıt ID'si içermez.
- Yalnız teknik rubrik doğrulaması yapılır; öğretmen/alan uzmanı imzası ve psikometrik güvenilirlik raporu değildir.
- Kullanıcıya ait başarı/net/kalıcılık/0–1–3–7–14–28 tekrar durumuna otomatik müdahale yapılmaz.
- 90 günlük pencere **görev tesliminin oluşturulma tarihine** göredir; gözlem zamanı ve puanlama zamanı ayrıca kalite metriğinde kullanılır.
- 2500 üzeri kayıt bulunan ortamlarda tüm dönem istatistiği için arka planda tutarlı maddileştirilmiş sayaçlar veya dönem bazlı veritabanı toplulaştırması gerekir; bu sürüm tam ölçek raporunu iddia etmez.

## Sonraki kalite iyileştirmeleri
1. Rubrikler için branş uzmanı imza/inceleme izi ve çift bağımsız puanlayıcı tutarlılığı (ör. ağırlıklı kappa / ICC).
2. Gecikmeli üçüncü ölçümün kendi özgün metni ve kanıt temelli öğretim tasarımı.
3. Öğrenci/koç hesaplarıyla gerçek uçtan uca izlenebilirlik testi.
4. Okul/düzey bazında kapsama ve sistem yanıt süresi için ayrı operasyon paneli.
