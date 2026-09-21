import { describe, expect, it } from 'vitest';
import { SignJWT, decodeJwt } from 'jose';
// Bilinçli olarak "@/" takma adıyla import ediliyor: tsconfig yol çözümlemesinin
// test çalıştırıcısında da çalıştığını doğrular.
import {
  createExternalAssessmentToken,
  verifyExternalAssessmentToken,
} from '@/lib/externalAssessment';

// Bu değerler harici ChatGPT Site entegrasyonuyla yapılan sözleşmedir
// (docs/CHATGPT_SITE_KEKS_INTEGRATION.md). Değişirlerse entegrasyon sessizce
// kırılır, bu yüzden burada sabitleniyorlar.
const ISSUER = 'keks-akademi';
const AUDIENCE = 'keks-external-assessment';
const KIND = 'KEKS_EXTERNAL_ASSESSMENT';

const anahtar = (gizli = process.env.AUTH_SECRET!) => new TextEncoder().encode(gizli);

/** Saldırgan bakış açısıyla, istenen alanları bozulmuş token üretir. */
function uret(
  opts: {
    claims?: Record<string, unknown>;
    issuer?: string;
    audience?: string;
    key?: Uint8Array;
    subject?: string | null;
    saniyeSonraDolar?: number;
  } = {},
) {
  const simdi = Math.floor(Date.now() / 1000);
  const jwt = new SignJWT({ accessId: 'erisim-1', kind: KIND, ...opts.claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(opts.issuer ?? ISSUER)
    .setAudience(opts.audience ?? AUDIENCE)
    .setIssuedAt(simdi)
    .setExpirationTime(simdi + (opts.saniyeSonraDolar ?? 3600));
  if (opts.subject !== null) jwt.setSubject(opts.subject ?? 'ogrenci-1');
  return jwt.sign(opts.key ?? anahtar());
}


describe('createExternalAssessmentToken', () => {
  it('kendi ürettiği token doğrulamadan geçer', async () => {
    const token = await createExternalAssessmentToken('ogrenci-1', 'erisim-1');
    await expect(verifyExternalAssessmentToken(token)).resolves.toEqual({
      studentId: 'ogrenci-1',
      accessId: 'erisim-1',
    });
  });

  it('sözleşmede tanımlı iss/aud/kind alanlarını yazar', async () => {
    const payload = decodeJwt(await createExternalAssessmentToken('ogrenci-1', 'erisim-1'));
    expect(payload.iss).toBe(ISSUER);
    expect(payload.aud).toBe(AUDIENCE);
    expect(payload.kind).toBe(KIND);
    expect(payload.sub).toBe('ogrenci-1');
    expect(payload.accessId).toBe('erisim-1');
  });

  it('token ömrü 2 saattir', async () => {
    const payload = decodeJwt(await createExternalAssessmentToken('ogrenci-1', 'erisim-1'));
    expect(payload.exp! - payload.iat!).toBe(2 * 60 * 60);
  });

  it('AUTH_SECRET yoksa token üretmeyi reddeder', async () => {
    const onceki = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    try {
      await expect(createExternalAssessmentToken('ogrenci-1', 'erisim-1')).rejects.toThrow(
        'AUTH_SECRET_MISSING',
      );
    } finally {
      process.env.AUTH_SECRET = onceki;
    }
  });
});

describe('verifyExternalAssessmentToken', () => {
  it('geçerli tokendan öğrenci ve erişim kimliğini çıkarır', async () => {
    await expect(verifyExternalAssessmentToken(await uret())).resolves.toEqual({
      studentId: 'ogrenci-1',
      accessId: 'erisim-1',
    });
  });

  it('başka bir gizli anahtarla imzalanmış tokeni reddeder', async () => {
    const sahte = await uret({ key: anahtar('saldirganin-gizli-anahtari-0123456789') });
    await expect(verifyExternalAssessmentToken(sahte)).rejects.toThrow();
  });

  it('yanlış issuer ile üretilmiş tokeni reddeder', async () => {
    await expect(verifyExternalAssessmentToken(await uret({ issuer: 'baska-sistem' }))).rejects.toThrow();
  });

  it('yanlış audience ile üretilmiş tokeni reddeder', async () => {
    await expect(
      verifyExternalAssessmentToken(await uret({ audience: 'keks-session' })),
    ).rejects.toThrow();
  });

  it('süresi dolmuş tokeni reddeder', async () => {
    await expect(
      verifyExternalAssessmentToken(await uret({ saniyeSonraDolar: -60 })),
    ).rejects.toThrow();
  });

  // Oturum çerezi (kind alanı olmayan) bir tokenin tarama gönderimi için
  // kullanılamaması gerekir.
  it.each([
    ['kind alanı yok', { claims: { accessId: 'erisim-1', kind: undefined } }],
    ['kind alanı farklı', { claims: { kind: 'KEKS_SESSION' } }],
    ['accessId yok', { claims: { kind: KIND, accessId: undefined } }],
    ['accessId metin değil', { claims: { kind: KIND, accessId: 123 } }],
    ['sub yok', { subject: null }],
  ])('%s ise INVALID_EXTERNAL_ASSESSMENT_TOKEN fırlatır', async (_ad, opts) => {
    await expect(verifyExternalAssessmentToken(await uret(opts))).rejects.toThrow(
      'INVALID_EXTERNAL_ASSESSMENT_TOKEN',
    );
  });

  it.each([
    ['boş metin', ''],
    ['rastgele metin', 'bu-bir-token-degil'],
    ['eksik parça', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0'],
  ])('biçimsiz tokeni reddeder (%s)', async (_ad, token) => {
    await expect(verifyExternalAssessmentToken(token)).rejects.toThrow();
  });

  it('AUTH_SECRET yoksa doğrulamayı reddeder', async () => {
    const token = await uret();
    const onceki = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    try {
      await expect(verifyExternalAssessmentToken(token)).rejects.toThrow('AUTH_SECRET_MISSING');
    } finally {
      process.env.AUTH_SECRET = onceki;
    }
  });
});
