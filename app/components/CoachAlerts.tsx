'use client';
import { useEffect,useState } from 'react';

export function CoachAlerts({studentId}:{studentId:string}){
 const [data,setData]=useState<any>(null);
 async function load(){const r=await fetch('/api/coach/students/'+studentId+'/alerts');const j=await r.json();if(j.ok)setData(j.insights)}
 useEffect(()=>{load()},[]);
 async function resolve(id:string){await fetch('/api/coach/students/'+studentId+'/alerts',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({alertId:id,resolved:true})});load()}
 if(!data) return <div className="card coachAlertCard"><div className="moduleEyebrow">KOÇ UYARILARI</div><h2>Analiz hazırlanıyor…</h2></div>;
 return <div className="card coachAlertCard">
   <div className="moduleHeaderRow"><div><div className="moduleEyebrow">MÜDAHALE MERKEZİ</div><h2>Koç Uyarıları</h2></div><span className="moduleIcon">!</span></div>
   {data.alerts.length===0?<div className="coachAllClear"><strong>Açık uyarı yok</strong><span>Öğrencinin mevcut verilerinde acil müdahale gerektiren durum görünmüyor.</span></div>:<div className="coachAlertList">{data.alerts.map((a:any)=><div key={a.id} className={'coachAlertItem '+(a.severity==='HIGH'?'high':'medium')}><div><strong>{a.title}</strong><p>{a.message}</p></div><button className="btn" onClick={()=>resolve(a.id)}>Çözüldü</button></div>)}</div>}
   <div className="coachNextStep"><span>ÖNERİLEN SONRAKİ ADIM</span><p>{data.suggestion}</p></div>
 </div>;
}
