'use client';
import {FormEvent,useEffect,useState} from 'react';
type Assignment={id:string;createdAt:string;status:'ASSIGNED'|'DONE';subject:string;grade:number;
 criterionLabel:string;assignment:string;expectedEvidence:string;minutes:number;
 coachNote:string;reflection:string|null;completedAt:string|null};
export function StudentRubricActions(){
 const [rows,setRows]=useState<Assignment[]>([]);
 const [busy,setBusy]=useState('');
 const [msg,setMsg]=useState('');
 async function load(){
  try{
   const r=await fetch('/api/student/performance-actions',{cache:'no-store'});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Telafi görevleri alınamadı.');
   setRows(j.assignments||[]);
  }catch(e){setMsg('Hata: '+(e instanceof Error?e.message:'Görevler alınamadı.'));}
 }
 useEffect(()=>{void load();},[]);
 async function complete(event:FormEvent<HTMLFormElement>,action:Assignment){
  event.preventDefault();setBusy(action.id);setMsg('');
  const form=new FormData(event.currentTarget);
  try{
   const r=await fetch('/api/student/performance-actions',{
    method:'PATCH',headers:{'content-type':'application/json'},
    body:JSON.stringify({
     assignmentId:action.id,
     reflection:String(form.get('reflection')||'').trim(),
     confirmedOwnWork:form.get('ownWork')==='on'
    })
   });
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Çalışman kaydedilemedi.');
   setMsg(j.message);await load();
  }catch(e){setMsg('Hata: '+(e instanceof Error?e.message:'Çalışma kaydedilemedi.'));}
  finally{setBusy('');}
 }
 const pending=rows.filter(x=>x.status==='ASSIGNED');
 const done=rows.filter(x=>x.status==='DONE');
 return <div className="card" style={{marginTop:12}}>
  <div className="moduleHeaderRow"><div>
   <div className="moduleEyebrow">KEKS · KOÇUN ATADIĞI HEDEFLİ TELAFİLER</div>
   <h2>Eksik Becerime Özel Bugünkü Çalışma</h2>
   <p className="muted">Bu çalışmalar koçun rubrikte belirlediği somut eksiklerden gelir. Soru sayısından çok neden-sonuç açıklaması ve kanıt önemlidir.</p>
  </div><span className="pill">{pending.length} bekleyen görev</span></div>
  {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
  {pending.length===0?<p className="muted">Koçun tarafından atanmış bekleyen telafi çalışması bulunmuyor.</p>:null}
  <div className="stack">
   {pending.map(action=><article key={action.id} className="card">
    <strong>{action.grade}. sınıf · {action.subject} · {action.minutes} dakikalık çalışma</strong>
    <p className="muted">Geliştirilecek beceri: {action.criterionLabel}</p>
    <p>{action.assignment}</p>
    <p><strong>Beklenen kanıt:</strong> {action.expectedEvidence}</p>
    <div className="notice"><strong>Koçunun notu:</strong> {action.coachNote}</div>
    <form className="stack" onSubmit={e=>void complete(e,action)}>
     <label className="field"><span>Ne yaptığını, nasıl yaptığını ve kendi gerekçeni yaz (en az 40 karakter)</span>
      <textarea name="reflection" rows={4} required minLength={40} maxLength={1800}
        placeholder="Bu görevi nasıl çözdüm? Kanıtım ne? Hangi noktayı geliştirdim?"/>
     </label>
     <label className="row" style={{alignItems:'center',gap:8}}>
      <input name="ownWork" type="checkbox" required/> Bu çalışma ve açıklamanın bana ait olduğunu onaylıyorum.
     </label>
     <button className="btn primary" disabled={busy===action.id}>
      {busy===action.id?'Kaydediliyor…':'Çalışmamı Tamamlandı Olarak Gönder'}
     </button>
    </form>
   </article>)}
  </div>
  {done.length>0&&<details className="card" style={{marginTop:10}}>
   <summary><strong>Tamamladığım telafi çalışmaları ({done.length})</strong></summary>
   <div className="stack">{done.map(action=><div key={action.id} className="notice">
    <strong>{action.grade}. sınıf {action.subject} · {action.criterionLabel}</strong>
    <p>{action.assignment}</p><p><strong>Benim açıklamam:</strong> {action.reflection||'—'}</p>
   </div>)}</div>
  </details>}
  <small className="muted">Tamamlandı kaydı, bilginin kalıcı öğrenildiği anlamına gelmez. Koçun yeni bir durumda tekrar ölçebilir.</small>
 </div>;
}
