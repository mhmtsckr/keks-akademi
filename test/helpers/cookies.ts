import { vi } from 'vitest';

const depo = new Map<string, string>();

export const cookieJar = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

/** next/headers'ın cookies() yerine geçer. */
export const cookies = async () => cookieJar;

/** Tarayıcıdan gelmiş gibi bir çerez yerleştirir. */
export function setCookie(ad: string, deger: string) {
  depo.set(ad, deger);
}

export function applyCookieDefaults() {
  depo.clear();
  cookieJar.get.mockImplementation((ad: string) =>
    depo.has(ad) ? { name: ad, value: depo.get(ad)! } : undefined,
  );
  cookieJar.set.mockImplementation((ad: string, deger: string) => {
    depo.set(ad, deger);
  });
  cookieJar.delete.mockImplementation((ad: string) => {
    depo.delete(ad);
  });
}

applyCookieDefaults();
