# KEKS Akademi · TYMM Performans Görevi Teslim Bütünlüğü

**20 Ekim 2026.** Bu sürüm, mevcut insan koç rubriği ve yedi günlük bağımsız yeniden ölçüm sistemini **değiştirmeden**, öğrencinin **ilk performans görevi** teslimlerini daha güvenilir hâle getirir.

## Önceki sorunlar

- Haftalık teslim kontrolü yalnız son 80 günlük kayıt arasındaki aynı görevin sayısına bakıyordu. Başka çok sayıda kayıt bulunan öğrenci sınırı yanlışlıkla aşabilirdi.
- Birbirine yakın iki HTTP isteği aynı anda kontrolü geçerek iki bekleyen teslim oluşturabilirdi.
- Koç önceki teslimi değerlendirmeden öğrencinin yeni bir aynı-görev yanıtı oluşturması koç kuyruğunda gereksiz iş ve belirsizlik yaratabilirdi.
- Öğrenci ekranında bekleyen koç incelemesi varken yeni form açma düğmesi yine görünüyordu.

## Uygulama

1. Öğrenci oturumu, gerçek sınıf, resmî kaynak ve görev sürümü zaten sunucuda kontrol edilir; aynı güvenlik modeli korunur.
2. Her öğrenci–görev çifti için PostgreSQL **transaction-level advisory lock** alınır. Aynı anda gelen ikinci istek ilk işlemin tamamlanmasını bekler.
3. Son **7 × 24 saat** içindeki aynı `taskId` için `TYMM_PERFORMANCE_SUBMISSION` ve `TYMM_PERFORMANCE_REVIEWED` kayıtları veritabanında `count` ile sayılır; artık `take:80` gibi rastgele truncation yoktur.
4. Herhangi bir henüz insan tarafından incelenmemiş `TYMM_PERFORMANCE_SUBMISSION` kaydı varsa yeni ilk-görev teslimi **409** ile reddedilir. Koç önceki yanıtı değerlendirir ve gerekçeli geri bildirim sunar.
5. Son yedi günde üç veya fazla geçerli teslim varsa **429** döner. Ancak koç tarafından değerlendirildi ve toplam üçten az ise öğrenci yeni açıklamasını gönderebilir.
6. Öğrencinin GET cevabı sadece kendisine ait bekleyen görev kimliklerini döner; form düğmesi “Koç Değerlendirmesi Bekleniyor” hâline gelir. İstemci görünümü kopyalanamaz güvenlik kuralı değil; asıl koruma sunucu işlemidir.
7. Sonuçlar otomatik başarı/öğrenme hâkimiyeti sağlamaz ve aralıklı tekrar planını değiştirmez. MEB kaynak doğrulaması KEKS görevlerine resmî onay anlamına gelmez.

## Doğrulama

`lib/tymmBaselineGate.test.ts` izinli ilk/ikinci/üçüncü denemeyi, bekleyen rubrik varken engeli, `3+` teslim sınırını ve 80 kayıt üzerindeki sayımı ele alır. GitHub CI TypeScript, birim testleri, PostgreSQL entegrasyonu ve production build aşamalarından geçirilmelidir. Gerçek kimlik doğrulamalı öğrenci–koç uçtan uca kabul testi ayrıca gereklidir.

**Sonraki kalite konusu:** koçun birikmiş değerlendirme kuyruğu için erken uyarı ve belgeli pedagojik moderasyon. Bunların var olduğu iddia edilmez.
