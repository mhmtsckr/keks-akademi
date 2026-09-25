import { NextResponse } from 'next/server';
import { ZodError, type z } from 'zod';
import { recordApiError } from '@/lib/errorTracking';

/** HTTP durumu taşıyan, istemciye gösterilebilir hata. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Yetkilendirme hatası. Route sarmalayıcısı bunu doğru HTTP durumuna çevirir;
 * böylece kimliği doğrulanmamış istekler 500 yerine 401/403 alır.
 */
export class AuthError extends HttpError {
  constructor(status: 401 | 403, message: string) {
    super(status, message);
    this.name = 'AuthError';
  }
}

/** Okunamayan veya biçimsiz istek gövdesi. */
export class BadRequestError extends HttpError {
  constructor(message = 'İstek gövdesi geçerli JSON değil.') {
    super(400, message);
    this.name = 'BadRequestError';
  }
}

/**
 * İstek gövdesini okur ve şemaya göre doğrular.
 * Bozuk JSON -> BadRequestError (400), şema uymuyorsa -> ZodError (400).
 * İkisi de withApiErrors tarafından yanıta çevrilir.
 */
export async function readJson<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<z.infer<T>> {
  return schema.parse(await readJsonBody(req));
}

/**
 * Şema doğrulaması olmayan eski çağrı yerleri için: yalnızca bozuk JSON'u
 * 400'e çevirir, doğrulama davranışını değiştirmez. Dönüş tipi bilerek `any` —
 * `req.json()` de öyle tiplenmiştir, böylece bu salt davranış düzeltmesi olur.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readJsonBody(req: Request): Promise<any> {
  try {
    return await req.json();
  } catch {
    throw new BadRequestError();
  }
}

/**
 * Handler içinden fırlatılan bilinen istemci hatalarını JSON yanıta çevirir:
 * HttpError -> kendi durumu (401/403/400), ZodError -> 400. Diğer tüm hatalar
 * olduğu gibi yukarı iletilir, yani beklenmedik arızalar gizlenmez.
 */
export function withApiErrors<A extends unknown[], R extends Response>(
  handler: (...args: A) => Promise<R>,
) {
  return async (...args: A): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'Gönderilen veri geçersiz.', details: error.issues.map(i => i.message) },
          { status: 400 },
        );
      }
      // Beklenmedik arıza: yönetici panelinde görünür olması için kaydet, sonra
      // olduğu gibi yukarı ilet — hatayı gizleme (bkz. withApiErrors testleri).
      const req = args.find((a): a is Request => a instanceof Request);
      await recordApiError(error, { req });
      throw error;
    }
  };
}
