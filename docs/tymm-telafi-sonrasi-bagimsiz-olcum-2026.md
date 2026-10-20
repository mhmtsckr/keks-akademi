# KEKS Akademi · Telafi sonrası bağımsız ölçüm kanıtı

Tarih: 20 Ekim 2026. **Pilot değerlendirme altyapısı.**

Bu geliştirme, KEKS'in hâlihazırda sahip olduğu rubrikli performans görevlerini, koç tarafından atanıp insan incelemesinden geçen telafi çalışmalarını ve yedi gün sonra açılan bağımsız farklı-bağlam ölçümünü **aynı ölçüt kimliği** üzerinden ilişkilendirir.

## Ne doğrulanır?

- Telafi, yalnız öğrencinin ilgili `TYMM_RUBRIC_ACTION` kaydıdır.
- Kaynak rubrik, o öğrenciye ait ilk insan puanlı teslim olmalı; kaynak görevin sınıfı, sürümü, kimliği ve ölçütü eşleşmelidir.
- Kaynak ölçütün puanı 0 veya 1 olmalı. 2/2 puanlı ölçütte sonradan üretilmiş telafi kaydı gelişim olarak hesaplanmaz.
- Telafi öğrencinin yalnızca "tamamladım" beyanıyla değil, koçun **ACCEPT** kararı ve **VERIFIED** durumuyla doğrulanmalıdır.
- Sonraki ölçüm ancak telafi kabulünden **sonra teslim edilmiş** ve koç tarafından bağımsız rubrikle puanlanmış `TYMM_TRANSFER_REVIEWED` kaydıysa karşılaştırılabilir.
- Gecikmeli ölçüm, **aynı ilk performans gönderiminin** `baselineSubmissionId` anahtarına bağlı olmalıdır; aynı konuya ait rastgele başka teslim karşılaştırılamaz.
- İlk rubrikteki aynı ölçütün 0–2 puanı ve ikinci rubrikteki aynı ölçütün 0–2 puanı karşılaştırılır. Başka ölçüt veya toplam soru sayısı kullanılarak "etki" üretilmez.

## Bilerek otomatik yapılmayanlar

- Telafi nedeniyle gelişim yaşandığını **nedensel** veya deneysel bir kanıt gibi sunmak.
- İki görev arasında psikometrik eşdeğerlik veya uzun süreli bilgi kalıcılığı varsaymak.
- Tek bir başarılı rubrik üzerine öğrenciyi "Kalıcı" hâkimiyet durumuna yükseltmek.
- Koç değerlendirmesi yokken kendiliğinden rubrik puanı vermek.
- Öğrenciye koçun yerine yeni görev atamak.
- Aralıklı tekrar planını otomatik değiştirmek.

## Gösterilen durumlar

- **ACTION_NOT_VERIFIED:** Atama henüz koç tarafından kabul edilmedi.
- **AWAITING_INDEPENDENT_MEASUREMENT:** Kabul edildi; daha sonra uygun bir bağımsız rubrik yok.
- **TRANSFER_BEFORE_ACTION:** İkinci görev, koçun telafi kabulünden önce teslim edildi; önce-sonra ilişki kurulamaz.
- **OBSERVED_AFTER_ACTION:** Uygun bir ikinci rubrik var; ölçüt puanı farkı sınırlılık notuyla sunulur.
- **SOURCE_NOT_VERIFIABLE:** Kaynak puanı, görev sürümü veya bağlantı doğrulanamadı.

## Arayüz

Koç → Öğrenci → Öğrenme Zekâsı → Ölçüte Özel Telafi ve Koç Aksiyonları: kabul edilen telafilerin kaçının yeniden ölçüldüğü, ölçülmeyenler ve her çalışmada ölçüt puanı farkı.

Öğrenci → Yanlış Soru Bankası → Eksik Becerime Özel Bugünkü Çalışma → Koç tarafından incelenen çalışmalar: yalnız öğrencinin kendi telafisine ait karşılaştırma veya henüz bağımsız ölçüm bulunmadığı açıklaması.

## Sınırlar

- Raporda MEB TYMM kaynaklı özgün KEKS görevleri kullanılabilir; bu durum sorulara MEB onayı veya haricî alan uzmanı onayı kazandırmaz.
- Telafi öncesi/sonrası rubrik farkı **etki tahmini** değildir. Gerekli görülürse koç yeni bir bağımsız görev planlamalıdır.
- Önceki veriler eksik veya tarihleri yanlışsa karşılaştırma yapılmaz; eksiklik açıkça belirtilir.
- Veritabanı migrasyonu yok; mevcut öğrenciye ait günlük kayıtlar salt okunur biçimde analiz edilir.
