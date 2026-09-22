'use client';

import { FormEvent, useMemo, useState } from 'react';
import { EXAM_CATALOG, ExamType } from '@/lib/examCatalog';

type Progress = {examType:string;subject:string;topic:string;completed:boolean};
type Practice = {id:string;examType:string;subject:string;topic:string|null;correct:number;wrong:number;blank:number;net:number;date:string;errorReason?:string|null};

export function StudentProgressTools({allowedExams,initialProgress,initialPractice}:{allowedExams:ExamType[];initialProgress:Progress[];initialPractice:Practice[]}) {
  const [exam,setExam]=useState<ExamType>(allowedExams[0]||'TYT');
  const [subject,setSubject]=useState<string>(Object.keys(EXAM_CATALOG[allowedExams[0]||'TYT'])[0]||'');
  const [progress,setProgress]=useState(initialProgress);
  const [practice,setPractice]=useState(initialPractice);
  const [msg,setMsg]=useState('');
  const [lastSchedule,setLastSchedule]=useState<{subject:string;topic:string;items:{day:number;label:string;date:string}[]} | null>(null);
  const subjects=Object.keys(EXAM_CATALOG[exam]||{});
  const topics=(EXAM_CATALOG[exam] as any)?.[subject]||[];

  function changeExam(v:ExamType){setExam(v);setSubject(Object.keys(EXAM_CATALOG[v])[0]||'');}

  async function toggle(topic:string,completed:boolean){
    const r=await fetch('/api/student/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'topic',examType:exam,subject,topic,completed})});
    const j=await r.json(); if(!r.ok){setMsg('Hata: '+(j.error||'Kaydedilemedi.'));return}
    setProgress(p=>[...p.filter(x=>!(x.examType===exam&&x.subject===subject&&x.topic===topic)),{examType:exam,subject,topic,completed}]);
    if(completed){
      setLastSchedule({subject,topic,items:j.reviewSchedule||[]});
      setMsg('Konu tamamlandı. 0–1–3–7–14–28. Gün Tekrar Sistemi görevleri günlük görevlerine eklendi.');
    }else{
      setLastSchedule(null);
      setMsg('Konu yeniden açıldı; bekleyen otomatik konu tekrar görevleri iptal edildi.');
    }
  }

  async function addPractice(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('');
    const form=e.currentTarget;
    const fd=new FormData(form);
    const body={action:'practice',examType:exam,subject,topic:String(fd.get('topic')||''),correct:Number(fd.get('correct')||0),wrong:Number(fd.get('wrong')||0),blank:Number(fd.get('blank')||0),errorReason:String(fd.get('errorReason')||'')||undefined};
    const r=await fetch('/api/student/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json(); if(!r.ok){setMsg('Hata: '+(j.error||'Kaydedilemedi.'));return}
    setPractice(p=>[j.row,...p]); setMsg('Soru çözüm kaydı eklendi. Net: '+j.row.net); form.reset();
  }

  const completedCount=useMemo(()=>progress.filter(x=>x.examType===exam&&x.completed).length,[progress,exam]);
  const totalCount=useMemo(()=>Object.values(EXAM_CATALOG[exam]).reduce((a:any,b:any)=>a+b.length,0),[exam]);
  const pct=totalCount?Math.round((completedCount/totalCount)*100):0;

  return <div className="studentProgressLayout">
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    {lastSchedule&&<div className="card">
      <div className="moduleEyebrow">KONU TEKRAR TAKVİMİ</div>
      <h3>{lastSchedule.subject} · {lastSchedule.topic}</h3>
      <p className="muted">Konu bitişinden itibaren tekrar günleri otomatik oluşturuldu.</p>
      <div className="row" style={{flexWrap:'wrap'}}>
        {lastSchedule.items.map(item=><span className="pill" key={item.day}>
          {item.label} · {new Date(item.date).toLocaleDateString('tr-TR',{timeZone:'Europe/Istanbul',day:'2-digit',month:'short'})}
        </span>)}
      </div>
    </div>}

    <div className="card topicProgressCard">
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">KONU İLERLEMESİ</div><h2>{exam} · {subject}</h2></div>
        <div className="progressRing"><strong>%{pct}</strong><span>{completedCount}/{totalCount}</span></div>
      </div>
      <div className="row">
        <div className="field" style={{flex:1}}><label>Sınav</label><select value={exam} onChange={e=>changeExam(e.target.value as ExamType)}>{allowedExams.map(x=><option key={x}>{x}</option>)}</select></div>
        <div className="field" style={{flex:2}}><label>Ders</label><select value={subject} onChange={e=>setSubject(e.target.value)}>{subjects.map(x=><option key={x}>{x}</option>)}</select></div>
      </div>
      <div className="topicChecklist">
        {topics.map((topic:string)=>{
          const done=progress.some(x=>x.examType===exam&&x.subject===subject&&x.topic===topic&&x.completed);
          return <label key={topic} className={'topicCheck '+(done?'done':'')}>
            <input type="checkbox" checked={done} onChange={e=>toggle(topic,e.target.checked)}/>
            <span className="topicCheckMark">{done?'✓':'○'}</span>
            <span>{topic}</span>
          </label>
        })}
      </div>
    </div>

    <div className="studentPracticeColumn">
      <div className="card practiceEntryCard">
        <div className="moduleEyebrow">SORU ÇÖZÜMÜ</div>
        <h2>Bugünkü soru kaydını ekle</h2>
        <form className="form" onSubmit={addPractice}>
          <div className="field"><label>Konu</label><select name="topic"><option value="">Genel / Karma</option>{topics.map((x:string)=><option key={x}>{x}</option>)}</select></div>
          <div className="scoreInputs">
            <div className="field"><label>Doğru</label><input name="correct" type="number" min="0" required/></div>
            <div className="field"><label>Yanlış</label><input name="wrong" type="number" min="0" required/></div>
            <div className="field"><label>Boş</label><input name="blank" type="number" min="0" required/></div>
          </div>
          <div className="field"><label>Baskın hata nedeni</label><select name="errorReason"><option value="">Seçiniz</option><option value="BILGI_EKSIKLIGI">Bilgi eksikliği</option><option value="DIKKAT">Dikkat</option><option value="ISLEM_HATASI">İşlem hatası</option><option value="SURE">Süre problemi</option><option value="SORUYU_ANLAMA">Soruyu anlama</option><option value="STRATEJI">Yanlış strateji</option><option value="DIGER">Diğer</option></select></div>
          <button className="btn primary">Kaydet ve Neti Hesapla</button>
        </form>
      </div>

      <div className="card recentPracticeCard">
        <div className="moduleEyebrow">SON KAYITLAR</div>
        <h2>Son soru çözümlerim</h2>
        {practice.length===0?<p className="muted">Henüz kayıt yok.</p>:practice.slice(0,8).map(p=><div key={p.id} className="practiceRow">
          <div><strong>{p.subject}</strong><span>{p.topic||'Karma'}</span></div>
          <div className="practiceScore"><b>{p.net}</b><span>net</span></div>
          <div className="practiceMeta">D {p.correct} · Y {p.wrong} · B {p.blank}{p.errorReason?' · '+p.errorReason.replaceAll('_',' '):''}</div>
        </div>)}
      </div>
    </div>
  </div>;
}
