import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createPaytrToken, verifyPaytrCallback } from './paytr';

// Bu paket, kimlik doğrulaması olmayan ve herkese açık olan PayTR callback
// uç noktasının tek güvenlik kapısını doğrular: app/api/paytr/callback/route.ts

/** Uygulamanın beklediği imzayı üretir (mutlu yol kurulumu için). */
function signCallback(body: Record<string, string>) {
  const base = `${body.merchant_oid}${process.env.PAYTR_MERCHANT_SALT}${body.status}${body.total_amount}`;
  return crypto.createHmac('sha256', process.env.PAYTR_MERCHANT_KEY!).update(base).digest('base64');
}

function callbackBody(overrides: Record<string, string> = {}) {
  const body: Record<string, string> = {
    merchant_oid: 'KEKS1700000000abcdef01',
    status: 'success',
    total_amount: '35000',
    ...overrides,
  };
  return { ...body, hash: signCallback(body) };
}

describe('verifyPaytrCallback', () => {
  // Sabit vektör: imza tabanının sırası (oid + salt + status + amount) PayTR ile
  // yapılan sözleşmedir. Sıra değişirse bu test kırılır — üretimde sessizce
  // tüm ödemelerin reddedilmesindense burada kırılması iyidir.
  it('PayTR sözleşmesine göre hesaplanan sabit imzayı kabul eder', () => {
    expect(
      verifyPaytrCallback({
        merchant_oid: 'KEKS1700000000abcdef01',
        status: 'success',
        total_amount: '35000',
        hash: 'sxUy+rO51dKpUc8lm3n8JnpNzFtjuZHpKtPb/KpnfXc=',
      }),
    ).toBe(true);
  });

  it('geçerli imzayı kabul eder', () => {
    expect(verifyPaytrCallback(callbackBody())).toBe(true);
  });

  it('başarısız ödeme bildirimlerinin imzasını da doğrular', () => {
    expect(verifyPaytrCallback(callbackBody({ status: 'failed' }))).toBe(true);
  });

  // --- Regresyon: hata 1 ---------------------------------------------------
  // crypto.timingSafeEqual farklı uzunluktaki tamponlarda RangeError fırlatır.
  // Düzeltmeden önce buradaki her senaryo, hedeflenen 400 yerine yakalanmamış
  // bir 500'e dönüşüyordu.
  describe('bozuk uzunluktaki imzalarda fırlatmaz, false döner', () => {
    it('hash alanı hiç yoksa', () => {
      const { hash: _omitted, ...body } = callbackBody();
      expect(() => verifyPaytrCallback(body)).not.toThrow();
      expect(verifyPaytrCallback(body)).toBe(false);
    });

    it('hash boş metinse', () => {
      expect(() => verifyPaytrCallback(callbackBody())).not.toThrow();
      expect(verifyPaytrCallback({ ...callbackBody(), hash: '' })).toBe(false);
    });

    it('hash kısaysa', () => {
      expect(verifyPaytrCallback({ ...callbackBody(), hash: 'kisa' })).toBe(false);
    });

    it('hash uzunsa', () => {
      expect(verifyPaytrCallback({ ...callbackBody(), hash: 'x'.repeat(200) })).toBe(false);
    });
  });

  // --- Kurcalama -----------------------------------------------------------
  it('aynı uzunlukta fakat farklı bir imzayı reddeder', () => {
    const body = callbackBody();
    const forged = 't' + body.hash.slice(1);
    expect(forged).toHaveLength(body.hash.length);
    expect(verifyPaytrCallback({ ...body, hash: forged })).toBe(false);
  });

  it('tutar değiştirilmişse reddeder', () => {
    expect(verifyPaytrCallback({ ...callbackBody(), total_amount: '1' })).toBe(false);
  });

  it('durum değiştirilmişse reddeder', () => {
    expect(verifyPaytrCallback({ ...callbackBody({ status: 'failed' }), status: 'success' })).toBe(false);
  });

  it('sipariş numarası değiştirilmişse reddeder', () => {
    expect(verifyPaytrCallback({ ...callbackBody(), merchant_oid: 'KEKS-baskasi' })).toBe(false);
  });
});

describe('createPaytrToken', () => {
  const params = {
    merchantOid: 'KEKS1700000000abcdef01',
    email: 'ogrenci@example.com',
    amountKurus: 35000,
    userIp: '88.77.66.55',
    basketJson: 'W1siS0VLUyIsIjM1MC4wMCIsMV1d',
    noInstallment: '0',
    maxInstallment: '0',
    currency: 'TL',
    testMode: '1',
  };

  // Sabit vektör: alan sırası ve salt'ın sona eklenmesi (base + salt) PayTR
  // token sözleşmesidir.
  it('PayTR sözleşmesine göre sabit token üretir', () => {
    expect(createPaytrToken(params)).toBe('wvTy4yZUPmau0ycpo4neANejHBmaLX1OErkND9komvo=');
  });

  it('aynı girdi için deterministiktir', () => {
    expect(createPaytrToken(params)).toBe(createPaytrToken(params));
  });

  it.each([
    ['merchantOid', { merchantOid: 'KEKS-baska' }],
    ['email', { email: 'baska@example.com' }],
    ['amountKurus', { amountKurus: 1 }],
    ['userIp', { userIp: '1.2.3.4' }],
    ['testMode', { testMode: '0' }],
  ])('%s değişince token değişir', (_alan, override) => {
    expect(createPaytrToken({ ...params, ...override })).not.toBe(createPaytrToken(params));
  });
});

describe('ortam değişkenleri eksikken', () => {
  /** PAYTR anahtarlarını geçici olarak kaldırır. */
  function anahtarsiz(fn: () => void) {
    const key = process.env.PAYTR_MERCHANT_KEY;
    const salt = process.env.PAYTR_MERCHANT_SALT;
    delete process.env.PAYTR_MERCHANT_KEY;
    delete process.env.PAYTR_MERCHANT_SALT;
    try {
      fn();
    } finally {
      process.env.PAYTR_MERCHANT_KEY = key;
      process.env.PAYTR_MERCHANT_SALT = salt;
    }
  }

  // Yanlış yapılandırılmış bir ortamda doğrulayıcı her şeyi kabul etmek yerine
  // her şeyi reddetmelidir (fail-closed).
  it('mağaza anahtarı yoksa geçerli imzayı dahi reddeder', () => {
    const gecerli = callbackBody();
    anahtarsiz(() => {
      expect(verifyPaytrCallback(gecerli)).toBe(false);
    });
  });
});
