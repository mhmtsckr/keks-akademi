# KEKS | Soru bankası olmadan çözümlü örnek ve mikro dersler

## Problem ve yaklaşım
Kurumsal soru havuzu henüz yokken, öğrencinin yüklediği yanlış sorunun doğru cevabı veya çözümü **doğrulanmış** kabul edilemez. Fotoğraftan metin çıkarılmadıysa, sistem alt kazanımı fotoğrafı görmüş gibi tahmin etmemelidir.

Bu nedenle iki farklı varlık tutulur:
1. **Öğrencinin özel sorusu:** Görsel/metin, öğrencinin verdiği cevap, olası konu ve 0–1–3–7–14–28 tabanlı uyarlanabilir tekrar kaydı.
2. **KEKS özgün örneği:** Öğretim amacıyla bağımsız oluşturulmuş kısa açıklama, sık hata, ayrı çözümlü örnek ve yeni alıştırmalar.

İkisi aynı soru değildir; ilk sorunun otomatik çözümüymüş gibi gösterilemez.

## İlk pilot (2026-10-11)
- Ardışık yüzde değişimleri: 1 çözümlü örnek + 4 bağımsız alıştırma.
- Kesirlerde toplama/çıkarma: 1 çözümlü örnek + 4 bağımsız alıştırma.
- Üslü sayılar ve aynı taban kuralları: 1 çözümlü örnek + 4 bağımsız alıştırma.
- Ders/alt beceri belirsizse mikro ders **önerilmez**. Fotoğraf-only yüklemede alt beceriyi öğrenci seçebilir.
- Veriler: `lib/bankFreeMicroLessons.ts`. Güvenli cevap kontrolü: `lib/mathAnswerEquivalence.ts`.
- Öğretici alıştırma kaydı: `app/api/student/reviews/guided/route.ts`; mevcut `DailyLog` içinde `GUIDED_PRACTICE_STARTED` → `GUIDED_PRACTICE_RESULT`. Soru havuzu/şema migrasyonu gerekmez.

## Öğrenme kanıtı
Öğrencinin bir pilot alıştırmayı doğru yapması, aynı kazanımın kalıcı olduğuna tek başına kanıt değildir. Tamamlama:
- İlgili kazanımdan yeni ve farklı sorular,
- Gecikmeli (1, 3, 7, 14, 28. günlerde öğrenci performansına uyarlanan) bağımsız hatırlama,
- Yardım alınıp alınmadığı, zorluk, soru çeşitliliği,
- En azından birkaç ayrı kanıt oturumuna dayanmalıdır.

Pilot mikro ders sonuçları, mevcut tekrar kaydını otomatik ilerletmez. Koç paneli bu etkinlikleri ayrı sayar.

## Sonraki içerik yönetimi
Her yeni mikro ders için:
1. Alt beceri sınırını ve sınıf/sınav grubunu tanımla (geniş "Problemler" yeterli değil).
2. İlgili resmi kazanım kodu *doğrulanabiliyorsa* kaydet; KEKS iç kazanımını resmi kod gibi gösterme.
3. Özgün bir çözüm örneği ve en az üç değişken alıştırma yaz; görsellerin telif/izinlerini kontrol et.
4. Hesabı / cevap anahtarını otomatik test et; bir konu uzmanından içeriğin pedagojik uygunluğunu gözden geçirmesini iste.
5. `PILOT` etiketini, belgeli içerik onayı gelmeden kaldırma.
6. Önce pilot öğrenci grubunda izle: yanlış nedenleri, yönlendirmeyi bitirme, takip günlerindeki farklı soru başarısı.

## Açık sınırlamalar
- **OCR ve fotoğraftan otomatik soru çözümü yok.**
- Tüm dersler/kazanımlar için çözümlü örnek yok; desteklenmeyen durumlarda güvenli mesaj verilir.
- Henüz öğretmen onay akışına sahip bir admin içerik editörü yok. Genişlemede onaylı ders şablonu CMS + kaynak revizyon geçmişi kurulmalı.
- Kontrol edilmiş özgün örnek, öğrencinin yüklediği sorunun çözüm anahtarı yerine geçmez.
