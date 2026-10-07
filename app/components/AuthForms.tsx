'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ADULT_EXAM_GROUPS, AGS_OABT_FIELDS } from '@/lib/agsExamOptions';
import { passwordPolicyErrors } from '@/lib/passwordPolicy';
import { EDUCATION_LEVEL_OPTIONS } from '@/lib/educationLevels';
import { recommendedStudentPlanForEducationLevel } from '@/lib/subscriptionPlans';
import { educationLevelKey } from '@/lib/educationLevelProfile';

function Message({value}:{value:string}) {
  if (!value) return null;
  const bad = value.startsWith('Hata:');
  return <div className={`notice ${bad ? 'error' : ''}`}>{value}</div>;
}

function PasswordRules({password}:{password:string}){
  const errors=password?passwordPolicyErrors(password):[];
  return <div className="notice">
    <strong>Güçlü şifre kuralları</strong>
    <div className="muted">En az 12 karakter; 16+ önerilir. Büyük harf, küçük harf, rakam ve özel karakter zorunludur. 123456, qwerty, asdfgh, 112233 ve ardışık dizilimler kullanılamaz.</div>
    {password&&<div style={{marginTop:6}}>{errors.length?errors.map(x=><div key={x}>• {x}</div>):<strong>Şifre kurallara uygun.</strong>}</div>}
  </div>;
}

function PasswordResetForm({role,onClose}:{role:'STUDENT'|'COACH';onClose:()=>void}){
  const [stage,setStage]=useState<'request'|'confirm'>('request');
  const [challenge,setChallenge]=useState('');
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);
  const [newPassword,setNewPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false);

  async function requestCode(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMsg('');
    const fd=new FormData(e.currentTarget);
    try{
      const r=await fetch('/api/auth/password-reset/request',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          role,
          email:fd.get('email'),
          studentCode:role==='STUDENT'?fd.get('studentCode'):undefined,
          fullName:role==='COACH'?fd.get('fullName'):undefined
        })
      });
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'Doğrulama kodu gönderilemedi.'));
      setMsg(j.message||'Bilgiler eşleşirse doğrulama kodu e-posta adresinize gönderilir.');
      if(j.sent&&j.challenge){setChallenge(j.challenge);setStage('confirm')}
    }finally{setBusy(false)}
  }

  async function confirmReset(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMsg('');
    const fd=new FormData(e.currentTarget);
    const errors=passwordPolicyErrors(newPassword);
    if(errors.length){setBusy(false);return setMsg('Hata: '+errors[0])}
    if(newPassword!==String(fd.get('passwordConfirm')||'')){setBusy(false);return setMsg('Hata: Şifreler eşleşmiyor.')}
    try{
      const r=await fetch('/api/auth/password-reset/confirm',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({challenge,code:fd.get('code'),password:newPassword})
      });
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'Şifre yenilenemedi.'));
      setMsg(j.message||'Şifreniz yenilendi.');
      setStage('request');setChallenge('');setNewPassword('');
    }finally{setBusy(false)}
  }

  return <div className="card form">
    <div className="moduleEyebrow">ŞİFRE YENİLEME</div>
    <h3>Şifremi unuttum</h3>
    {stage==='request'?<form className="form" onSubmit={requestCode}>
      <div className="field"><label>Kayıtlı e-posta</label><input name="email" type="email" required autoComplete="email"/></div>
      {role==='STUDENT'
        ?<div className="field"><label>Öğrenci kodu</label><input name="studentCode" required/></div>
        :<div className="field"><label>Ad soyad</label><input name="fullName" required autoComplete="name"/></div>}
      <button className="btn primary" type="submit" disabled={busy}>{busy?'Doğrulanıyor…':'Bilgileri Doğrula ve Kod Gönder'}</button>
    </form>:<form className="form" onSubmit={confirmReset}>
      <div className="field"><label>E-postadaki 6 haneli kod</label><input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code"/></div>
      <div className="field"><label>Yeni şifre</label><input name="password" type={showPassword?'text':'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)} required autoComplete="new-password"/></div>
      <div className="field"><label>Yeni şifre tekrar</label><input name="passwordConfirm" type={showPassword?'text':'password'} required autoComplete="new-password"/></div>
      <label className="row" style={{justifyContent:'flex-start',gap:8}}><input type="checkbox" checked={showPassword} onChange={e=>setShowPassword(e.target.checked)}/><span>Şifreyi göster</span></label>
      <PasswordRules password={newPassword}/>
      <button className="btn primary" type="submit" disabled={busy}>{busy?'Kaydediliyor…':'Yeni Şifreyi Kaydet'}</button>
      <button className="btn" type="button" onClick={()=>{setStage('request');setChallenge('');setMsg('')}}>Yeni Kod İste</button>
    </form>}
    <button className="btn" type="button" onClick={onClose}>Giriş ekranına dön</button>
    <Message value={msg}/>
  </div>;
}

