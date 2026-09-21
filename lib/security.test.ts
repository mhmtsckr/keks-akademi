import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import {
  decryptPrivateCode,
  encryptPrivateCode,
  hashSecret,
  merchantOid,
  randomCode,
  verifySecret,
} from './security';

/** AUTH_SECRET'i geçici olarak kaldırıp geri koyar. */
function authSecretOlmadan(fn: () => void) {
  const onceki = process.env.AUTH_SECRET;
  delete process.env.AUTH_SECRET;
  try {
    fn();
  } finally {
    process.env.AUTH_SECRET = onceki;
  }
}

describe('hashSecret / verifySecret', () => {
  it('scrypt parametrelerini hash içine gömer', async () => {
    const hash = await hashSecret('ogrenci-anahtari');
    expect(hash.startsWith('scrypt$16384$8$1$')).toBe(true);
    expect(hash.split('$')).toHaveLength(6);
  });

  it('doğru değeri doğrular', async () => {
    const hash = await hashSecret('ogrenci-anahtari');
    await expect(verifySecret('ogrenci-anahtari', hash)).resolves.toBe(true);
  });

  it('yanlış değeri reddeder', async () => {
    const hash = await hashSecret('ogrenci-anahtari');
    await expect(verifySecret('baska-anahtar', hash)).resolves.toBe(false);
  });

  it('aynı değer için her seferinde farklı hash üretir (rastgele tuz)', async () => {
    const [a, b] = await Promise.all([hashSecret('ayni'), hashSecret('ayni')]);
    expect(a).not.toBe(b);
    await expect(verifySecret('ayni', a)).resolves.toBe(true);
    await expect(verifySecret('ayni', b)).resolves.toBe(true);
  });

  it('Türkçe karakterli değerleri doğru işler', async () => {
    const hash = await hashSecret('şifreÇĞİÖÜ');
    await expect(verifySecret('şifreÇĞİÖÜ', hash)).resolves.toBe(true);
    await expect(verifySecret('sifreCGIOU', hash)).resolves.toBe(false);
  });

  // Eski kayıtlar bcrypt ile hash'lenmişti; migrasyon sonrası hâlâ giriş
  // yapabilmeleri gerekiyor.
  it('eski bcrypt hashlerini doğrulamayı sürdürür', async () => {
    const legacy = bcrypt.hashSync('eski-parola', 4);
    await expect(verifySecret('eski-parola', legacy)).resolves.toBe(true);
    await expect(verifySecret('yanlis', legacy)).resolves.toBe(false);
  });
});

describe('randomCode', () => {
  it('varsayılan olarak KEKS ön ekiyle 8 haneli büyük harf hex üretir', () => {
    expect(randomCode()).toMatch(/^KEKS-[0-9A-F]{8}$/);
  });

  it('özel ön ek alabilir', () => {
    expect(randomCode('DENEME')).toMatch(/^DENEME-[0-9A-F]{8}$/);
  });

  it('ardışık çağrılarda tekrar etmez', () => {
    const kodlar = new Set(Array.from({ length: 200 }, () => randomCode()));
    expect(kodlar.size).toBe(200);
  });
});

describe('merchantOid', () => {
  it('PayTR uyumlu (yalnızca alfanümerik) sipariş numarası üretir', () => {
    expect(merchantOid()).toMatch(/^KEKS\d{13}[0-9a-f]{8}$/);
  });

  it('ardışık çağrılarda tekrar etmez', () => {
    const oidler = new Set(Array.from({ length: 200 }, () => merchantOid()));
    expect(oidler.size).toBe(200);
  });
});

