'use client';

import {useEffect,useState} from 'react';

type Flag={key:string;label:string;description:string;mode:'ALL'|'OFF'|'PILOT';studentCodes:string[];updatedAt:string|null};

export function AdminFeatureFlags(){
  const [flags,setFlags]=useState<Flag[]>([]);
  const [draft,setDraft]=useState<Record<string,{mode:'ALL'|'OFF'|'PILOT';codes:string}>>({});
  const [msg,setMsg]=useState('');

  async function load(){
    const r=await fetch('/api/admin/feature-flags',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Özellik bayrakları yüklenemedi.'));
    const rows:Flag[]=j.flags||[];
    setFlags(rows);
    setDraft(Object.fromEntries(rows.map(x=>[x.key,{mode:x.mode,codes:(x.studentCodes||[]).join(', ')}])));
  }
  useEffect(()=>{void load()},[]);

  async function save(flag:Flag){
    const d=draft[flag.key]||{mode:flag.mode,codes:''};
    const studentCodes=d.codes.split(',').map(x=>x.trim()).filter(Boolean);
    const r=await fetch('/api/admin/feature-flags',{
      method:'PATCH',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({key:flag.key,mode:d.mode,studentCodes})
    });
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Özellik bayrağı güncellenemedi.'));
    setMsg(j.message||'Özellik bayrağı güncellendi.');
    await load();
  }

  return <div className="card" style={{marginBottom:16}}>
    <div className="moduleEyebrow">FEATURE FLAGS · KONTROLLÜ YAYIN</div>
    <h3>Özellik Bayrakları</h3>
    <p className="muted">Yeni modülleri kodu geri almadan kapatabilir, herkese açabilir veya yalnız pilot öğrenci kodlarına tanımlayabilirsiniz.</p>
    <div className="stack">
      {flags.map(flag=>{const d=draft[flag.key]||{mode:flag.mode,codes:(flag.studentCodes||[]).join(', ')};return <div className="card" key={flag.key}>
        <div className="moduleHeaderRow"><div><strong>{flag.label}</strong><p className="muted">{flag.description}</p></div><span className="pill">{d.mode}</span></div>
        <div className="row" style={{alignItems:'end',flexWrap:'wrap'}}>
          <div className="field" style={{minWidth:180}}><label>Yayın modu</label><select value={d.mode} onChange={e=>setDraft(x=>({...x,[flag.key]:{...d,mode:e.target.value as any}}))}>
            <option value="ALL">Herkese Açık</option>
            <option value="PILOT">Pilot Öğrenciler</option>
            <option value="OFF">Kapalı</option>
          </select></div>
          {d.mode==='PILOT'&&<div className="field" style={{flex:1,minWidth:260}}><label>Pilot öğrenci kodları</label><input value={d.codes} onChange={e=>setDraft(x=>({...x,[flag.key]:{...d,codes:e.target.value}}))} placeholder="211, 445212, ..."/></div>}
          <button className="btn primary" onClick={()=>save(flag)}>Kaydet</button>
        </div>
        <small className="muted">Son ayar: {flag.updatedAt?new Date(flag.updatedAt).toLocaleString('tr-TR'):'Varsayılan yapılandırma'}</small>
      </div>})}
    </div>
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')} style={{marginTop:10}}>{msg}</div>}
  </div>;
}
