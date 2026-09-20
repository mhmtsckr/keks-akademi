'use client';

import { FormEvent, useEffect, useState } from 'react';

const SITE_ORIGIN='https://kazandiran-egitim-kocluk.mhmtsckr029.chatgpt.site';

type SessionState={
  status:'READY'|'COMPLETED'|'NO_ACCESS'|'ERROR';
  url?:string;
  assessment?:{id:string;completedAt:string;formVersion:string};
};

export function StudentActions({hasAccess}:{hasAccess:boolean}) {
  const [msg,setMsg]=useState('');
  const [session,setSession]=useState<SessionState|null>(null);

  async function loadSession(reloadOnComplete=false){
    try{
      const r=await fetch('/api/student/test/external-session',{cache:'no-store'});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Tarama oturumu açılamadı.');
      setSession(j);
      if(j.status==='COMPLETED'&&reloadOnComplete){
        setMsg('KEKS Eğilim Taraması tamamlandı. Sonuçlar koçunuza aktarıldı; ön görüşme alanı güncelleniyor…');
        setTimeout(()=>location.reload(),700);
      }
    }catch(error:any){
      setSession({status:'ERROR'});
      setMsg('Hata: '+(error?.message||'Tarama oturumu açılamadı.'));
    }
  }

  useEffect(()=>{
    let active=true;
    const check=async(reloadOnComplete=false)=>{
      if(!active)return;
      await loadSession(reloadOnComplete);
    };
    check(false);
    const timer=setInterval(()=>check(true),8000);
    const onMessage=(event:MessageEvent)=>{
      if(event.origin!==SITE_ORIGIN)return;
      if(event.data?.type==='KEKS_ASSESSMENT_COMPLETED')check(true);
    };
    window.addEventListener('message',onMessage);
    return ()=>{active=false;clearInterval(timer);window.removeEventListener('message',onMessage)};
  },[]);

  async function code(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd=new FormData(e.currentTarget);
    const r=await fetch('/api/student/test/access',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:fd.get('code')})});
    const j=await r.json();
    if(!r.ok) return setMsg('Hata: '+(j.error||'Kod doğrulanamadı.'));
    setMsg('KEKS erişimi açıldı. Tarama oturumu hazırlanıyor…');
    await loadSession(false);
  }

  async function pay(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd=new FormData(e.currentTarget);
    const body=Object.fromEntries(fd.entries());
    const r=await fetch('/api/paytr/start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok) return setMsg('Hata: '+(j.error||'Ödeme başlatılamadı.'));
    location.href=j.iframeUrl;
  }

  if(!session)return <div className="card"><p className="muted">KEKS Eğilim Taraması erişimi kontrol ediliyor…</p></div>;

  if(session.status==='COMPLETED')return <div className="card">
    <div className="moduleEyebrow">TARAMA TAMAMLANDI</div>
    <h2>KEKS Eğilim Taraması kaydedildi</h2>
    <div className="notice"><strong>Sonuçlar koç paneline aktarıldı.</strong><div className="muted">Ayrıntılı eğilim raporu yalnız koçunuz tarafından görüntülenir. Ön görüşme formunuz uygun eğitim düzeyi formu mevcutsa otomatik açılır.</div></div>
  </div>;

  if(session.status==='READY'&&session.url)return <div className="stack">
    <div className="card">
      <div className="moduleHeaderRow">
        <div>
          <div className="moduleEyebrow">KEKS EĞİLİM TARAMASI</div>
          <h2>Eğitsel Çalışma ve Öz-Düzenleme Eğilimleri Taraması</h2>
          <p className="muted">Bu oturum KEKS hesabınıza bağlıdır. Tarama tamamlandığında cevaplar ve sonuçlar otomatik olarak koç panelinize aktarılır.</p>
        </div>
        <a className="btn" href={session.url} target="_blank" rel="noreferrer">Yeni Sekmede Aç ↗</a>
      </div>
      <div className="notice" style={{marginBottom:14}}>
        <strong>Güvenli tarama oturumu aktif.</strong>
        <div className="muted">Oturum bağlantısı öğrenci hesabınız ve bu aya ait test erişiminizle eşleştirilmiştir.</div>
      </div>
      <div style={{border:'1px solid var(--line)',borderRadius:16,overflow:'hidden',background:'#fff'}}>
        <iframe
          src={session.url}
          title="KEKS Eğilim Taraması"
          style={{width:'100%',height:'900px',border:0,display:'block'}}
          allow="clipboard-read; clipboard-write"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')} style={{marginTop:12}}>{msg}</div>}
    </div>
  </div>;

  if(session.status==='ERROR'&&hasAccess)return <div className="card">
    <div className="notice error">{msg||'Tarama oturumu hazırlanamadı.'}</div>
    <button className="btn primary" onClick={()=>loadSession(false)}>Tekrar Dene</button>
  </div>;

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
