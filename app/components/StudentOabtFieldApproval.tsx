'use client';

import { FormEvent,useEffect,useState } from 'react';
import { AGS_OABT_FIELDS } from '@/lib/agsExamOptions';

export function StudentOabtFieldApproval(){
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  async function load(){
    const r=await fetch('/api/student/oabt-field',{cache:'no-store'});
    const j=await r.json();
    setData(j);
  }
  useEffect(()=>{void load()},[]);

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMsg('');
    const fd=new FormData(e.currentTarget);
    const r=await fetch('/api/student/oabt-field',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({field:fd.get('field')})
    });
    const j=await r.json();setBusy(false);
    if(!r.ok)return setMsg('Hata: '+(j.error||'Alan seçimi gönderilemedi.'));
    setMsg(j.message||'Alan seçiminiz yönetici onayına gönderildi.');
    await load();
    setTimeout(()=>location.reload(),500);
  }

  if(!data)return <div className="card"><p className="muted">ÖABT alan durumu yükleniyor…</p></div>;
  if(!data.applicable)return null;

  if(data.status==='APPROVED'){
    return <div className="card oabtApprovalCard approved">
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">AGS/ÖABT · ALAN ONAYI</div><h2>ÖABT alanınız onaylandı</h2><p className="muted">Yönetici onayından sonra bu alan kilitlenmiştir ve öğrenci tarafından değiştirilemez.</p></div>
        <span className="adminStatus active">KİLİTLİ</span>
      </div>
      <div className="oabtApprovedField"><span>Onaylı alan</span><strong>{data.approvedField}</strong></div>
      {data.approvedAt&&<small className="muted">Onay tarihi: {new Date(data.approvedAt).toLocaleString('tr-TR')}</small>}
    </div>;
  }

  if(data.status==='PENDING'){
    return <div className="card oabtApprovalCard pending">
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">AGS/ÖABT · ALAN ONAYI</div><h2>Yönetici onayı bekleniyor</h2><p className="muted">Alan seçiminiz gönderildi. Yönetici karar verene kadar yeni seçim yapılamaz.</p></div>
        <span className="pill">ONAY BEKLİYOR</span>
      </div>
      <div className="oabtApprovedField"><span>Gönderilen alan</span><strong>{data.requestedField}</strong></div>
    </div>;
  }

  return <div className="card oabtApprovalCard">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">AGS/ÖABT · ZORUNLU ALAN DOĞRULAMA</div>
        <h2>ÖABT alanınızı seçin</h2>
        <p className="muted">Mevcut eski kaydınızda bir alan görünse bile yönetici onay kaydı yoksa burada alanınızı yeniden doğrulamanız gerekir. Seçiminiz yöneticiye gönderilir; onaydan sonra alanınız kesinleşir ve artık değiştirilemez.</p>
      </div>
      <span className="pill">TEK SEFERLİK</span>
    </div>
    {data.status==='REJECTED'&&<div className="notice error"><strong>Alan seçiminiz yeniden isteniyor.</strong><div>{data.rejectionNote||'Lütfen alanınızı yeniden seçip gönderin.'}</div></div>}
    <form className="form oabtApprovalForm" onSubmit={submit}>
      <div className="field">
        <label>ÖABT alanı</label>
        <select name="field" required defaultValue="">
          <option value="">Alanınızı seçiniz</option>
          {AGS_OABT_FIELDS.map(x=><option key={x} value={x}>{x}</option>)}
        </select>
      </div>
      <button className="btn primary" disabled={busy}>{busy?'Yöneticiye gönderiliyor…':'Alanı Kaydet ve Yönetici Onayına Gönder'}</button>
    </form>
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
  </div>;
}
