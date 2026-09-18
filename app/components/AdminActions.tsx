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
      setLegacyBackup(json);
      setLegacyFileName(file.name);
      setMsg('Eski KEKS yedeği okundu. Kaynak ve hedef kodlarını kontrol edip aktarımı başlatın.');
    }catch(err){
      setLegacyBackup(null);
      setLegacyFileName('');
      setMsg('Hata: Geçerli bir KEKS JSON yedeği seçilmedi.');
    }
  }

  async function importLegacy(){
    if(!legacyBackup)return setMsg('Hata: Önce eski KEKS JSON yedeğini seçin.');
    setLegacyBusy(true); setMsg('Aktarım başlatıldı…');
    try{
      const r=await fetch('/api/admin/legacy-import',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          sourceStudentCode:'211',
          targetStudentCode:'256090',
          targetName:'Elif Koçak',
          targetGradeLevel:'12. Sınıf/YKS',
          backup:legacyBackup
        })
      });
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Aktarım başarısız.'));return}
      const i=j.imported||{};
      setMsg(
        'Aktarım tamamlandı: '+j.targetName+' ('+j.targetStudentCode+'). '+
        'Program '+(i.schedule||0)+', aktivite '+(i.activities||0)+', çalışma oturumu '+(i.studySessions||0)+
        ', net '+(i.nets||0)+', sınav '+(i.exams||0)+', test '+(i.tests||0)+
        '. Diğer eski veriler tam arşiv olarak da saklandı.'
      );
    }catch{
      setMsg('Hata: Aktarım isteği tamamlanamadı.');
    }finally{
      setLegacyBusy(false);
    }
  }

  return <div className="stack">
    <div className="card">
      <div className="row"><h3 style={{margin:0}}>KEKS Akademi Kodu</h3><button className="btn primary" onClick={makeCode}>Tek Kullanımlık Kod Oluştur</button></div>
      {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`} style={{marginTop:12}}>{msg}</div>}
    </div>

    <div className="card">
      <h3>Eski KEKS Öğrenci Verisini Aktar</h3>
      <p className="muted">Eski sistem yedeğindeki öğrenci kodu <strong>211</strong> verileri, yeni sistemde <strong>Elif Koçak · 256090 · 12. Sınıf/YKS</strong> kaydına aktarılır. Hedef öğrencinin mevcut kayıtları silinmez.</p>
      <div className="form">
        <div className="field">
          <label>Eski KEKS JSON yedeği</label>
          <input type="file" accept=".json,application/json" onChange={chooseLegacyFile}/>
          {legacyFileName&&<div className="muted">Seçilen dosya: {legacyFileName}</div>}
        </div>
        <button className="btn primary" disabled={!legacyBackup||legacyBusy} onClick={importLegacy}>
          {legacyBusy?'Aktarılıyor…':'211 → Elif Koçak (256090) Aktar'}
        </button>
      </div>
    </div>

    <div className="card">
      <h3>Koç Onayları</h3>
      {coaches.length===0?<p className="muted">Bekleyen koç hesabı yok.</p>:
        <table className="table"><thead><tr><th>Koç</th><th>Durum</th><th>İşlem</th></tr></thead>
        <tbody>{coaches.map(c=><tr key={c.id}><td>{c.name}<div className="muted">{c.email}</div></td><td>{c.status}</td><td className="row"><button className="btn" onClick={()=>setStatus(c.id,'ACTIVE')}>Aktif Et</button><button className="btn danger" onClick={()=>setStatus(c.id,'SUSPENDED')}>Durdur</button></td></tr>)}</tbody></table>}
    </div>
  </div>;
}
