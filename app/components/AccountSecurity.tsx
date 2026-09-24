'use client';

import { FormEvent,useEffect,useState } from 'react';
import { passwordPolicyErrors } from '@/lib/passwordPolicy';

function fmt(v:string|null|undefined){
  if(!v)return 'Kayıt yok';
  return new Date(v).toLocaleString('tr-TR');
}

export function AccountSecurity({loginPath}:{loginPath:string}){
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);
  const [newPassword,setNewPassword]=useState('');
  const [logoutOtherSessions,setLogoutOtherSessions]=useState(true);

  async function load(){
    const r=await fetch('/api/auth/security',{cache:'no-store'});
    const j=await r.json();
    if(r.ok)setData(j);
  }
  useEffect(()=>{void load()},[]);

  async function changePassword(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('');
    const form=e.currentTarget;
    const fd=new FormData(form);
    const confirm=String(fd.get('passwordConfirm')||'');
    const errors=passwordPolicyErrors(newPassword);
    if(errors.length)return setMsg('Hata: '+errors[0]);
    if(newPassword!==confirm)return setMsg('Hata: Yeni şifreler eşleşmiyor.');
    setBusy(true);
    try{
      const r=await fetch('/api/auth/change-password',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          currentPassword:fd.get('currentPassword'),
          newPassword,
          logoutOtherSessions
        })
      });
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'Şifre değiştirilemedi.'));
      if(j.loggedOut){location.href=loginPath;return}
      form.reset();setNewPassword('');setMsg(j.message||'Şifre değiştirildi.');await load();
    }finally{setBusy(false)}
  }

  async function revokeAll(){
    if(!window.confirm('Bu cihaz dahil tüm cihazlardaki oturumlar kapatılsın mı?'))return;
    setBusy(true);setMsg('');
    try{
      const r=await fetch('/api/auth/revoke-sessions',{method:'POST'});
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'Oturumlar kapatılamadı.'));
      location.href=loginPath;
    }finally{setBusy(false)}
  }

  return <div className="stack">
    <div className="card">
      <div className="moduleEyebrow">HESAP GÜVENLİĞİ</div>
      <h2>Güvenlik özeti</h2>
      {!data?<p className="muted">Güvenlik bilgileri yükleniyor…</p>:<>
        <div className="adminActivityRows">
          <div><span>E-posta</span><strong>{data.account?.email||'—'}</strong></div>
          <div><span>Son giriş</span><strong>{fmt(data.account?.lastLoginAt)}</strong></div>
          <div><span>Son şifre değişimi</span><strong>{fmt(data.account?.lastPasswordChangeAt)}</strong></div>
          <div><span>Aktif oturum</span><strong>{data.activeSessionCount||0}</strong></div>
        </div>
        <div className="stack" style={{marginTop:14}}>
          {(data.activeSessions||[]).map((s:any)=><div className="card" key={s.id} style={{padding:12}}>
            <div className="row" style={{justifyContent:'space-between'}}>
              <strong>{s.device}{s.current?' · Bu cihaz':''}</strong>
              <span className="pill">{s.remember?'Hatırlanan oturum':'Standart oturum'}</span>
            </div>
            <div className="muted">Başlangıç: {fmt(s.createdAt)} · Bitiş: {fmt(s.expiresAt)}</div>
          </div>)}
        </div>
        <button className="btn danger" type="button" onClick={revokeAll} disabled={busy}>Tüm Cihazlardan Çıkış Yap</button>
      </>}
    </div>

    <form className="card form" onSubmit={changePassword}>
      <div className="moduleEyebrow">ŞİFRE YÖNETİMİ</div>
      <h2>Şifre değiştir</h2>
      <div className="field"><label>Mevcut şifre</label><input name="currentPassword" type="password" required autoComplete="current-password"/></div>
      <div className="field"><label>Yeni şifre</label><input name="newPassword" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} minLength={12} required autoComplete="new-password"/></div>
      <div className="field"><label>Yeni şifre tekrar</label><input name="passwordConfirm" type="password" minLength={12} required autoComplete="new-password"/></div>
      <div className="notice">
        <strong>Şifre güvenliği</strong>
        <div className="muted">En az 12 karakter; 16+ önerilir. Büyük/küçük harf, rakam ve özel karakter zorunludur.</div>
        {newPassword&&passwordPolicyErrors(newPassword).map(x=><div key={x}>• {x}</div>)}
      </div>
      <label className="row" style={{justifyContent:'flex-start',gap:8}}>
        <input type="checkbox" checked={logoutOtherSessions} onChange={e=>setLogoutOtherSessions(e.target.checked)}/>
        <span>Diğer cihazlardaki oturumları kapat {logoutOtherSessions?'(bu cihaz da yeniden giriş ister)':'(bu cihaz açık kalır)'}</span>
      </label>
      <button className="btn primary" type="submit" disabled={busy}>{busy?'İşleniyor…':'Şifreyi Değiştir'}</button>
      {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    </form>
  </div>;
}
