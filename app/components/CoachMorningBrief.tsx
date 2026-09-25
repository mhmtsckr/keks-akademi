'use client';

import {useEffect,useState} from 'react';

export function CoachMorningBrief(){
  const [brief,setBrief]=useState<any>(null);
  const [msg,setMsg]=useState('');

  async function load(){
    const r=await fetch('/api/coach/morning-brief',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||'Morning Brief hazırlanamadı.');return}
    setBrief(j.brief);setMsg('');
  }

  useEffect(()=>{void load()},[]);

  if(msg)return <div className="notice error">{msg}</div>;
  if(!brief)return <div className="card"><div className="moduleEyebrow">MORNING BRIEF</div><h2>Koç özeti hazırlanıyor…</h2></div>;

  return <div className="card" style={{marginBottom:16}}>
    <div className="moduleHeaderRow">
      <div><div className="moduleEyebrow">MORNING BRIEF · AÇIKLANABİLİR SİNYALLER</div><h2>{brief.summary}</h2><p className="muted">Puan veya kişilik etiketi yerine öğrencinin somut davranışı gösterilir.</p></div>
      <button className="btn" onClick={load}>Yenile</button>
    </div>
    {brief.students?.length
      ?<div className="stack">{brief.students.map((s:any)=><div className="card" key={s.studentId} style={{margin:0}}>
        <div className="moduleHeaderRow">
          <div><strong>{s.studentName}</strong><div className="muted">Kod: {s.studentCode}</div></div>
          <a className="btn" href={'/koc/ogrenci/'+s.studentId}>Öğrenciyi Aç</a>
        </div>
        <div className="stack" style={{gap:6}}>
          {(s.signals||[]).map((x:string,i:number)=><div key={i}>• {x}</div>)}
        </div>
        <div className="notice" style={{marginTop:10}}><strong>Önerilen koç aksiyonu:</strong> {s.suggestedAction}</div>
      </div>)}</div>
      :<div className="notice">Bugün acil müdahale gerektiren somut sinyal oluşmadı.</div>}
  </div>;
}
