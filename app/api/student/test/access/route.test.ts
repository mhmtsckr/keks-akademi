import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => import('@/test/helpers/db'));
vi.mock('next/headers', () => import('@/test/helpers/cookies'));

import { db, jsonRequest, resetMocks, setCookie } from '@/test/helpers';
import { hashSecret } from '@/lib/security';
import { POST } from './route';

const U = 'http://localhost/api/student/test/access';
const KOD = 'KEKS-TESTKOD';
const HASH = await hashSecret(KOD);

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
  student: { id: 'ogrenci-1', studentCode: 'KEKS-AAAA1111', fullName: 'Ayşe' },
};

const kod = (ustler: Record<string, unknown> = {}) => ({
  id: 'kod-1',
  codeHash: HASH,
  active: true,
  expiresAt: null,
  assignedStudentId: null,
  monthlyRecurring: false,
  useCount: 0,
  maxUses: 1,
  ...ustler,
});

beforeEach(async () => {
  resetMocks();
  db.academyCode.findMany.mockResolvedValue([]);
  db.testAccess.findFirst.mockResolvedValue(null);
  await oturumAc(ogrenci);
});

describe('POST test/access — yetki', () => {
  it('oturum yoksa 401 döner', async () => {
    db.user.findUnique.mockResolvedValue(null);
    const yanit = await POST(jsonRequest(U, { code: KOD }));
    expect(yanit.status).toBe(401);
    expect(db.academyCode.findMany).not.toHaveBeenCalled();
  });

  it('koç rolüyle 403 döner', async () => {
    await oturumAc({ id: 'kullanici-2', role: 'COACH', student: null });
    const yanit = await POST(jsonRequest(U, { code: KOD }));
    expect(yanit.status).toBe(403);
  });
});

describe('POST test/access — girdi doğrulama', () => {
  // --- Regresyon ----------------------------------------------------------
  // code alanı gelmediğinde verifySecret null ile çağrılıp 500 üretiyordu.
  it.each([
    ['code yok', {}],
    ['code null', { code: null }],
    ['code sayı', { code: 123 }],
    ['code çok uzun', { code: 'x'.repeat(200) }],
  ])('%s ise 500 değil 400 döner', async (_ad, govde) => {
    const yanit = await POST(jsonRequest(U, govde));
    expect(yanit.status).toBe(400);
    expect(db.academyCode.findMany).not.toHaveBeenCalled();
  });

  // Boş kod şemadan geçer; reddi route'un kendi mesajı vermeli.
  it('boş kodda mevcut hata mesajı korunur', async () => {
    db.academyCode.findMany.mockResolvedValue([kod()]);
    const yanit = await POST(jsonRequest(U, { code: '' }));
    expect(yanit.status).toBe(400);
    await expect(yanit.json()).resolves.toEqual({
      error: 'Kod geçersiz veya bu öğrenciye ait değil.',
    });
  });

  it('bozuk JSON gövdesinde 400 döner', async () => {
    const yanit = await POST(jsonRequest(U, '{bozuk'));
    expect(yanit.status).toBe(400);
  });
});

describe('POST test/access — kod kullanımı', () => {
  it('geçerli tek kullanımlık kod test erişimi açar', async () => {
    db.academyCode.findMany.mockResolvedValue([kod()]);
    const yanit = await POST(jsonRequest(U, { code: KOD }));

    expect(yanit.status).toBe(200);
    await expect(yanit.json()).resolves.toEqual({ ok: true });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.testAccess.create).toHaveBeenCalledWith({
      data: { studentId: 'ogrenci-1', source: 'ACADEMY_CODE', academyCodeId: 'kod-1' },
    });
    // Tek kullanımlık kod tüketilince pasifleşir
    expect(db.academyCode.update).toHaveBeenCalledWith({
      where: { id: 'kod-1' },
      data: { useCount: { increment: 1 }, usedAt: expect.any(Date), active: false },
    });
  });

  it.each([
    ['başka öğrenciye atanmış', { assignedStudentId: 'baska-ogrenci' }],
    ['süresi dolmuş', { expiresAt: new Date('2020-01-01T00:00:00Z') }],
    ['kullanım hakkı bitmiş', { useCount: 1, maxUses: 1 }],
  ])('%s kod erişim açmaz', async (_ad, ustler) => {
    db.academyCode.findMany.mockResolvedValue([kod(ustler)]);
    const yanit = await POST(jsonRequest(U, { code: KOD }));

    expect(yanit.status).toBe(400);
    expect(db.testAccess.create).not.toHaveBeenCalled();
  });

  it('yanlış kod erişim açmaz', async () => {
    db.academyCode.findMany.mockResolvedValue([kod()]);
    const yanit = await POST(jsonRequest(U, { code: 'KEKS-YANLIS' }));

    expect(yanit.status).toBe(400);
    expect(db.testAccess.create).not.toHaveBeenCalled();
  });
});

describe('POST test/access — aylık kod', () => {
  it('aylık kod ilk kullanımda erişim açar', async () => {
    db.academyCode.findMany.mockResolvedValue([kod({ monthlyRecurring: true })]);
    const yanit = await POST(jsonRequest(U, { code: KOD }));

    expect(yanit.status).toBe(200);
    await expect(yanit.json()).resolves.toMatchObject({ ok: true, monthly: true });
    expect(db.testAccess.create).toHaveBeenCalledWith({
      data: {
        studentId: 'ogrenci-1',
        source: 'ACADEMY_CODE',
        academyCodeId: 'kod-1',
        status: 'READY',
      },
    });
  });

  it('aynı ay ikinci kez kullanılamaz', async () => {
    db.academyCode.findMany.mockResolvedValue([kod({ monthlyRecurring: true })]);
    db.testAccess.findFirst.mockResolvedValue({ id: 'erisim-1' });

    const yanit = await POST(jsonRequest(U, { code: KOD }));

    expect(yanit.status).toBe(400);
    expect((await yanit.json()).error).toContain('bu ay için zaten kullanıldı');
    expect(db.testAccess.create).not.toHaveBeenCalled();
  });
});
