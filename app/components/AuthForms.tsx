'use client';

import { FormEvent, useEffect, useState } from 'react';

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
    const form=e.currentTarget;
    const fd=new FormData(form);
    const r=await fetch('/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:fd.get('name'),email:fd.get('email'),password:fd.get('password')})});
    const j=await r.json();
    if(!r.ok) return setMsg('Hata: '+(j.error||'Kayıt başarısız.'));
    form.reset(); setMsg('Koç hesabı oluşturuldu. Yönetici onayından sonra giriş yapabilirsiniz.');
  }
  return <form className="form" onSubmit={submit}>
    <div className="field"><label>Ad soyad</label><input name="name" required/></div>
    <div className="field"><label>E-posta</label><input name="email" type="email" required/></div>
    <div className="field"><label>Şifre</label><input name="password" type="password" minLength={8} required/></div>
    <button className="btn" type="submit">Koç Hesabı Oluştur</button><Message value={msg}/>
  </form>;
}


export function StudentRegisterForm() {
  const [msg,setMsg]=useState('');
  const [coaches,setCoaches]=useState<Array<{id:string;name:string;studentCount:number}>>([]);
  const [loadingCoaches,setLoadingCoaches]=useState(true);

  async function loadCoaches(){
    setLoadingCoaches(true);
    try{
      const r=await fetch('/api/public/coaches');
      const j=await r.json();
      if(r.ok&&j.ok)setCoaches(j.coaches||[]);
    }catch{
      // Ag hatasi yakalanmazsa yakalanmamis promise reddi olusuyordu.
      // Liste bos kalir; kullaniciya formda sebebi aciklanir.
      setCoaches([]);
    }finally{setLoadingCoaches(false)}
  }

  useEffect(()=>{void loadCoaches()},[]);

  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg('');
    const form=e.currentTarget;
    const fd=new FormData(form);
    const r=await fetch('/api/auth/student-register',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        fullName:fd.get('fullName'),
        email:fd.get('email'),
        gradeLevel:fd.get('gradeLevel'),
        coachId:fd.get('coachId')
      })
    });
    const j=await r.json();
    if(!r.ok) return setMsg('Hata: '+(j.error||'Başvuru oluşturulamadı.'));
    form.reset();
    setMsg(j.message||'Başvurunuz alınmıştır. Giriş bilgileriniz Gmail adresinize gönderildi.');
  }

  return <form className="form" onSubmit={submit}>
    <div className="field"><label>Ad soyad</label><input name="fullName" required/></div>
    <div className="field"><label>Gmail adresi</label><input name="email" type="email" placeholder="ornek@gmail.com" required/></div>
    <div className="field"><label>Eğitim düzeyi / sınav grubu</label><input name="gradeLevel" placeholder="Örn. 11. Sınıf / YKS, Mezun / KPSS" required/></div>
    <div className="field"><label>Koçunu seç</label><select name="coachId" required defaultValue="">
      <option value="">{loadingCoaches?'Koçlar yükleniyor…':coaches.length?'Koç seçiniz':'Aktif koç yok'}</option>
      {coaches.map(c=><option value={c.id} key={c.id}>{c.name} · {c.studentCount} öğrenci</option>)}
    </select></div>
    {!loadingCoaches&&coaches.length===0&&<div className="notice error" role="alert">Şu anda başvuruya açık koç bulunmuyor. Lütfen daha sonra tekrar deneyin.</div>}
    <div className="notice">Başvurunuz tamamlandığında öğrenci kodunuz ve özel giriş anahtarınız yalnızca bu Gmail adresine gönderilir. Seçtiğiniz koçun “Öğrencilerim” paneline otomatik eklenirsiniz.</div>
    <button className="btn" type="submit" disabled={loadingCoaches||coaches.length===0}>Başvuruyu Gönder</button>
    <Message value={msg}/>
  </form>;
}

export function ParentLoginForm() {
  const [msg,setMsg]=useState('');
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg('');
    const fd=new FormData(e.currentTarget);
    const r=await fetch('/api/auth/parent-login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({studentCode:fd.get('studentCode'),parentCode:fd.get('parentCode')})});
    const j=await r.json();
    if(!r.ok) return setMsg('Hata: '+(j.error||'Giriş başarısız.'));
    location.href='/veli';
  }
  return <form className="form" onSubmit={submit}>
    <div className="field"><label>Öğrenci kodu</label><input name="studentCode" required/></div>
    <div className="field"><label>KEKS Akademi veli giriş kodu</label><input name="parentCode" type="password" required/></div>
    <button className="btn primary" type="submit">Veli Girişi</button><Message value={msg}/>
  </form>;
}
