import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => import('@/test/helpers/db'));
vi.mock('@/lib/audit', () => import('@/test/helpers/audit'));
vi.mock('next/headers', () => import('@/test/helpers/cookies'));

import { db, jsonRequest, resetMocks, setCookie, writeAudit } from '@/test/helpers';
import { POST } from './route';

const URL_ = 'http://localhost/api/admin/codes';

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

const yonetici = { id: 'yonetici-1', role: 'ADMIN', coachProfile: null };

beforeEach(async () => {
  resetMocks();
  db.academyCode.create.mockResolvedValue({
    id: 'kod-1',
    codeHint: 'AB12',
    assignedStudentId: null,
    maxUses: 1,
    expiresAt: null,
  });
  db.student.findUnique.mockResolvedValue(null);
  await oturumAc(yonetici);
});

describe('POST /api/admin/codes — yetki', () => {
  it('oturum yoksa 401 döner ve kod üretmez', async () => {
    db.user.findUnique.mockResolvedValue(null);
    const yanit = await POST(jsonRequest(URL_, { maxUses: 1 }));
    expect(yanit.status).toBe(401);
    expect(db.academyCode.create).not.toHaveBeenCalled();
  });

  it.each([['COACH'], ['STUDENT'], ['PARENT']])('%s rolü erişim kodu üretemez', async (rol) => {
    await oturumAc({ id: 'kullanici-1', role: rol, coachProfile: null });
    const yanit = await POST(jsonRequest(URL_, { maxUses: 1 }));
    expect(yanit.status).toBe(403);
    expect(db.academyCode.create).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/codes — kod üretimi', () => {
  // Arayüzün gönderdiği tek gövde biçimi.
  it('{maxUses:1} ile tek kullanımlık kod üretir', async () => {
    const yanit = await POST(jsonRequest(URL_, { maxUses: 1 }));

    expect(yanit.status).toBe(200);
    const govde = (await yanit.json()) as { id: string; code: string; codeHint: string };
    expect(govde.id).toBe('kod-1');
    expect(govde.code).toMatch(/^KEKS-[0-9A-F]{8}$/);

    const veri = db.academyCode.create.mock.calls[0][0].data;
    expect(veri.maxUses).toBe(1);
    expect(veri.assignedStudentId).toBeNull();
    expect(veri.expiresAt).toBeNull();
    expect(veri.createdByUserId).toBe('yonetici-1');
  });

  // Ham kod yalnızca yanıtta döner; veritabanına hash ve son dört hane gider.
  it('ham kodu saklamaz, yalnızca hash ve ipucu yazar', async () => {
    const yanit = await POST(jsonRequest(URL_, { maxUses: 1 }));
    const govde = (await yanit.json()) as { code: string };
    const veri = db.academyCode.create.mock.calls[0][0].data;

    expect(veri.codeHash).not.toContain(govde.code);
    expect(veri.codeHash.startsWith('scrypt$')).toBe(true);
    expect(veri.codeHint).toBe(govde.code.slice(-4));
  });

  it('maxUses verilmezse 1 kabul eder', async () => {
    await POST(jsonRequest(URL_, {}));
    expect(db.academyCode.create.mock.calls[0][0].data.maxUses).toBe(1);
  });

  it('kod üretimini denetim kaydına yazar', async () => {
    await POST(jsonRequest(URL_, { maxUses: 1 }));
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: 'yonetici-1', action: 'ACADEMY_CODE_CREATE' }),
    );
  });

  it('geçerli son kullanma tarihini Date olarak yazar', async () => {
    await POST(jsonRequest(URL_, { maxUses: 1, expiresAt: '2026-12-31T00:00:00.000Z' }));
    const { expiresAt } = db.academyCode.create.mock.calls[0][0].data;
    expect(expiresAt).toBeInstanceOf(Date);
    expect((expiresAt as Date).toISOString()).toBe('2026-12-31T00:00:00.000Z');
  });
});

describe('POST /api/admin/codes — girdi doğrulama', () => {
  // Bu alanlar önceden doğrulanmadan Prisma'ya geçiyordu.
  it.each([
    ['maxUses sıfır', { maxUses: 0 }],
    ['maxUses negatif', { maxUses: -5 }],
    ['maxUses ondalıklı', { maxUses: 1.5 }],
    ['maxUses metin', { maxUses: '1' }],
    ['maxUses aşırı büyük', { maxUses: 10_000 }],
    ['expiresAt anlamsız metin', { maxUses: 1, expiresAt: 'yarın' }],
    ['assignedStudentId boş metin', { maxUses: 1, assignedStudentId: '' }],
    ['assignedStudentId sayı', { maxUses: 1, assignedStudentId: 7 }],
  ])('geçersiz gövdede 400 döner (%s)', async (_ad, govde) => {
    const yanit = await POST(jsonRequest(URL_, govde));
    expect(yanit.status).toBe(400);
    expect(db.academyCode.create).not.toHaveBeenCalled();
  });

  it('bozuk JSON gövdesinde 400 döner', async () => {
    const yanit = await POST(jsonRequest(URL_, '{bozuk'));
    expect(yanit.status).toBe(400);
    expect(db.academyCode.create).not.toHaveBeenCalled();
  });

  // Var olmayan bir öğrenciye atama, Prisma yabancı anahtar hatasıyla 500
  // yerine temiz bir 404 vermeli.
  it('atanacak öğrenci yoksa 404 döner', async () => {
    const yanit = await POST(jsonRequest(URL_, { maxUses: 1, assignedStudentId: 'yok-boyle' }));
    expect(yanit.status).toBe(404);
    expect(db.academyCode.create).not.toHaveBeenCalled();
  });

  it('atanacak öğrenci varsa koda bağlar', async () => {
    db.student.findUnique.mockResolvedValue({ id: 'ogrenci-1' });
    const yanit = await POST(jsonRequest(URL_, { maxUses: 1, assignedStudentId: 'ogrenci-1' }));

    expect(yanit.status).toBe(200);
    expect(db.academyCode.create.mock.calls[0][0].data.assignedStudentId).toBe('ogrenci-1');
  });
});
