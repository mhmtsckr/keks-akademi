import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => import('@/test/helpers/db'));
vi.mock('@/lib/mailer', () => import('@/test/helpers/mailer'));

import { db, jsonRequest, resetMocks, sendAssessmentReport } from '@/test/helpers';
import { createExternalAssessmentToken } from '@/lib/externalAssessment';
import { OPTIONS, POST } from './route';

const URL_ = 'http://localhost/api/external/keks-assessment/submit';
const IZINLI = 'https://kazandiran-egitim-kocluk.mhmtsckr029.chatgpt.site';
const OLUSTURULMA = new Date('2026-09-01T00:00:00Z');

const erisim = (ustler: Record<string, unknown> = {}) => ({
  id: 'erisim-1',
  studentId: 'ogrenci-1',
  status: 'READY',
  createdAt: OLUSTURULMA,
  ...ustler,
});

const ogrenci = (ustler: Record<string, unknown> = {}) => ({
  id: 'ogrenci-1',
  studentCode: 'KEKS-ABCD1234',
  fullName: 'Ayşe Yılmaz',
  gradeLevel: '11',
  coachId: null,
  ...ustler,
});

async function govde(ustler: Record<string, unknown> = {}) {
  return {
    token: await createExternalAssessmentToken('ogrenci-1', 'erisim-1'),
    scores: { planlama: 4.2, odak: 3.1 },
    ...ustler,
  };
}

function istek(icerik: unknown, origin: string | null = IZINLI) {
  return jsonRequest(URL_, icerik, { headers: origin ? { origin } : {} });
}

/** Başarılı gönderim için gereken tüm ikiz davranışları. */
function mutluYol() {
  db.testAccess.findUnique.mockResolvedValue(erisim());
  db.student.findUnique.mockResolvedValue(ogrenci());
  db.testAccess.updateMany.mockResolvedValue({ count: 1 });
  db.assessment.create.mockResolvedValue({ id: 'tarama-1' });
  db.coachAlert.create.mockResolvedValue({ id: 'uyari-1' });
  db.assessment.update.mockResolvedValue({ id: 'tarama-1' });
}

