# KEKS Akademi — TYMM Rubrik İkinci Değerlendirici Moderasyonu

**20 Ekim 2026 · İç kalite kalibrasyonu · uzman/MEB onayı değildir.**

## Çözülen problem
Atanmış koçun tek başına verdiği performans puanının güvenirliği bilinmez. Bu pilot, aynı öğrenci yanıtının **farklı bir yönetici tarafından ikinci kez ve ilk puanı bu ekranda görmeden** puanlanmasını sağlar. Öğrencinin ilk değerlendirmesi veya bilgi hâkimiyeti geriye dönük değiştirilmez.

## Akış
1. Koç TYMM yazılı yanıtını, deney/model planını dört ayrı 0–2 rubrik ölçütüyle ve somut gerekçelerle tamamlar.
2. Yönetici, Akademik İçerik → Bağımsız Rubrik Tutarlılığı Denetimi ekranına gider. Liste, son 160 incelenmiş görevden uygun olan en fazla 24 örneği sunar; bütün geçmişi kapsadığı iddia edilmez. İlk puan ve koçun geribildirimi **ikinci değerlendirme formunda gösterilmez**.
3. Aynı puanı veren ilk kişi (evaluatedByUserId) ikinci incelemeyi yapamaz. Her ölçüt için 0–2 puan ve en az 20 karakterlik somut gerekçe, ayrıca en az 40 karakter moderasyon notu zorunludur.
4. Yetkili yöneticinin bağımsız puanlaması kaydedildikten sonra iki puan karşılaştırılır. **Tüm dört ölçütte aynı puan** = tam ölçüt uyumu. Fark olsa da toplam mutlak fark 0–1 ve hiçbir ölçütte 2 puan ayrışma yoksa küçük farklılık. Toplam 2+ puan fark veya herhangi bir ölçütte 2 puan fark = **akademik takip önerisi**.
5. İşlem önceki DailyLog satırını değiştirmez. İkinci değerlendirici, zaman, ikinci puanlar, dört kanıt notu, fark ve kararı AuditLog içine kayıt edilir. Tek gönderim için iki moderasyon işlemi engellenir (PostgreSQL transaction lock + var olan moderasyon kontrolü).
6. Yönetici kayıt geçmişinde örnek sayısı ve ayrışma eğilimini görebilir. Sonuç **koçlar arası istatistiksel güvenirlik** ya da branş uzmanlığı sertifikası olarak gösterilmez.

## Yetki ve gizlilik
- API yalnız ADMIN rolüne açıktır. Yanıtın tamamı sadece yönetici ekranında görünür; kamuya veya başka öğrenci/koç hesabına açılmaz.
- Öğrenci kimliği, iletişim verileri ve öğrenci adı moderasyon listesine özellikle eklenmez. Serbest yanıt metinleri kişisel bilgi içerebilir; yalnız yetkili moderatör görebilir.
- Moderasyon, alan öğretmeni/MEB resmî onayı anlamına gelmez. İkinci değerlendiricinin alan uzmanlığı otomatik doğrulanmaz.
- İlk puan veya öğrencinin Yeni → Kalıcı hâkimiyet statüsü ve tekrar takvimi otomatik değişmez.
- Bu aşama, ağır uyuşmazlığı **işaretler**; ayrışmanın nihai çözümü için gerçek branş uzmanı moderasyonuna ayrıca gerek vardır.

## Kapsam sınırları
- Önceki **46 mikro ders**, **184 alıştırma** ve mevcut pilot performans görevleri değiştirilmez.
- Rubrikte tüm ölçütlerin aynı olması istatistiksel güvenirliğe tek başına yeterli değildir. Koçların alan uzmanlığı, moderatör rotasyonu, puanlayıcı körlüğünün süreç bazında denetimi, farklı görevlerin eşdeğerliği ve öğrencilerin performans analizi için ayrıca araştırma gerekir.
- Yönetici formunda ilk koç puanı gizlidir; kullanıcı diğer yetkili yönetici ekranları üzerinden bu bilgiye erişebilirse kurumsal süreçle bağımsızlık sağlanmalıdır.