function EmailVerificationForm({email,role,challenge:initialChallenge,onVerified,onCancel}:{email:string;role:'STUDENT'|'COACH';challenge:string|null;onVerified:(result:any)=>void;onCancel:()=>void}){
  const [challenge,setChallenge]=useState(initialChallenge||'');
  const [code,setCode]=useState('');
  const [msg,setMsg]=useState(initialChallenge?'Doğrulama kodu e-posta adresinize gönderildi.':'Yeni doğrulama kodu isteyin.');
  const [busy,setBusy]=useState(false);

  async function verify(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMsg('');
    try{
      if(!challenge)return setMsg('Hata: Önce doğrulama kodu isteyin.');
      const r=await fetch('/api/auth/email-verification/confirm',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({challenge,code})});
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'E-posta doğrulanamadı.'));
      setMsg(j.message||'E-posta doğrulandı.');
      onVerified(j);
    }finally{setBusy(false)}
  }

  async function resend(){
    setBusy(true);setMsg('');
    try{
      const r=await fetch('/api/auth/email-verification/resend',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,role})});
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'Yeni kod gönderilemedi.'));
      if(j.challenge)setChallenge(j.challenge);
      setMsg(j.message||'Yeni kod gönderildi.');
    }finally{setBusy(false)}
  }

  return <div className="card form">
    <div className="moduleEyebrow">E-POSTA DOĞRULAMA</div>
    <h3>{email}</h3>
    <p className="muted">Kaydı tamamlamak için e-postanıza gönderilen 6 haneli kodu girin. Kod 10 dakika geçerlidir ve 5 hatalı denemeden sonra iptal edilir.</p>
    <form className="form" onSubmit={verify}>
      <div className="field"><label>6 haneli kod</label><input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" pattern="[0-9]{6}" required autoComplete="one-time-code"/></div>
      <button className="btn primary" type="submit" disabled={busy||challenge.length<20}>{busy?'Doğrulanıyor…':'E-postayı Doğrula'}</button>
    </form>
    <button className="btn" type="button" onClick={resend} disabled={busy}>Yeni Kod Gönder</button>
    <button className="btn" type="button" onClick={onCancel}>Kayıt formuna dön</button>
    <Message value={msg}/>
  </div>;
}

function AdminTwoFactorForm({challenge,onCancel}:{challenge:string;onCancel:()=>void}){
  const [code,setCode]=useState('');
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMsg('');
    try{
      const r=await fetch('/api/auth/admin-2fa/confirm',{method:'POST',credentials:'include',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({challenge,code})});
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'2FA doğrulanamadı.'));
      location.replace('/yonetici');
    }finally{setBusy(false)}
  }
  return <div className="card form">
    <div className="moduleEyebrow">YÖNETİCİ 2FA</div>
    <h3>İkinci adım doğrulaması</h3>
    <p className="muted">Yönetici e-posta adresine gönderilen 6 haneli kodu girin.</p>
    <form className="form" onSubmit={submit}>
      <div className="field"><label>6 haneli kod</label><input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" pattern="[0-9]{6}" required autoComplete="one-time-code"/></div>
      <button className="btn primary" type="submit" disabled={busy}>{busy?'Doğrulanıyor…':'Yönetici Girişini Tamamla'}</button>
    </form>
    <button className="btn" type="button" onClick={onCancel}>Girişe dön</button>
    <Message value={msg}/>
  </div>;
}

