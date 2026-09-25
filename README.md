# KEKS Akademi — Kazandıran Eğitim ve Koçluk Sistemi

Public uygulama iskeleti: öğrenci/koç/yönetici rolleri, mevcut öğrenci planlarını bozmayan migrasyon, KEKS Akademi kodu veya merkezi ürün yapılandırmasındaki güncel satış fiyatıyla test erişimi ve test tamamlanınca yöneticiye e-posta raporu.

## Temel kurallar

- Her koç kendi hesabını açar; hesap **yönetici onayı** olmadan aktifleşmez.
- Koç yalnızca kendi öğrencilerini görür.
- Öğrenci test ekranına yalnızca öğrenci paneline giriş yaptıktan sonra ulaşır.
- Test erişimi iki yolla açılır: yönetici tarafından üretilmiş KEKS Akademi kodu veya merkezi ürün yapılandırmasındaki güncel fiyatla başarılı ödeme.
- Liste ve satış fiyatları uygulama metinlerine hard-code edilmez. Yönetici panelindeki merkezi ürün yapılandırması; ürün vitrini, PayTR ödeme tutarı, test erişimi ve kampanya gösterimini besler.
- Yeni veya riskli modüller doğrudan bütün kullanıcılara açılmaz; yönetici feature flag ile kapalı, pilot öğrenci veya tüm kullanıcı modunu seçebilir.
- Production API 500 hataları request ID, endpoint, zaman ve hata sınıfıyla izlenir. Şifre, token, cookie, doğrulama kodu ve istek gövdesi hata kaydına yazılmaz.
- Ödeme sonucu tarayıcı ekranına güvenilerek değil PayTR callback hash doğrulamasıyla işlenir.
- Gerçek KEKS soru havuzu **public repoya konmaz**.
- Test tamamlandığında rapor `REPORT_RECIPIENT` adresine gönderilir; varsayılan hedef `keksakademi@gmail.com`.
- Eski öğrenci kodları, planlar, günlük kayıtlar ve deneme sonuçları silinmez; migrasyon `upsert` ile yapılır.
- Hesap askıya alma veri silmez. Kalıcı silme yalnız koruma süresi dolduktan sonra ayrı ve açık bir işlemle yapılır.
- Psikometrik sonuçlar tanı veya kesin kişilik gerçeği olarak sunulmaz; gözlenebilir çalışma davranışları ve açıklanabilir sinyaller kullanılır.

## Kurulum

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## Testler

```bash
npm test              # birim testleri, veritabanı gerektirmez
npm run test:coverage # kapsam raporu ve eşik kontrolü
```

Entegrasyon testleri gerçek bir Postgres ister; transaction geri alması ve
eşzamanlılık gibi yalnızca gerçek veritabanının kanıtlayabileceği davranışları
doğrular:

```bash
docker compose -f docker-compose.test.yml up -d
DATABASE_URL="postgresql://keks:keks@localhost:5433/keks_test" npm run test:integration
```

Testler tüm tabloları boşaltır; bu yüzden hedef veritabanının adında `test`
geçmezse çalışmayı reddederler.

## Güvenlik

Gerçek test soruları, veritabanı parolaları, PayTR anahtarları ve e-posta API anahtarları public repoya commit edilmez. Parolalar ve doğrulama sırları tarayıcı depolamasına yazılmaz; yönetici API'leri parola hash'i döndürmez; giriş ve doğrulama akışlarında hız/deneme sınırları uygulanır.

## Production yayın kapısı

Production yayını yalnız TypeScript, birim/kapsam, PostgreSQL entegrasyon testleri ve production build başarılı olduktan sonra CI tarafından oluşturulan onay commit'i üzerinden ilerler. Kırmızı CI doğrudan production deploy tetiklemez.

## Raporlama

KEKS raporu “Eğitsel Çalışma ve Öz-Düzenleme Eğilimleri Taraması” olarak sunulur. Psikolojik tanı veya kesin kişilik tipi iddiasında bulunmaz.
