// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LogoutButton } from './LogoutButton';

/** jsdom gerçek gezinmeyi desteklemez; location'ı yazılabilir bir ikizle değiştiriyoruz. */
function konumIkizi(baslangic = 'http://localhost/ogrenci') {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { href: baslangic },
  });
}

const cikisButonu = () => screen.getByRole('button', { name: /çık/i });

beforeEach(() => {
  konumIkizi();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('LogoutButton', () => {
  it('çıkış butonunu gösterir', () => {
    render(<LogoutButton />);
    expect(cikisButonu()).toBeEnabled();
    expect(cikisButonu()).toHaveTextContent('Çıkış');
  });

  it('tıklanınca oturumu kapatan uç noktayı çağırır', async () => {
    const istek = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', istek);
    render(<LogoutButton />);

    await userEvent.click(cikisButonu());

    expect(istek).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
  });

  it('başarılı çıkışta ana sayfaya yönlendirir', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    render(<LogoutButton />);

    await userEvent.click(cikisButonu());

    await waitFor(() => expect(window.location.href).toBe('/'));
  });

  it('istek sürerken butonu kilitler ve durumu gösterir', async () => {
    let tamamla: (yanit: { ok: boolean }) => void = () => {};
    const bekleyen = new Promise<{ ok: boolean }>(coz => {
      tamamla = coz;
    });
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(bekleyen));
    render(<LogoutButton />);

    await userEvent.click(cikisButonu());

    // Cift tiklamayla iki kez cikis istegi gitmemeli
    expect(cikisButonu()).toBeDisabled();
    expect(cikisButonu()).toHaveTextContent('Çıkılıyor…');

    tamamla({ ok: true });
    await waitFor(() => expect(window.location.href).toBe('/'));
  });

  // Onemli olan davranis: cerez silinemediyse kullaniciyi cikmis sanmasina
  // birakmamak. Yonlendirme yapilirsa hala giris yapmis oldugunu fark etmez.
  it.each([
    ['sunucu hata dönerse', () => vi.fn().mockResolvedValue({ ok: false })],
    ['ağ hatası olursa', () => vi.fn().mockRejectedValue(new Error('offline'))],
  ])('%s yönlendirmez ve uyarı gösterir', async (_ad, istekUret) => {
    vi.stubGlobal('fetch', istekUret());
    render(<LogoutButton />);

    await userEvent.click(cikisButonu());

    const uyari = await screen.findByRole('alert');
    expect(uyari).toHaveTextContent('Çıkış yapılamadı, tekrar deneyin.');
    expect(window.location.href).toBe('http://localhost/ogrenci');
  });

  it('hatadan sonra yeniden denenebilir', async () => {
    const istek = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', istek);
    render(<LogoutButton />);

    await userEvent.click(cikisButonu());
    await screen.findByRole('alert');
    expect(cikisButonu()).toBeEnabled();

    await userEvent.click(cikisButonu());

    await waitFor(() => expect(window.location.href).toBe('/'));
    expect(istek).toHaveBeenCalledTimes(2);
  });
});
