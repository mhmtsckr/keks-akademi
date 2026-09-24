import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';

vi.mock('@/lib/mailer', () => import('@/test/helpers/mailer'));

import { coachAlertDuzelt, coachAlertPatlat, db, resetDb } from './db';
import { createExternalAssessmentToken } from '@/lib/externalAssessment';
import { POST as taramaGonder } from '@/app/api/external/keks-assessment/submit/route';
import { POST as paytrCallback } from '@/app/api/paytr/callback/route';

/**
 * Bu paket yalnizca gercek bir veritabaninin kanitlayabilecegi seyleri test eder:
 * transaction geri alma ve gercek eszamanlilik. Prisma ikizi bunlari taklit
 * edemez, bu yuzden birim testlerde bilerek iddia edilmiyorlar.
 */

const IZINLI = 'https://kazandiran-egitim-kocluk.mhmtsckr029.chatgpt.site';
const TARAMA_URL = 'http://localhost/api/external/keks-assessment/submit';
const CALLBACK_URL = 'http://localhost/api/paytr/callback';

function taramaIstegi(govde: unknown) {
  return new Request(TARAMA_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: IZINLI },
    body: JSON.stringify(govde),
  });
}

function callbackIstegi(alanlar: Record<string, string>) {
  const base = `${alanlar.merchant_oid}${process.env.PAYTR_MERCHANT_SALT}${alanlar.status}${alanlar.total_amount}`;
  const hash = crypto
    .createHmac('sha256', process.env.PAYTR_MERCHANT_KEY!)
    .update(base)
    .digest('base64');
  return new Request(CALLBACK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...alanlar, hash }).toString(),
  });
}

async function ogrenciOlustur() {
  const user = await db.user.create({
    data: { name: 'Ayşe Yılmaz', role: 'STUDENT', status: 'ACTIVE' },
  });
  return db.student.create({
    data: {
      userId: user.id,
      studentCode: 'KEKS-TEST0001',
      fullName: 'Ayşe Yılmaz',
      gradeLevel: '11',
    },
  });
}

beforeEach(async () => {
  await resetDb();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
  await coachAlertDuzelt();
  vi.restoreAllMocks();
});

describe('tarama gönderimi — transaction bütünlüğü', () => {
  it('başarılı gönderimde üç kayıt da kalıcı olur', async () => {
    const ogrenci = await ogrenciOlustur();
    const erisim = await db.testAccess.create({
      data: { studentId: ogrenci.id, source: 'ACADEMY_CODE', status: 'READY' },
    });
    const token = await createExternalAssessmentToken(ogrenci.id, erisim.id);

    const yanit = await taramaGonder(taramaIstegi({ token, scores: { planlama: 4 } }));

    expect(yanit.status).toBe(200);
    expect(await db.assessment.count()).toBe(1);
    expect(await db.coachAlert.count()).toBe(1);
    const guncel = await db.testAccess.findUnique({ where: { id: erisim.id } });
    expect(guncel!.status).toBe('USED');
    expect(guncel!.usedAt).not.toBeNull();
  });

  // Asil sorulan soru: transaction'in son adimi patlarsa ogrencinin ucretli
  // test erisimi yanar mi? Koc uyarisi yazilamadi diye erisim tuketilmemeli.
  it('koç uyarısı yazılamazsa hiçbir şey kalıcı olmaz ve erişim yanmaz', async () => {
    const ogrenci = await ogrenciOlustur();
    const erisim = await db.testAccess.create({
      data: { studentId: ogrenci.id, source: 'ACADEMY_CODE', status: 'READY' },
    });
    const token = await createExternalAssessmentToken(ogrenci.id, erisim.id);

    await coachAlertPatlat();
    const yanit = await taramaGonder(taramaIstegi({ token, scores: { planlama: 4 } }));

    expect(yanit.status).toBe(500);
    expect(await db.assessment.count()).toBe(0);
    expect(await db.coachAlert.count()).toBe(0);

    const guncel = await db.testAccess.findUnique({ where: { id: erisim.id } });
    expect(guncel!.status).toBe('READY');
    expect(guncel!.usedAt).toBeNull();
  });

  it('geri alma sonrası aynı erişimle yeniden gönderim yapılabilir', async () => {
    const ogrenci = await ogrenciOlustur();
    const erisim = await db.testAccess.create({
      data: { studentId: ogrenci.id, source: 'ACADEMY_CODE', status: 'READY' },
    });
    const token = await createExternalAssessmentToken(ogrenci.id, erisim.id);

    await coachAlertPatlat();
    expect((await taramaGonder(taramaIstegi({ token, scores: { planlama: 4 } }))).status).toBe(500);
    await coachAlertDuzelt();

    const yanit = await taramaGonder(taramaIstegi({ token, scores: { planlama: 4 } }));
    expect(yanit.status).toBe(200);
    expect(await db.assessment.count()).toBe(1);
  });
});

