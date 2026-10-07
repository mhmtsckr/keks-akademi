'use client';

import {useEffect,useState} from 'react';

export function AdminPartnerCoachNetwork(){
  const [coaches,setCoaches]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [msg,setMsg]=useState('');

  async function load(){
    setLoading(true);
    try{
      const r=await fetch('/api/admin/partner-coaches',{cache:'no-store'});
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Partner Koç ağı yüklenemedi.'));return}
      setCoaches(j.coaches||[]);
    }finally{setLoading(false)}
  }

  useEffect(()=>{void load()},[]);

  async function update(coachId:string,partnerStatus:'ACTIVE'|'PAUSED'|'REVIEW'){
    setBusy(coachId+partnerStatus);setMsg('');
    try{
      const r=await fetch('/api/admin/partner-coaches',{
        method:'PATCH',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({coachId,partnerStatus})
      });
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Ağ durumu güncellenemedi.'));return}
      setMsg('Partner Koç ağ durumu güncellendi.');
      await load();
    }finally{setBusy('')}
  }

  const active=coaches.filter(x=>x.partnerStatus==='ACTIVE').length;
  const accepting=coaches.filter(x=>x.partnerStatus==='ACTIVE'&&x.acceptingStudents&&x.availableSlots>0).length;

  return <div className="card" style={{marginBottom:16}}>
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">KEKS PARTNER KOÇ AĞI</div>
        <h2>Koç kalite ve kapasite ağı</h2>
        <p className="muted">Profil kapsamı, öğrenci kabul kapasitesi ve son 30 günlük operasyon göstergelerini birlikte izleyin.</p>
      </div>
      <div className="row"><span className="pill">{active} aktif partner</span><span className="pill">{accepting} eşleşmeye açık</span><button className="btn" onClick={load}>Yenile</button></div>
    </div>

    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    {loading?<p className="muted">Partner Koç ağı yükleniyor…</p>:coaches.length===0?<p className="muted">Henüz koç profili yok.</p>:<div className="stack">
      {coaches.map(coach=><article className="card" key={coach.id}>
        <div className="moduleHeaderRow">
          <div>
            <strong>{coach.user.name}</strong>
            <div className="muted">{coach.displayTitle||'Profil unvanı girilmedi'} · {coach.user.status}</div>
          </div>
          <div className="row"><span className="pill">{coach.partnerStatus}</span><span className="pill">Profil %{coach.profileCompleteness}</span></div>
        </div>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))'}}>
          <div><small className="muted">Kapasite</small><strong style={{display:'block'}}>{coach.studentCount}/{coach.maxActiveStudents}</strong><span>{coach.availableSlots} açık</span></div>
          <div><small className="muted">Yanıt süresi</small><strong style={{display:'block'}}>{coach.responseTime}</strong><span>Hedef ≤ {coach.responseTargetHours} sa.</span></div>
          <div><small className="muted">Görüşme tamamlama</small><strong style={{display:'block'}}>{coach.sessionCompletion}</strong><span>{coach.sessionStatus}</span></div>
          <div><small className="muted">KEKS standartları</small><strong style={{display:'block'}}>{coach.standardsMet}/{coach.standardsMeasured}</strong><span>{coach.operationalSamples} olay</span></div>
        </div>
        <div className="muted" style={{marginTop:10}}><strong>Düzeyler:</strong> {coach.supportedEducationLevels.join(' · ')||'Tanımlanmadı'}</div>
        <div className="muted"><strong>Uzmanlık:</strong> {coach.specialties.join(' · ')||'Tanımlanmadı'}</div>
        <div className="row" style={{marginTop:12}}>
          <button className="btn primary" disabled={Boolean(busy)} onClick={()=>update(coach.id,'ACTIVE')}>Ağa Aç</button>
          <button className="btn" disabled={Boolean(busy)} onClick={()=>update(coach.id,'REVIEW')}>İncelemeye Al</button>
          <button className="btn" disabled={Boolean(busy)} onClick={()=>update(coach.id,'PAUSED')}>Eşleştirmeyi Duraklat</button>
        </div>
      </article>)}
    </div>}
  </div>;
}
