'use client';

import {useEffect,useState} from 'react';

type Mode='ALL'|'OFF'|'PILOT';
type Flag={
  key:string;
  label:string;
  description:string;
  mode:Mode;
  studentCodes:string[];
  updatedAt:string|null;
  source?:'DEFAULT'|'ADMIN';
};

export function AdminFeatureFlags(){
  const [flags,setFlags]=useState<Flag[]>([]);
  const [draft,setDraft]=useState<Record<string,{mode:Mode;codes:string}>>({});
  const [msg,setMsg]=useState('');
  const [busyKey,setBusyKey]=useState('');

  async function load(){
    const r=await fetch('/api/admin/feature-flags',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Özellik bayrakları yüklenemedi.'));
    const rows:Flag[]=j.flags||[];
    setFlags(rows);
    setDraft(Object.fromEntries(rows.map(x=>[x.key,{mode:x.mode,codes:(x.studentCodes||[]).join(', ')}])));
  }

  useEffect(()=>{void load()},[]);

  async function save(flag:Flag,overrideMode?:Mode){
    const d=draft[flag.key]||{mode:flag.mode,codes:''};
    const mode=overrideMode||d.mode;
    const studentCodes=mode==='PILOT'
      ?d.codes.split(',').map(x=>x.trim()).filter(Boolean)
      :[];

    setBusyKey(flag.key);
    setMsg('');
    try{
      const r=await fetch('/api/admin/feature-flags',{
        method:'PATCH',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({key:flag.key,mode,studentCodes})
      });
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'Özellik bayrağı güncellenemedi.'));
      setMsg(overrideMode==='OFF'
        ?flag.label+' acil olarak kapatıldı. Yeni isteklerde artık çalışmayacak.'
        :(j.message||'Özellik bayrağı güncellendi.'));
      await load();
    }finally{
      setBusyKey('');
    }
  }

  return <div className="card" style={{marginBottom:16}}>
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">FEATURE FLAGS · KONTROLLÜ YAYIN</div>
        <h3>Özellik Bayrakları</h3>
        <p className="muted">Yeni modülleri kodu geri almadan kapatabilir, herkese açabilir veya yalnız seçili pilot öğrencilere tanımlayabilirsiniz. Kontrol hem arayüzde hem API tarafında uygulanır.</p>
      </div>
      <span className="pill">{flags.length} kontrollü modül</span>
    </div>

    <div className="notice">
      <strong>Yayın politikası:</strong> PILOT ile sınırlı kullanıcıda doğrula → ALL ile genel yayına aç → production sorunu oluşursa Acil Kapat ile OFF yap.
    </div>

    <div className="stack" style={{marginTop:12}}>
      {flags.map(flag=>{
        const d=draft[flag.key]||{mode:flag.mode,codes:(flag.studentCodes||[]).join(', ')};
        const busy=busyKey===flag.key;
        return <div className="card" key={flag.key}>
          <div className="moduleHeaderRow">
            <div>
              <strong>{flag.label}</strong>
              <p className="muted">{flag.description}</p>
            </div>
            <div className="row">
              {flag.mode==='PILOT'&&<span className="pill">{flag.studentCodes.length} pilot</span>}
              <span className="pill">{flag.mode}</span>
            </div>
          </div>

          <div className="row" style={{alignItems:'end',flexWrap:'wrap'}}>
            <div className="field" style={{minWidth:180}}>
              <label>Yayın modu</label>
              <select
                value={d.mode}
                disabled={busy}
                onChange={e=>setDraft(x=>({...x,[flag.key]:{...d,mode:e.target.value as Mode}}))}
              >
                <option value="ALL">Herkese Açık</option>
                <option value="PILOT">Pilot Öğrenciler</option>
                <option value="OFF">Kapalı</option>
              </select>
            </div>

            {d.mode==='PILOT'&&<div className="field" style={{flex:1,minWidth:260}}>
              <label>Pilot öğrenci kodları</label>
              <input
                value={d.codes}
                disabled={busy}
                onChange={e=>setDraft(x=>({...x,[flag.key]:{...d,codes:e.target.value}}))}
                placeholder="211, 445212, ..."
              />
            </div>}

            <button className="btn primary" disabled={busy} onClick={()=>save(flag)}>
              {busy?'Uygulanıyor…':'Kaydet'}
            </button>

            {flag.mode!=='OFF'&&<button className="btn" disabled={busy} onClick={()=>save(flag,'OFF')}>
              Acil Kapat
            </button>}
          </div>

          <small className="muted">
            Son ayar: {flag.updatedAt?new Date(flag.updatedAt).toLocaleString('tr-TR'):'Varsayılan yapılandırma'}
            {flag.source?' · Kaynak: '+(flag.source==='ADMIN'?'Yönetici ayarı':'Sistem varsayılanı'):''}
          </small>
        </div>;
      })}
    </div>

    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')} style={{marginTop:10}}>{msg}</div>}
  </div>;
}
