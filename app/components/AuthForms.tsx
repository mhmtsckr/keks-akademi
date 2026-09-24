'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ADULT_EXAM_GROUPS, AGS_OABT_FIELDS } from '@/lib/agsExamOptions';

function Message({value}:{value:string}) {
  if (!value) return null;
  const bad = value.startsWith('Hata:');
  return <div className={`notice ${bad ? 'error' : ''}`}>{value}</div>;
}

export function StudentLoginForm() {
  const [msg,setMsg]=useState('');
  const [studentCode,setStudentCode]=useState('');
  const [accessKey,setAccessKey]=useState('');
  const [remember,setRemember]=useState(false);
  const [forgotOpen,setForgotOpen]=useState(false);
  const [forgotMsg,setForgotMsg]=useState('');
  const [forgotBusy,setForgotBusy]=useState(false);

  useEffect(()=>{
    try{
      const raw=localStorage.getItem('keks.studentLogin.v1');
      if(!raw)return;
      const saved=JSON.parse(raw);
      if(typeof saved?.studentCode==='string'&&typeof saved?.accessKey==='string'){
        setStudentCode(saved.studentCode);
        setAccessKey(saved.accessKey);
        setRemember(true);
      }
    }catch{
      localStorage.removeItem('keks.studentLogin.v1');
    }
  },[]);

  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg('');
    const r=await fetch('/api/auth/student-login',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({studentCode,accessKey})
    });
    const j=await r.json();
    if(!r.ok){
      if(j.code==='ACCESS_KEY_EXPIRED'){
        try{localStorage.removeItem('keks.studentLogin.v1')}catch{}
        setAccessKey('');
        setRemember(false);
      }
      return setMsg('Hata: '+(j.error||'Giriş başarısız.'));
    }
    try{
      if(remember)localStorage.setItem('keks.studentLogin.v1',JSON.stringify({studentCode,accessKey}));
      else localStorage.removeItem('keks.studentLogin.v1');
    }catch{}
    location.href='/ogrenci';
  }

  async function forgot(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setForgotMsg('');setForgotBusy(true);
    const fd=new FormData(e.currentTarget);
    try{
      const r=await fetch('/api/auth/student-access-key',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          studentCode:fd.get('studentCode'),
          fullName:fd.get('fullName'),
          email:fd.get('email')
        })
      });
      const j=await r.json();
      if(!r.ok)setForgotMsg('Hata: '+(j.error||'Giriş anahtarı gönderilemedi.'));
      else setForgotMsg(j.message||'Giriş anahtarınız kayıtlı Gmail adresinize yeniden gönderildi.');
    }finally{setForgotBusy(false)}
  }

  return <div className="stack">
    <form className="form" onSubmit={submit}>
      <div className="field"><label>Öğrenci kodu</label><input name="studentCode" required autoComplete="username" value={studentCode} onChange={e=>setStudentCode(e.target.value)}/></div>
      <div className="field"><label>Giriş anahtarı</label><input name="accessKey" type="password" required autoComplete="current-password" value={accessKey} onChange={e=>setAccessKey(e.target.value)}/></div>
      <label className="row" style={{justifyContent:'flex-start',gap:8,cursor:'pointer'}}>
        <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/>
        <span>Beni unutma <small className="muted">· Bu cihazda öğrenci kodu ve giriş anahtarı otomatik doldurulur.</small></span>
      </label>
      <button className="btn primary" type="submit">Öğrenci Girişi</button>
      <button className="btn" type="button" onClick={()=>{setForgotOpen(v=>!v);setForgotMsg('')}}>{forgotOpen?'Geri dön':'Giriş anahtarını unuttum'}</button>
      <Message value={msg}/>
    </form>

    {forgotOpen&&<form className="form card" onSubmit={forgot}>
      <div className="moduleEyebrow">GİRİŞ ANAHTARI YENİDEN GÖNDERİMİ</div>
      <p className="muted">Bilgiler kayıtla eşleşirse ve anahtarın 1 yıllık süresi dolmamışsa mevcut giriş anahtarınız değiştirilmeden kayıtlı Gmail adresinize yeniden gönderilir.</p>
      <div className="field"><label>Öğrenci kodu</label><input name="studentCode" required defaultValue={studentCode}/></div>
      <div className="field"><label>Ad soyad</label><input name="fullName" required autoComplete="name"/></div>
      <div className="field"><label>Kayıtlı Gmail adresi</label><input name="email" type="email" required autoComplete="email"/></div>
      <button className="btn primary" type="submit" disabled={forgotBusy}>{forgotBusy?'Doğrulanıyor…':'Bilgileri Doğrula ve Anahtarı Gönder'}</button>
      <Message value={forgotMsg}/>
    </form>}
  </div>;
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
  const [gradeLevel,setGradeLevel]=useState('');
  const isAgsOabt=gradeLevel==='AGS/ÖABT';
  const isAgsYds=gradeLevel==='AGS/YDS';

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
        academicTrack:isAgsOabt?fd.get('academicTrack'):isAgsYds?'YDS':null,
        coachId:fd.get('coachId')
      })
    });
    const j=await r.json();
    if(!r.ok) return setMsg('Hata: '+(j.error||'Başvuru oluşturulamadı.'));
    form.reset();
    setGradeLevel('');
    setMsg(j.message||'Başvurunuz alınmıştır. Giriş bilgileriniz Gmail adresinize gönderildi.');
  }

  return <form className="form" onSubmit={submit}>
    <div className="field"><label>Ad soyad</label><input name="fullName" required/></div>
    <div className="field"><label>Gmail adresi</label><input name="email" type="email" placeholder="ornek@gmail.com" required/></div>
    <div className="field"><label>Eğitim düzeyi / sınav grubu</label><select name="gradeLevel" required value={gradeLevel} onChange={e=>setGradeLevel(e.target.value)}>
      <option value="">Seçiniz</option>
      <optgroup label="Eğitim Düzeyi">
        <option value="İlkokul 1-2">İlkokul 1-2</option>
        <option value="İlkokul 3-4">İlkokul 3-4</option>
        <option value="Ortaokul 5-6">Ortaokul 5-6</option>
        <option value="Ortaokul 7-8 / LGS">Ortaokul 7-8 / LGS</option>
        <option value="Lise 9-10">Lise 9-10</option>
        <option value="Lise 11-12 / YKS">Lise 11-12 / YKS</option>
        <option value="Mezun / YKS">Mezun / YKS</option>
      </optgroup>
      <optgroup label="Sınav Grubu">
        {ADULT_EXAM_GROUPS.map(group=><option key={group} value={group}>{group}</option>)}
      </optgroup>
    </select>
      <small className="muted">Sınav grupları: DGS, KPSS, EKPSS, ALES, AGS/YDS, YÖKDİL, AGS/ÖABT ve YDS. AGS/ÖABT seçildiğinde alan seçimi zorunludur.</small>
    </div>
    {isAgsOabt&&<div className="field agsBranchField">
      <label>ÖABT alanı</label>
      <select name="academicTrack" required defaultValue="">
        <option value="">Alanınızı seçiniz</option>
        {AGS_OABT_FIELDS.map(field=><option key={field} value={field}>{field}</option>)}
      </select>
      <small className="muted">Seçtiğiniz alan kayıt tamamlandığında otomatik olarak onaylanır ve kilitlenir. Öğrenci ve koç panelinde “AGS/ÖABT- ALAN ADI” biçiminde görünür.</small>
    </div>}
    {isAgsYds&&<div className="notice">
      <strong>AGS/YDS çalışma grubu</strong>
      <div className="muted">Bu grupta alan bilgisi otomatik olarak YDS şeklinde kaydedilir. ÖABT branş seçimi gösterilmez.</div>
    </div>}
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
