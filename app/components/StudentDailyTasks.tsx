'use client';

import { FormEvent,useEffect,useMemo,useState } from 'react';

type TaskResult={totalQuestions:number;wrong:number;blank:number;errorReason:string|null;confirmed:true};

function dateKey(v:string){
  try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v))}catch{return ''}
}
function todayKey(){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}
function timeTr(v:string){return new Date(v).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'});}

function TaskEntryForm({action,busy,onSave}:{action:any;busy:boolean;onSave:(result:TaskResult)=>void}){
  const [total,setTotal]=useState(String(action.metricType==='QUESTIONS'?action.targetValue:0));
  const [wrong,setWrong]=useState('0');
  const [blank,setBlank]=useState('0');
  const [reason,setReason]=useState('');
  const [confirmed,setConfirmed]=useState(false);
  const nTotal=Number(total),nWrong=Number(wrong),nBlank=Number(blank);
  const validCounts=[nTotal,nWrong,nBlank].every(n=>Number.isInteger(n)&&n>=0&&n<=2000)
    &&nWrong+nBlank<=nTotal&&(action.metricType!=='QUESTIONS'||nTotal>0);
  const correct=validCounts?nTotal-nWrong-nBlank:0;

  function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(!confirmed||!validCounts||busy)return;
    onSave({totalQuestions:nTotal,wrong:nWrong,blank:nBlank,errorReason:reason||null,confirmed:true});
  }

  return <form className="taskSubmissionForm" onSubmit={submit}>
    <label>Çözülen toplam soru
      <input name="totalQuestions" type="number" min="0" max="2000" step="1" value={total} onChange={e=>setTotal(e.target.value)} required/>
    </label>
    <label>Yanlış
      <input name="wrong" type="number" min="0" max="2000" step="1" value={wrong} onChange={e=>setWrong(e.target.value)} required/>
    </label>
    <label>Boş
      <input name="blank" type="number" min="0" max="2000" step="1" value={blank} onChange={e=>setBlank(e.target.value)} required/>
    </label>
    <label>Doğru (otomatik)
      <input type="number" value={correct} readOnly aria-label="Otomatik hesaplanan doğru sayısı"/>
    </label>
    <label>Yanlış nedeni
      <select name="errorReason" value={reason} onChange={e=>setReason(e.target.value)}>
        <option value="">Belirtilmedi</option>
        <option value="BILGI_EKSIKLIGI">Bilgi eksikliği</option>
        <option value="ISLEM_HATASI">İşlem hatası</option>
        <option value="DIKKAT">Dikkat</option>
        <option value="SORU_KOKU">Soru kökünü yanlış okuma</option>
        <option value="SURE">Süre</option>
        <option value="YONTEM_BILMEME">Yöntem bilmeme</option>
        <option value="UNUTMA">Unutma</option>
        <option value="SORUYU_ANLAMA">Soruyu anlama</option>
        <option value="STRATEJI">Strateji</option>
        <option value="DIGER">Diğer</option>
      </select>
    </label>
    {!validCounts&&<p className="muted" role="alert">Toplam, yanlış ve boş sayıları geçerli olmalı. Yanlış + boş toplamı, çözülen soru sayısını aşamaz.</p>}
    <label className="row" style={{alignItems:'center',gap:8}}>
      <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
      <span>Bu görevi yaptığımı ve girdiğim sonuçların doğru olduğunu onaylıyorum.</span>
    </label>
    {action.metricType!=='QUESTIONS'&&<p className="muted">
      Bu görevde soru çözmediyseniz soru sayısını 0 bırakabilirsiniz; çalışmayı yaptığınızı yine de onaylamalısınız.
    </p>}
    <p className="muted" style={{fontSize:12}}>
      Görev durumunu sistem belirler. Türkiye saatiyle 23.00 ve sonrasında kaydedilen görevler
      “Geç Tamamlandı” olur. Onaylanan teslim kaydı öğrenci tarafından değiştirilemez.
    </p>
    <button className="btn primary" type="submit" disabled={!confirmed||!validCounts||busy}>
      {busy?'Kaydediliyor…':'Görevi Onayla ve Kaydet'}
    </button>
  </form>;
}

const statusText:Record<string,string>={
  COMPLETED:'Tamamlandı',LATE_COMPLETED:'Geç Tamamlandı',
  INCOMPLETE:'Tamamlanmadı',UPCOMING:'Bekliyor'
};

