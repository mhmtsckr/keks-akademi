// Entegrasyon testleri gercek bir veritabanina yazar ve tablolari bosaltir.
// Yanlislikla gelistirme ya da uretim veritabanina baglanmayi engelleyen kapi:
const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    'Entegrasyon testleri icin DATABASE_URL gerekli.\n' +
      '  docker compose -f docker-compose.test.yml up -d\n' +
      '  npm run test:integration',
  );
}

const veritabani = new URL(url).pathname.replace(/^\//, '');
if (!/test/i.test(veritabani)) {
  throw new Error(
    `Guvenlik kapisi: entegrasyon testleri tablolari TRUNCATE eder ve yalnizca adinda "test" gecen ` +
      `bir veritabaninda calisir. Simdiki hedef: "${veritabani}".`,
  );
}

// Route'larin ihtiyac duydugu diger degiskenler sabitlenir; DATABASE_URL
// bilerek disaridan gelir cunku hedef veritabanini o belirler.
process.env.AUTH_SECRET = 'test-auth-secret-at-least-32-bytes-long-0123456789';
process.env.PAYTR_MERCHANT_ID = '000000';
process.env.PAYTR_MERCHANT_KEY = 'test-merchant-key';
process.env.PAYTR_MERCHANT_SALT = 'test-merchant-salt';
process.env.APP_URL = 'http://localhost:3000';
process.env.REPORT_RECIPIENT = 'keksakademi@example.com';
