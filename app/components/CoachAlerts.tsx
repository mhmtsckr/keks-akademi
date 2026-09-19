'use client';
import { useEffect,useState } from 'react';

export function CoachAlerts({studentId}:{studentId:string}){
 const [data,setData]=useState<any>(null);
 async function load(){const r=await fetch('/api/coach/students/'+studentId+'/alerts');const j=await r.json();if(j.ok)setData(j.insights)}
 useEffect(()=>{load()},[]);
 async function resolve(id:string){await fetch('/api/coach/students/'+studentId+'/alerts',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({alertId:id,resolved:true})});load()}
 if(!data) return <div className="card"><h2>Koç Uyarıları</h2><p className="muted">Analiz hazırlanıyor…</p></div>;
 return <div className="card"><h2>Koç Uyarıları</h2>{data.alerts.length===0?<p className="muted">Açık uyarı yok.</p>:data.alerts.map((a:any)=><div key={a.id} className={'notice '+(a.severity==='HIGH'?'error':'')} style={{marginBottom:10}}><strong>{a.title}</strong><p>{a.message}</p><button className="btn" onClick={()=>resolve(a.id)}>Çözüldü Olarak İşaretle</button></div>)}<h3>Önerilen Sonraki Adım</h3><p>{data.suggestion}</p></div>;
}
