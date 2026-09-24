'use client';

import { FormEvent,useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';
import { AGS_OABT_FIELDS } from '@/lib/agsExamOptions';

export function StudentOabtFieldApproval(){
  const router=useRouter();
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  async function load(){
    try{
      const r=await fetch('/api/student/oabt-field',{cache:'no-store'});
      const j=await r.json();
      if(r.ok)setData(j);
    }catch{}
  }

  useEffect(()=>{void load()},[]);

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMsg('');
    const fd=new FormData(e.currentTarget);
    try{
      const r=await fetch('/api/student/oabt-field',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({field:fd.get('field')})
      });
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'Alan kaydedilemedi.'));
      setMsg(j.message||'Alanınız kaydedildi.');
      await load();
      router.refresh();
    }finally{setBusy(false)}
  }

  if(!data)return <div className="card"><p className="muted">ÖABT alan bilgisi yükleniyor…</p></div>;
  if(!data.applicable)return null;

  const field=data.field||data.approvedField;
  if(field){
    return <div className="card oabtApprovalCard approved">
      <div className="moduleHeaderRow">
        <div>
          <div className="moduleEyebrow">AGS/ÖABT · ALAN</div>
          <h2>AGS/ÖABT- {field}</h2>
          <p className="muted">Alanınız kayıt bilgileriniz doğrultusunda otomatik olarak profilinize işlenmiştir. Yönetici onayı gerekmez.</p>
        </div>
        <span className="adminStatus active">KİLİTLİ</span>
      </div>
      <div className="oabtApprovedField"><span>Alan</span><strong>{field}</strong></div>
    </div>;
  }

  return <div className="card oabtApprovalCard">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">AGS/ÖABT · ALAN SEÇİMİ</div>
        <h2>ÖABT alanınızı seçin</h2>
        <p className="muted">Alanınızı kaydettiğiniz anda profiliniz “AGS/ÖABT- ALAN ADI” biçiminde güncellenir. Yönetici onayı yoktur.</p>
      </div>
      <span className="pill">TEK SEFERLİK</span>
    </div>
    <form className="form oabtApprovalForm" onSubmit={submit}>
      <div className="field">
        <label>ÖABT alanı</label>
        <select name="field" required defaultValue="">
          <option value="">Alanınızı seçiniz</option>
          {AGS_OABT_FIELDS.map(x=><option key={x} value={x}>{x}</option>)}
        </select>
      </div>
      <button className="btn primary" disabled={busy}>{busy?'Kaydediliyor…':'Alanı Kaydet ve Kilitle'}</button>
    </form>
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
  </div>;
}