export function StudentLoginForm() {
  const [msg,setMsg]=useState('');
  const [remember,setRemember]=useState(false);
  const [forgotOpen,setForgotOpen]=useState(false);
  if(forgotOpen)return <PasswordResetForm role="STUDENT" onClose={()=>setForgotOpen(false)}/>;

  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setMsg('');
    const fd=new FormData(e.currentTarget);
    const r=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:fd.get('email'),password:fd.get('password'),remember})});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Giriş başarısız.'));
    if(j.role!=='STUDENT')return setMsg('Hata: Bu hesap öğrenci hesabı değil.');
    location.href='/ogrenci';
  }
  return <form className="form" onSubmit={submit}>
    <div className="field"><label>E-posta</label><input name="email" type="email" required autoComplete="email"/></div>
    <div className="field"><label>Şifre</label><input name="password" type="password" required autoComplete="current-password"/></div>
    <label className="row" style={{justifyContent:'flex-start',gap:8,cursor:'pointer'}}><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span>Bunu hatırla <small className="muted">· Bu cihazdaki oturum 30 güne kadar açık kalır.</small></span></label>
    <button className="btn primary" type="submit">Öğrenci Girişi</button>
    <button className="btn" type="button" onClick={()=>setForgotOpen(true)}>Şifremi unuttum</button>
    <Message value={msg}/>
  </form>;
}

export function AccountLoginForm({redirect='/koc'}:{redirect?:string}) {
  const [msg,setMsg]=useState('');
  const [remember,setRemember]=useState(false);
  const [forgotOpen,setForgotOpen]=useState(false);
  const [twoFactorChallenge,setTwoFactorChallenge]=useState('');
  if(forgotOpen)return <PasswordResetForm role="COACH" onClose={()=>setForgotOpen(false)}/>;
  if(twoFactorChallenge)return <AdminTwoFactorForm challenge={twoFactorChallenge} onCancel={()=>{setTwoFactorChallenge('');setMsg('')}}/>;

  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setMsg('');
    const fd=new FormData(e.currentTarget);
    const r=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:fd.get('email'),password:fd.get('password'),remember})});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Giriş başarısız.'));
    if(j.requiresTwoFactor&&j.challenge){setTwoFactorChallenge(j.challenge);return}
    if(j.role==='ADMIN')location.href='/yonetici';
    else if(j.role==='COACH')location.href=redirect;
    else if(j.role==='STUDENT')location.href='/ogrenci';
    else location.href='/veli';
  }
  return <form className="form" onSubmit={submit}>
    <div className="field"><label>E-posta</label><input name="email" type="email" required autoComplete="email"/></div>
    <div className="field"><label>Şifre</label><input name="password" type="password" required autoComplete="current-password"/></div>
    <label className="row" style={{justifyContent:'flex-start',gap:8,cursor:'pointer'}}><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span>Bunu hatırla <small className="muted">· Bu cihazdaki oturum 30 güne kadar açık kalır.</small></span></label>
    <button className="btn primary" type="submit">Giriş Yap</button>
    <button className="btn" type="button" onClick={()=>setForgotOpen(true)}>Şifremi unuttum</button>
    <Message value={msg}/>
  </form>;
}

export function CoachRegisterForm() {
  const [msg,setMsg]=useState('');
  const [password,setPassword]=useState('');
  const [verification,setVerification]=useState<{email:string;challenge:string|null}|null>(null);
  if(verification)return <EmailVerificationForm email={verification.email} role="COACH" challenge={verification.challenge} onCancel={()=>setVerification(null)} onVerified={j=>{setVerification(null);setMsg(j.message||'E-posta doğrulandı. Yönetici onayı bekleniyor.')}}/>;

  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setMsg('');
    const errors=passwordPolicyErrors(password);
    if(errors.length)return setMsg('Hata: '+errors[0]);
    const form=e.currentTarget;const fd=new FormData(form);
    if(password!==String(fd.get('passwordConfirm')||''))return setMsg('Hata: Şifreler eşleşmiyor.');
    const email=String(fd.get('email')||'');
    const r=await fetch('/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:fd.get('name'),email,password})});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Kayıt başarısız.'));
    if(j.verificationRequired){setVerification({email:j.email||email,challenge:j.verificationChallenge||null});return}
    form.reset();setPassword('');setMsg(j.message||'Koç hesabı oluşturuldu.');
  }
  return <form className="form" onSubmit={submit}>
    <div className="field"><label>Ad soyad</label><input name="name" required autoComplete="name"/></div>
    <div className="field"><label>E-posta</label><input name="email" type="email" required autoComplete="email"/></div>
    <div className="field"><label>Şifre</label><input name="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={12} required autoComplete="new-password"/></div>
    <div className="field"><label>Şifre tekrar</label><input name="passwordConfirm" type="password" minLength={12} required autoComplete="new-password"/></div>
    <PasswordRules password={password}/>
    <button className="btn" type="submit">Koç Hesabı Oluştur</button><Message value={msg}/>
  </form>;
}