export function StudentDailyTasks(){
  const [actions,setActions]=useState<any[]>([]);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState('');

  async function load(){
    const r=await fetch('/api/student/daily-tasks',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok)throw new Error(j.error||'Görevler yüklenemedi.');
    setActions(j.actions||[]);
  }

  useEffect(()=>{
    void load().catch(err=>setMsg('Hata: '+(err instanceof Error?err.message:'Görevler yüklenemedi.')));
  },[]);

  const grouped=useMemo(()=>{
    const map=new Map<string,any[]>();
    for(const a of actions){
      const key=dateKey(a.taskDate||a.periodEnd);
      const arr=map.get(key)||[];arr.push(a);map.set(key,arr);
    }
    return [...map.entries()].sort((a,b)=>b[0].localeCompare(a[0]));
  },[actions]);

  async function submit(action:any,result:TaskResult){
    setMsg('');setBusy(action.id);
    try{
      const r=await fetch('/api/student/task-submissions',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({actionId:action.id,...result})
      });
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Görev kaydedilemedi.');
      setMsg(j.dailyStatus==='LATE_COMPLETED'
        ?'Görev Geç Tamamlandı olarak kaydedildi (23.00 sonrası). Koçunuza bildirildi.'
        :j.requiresCoachClosure
          ?'Görev Tamamlandı olarak kaydedildi. Koç müdahalesinin kapatılması ayrıca koç tarafından yapılır.'
          :'Görev Tamamlandı olarak kaydedildi. Soru sonuçlarınız koçunuza iletildi.');
      await load();
    }catch(err){
      setMsg('Hata: '+(err instanceof Error?err.message:'Görev kaydedilemedi.'));
    }finally{setBusy('');}
  }

  const today=todayKey();
  if(!actions.length)return <div className="card">
    {msg&&<div className="notice error">{msg}</div>}
    <div className="moduleEyebrow">GÜNLÜK GÖREVLER</div>
    <h2>Günlük görev bulunamadı</h2>
    <p className="muted">Koçunuz görev atadığında burada görünecek.</p>
  </div>;

  return <div className="stack">
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')||msg.includes('Geç Tamamlandı')?'error':'')}>{msg}</div>}
    {grouped.map(([key,list])=>{
      const isToday=key===today;
      return <div className={'card dailyTaskDay '+(isToday?'today':'')} key={key}>
        <div className="moduleHeaderRow">
          <div>
            <div className="moduleEyebrow">{isToday?'BUGÜNÜN GÖREVLERİ':'GÖREV GÜNÜ'}</div>
            <h2>{new Date(key+'T12:00:00+03:00').toLocaleDateString('tr-TR',{weekday:'long',day:'2-digit',month:'long'})}</h2>
          </div>
          {isToday&&<span className="pill">Son zamanında kayıt: 23.00</span>}
        </div>
        <div className="dailyTaskGrid">{list.map((a:any,index:number)=>{
          const status=a.dailyStatus||'INCOMPLETE';
          const submitted=Boolean(a.submission);
          const formAllowed=!submitted&&['ACTIVE','COMPLETED','RESCHEDULED'].includes(a.status)&&status!=='UPCOMING';
          return <div
            id={isToday&&index===list.findIndex((x:any)=>!x.submission)?'ilk-bekleyen-gorev':undefined}
            className={'dailyTaskCard '+(status==='LATE_COMPLETED'?'late':'')} key={a.id}>
            <div className="dailyTaskTitle">
              <div><strong>{a.title}</strong><span>{a.subject||'Ders'}{a.topic?' · '+a.topic:''}</span></div>
              <span className={status==='LATE_COMPLETED'?'lateAlarm':status==='COMPLETED'?'doneBadge':'pill'}>
                {statusText[status]||'Tamamlanmadı'}
              </span>
            </div>
            <p className="muted">{a.description||'Koç görevi'}</p>
            {a.planSource==='PARAGRAF_OPTIK_REMEDIATION_V1'&&
              <div className="notice" style={{marginBottom:10}}>
                <strong>KEKS Paragraf · Koç müdahalesi</strong>
                <p className="muted">Öğrenci görevi tamamladığını bildirebilir; müdahaleyi yalnızca koç kapatabilir.</p>
                {a.status==='COMPLETED'&&<strong>Koç bu müdahaleyi kapattı.</strong>}
              </div>}
            {a.planSource==='TOPIC_REVIEW_01371428'&&
              <div className="notice" style={{marginBottom:10}}>
                <strong>0–1–3–7–14–28. Gün Tekrar Sistemi</strong>
                <div className="muted">Ders: {a.subject||'—'} · Konu: {a.topic||'—'}</div>
              </div>}
            <div className="taskMeta">
              <span>Hedef: {a.targetValue} {a.metricType==='QUESTIONS'?'soru':a.metricType==='MINUTES'?'dk':a.metricType==='REVIEWS'?'tekrar':''}</span>
              <span>23.00 sonrası: Geç Tamamlandı</span>
            </div>
            {submitted&&<div className="taskResultSummary">
              <span><b>{a.submission.totalQuestions}</b> soru</span>
              <span><b>{a.submission.correct}</b> doğru</span>
              <span><b>{a.submission.wrong}</b> yanlış</span>
              <span><b>{a.submission.blank}</b> boş</span>
              <span><b>{a.submission.net}</b> net</span>
              {a.submission.totalQuestions>0
                ?<span><b>%{a.submission.accuracy}</b> doğruluk</span>
                :<span>Soru çözümü bildirimi yok</span>}
              <small>Sistem teslim zamanı: {timeTr(a.submission.submittedAt)}</small>
              <small>Bu kayıt öğrenci tarafından değiştirilemez.</small>
            </div>}
            {formAllowed&&<TaskEntryForm action={a} busy={busy===a.id}
              onSave={result=>void submit(a,result)}/>}
            {!submitted&&a.status==='RESCHEDULED'&&
              <p className="muted">Bu görev daha önce telafi programına aktarılmıştı. Geç teslim yapabilirsiniz; telafi için oluşturulan yeni görevler ayrı kayıtlardır.</p>}
            {!submitted&&status==='UPCOMING'&&<p className="muted">Görev günü geldiğinde sonuç girebilirsiniz.</p>}
          </div>;
        })}</div>
      </div>;
    })}
  </div>;
}
