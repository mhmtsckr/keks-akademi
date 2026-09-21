import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieJar, dbMock } = vi.hoisted(() => ({
  cookieJar: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
  dbMock: { user: { findUnique: vi.fn() } },
}));

vi.mock('next/headers', () => ({ cookies: async () => cookieJar }));
vi.mock('./db', () => ({ db: dbMock }));

const { createSession, currentUser, destroySession, requireRole } = await import('./auth');
const { AuthError } = await import('./apiGuard');

const COOKIE = 'keks_session';
const anahtar = (gizli = process.env.AUTH_SECRET!) => new TextEncoder().encode(gizli);

async function token(opts: { sub?: string | null; key?: Uint8Array; saniye?: number } = {}) {
  const jwt = new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setIssuedAt();
  if (opts.sub !== null) jwt.setSubject(opts.sub ?? 'kullanici-1');
  jwt.setExpirationTime(Math.floor(Date.now() / 1000) + (opts.saniye ?? 3600));
  return jwt.sign(opts.key ?? anahtar());
}

/** Tarayıcının gönderdiği oturum çerezini taklit eder. */
function cerez(deger?: string) {
  cookieJar.get.mockImplementation((ad: string) =>
    ad === COOKIE && deger !== undefined ? { value: deger } : undefined,
  );
}

const ogrenci = { id: 'kullanici-1', role: 'STUDENT' as const };
const yonetici = { id: 'kullanici-1', role: 'ADMIN' as const };

beforeEach(() => {
  vi.clearAllMocks();
  cerez(undefined);
  dbMock.user.findUnique.mockResolvedValue(null);
});

describe('currentUser', () => {
  it('çerez yoksa null döner', async () => {
    await expect(currentUser()).resolves.toBeNull();
    expect(dbMock.user.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    ['anlamsız metin', 'bu-bir-token-degil'],
    ['boş metin', ''],
  ])('geçersiz token için null döner (%s)', async (_ad, deger) => {
    cerez(deger);
    await expect(currentUser()).resolves.toBeNull();
    expect(dbMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('başka anahtarla imzalanmış tokeni reddeder', async () => {
    cerez(await token({ key: anahtar('saldirganin-anahtari-0123456789abcd') }));
    await expect(currentUser()).resolves.toBeNull();
    expect(dbMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('süresi dolmuş tokeni reddeder', async () => {
    cerez(await token({ saniye: -60 }));
    await expect(currentUser()).resolves.toBeNull();
  });

  it('sub alanı olmayan tokeni reddeder', async () => {
    cerez(await token({ sub: null }));
    await expect(currentUser()).resolves.toBeNull();
    expect(dbMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('geçerli tokende kullanıcıyı ilişkileriyle birlikte okur', async () => {
    cerez(await token({ sub: 'kullanici-1' }));
    dbMock.user.findUnique.mockResolvedValue(ogrenci);
    await expect(currentUser()).resolves.toEqual(ogrenci);
    expect(dbMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'kullanici-1' },
      include: { coachProfile: true, student: true, parentProfile: true },
    });
  });
});

describe('requireRole', () => {
  // --- Regresyon: hata 2 ---------------------------------------------------
  it('oturum yoksa 401 durumlu AuthError fırlatır', async () => {
    await expect(requireRole(['ADMIN'])).rejects.toBeInstanceOf(AuthError);
    await expect(requireRole(['ADMIN'])).rejects.toMatchObject({
      status: 401,
      message: 'Oturum açmanız gerekiyor.',
    });
  });

  it('rol uyuşmuyorsa 403 durumlu AuthError fırlatır', async () => {
    cerez(await token());
    dbMock.user.findUnique.mockResolvedValue(ogrenci);
    await expect(requireRole(['ADMIN'])).rejects.toMatchObject({
      status: 403,
      message: 'Bu işlem için yetkiniz yok.',
    });
  });

  it('401 ile 403 ayrımını korur (var olmayan oturum 403 değildir)', async () => {
    await expect(requireRole(['ADMIN'])).rejects.toMatchObject({ status: 401 });
    cerez(await token());
    dbMock.user.findUnique.mockResolvedValue(ogrenci);
    await expect(requireRole(['ADMIN'])).rejects.toMatchObject({ status: 403 });
  });

  it('rol uyuşuyorsa kullanıcıyı döner', async () => {
    cerez(await token());
    dbMock.user.findUnique.mockResolvedValue(yonetici);
    await expect(requireRole(['ADMIN'])).resolves.toEqual(yonetici);
  });

  it('izin verilen rollerden herhangi biri yeterlidir', async () => {
    cerez(await token());
    dbMock.user.findUnique.mockResolvedValue(ogrenci);
    await expect(requireRole(['COACH', 'ADMIN', 'STUDENT'])).resolves.toEqual(ogrenci);
  });
});

describe('createSession / destroySession', () => {
  it('oturum çerezini httpOnly ve 7 günlük olarak yazar', async () => {
    await createSession('kullanici-1');
    expect(cookieJar.set).toHaveBeenCalledTimes(1);
    const [ad, deger, secenekler] = cookieJar.set.mock.calls[0];
    expect(ad).toBe(COOKIE);
    expect(secenekler).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    // Yazılan token kendi doğrulamamızdan geçmeli
    cerez(deger);
    dbMock.user.findUnique.mockResolvedValue(yonetici);
    await expect(currentUser()).resolves.toEqual(yonetici);
    expect(dbMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'kullanici-1' } }),
    );
  });

  it('çıkışta oturum çerezini siler', async () => {
    await destroySession();
    expect(cookieJar.delete).toHaveBeenCalledWith(COOKIE);
  });
});
