// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {AccountLoginForm,StudentRegisterForm} from './AuthForms';

afterEach(()=>{
  cleanup();
  vi.unstubAllGlobals();
});

describe('StudentRegisterForm — ilk giriş akışı',()=>{
  it('koç seçimini kayıt formunda zorunlu tutmaz',()=>{
    const fetchMock=vi.fn();
    vi.stubGlobal('fetch',fetchMock);
    render(<StudentRegisterForm/>);

    expect(screen.queryByLabelText(/koçunu seç/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Koç seçimi zorunlu değil/i)).toBeInTheDocument();
    expect(screen.getByRole('button',{name:/kaydı başlat/i})).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('kayıt sonrasında sihirbaz ve 7 günlük plan akışını açıklar',()=>{
    render(<StudentRegisterForm/>);
    expect(screen.getByText(/ilk giriş sihirbazı/i)).toBeInTheDocument();
    expect(screen.getByText(/İlk 7 Günlük Başlangıç Planı/i)).toBeInTheDocument();
  });
});


describe('AccountLoginForm — rol kontrollü giriş',()=>{
  it('yönetici girişinde ADMIN rolünü sunucuya zorunlu beklenti olarak gönderir',async()=>{
    const fetchMock=vi.fn().mockResolvedValue({
      ok:false,
      json:async()=>({error:'Bu hesap yönetici hesabı değil.'})
    });
    vi.stubGlobal('fetch',fetchMock);

    render(<AccountLoginForm redirect="/yonetici" requiredRole="ADMIN"/>);
    fireEvent.change(screen.getByLabelText('E-posta'),{target:{value:'admin@example.com'}});
    fireEvent.change(screen.getByLabelText('Şifre'),{target:{value:'secret-password'}});
    fireEvent.click(screen.getByRole('button',{name:'Giriş Yap'}));

    await screen.findByText(/Bu hesap yönetici hesabı değil/i);
    await waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(1));
    const [,options]=fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toMatchObject({expectedRole:'ADMIN'});
    expect(options.credentials).toBe('include');
    expect(options.cache).toBe('no-store');
  });
});
