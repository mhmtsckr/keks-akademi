'use client';

import { FormEvent,useState } from 'react';

export function CoachAccessCodeClaim(){
  const [code,setCode]=useState('');
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try{
      const r=await fetch('/api/coach/access-code',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({code})
      });
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'Erişim kodu doğrulanamadı.'));
      setMsg(j.message||'Öğrenci koç panelinize tanımlandı.');
      setCode('');
      setTimeout(()=>location.reload(),700);
    }finally{
      setBusy(false);
    }
  }

  return <div className="card">
    <div className="moduleEyebrow">ÖĞRENCİ ERİŞİM KODU</div>
    <h2>Testini tamamlayan öğrenciyi tanımla</h2>
    <p className="muted">Öğrenci KEKS Eğilim Taramasını tamamladığında kendisine tek kullanımlık bir koç erişim kodu verilir. Öğrencinizin size ilettiği <strong>KOC-…</strong> kodunu girin.</p>
    <form className="form" onSubmit={submit}>
      <div className="field">
        <label>Koç erişim kodu</label>
        <input
          value={code}
          onChange={e=>setCode(e.target.value.toUpperCase())}
          placeholder="KOC-XXXXXXXX"
          autoComplete="off"
          required
        />
      </div>
      <button className="btn primary" disabled={busy||!code.trim()}>{busy?'Doğrulanıyor…':'Kodu Doğrula ve Öğrenciyi Tanımla'}</button>
    </form>
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')} style={{marginTop:12}}>{msg}</div>}
  </div>;
}
