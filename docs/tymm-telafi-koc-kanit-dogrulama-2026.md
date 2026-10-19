# KEKS Akademi — Ölçüte Özel Telafide İnsan Doğrulaması

**Tarih: 19 Ekim 2026.** TYMM pilot geliştirmesidir, MEB onayı veya öğretmen sertifikasyonu değildir.

## Sorun

Önceki akışta öğrenci yazılı telafi çalışmasını gönderince kayıt doğrudan `DONE` oluyordu. Bu ifade, koçun kanıtı okuyup eğitimsel olarak yeterli bulduğu algısını yaratabilirdi.

## Yeni durum makinesi

| Durum | Kim değiştirir? | Anlam |
|---|---|---|
| `ASSIGNED` | Koç | Eksik rubrik ölçütü için çalışma atandı |
| `SUBMITTED_FOR_REVIEW` | Öğrenci | Gerekçeli açıklama gönderildi, henüz koç onayı yok |
| `REVISION_REQUIRED` | Atanmış koç | Kanıt eksik; gerekçe ve yeniden çalışma gerekli |
| `VERIFIED` | Atanmış koç | Somut gönderim incelendi ve **telafi kanıtı** yeterli görüldü |
| `COACH_DISCUSSION_REQUIRED` | Atanmış koç | 3 değerlendirmede eksik; yeni otomatik deneme yerine görüşme önerilir |
| `DONE` | Eski kayıt | Sadece geçmiş öğrenci tamamlandı bildirimi; koç doğrulaması **yok** |

Öğrenci ilk ve iki ek revizyon olmak üzere en fazla üç kez yazılı kanıt sunabilir. Koç, her gönderim için kabul veya revizyon kararını ve **en az 30 karakterlik somut açıklamayı** kaydeder. Koç kararları öğrenciye gösterilir. Önceki gönderim metinleri ve değerlendirmeleri aynı öğrencinin özel kayıt geçmişinde korunur.

## Koruma ve denetim

- Öğrenci yalnız **kendi** telafi kaydını gönderebilir; `studentId` sunucu oturumundan alınır.
- Koç yalnız kendisine atanmış öğrencinin yazılı kanıtını görebilir ve değerlendirebilir; öğrenci koç kararını veremez.
- Durum geçişleri `updateMany` JSON status koşuluyla atomik yürütülür; eşzamanlı ikinci işlem eski durum üzerinde başarılı olamaz.
- Öğrencinin gönderdiği kısa metin veya koçun yeterince açıklanmamış kararı reddedilir.
- `VERIFIED` yalnız telafi kanıtının **insan tarafından kabul edilmesi** demektir; ölçülen kazanımın psikometrik olarak öğrenildiği, `Kalıcı` olduğu, MEB onaylı içerik olduğu veya fiziksel deneyin yapıldığı sonucu çıkarılmaz.
- `Yeni → Öğreniliyor → Pekiştiriliyor → Kalıcı → Riskli` bilgi hâkimiyeti ile 0–1–3–7–14–28 günlük tekrar programı **otomatik değiştirilmez**.
- Eski `DONE` kayıtlarının durumu geriye dönük olarak yapay biçimde `VERIFIED` yapılmaz. Eğitim koçunun gerçek onay kaydı uydurulmaz.
- Yeni veritabanı migrasyonu yoktur; mevcut özel `DailyLog.payload` JSON durumları ve deneme/değerlendirme geçmişleri kullanılır.

## Tamamlanmamış kalite işleri

Bu sürüm öğrencinin verdiği metinsel kanıtın incelemesini düzenler. Gerçek deney gözlemi, foto/video doğrulaması, iki bağımsız değerlendirici arasındaki tutarlılık, tam müfredat kapsamı, kazanım bazlı uzman onayı ve gerçek öğrenci/koç hesabında uçtan uca test ayrı işlerdir. Bu eksikler tamamlanmadan "bilimsel olarak doğrulanmış öğrenme" iddiası kullanılmaz.
