'use client';

import { FormEvent, useMemo, useState } from 'react';
import { EXAM_CATALOG, ExamType } from '@/lib/examCatalog';

type Progress = {examType:string;subject:string;topic:string;completed:boolean};
type Practice = {id:string;examType:string;subject:string;topic:string|null;correct:number;wrong:number;blank:number;net:number;date:string};

export function StudentProgressTools({allowedExams,initialProgress,initialPractice}:{allowedExams:ExamType[];initialProgress:Progress[];initialPractice:Practice[]}) {
  const [exam,setExam]=useState<ExamType>(allowedExams[0]||'TYT');
  const [subject,setSubject]=useState<string>(Object.keys(EXAM_CATALOG[allowedExams[0]||'TYT'])[0]||'');
  const [progress,setProgress]=useState(initialProgress);
  const [practice,setPractice]=useState(initialPractice);
  const [msg,setMsg]=useState('');
  const subjects=Object.keys(EXAM_CATALOG[exam]||{});
  const topics=(EXAM_CATALOG[exam] as any)?.[subject]||[];

  function changeExam(v:ExamType){setExam(v);setSubject(Object.keys(EXAM_CATALOG[v])[0]||'');}

  async function toggle(topic:string,completed:boolean){
    const r=await fetch('/api/student/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'topic',examType:exam,subject,topic,completed})});
    const j=await r.json(); if(!r.ok){setMsg('Hata: '+(j.error||'Kaydedilemedi.'));return}
    setProgress(p=>[...p.filter(x=>!(x.examType===exam&&x.subject===subject&&x.topic===topic)),{examType:exam,subject,topic,completed}]);
    setMsg(completed?'Konu tamamlandı olarak işaretlendi.':'Konu yeniden açıldı.');
  }

  async function addPractice(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('');
    const fd=new FormData(e.currentTarget);
    const body={action:'practice',examType:exam,subject,topic:String(fd.get('topic')||''),correct:Number(fd.get('correct')||0),wrong:Number(fd.get('wrong')||0),blank:Number(fd.get('blank')||0)};
    const r=await fetch('/api/student/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json(); if(!r.ok){setMsg('Hata: '+(j.error||'Kaydedilemedi.'));return}
    setPractice(p=>[j.row,...p]); setMsg('Soru çözüm kaydı eklendi. Net: '+j.row.net); e.currentTarget.reset();
  }

  const completedCount=useMemo(()=>progress.filter(x=>x.examType===exam&&x.completed).length,[progress,exam]);
  const totalCount=useMemo(()=>Object.values(EXAM_CATALOG[exam]).reduce((a:any,b:any)=>a+b.length,0),[exam]);

  return <div className="stack">
    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}
    <div className="card">
      <h2>Konu İlerleme Takibi</h2>
      <div className="row"><div className="field" style={{flex:1}}><label>Sınav</label><select value={exam} onChange={e=>changeExam(e.target.value as ExamType)}>{allowedExams.map(x=><option key={x}>{x}</option>)}</select></div><div className="field" style={{flex:2}}><label>Ders</label><select value={subject} onChange={e=>setSubject(e.target.value)}>{subjects.map(x=><option key={x}>{x}</option>)}</select></div></div>
      <p className="muted">{exam} genel ilerleme: {completedCount}/{totalCount} konu</p>
      <div className="stack">{topics.map((topic:string)=>{const done=progress.some(x=>x.examType===exam&&x.subject===subject&&x.topic===topic&&x.completed);return <label key={topic} className="card" style={{padding:12,display:'flex',gap:10,alignItems:'center'}}><input type="checkbox" checked={done} onChange={e=>toggle(topic,e.target.checked)}/><span>{topic}</span></label>})}</div>
    </div>

    <div className="card">
      <h2>Soru Çözüm Kaydı</h2>
      <form className="form" onSubmit={addPractice}>
        <div className="field"><label>Konu</label><select name="topic"><option value="">Genel / Karma</option>{topics.map((x:string)=><option key={x}>{x}</option>)}</select></div>
        <div className="row"><div className="field" style={{flex:1}}><label>Doğru</label><input name="correct" type="number" min="0" required/></div><div className="field" style={{flex:1}}><label>Yanlış</label><input name="wrong" type="number" min="0" required/></div><div className="field" style={{flex:1}}><label>Boş</label><input name="blank" type="number" min="0" required/></div></div>
        <button className="btn primary">Kaydet ve Neti Hesapla</button>
      </form>
    </div>

    <div className="card"><h2>Son Soru Kayıtlarım</h2>{practice.length===0?<p className="muted">Henüz kayıt yok.</p>:practice.slice(0,12).map(p=><div key={p.id} style={{padding:'10px 0',borderBottom:'1px solid var(--line)'}}><strong>{p.examType} · {p.subject}</strong><div className="muted">{p.topic||'Karma'} · D {p.correct} / Y {p.wrong} / B {p.blank} · Net {p.net}</div></div>)}</div>
  </div>;
}
