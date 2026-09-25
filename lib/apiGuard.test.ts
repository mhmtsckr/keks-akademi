import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AuthError, BadRequestError, HttpError, readJson, readJsonBody, withApiErrors } from './apiGuard';

const zodHatasi = () => z.object({ ad: z.string() }).safeParse({}).error!;

describe('AuthError', () => {
  it('durum kodunu ve mesajı taşır', () => {
    const hata = new AuthError(403, 'Yetkiniz yok.');
    expect(hata).toBeInstanceOf(Error);
    expect(hata.name).toBe('AuthError');
    expect(hata.status).toBe(403);
    expect(hata.message).toBe('Yetkiniz yok.');
  });
});

describe('withApiErrors', () => {
  it('sorunsuz handler yanıtını olduğu gibi geçirir', async () => {
    const yanit = new Response('tamam');
    await expect(withApiErrors(async () => yanit)()).resolves.toBe(yanit);
  });

  it('handler argümanlarını değiştirmeden iletir', async () => {
    const casus = vi.fn(async (_istek: Request, _ctx: { params: Promise<{ id: string }> }) => new Response('ok'));
    const istek = new Request('http://localhost/api/x');
    const ctx = { params: Promise.resolve({ id: '42' }) };
    await withApiErrors(casus)(istek, ctx);
    expect(casus).toHaveBeenCalledWith(istek, ctx);
  });

  // --- Regresyon: hata 2 ---------------------------------------------------
  // Önceden requireRole'ün fırlattığı hata hiçbir yerde yakalanmıyordu ve Next
  // 500 döndürüyordu.
  it.each([
    [401, 'Oturum açmanız gerekiyor.'],
    [403, 'Bu işlem için yetkiniz yok.'],
  ] as const)('AuthError(%i) durumunu JSON yanıta çevirir', async (durum, mesaj) => {
    const yanit = await withApiErrors(async () => {
      throw new AuthError(durum, mesaj);
    })();
    expect(yanit.status).toBe(durum);
    await expect(yanit.json()).resolves.toEqual({ error: mesaj });
  });

  // --- Regresyon: hata 3 ---------------------------------------------------
  it('ZodError durumunda 400 döner', async () => {
    const yanit = await withApiErrors(async () => {
      throw zodHatasi();
    })();
    expect(yanit.status).toBe(400);
    const govde = (await yanit.json()) as { error: string; details: string[] };
    expect(govde.error).toBe('Gönderilen veri geçersiz.');
    expect(govde.details.length).toBeGreaterThan(0);
  });

  it('bilinmeyen hatayı güvenli 500 yanıtına ve request IDye çevirir', async () => {
    const req=new Request('http://localhost/api/test-error');
    const yanit=await withApiErrors(async (_req:Request) => {
      throw new Error('veritabani patladi');
    })(req);
    expect(yanit.status).toBe(500);
    const body=await yanit.json() as {error:string;requestId:string};
    expect(body.error).toBe('Beklenmeyen bir sunucu hatası oluştu.');
    expect(typeof body.requestId).toBe('string');
    expect(yanit.headers.get('x-request-id')).toBe(body.requestId);
  });

  it('Error olmayan fırlatmaları da ayrıntı sızdırmadan 500e çevirir', async () => {
    const req=new Request('http://localhost/api/raw-error');
    const yanit=await withApiErrors(async (_req:Request) => {
      throw 'ham metin';
    })(req);
    expect(yanit.status).toBe(500);
    const body=await yanit.json() as {error:string;requestId:string};
    expect(body.error).toBe('Beklenmeyen bir sunucu hatası oluştu.');
    expect(body).not.toHaveProperty('details');
  });
});

/** Gövdesi verilen sahte bir POST isteği kurar. */
function istek(govde: string) {
  return new Request('http://localhost/api/x', {
    method: 'POST',
    body: govde,
    headers: { 'content-type': 'application/json' },
  });
}

describe('hata sınıfı hiyerarşisi', () => {
  it('AuthError ve BadRequestError birer HttpError türüdür', () => {
    expect(new AuthError(401, 'x')).toBeInstanceOf(HttpError);
    expect(new BadRequestError()).toBeInstanceOf(HttpError);
    expect(new BadRequestError().status).toBe(400);
  });
});

describe('readJsonBody', () => {
  it('geçerli JSON gövdesini okur', async () => {
    await expect(readJsonBody(istek('{"ad":"Ayşe"}'))).resolves.toEqual({ ad: 'Ayşe' });
  });

  // --- Regresyon: bozuk JSON 500 yerine 400 ---------------------------------
  it.each([
    ['yarım nesne', '{bozuk'],
    ['boş gövde', ''],
    ['düz metin', 'merhaba'],
  ])('bozuk JSON için BadRequestError fırlatır (%s)', async (_ad, govde) => {
    await expect(readJsonBody(istek(govde))).rejects.toBeInstanceOf(BadRequestError);
    await expect(readJsonBody(istek(govde))).rejects.toMatchObject({ status: 400 });
  });
});

describe('readJson', () => {
  const sema = z.object({ ad: z.string(), yas: z.number() });

  it('şemaya uyan gövdeyi doğrulanmış olarak döner', async () => {
    await expect(readJson(istek('{"ad":"Ayşe","yas":17}'), sema)).resolves.toEqual({
      ad: 'Ayşe',
      yas: 17,
    });
  });

  it('şemaya uymayan gövdede ZodError fırlatır', async () => {
    await expect(readJson(istek('{"ad":"Ayşe"}'), sema)).rejects.toBeInstanceOf(z.ZodError);
  });

  it('bozuk JSON için şemaya hiç bakmadan BadRequestError fırlatır', async () => {
    await expect(readJson(istek('{bozuk'), sema)).rejects.toBeInstanceOf(BadRequestError);
  });
});

// Route'ların gerçek davranışı: sarmalayıcı + readJson birlikte.
describe('withApiErrors + readJson birlikte', () => {
  const sema = z.object({ ad: z.string() });
  const route = withApiErrors(async (req: Request) => {
    const veri = await readJson(req, sema);
    return Response.json({ ok: true, ad: veri.ad });
  });

  it('geçerli gövdede handler normal çalışır', async () => {
    const yanit = await route(istek('{"ad":"Ayşe"}'));
    expect(yanit.status).toBe(200);
    await expect(yanit.json()).resolves.toEqual({ ok: true, ad: 'Ayşe' });
  });

  it('bozuk JSON gövdesinde 400 döner', async () => {
    const yanit = await route(istek('{bozuk'));
    expect(yanit.status).toBe(400);
    await expect(yanit.json()).resolves.toEqual({ error: 'İstek gövdesi geçerli JSON değil.' });
  });

  it('şemaya uymayan gövdede 400 döner', async () => {
    const yanit = await route(istek('{"ad":123}'));
    expect(yanit.status).toBe(400);
    expect((await yanit.json()).error).toBe('Gönderilen veri geçersiz.');
  });
});
