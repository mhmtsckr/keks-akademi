# Günlük mikro öğrenme

Öğrenci ana sayfasında Bugünün Planı altında, oyunlaştırmadan bağımsız MICRO_LEARNING özellik bayrağıyla yönetilir. ALL/OFF/PILOT modlarını mevcut yönetici özellik ekranı destekler.

- 3/4/5 dakika filtresi, eğitim ve sınav grubuna göre görevler; çalışma kaydı olmayan öğrenciler de başlayabilir.
- 5 İngilizce kelime (15 temel, 15 üst düzey kelimeden dönen setler), 3 yazar–eser eşleştirmesi (9 çift), 5 olayı kronolojik sıralama (3 set), düzeye uygun sayıları değişen 3 problem ve öğrencinin vadesi gelmiş 1 yanlış sorusu.
- Bu bir başlangıç içerik havuzudur; kapsamlı müfredat veya sınav denemesi değildir. Kısa set başarısı bilgi hâkimiyetini otomatik olarak “kalıcı” yapmaz.
- Son yedi günde düşük doğruluk gösterilen kategoriler öne çıkar, vadesi gelen kişisel yanlış önceliklidir. Konu düzeyinde adaptif içerik üretimi henüz yoktur.
- Sonuç ve açıklama yalnız sunucuda değerlendirmeden sonra döner. Yanlış tekrarının yeni tarihi mevcut adaptif tekrar motorundan gelir.
- Öğrenci günlük/haftalık özeti ve koç öğrenci detayında haftalık oturum, doğru/yanlış/boş, kayıtlı süre ve son sonuçlar.

## Kalıcılık ve güvenlik

Mevcut DailyLog modeli MICRO_STARTED ve MICRO_RESULT sürümlü JSON kayıtlarını tutar. Ek tablo veya migration gerektirmez. Cevap anahtarı başlangıç kaydına konmaz. Submit, oturumun sahibi ve durumunu doğrular; koşullu güncelleme eşzamanlı tekrar sayımını önler. Başarılı isteğin yeniden gönderimi saklanan sonucu döndürür. Kişisel yanlış sonucu ile tekrar kuyruğu güncellemesi aynı transaction içindedir. Review kuyruğu koşullu güncellemesi farklı oturumlardan eşzamanlı tekrar ilerlemesini engeller.

Takvim Europe/Istanbul gün sınırını kullanır. Günlük 30 başlangıç sınırı kullanıcı deneyimi sınırıdır; eşzamanlı istekler için katı bir kota değildir. Oturum 24 saat sonra sona erer. Süre sunucu başlangıcından ölçülür ve oturum başına 300 saniyeye kırpılır; aktif odak süresi iddiası taşımaz. Bu bilgi öğrenci ekranında belirtilir. Sayfa yenilenirse cevap taslağı korunmaz; bitmemiş oturum tamamlanmış sayılmaz. Mini öğrenme XP üretmez.

## Doğrulama

`npx tsc --noEmit`, `npm test`, `npm run build`. Ek testler eğitim grubu filtrelerini, Türkiye gece yarısını, sunucu puanlamasını, cevap anahtarının gizlenmesini, oturum sahipliğini, tekrar gönderimini ve başarısız kayıtta ekrandaki cevapların korunmasını kapsar.
