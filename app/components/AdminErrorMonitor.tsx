'use client';

import {useEffect,useState} from 'react';

export function AdminErrorMonitor(){
  const [errors,setErrors]=useState<any[]>([]);
  const [q,setQ]=useState('');
  const [msg,setMsg]=useState('');

  async function load(){
    const p=new URLSearchParams();if(q.trim())p.set('q',q.trim());
    const r=await fetch('/api/admin/errors?'+p.toString(),{cache:'no-store'});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Hata kayıtları yüklenemedi.'));
    setErrors(j.errors||[]);setMsg('');
  }
  useEffect(()=>{void load()},[]);

  return <div className="card" style={{marginBottom:16}}>
    <div className="moduleHeaderRow"><div><div className="moduleEyebrow">PRODUCTION HATA İZLEME</div><h3>API 500 Hata Merkezi</h3><p className="muted">İstek gövdesi, şifre, token, cookie ve doğrulama kodu kaydedilmez. Yalnız hata sınıfı ve korelasyon bilgileri tutulur.</p></div><button className="btn" onClick={load}>Yenile</button></div>
    <div className="row" style={{marginBottom:12}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Endpoint, request ID veya hata sınıfı"/><button className="btn primary" onClick={load}>Ara</button></div>
    {errors.length===0?<p className="muted">Kayıtlı API 500 hatası yok.</p>:<div className="adminAuditList">{errors.map(x=><div className="adminAuditRow" key={x.id}>
      <span className="adminAuditDot"/>
      <div style={{minWidth:0}}>
        <strong>{x.method} {x.endpoint} · {x.errorClass}{x.errorCode?' · '+x.errorCode:''}</strong>
        <span>{new Date(x.createdAt).toLocaleString('tr-TR')} · Request ID: <code>{x.requestId}</code>{x.deployment?' · Deploy '+x.deployment:''}</span>
        {x.message&&<small className="muted">{x.message}</small>}
      </div>
    </div>)}</div>}
    {msg&&<div className="notice error">{msg}</div>}
  </div>;
}
