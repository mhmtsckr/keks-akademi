# KEKS Akademi — Yanlıştan Öğrenmeye: Hata Analizi ve Kanıt Zinciri
12 Ekim 2026 · Sınıf ve sınav bağımsız özel öğrenci öğrenme akışı.

## Akış

**Yanlışı kaydet → Konuyu doğrula → Hatanın nedenini bul → Düzeltme kuralını yaz → Çözümlü farklı örneği çalış → Bağımsız soru tekrarında kendini denetle.**

Öğrenci, **Yanlış Soru Bankası** içindeki yeni MİZA “Yanlışımı bul → Düzelt → Farklı soruda dene” kartında son kişisel sorularından birini seçer:
1. Kendi hata nedenini seçer (bilgi eksikliği, işlem, dikkat, soru kökü, süre, yöntem, unutma).
2. Hangi düşünme/çözüm adımında yanıldığını açıklar.
3. Doğru kuralı *kendi ifadeleriyle* yazar. Bu ifade **doğrulanmış doğru çözüm değildir**.
4. Bir sonraki soruda uygulayacağı somut kontrol adımını belirler.
5. KEKS seçilen hata nedeni için kişisel çalışma önerisi verir. Resmî kazanım kodu ve yüklenen görselin birebir çözümü uydurulmaz.
6. Çözümlü, ayrı hazırlanmış mikro dersi çalışır; mini alıştırmanın sonucu, gerçek soru tekrarı sonucundan **ayrı** kalır.
7. Sonraki bağımsız tekrar kaydı, eski çözüm/öz bildirimden ayrı kanıt olarak görünür.

## Güvenlik ve veri güvenilirliği

- Özel soru `QuestionBankItem.sourceKind='STUDENT_WRONG:'+studentId` ve `reviewStatus='STUDENT_PRIVATE'` eşleşmesi sunucu tarafında doğrulanmadan analiz kabul edilmez. Bir başkasının soru ID'siyle POST yapılamaz.
- Kişisel yansıtma kayıtları yalnız ilgili öğrencinin `DailyLog` kayıtlarında `WRONG_QUESTION_REFLECTION` türünde saklanır. Yeni Prisma migrasyonu yoktur.
- Sunucu alan boylarını, geçerli hata nedeni listesini, metin uzunluklarını ve günlük **en fazla üç düzenleme** sınırını denetler. Her analiz eklemeli tarihçeye kaydedilir.
- Görüntülemede en yeni 50 özel soru ve ilgili son 250 kayıt/tür incelenir; tarihsel gösterim bu sınırlı örneklemle kalabilir.
- Çalışma kanıtının bağlanması ilgili sorunun kendi ID'si ve yeni analizin **sonrasındaki** zaman damgasıyla yapılır. Başka sorunun, önceki analizin veya önceki bir koç görevinin sonuçları yanlışlıkla bağlanmaz.
- Yanlış nedeni **öğrenci öz bildirimidir**, psikometrik tanı veya kişilik değerlendirmesi değildir.
- Mikro alıştırmada başarı, yalnızca **yönlendirmeli örnek başarısı** olarak görünür. Orijinal sorunun bağımsız tekrarında başarı ayrı gösterilir.
- Her iki başarı da tek başına `Kalıcı` öğrenme veya uzman onaylı çözüm sayılmaz. Mevcut 0–1–3–7–14–28 kişisel tekrar takvimi bu özel analiz formundan **etkilenmez**; sadece mevcut bağımsız tekrar motoru kendi kurallarıyla günceller.
- Kaydedilen doğru kuralın akademik doğruluğu otomatik doğrulanmaz; koç/öğretmen kontrolü gerekebilir.

## Sonraki geliştirme boşlukları

- Rubrikli hatalı işlem analizi, soru türüne göre (paragraf, problem, edebiyat yazar-eser, deney modelleme) uzman gözden geçirilmiş şablonlar.
- Aynı *resmî kazanıma* ait farklı ve gecikmeli doğrulanmış yeni sorularla transfer ölçümü; resmî kazanım haritası belirsizse bilgi hâkimiyeti için kesin iddia üretmeme.
- Koç açısından öğrencinin kendi hata analizi ile sonraki bağımsız performansını özetleyen gizlilik kontrollü görüntüleme.
- Gerçek öğrenci-öğretmen hesaplarında uçtan uca QA ve pilot çalışma.
