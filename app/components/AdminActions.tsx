'use client';

import { useEffect, useState } from 'react';

type Coach={id:string;name:string;email:string|null;status:string};
export function AdminActions(){
  const [coaches,setCoaches]=useState<Coach[]>([]); const [msg,setMsg]=useState('');
  async function load(){const r=await fetch('/api/admin/coaches');if(r.ok){const j=await r.json();setCoaches(j.coaches)}}
  useEffect(()=>{load()},[]);
  async function setStatus(id:string,status:'ACTIVE'|'SUSPENDED'){
    const r=await fetch('/api/admin/coaches',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({userId:id,status})});
    const j=await r.json(); if(!r.ok)return setMsg('Hata: '+(j.error||'İşlem başarısız.')); setMsg('Koç durumu güncellendi.'); load();
  }
  async function makeCode(){
    const r=await fetch('/api/admin/codes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({maxUses:1})});
    const j=await r.json(); if(!r.ok)return setMsg('Hata: '+(j.error||'Kod oluşturulamadı.')); setMsg('Yeni tek kullanımlık KEKS kodu: '+j.code);
  }
  return <div className="stack">
    <div className="card"><div className="row"><h3 style={{margin:0}}>KEKS Akademi Kodu</h3><button className="btn primary" onClick={makeCode}>Tek Kullanımlık Kod Oluştur</button></div>{msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`} style={{marginTop:12}}>{msg}</div>}</div>
    <div className="card"><h3>Koç Onayları</h3>{coaches.length===0?<p className="muted">Bekleyen koç hesabı yok.</p>:<table className="table"><thead><tr><th>Koç</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>{coaches.map(c=><tr key={c.id}><td>{c.name}<div className="muted">{c.email}</div></td><td>{c.status}</td><td className="row"><button className="btn" onClick={()=>setStatus(c.id,'ACTIVE')}>Aktif Et</button><button className="btn danger" onClick={()=>setStatus(c.id,'SUSPENDED')}>Durdur</button></td></tr>)}</tbody></table>}</div>
  </div>;
}
