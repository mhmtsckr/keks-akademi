// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { KeksNav } from './PortalShell';

afterEach(cleanup);

const cikis = () => screen.queryByRole('button', { name: /çık/i });

describe('KeksNav', () => {
  // Cikis butonu yalnizca giris yapilmis kabuklarda gorunmeli; ana sayfa ve
  // giris ekranlari gibi herkese acik sayfalarda gorunmemeli.
  it('varsayılan olarak çıkış butonu göstermez', () => {
    render(<KeksNav />);
    expect(cikis()).not.toBeInTheDocument();
  });

  it('signedIn verilmediğinde de göstermez', () => {
    render(<KeksNav active="ogrenci" />);
    expect(cikis()).not.toBeInTheDocument();
  });

  it('signedIn olduğunda çıkış butonunu gösterir', () => {
    render(<KeksNav active="ogrenci" signedIn />);
    expect(cikis()).toBeInTheDocument();
  });

  it('rol bağlantılarını her durumda gösterir', () => {
    render(<KeksNav active="koc" signedIn />);
    for (const ad of ['Sistem', 'Özellikler', 'Öğrenci', 'Koç', 'Veli', 'Yönetici']) {
      expect(screen.getByRole('link', { name: ad })).toBeInTheDocument();
    }
  });

  it('aktif bölümü işaretler', () => {
    render(<KeksNav active="veli" />);
    expect(screen.getByRole('link', { name: 'Veli' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Koç' })).not.toHaveClass('active');
  });
});