describe('encryptPrivateCode / decryptPrivateCode', () => {
  it('gidiş-dönüşte özgün metni geri verir', () => {
    expect(decryptPrivateCode(encryptPrivateCode('gizli-kod-42'))).toBe('gizli-kod-42');
  });

  it('Türkçe karakterleri korur', () => {
    expect(decryptPrivateCode(encryptPrivateCode('Öğrenci ŞİFRE çğıöşü'))).toBe('Öğrenci ŞİFRE çğıöşü');
  });

  // Bilinen sınırlama: AES-GCM boş metni 0 baytlık şifreli metne çevirir, bu da
  // üçüncü parçayı boş bırakır ve decryptPrivateCode onu biçimsiz sayar.
  // Bugün erişilebilir bir yol yok — çağıranların ikisi randomCode() çıktısını,
  // üçüncüsü ise ternary ile korunan OAuth token'ını geçiriyor. Davranış
  // değiştirilmeden olduğu gibi sabitleniyor.
  it('boş metni şifreler ama geri çözemez (bilinen sınırlama)', () => {
    const sifreli = encryptPrivateCode('');
    expect(sifreli.split('.')[2]).toBe('');
    expect(() => decryptPrivateCode(sifreli)).toThrow('INVALID_PRIVATE_CODE');
  });

  it('iv.tag.veri biçiminde üç parça üretir', () => {
    expect(encryptPrivateCode('x').split('.')).toHaveLength(3);
  });

  it('aynı girdi için her seferinde farklı şifreli metin üretir (rastgele IV)', () => {
    const a = encryptPrivateCode('ayni-kod');
    const b = encryptPrivateCode('ayni-kod');
    expect(a).not.toBe(b);
    expect(decryptPrivateCode(a)).toBe(decryptPrivateCode(b));
  });

  it('şifreli veri kurcalanmışsa çözmeyi reddeder', () => {
    const [iv, tag, veri] = encryptPrivateCode('gizli-kod-42').split('.');
    const bozuk = veri[0] === 'A' ? 'B' + veri.slice(1) : 'A' + veri.slice(1);
    expect(() => decryptPrivateCode(`${iv}.${tag}.${bozuk}`)).toThrow();
  });

  it('doğrulama etiketi kurcalanmışsa çözmeyi reddeder', () => {
    const [iv, tag, veri] = encryptPrivateCode('gizli-kod-42').split('.');
    const bozuk = tag[0] === 'A' ? 'B' + tag.slice(1) : 'A' + tag.slice(1);
    expect(() => decryptPrivateCode(`${iv}.${bozuk}.${veri}`)).toThrow();
  });

  it('başka bir kayıttan gelen IV ile çözmeyi reddeder', () => {
    const [, tag, veri] = encryptPrivateCode('gizli-kod-42').split('.');
    const [baskaIv] = encryptPrivateCode('baska-kayit').split('.');
    expect(() => decryptPrivateCode(`${baskaIv}.${tag}.${veri}`)).toThrow();
  });

  it.each([
    ['boş metin', ''],
    ['tek parça', 'sadecebirparca'],
    ['iki parça', 'birinci.ikinci'],
    ['boş parçalar', '..'],
  ])('biçimsiz girdide INVALID_PRIVATE_CODE fırlatır (%s)', (_ad, girdi) => {
    expect(() => decryptPrivateCode(girdi)).toThrow('INVALID_PRIVATE_CODE');
  });

  it('AUTH_SECRET yoksa AUTH_SECRET_MISSING fırlatır', () => {
    const sifreli = encryptPrivateCode('gizli-kod-42');
    authSecretOlmadan(() => {
      expect(() => encryptPrivateCode('x')).toThrow('AUTH_SECRET_MISSING');
      expect(() => decryptPrivateCode(sifreli)).toThrow('AUTH_SECRET_MISSING');
    });
  });

  it('AUTH_SECRET değişirse eski kayıtlar çözülemez', () => {
    const sifreli = encryptPrivateCode('gizli-kod-42');
    const onceki = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = 'tamamen-baska-bir-gizli-anahtar-0123456789';
    try {
      expect(() => decryptPrivateCode(sifreli)).toThrow();
    } finally {
      process.env.AUTH_SECRET = onceki;
    }
  });
});
