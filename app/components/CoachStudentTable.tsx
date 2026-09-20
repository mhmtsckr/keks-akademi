'use client';

import { useState } from 'react';

type StudentRow={
  id:string;
  fullName:string;
  studentCode:string;
  gradeLevel:string|null;
};

export function CoachStudentTable({students}:{students:StudentRow[]}){
  const [deleting,setDeleting]=useState<StudentRow|null>(null);
  const [code,setCode]=useState('');
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

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
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')} style={{marginBottom:12}}>{msg}</div>}
    <table className="table">
      <thead><tr><th>Kod</th><th>Öğrenci</th><th>Grup</th><th>İşlem</th></tr></thead>
      <tbody>{students.map(s=><tr key={s.id}>
        <td>{s.studentCode}</td>
        <td><a href={'/koc/ogrenci/'+s.id}><strong>{s.fullName}</strong></a></td>
        <td>{s.gradeLevel||'—'}</td>
        <td><div className="row">
          <a className="btn" href={'/koc/ogrenci/'+s.id}>Aç</a>
          <button className="btn danger" onClick={()=>{setDeleting(s);setCode('');setMsg('')}}>Sil</button>
        </div></td>
      </tr>)}</tbody>
    </table>

    {deleting&&<div className="deleteModalBackdrop" role="presentation" onMouseDown={e=>{if(e.currentTarget===e.target&&!busy)setDeleting(null)}}>
      <div className="deleteModal" role="dialog" aria-modal="true" aria-labelledby="delete-student-title">
        <div className="moduleEyebrow">KALICI SİLME</div>
        <h2 id="delete-student-title">{deleting.fullName} öğrencisini sil?</h2>
        <p>Bu işlem öğrencinin programlarını, denemelerini, raporlarını, çalışma kayıtlarını, testlerini ve bağlı hesaplarını kalıcı olarak siler.</p>
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
