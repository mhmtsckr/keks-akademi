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
    {brief.cohortGroups&&<details style={{marginTop:14}}>
      <summary><strong>KOHORT / GRUP GÖRÜNÜMÜ</strong></summary>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',marginTop:10}}>
        <div className="card"><strong>En fazla tekrar/görev geciktirenler</strong><p className="muted">{brief.cohortGroups.mostOverdue?.length?brief.cohortGroups.mostOverdue.map((x:any)=>x.studentName).join(' · '):'Yok'}</p></div>
        <div className="card"><strong>Doğruluğu düşenler</strong><p className="muted">{brief.cohortGroups.accuracyDecline?.length?brief.cohortGroups.accuracyDecline.map((x:any)=>x.studentName).join(' · '):'Yok'}</p></div>
        <div className="card"><strong>Deneme takibi gerekenler</strong><p className="muted">{brief.cohortGroups.examFollowUp?.length?brief.cohortGroups.examFollowUp.map((x:any)=>x.studentName).join(' · '):'Yok'}</p></div>
        <div className="card"><strong>Görüşme önerilenler</strong><p className="muted">{brief.cohortGroups.needsMeeting?.length?brief.cohortGroups.needsMeeting.map((x:any)=>x.studentName).join(' · '):'Yok'}</p></div>
      </div>
    </details>}
  </div>;
}