export function StudentRegisterForm() {
  const [msg,setMsg]=useState('');
  const [gradeLevel,setGradeLevel]=useState('');
  const [academicTrack,setAcademicTrack]=useState('');
  const [coachId,setCoachId]=useState('');
  const [coachOptions,setCoachOptions]=useState<any[]>([]);
  const [coachLoading,setCoachLoading]=useState(false);
  const [password,setPassword]=useState('');
  const [verification,setVerification]=useState<{email:string;challenge:string|null}|null>(null);
  const isAgsOabt=gradeLevel==='AGS/ÖABT';
  const isAgsYds=gradeLevel==='AGS/YDS';
  const levelKey=educationLevelKey(gradeLevel);
  const isYksTrack=['HIGH_11','HIGH_12','GRADUATE_YKS'].includes(levelKey||'');
  const recommendedPlan=recommendedStudentPlanForEducationLevel(gradeLevel);

  useEffect(()=>{
    if(!gradeLevel){setCoachOptions([]);setCoachId('');return}
    if((isAgsOabt||isYksTrack)&&!academicTrack){setCoachOptions([]);setCoachId('');return}
    const controller=new AbortController();
    const effectiveTrack=isAgsYds?'YDS':academicTrack;
    const query=new URLSearchParams({gradeLevel});
    if(effectiveTrack)query.set('academicTrack',effectiveTrack);
    setCoachLoading(true);
    fetch('/api/public/coaches?'+query.toString(),{signal:controller.signal,cache:'no-store'})
      .then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'Koçlar yüklenemedi.');setCoachOptions(j.coaches||[]);})
      .catch(e=>{if(e?.name!=='AbortError')setCoachOptions([]);})
      .finally(()=>setCoachLoading(false));
    return ()=>controller.abort();
  },[gradeLevel,academicTrack,isAgsOabt,isAgsYds,isYksTrack]);

  if(verification)return <EmailVerificationForm email={verification.email} role="STUDENT" challenge={verification.challenge} onCancel={()=>setVerification(null)} onVerified={()=>{location.href='/ogrenci'}}/>;

  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setMsg('');
    const errors=passwordPolicyErrors(password);
    if(errors.length)return setMsg('Hata: '+errors[0]);
    const form=e.currentTarget;const fd=new FormData(form);
    if(password!==String(fd.get('passwordConfirm')||''))return setMsg('Hata: Şifreler eşleşmiyor.');
    const email=String(fd.get('email')||'');
    const r=await fetch('/api/auth/student-register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
      fullName:fd.get('fullName'),email,gradeLevel:fd.get('gradeLevel'),
      academicTrack:isAgsYds?'YDS':(academicTrack||null),coachId:coachId||null,password
    })});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Başvuru oluşturulamadı.'));
    if(j.verificationRequired){setVerification({email:j.email||email,challenge:j.verificationChallenge||null});return}
    form.reset();setGradeLevel('');setAcademicTrack('');setCoachId('');setCoachOptions([]);setPassword('');setMsg(j.message||'Kaydınız tamamlandı.');
  }

  return <form className="form" onSubmit={submit}>
    <div className="field"><label>Ad soyad</label><input name="fullName" required autoComplete="name"/></div>
    <div className="field"><label>Gmail adresi</label><input name="email" type="email" placeholder="ornek@gmail.com" required autoComplete="email"/></div>
    <div className="field"><label>Şifre</label><input name="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={12} required autoComplete="new-password"/></div>
    <div className="field"><label>Şifre tekrar</label><input name="passwordConfirm" type="password" minLength={12} required autoComplete="new-password"/></div>
    <PasswordRules password={password}/>
    <div className="field"><label>Eğitim düzeyi / sınav grubu</label><select name="gradeLevel" required value={gradeLevel} onChange={e=>{setGradeLevel(e.target.value);setAcademicTrack('');setCoachId('')}}>
      <option value="">Seçiniz</option>
      <optgroup label="Eğitim Düzeyi">
        {EDUCATION_LEVEL_OPTIONS.map(level=><option key={level} value={level}>{level}</option>)}
      </optgroup>
      <optgroup label="Sınav Grubu">{ADULT_EXAM_GROUPS.map(group=><option key={group} value={group}>{group}</option>)}</optgroup>
    </select><small className="muted">AGS/ÖABT seçildiğinde alan seçimi zorunludur.</small></div>
    {recommendedPlan&&<div className="notice"><strong>Bu düzey için önerilen KEKS paketi: {recommendedPlan.name}</strong><div className="muted">{recommendedPlan.level} profili; ders, soru tipi, çalışma yükü, rapor ve paket önerisini otomatik belirler.</div></div>}
    {isAgsOabt&&<div className="field agsBranchField"><label>ÖABT alanı</label><select name="academicTrack" required value={academicTrack} onChange={e=>{setAcademicTrack(e.target.value);setCoachId('')}}><option value="">Alanınızı seçiniz</option>{AGS_OABT_FIELDS.map(field=><option key={field} value={field}>{field}</option>)}</select><small className="muted">Seçtiğiniz alan kayıt tamamlandığında otomatik olarak onaylanır ve kilitlenir.</small></div>}
    {isAgsYds&&<div className="notice"><strong>AGS/YDS çalışma grubu</strong><div className="muted">Alan bilgisi otomatik YDS olarak kaydedilir.</div></div>}
    {isYksTrack&&<div className="field"><label>Alan</label><select value={academicTrack} onChange={e=>{setAcademicTrack(e.target.value);setCoachId('')}} required>
      <option value="">Alan seçiniz</option><option value="SAYISAL">Sayısal</option><option value="EŞİT AĞIRLIK">Eşit Ağırlık</option><option value="SÖZEL">Sözel</option><option value="DİL">Dil</option>
    </select><small className="muted">Partner Koç eşleştirmesi alan uzmanlığını da kullanır.</small></div>}
    {gradeLevel&&(!isAgsOabt||academicTrack)&&(!isYksTrack||academicTrack)&&<div className="notice">
      <strong>KEKS Partner Koç önerileri</strong>
      <div className="muted">Eğitim düzeyi, uzmanlık, açık kapasite ve son 30 günlük operasyon kalitesine göre sıralanır.</div>
      {coachLoading?<p>Uygun koçlar hesaplanıyor…</p>:coachOptions.length===0?<p>Şu anda bu profil için açık kontenjanlı Partner Koç bulunmuyor. Koç seçimini başlangıç sihirbazında tekrar deneyebilirsiniz.</p>:<div className="stack" style={{marginTop:10}}>
        {coachOptions.slice(0,3).map((coach:any,index:number)=><button type="button" key={coach.id} className={coachId===coach.id?'btn primary':'btn'} style={{textAlign:'left'}} onClick={()=>setCoachId(coach.id)}>
          <strong>{index===0?'Önerilen · ':''}{coach.name}</strong>{coach.displayTitle?' · '+coach.displayTitle:''}
          <div className="muted">{coach.fitReasons?.[0]||'Eğitim profilinizle eşleşiyor.'} · {coach.availableSlots} kontenjan</div>
          <small>Yanıt: {coach.responseHours==null?'veri birikiyor':coach.responseHours+' sa medyan'} · Görüşme: {coach.sessionCompletionRate==null?'veri birikiyor':'%'+coach.sessionCompletionRate}</small>
        </button>)}
      </div>}
    </div>}
    <div className="notice"><strong>Koç seçimi zorunlu değil.</strong><div className="muted">Burada önerilen Partner Koçu seçebilir veya e-posta doğrulamasından sonraki başlangıç sihirbazında eşleşmeni yeniden değerlendirebilirsin.</div></div>
    <div className="notice">Kayıt sırası: <strong>Bilgiler → e-posta doğrulama → ilk giriş sihirbazı → İlk 7 Günlük Başlangıç Planı</strong>.</div>
    <button className="btn" type="submit">Kaydı Başlat</button>
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
