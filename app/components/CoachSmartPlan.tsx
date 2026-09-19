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
  return <div className="card">
    <h2>Akıllı Eğitim Koçu</h2>
    <div className="row"><div><div className="kpi">{goalPercent==null?'—':'%'+goalPercent}</div><div className="muted">{goalLabel}</div></div><button className="btn primary" onClick={create}>Akıllı Haftalık Program Oluştur</button></div>
    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`} style={{marginTop:12}}>{msg}</div>}
  </div>;
}