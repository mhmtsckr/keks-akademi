'use client';

import {useEffect,useState} from 'react';

export function CoachResourceSummary({studentId}:{studentId:string}){
  const [resources,setResources]=useState<any[]>([]);
  const [msg,setMsg]=useState('');

  useEffect(()=>{void (async()=>{
    const r=await fetch('/api/coach/students/'+studentId+'/resources',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||'Kaynak takibi yüklenemedi.');return}
    setResources(j.resources||[]);
  })()},[studentId]);

  return <div className="card">
    <div className="moduleEyebrow">KAYNAK TAKİBİ</div>
    <h2>Kitap ve kaynak kullanım verisi</h2>
    <p className="muted">Amaç daha çok kaynak kullandırmak değil; öğrencinin bir kaynakta gereksiz yere oyalanıp oyalanmadığını ve çalışma çıktısını görmek.</p>
    {msg&&<div className="notice error">{msg}</div>}
    {resources.length===0?<p className="muted">Öğrenci henüz kaynak eklemedi.</p>:<div className="stack">{resources.map(r=><div className="card" key={r.id} style={{margin:0}}>
      <div className="moduleHeaderRow"><div><strong>{r.title}</strong><div className="muted">{r.examType} · {r.subject}{r.currentPage?' · s. '+r.currentPage:''}</div></div><span className="pill">{r.accuracy==null?'—':'%'+r.accuracy}</span></div>
      <p>{r.questions} soru · {r.correct} doğru · {r.wrong} yanlış · {r.blank} boş</p>
      {r.paceSignal&&<div className="notice"><strong>Koç kontrolü:</strong> {r.paceSignal}</div>}
    </div>)}</div>}
  </div>;
}
