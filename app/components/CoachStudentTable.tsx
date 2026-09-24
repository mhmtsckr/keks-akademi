'use client';

import { useMemo,useState } from 'react';
import { displayExamGroupWithTrack,getAdultExamGroup } from '@/lib/agsExamOptions';

type StudentRow={
  id:string;
  fullName:string;
  studentCode:string;
  gradeLevel:string|null;
  academicTrack?:string|null;
  riskLevel?:'HIGH'|'MEDIUM'|'LOW';
  reasons?:string[];
  lastActivity?:string|null;
  overdueActions?:number;
};

export function CoachStudentTable({students}:{students:StudentRow[]}){
  const [deleting,setDeleting]=useState<StudentRow|null>(null);
  const [code,setCode]=useState('');
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');
  const [search,setSearch]=useState('');
  const [risk,setRisk]=useState<'ALL'|'HIGH'|'MEDIUM'|'LOW'>('ALL');
  const visible=useMemo(()=>students.filter(s=>{
    const q=search.trim().toLocaleLowerCase('tr-TR');
    const match=!q||s.fullName.toLocaleLowerCase('tr-TR').includes(q)||s.studentCode.toLocaleLowerCase('tr-TR').includes(q)||(s.gradeLevel||'').toLocaleLowerCase('tr-TR').includes(q)||(s.academicTrack||'').toLocaleLowerCase('tr-TR').includes(q);
    return match&&(risk==='ALL'||s.riskLevel===risk);
  }),[students,search,risk]);

  async function remove(){
    if(!deleting)return;
    if(code!==deleting.studentCode){
      setMsg('Hata: Öğrenci kodu eşleşmiyor.');
      return;
    }
    setBusy(true);setMsg('');
    try{
      const r=await fetch('/api/coach/students/'+deleting.id,{
        method:'DELETE',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({confirmationCode:code})
      });
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Öğrenci silinemedi.'));return}
      setMsg('Öğrenci ve ilişkili kayıtları silindi.');
      setDeleting(null);setCode('');
      setTimeout(()=>location.reload(),500);
    }finally{setBusy(false)}
  }

  if(students.length===0)return <p className="muted">Henüz öğrenci eklenmemiş.</p>;

  return <>
    <div className="studentTableTools">
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Öğrenci, kod, grup veya alan ara…"/>
      <select value={risk} onChange={e=>setRisk(e.target.value as any)}>
        <option value="ALL">Tüm öncelikler</option><option value="HIGH">Acil</option><option value="MEDIUM">İzlem</option><option value="LOW">Normal</option>
      </select>
      <span className="pill">{visible.length} öğrenci</span>
    </div>
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')} style={{marginBottom:12}}>{msg}</div>}
    <table className="table">
      <thead><tr><th>Öncelik</th><th>Kod</th><th>Öğrenci</th><th>Grup / Alan</th><th>Son Aktivite</th><th>İşlem</th></tr></thead>
      <tbody>{visible.map(s=><tr key={s.id}>
        <td>{s.riskLevel?<><span className={'riskBadge '+s.riskLevel.toLowerCase()}>{s.riskLevel==='HIGH'?'ACİL':s.riskLevel==='MEDIUM'?'İZLEM':'NORMAL'}</span><div className="muted">{s.reasons?.slice(0,2).join(' · ')}</div></>:<span className="muted">—</span>}</td>
        <td>{s.studentCode}</td>
        <td><a href={'/koc/ogrenci/'+s.id}><strong>{s.fullName}</strong></a></td>
        <td><strong>{displayExamGroupWithTrack(s.gradeLevel,s.academicTrack)}</strong>{getAdultExamGroup(s.gradeLevel)&&<div className="muted">Sınav grubu</div>}</td>
        <td>{s.lastActivity?new Date(s.lastActivity).toLocaleDateString('tr-TR'):<span className="muted">Kayıt yok</span>}{s.overdueActions? <div className="riskText">{s.overdueActions} gecikmiş</div>:null}</td>
        <td><div className="row">
          <a className="btn" href={'/koc/ogrenci/'+s.id}>Aç</a>
          <button className="btn danger" title="Öğrenci kaydını kalıcı olarak sil" onClick={()=>{setDeleting(s);setCode('');setMsg('')}}>Kaydı Sil</button>
        </div></td>
      </tr>)}</tbody>
    </table>

    {deleting&&<div className="deleteModalBackdrop" role="presentation" onMouseDown={e=>{if(e.currentTarget===e.target&&!busy)setDeleting(null)}}>
      <div className="deleteModal" role="dialog" aria-modal="true" aria-labelledby="delete-student-title">
        <div className="moduleEyebrow">KALICI SİLME</div>
        <h2 id="delete-student-title">{deleting.fullName} öğrencisini sil?</h2>
        <p>Bu işlem öğrencinin programlarını, görevlerini, denemelerini, raporlarını, testlerini, ön görüşmelerini, çalışma kayıtlarını ve bağlı öğrenci/veli hesaplarını kalıcı olarak siler.</p>
        <div className="notice error"><strong>Bu işlem geri alınamaz.</strong></div>
        <div className="field">
          <label>Onaylamak için öğrenci kodunu yaz: <strong>{deleting.studentCode}</strong></label>
          <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Öğrenci kodu" autoFocus/>
        </div>
        <div className="row" style={{justifyContent:'flex-end'}}>
          <button className="btn" disabled={busy} onClick={()=>{setDeleting(null);setCode('')}}>Vazgeç</button>
          <button className="btn danger" disabled={busy||code!==deleting.studentCode} onClick={remove}>{busy?'Siliniyor…':'Kalıcı Olarak Sil'}</button>
        </div>
      </div>
    </div>}
  </>;
}
