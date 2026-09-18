'use client';

import { FormEvent, useState } from 'react';

function Message({value}:{value:string}) {
  if (!value) return null;
  const bad = value.startsWith('Hata:');
  return <div className={`notice ${bad ? 'error' : ''}`}>{value}</div>;
}

export function StudentLoginForm() {
  const [msg,setMsg]=useState('');
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg('');
    const fd=new FormData(e.currentTarget);
    const r=await fetch('/api/auth/student-login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({studentCode:fd.get('studentCode'),accessKey:fd.get('accessKey')})});
    const j=await r.json();
    if(!r.ok) return setMsg('Hata: '+(j.error||'Giriş başarısız.'));
    location.href='/ogrenci';
  }
  return <form className="form" onSubmit={submit}>
    <div className="field"><label>Öğrenci kodu</label><input name="studentCode" required autoComplete="username"/></div>
    <div className="field"><label>Giriş anahtarı</label><input name="accessKey" type="password" required autoComplete="current-password"/></div>
    <button className="btn primary" type="submit">Öğrenci Girişi</button><Message value={msg}/>
  </form>;
}

export function AccountLoginForm({redirect='/koc'}:{redirect?:string}) {
  const [msg,setMsg]=useState('');
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg('');
    const fd=new FormData(e.currentTarget);
    const r=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:fd.get('email'),password:fd.get('password')})});
    const j=await r.json();
    if(!r.ok) return setMsg('Hata: '+(j.error||'Giriş başarısız.'));
    location.href=j.role==='ADMIN'?'/yonetici':redirect;
  }
  return <form className="form" onSubmit={submit}>
    <div className="field"><label>E-posta</label><input name="email" type="email" required autoComplete="email"/></div>
    <div className="field"><label>Şifre</label><input name="password" type="password" required autoComplete="current-password"/></div>
    <button className="btn primary" type="submit">Giriş Yap</button><Message value={msg}/>
  </form>;
}

export function CoachRegisterForm() {
  const [msg,setMsg]=useState('');
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg('');
    const fd=new FormData(e.currentTarget);
    const r=await fetch('/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:fd.get('name'),email:fd.get('email'),password:fd.get('password')})});
    const j=await r.json();
    if(!r.ok) return setMsg('Hata: '+(j.error||'Kayıt başarısız.'));
    e.currentTarget.reset(); setMsg('Koç hesabı oluşturuldu. Yönetici onayından sonra giriş yapabilirsiniz.');
  }
  return <form className="form" onSubmit={submit}>
    <div className="field"><label>Ad soyad</label><input name="name" required/></div>
    <div className="field"><label>E-posta</label><input name="email" type="email" required/></div>
    <div className="field"><label>Şifre</label><input name="password" type="password" minLength={8} required/></div>
    <button className="btn" type="submit">Koç Hesabı Oluştur</button><Message value={msg}/>
  </form>;
}
