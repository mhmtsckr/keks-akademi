import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => import('@/test/helpers/db'));
vi.mock('next/headers', () => import('@/test/helpers/cookies'));

import { cookieJar, db, jsonRequest, resetMocks } from '@/test/helpers';
import { hashSecret } from '@/lib/security';
import { POST } from './route';

const URL_ = 'http://localhost/api/auth/student-login';
const ANAHTAR = 'dogru-giris-anahtari';
const HASH = await hashSecret(ANAHTAR);

const ogrenci = (ustler: Record<string, unknown> = {}) => ({
  id: 'ogrenci-1',
  studentCode: 'KEKS-ABCD1234',
  fullName: 'Ayşe Yılmaz',
  accessKeyHash: HASH,
  user: { id: 'kullanici-1', status: 'ACTIVE', role: 'STUDENT' },
  ...ustler,
});

const giris = (ustler: Record<string, unknown> = {}) =>
  jsonRequest(URL_, { studentCode: 'KEKS-ABCD1234', accessKey: ANAHTAR, ...ustler });

beforeEach(() => {
  resetMocks();
  db.student.findUnique.mockResolvedValue(null);
});

describe('POST /api/auth/student-login — kimlik doğrulama', () => {
  it('doğru bilgilerle oturum açar', async () => {
    db.student.findUnique.mockResolvedValue(ogrenci());
    const yanit = await POST(giris());

    expect(yanit.status).toBe(200);
    await expect(yanit.json()).resolves.toEqual({ ok: true, role: 'STUDENT' });
    expect(cookieJar.set).toHaveBeenCalledWith(
      'keks_session',
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('öğrenci kodunu boşluklardan arındırarak arar', async () => {
    db.student.findUnique.mockResolvedValue(ogrenci());
    await POST(giris({ studentCode: '  KEKS-ABCD1234  ' }));
    expect(db.student.findUnique).toHaveBeenCalledWith({
      where: { studentCode: 'KEKS-ABCD1234' },
      include: { user: true },
    });
  });

  it('yanlış giriş anahtarında 401 döner ve oturum açmaz', async () => {
    db.student.findUnique.mockResolvedValue(ogrenci());
    const yanit = await POST(giris({ accessKey: 'yanlis-anahtar' }));

    expect(yanit.status).toBe(401);
    expect(cookieJar.set).not.toHaveBeenCalled();
  });

  // Var olmayan kod ile yanlış anahtar aynı yanıtı vermeli; aksi hâlde geçerli
  // öğrenci kodları dışarıdan sayılabilir hâle gelir.
  it('var olmayan kod ile yanlış anahtar ayırt edilemez', async () => {
    db.student.findUnique.mockResolvedValue(null);
    const yok = await POST(giris());
    db.student.findUnique.mockResolvedValue(ogrenci());
    const yanlis = await POST(giris({ accessKey: 'yanlis-anahtar' }));

    expect(yok.status).toBe(yanlis.status);
    await expect(yok.json()).resolves.toEqual(await yanlis.json());
  });

  it('hesap aktif değilse 403 döner ve oturum açmaz', async () => {
    db.student.findUnique.mockResolvedValue(
      ogrenci({ user: { id: 'kullanici-1', status: 'PENDING', role: 'STUDENT' } }),
    );
    const yanit = await POST(giris());

    expect(yanit.status).toBe(403);
    await expect(yanit.json()).resolves.toEqual({ error: 'Hesap aktif değil.' });
    expect(cookieJar.set).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/student-login — ilk giriş', () => {
  it('kullanıcı kaydı yoksa öğrenciye bağlı bir kullanıcı oluşturur', async () => {
    db.student.findUnique.mockResolvedValue(ogrenci({ user: null }));
    db.user.create.mockResolvedValue({ id: 'yeni-kullanici', status: 'ACTIVE', role: 'STUDENT' });

    const yanit = await POST(giris());

    expect(yanit.status).toBe(200);
    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Ayşe Yılmaz',
        role: 'STUDENT',
        status: 'ACTIVE',
        student: { connect: { id: 'ogrenci-1' } },
      },
    });
    expect(cookieJar.set).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/auth/student-login — gövde doğrulama', () => {
  // --- Regresyon: hata 3 ---------------------------------------------------
  // Önceden schema.parse doğrudan fırlatıyor ve bu istekler 500 döndürüyordu.
  it('bozuk JSON gövdesinde 500 değil 400 döner', async () => {
    const yanit = await POST(jsonRequest(URL_, '{bozuk'));
    expect(yanit.status).toBe(400);
    expect(db.student.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    ['accessKey yok', { studentCode: 'KEKS-ABCD1234' }],
    ['studentCode yok', { accessKey: ANAHTAR }],
    ['studentCode çok kısa', { studentCode: 'K', accessKey: ANAHTAR }],
    ['accessKey çok kısa', { studentCode: 'KEKS-ABCD1234', accessKey: 'ab' }],
    ['alan tipleri yanlış', { studentCode: 123, accessKey: true }],
  ])('şemaya uymayan gövdede 400 döner (%s)', async (_ad, govde) => {
    const yanit = await POST(jsonRequest(URL_, govde));
    expect(yanit.status).toBe(400);
    expect(db.student.findUnique).not.toHaveBeenCalled();
  });
});