beforeEach(() => {
  resetMocks();
  db.testAccess.findUnique.mockResolvedValue(null);
  db.student.findUnique.mockResolvedValue(null);
  db.assessment.findFirst.mockResolvedValue(null);
  db.preInterviewForm.findFirst.mockResolvedValue(null);
  db.preInterviewAssignment.findFirst.mockResolvedValue(null);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('CORS', () => {
  it('OPTIONS izinli kaynağa 204 ve CORS başlıkları döner', async () => {
    const yanit = await OPTIONS(
      new Request(URL_, { method: 'OPTIONS', headers: { origin: IZINLI } }),
    );
    expect(yanit.status).toBe(204);
    expect(yanit.headers.get('Access-Control-Allow-Origin')).toBe(IZINLI);
    expect(yanit.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('OPTIONS yabancı kaynağa 403 döner', async () => {
    const yanit = await OPTIONS(
      new Request(URL_, { method: 'OPTIONS', headers: { origin: 'https://saldirgan.example' } }),
    );
    expect(yanit.status).toBe(403);
  });

  it('POST yabancı kaynaktan reddedilir ve token hiç doğrulanmaz', async () => {
    const yanit = await POST(istek(await govde(), 'https://saldirgan.example'));
    expect(yanit.status).toBe(403);
    expect(db.testAccess.findUnique).not.toHaveBeenCalled();
  });

  // Tarayıcı, CORS başlığı olmayan bir hata yanıtının gövdesini okuyamaz.
  it('hata yanıtları da CORS başlığı taşır', async () => {
    const yanit = await POST(istek({ token: 'g'.repeat(30), scores: { a: 1 } }));
    expect(yanit.status).toBe(401);
    expect(yanit.headers.get('Access-Control-Allow-Origin')).toBe(IZINLI);
  });
});

describe('gövde ve token doğrulama', () => {
  it.each([
    ['scores yok', { token: 'x'.repeat(30) }],
    ['scores boş', { token: 'x'.repeat(30), scores: {} }],
    ['puan aralık dışı', { token: 'x'.repeat(30), scores: { a: 9 } }],
    ['token çok kısa', { token: 'kisa', scores: { a: 1 } }],
  ])('geçersiz gövdede 400 döner (%s)', async (_ad, icerik) => {
    const yanit = await POST(istek(icerik));
    expect(yanit.status).toBe(400);
  });

  it('geçersiz tokende 401 döner', async () => {
    const yanit = await POST(istek({ token: 'x'.repeat(30), scores: { planlama: 3 } }));
    expect(yanit.status).toBe(401);
    expect(db.testAccess.findUnique).not.toHaveBeenCalled();
  });
});

describe('erişim kontrolü', () => {
  it('erişim kaydı yoksa 403 döner', async () => {
    const yanit = await POST(istek(await govde()));
    expect(yanit.status).toBe(403);
  });

  // Tokendaki accessId başka bir öğrenciye aitse gönderim engellenmeli.
  it('erişim başka bir öğrenciye aitse 403 döner', async () => {
    db.testAccess.findUnique.mockResolvedValue(erisim({ studentId: 'baska-ogrenci' }));
    const yanit = await POST(istek(await govde()));
    expect(yanit.status).toBe(403);
    expect(db.assessment.create).not.toHaveBeenCalled();
  });

  it('erişim READY değilse 403 döner', async () => {
    db.testAccess.findUnique.mockResolvedValue(erisim({ status: 'PENDING' }));
    const yanit = await POST(istek(await govde()));
    expect(yanit.status).toBe(403);
  });

  it('öğrenci bulunamazsa 404 döner', async () => {
    db.testAccess.findUnique.mockResolvedValue(erisim());
    db.student.findUnique.mockResolvedValue(null);
    const yanit = await POST(istek(await govde()));
    expect(yanit.status).toBe(404);
  });
});

describe('tekrar gönderim (idempotans)', () => {
  it('erişim kullanılmış ve tarama varsa yeni kayıt açmadan aynı sonucu döner', async () => {
    db.testAccess.findUnique.mockResolvedValue(erisim({ status: 'USED' }));
    db.assessment.findFirst.mockResolvedValue({ id: 'tarama-1' });

    const yanit = await POST(istek(await govde()));
    expect(yanit.status).toBe(200);
    await expect(yanit.json()).resolves.toEqual({
      ok: true,
      alreadySubmitted: true,
      assessmentId: 'tarama-1',
    });
    expect(db.assessment.create).not.toHaveBeenCalled();
  });

  it('erişim kullanılmış ama tarama yoksa 409 döner', async () => {
    db.testAccess.findUnique.mockResolvedValue(erisim({ status: 'USED' }));
    const yanit = await POST(istek(await govde()));
    expect(yanit.status).toBe(409);
  });

  // İki eşzamanlı gönderimde koşullu updateMany yalnızca birinde 1 döner.
  it('yarış durumunda ikinci gönderim yeni tarama oluşturmaz', async () => {
    mutluYol();
    db.testAccess.updateMany.mockResolvedValue({ count: 0 });
    db.assessment.findFirst.mockResolvedValue({ id: 'tarama-1' });

    const yanit = await POST(istek(await govde()));
    expect(yanit.status).toBe(200);
    await expect(yanit.json()).resolves.toMatchObject({ alreadySubmitted: true });
  });

  it('yarış durumunda tarama da bulunamazsa 500 döner', async () => {
    mutluYol();
    db.testAccess.updateMany.mockResolvedValue({ count: 0 });
    db.assessment.findFirst.mockResolvedValue(null);

    const yanit = await POST(istek(await govde()));
    expect(yanit.status).toBe(500);
  });
});

describe('başarılı gönderim', () => {
  it('taramayı kaydeder, erişimi kullanılmış işaretler ve koça uyarı bırakır', async () => {
    mutluYol();
    const yanit = await POST(istek(await govde()));

    expect(yanit.status).toBe(200);
    await expect(yanit.json()).resolves.toMatchObject({
      ok: true,
      assessmentId: 'tarama-1',
      preInterviewOpened: false,
    });

    // Erişim yalnızca hâlâ READY ise tüketilir (iyimser kilit)
    expect(db.testAccess.updateMany).toHaveBeenCalledWith({
      where: { id: 'erisim-1', studentId: 'ogrenci-1', status: 'READY' },
      data: { status: 'USED', usedAt: expect.any(Date) },
    });
    expect(db.assessment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: 'ogrenci-1',
        formVersion: 'CHATGPT_SITE_V1',
        scores: { planlama: 4.2, odak: 3.1 },
      }),
    });
    expect(db.coachAlert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ studentId: 'ogrenci-1', kind: 'ASSESSMENT:tarama-1' }),
    });
  });

  it('rapora kaynak bilgisini ve KEKS uyarı metnini ekler', async () => {
    mutluYol();
    await POST(istek(await govde({ externalSubmissionId: 'dis-42' })));

    const rapor = db.assessment.create.mock.calls[0][0].data.report;
    expect(rapor.source).toBe('CHATGPT_SITE');
    expect(rapor.externalSubmissionId).toBe('dis-42');
    expect(rapor.disclaimer).toContain('psikolojik tanı koymaz');
    expect(rapor.leadingDimensions[0]).toEqual({ name: 'planlama', score: 4.2 });
  });

  it('raporu e-postayla gönderir ve gönderim zamanını işler', async () => {
    mutluYol();
    await POST(istek(await govde()));

    expect(sendAssessmentReport).toHaveBeenCalledWith(
      expect.objectContaining({ studentCode: 'KEKS-ABCD1234', assessmentId: 'tarama-1' }),
    );
    expect(db.assessment.update).toHaveBeenCalledWith({
      where: { id: 'tarama-1' },
      data: { emailedAt: expect.any(Date) },
    });
  });

  // E-posta sağlayıcısının arızası, kaydedilmiş taramayı kaybettirmemeli.
  it('e-posta gönderimi başarısız olsa bile tarama kaydı korunur', async () => {
    mutluYol();
    sendAssessmentReport.mockRejectedValue(new Error('resend down'));

    const yanit = await POST(istek(await govde()));
    expect(yanit.status).toBe(200);
    await expect(yanit.json()).resolves.toMatchObject({ ok: true, assessmentId: 'tarama-1' });
    expect(db.assessment.create).toHaveBeenCalledTimes(1);
  });
});

