'use client';

import { FormEvent, useState } from 'react';

export function StudentActions({hasAccess}:{hasAccess:boolean}) {
  const [msg,setMsg]=useState('');
  async function code(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd=new FormData(e.currentTarget);
    const r=await fetch('/api/student/test/access',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:fd.get('code')})});
    const j=await r.json();
    if(!r.ok) return setMsg('Hata: '+(j.error||'Kod doğrulanamadı.'));
    setMsg('KEKS erişimi açıldı. Sayfa yenileniyor…'); setTimeout(()=>location.reload(),700);
  }
  async function pay(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd=new FormData(e.currentTarget);
    const body=Object.fromEntries(fd.entries());
    const r=await fetch('/api/paytr/start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok) return setMsg('Hata: '+(j.error||'Ödeme başlatılamadı.'));
    location.href=j.iframeUrl;
  }
  if(hasAccess) return <div className="notice"><strong>Bu ayki KEKS test erişiminiz hazır.</strong><div className="muted">Bu erişim bu takvim ayı içinde bir kez test çözmek için kullanılabilir. Test tamamlandığında erişim kapanır; yeni ayda aylık KEKS kodunuz yeniden kullanılabilir olur.</div></div>;
  return <div className="stack">
    <div className="card"><h3>Aylık KEKS Akademi Kodum Var</h3><p className="muted">Öğrenciye özel KEKS kodu her takvim ayında bir kez test erişimi açar. Aynı ay ikinci kez kullanılamaz; yeni ayda otomatik olarak tekrar kullanılabilir.</p><form className="form" onSubmit={code}><div className="field"><label>KEKS Akademi kodu</label><input name="code" required placeholder="KEKS-…"/></div><button className="btn primary">Kodu Kullan</button></form></div>
    <div className="card"><h3>350 TL ile Test Erişimi</h3><p className="muted">Ödeme PayTR üzerinden doğrulandıktan sonra test erişimi otomatik açılır.</p><form className="form" onSubmit={pay}>
      <div className="field"><label>E-posta</label><input name="email" type="email" required/></div>
      <div className="field"><label>Ad soyad</label><input name="userName" required/></div>
      <div className="field"><label>Telefon</label><input name="userPhone" required/></div>
      <div className="field"><label>Adres</label><textarea name="userAddress" required/></div>
      <button className="btn primary">350 TL Öde ve Testi Aç</button>
    </form></div>
    {msg && <div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}
  </div>;
}
