'use client';

import {useEffect,useState} from 'react';

type Row={
  id:string;
  role:string;
  rating:number|null;
  sanitizedComment:string|null;
  contextLabel:string;
  publishConsent:boolean;
  status:string;
  piiFlagged:boolean;
  submittedAt:string|null;
  publishedAt:string|null;
};

export function AdminTestimonials(){
  const [rows,setRows]=useState<Row[]>([]);
  const [busy,setBusy]=useState('');
  const [msg,setMsg]=useState('');

  async function load(){
    const r=await fetch('/api/admin/testimonials',{cache:'no-store'});
    const j=await r.json();
    if(r.ok)setRows(j.testimonials||[]);
    else setMsg('Hata: '+(j.error||'Yorumlar yüklenemedi.'));
  }

  useEffect(()=>{void load()},[]);

  async function update(id:string,action:'PUBLISH'|'HIDE'){
    setBusy(id+action);setMsg('');
    try{
      const r=await fetch('/api/admin/testimonials',{
        method:'PATCH',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({id,action})
      });
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Yorum güncellenemedi.'));return}
      setMsg(action==='PUBLISH'?'Anonim yorum yayınlandı.':'Yorum anasayfadan kaldırıldı.');
      await load();
    }finally{setBusy('')}
  }

  const review=rows.filter(x=>x.status==='REVIEW').length;
  const published=rows.filter(x=>x.status==='PUBLISHED').length;

  return <section className="card" style={{marginBottom:16}}>
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">GERÇEK KULLANICI YORUMLARI</div>
        <h2>Doğrulanmış sosyal kanıt akışı</h2>
        <p className="muted">30+ günlük kullanıcı yorumları. Kimlik verileri frontend’e gönderilmez; yalnız anonim bağlam ve temizlenmiş metin görünür.</p>
      </div>
      <div className="row"><span className="pill">{published} yayında</span><span className="pill">{review} incelemede</span><button className="btn" onClick={load}>Yenile</button></div>
    </div>
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    {rows.length===0?<p className="muted">Henüz 30 günü tamamlayıp yorum gönderen kullanıcı yok.</p>:<div className="stack">
      {rows.map(row=><article className="card" key={row.id}>
        <div className="moduleHeaderRow">
          <div><strong>{row.contextLabel}</strong><div className="muted">{row.rating?'★'.repeat(row.rating):'Puan yok'} · {row.role}</div></div>
          <div className="row"><span className="pill">{row.status}</span>{row.piiFlagged&&<span className="pill">KİŞİSEL BİLGİ KONTROLÜ</span>}</div>
        </div>
        <p style={{whiteSpace:'pre-wrap'}}>{row.sanitizedComment||'Yorum metni yok.'}</p>
        <div className="row" style={{gap:10,flexWrap:'wrap'}}>
          {row.publishConsent&&row.status!=='PUBLISHED'&&<button className="btn primary" disabled={Boolean(busy)} onClick={()=>update(row.id,'PUBLISH')}>İnceleyip Yayınla</button>}
          {row.status==='PUBLISHED'&&<button className="btn" disabled={Boolean(busy)} onClick={()=>update(row.id,'HIDE')}>Yayından Kaldır</button>}
          {!row.publishConsent&&<small className="muted">Kullanıcı herkese açık yayın izni vermedi.</small>}
        </div>
      </article>)}
    </div>}
  </section>;
}
