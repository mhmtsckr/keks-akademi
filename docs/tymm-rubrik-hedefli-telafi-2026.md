# KEKS Akademi — Rubrik Ölçütünden Somut Telafi Çalışmasına (2026–2027 Pilot)

## Amaç
Koç bir TYMM performans görevini dört ölçütle (0–2 puan) değerlendirdikten sonra, **yalnız düşük puanlanan ölçütlere (0 veya 1)** bağlı somut, yaşa uygun ve güvenli öğrenme müdahalesi görür. Öğrenciye kendiliğinden görev atanmaz.

## Uygulanan ölçüt → aksiyon zinciri
1. Öğrenci gerçek sınıfının ilk veya gecikmeli performans görevini tamamlar.
2. Atanmış koç rubriğin dört ölçütünü puanlayıp gerekçe yazar. Rubrik değiştirilmez.
3. KEKS, 8 TYMM görevindeki 32 ölçütün her biri için özel yazılmış kısa çalışmadan **en düşük puanlı en fazla iki** öneriyi gösterir.
4. Koç uygun öneriyi seçer ve **kişisel müdahale notu (en az 20 karakter)** yazar. Otomatik onay yoktur.
5. Sunucu, öğrenci–koç sahipliğini, değerlendirilmiş ve geçerli özgün rubriği, ölçütte gerçekten 0–1 puan bulunduğunu ve önerinin doğru görev/ölçüte ait olduğunu doğrular.
6. Onaylanan görev kişiye özel `DailyLog` kaydına `TYMM_RUBRIC_ACTION` ile atanır. Aynı rubrik kaydındaki aynı ölçüte aynı görev ikinci kez atanamaz; PostgreSQL transaction advisory lock çift tıklama/eş zamanlı istekleri engeller.
7. Öğrenci kendi panelinde 5–10 dakikalık çalışmayı, beklenen kanıtı ve koç notunu görür. Görevi yaptığını yalnız işaretlemez; **en az 40 karakter gerekçe/kanıt** yazar ve çalışmanın kendisine ait olduğunu beyan eder.
8. Sunucu öğrenci sahipliği ve `ASSIGNED` durumunu doğrular, kaydı tek seferlik `DONE` durumuna geçirir. Koç öğrencinin gerekçesini görür.

## Örnekler
- **5. sınıf Fen / Ay'ın evreleri / phases=0:** Yeni ay ve dolunayın görünen aydınlık yüzünü şemada karşılaştır, nedenini yaz.
- **6. sınıf Fen / Elektrik güvenliği / safety=0:** Priz kullanmadan kâğıt üzerinde yalnız düşük gerilimli sınıf deneyinin güvenlik kurallarını yaz. Gerçekte deney zorunlu değildir.
- **9. sınıf Fizik / distinctions=1:** 100 m ilerleyip başlangıca dönen kişinin yolu/yer değiştirmesini ayır.
- **10. sınıf Kimya / oxygen=0:** 3O₂ ve 2Al₂O₃ ifadelerindeki oksijen atomlarını sayarak iki tarafı kontrol et.
- **11. sınıf Biyoloji / records=1:** Üç günlük fide yönelimi gözlemini ölçülebilir kayıt tablosuna dönüştür.
- **10. sınıf Coğrafya / privacy=0:** Gerçek kullanıcı adreslerini almadan üç kurgusal durakla harita şeması oluştur.

## Yetki ve kayıt bütünlüğü
- Öğrencinin `performance-actions` uç noktası başka bir öğrencinin görevini okuyamaz veya tamamlayamaz.
- Koçun `/coach/students/[id]/performance-actions` uç noktası yalnız `coachId=user.coachProfile.id` eşleşen öğrenciye işlem yapabilir.
- Koçun atamak istediği görev metni istemciden alınmaz. Görev ve beklenen kanıt sunucudaki sürümlü KEKS kataloğundan okunur; öğrenci istemcisi yalnız ödev ID ve kendi açıklamasını iletebilir.
- Bilinmeyen kriter, geçersiz rubrik, yanlış öğrenci veya daha önce atanmış ölçüt reddedilir.
- Öğrenci `DONE` kaydı koçun rubriğini, aralıklı tekrar planını veya bilgi hâkimiyetini **otomatik yükseltmez**.
- Yeni çalışmalar resmî MEB/ÖSYM veya branş uzmanı tarafından onaylanmış olarak tanıtılmaz. Resmî çıktı kaynakları ve KEKS'in insan onayı ayrı süreçlerdir.
- Öğrencinin yazılı kanıtının gerçekten bağımsız üretildiği sistem tarafından kanıtlanmış değildir; yalnız öğrencinin beyanı saklanır.

## Sonraki kalite geliştirmeleri
Açık uçlu telafinin etkinliği gecikmeli ve **başka soru bağlamında** yeniden ölçülecek. Koçlar arası rubrik tutarlılığı, düşük puanlı riskli görevlerin ikinci gözden geçirilmesi, moderasyon ve pedagojik editör onayı ayrıca gerekmektedir. Buradaki 32 eşleme, MEB'in bütün ders/kazanımlarına tam kapsam iddiası değildir.
