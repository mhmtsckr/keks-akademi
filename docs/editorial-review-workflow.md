# KEKS Akademi • 6000 Soru İnsan Editörlüğü ve Yayın Kapısı

## Durum ve kapsam

Bu modül **yayımlanmamış soru taslakları** için bağımsız bir bekleme havuzu oluşturur. Soru metni yalnızca yetkili yöneticinin tarayıcısından özel API üzerinden yüklenir. Gerçek 6000 soru JSON'u / PDF'ler **public GitHub reposuna commit edilmez**.

Kod eklenmesi, **6000 sorunun insan editörü tarafından incelendiği anlamına gelmez**. İlk açılışta havuz boştur. Şirket hesabından veri içe aktarımı ve gerçek editörlerin kaydolması/atanması gereklidir.

## Yetkilendirme modeli

- `ADMIN`: kullanıcı yönetimi, dosyadan **taslak içe aktarımı**, gerçek editörleri aşamalara atama, tam denetim ve **son yayımlama**. Akademik incelemeyi imzalayamaz.
- `EDITOR`: yalnız açıkça atandığı aşamalarda soru inceleme, gerekçeli düzeltme, onay/ret. Kullanıcı/ödeme/yönetici işlemlerine erişemez.
- Üç ayrı **aktif ve bağımsız EDITOR hesabı** gerekir:
  - `SUBJECT` = alan bilgisi, Türkçe, anlatım ve kazanım uygunluğu.
  - `ASSESSMENT` = tek doğru cevap, soru kökü, ÖSYM tipolojisi, tüm çeldiriciler.
  - `SOURCE_RIGHTS` = akademik iddianın gerçek makaleyle eşleşmesi, DOI/PMCID, doğru paraphrase, telif ve **ticari kullanım izni**.
- Her karar kullanıcı ID'si, zaman, içerik SHA-256 özeti, soru sürümü, gerekçe ve telif kanıtı işaretiyle kayıt altındadır.
- İçerik değişirse sürüm artar; eski sürümlerin kararları **otomatik geçersizdir**.
- Yalnızca üç farklı editörün **aynı güncel sürümde** `APPROVE` kararı, sonuncunun ticari kullanım kontrolünü doğrulaması ve güncel yetkilerinin sürmesi halinde yönetici `PUBLISH` komutunu çalıştırabilir.

## Kullanım

1. Yeni gerçek editörler KEKS'te kendilerine ait doğrulanmış e-posta ve şifreyle hesap açar (mevcut koç kayıt adımı bu amaçla kullanılabilir; aktif öğrencisi olan bir koç editöre dönüştürülemez).
2. Yönetici **Kullanıcılar** sekmesinden boş koç hesabını `EDITOR` rolüne alır, gerekirse `ACTIVE` hâle getirir. Bu işlem oturumları geçersiz kılar.
3. Yönetici `/yonetici/editorial` ekranından her EDITOR hesabının gerçek e-posta adresini kendi uzmanlık aşamasına atar.
4. Yönetici önceden üretilmiş **özel** `KEKS_Akademi_6000_Soru_Editoryal_Ice_Aktarma.json` dosyasını aynı ekrandan seçer. 25 kayıtlık partilerle güvenli ve mükerrer kaydı atlayan içe aktarma yapılır.
5. Editörler `/yonetici/editorial` adresinden kendi hesaplarıyla giriş yapar, her soru metnini ve beş seçeneği okur, gerekli değişiklikleri gerekçeli sürüm olarak kaydeder, sonra atanmış aşamada gerçek kararını verir.
6. Kaynak editörü, DOI makalelerindeki iddiaları *gerçek metin* üzerinden ve makalenin **ticari yeniden kullanım** lisansını ayrı ayrı doğrular; notuna lisans türünü, kanıt bağlantısını ve saklanan tarihini yazar.
7. Üç ayrı editör onayı tamamlandığında yönetici **tek tek** soruları yayımlar. Uygun olmayan taslaklar öğrenci soru bankasına ulaşmaz.
8. Son kitabın ticari baskısı için tüm soruların onaylarının dışında son sayfa dizgisi, bibliyografik kontrol, örneklem pilotu, görsel ve telif doğrulaması gerekir.

## Veri formatı

İçe aktarım dosyası en çok 7000 kaydı içeren bir `{ "items": [ ... ] }` JSON nesnesidir. Her kayıt:
`externalId`, `examType`, `subject`, `topic`, `skill`, `difficulty`, `passage`, `stem`, `options` (5 farklı metin), `correctAnswer` (A–E), `explanation`, `sourceRefs` (PMCID/DOI/URL/title), `qualityFlags` içerir.

Sunucu tek istekte **en çok 25** soru kabul eder; benzersiz `externalId` daha önce yüklendiyse eski sürümü silmez veya değiştirmez. Ağ kesilirse aynı dosyanın yüklenmesi tekrar başlatılabilir. Doğrudan öğrenci soru bankasına otomatik yayın **yoktur**.

## Güvenlik ve dikkat edilmesi gerekenler

- Bu çalışma yalnızca editöryal sürecin teknik altyapısıdır. **İnsan uzman kontrolü yapılamaz / simüle edilemez.**
- Ticari lisansı doğrulanmamış makalenin metnini doğrudan çoğaltmayın. Özgün Türkçe paragraf, araştırmanın bulgusu ile uyumlu olmalı.
- 200 kaynaklık önceki envanter **aday kaynak listesidir**. Mevcut 6000 taslakta gerçek kullanılan farklı çalışmalar sayısı 25'tir. Makale sayısı 200'e otomatik erişilmiş gibi gösterilmez.
- `QuestionBankItem` adlı mevcut öğrenci soru bankası aynen korunur. Yeni taslaklar sadece `EditorialQuestionDraft` içinde tutulur ve üç onaydan önce oraya aktarılmaz.
- `prisma/production/additive_schema.sql` yalnız eklemeli tablolar ve EDITOR enum değerini kurar; mevcut öğrencileri ve kullanıcıları silmez.
- Dağıtım öncesinde Prisma generate, TypeScript, testler ve production build kontrol edilmeli; production dağıtımı/sürümü ayrıca doğrulanmalıdır.
