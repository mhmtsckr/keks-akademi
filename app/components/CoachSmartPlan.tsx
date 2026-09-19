'use client';
import { useState } from 'react';

export function CoachSmartPlan({studentId,goalPercent,goalLabel}:{studentId:string;goalPercent:number|null;goalLabel:string}){
  const [msg,setMsg]=useState('');
  async function create(){
    setMsg('Akıllı haftalık program oluşturuluyor...');
    const r=await fetch('/api/coach/students/'+studentId+'/smart-plan',{method:'POST'});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Program oluşturulamadı.'));return}
    setMsg('Program oluşturuldu ve öğrenci paneline kaydedildi.');
    setTimeout(()=>location.reload(),700);
  }
  const pct=goalPercent==null?0:Math.max(0,Math.min(100,goalPercent));
  return <div className="card coachSmartCard">
    <div className="moduleEyebrow">AKILLI KOÇ</div>
    <div className="coachSmartGrid">
      <div>
        <h2>Hedefe Yaklaşma</h2>
        <div className="kpi">{goalPercent==null?'—':'%'+goalPercent}</div>
        <div className="muted">{goalLabel}</div>
        <div className="goldProgress"><i style={{width:pct+'%'}}/></div>
      </div>
      <div className="coachSmartAction">
        <h3>Bu haftayı yeniden planla</h3>
        <p className="muted">Zayıf ders, konu açığı ve tekrar yüküne göre 7 günlük plan üretir.</p>
        <button className="btn primary" onClick={create}>Akıllı Haftalık Program Oluştur</button>
      </div>
    </div>
    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`} style={{marginTop:12}}>{msg}</div>}
  </div>;
}
