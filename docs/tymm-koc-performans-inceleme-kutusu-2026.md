# KEKS Akademi — Koç TYMM Performans İnceleme Kutusu

**2026-10-20.** Bu özellik mevcut performans görevlerini, gecikmeli yeniden ölçümü ve rubrikleri **değiştirmez**; atanmış koçun bütün öğrencilerindeki eksik işleri güvenli bir takip ekranında toplar.

## Koç ana panelindeki dört gösterge
- **İnceleme bekleyen:** İlk açık uçlu performans teslimi veya gecikmeli bağımsız performans teslimi olup henüz koç rubriği kaydedilmeyen görevler.
- **48+ saat bekleyen rubrik:** İlk ya da ikinci teslimin üzerinden en az 48 saat geçmiş ve hâlâ koç incelemesi bekleyen kayıtlar.
- **Öğrenciye açılan ikinci görev:** İlk insan rubriğinin kaydından itibaren 7×24 saat geçmiş, ancak öğrenci henüz ikinci bağlamdaki görevi teslim etmemişse.
- **48 saat içinde açılacak:** İlk koç değerlendirmesinden 7 gün sonra gelecek ikinci performans görevleri için koçun planlama sinyali.

Her satır öğrencinin adı, gerçek sınıfı, dersi, görevin başlığı ve ilgili zaman damgasını gösterir. Öğrenciye geçiş bağlantısıyla koç kendi kayıtlı öğrencisini açar. Liste öğrenci yanıt metnini, gözlem açıklamasını veya koçun özel gerekçesini herkese açık şekilde göstermez.

## Erişim ve doğruluk
- `GET /api/coach/performance-inbox` sadece oturum sahibi **COACH/ADMIN** kullanıcısının bir `coachProfile` kaydı olduğunda çalışır; öğrenci seçimi **yalnız `coachId=user.coachProfile.id`**.
- İstemci öğrenci kimliği veya koç ID'si göndererek başka öğrenciyi seçemez.
- Servis, öğrenciye ait doğrulanmış görev ID'si, içerik sürümü ve sınıfı kontrol eder.
- Transfer zamanını mevcut `transferEligibility()` fonksiyonuyla hesaplar; yedi gün dolmadan ikinci görevi açmış gibi raporlamaz.
- Rubriği koç yerine puanlamaz; öğrenciyi otomatik `Kalıcı` statüsüne geçirmez.
- İşlem kutusu yalnız **mevcut kayıtları** yansıtır. WhatsApp/e-posta/push bildirimi göndermez, öğrencinin ödevini kendi kendine teslim etmez.
- Liste kapsamı için en fazla 500 öğrenci/5000 kanıt kaydı incelenir; üst sınıra ulaşıldığında eksik sayım olabileceği açıkça belirtilir.
- `lib/tymmCoachInbox.test.ts`, koç dışı öğrenci verilerinin ayıklanmasını, 48 saat sınırını, 7 günün tam dolmasını, ikinci teslimin durumunu ve yanlış sınıf/konu verisinin dışlanmasını denetler.

## Yapılmayanlar
Gerçek kullanıcı ve koç hesaplarıyla oturum açılarak uçtan uca tarayıcı testi; öğrenme kazanımlarının bağımsız branş uzmanı onayı; görevlerin psikometrik eşdeğerliği; gönderilmemiş veya öğretmen onayı olmayan kanıtın değerlendirilmiş sayılması. Bunlar ayrı kalite ve içerik süreçleridir.
