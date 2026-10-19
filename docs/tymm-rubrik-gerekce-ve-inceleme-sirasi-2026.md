# KEKS Akademi — İnsan Rubriği Gerekçe Kalitesi ve Koç İnceleme Önceliği

**19 Ekim 2026 — 2026–2027 TYMM değerlendirme iş akışı.**

## Mevcut sisteme eklenen kalite kontrolü

KEKS öğrenci–koç performans sistemi, ilk ve gecikmeli bağımsız görevlerde 4 kriterli (her biri 0–2) insan rubriği kullanır. Bu sürüm önceki rubrik, gecikmeli görev ve koçun telafi aksiyonu akışını korur; aynı özellikleri ikinci kez oluşturmaz.

1. **0 veya 1 puan** verilen her ölçüt için koç en az 20 karakterlik, en çok 500 karakterlik **gözlem temelli gerekçe** yazar. Genel geribildirim (en az 30 karakter) ayrıca zorunludur. 2 puan verilen ölçütte ek gerekçe isteğe bağlıdır; yazılırsa aynı kalite sınırı uygulanır.
2. Sunucu, rubrik ölçütünün gerçek görevde bulunmasını, puan/gerekçe anahtarlarının geçerli olmasını ve zorunlu gerekçelerin tamamlanmasını doğrular; gönderilen uydurma ölçütü reddeder.
3. Gerekçeler ilgili **insan koç değerlendirmesinin** içine kaydedilir. İlk ve transfer rubriklerinde öğrenciyle paylaşılır. Eski değerlendirme kayıtları geriye dönük değiştirilmez; gerekçe içermeyen tarihî kayıtların eski hâli korunur.
4. Koç ekranında **inceleme bekleyenler en eski gönderim önce** sıralanır. Sadece son 100 geçmiş kayda bakılmadığı için eski bekleyen gönderimler atlanmaz: ayrı bir en eski 100 bekleyen sorgusu kullanılır. Limit nedeniyle yüzlerce bekleyen kayıt varsa yine aşamalı/paginated kuyruk gereklidir.
5. **48 saati aşan teslimler** dikkat sinyali olarak gösterilir. Bu bir sözleşmesel SLA veya yanıt süresi garantisi değildir.
6. Rubrik puanı ve yazılı gerekçe **tek başına kalıcı öğrenme**, gerçek deney yapılmış olması, MEB/ÖSYM resmî onayı veya öğrenci hakkında tanı kanıtı değildir. Tekrarlama algoritması ve öğrencinin bilgiyi hâkimiyet statüsü bu kodla otomatik değiştirilmez.

## Sınırlar

- Başka bir öğretmenin çift kör değerlendirmesi ve puanlayıcılar arası uyum analizi henüz yok.
- Puanlayıcının yazdığı metin somut gözlem dayanağı gerektirir ancak otomatik anlam analiziyle bilimsel doğruluk sertifikası üretmez.
- **Bekleyen görevlerin tarihi** sunucudaki UTC zaman damgası üzerinden hesaplanır; kullanıcıya daha önce vaat edilmiş bir yanıt süresi yoktur.
- Öğrenciyle yalnız kendisine ait rubrik kanıtı paylaşılır, koç ise yalnız kendisine atanmış öğrencinin kayıtlarını görebilir.
- Denetim için sunucuda geçersiz/eksik gerekçeleri reddeden birim testleri ve yaşlandırılmış kuyruk sıralama testleri eklenmiştir.

## İzlenecek sonraki konular

- Rubrik düzeylerinin örnek yanıtlarla branş uzmanları tarafından kalibrasyonu.
- En az iki bağımsız insan puanlayıcı ve anlaşmazlık çözümünde denetim kaydı.
- Uzun kuyruklar için sunucu sayfalaması, profesyonel gecikme/yanıt süresi panelleri ve gereksiz öğrenci bildirimini önleyen hatırlatmalar.
- Kaynaklı TYMM kazanımı için gerçek deney ve model görevlerinin güvenli görsel kanıt/mahremiyet akışı; izinli dosya saklama ve uzman moderasyonu.
