'use client';

import { FormEvent, useState } from 'react';

export function TargetManager({studentId,initial}:{studentId:string;initial:any}) {
  const [msg,setMsg]=useState('');
  const [target,setTarget]=useState(initial||null);

  async function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('');
    const fd=new FormData(e.currentTarget);
    let benchmarkNets:any=undefined;
    const raw=String(fd.get('benchmarkNets')||'').trim();
    if(raw){ try{ benchmarkNets=JSON.parse(raw); }catch{ setMsg('Hedef netler JSON biçiminde olmalı. Örn: {"TYT Matematik":30}'); return; } }
    const body={
      examLevel:fd.get('examLevel'),
      institutionName:fd.get('institutionName'),
      departmentName:String(fd.get('departmentName')||'')||undefined,
      programCode:String(fd.get('programCode')||'')||undefined,
      source:fd.get('source'),
      sourceUrl:String(fd.get('sourceUrl')||'')||undefined,
      dataYear:fd.get('dataYear')?Number(fd.get('dataYear')):undefined,
      score:fd.get('score')?Number(fd.get('score')):undefined,
      ranking:fd.get('ranking')?Number(fd.get('ranking')):undefined,
      percentile:fd.get('percentile')?Number(fd.get('percentile')):undefined,
      benchmarkNets
    };
    const r=await fetch('/api/coach/students/'+studentId+'/target',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json(); if(!r.ok){setMsg('Hata: '+(j.error||'Kaydedilemedi.'));return}
    setTarget(j.row);setMsg('Hedef kaydedildi.');
  }

  async function sync(){
    setMsg('Resmî kaynak kontrol ediliyor...');
    const r=await fetch('/api/coach/students/'+studentId+'/target/sync',{method:'POST'});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Senkron başarısız.'));return}
    setTarget(j.target); setMsg(j.message);
  }

  async function analyze(){
    setMsg('Performans raporu oluşturuluyor...');
    const r=await fetch('/api/coach/students/'+studentId+'/analysis',{method:'POST'});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Rapor oluşturulamadı.'));return}
    setMsg('Koç raporu oluşturuldu: '+j.gap.text);
    setTimeout(()=>location.reload(),700);
  }

  return <div className="card">
    <h2>Hedef Okul / Üniversite</h2>
    {target&&<div className="notice"><strong>{target.institutionName}</strong>{target.departmentName?' · '+target.departmentName:''}<br/><span className="muted">Kaynak: {target.source} · Senkron: {target.syncStatus||'PENDING'}</span></div>}
    <form className="form" onSubmit={save}>
      <div className="row">
        <div className="field" style={{flex:1}}><label>Sınav düzeyi</label><select name="examLevel" defaultValue={target?.examLevel||'YKS'}><option>YKS</option><option>LGS</option></select></div>
        <div className="field" style={{flex:1}}><label>Kaynak</label><select name="source" defaultValue={target?.source||'YOKATLAS'}><option value="YOKATLAS">YÖK Atlas</option><option value="MEB">MEB / Rota Maarif</option><option value="MANUAL">Manuel</option></select></div>
      </div>
      <div className="field"><label>Üniversite / okul adı</label><input name="institutionName" required defaultValue={target?.institutionName||''}/></div>
      <div className="field"><label>Bölüm (YKS)</label><input name="departmentName" defaultValue={target?.departmentName||''}/></div>
      <div className="field"><label>YÖK program kodu</label><input name="programCode" defaultValue={target?.programCode||''} placeholder="Örn. 200210555"/></div>
      <div className="field"><label>Resmî kaynak bağlantısı</label><input name="sourceUrl" type="url" defaultValue={target?.sourceUrl||''} placeholder="YÖK Atlas veya MEB Rota Maarif bağlantısı"/></div>
      <div className="row">
        <div className="field" style={{flex:1}}><label>Veri yılı</label><input name="dataYear" type="number" defaultValue={target?.dataYear||2025}/></div>
        <div className="field" style={{flex:1}}><label>Taban puan</label><input name="score" type="number" step="0.001" defaultValue={target?.score||''}/></div>
      </div>
      <div className="row">
        <div className="field" style={{flex:1}}><label>Başarı sırası (YKS)</label><input name="ranking" type="number" defaultValue={target?.ranking||''}/></div>
        <div className="field" style={{flex:1}}><label>Yüzdelik dilim (LGS)</label><input name="percentile" type="number" step="0.01" defaultValue={target?.percentile||''}/></div>
      </div>
      <div className="field"><label>Hedef netler (isteğe bağlı JSON)</label><textarea name="benchmarkNets" rows={4} defaultValue={target?.benchmarkNets?JSON.stringify(target.benchmarkNets,null,2):''} placeholder='{"TYT Matematik":30,"TYT Türkçe":32}'/></div>
      <div className="row"><button className="btn primary">Hedefi Kaydet</button><button type="button" className="btn" onClick={sync}>Resmî Kaynaktan Senkronla</button><button type="button" className="btn" onClick={analyze}>Koç Raporu Oluştur</button></div>
    </form>
    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}
  </div>;
}
