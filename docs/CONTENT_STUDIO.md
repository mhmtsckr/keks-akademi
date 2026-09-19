# KEKS Akademi — Akıllı İçerik Stüdyosu

## 1. Amaç
Tek bir kaynak dosyadan birden fazla öğrenme çıktısı üretmek:
- Sesli anlatım
- Videolu anlatım
- Soru kartları
- Slayt sunumu
- Soru testi
- İnfografik
- Soru PDF'lerinden aynı kazanımı ölçen benzer soru taslakları

Ana ilke: aynı kaynağı veya aynı çıktı türünü gereksiz yere tekrar üretme; benzer adaylar arasında kalite puanı daha yüksek olan sürümü sakla.

## 2. Kullanıcı akışı
1. Koç veya öğrenci kaynak dosyayı yükler.
2. Sistem SHA-256 ile daha önce aynı öğrenci için yüklenip yüklenmediğini kontrol eder.
3. PDF/DOCX/PPTX/TXT metni çıkarılır.
4. Kaynak otomatik analiz edilir: başlık, ana kavramlar, soru yoğunluğu, kaynak türü.
5. Sistem önerilen çıktı türlerini işaretler.
6. Kullanıcı istediği türleri seçer.
7. Her tür için kısa ve kapsamlı iki aday üretilir.
8. Yapısal zenginlik, içerik kapsamı ve kelime çeşitliliği üzerinden kalite skoru hesaplanır.
9. Daha iyi aday kaydedilir.
10. Koç çıktıyı öğrenciye veya öğrenci+veliye yayınlayabilir.
11. Öğrenci kendi oluşturduğu içerikleri doğrudan kullanabilir.

## 3. Veri modeli
### ContentUpload
Kaynak dosyayı ve çıkarılmış metni tutar.
- studentId
- ownerUserId
- fileName
- mimeType
- fileSize
- fileData
- sha256
- extractedText
- category
- isQuestionSource
- status

### GeneratedContent
Tüm çıktı türleri tek yapıda tutulur.
- uploadId
- studentId
- createdByUserId
- type
- title
- payload
- fingerprint
- status
- qualityScore
- visibleToStudent
- visibleToParent

Bu yapı ayrı Flashcard/Slide/Infographic tabloları yerine tek, genişletilebilir içerik modeli kullanır.

## 4. API sözleşmesi
### POST /api/content-studio/upload
Multipart:
- file
- studentId (koç/admin için)

Döner:
- upload
- analysis
- deduplicated
- extractionError

### POST /api/content-studio/generate
JSON:
- uploadId
- types[]

Döner:
- outputs[]
- qualityScore
- reused

### PATCH /api/content-studio/items/:id/publish
JSON:
- visibleToStudent
- visibleToParent

## 5. Desteklenen dosyalar
- PDF
- DOCX
- PPTX
- TXT
- MD
- PNG/JPG/WEBP yüklenebilir; görsel içerik şu an NEEDS_VISION durumuna alınır.

Maksimum dosya: 15 MB.

## 6. İçerik türleri
### FLASHCARDS
Ön/arka yüzlü tekrar kartları.

### QUIZ
Çoktan seçmeli test. İçerikten çıkarılan açıklamalar doğru cevabı ve açıklamayı oluşturur.

### SLIDES
Başlık + maddeler + konuşmacı notları.

### INFOGRAPHIC
Kavram blokları ve kısa açıklamalar.

### AUDIO_SCRIPT
Tarayıcı SpeechSynthesis ile Türkçe sesli oynatılabilen ders metni.

### VIDEO_LESSON
Slayt + sahne anlatımı. Tarayıcı TTS ile sahne bazlı anlatım oynatılır.

### SIMILAR_QUESTIONS
Kaynak soru kopyalanmadan, aynı kazanım/ölçme mantığına dayalı yeni soru taslakları.

## 7. Benzerlik ve kalite kuralları
- Dosya tekilleştirme: SHA-256.
- Çıktı tekilleştirme: uploadHash + type + studentId fingerprint.
- Aynı fingerprint varsa yeniden üretim yapılmaz.
- İki aday üretim yapılır: concise / comprehensive.
- Kalite skoru:
  - içerik kapsamı
  - benzersiz kavram çeşitliliği
  - yapılandırılmış veri zenginliği
  - minimum içerik uzunluğu
- Yüksek skorlu aday kaydedilir.

## 8. Panel davranışı
### Koç
Öğrenci detayında “İçerik Stüdyosu” sekmesi:
- dosya yükle
- analiz et
- çıktı seç
- üret
- önizle
- öğrenciye yayınla
- öğrenci + veliye yayınla
- taslağa al

### Öğrenci
Öğrenci panelinde:
- kendi dosyasını yükle
- içerik üret
- yayınlanmış koç içeriklerini aç
- kart/test/slayt/ses/video içeriklerini kullan

### Veli
Sadece visibleToParent=true içerikleri görür.

## 9. Güvenlik
- Koç yalnız kendi öğrencisinin içeriklerine erişebilir.
- Öğrenci yalnız kendi içeriklerini görür.
- Veli yalnız bağlı öğrencinin veliye açılmış içeriklerini görür.
- Yönetici tüm içeriklere erişebilir.
- Dosya türü ve boyutu sunucuda doğrulanır.

## 10. Sonraki teknik görevler
1. Vision sağlayıcısı bağla: görsel tarama ve taranmış PDF analizi.
2. Harici TTS sağlayıcısı ekle: MP3 çıktı üretimi.
3. Video render servisi ekle: gerçek MP4 dışa aktarma.
4. AI sağlayıcı ekle: konu/kazanım sınıflandırması ve daha kaliteli soru üretimi.
5. PDF test kaynakları için sayfa/soru segmentasyonu.
6. Soru benzerlik kontrolü: embedding tabanlı kopya/çok benzer soru engelleme.
7. Öğretmen/koç onay geçmişi ve sürümleme.
8. İçerik kullanım analitiği: açılma, tamamlama, test sonucu, kart tekrar sayısı.
9. GeneratedContent → PracticeQuiz aktarımı.
10. Ses/video için öğrenci ilerleme kaydı.
