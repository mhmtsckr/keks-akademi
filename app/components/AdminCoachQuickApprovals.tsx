'use client';

import { useEffect,useState } from 'react';

function ageLabel(value:string){
  const ms=Date.now()-new Date(value).getTime();
  const minutes=Math.max(0,Math.floor(ms/60000));
  if(minutes<60)return minutes+' dk önce';
  const hours=Math.floor(minutes/60);
  if(hours<24)return hours+' sa önce';
  return Math.floor(hours/24)+' gün önce';
}

export function AdminCoachQuickApprovals(){
  const [items,setItems]=useState<any[]>([]);
  const [busy,setBusy]=useState('');
  const [msg,setMsg]=useState('');

  async function load(){
    const r=await fetch('/api/admin/coach-approvals',{cache:'no-store'});
    const j=await r.json();
    if(r.ok)setItems(j.coaches||[]);
  }
  useEffect(()=>{void load()},[]);

  async function act(action:'APPROVE_ONE'|'APPROVE_ALL'|'SUSPEND_ONE',userId?:string){
    setBusy(action+(userId||''));setMsg('');
    try{
      const r=await fetch('/api/admin/coach-approvals',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({action,userId})
      });
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'İşlem tamamlanamadı.'));
      setMsg(j.message||'İşlem tamamlandı.');
      await load();
    }finally{setBusy('')}
  }

  return <div className="card adminCoachQuickCard">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">HIZLI KOÇ ONAYI</div>
        <h2>Bekleyen koç başvuruları</h2>
        <p className="muted">Yeni koç hesaplarını kullanıcı listesinde aramadan doğrudan buradan aktif edin.</p>
      </div>
      <div className="row">
        <span className="pill">{items.length} bekleyen</span>
        {items.length>1&&<button className="btn primary" disabled={Boolean(busy)} onClick={()=>act('APPROVE_ALL')}>{busy==='APPROVE_ALL'?'Onaylanıyor…':'Tümünü Onayla'}</button>}
      </div>
    </div>

    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}

    {items.length===0
      ? <div className="notice"><strong>Bekleyen koç başvurusu yok.</strong><div className="muted">Yeni başvuru geldiğinde burada en üstte görünecek.</div></div>
      : <div className="adminCoachQuickList">
          {items.map((c:any)=><article className="adminCoachQuickRow" key={c.id}>
            <div>
              <strong>{c.name}</strong>
              <span>{c.email||'E-posta yok'}</span>
              <small>{ageLabel(c.createdAt)} · {c.coachProfile?._count?.students||0} öğrenci</small>
            </div>
            <div className="row">
              <button className="btn primary" disabled={Boolean(busy)} onClick={()=>act('APPROVE_ONE',c.id)}>{busy==='APPROVE_ONE'+c.id?'Onaylanıyor…':'Onayla'}</button>
              <button className="btn" disabled={Boolean(busy)} onClick={()=>act('SUSPEND_ONE',c.id)}>Askıya Al</button>
            </div>
          </article>)}
        </div>}
  </div>;
}
