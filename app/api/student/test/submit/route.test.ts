import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => import('@/test/helpers/db'));
vi.mock('@/lib/mailer', () => import('@/test/helpers/mailer'));
vi.mock('next/headers', () => import('@/test/helpers/cookies'));

import { db, jsonRequest, resetMocks, sendAssessmentReport, setCookie } from '@/test/helpers';
import { POST } from './route';

const U = 'http://localhost/api/student/test/submit';

async function oturumAc(kullanici: Record<string, unknown>) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(kullanici.id))
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET!));
  setCookie('keks_session', token);
  db.user.findUnique.mockResolvedValue(kullanici);
}

const ogrenci = {
  id: 'kullanici-1',
  role: 'STUDENT',
  student: { id: 'ogrenci-1', studentCode: 'KEKS-AAAA1111', fullName: 'Ayşe Yılmaz' },
};

const SORULAR = [
  { id: 's1', dimension: 'planlama', reverse: false, orderNo: 1 },
  { id: 's2', dimension: 'planlama', reverse: true, orderNo: 2 },
];

const govde = (ustler: Record<string, unknown> = {}) => ({
  formVersion: 'KEKS_V1',
  ageBand: 'LISE_11_12',
  answers: [
    { questionId: 's1', value: 5 },
    { questionId: 's2', value: 2 },
  ],
  ...ustler,
});

/** Başarılı gönderim için gereken ikiz davranışları. */
function mutluYol() {
  db.testAccess.findFirst.mockResolvedValue({ id: 'erisim-1' });
  db.testQuestion.findMany.mockResolvedValue(SORULAR);
  db.assessment.create.mockResolvedValue({ id: 'tarama-1' });
  db.testAccess.update.mockResolvedValue({ id: 'erisim-1' });
  db.assessment.update.mockResolvedValue({ id: 'tarama-1' });
}

beforeEach(async () => {
  resetMocks();
  db.testAccess.findFirst.mockResolvedValue(null);
  db.testQuestion.findMany.mockResolvedValue([]);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await oturumAc(ogrenci);
});

describe('POST test/submit — girdi doğrulama', () => {
  // --- Regresyon ----------------------------------------------------------
  // answers gelmediğinde body.answers.length okunuyor ve 500 üretiliyordu.
  it.each([
    ['answers yok', { formVersion: 'KEKS_V1', ageBand: 'LISE_11_12' }],
    ['answers dizi değil', govde({ answers: 'hepsi' })],
    ['answers boş', govde({ answers: [] })],
    ['formVersion yok', { ageBand: 'LISE_11_12', answers: [{ questionId: 's1', value: 3 }] }],
    ['ageBand yok', { formVersion: 'KEKS_V1', answers: [{ questionId: 's1', value: 3 }] }],
    ['cevap değeri sıfır', govde({ answers: [{ questionId: 's1', value: 0 }] })],
    ['cevap değeri ölçek dışı', govde({ answers: [{ questionId: 's1', value: 9 }] })],
    ['cevap değeri ondalıklı', govde({ answers: [{ questionId: 's1', value: 2.5 }] })],
    ['questionId yok', govde({ answers: [{ value: 3 }] })],
  ])('%s ise 500 değil 400 döner', async (_ad, icerik) => {
    const yanit = await POST(jsonRequest(U, icerik));
    expect(yanit.status).toBe(400);
    expect(db.testAccess.findFirst).not.toHaveBeenCalled();
  });

  it('bozuk JSON gövdesinde 400 döner', async () => {
    const yanit = await POST(jsonRequest(U, '{bozuk'));
    expect(yanit.status).toBe(400);
  });
});

describe('POST test/submit — erişim ve form kontrolü', () => {
  it('aktif test erişimi yoksa 403 döner', async () => {
    const yanit = await POST(jsonRequest(U, govde()));
    expect(yanit.status).toBe(403);
    expect(db.assessment.create).not.toHaveBeenCalled();
  });

  it('forma ait soru yoksa 400 döner', async () => {
    db.testAccess.findFirst.mockResolvedValue({ id: 'erisim-1' });
    const yanit = await POST(jsonRequest(U, govde()));
    expect(yanit.status).toBe(400);
    expect((await yanit.json()).error).toContain('soru bulunamadı');
  });

  it('eksik cevapla gönderim reddedilir', async () => {
    mutluYol();
    const yanit = await POST(jsonRequest(U, govde({ answers: [{ questionId: 's1', value: 4 }] })));
    expect(yanit.status).toBe(400);
    expect((await yanit.json()).error).toContain('Tüm sorular cevaplanmalıdır');
    expect(db.assessment.create).not.toHaveBeenCalled();
  });
});

describe('POST test/submit — başarılı gönderim', () => {
  it('taramayı puanlayıp kaydeder ve erişimi tüketir', async () => {
    mutluYol();
    const yanit = await POST(jsonRequest(U, govde()));

    expect(yanit.status).toBe(200);
    const veri = db.assessment.create.mock.calls[0][0].data;
    expect(veri.studentId).toBe('ogrenci-1');
    expect(veri.formVersion).toBe('KEKS_V1');
    // s2 ters puanlı: (5 + (6-2)) / 2 = 4.5
    expect(veri.scores).toEqual({ planlama: 4.5 });
    expect(veri.report.disclaimer).toContain('psikolojik tanı koymaz');

    expect(db.testAccess.update).toHaveBeenCalledWith({
      where: { id: 'erisim-1' },
      data: { status: 'USED', usedAt: expect.any(Date) },
    });
  });

  it('raporu e-postayla gönderir ve gönderim zamanını işler', async () => {
    mutluYol();
    await POST(jsonRequest(U, govde()));

    expect(sendAssessmentReport).toHaveBeenCalledWith(
      expect.objectContaining({ studentCode: 'KEKS-AAAA1111', assessmentId: 'tarama-1' }),
    );
    expect(db.assessment.update).toHaveBeenCalledWith({
      where: { id: 'tarama-1' },
      data: { emailedAt: expect.any(Date) },
    });
  });

  it('e-posta gönderimi başarısız olsa bile tarama kaydı korunur', async () => {
    mutluYol();
    sendAssessmentReport.mockRejectedValue(new Error('resend down'));

    const yanit = await POST(jsonRequest(U, govde()));

    expect(yanit.status).toBe(200);
    expect(db.assessment.create).toHaveBeenCalledTimes(1);
  });
});
