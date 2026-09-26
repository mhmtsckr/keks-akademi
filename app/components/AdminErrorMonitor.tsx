'use client';

import {useEffect,useState} from 'react';

type ApiErrorRow={
  id:string;
  requestId:string;
  endpoint:string;
  method:string;
  errorClass:string;
  errorCode:string|null;
  environment:string|null;
  deployment:string|null;
  createdAt:string;
};

export function AdminErrorMonitor(){
  const [errors,setErrors]=useState<ApiErrorRow[]>([]);
  const [q,setQ]=useState('');
  const [msg,setMsg]=useState('');
  const [loading,setLoading]=useState(false);

  async function load(){
    const p=new URLSearchParams();
    if(q.trim())p.set('q',q.trim());
    setLoading(true);
    setMsg('');
    try{
      const r=await fetch('/api/admin/errors?'+p.toString(),{cache:'no-store'});
      const j=await r.json();
      if(!r.ok){
        setMsg('Hata: '+(j.error||'Hata kayıtları yüklenemedi.'));
        return;
      }
      setErrors(j.errors||[]);
    }catch{
      setMsg('Hata: Hata kayıtları yüklenemedi.');
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{void load()},[]);

  return <div className="card" style={{marginBottom:16}}>
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">PRODUCTION HATA İZLEME</div>
        <h3>API 500 Hata Merkezi</h3>
        <p className="muted">Endpoint, tarih, request ID ve hata sınıfı korelasyon için tutulur. İstek gövdesi, hata mesajı/stack, şifre, token, cookie ve doğrulama kodu kaydedilmez.</p>
      </div>
      <div className="row">
        <span className="pill">{errors.length} kayıt</span>
        <button className="btn" onClick={load} disabled={loading}>{loading?'Yükleniyor…':'Yenile'}</button>
      </div>
    </div>

    <div className="row" style={{marginBottom:12}}>
      <input
        value={q}
        onChange={e=>setQ(e.target.value)}
        onKeyDown={e=>{if(e.key==='Enter')void load()}}
        placeholder="Endpoint, request ID veya hata sınıfı"
      />
      <button className="btn primary" onClick={load} disabled={loading}>Ara</button>
    </div>

    {errors.length===0&&!loading
      ?<p className="muted">Kayıtlı API 500 hatası yok.</p>
      :<div className="adminAuditList">{errors.map(x=><div className="adminAuditRow" key={x.id}>
        <span className="adminAuditDot"/>
        <div style={{minWidth:0}}>
          <strong>{x.method} {x.endpoint} · {x.errorClass}{x.errorCode?' · '+x.errorCode:''}</strong>
          <span>
            {new Date(x.createdAt).toLocaleString('tr-TR')} · Request ID: <code>{x.requestId}</code>
            {x.environment?' · '+x.environment:''}
            {x.deployment?' · Deploy '+x.deployment:''}
          </span>
        </div>
      </div>)}</div>
    }
    {msg&&<div className="notice error">{msg}</div>}
  </div>;
}