describe('tarama gönderimi — gerçek eşzamanlılık', () => {
  // updateMany({where:{status:'READY'}}) + count!==1 iyimser kilidi ancak
  // gercek bir veritabaninda dogrulanabilir.
  it('aynı anda iki gönderim tek tarama oluşturur', async () => {
    const ogrenci = await ogrenciOlustur();
    const erisim = await db.testAccess.create({
      data: { studentId: ogrenci.id, source: 'ACADEMY_CODE', status: 'READY' },
    });
    const token = await createExternalAssessmentToken(ogrenci.id, erisim.id);
    const govde = { token, scores: { planlama: 4 } };

    const yanitlar = await Promise.all([
      taramaGonder(taramaIstegi(govde)),
      taramaGonder(taramaIstegi(govde)),
    ]);

    expect(await db.assessment.count()).toBe(1);
    const guncel = await db.testAccess.findUnique({ where: { id: erisim.id } });
    expect(guncel!.status).toBe('USED');
    expect(yanitlar.map((y:Response) => y.status)).toContain(200);
  });
});

describe('PayTR callback — çift bildirim', () => {
  async function odemeOlustur(studentId: string) {
    return db.payment.create({
      data: {
        studentId,
        merchantOid: 'KEKS-TEST-OID-1',
        amountKurus: 35_000,
        status: 'PENDING',
      },
    });
  }

  const basarili = { merchant_oid: 'KEKS-TEST-OID-1', status: 'success', total_amount: '35000' };

  it('art arda gelen iki bildirim tek test erişimi açar', async () => {
    const ogrenci = await ogrenciOlustur();
    await odemeOlustur(ogrenci.id);

    expect((await paytrCallback(callbackIstegi(basarili))).status).toBe(200);
    expect((await paytrCallback(callbackIstegi(basarili))).status).toBe(200);

    expect(await db.testAccess.count()).toBe(1);
    const odeme = await db.payment.findUnique({ where: { merchantOid: 'KEKS-TEST-OID-1' } });
    expect(odeme!.status).toBe('PAID');
  });

  // PayTR bildirimi yeniden gonderdiginde iki istek cakisabilir. Kilit
  // olmadan bu senaryo tek odeme icin iki test erisimi aciyordu.
  it('aynı anda gelen iki bildirim yine tek test erişimi açar', async () => {
    const ogrenci = await ogrenciOlustur();
    await odemeOlustur(ogrenci.id);

    const yanitlar = await Promise.all([
      paytrCallback(callbackIstegi(basarili)),
      paytrCallback(callbackIstegi(basarili)),
    ]);

    expect(yanitlar.map((y:Response) => y.status)).toEqual([200, 200]);
    expect(await db.testAccess.count()).toBe(1);
    const odeme = await db.payment.findUnique({ where: { merchantOid: 'KEKS-TEST-OID-1' } });
    expect(odeme!.status).toBe('PAID');
  });
});
