# KEKS Akademi — TYMM Gecikmeli Bağımsız Performans Ölçümü

**12 Ekim 2026 · Pilot özellik.** Önceki sürümdeki altı rubrikli görevi değiştirmeden, her görev için **aynı öğrenme çıktısını farklı bağlamda yeniden ölçen** ikinci özgün görev eklendi.

## Güvenilir değerlendirme zinciri

1. Öğrenci ilk görevini kendi gerçek sınıfına uygun ekranda tamamlar.
2. Atanmış koç yazılı yanıtı, model tasarımını veya deney planını 4 ölçütlü, her biri 0–2 puanlık rubrikle değerlendirir ve gerekçeli geribildirim verir.
3. **En erken koçun ilk değerlendirmeyi kaydetmesinden itibaren 7 × 24 saat sonra** ilgili ikinci görev açılır; ilk teslimden geçen süre değil, değerlendirme zamanı esas alınır.
4. İkinci görev ilk metinle aynı değildir: Ay'ın yeni ay/dolunay yerine dördün evreleri, hücrelerde yaprak/yanak modeli, yeni iletkenlik malzemeleri, kuryenin yer değiştirmesi, magnezyum oksit denklemi, tek yönlü pencereyle fototropizma planı.
5. Öğrenci yeni duruma kendi gerekçesini ve metinle tanımladığı kanıt/model/deney planını girer. Bağımsız çalıştığını beyan eder. Gerçek deney yapıldığı iddia edilmez.
6. Atanmış koç ikinci görevi önce **bağımsız olarak puanlar**. Sistem iki rubriği aynı dört ölçüt kimliği üzerinden karşılaştırır: ilk/ikinci 8 puanlık toplam, puan farkı ve her alt ölçütün 0–2 puan farkı.
7. Koçun yazılı geribildirimi, iki rapor ve gelişim sinyali öğrenciye gösterilir. Gözlenen artış kesin öğrenme kazanımı veya psikometrik görev eşdeğerliği değildir.

## Erişim ve veri bütünlüğü

- TYMM 2026–2027 dışında kalan sınıflarda veya gerçek sınıfı seçilmeyen birleşik düzeylerde ikinci görev açılmaz.
- Kullanıcının gönderdiği baseline ID veya rubrik puanı **asla güvenilmez**; asıl baseline ve koç puanı sadece sunucudaki ilgili öğrenciye ait `DailyLog` kaydından alınır.
- Sunucu 7 günü doldurmadan ve insan tarafından kayıtlı ilk değerlendirme olmadan ikinci teslimi reddeder.
- PostgreSQL transaction-level advisory lock, aynı öğrencinin aynı görev için iki eş zamanlı POST isteğiyle birden fazla teslim açmasını engeller.
- Gecikmeli cevap ve koç rubriği, sadece ilgili öğrenci veya ona atanmış koç için görüntülenir. Öğrenci koçun puanını kendisi yazamaz.
- Koçun ikinci değerlendirmesi ilk puanı geriye dönük değiştiremez. Değerlendirme kaydı mevcut `DailyLog` satırında atomik tek durum geçişiyle saklanır.
- Rubrik sonuçları **sadece ölçüm kanıtıdır**. Öğrencinin `Yeni → Öğreniliyor → Pekiştiriliyor → Kalıcı → Riskli` statüsü ve aralıklı tekrar takvimi otomatik değişmez.
- Veri ve testlerde uzman imzası uydurulmaz; bütün içerik *Pilot* ve **KEKS tarafından özgün hazırlanmış** metinlerdir. MEB kaynak bağı, KEKS sorularının MEB onayı değildir.
- Bekleyen görevlerin zaman hesabında takvim günü yerine sabit 7 × 24 saat kullanılır. Hesaplama UTC zaman damgaları üzerindendir.

## Öğrenci/koç kullanım yeri

Öğrenci: Yanlış Soru Bankası → TYMM Performans Görevleri → **7 Gün Sonra Bağımsız Yeniden Ölçme**.

Koç: Öğrenci → Öğrenme Zekâsı → TYMM Performans Görevleri → **Bağımsız İkinci Görev** incelemesi; kayıttan sonra rubrik kriter karşılaştırması görünür.

## Akademik değerlendirme sınırlamaları

Rubrikte benzer kimlikli ölçütlerin aynı bilgi alanını hedeflemesi, soruların istatistiksel olarak eşdeğerliğini ispatlamaz. Koçlar arası rubrik tutarlılığı, geri bildirim etkisi, araştırma örneklemi, bağımsız üçüncü gecikmeli ölçüm, performansın farklı konulara genellenebilirliği ve uzman editör onayı henüz çalışılmadı. Bu nedenle sonuç **"gelişim/güçlük sinyali"**, tanı veya sertifikasyon değildir.
