// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudentRegisterForm } from './AuthForms';

/** /api/public/coaches yanıtını taklit eder. */
function koclariDondur(coaches: Array<{ id: string; name: string; studentCount: number }>) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, coaches }) }),
  );
}

const gonderButonu = () => screen.getByRole('button', { name: /kaydı başlat/i });
const UYARI = /başvuruya açık koç bulunmuyor/i;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('StudentRegisterForm — koç listesi', () => {
  it('yüklenirken butonu kilitler ve durumu gösterir', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    render(<StudentRegisterForm />);

    expect(screen.getByRole('option', { name: /koçlar yükleniyor/i })).toBeInTheDocument();
    expect(gonderButonu()).toBeDisabled();
    // Henuz yukleniyor: "koc yok" uyarisi erken gosterilmemeli
    expect(screen.queryByText(UYARI)).not.toBeInTheDocument();
  });

  it('koçlar gelince seçenekleri listeler ve gönderime izin verir', async () => {
    koclariDondur([
      { id: 'koc-1', name: 'Zeynep Koç', studentCount: 3 },
      { id: 'koc-2', name: 'Mehmet Koç', studentCount: 0 },
    ]);
    render(<StudentRegisterForm />);

    await waitFor(() => expect(gonderButonu()).toBeEnabled());
    expect(screen.getByRole('option', { name: /Zeynep Koç · 3 öğrenci/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Mehmet Koç · 0 öğrenci/ })).toBeInTheDocument();
    expect(screen.queryByText(UYARI)).not.toBeInTheDocument();
  });

  // --- Duzeltilen eksik ----------------------------------------------------
  // Aktif koc yokken buton sessizce kapali kaliyor, kullanici sebebini
  // anlamiyordu.
  it('aktif koç yoksa sebebini açıklar', async () => {
    koclariDondur([]);
    render(<StudentRegisterForm />);

    const uyari = await screen.findByRole('alert');
    expect(uyari).toHaveTextContent(UYARI);
    expect(gonderButonu()).toBeDisabled();
    expect(screen.getByRole('option', { name: /aktif koç yok/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /koç seçiniz/i })).not.toBeInTheDocument();
  });

  it('koç listesi alınamazsa da aynı açıklamayı gösterir', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<StudentRegisterForm />);

    const uyari = await screen.findByRole('alert');
    expect(uyari).toHaveTextContent(UYARI);
    expect(gonderButonu()).toBeDisabled();
  });

  it('sunucu ok:false dönerse de açıklama gösterilir', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ ok: false }) }),
    );
    render(<StudentRegisterForm />);

    expect(await screen.findByRole('alert')).toHaveTextContent(UYARI);
    expect(gonderButonu()).toBeDisabled();
  });
});