describe('ön görüşme formu', () => {
  it('koçu ve aktif formu olan öğrenciye ön görüşme açar', async () => {
    mutluYol();
    db.student.findUnique.mockResolvedValue(ogrenci({ coachId: 'koc-1' }));
    db.preInterviewForm.findFirst.mockResolvedValue({ id: 'form-1' });
    db.preInterviewAssignment.create.mockResolvedValue({ id: 'atama-1' });

    const yanit = await POST(istek(await govde()));
    await expect(yanit.json()).resolves.toMatchObject({ preInterviewOpened: true });
    expect(db.preInterviewAssignment.create).toHaveBeenCalledWith({
      data: { studentId: 'ogrenci-1', coachId: 'koc-1', formId: 'form-1', status: 'ASSIGNED' },
    });
  });

  it('açık bir ön görüşme varsa ikincisini açmaz', async () => {
    mutluYol();
    db.student.findUnique.mockResolvedValue(ogrenci({ coachId: 'koc-1' }));
    db.preInterviewForm.findFirst.mockResolvedValue({ id: 'form-1' });
    db.preInterviewAssignment.findFirst.mockResolvedValue({ id: 'mevcut-atama' });

    const yanit = await POST(istek(await govde()));
    await expect(yanit.json()).resolves.toMatchObject({ preInterviewOpened: false });
    expect(db.preInterviewAssignment.create).not.toHaveBeenCalled();
  });

  it('koçu olmayan öğrenci için form aramaz', async () => {
    mutluYol();
    await POST(istek(await govde()));
    expect(db.preInterviewForm.findFirst).not.toHaveBeenCalled();
    expect(db.preInterviewAssignment.create).not.toHaveBeenCalled();
  });
});
