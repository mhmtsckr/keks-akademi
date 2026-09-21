import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => import('@/test/helpers/db'));

import { db, formRequest, resetMocks } from '@/test/helpers';
import { POST } from './route';

const URL_ = 'http://localhost/api/paytr/callback';

/** PayTR'nin göndereceği biçimde imzalanmış bildirim gövdesi. */
function bildirim(ustler: Record<string, string> = {}) {
  const alanlar = {
    merchant_oid: 'KEKS1700000000abcdef01',
    status: 'success',
    total_amount: '35000',
    ...ustler,
  };
  const base = `${alanlar.merchant_oid}${process.env.PAYTR_MERCHANT_SALT}${alanlar.status}${alanlar.total_amount}`;
  const hash = crypto
    .createHmac('sha256', process.env.PAYTR_MERCHANT_KEY!)
    .update(base)
    .digest('base64');
  return { ...alanlar, hash };
}

const odeme = (ustler: Record<string, unknown> = {}) => ({
  id: 'odeme-1',
  merchantOid: 'KEKS1700000000abcdef01',
  studentId: 'ogrenci-1',
  status: 'PENDING',
  ...ustler,
});

beforeEach(() => {
  resetMocks();
  db.payment.findUnique.mockResolvedValue(null);
  db.payment.updateMany.mockResolvedValue({ count: 1 });
});

describe('POST /api/paytr/callback — imza doğrulaması', () => {
  it('imza geçersizse 400 döner ve veritabanına hiç bakmaz', async () => {
    const yanit = await POST(formRequest(URL_, { ...bildirim(), hash: 'sahte-imza' }));
    expect(yanit.status).toBe(400);
    await expect(yanit.text()).resolves.toContain('bad hash');
    expect(db.payment.findUnique).not.toHaveBeenCalled();
  });

  it('tutar kurcalanmışsa reddeder', async () => {
    const yanit = await POST(formRequest(URL_, { ...bildirim(), total_amount: '1' }));
    expect(yanit.status).toBe(400);
    expect(db.payment.findUnique).not.toHaveBeenCalled();
  });

  // --- Regresyon: hata 1, route seviyesinde --------------------------------
  // Düzeltmeden önce eksik hash timingSafeEqual'da RangeError fırlatıyor ve
  // bu uç nokta 400 yerine yakalanmamış 500 döndürüyordu.
  it.each([
    ['hash alanı yok', undefined],
    ['hash boş', ''],
    ['hash kısa', 'abc'],
  ])('bozuk hash alanında 500 değil 400 döner (%s)', async (_ad, hash) => {
    const { hash: _atilan, ...govde } = bildirim();
    const alanlar = hash === undefined ? govde : { ...govde, hash };
    const yanit = await POST(formRequest(URL_, alanlar));
    expect(yanit.status).toBe(400);
  });
});

describe('POST /api/paytr/callback — ödeme işleme', () => {
  it('bilinmeyen sipariş numarasında OK döner (PayTR yeniden denemesin diye)', async () => {
    const yanit = await POST(formRequest(URL_, bildirim()));
    expect(yanit.status).toBe(200);
    await expect(yanit.text()).resolves.toBe('OK');
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.payment.update).not.toHaveBeenCalled();
  });

  it('başarılı ödemede ödemeyi PAID yapar ve test erişimi açar', async () => {
    db.payment.findUnique.mockResolvedValue(odeme());
    const yanit = await POST(formRequest(URL_, bildirim()));

    expect(yanit.status).toBe(200);
    expect(db.payment.findUnique).toHaveBeenCalledWith({
      where: { merchantOid: 'KEKS1700000000abcdef01' },
    });
    // İkisi de tek transaction içinde olmalı
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    // Kosullu updateMany iyimser kilit: yalnizca hala PAID olmayan satiri alir
    expect(db.payment.updateMany).toHaveBeenCalledWith({
      where: { id: 'odeme-1', status: { not: 'PAID' } },
      data: { status: 'PAID', providerPayload: expect.objectContaining({ status: 'success' }) },
    });
    expect(db.testAccess.create).toHaveBeenCalledWith({
      data: { studentId: 'ogrenci-1', source: 'PAID', paymentId: 'odeme-1' },
    });
  });

  // PayTR aynı bildirimi yeniden gönderebilir; ikinci kez test erişimi
  // açılmamalı.
  it('zaten PAID olan ödeme için ikinci kez erişim açmaz', async () => {
    db.payment.findUnique.mockResolvedValue(odeme({ status: 'PAID' }));
    const yanit = await POST(formRequest(URL_, bildirim()));

    expect(yanit.status).toBe(200);
    await expect(yanit.text()).resolves.toBe('OK');
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.testAccess.create).not.toHaveBeenCalled();
    expect(db.payment.update).not.toHaveBeenCalled();
    expect(db.payment.updateMany).not.toHaveBeenCalled();
  });

  // Eszamanli bir bildirim satiri once PAID yaptiysa kosullu update 0 satir
  // etkiler ve ikinci bir test erisimi acilmaz.
  it('kilidi kaptıramayan bildirim ikinci erişim açmaz', async () => {
    db.payment.findUnique.mockResolvedValue(odeme());
    db.payment.updateMany.mockResolvedValue({ count: 0 });

    const yanit = await POST(formRequest(URL_, bildirim()));

    expect(yanit.status).toBe(200);
    expect(db.payment.updateMany).toHaveBeenCalledTimes(1);
    expect(db.testAccess.create).not.toHaveBeenCalled();
  });

  it('başarısız bildirimde ödemeyi FAILED yapar, erişim açmaz', async () => {
    db.payment.findUnique.mockResolvedValue(odeme());
    const yanit = await POST(formRequest(URL_, bildirim({ status: 'failed' })));

    expect(yanit.status).toBe(200);
    expect(db.payment.update).toHaveBeenCalledWith({
      where: { id: 'odeme-1' },
      data: { status: 'FAILED', providerPayload: expect.objectContaining({ status: 'failed' }) },
    });
    expect(db.testAccess.create).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  // Ödenmiş bir kaydı geç gelen başarısız bildirim bozmamalı.
  it.each([
    ['PAID', 'PAID'],
    ['FAILED', 'FAILED'],
  ])('%s durumundaki ödemeyi başarısız bildirim değiştirmez', async (_ad, durum) => {
    db.payment.findUnique.mockResolvedValue(odeme({ status: durum }));
    const yanit = await POST(formRequest(URL_, bildirim({ status: 'failed' })));

    expect(yanit.status).toBe(200);
    expect(db.payment.update).not.toHaveBeenCalled();
    expect(db.testAccess.create).not.toHaveBeenCalled();
  });
});
