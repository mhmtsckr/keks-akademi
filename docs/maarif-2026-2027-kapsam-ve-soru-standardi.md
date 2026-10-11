# KEKS Akademi — 2026–2027 müfredat/sınav uyumlu mikro ders üretimi

## Kaynak ve çerçeve
Güncellik: 12 Ekim 2026. Öğretim programının sınıfta yürürlüğe giriş yılı ile içerikte önerilen pedagojik biçim ayrı iki veridir.

- MEB temel eğitim 2026–2027: https://tymm.meb.gov.tr/taslak-cerceve-planlari/temel-egitim
- MEB ortaöğretim 2026–2027: https://tymm.meb.gov.tr/taslak-cerceve-planlari/ortaogretim
- Ders ve program araması: https://tymm.meb.gov.tr/ogretim-programlari/
- ÖSYM sınav duyuru, kılavuz ve güncellemeleri: https://www.osym.gov.tr/

| Gerçek sınıf | Program |
|---|---|
| 1, 2, 3 | TYMM |
| 4 | Önceki MEB programı |
| 5, 6, 7 | TYMM |
| 8 / LGS | Önceki MEB programı + 2026–2027 LGS kapsamı |
| 9, 10, 11 | TYMM |
| 12 / YKS | Önceki MEB programı + 2026–2027 YKS kapsamı |
| Mezun / yetişkin | ÖSYM sınavına özgü kapsam ve konu-beceri haritası |

**KEKS temel kuralı:** MEB'in TYMM kademeli uygulama takvimi otomatik olarak ÖSYM'nin TYT/AYT, LGS, AGS/ÖABT, KPSS, DGS, ALES ve dil sınavlarının tüm soru biçimlerini veya kazanım kodlarını tanımlamaz. Her sınavın resmî kılavuzu ve kapsamı ayrıca kontrol edilir.

## İçerik üretim hattı (kapsam büyütme)
1. Eğitim yılı + gerçek sınıf veya sınav seç.
2. Sınıf → ders → ünite/tema → konu → alt konu → **resmî öğretim programından doğrulanmış kazanım/öğrenme çıktısı** alanlarını birleştir. Resmî çıktı henüz kontrol edilmediyse KEKS iç konu etiketi kullan ve `officialOutcomeVerified=false` olarak tut.
3. Bilişsel talep ile beceriyi yaşa ve sınava göre belirle: ör. sınıf 1 kısa görsel/okuma desteği; sınıf 5–7 etkinlik, çıkarım, süreç sorusu; sınıf 8 önceki program LGS muhakemesi; sınıf 9–11 TYMM beceri ve süreç odaklı ölçme; sınıf 12 önceki programın TYT/AYT soru yaklaşımı; yetişkin sınavının ayrı alan/test kapsamı.
4. Her **gerçek** kazanım için bir kısa açıklama, özgün çözümlü örnek, en az dört yeni alıştırma, gerekçeli cevap anahtarı ve bir kavram yanılgısı kaydet. Öğrenme süreci ilerledikçe farklı soru türü/bağlamı ekle.
5. Özgünlük ve telif kontrolü yap: ÖSYM soru metni, kitapçığı veya MEB yayınlarının örnek soruları izinsiz kopyalanmaz. Kaynak alıntısı, gerektiğinde kuruma ait içerik lisansı ile değerlendirilir.
6. Doğruluk testleri + pedagojik editör + branş uzmanı incelemesi yap. `APPROVED` mevcut üründe yönetici incelemesini ifade eder, bağımsız uzman unvanını doğrulamaz.
7. Önce sınırlı pilot öğrencide uygula; hatalı anahtar oranı, açıklama netliği, tekrar ölçümü ve farklı soruya transfer başarısı analiz et.
8. 0–1–3–7–14–28 günlük tekrar döngüsü yalnız bağımsız, gecikmeli doğru performansla ilerlemeli. Mikro dersin görülmesi veya bir tek soru başarısı "Kalıcı" sayılmaz.

## Başlangıç uygulaması
- Daha önce 12 mikro ders ve 48 bağımsız alıştırma vardı.
- Bu sürümde **12 yeni sınıf odaklı pilot mikro ders** eklendi: 1–12. sınıfların her birinde ayrı başlangıç; 48 ek yeni alıştırma.
- Toplam 24 pilot/içerik ve 96 alıştırma kodda. Bu, **her konu bitirildi** anlamına gelmez.
- `lib/curriculumPolicy2026.ts` sınıf/göreli program ayrımı ve düzey güvenlik kontrolünü sağlar.
- `lib/gradeSeedMicroLessons.ts` onay bekleyen özgün örnekleri içerir.
- Öğrencinin eğitim düzeyi 1–3, 5–6 veya 9–10 gibi bir grupsa gerçek sınıf sorulur; 1. sınıfın sorusu 3. sınıfa atanmaz.
- `lib/microLessonCoverage2026.ts` ve yönetici paneli tüm düzeylerde içerik açıklarını gösterir. Düzey genelinde **doğrulanmış resmî konu dizini yoksa toplam konu sayısını/başarı oranını uydurmaz**.
- 2026–2027 8. sınıf için gelecekteki TYMM kazanım taslağı resmî yürürlükteymiş gibi kullanılmaz; mevcut LGS konu dizini açıkça KEKS iç indeksi olarak sunulur.

## Gerçek tam kapsam için yapılması gerekenler
- MEB resmî öğretim programlarını **sürüm/yıl/sınıf/ders/tema/öğrenme çıktısı** bazında denetlenebilir bir kaynaklı konu indeksine aktar (müfredatın tamamı bu PR'da aktarılmış **değildir**).
- ÖSYM/ilgili kurumun her sınavına özgü güncel kılavuz ve test kapsamını içeriğe bağla; eski kapsamı yıl etiketine göre arşivle.
- Üretim işlerini kazanım bazında yönet: `MISSING → DRAFT → FACT_CHECKED → PEDAGOGY_REVIEWED → APPROVED` iş akışı için editör rolü, örnek çözüm doğrulaması, gerekçe ve test kayıtları gerekir. Mevcut üründeki `PILOT/APPROVED` yönetici kontrolü bunun yalnız başlangıcıdır.
- Bilim, dil, tarih ve mevzuat gibi alanlarda tarihe duyarlı iddiaları kaynakla doğrula.
- 1. sınıf için okuma henüz gelişmekteyken sesli/görsel destek, yüksek yaşlarda çok basamaklı yeni bağlam soruları ekle.
- Dersler arası başlık benzerliğiyle otomatik eşleşme yapma; kazanım kodu doğrulanmadıkça kesin kazanım teşhisi gösterme.

## Onay durumu
Bu sürümün dersleri otomatik **PILOT** olarak eklenir. Kod testlerinin geçmesi veya yöneticinin soru anahtarına bakması, **bağımsız MEB/ÖSYM onayı** anlamına gelmez. Resmî kuruluşun onayını iddia etmek için ayrıca kanıt gerekir.
