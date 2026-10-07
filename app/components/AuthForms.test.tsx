// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {StudentRegisterForm} from './AuthForms';

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
