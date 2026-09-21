// Testler geliştiricinin yerel .env dosyasına bağlı olmamalı: kritik ortam
// değişkenleri burada sabitleniyor. Gerçek anahtarlar asla kullanılmaz.
process.env.AUTH_SECRET = 'test-auth-secret-at-least-32-bytes-long-0123456789';
process.env.PAYTR_MERCHANT_ID = '000000';
process.env.PAYTR_MERCHANT_KEY = 'test-merchant-key';
process.env.PAYTR_MERCHANT_SALT = 'test-merchant-salt';
process.env.PAYTR_TEST_MODE = '1';
process.env.TEST_PRICE_KURUS = '35000';
process.env.APP_URL = 'http://localhost:3000';
process.env.REPORT_RECIPIENT = 'keksakademi@example.com';
