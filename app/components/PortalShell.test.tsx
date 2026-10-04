// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it} from 'vitest';
import {KeksNav} from './PortalShell';

afterEach(cleanup);

describe('KeksNav',()=>{
  it('üç çizgili menü tetikleyicisini gösterir',()=>{
    render(<KeksNav/>);
    expect(screen.getByLabelText('Menüyü aç')).toBeInTheDocument();
  });

  it('ana menü bağlantılarını taşır',()=>{
    const {container}=render(<KeksNav/>);
    for(const href of ['/abonelik-planlari','/sistem','/kayit#ogrenci','/giris#ogrenci','/hakkimizda']){
      expect(container.querySelector(`a[href="${href}"]`)).toBeInTheDocument();
    }
  });

  it('öğrenci, koç ve veli kayıt/giriş bağlantılarını ayrı ayrı sunar',()=>{
    const {container}=render(<KeksNav/>);
    for(const href of ['/kayit#ogrenci','/kayit#koc','/kayit#veli','/giris#ogrenci','/giris#koc','/giris#veli']){
      expect(container.querySelector(`a[href="${href}"]`)).toBeInTheDocument();
    }
  });

  it('çıkış kontrolünü yalnız giriş yapılmış kabukta gösterir',()=>{
    const {container,rerender}=render(<KeksNav/>);
    expect(container.textContent).not.toContain('Çıkış');
    rerender(<KeksNav signedIn active="ogrenci"/>);
    expect(container.textContent).toContain('Çıkış');
  });

  it('aktif bölüm bilgisini nav üzerinde korur',()=>{
    const {container}=render(<KeksNav active="veli"/>);
    expect(container.querySelector('nav')).toHaveAttribute('data-active','veli');
  });
});
