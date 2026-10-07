'use client';

import {useEffect,useState} from 'react';

type Profile={
  id:string;
  displayTitle:string|null;
  bio:string|null;
  specialties:unknown;
  supportedEducationLevels:unknown;
  maxActiveStudents:number;
  acceptingStudents:boolean;
  partnerStatus:string;
  responseTargetHours:number;
  operationsStandardVersion:string;
  profileUpdatedAt:string|null;
  _count:{students:number};
};

function list(value:unknown){
  return Array.isArray(value)?value.filter((x):x is string=>typeof x==='string'):[];
}

export function PartnerCoachProfile(){
  const [profile,setProfile]=useState<Profile|null>(null);
  const [specialtyOptions,setSpecialtyOptions]=useState<string[]>([]);
  const [levelOptions,setLevelOptions]=useState<string[]>([]);
  const [standards,setStandards]=useState<Array<{key:string;title:string;target:string}>>([]);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    fetch('/api/coach/partner-profile').then(async r=>{
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Profil yüklenemedi.');
      setProfile(j.profile);
      setSpecialtyOptions(j.options?.specialties||[]);
      setLevelOptions(j.options?.educationLevels||[]);
      setStandards(j.operationStandards||[]);
    }).catch(e=>setMsg('Hata: '+e.message));
  },[]);

  function toggle(field:'specialties'|'supportedEducationLevels',value:string){
    if(!profile)return;
    const current=list(profile[field]);
    const next=current.includes(value)?current.filter(x=>x!==value):[...current,value];
    setProfile({...profile,[field]:next});
  }

  async function save(){
    if(!profile)return;
    const levels=list(profile.supportedEducationLevels);
    if(!levels.length){setMsg('Hata: En az bir eğitim düzeyi seçmelisiniz.');return}
    setBusy(true);setMsg('');
    try{
      const r=await fetch('/api/coach/partner-profile',{
        method:'PATCH',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          displayTitle:profile.displayTitle||null,
          bio:profile.bio||null,
          specialties:list(profile.specialties),
          supportedEducationLevels:levels,
          maxActiveStudents:profile.maxActiveStudents,
          acceptingStudents:profile.acceptingStudents
        })
      });
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Profil kaydedilemedi.'));return}
      setProfile(j.profile);setMsg('Partner Koç profili güncellendi.');
    }finally{setBusy(false)}
  }

  if(!profile)return <div className="card"><div className="moduleEyebrow">PARTNER KOÇ PROFİLİ</div><p className="muted">{msg||'Profil yükleniyor…'}</p></div>;

  const specialties=list(profile.specialties);
  const levels=list(profile.supportedEducationLevels);
  const openSlots=Math.max(0,profile.maxActiveStudents-profile._count.students);

  return <div className="card">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">KEKS PARTNER KOÇ PROFİLİ</div>
        <h2>Uzmanlık, düzey ve kapasite profili</h2>
        <p className="muted">Öğrenci eşleştirme motoru yalnız aktif kabul durumu, desteklediğiniz düzeyler, uzmanlıklar ve ölçülebilir KEKS operasyon verilerini kullanır.</p>
      </div>
      <span className="pill">{profile.partnerStatus==='ACTIVE'?'AKTİF PARTNER':'İNCELEME'}</span>
    </div>

    <div className="grid">
      <div className="card">
        <div className="moduleEyebrow">KAPASİTE</div>
        <div className="kpi">{profile._count.students}/{profile.maxActiveStudents}</div>
        <p className="muted">{openSlots} yeni öğrenci kontenjanı</p>
      </div>
      <div className="card">
        <div className="moduleEyebrow">YANIT STANDARDI</div>
        <div className="kpi">≤ {profile.responseTargetHours} sa.</div>
        <p className="muted">KEKS operasyon hedefi · koç tarafından değiştirilemez</p>
      </div>
      <div className="card">
        <div className="moduleEyebrow">STANDARD</div>
        <strong>{profile.operationsStandardVersion}</strong>
        <p className="muted">Kalite metrikleri sistem verisinden otomatik hesaplanır.</p>
      </div>
    </div>

    <div className="notice" style={{marginTop:16}}>
      <strong>KEKS operasyon standartları</strong>
      <div className="stack" style={{marginTop:8}}>
        {standards.map(item=><div key={item.key}><strong>{item.title}</strong><div className="muted">{item.target}</div></div>)}
      </div>
      <small className="muted">Bu hedefler profil beyanı değildir; aşağıdaki Koç Kalite Sistemi gerçek KEKS kayıtlarından otomatik ölçer.</small>
    </div>

    <div className="form" style={{marginTop:16}}>
      <div className="field">
        <label>Profesyonel unvan / kısa tanım</label>
        <input value={profile.displayTitle||''} maxLength={120} onChange={e=>setProfile({...profile,displayTitle:e.target.value})} placeholder="Örn. YKS Öğrenci Koçu · Eşit Ağırlık"/>
      </div>
      <div className="field">
        <label>Koç profili</label>
        <textarea rows={4} maxLength={1000} value={profile.bio||''} onChange={e=>setProfile({...profile,bio:e.target.value})} placeholder="Çalışma yaklaşımınızı, takip biçiminizi ve öğrenciyle nasıl çalıştığınızı kısa ve somut biçimde anlatın."/>
      </div>

      <div className="field">
        <label>Uzmanlık alanları</label>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))'}}>
          {specialtyOptions.map(item=><button type="button" key={item} className={specialties.includes(item)?'btn primary':'btn'} onClick={()=>toggle('specialties',item)}>{item}</button>)}
        </div>
        <small className="muted">Eşleştirmede öğrencinin sınav grubu ve alanıyla uyumlu uzmanlıklar öne çıkarılır.</small>
      </div>

      <div className="field">
        <label>Takip ettiğiniz eğitim düzeyleri</label>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>
          {levelOptions.map(item=><button type="button" key={item} className={levels.includes(item)?'btn primary':'btn'} onClick={()=>toggle('supportedEducationLevels',item)}>{item}</button>)}
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
        <div className="field">
          <label>Azami aktif öğrenci</label>
          <input type="number" min={1} max={100} value={profile.maxActiveStudents} onChange={e=>setProfile({...profile,maxActiveStudents:Number(e.target.value)||1})}/>
        </div>
        <label className="card row" style={{justifyContent:'flex-start',gap:10,alignItems:'center'}}>
          <input type="checkbox" checked={profile.acceptingStudents} onChange={e=>setProfile({...profile,acceptingStudents:e.target.checked})}/>
          <span><strong>Yeni öğrenci kabul ediyorum</strong><br/><small className="muted">Kapalıysa eşleştirme listesinde görünmezsiniz.</small></span>
        </label>
      </div>

      <button type="button" className="btn primary" onClick={save} disabled={busy}>{busy?'Kaydediliyor…':'Partner Koç Profilini Kaydet'}</button>
      {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    </div>
  </div>;
}
