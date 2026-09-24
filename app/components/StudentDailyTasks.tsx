'use client';

import { FormEvent,useEffect,useMemo,useState } from 'react';

function dateKey(v:string){
  try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v))}catch{return ''}
}
function todayKey(){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}
function timeTr(v:string){return new Date(v).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})}

export function StudentDailyTasks(){
  const [actions,setActions]=useState<any[]>([]);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState('');

  async function load(){
    const r=await fetch('/api/student/daily-tasks');const j=await r.json();
    if(j.ok)setActions(j.actions||[]);
  }
  useEffect(()=>{load()},[]);

  const grouped=useMemo(()=>{
    const map=new Map<string,any[]>();
    for(const a of actions){const k=dateKey(a.taskDate||a.periodEnd);const arr=map.get(k)||[];arr.push(a);map.set(k,arr)}
    return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  },[actions]);

  async function submit(e:FormEvent<HTMLFormElement>,action:any){
    e.preventDefault();setMsg('');setBusy(action.id);
    const fd=new FormData(e.currentTarget);
    const body={
      actionId:action.id,
      totalQuestions:Number(fd.get('totalQuestions')),
      correct:Number(fd.get('correct')),
      wrong:Number(fd.get('wrong')),
      blank:Number(fd.get('blank')),
      errorReason:String(fd.get('errorReason')||'')||null
    };
    const r=await fetch('/api/student/task-submissions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();setBusy('');
    if(!r.ok)return setMsg('Hata: '+(j.error||'Görev kaydedilemedi.'));
    setMsg(j.late?'KIRMIZI ALARM: Görev 23.00 sonrasında kaydedildi. Koçunuza iletildi.':'Görev sonucu kaydedildi ve koçunuza değerlendirme raporu iletildi.');
    await load();
  }

  const today=todayKey();
  if(!actions.length)return <div className="card"><div className="moduleEyebrow">GÜNLÜK GÖREVLER</div><h2>Bugün için görev yok</h2><p className="muted">Koçunuz görev atadığında burada görünecek.</p></div>;

  return <div className="stack">
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':msg.startsWith('KIRMIZI')?'error':'')}>{msg}</div>}
    {grouped.map(([key,list])=>{
      const isToday=key===today;
      return <div className={'card dailyTaskDay '+(isToday?'today':'')} key={key}>
        <div className="moduleHeaderRow">
          <div><div className="moduleEyebrow">{isToday?'BUGÜNÜN GÖREVLERİ':'GÖREV GÜNÜ'}</div><h2>{new Date(key+'T12:00:00+03:00').toLocaleDateString('tr-TR',{weekday:'long',day:'2-digit',month:'long'})}</h2></div>
          {isToday&&<span className="pill">Son kayıt 23.00</span>}
        </div>
        <div className="dailyTaskGrid">{list.map((a:any)=><div className={'dailyTaskCard '+(a.submission?.late?'late':'')} key={a.id}>
          <div className="dailyTaskTitle">
            <div><strong>{a.title}</strong><span>{a.subject||'Ders'}{a.topic?' · '+a.topic:''}</span></div>
            {a.submission?.late?<span className="lateAlarm">KIRMIZI ALARM</span>:a.submission?<span className="doneBadge">KAYDEDİLDİ</span>:a.planSource==='TOPIC_REVIEW_01371428'?<span className="doneBadge">KONU TEKRARI</span>:null}
          </div>
          <p className="muted">{a.description||'Koç görevi'}</p>
          {a.planSource==='TOPIC_REVIEW_01371428'&&<div className="notice" style={{marginBottom:10}}><strong>0–1–3–7–14–28. Gün Tekrar Sistemi</strong><div className="muted">Bu görev, konuyu bitirdiğin güne göre otomatik planlandı. Branş: {a.subject||'—'} · Konu: {a.topic||'—'}</div></div>}
          <div className="taskMeta"><span>Hedef: {a.targetValue} {a.metricType==='QUESTIONS'?'soru':''}</span><span>23.00'a kadar kayıt</span></div>
          {a.submission&&<div className="taskResultSummary">
            <span><b>{a.submission.totalQuestions}</b> soru</span><span><b>{a.submission.correct}</b> doğru</span><span><b>{a.submission.wrong}</b> yanlış</span><span><b>{a.submission.blank}</b> boş</span><span><b>{a.submission.net}</b> net</span><span><b>%{a.submission.accuracy}</b> doğruluk</span>
            <small>{timeTr(a.submission.submittedAt)}</small>
          </div>}
          <form className="taskSubmissionForm" onSubmit={e=>submit(e,a)}>
            <label>Toplam<input name="totalQuestions" type="number" min="0" defaultValue={a.submission?.totalQuestions??a.targetValue} required/></label>
            <label>Doğru<input name="correct" type="number" min="0" defaultValue={a.submission?.correct??0} required/></label>
            <label>Yanlış<input name="wrong" type="number" min="0" defaultValue={a.submission?.wrong??0} required/></label>
            <label>Boş<input name="blank" type="number" min="0" defaultValue={a.submission?.blank??0} required/></label>
            <label>Yanlış nedeni<select name="errorReason" defaultValue={a.submission?.errorReason||''}><option value="">Belirtilmedi</option><option value="BILGI_EKSIKLIGI">Bilgi eksikliği</option><option value="DIKKAT">Dikkat</option><option value="ISLEM_HATASI">İşlem hatası</option><option value="SURE">Süre</option><option value="SORUYU_ANLAMA">Soruyu anlama</option><option value="STRATEJI">Strateji</option><option value="DIGER">Diğer</option></select></label>
            <button className="btn primary" disabled={busy===a.id}>{busy===a.id?'Kaydediliyor…':a.submission?'Kaydı Güncelle':'Görevi Kaydet'}</button>
          </form>
        </div>)}</div>
      </div>
    })}
  </div>;
}
