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

## Matematik dışındaki genişletme — 11 Ekim 2026

**Üretilen özgün içerikler:** 9 yeni mikro ders, 36 çoktan seçmeli pekiştirme alıştırması. Matematikteki 3 mikro dersle toplam 12 ders ve 48 alıştırma. Yeni alanlar: Türkçe (paragraf ana düşünce; neden–amaç sonuç), Türk Dili ve Edebiyatı (benzetme–kişileştirme), Tarih (Millî Mücadele kronolojisi), Coğrafya (enlem–boylam), Fizik (temel/türetilmiş büyüklükler), Kimya (element–bileşik–karışım), Biyoloji (organeller), Eğitim Bilimleri (geçerlik–güvenirlik).

**Eğitimsel dayanak için referanslar:** [MEB 7. sınıf Fen Bilimleri — Maddenin Doğasına Yolculuk](https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/432); [TBMM açık erişim — Millî egemenlik belgeleri](https://acikerisim.tbmm.gov.tr/items/af4f5817-2914-4daf-9b57-24135495d396/full). Örnekler orijinaldir; resmî dokümanlardan soru veya metin kopyalanmamıştır. Derslerin tümü için resmî kazanım kodu eşleştirmesi yapılmış **değildir**.

### Onaylama protokolü
- Yeni içerikler varsayılan **PILOT** statüsünde yayımlanır; otomatik test geçmeleri kendiliğinden öğretmen onayı vermez.
- Yönetici → İçerik & Soru Bankası → Çözümlü Örnek Kataloğu Onay Merkezi panelinde her dersin kapsamı, örnek çözümü, dört sorusu, seçenekleri ve cevap anahtarları görüntülenir.
- Yönetici içerik ve anahtarı incelediğini açıkça belirtir ve en az 12 karakterlik inceleme gerekçesiyle `APPROVE` işlemi yapar.
- Onay `AuditLog` tablosunda yönetici kimliği, zaman, ders kimliği, içerik sürümü ve SHA-256 içerik özetiyle saklanır. İçerik değişirse onay geçersiz olur. `REVOKE` ile geri alınabilir.
- **APPROVED** etiketi *yönetici içerik kontrolü* anlamına gelir. Bağımsız alan öğretmeni kontrolünün kanıtı olarak kullanılamaz; uzman imzası/kanıt sistemi ileride ayrıca eklenmelidir.
- Öğrenci yalnızca ders adlarını ve becerileri gören güvenli kataloğa erişir; test alıştırmalarının cevap anahtarları gönderilmez, sonuç sunucuda kontrol edilir.
- Fotoğraftan konu çıkardığı iddia edilmez; dersi ve beceriyi öğrenci seçebilir. Geniş konu adları tek başına otomatik beceri kanıtı sayılmaz.
- Mikro alıştırma `DailyLog` verisi oluşturur ama SRS aşamasını ve kalıcılık durumunu tek başına değiştirmez.

### Yeni dosyalar
- `lib/expandedMicroLessons.ts` — yeni içerikler (özgün).
- `lib/expandedMicroLessonMatch.ts` — muhafazakâr alt beceri eşleştirmeleri.
- `lib/microLessonReview.ts` — SHA-256 sürüm bağımlı onay çözümleme.
- `app/api/admin/micro-lessons/route.ts` — yetkili inceleme/onay/geri alma.
- `app/components/AdminMicroLessonReviews.tsx` — yönetici onay arayüzü.
- `app/api/student/reviews/guided/route.ts` — dinamik pilot/onay etiketleri, çoktan seçmeli güvenli alıştırmalar.
