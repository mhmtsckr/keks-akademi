'use client';

import { useState } from 'react';

/**
 * Oturumu kapatır. Sunucu çerezi silemezse kullanıcıyı ana sayfaya atmaz —
 * aksi hâlde hâlâ giriş yapmış olduğu hâlde çıkmış sanır.
 */
export function LogoutButton() {
  const [cikiliyor, setCikiliyor] = useState(false);
  const [hata, setHata] = useState('');

  async function cik() {
    setCikiliyor(true);
    setHata('');
    try {
      const yanit = await fetch('/api/auth/logout', { method: 'POST' });
      if (!yanit.ok) throw new Error('LOGOUT_FAILED');
      window.location.href = '/';
    } catch {
      setHata('Çıkış yapılamadı, tekrar deneyin.');
      setCikiliyor(false);
    }
  }

  return (
    <div className="portalLogout">
      <button type="button" onClick={cik} disabled={cikiliyor}>
        {cikiliyor ? 'Çıkılıyor…' : 'Çıkış'}
      </button>
      {hata && <span role="alert">{hata}</span>}
    </div>
  );
}
