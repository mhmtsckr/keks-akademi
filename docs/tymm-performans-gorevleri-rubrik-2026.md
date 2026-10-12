# KEKS Akademi — TYMM Açık Uçlu ve Performans Değerlendirme Pilotu

**Tarih:** 12 Ekim 2026. **Durum:** Pilot, alan öğretmeni doğrulaması bekliyor.

## Ne eklendi?

Çoktan seçmeli içerik motoruna ek olarak **ayrı bir performans görevi** kanalı kurulmuştur. Bu, 46 mikro ders / 184 alıştırma sayısını değiştirmez; yeni kanalda 6 ayrı *performans görevi* vardır.

- 5. sınıf Fen Bilimleri: Ay evrelerini model kurarak yorumlama (FB.5.1.3) ve hücre modellerini karşılaştırma (FB.5.3.1).
- 6. sınıf Fen Bilimleri: Düşük gerilimli örnekle iletkenlik deneyini güvenli biçimde planlama (FB.6.6.1).
- 9. sınıf Fizik: Skaler ve vektörel nicelikler için gerekçeli açık uçlu yanıt (FİZ.9.2.2).
- 10. sınıf Kimya: Tepkimeyi atomların korunumuyla denkleştirme ve adımları açıklama (KİM.10.1.6).
- 11. sınıf Biyoloji: Işığa yönelme için hipotez, değişken ve gözlem planı (BİY.11.1.3).

Bu görevler belirli resmî öğrenme çıktılarıyla bağlanmıştır (kaynaklar görev kaydında bulunur). MEB tarafından hazırlanmış veya bağımsız alan uzmanı tarafından onaylanmış KEKS soruları değildir.

## İş akışı

1. Öğrenci, kendi kayıtlı gerçek sınıfı için hazırlanan görevi görür. 5–6 veya 9–10 gibi **birleşik eğitim düzeyinde önce gerçek sınıfını seçer**.
2. Görev talimatlarını ve 4 ölçütlü rubriği görür; yazılı açıklamasını ve model/gözlem/deney kanıt planını girerek *kendi çalışması* olarak teslim eder.
3. Gönderim özel öğrenci kaydıdır ve yalnız öğrenci ile **ona atanmış koç** tarafından incelenebilir. Öğretmen değerlendirmesi olmadan puan atanmaz.
4. Yetkili koç, öğrencinin açıklamasını okur ve her rubrik ölçütünü 0/1/2 puanla değerlendirir. **0 = yanlış veya kanıtsız, 1 = kısmen doğru, 2 = yeterli/doğru/gerekçeli.** En fazla 8 puan elde edilebilir.
5. Koç en az 30 karakter açıklamalı geribildirim yazar; geribildirime göre yeniden deneme, farklı bağlamda ölçme veya koç görüşmesi önerir.
6. Koç kararı tarih ve yetkili kimliğiyle saklanır; ilk inceleme değiştirilmez. Koç tarafından incelenen kayıt ve puanı öğrenci görür. Yalnız metin ve metinsel gözlem tanımı vardır; fotoğraf/video kanıtı, fiziksel deney gerçekleştirme doğrulaması ve otomatik yapay zekâ puanlaması **yoktur**.
7. Öğrenci aynı görevi 7 günde en fazla 3 kez gönderebilir. Kötüye kullanımı sınırlayan metin uzunluğu / öğrenci sahipliği / gerçek sınıf / oturum kontrolleri uygulanır.

## Kalıcı öğrenme ile ilişki

**Hayır:** Rubrik puanı, tek başına öğrencinin bilgi hâkimiyetini **Kalıcı** durumuna yükseltmez; aralıklı tekrar planını ve netleri değiştirmez. Öğrenci daha sonra farklı bağlamda bağımsız ve gecikmeli ölçülmelidir. Koç değerlendirmesi manuel bir eğitim kanıtıdır; rubrik bilişsel değerlendirme aracıdır, tanı değildir.

## Güvenlik

- Priz veya şebeke gerilimine temas içeren elektrik deneyi yasaktır. Gerçek deney yalnız düşük gerilimli eğitim malzemeleri ve öğretmen gözetiminde yapılabilir; **kâğıt üzerinde güvenli plan yapmak yeterlidir**.
- Kimya görevi kâğıt üzerinde denklem çözümüdür; yakma/reaksiyon gerçekleştirme görevi yoktur.
- Güçlü ısı kaynakları ve Güneş'e doğrudan bakma görevi yoktur.
- Gönderimler `DailyLog` JSON kayıtlarında `TYMM_PERFORMANCE_SUBMISSION` olarak kalıcılaşır; manuel koç kararı atomik durum güncellemesiyle `TYMM_PERFORMANCE_REVIEWED` yapılır. Veritabanı migrasyonu gerektirmez.
- Koç, yalnız `student.coachId === user.coachProfile.id` ilişkisi bulunan öğrenciyi değerlendirebilir.
- Onaylı MEB çıktı kodu ile **KEKS öğretmen onayı** ayrı tutulur; bütün görevler **PILOT** etiketlidir.

## İleri aşamalar

- Branş öğretmenlerinin tek tek görev talimatlarını, 0–2 seviyelerini ve örnek yanıtları editöryal olarak gözden geçirmesi.
- Çok kriterli rubrik güvenilirliğini test etmek için iki değerlendirici puanının tutarlılığı ve moderasyon süreci.
- Dosya/görsel kanıtı için güvenli, izinli dosya altyapısı; bunun olmaması gerçek deney sonuçlarının doğrulandığı anlamına gelmez.
- Bağlamı değiştirilmiş transfer görevleri ve sonraki hafta gecikmeli bağımsız performans ölçümleri.
- Resmî kazanım dizini tamamlanmadan bütün sınıf konularının değerlendirildiği iddia edilmemeli.
