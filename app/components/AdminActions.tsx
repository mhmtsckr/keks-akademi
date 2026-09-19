'use client';

import { ChangeEvent, useEffect, useState } from 'react';

type Coach={id:string;name:string;email:string|null;status:string};

export function AdminActions(){
  const [coaches,setCoaches]=useState<Coach[]>([]);
  const [msg,setMsg]=useState('');
  const [legacyBackup,setLegacyBackup]=useState<unknown>(null);
  const [legacyFileName,setLegacyFileName]=useState('');
  const [legacyBusy,setLegacyBusy]=useState(false);

  async function load(){
    const r=await fetch('/api/admin/coaches');
    if(r.ok){const j=await r.json();setCoaches(j.coaches)}
  }
  useEffect(()=>{load()},[]);

  async function setStatus(id:string,status:'ACTIVE'|'SUSPENDED'){
    const r=await fetch('/api/admin/coaches',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({userId:id,status})});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'İşlem başarısız.'));
    setMsg('Koç durumu güncellendi.');
    load();
  }

  async function makeCode(){
    const r=await fetch('/api/admin/codes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({maxUses:1})});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Kod oluşturulamadı.'));
    setMsg('Yeni tek kullanımlık KEKS kodu: '+j.code);
  }

  async function chooseLegacyFile(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];
    if(!file){setLegacyBackup(null);setLegacyFileName('');return}
    try{
      const text=await file.text();
      const json=JSON.parse(text);
      if(!json || !Array.isArray(json.students)) throw new Error('students dizisi bulunamadı');
      setLegacyBackup(json);setLegacyFileName(file.name);
      setMsg('Eski KEKS yedeği okundu. Kaynak ve hedef kodlarını kontrol edip aktarımı başlatın.');
    }catch{
      setLegacyBackup(null);setLegacyFileName('');
      setMsg('Hata: Geçerli bir KEKS JSON yedeği seçilmedi.');
    }
  }

  async function importLegacy(){
    if(!legacyBackup)return setMsg('Hata: Önce eski KEKS JSON yedeğini seçin.');
    setLegacyBusy(true);setMsg('Aktarım başlatıldı…');
    try{
      const r=await fetch('/api/admin/legacy-import',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sourceStudentCode:'211',targetStudentCode:'256090',targetName:'Elif Koçak',targetGradeLevel:'12. Sınıf/YKS',backup:legacyBackup})});
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Aktarım başarısız.'));return}
      const i=j.imported||{};
      setMsg('Aktarım tamamlandı: '+j.targetName+' ('+j.targetStudentCode+'). Program '+(i.schedule||0)+', aktivite '+(i.activities||0)+', çalışma oturumu '+(i.studySessions||0)+', net '+(i.nets||0)+', sınav '+(i.exams||0)+', test '+(i.tests||0)+'.');
    }catch{setMsg('Hata: Aktarım isteği tamamlanamadı.')}
    finally{setLegacyBusy(false)}
  }

  const active=coaches.filter(c=>c.status==='ACTIVE').length;
  const pending=coaches.filter(c=>c.status!=='ACTIVE').length;

  return <div className="stack">
    <div className="adminOverviewGrid">
      <div className="card adminStatCard"><span className="moduleIcon">◎</span><div><div className="kpi">{coaches.length}</div><p>Toplam koç hesabı</p></div></div>
      <div className="card adminStatCard"><span className="moduleIcon">✓</span><div><div className="kpi">{active}</div><p>Aktif koç</p></div></div>
      <div className="card adminStatCard"><span className="moduleIcon">!</span><div><div className="kpi">{pending}</div><p>İşlem bekleyen / pasif</p></div></div>
    </div>

    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}

    <div className="adminOpsGrid">
      <div className="card adminOperationCard">
        <div className="moduleEyebrow">ERİŞİM YÖNETİMİ</div>
        <div className="moduleHeaderRow"><div><h2>KEKS Akademi Kodu</h2><p className="muted">Tek kullanımlık öğrenci/test erişim kodu oluşturun.</p></div><span className="moduleIcon">#</span></div>
        <button className="btn primary" onClick={makeCode}>Tek Kullanımlık Kod Oluştur</button>
      </div>

      <div className="card adminOperationCard">
        <div className="moduleEyebrow">VERİ AKTARIMI</div>
        <div className="moduleHeaderRow"><div><h2>Eski KEKS Verisini Aktar</h2><p className="muted">Eski JSON yedeğini seçip hedef öğrenciye ekleyin; mevcut kayıtlar silinmez.</p></div><span className="moduleIcon">⇄</span></div>
        <div className="form">
          <div className="field"><label>Eski KEKS JSON yedeği</label><input type="file" accept=".json,application/json" onChange={chooseLegacyFile}/>{legacyFileName&&<div className="muted">Seçilen: {legacyFileName}</div>}</div>
          <button className="btn primary" disabled={!legacyBackup||legacyBusy} onClick={importLegacy}>{legacyBusy?'Aktarılıyor…':'211 → Elif Koçak (256090) Aktar'}</button>
        </div>
      </div>
    </div>

    <div className="card adminCoachTable">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">KOÇ HESAPLARI</div><h2>Onay ve hesap durumu</h2></div><span className="moduleIcon">♟</span></div>
      {coaches.length===0?<p className="muted">Koç hesabı yok.</p>:<table className="table"><thead><tr><th>Koç</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>{coaches.map(c=><tr key={c.id}><td><strong>{c.name}</strong><div className="muted">{c.email}</div></td><td><span className="pill">{c.status}</span></td><td className="row"><button className="btn" onClick={()=>setStatus(c.id,'ACTIVE')}>Aktif Et</button><button className="btn danger" onClick={()=>setStatus(c.id,'SUSPENDED')}>Durdur</button></td></tr>)}</tbody></table>}
    </div>
  </div>;
}
