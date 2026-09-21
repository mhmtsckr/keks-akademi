# KEKS Akademi — Kazandıran Eğitim ve Koçluk Sistemi

Public uygulama iskeleti: öğrenci/koç/yönetici rolleri, mevcut öğrenci planlarını bozmayan migrasyon, KEKS Akademi kodu veya 350 TL ödeme ile test erişimi ve test tamamlanınca yöneticiye e-posta raporu.

## Temel kurallar

- Her koç kendi hesabını açar; hesap **yönetici onayı** olmadan aktifleşmez.
- Koç yalnızca kendi öğrencilerini görür.
- Öğrenci test ekranına yalnızca öğrenci paneline giriş yaptıktan sonra ulaşır.
- Test erişimi iki yolla açılır: yönetici tarafından üretilmiş KEKS Akademi kodu veya başarılı 350 TL ödeme.
- Ödeme sonucu tarayıcı ekranına güvenilerek değil PayTR callback hash doğrulamasıyla işlenir.
- Gerçek KEKS soru havuzu **public repoya konmaz**.
- Test tamamlandığında rapor `REPORT_RECIPIENT` adresine gönderilir; varsayılan hedef `keksakademi@gmail.com`.
- Eski öğrenci kodları, planlar, günlük kayıtlar ve deneme sonuçları silinmez; migrasyon `upsert` ile yapılır.

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

Gerçek test soruları, veritabanı parolaları, PayTR anahtarları ve e-posta API anahtarları public repoya commit edilmez.

## Raporlama

KEKS raporu “Eğitsel Çalışma ve Öz-Düzenleme Eğilimleri Taraması” olarak sunulur. Psikolojik tanı veya kesin kişilik tipi iddiasında bulunmaz.
