'use client';

import { FormEvent, useState } from 'react';

export function CoachActions() {
  const [msg,setMsg]=useState('');
  async function create(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg('');
    const fd=new FormData(e.currentTarget);
    const r=await fetch('/api/coach/students',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({fullName:fd.get('fullName'),gradeLevel:fd.get('gradeLevel')})});
    const j=await r.json();
    if(!r.ok) return setMsg('Hata: '+(j.error||'Öğrenci oluşturulamadı.'));
    setMsg(`Öğrenci oluşturuldu. Kod: ${j.student.studentCode} · Giriş anahtarı: ${j.accessKey}`);
    e.currentTarget.reset();
  }
  return <div className="card coachCreateCard">
    <div className="moduleEyebrow">YENİ KAYIT</div>
    <div className="moduleHeaderRow"><div><h3>Öğrenci Ekle</h3><p className="muted">Yeni öğrenciyi koç hesabına bağlayın.</p></div><span className="moduleIcon">＋</span></div>
    <form className="form" onSubmit={create}>
      <div className="field"><label>Ad soyad</label><input name="fullName" required/></div>
      <div className="field"><label>Sınıf / sınav grubu</label><input name="gradeLevel" placeholder="Örn. 11. Sınıf / YKS"/></div>
      <button className="btn primary">Öğrenci Oluştur</button>
      {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}
    </form>
  </div>;
}
