'use client';

import {FormEvent,useState} from 'react';

export function CoachPlanSimulator({studentId}:{studentId:string}){
  const [data,setData]=useState<any>(null);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function run(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setBusy(true);setMsg('');
    const fd=new FormData(e.currentTarget);
    const body={
      dailyMinutes:Number(fd.get('dailyMinutes')),
      studyDays:Number(fd.get('studyDays')),
      examsPerWeek:Number(fd.get('examsPerWeek'))
    };
    const r=await fetch('/api/coach/students/'+studentId+'/plan-simulator',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify(body)
    });
    const j=await r.json();
    setBusy(false);
    if(!r.ok)return setMsg('Hata: '+(j.error||'Simülasyon oluşturulamadı.'));
    setData(j);
  }

  const s=data?.simulation;

  return <div className="card">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">WHAT-IF · PLAN SİMÜLATÖRÜ</div>
        <h2>Senaryoyu değiştir, sonucu gör</h2>
        <p className="muted">Bu araç öğrenci programını değiştirmez. Yalnızca koça kapasite ve öncelik seçenekleri gösterir.</p>
      </div>
      <span className="pill">KAYDETMEZ</span>
    </div>

    <form className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))'}} onSubmit={run}>
      <label className="field">Günlük çalışma süresi
        <input name="dailyMinutes" type="number" min="30" max="480" step="10" defaultValue="120" required/>
      </label>
      <label className="field">Haftalık çalışma günü
        <select name="studyDays" defaultValue="5">
          {[3,4,5,6,7].map(x=><option value={x} key={x}>{x} gün</option>)}
        </select>
      </label>
      <label className="field">Haftalık deneme
        <select name="examsPerWeek" defaultValue="1">
          {[0,1,2,3,4].map(x=><option value={x} key={x}>{x} deneme</option>)}
        </select>
      </label>
      <div className="field" style={{alignSelf:'end'}}>
        <button className="btn primary" disabled={busy}>{busy?'Hesaplanıyor…':'Senaryoyu Simüle Et'}</button>
      </div>
    </form>

    {msg&&<div className="notice error" style={{marginTop:12}}>{msg}</div>}

    {s&&<div className="stack" style={{marginTop:16}}>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
        <div className="card" style={{margin:0}}><div className="kpi">{s.capacity.weeklyMinutes}</div><div className="muted">Haftalık toplam dakika</div></div>
        <div className="card" style={{margin:0}}><div className="kpi">{s.capacity.studyMinutes}</div><div className="muted">Deneme sonrası çalışma dakikası</div></div>
        <div className="card" style={{margin:0}}><div className="kpi">{s.capacity.focusBlocks}</div><div className="muted">Yaklaşık odak bloğu</div></div>
        <div className="card" style={{margin:0}}><div className="kpi">~{s.capacity.estimatedQuestionCapacity}</div><div className="muted">Teorik soru kapasitesi</div></div>
      </div>

      <div className="notice">
        <strong>Deneme etkisi:</strong> {s.examImpact}
        {s.capacityWarning&&<p className="riskText" style={{marginBottom:0}}>{s.capacityWarning}</p>}
      </div>

      <div className="card" style={{margin:0}}>
        <div className="moduleEyebrow">ÖNCELİKLİ KONULAR</div>
        <h3>Bu senaryoda önce hangi alanlar korunmalı?</h3>
        {s.priorities.length===0?<p className="muted">Önceliklendirilecek açık/riskli konu bulunamadı.</p>:s.priorities.map((x:any,i:number)=>
          <div key={x.subject+'-'+x.topic} style={{padding:'10px 0',borderBottom:'1px solid var(--line)'}}>
            <strong>{i+1}. {x.subject} · {x.topic}</strong>
            <div className="muted">{x.reason||'Mevcut performans ve hâkimiyet verisine göre öncelikli.'}</div>
          </div>
        )}
      </div>

      <div className="notice"><strong>Simülasyon notu:</strong> {s.note}</div>
    </div>}
  </div>;
}
