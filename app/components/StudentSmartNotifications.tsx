'use client';

import {useEffect,useState} from 'react';

function kindLabel(kind:string){
  return kind==='REVIEW_DUE'?'Tekrar'
    :kind==='EXAM_STALE'?'Deneme'
    :kind==='PLAN_UPDATED'?'Program'
    :kind==='PARTIAL_TASK'?'Yarım Görev'
    :'Bildirim';
}

export function StudentSmartNotifications(){
  const [items,setItems]=useState<any[]|null>(null);
  const [busyId,setBusyId]=useState('');
  const [msg,setMsg]=useState('');

  async function load(){
    const r=await fetch('/api/student/notifications',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||'Bildirimler yüklenemedi.');setItems([]);return}
    setItems(j.notifications||[]);
    setMsg('');
  }

  useEffect(()=>{void load()},[]);

  async function acknowledge(id:string){
    setBusyId(id);setMsg('');
    try{
      const r=await fetch('/api/student/notifications',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({notificationId:id})
      });
      const j=await r.json();
      if(!r.ok&&r.status!==404){setMsg(j.error||'Bildirim güncellenemedi.');return}
      await load();
    }finally{setBusyId('')}
  }

  return <div className="card">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">AKILLI BİLDİRİMLER</div>
        <h2>Yalnız eylem gerektiren çalışma sinyalleri</h2>
        <p className="muted">KEKS her hareket için bildirim üretmez. Tekrar, ölçüm, program değişikliği ve yarım kalan görev gibi doğrudan aksiyon gerektiren durumları gösterir.</p>
      </div>
      {items&&items.length>0&&<span className="pill">{items.length} aktif</span>}
    </div>

    {msg&&<div className="notice error">{msg}</div>}
    {items===null?<p className="muted">Bildirimler kontrol ediliyor…</p>
      :items.length===0
        ?<div className="notice"><strong>Şu an eylem gerektiren yeni bildirim yok.</strong><div className="muted">Yeni bir anlamlı sinyal oluştuğunda burada görünür.</div></div>
        :<div className="stack">
          {items.slice(0,4).map(item=><article className="card" key={item.id} style={{margin:0}}>
            <div className="moduleHeaderRow">
              <div>
                <div className="moduleEyebrow">{item.priority==='HIGH'?'ÖNCELİKLİ':'BİLGİ'} · {kindLabel(item.kind)}</div>
                <strong>{item.title}</strong>
                <p className="muted">{item.message}</p>
              </div>
              <span className="pill">{item.priority==='HIGH'?'ÖNCE YAP':'KONTROL ET'}</span>
            </div>
            <div className="row" style={{justifyContent:'flex-end',flexWrap:'wrap'}}>
              <a className="btn primary" href={item.href}>İlgili Bölüme Git</a>
              <button className="btn" type="button" disabled={busyId===item.id} onClick={()=>acknowledge(item.id)}>
                {busyId===item.id?'Kaydediliyor…':'Okudum'}
              </button>
            </div>
          </article>)}
        </div>}
  </div>;
}
