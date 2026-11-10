'use client';

import {FormEvent,useEffect,useMemo,useState} from 'react';
import {MizaLogo} from '@/app/components/MizaLogo';

type MizaTask={
  id:string;
  order:number;
  source:string;
  title:string;
  subject:string|null;
  topic:string|null;
  examType:string|null;
  why:string|null;
  targetValue:number;
  metricType:string;
  estimatedMinutes:number;
  completed:boolean;
  actionId:string|null;
  reviewIds:string[];
  resultMode:'ACTION_QUESTIONS'|'ACTION_PROGRESS'|'PRACTICE_QUESTIONS'|'TOPIC_COMPLETE'|'REVIEW_FLOW'|'SIMPLE_COMPLETE';
  masteryStatus:string|null;
  masteryScore:number|null;
  masteryRiskReasons:string[];
  forgettingRisk:boolean;
  forgettingRiskScore:number|null;
  primaryErrorReasonLabel:string|null;
  avgSecondsPerQuestion:number|null;
  targetSecondsPerQuestion:number|null;
  resourceEfficiencyStatus:string|null;
  dailyStatus:'COMPLETED'|'LATE_COMPLETED'|'INCOMPLETE'|'UPCOMING'|null;
  guidance:{
    confidence:'LIMITED'|'SUPPORTED'|'MULTIPLE_SIGNALS';
    nextStep:string;rationale:string;evidence:string[];
  };
};

type Orchestration={
  date:string;
  plannedMinutes:number;
  coachTasks:number;
  dueReviews:number;
  explanation:string;
  notifications:string[];
  rebalance:{redistributedTasks:number;deferredTasks:number;deferredUnits:number};
  coachEscalation:{required:boolean;severity:string;message:string};
  tasks:MizaTask[];
  remainingTasks:number;
  completedTasks:number;
  coachBoundary:{message:string};
};

const ERROR_REASONS=[
  ['','Belirtilmedi'],
  ['BILGI_EKSIKLIGI','Bilgi eksikliği'],
  ['ISLEM_HATASI','İşlem hatası'],
  ['DIKKAT','Dikkat'],
  ['SORU_KOKU','Soru kökünü yanlış okuma'],
  ['SURE','Süre'],
  ['YONTEM_BILMEME','Yöntem bilmeme'],
  ['UNUTMA','Unutma']
];

function taskTarget(task:MizaTask){
  if(task.source==='REVIEW_BATCH')return task.targetValue+' tekrar';
  if(task.metricType==='QUESTIONS')return task.targetValue+' soru';
  if(task.metricType==='MINUTES')return task.targetValue+' dk';
  if(task.targetValue>0)return String(task.targetValue);
  return '';
}

export function MizaLearningOrchestrator(){
  const [prompt,setPrompt]=useState('Bugün ne çalışayım?');
  const [reply,setReply]=useState('');
  const [orchestration,setOrchestration]=useState<Orchestration|null>(null);
  const [reviews,setReviews]=useState<any[]>([]);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  const reviewIds=useMemo(()=>new Set((orchestration?.tasks||[]).flatMap(x=>x.reviewIds||[])),[orchestration]);
  const nextTask=useMemo(()=>orchestration?.tasks?.find(x=>!x.completed)||null,[orchestration]);

  async function loadReviews(ids:Set<string>){
    if(!ids.size){setReviews([]);return}
    const r=await fetch('/api/student/reviews',{cache:'no-store'});
    const j=await r.json();
    if(r.ok)setReviews((j.items||[]).filter((x:any)=>ids.has(x.id)&&new Date(x.dueAt)<=new Date()));
  }

  async function applyPayload(j:any){
    if(j.mode==='TODAY_ORCHESTRATION'&&j.orchestration){
      setOrchestration(j.orchestration);
      setReply(j.reply||'');
      const ids=new Set<string>((j.orchestration.tasks||[]).flatMap((x:any)=>Array.isArray(x.reviewIds)?x.reviewIds.map(String):[]));
      await loadReviews(ids);
    }else{
      setReply(j.reply||'');
    }
  }

  async function loadToday(){
    const r=await fetch('/api/student/miza/today',{method:'POST',cache:'no-store'});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||'MİZA günlük planı yükleyemedi.');return}
    await applyPayload(j);
  }

  useEffect(()=>{void loadToday()},[]);

  async function ask(e?:FormEvent){
    e?.preventDefault();
    if(!prompt.trim())return;
    setBusy(true);setMsg('');
    try{
      const r=await fetch('/api/student/coachbot',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({message:prompt.trim()})
      });
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'MİZA yanıt veremedi.');return}
      await applyPayload(j);
    }finally{setBusy(false)}
  }

  async function refreshed(message:string){
    setMsg(message);
    await loadToday();
  }

  return <div className="card mizaOrchestrator">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">MİZA · ÖĞRENME ORKESTRATÖRÜ</div>
        <h2>Bugün ne yapacağını veriden çıkarır, sonucu KEKS’e işler.</h2>
        <p className="muted">MİZA serbestçe program uydurmaz. Koç görevleri, Bugünün Planı, gecikmiş tekrarlar, konu performansı ve gerçek çalışma kapasitesini aynı sırada birleştirir.</p>
      </div>
      <MizaLogo/>
    </div>

    <div className="notice mizaBoundary">
      <strong>Koç otoritesi korunur.</strong>
      <div className="muted">{orchestration?.coachBoundary?.message||'MİZA koçun hedefini, görevini veya müdahale kararını değiştirmez; günlük uygulamayı düzenler ve öğrencinin sonucunu kaydeder.'}</div>
    </div>

    <form className="mizaPromptBar" onSubmit={ask}>
      <input value={prompt} onChange={e=>setPrompt(e.target.value)} maxLength={2000} placeholder="Örn. Bugün ne çalışayım?"/>
      <button className="btn primary" disabled={busy}>{busy?'Plan hazırlanıyor…':'MİZA’ya Sor'}</button>
    </form>

    {reply&&<div className="mizaReply" aria-live="polite">{reply}</div>}
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}

    {orchestration&&<>
      {orchestration.coachEscalation?.required&&<div className="notice error mizaCoachEscalation">
        <strong>Koç değerlendirmesi gerekiyor.</strong>
        <div>{orchestration.coachEscalation.message}</div>
        <div className="muted">MİZA bu yükü günlük plana zorla eklemedi ve koç görevlerini değiştirmedi.</div>
      </div>}

      {orchestration.rebalance?.redistributedTasks>0&&<div className="notice">
        <strong>Kapasiteye göre yeniden dengeleme:</strong> {orchestration.rebalance.redistributedTasks} kaçırılan görev ileri günlere dağıtıldı.
      </div>}

      {nextTask&&<div className="card todayMissionCard" style={{margin:'14px 0'}}>
        <div className="moduleEyebrow">MİZA · ŞİMDİ UYGULA</div>
        <h3>{nextTask.title}</h3>
        <p className="muted">{nextTask.why||'KEKS verisine göre şu anda en yüksek öncelikli görev.'}</p>
        {nextTask.guidance&&<div className="notice" style={{marginBottom:10}}>
          <strong>MİZA'nın önerdiği mikro adım</strong>
          <p>{nextTask.guidance.nextStep}</p>
          <small className="muted">{nextTask.guidance.rationale}</small>
          <details style={{marginTop:7}}>
            <summary>Kararın dayandığı veriler · {nextTask.guidance.confidence==='LIMITED'?'Sınırlı kanıt':nextTask.guidance.confidence==='SUPPORTED'?'Bir gözlem':'Birden çok gözlem'}</summary>
            {(nextTask.guidance.evidence||[]).length
              ?<ul>{nextTask.guidance.evidence.map((x,i)=><li key={i}>{x}</li>)}</ul>
              :<p className="muted">Konuya özel yeterli ölçüm yok; öneri görev türüne dayanıyor.</p>}
          </details>
        </div>}
        {nextTask.masteryStatus==='RISKY'&&<div className="notice error" style={{marginBottom:10}}>
          <strong>Riskli çünkü:</strong> {(nextTask.masteryRiskReasons||[]).slice(0,2).join(' ')||'Konuya ait öğrenme sinyalleri zayıf.'}
          <div className="muted" style={{marginTop:6}}>
            {nextTask.forgettingRiskScore!=null?'Unutma riski '+nextTask.forgettingRiskScore+'/100. ':''}
            {nextTask.avgSecondsPerQuestion!=null?'Soru başına süre '+Math.round(nextTask.avgSecondsPerQuestion)+' sn. ':''}
            {nextTask.primaryErrorReasonLabel?'Baskın yanlış nedeni: '+nextTask.primaryErrorReasonLabel+'. ':''}
            {nextTask.resourceEfficiencyStatus?'Kaynak verimliliği: '+nextTask.resourceEfficiencyStatus+'.':''}
          </div>
        </div>}
        <div className="row" style={{flexWrap:'wrap'}}>
          <span className="pill">{taskTarget(nextTask)}</span>
          <span className="pill">~{nextTask.estimatedMinutes} dk</span>
          <span className="pill">{nextTask.source==='ACTION'?'KOÇ ÖNCELİĞİ':nextTask.source==='REVIEW_BATCH'?'GECİKMİŞ TEKRAR':'SIRADAKİ AKSİYON'}</span>
        </div>
        <div style={{marginTop:12}}>
          <TaskControls key={nextTask.id} task={nextTask} reviews={reviews.filter(x=>nextTask.reviewIds.includes(x.id))} onSaved={refreshed}/>
        </div>
      </div>}

      <div className="mizaSummaryGrid">
        <span><strong>{orchestration.remainingTasks}</strong> kalan görev</span>
        <span><strong>{orchestration.plannedMinutes}</strong> dk plan</span>
        <span><strong>{orchestration.dueReviews}</strong> gecikmiş tekrar</span>
        <span><strong>{orchestration.coachTasks}</strong> koç görevi</span>
      </div>

      {orchestration.notifications?.length>0&&<div className="mizaSignals">
        {orchestration.notifications.map((x,i)=><span key={i}>{x}</span>)}
      </div>}

      <div className="stack mizaTaskList">
        {orchestration.tasks.map(task=><article className={'mizaTask '+(task.completed?'done':'')} key={task.id}>
          <div className="mizaTaskOrder">{task.completed?'✓':task.order}</div>
          <div className="mizaTaskBody">
            <div className="mizaTaskHead">
              <div>
                <strong>{task.title}</strong>
                <span>{taskTarget(task)}{task.estimatedMinutes?' · ~'+task.estimatedMinutes+' dk':''}</span>
              </div>
              <span className="pill">{task.dailyStatus==='LATE_COMPLETED'?'GEÇ TAMAMLANDI':task.completed?'TAMAMLANDI':task.source==='ACTION'?'KOÇ GÖREVİ':task.source==='REVIEW_BATCH'?'TEKRAR':'MİZA SIRASI'}</span>
            </div>
            {task.why&&<details><summary>Neden bu görev?</summary><p className="muted">{task.why}</p></details>}
            {!task.completed&&task.guidance&&<details>
              <summary>MİZA öğrenme adımı</summary>
              <p>{task.guidance.nextStep}</p>
              <small className="muted">{task.guidance.rationale}</small>
            </details>}
            {!task.completed&&task.id!==nextTask?.id&&<TaskControls task={task} reviews={reviews.filter(x=>task.reviewIds.includes(x.id))} onSaved={refreshed}/>}
          </div>
        </article>)}
      </div>
    </>}
  </div>;
}

function TaskControls({task,reviews,onSaved}:{task:MizaTask;reviews:any[];onSaved:(message:string)=>Promise<void>}){
  const [total,setTotal]=useState(String(task.targetValue||0));
  const [wrong,setWrong]=useState('');
  const [blank,setBlank]=useState('');
  const [reason,setReason]=useState('');
  const [confirmed,setConfirmed]=useState(false);
  const [achieved,setAchieved]=useState(String(task.targetValue||0));
  const [answer,setAnswer]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState(false);

  async function saveQuestions(){
    const totalQuestions=Number(total),w=Number(wrong||0),b=Number(blank||0);
    if(![totalQuestions,w,b].every(n=>Number.isInteger(n)&&n>=0&&n<=2000)
      ||totalQuestions<=0||w+b>totalQuestions)return onSaved('Hata: Toplam, yanlış ve boş sayıları geçerli olmalıdır.');
    if(task.resultMode==='ACTION_QUESTIONS'&&!confirmed)return onSaved('Hata: Görev sonucu için öğrenci onayı gerekli.');
    const c=totalQuestions-w-b;
    if(w>0&&!reason&&task.resultMode==='PRACTICE_QUESTIONS')return onSaved('Hata: Yanlış soru varsa yanlış nedenini seçin.');
    setBusy(true);
    try{
      const endpoint=task.resultMode==='ACTION_QUESTIONS'?'/api/student/task-submissions':'/api/student/progress';
      const body=task.resultMode==='ACTION_QUESTIONS'
        ?{actionId:task.actionId,confirmed:true,totalQuestions:totalQuestions,wrong:w,blank:b,errorReason:reason||null}
        :{action:'practice',examType:task.examType||'GENEL',subject:task.subject||'Genel',topic:task.topic||undefined,correct:c,wrong:w,blank:b,errorReason:reason||undefined};
      const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      const j=await r.json();
      if(!r.ok)return onSaved('Hata: '+(j.error||'Çalışma sonucu kaydedilemedi.'));
      await onSaved('MİZA çalışma sonucunu KEKS’e kaydetti.');
    }finally{setBusy(false)}
  }

  async function saveProgress(){
    if(!confirmed)return onSaved('Hata: Kaydetmeden önce çalışmanı onaylamalısın.');
    const achievedValue=Number(achieved);
    if(!Number.isInteger(achievedValue)||achievedValue<0)return onSaved('Hata: Geçerli bir çalışma miktarı gir.');
    setBusy(true);
    try{
      const isCoachTask=task.resultMode==='ACTION_PROGRESS';
      const endpoint=isCoachTask?'/api/student/task-submissions':'/api/student/miza/result';
      const body=isCoachTask
        ?{actionId:task.actionId,confirmed:true,totalQuestions:0,wrong:0,blank:0,achievedValue}
        :{taskId:task.id,confirmed:true,achievedValue};
      const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      const j=await r.json();
      if(!r.ok)return onSaved('Hata: '+(j.error||'Görev sonucu kaydedilemedi.'));
      await onSaved(j.dailyStatus==='LATE_COMPLETED'
        ?'MİZA teslimini Geç Tamamlandı olarak kaydetti. Durum ve saat değiştirilemez.'
        :j.completed||j.dailyStatus==='COMPLETED'
          ?'MİZA görevi Tamamlandı olarak kaydetti. Kayıt değiştirilemez.'
          :'MİZA çalışma bildirimini kaydetti.');
    }finally{setBusy(false)}
  }

  async function completeTopic(){
    if(!task.examType||!task.subject||!task.topic)return onSaved('Hata: Konu kaydı için ders/konu eşleşmesi bulunamadı.');
    setBusy(true);
    try{
      const r=await fetch('/api/student/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'topic',examType:task.examType,subject:task.subject,topic:task.topic,completed:true})});
      const j=await r.json();
      if(!r.ok)return onSaved('Hata: '+(j.error||'Konu tamamlanamadı.'));
      await onSaved('Konu tamamlandı ve tekrar tarihleri KEKS’e işlendi.');
    }finally{setBusy(false)}
  }

  async function answerReview(item:any,value:string){
    if(!value.trim())return;
    setBusy(true);
    try{
      const r=await fetch('/api/student/reviews',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:item.id,answer:value.trim()})});
      const j=await r.json();
      if(!r.ok)return onSaved('Hata: '+(j.error||'Tekrar sonucu kaydedilemedi.'));
      setAnswer(x=>({...x,[item.id]:''}));
      await onSaved(j.correct?'Tekrar doğru kaydedildi; sonraki aralık güncellendi.':'Tekrar yanlış kaydedildi; KEKS aralığı yeniden ayarladı.');
    }finally{setBusy(false)}
  }

  if(task.resultMode==='ACTION_QUESTIONS'||task.resultMode==='PRACTICE_QUESTIONS'){
    return <div className="mizaResultBox">
      <div className="mizaResultInputs">
        <label>Toplam soru<input type="number" min="0" max="2000" value={total} onChange={e=>setTotal(e.target.value)}/></label>
        <label>Doğru (otomatik)<input type="number" readOnly value={Math.max(0,Number(total||0)-Number(wrong||0)-Number(blank||0))}/></label>
        <label>Yanlış<input type="number" min="0" value={wrong} onChange={e=>setWrong(e.target.value)}/></label>
        <label>Boş<input type="number" min="0" value={blank} onChange={e=>setBlank(e.target.value)}/></label>
        <label>Yanlış nedeni<select value={reason} onChange={e=>setReason(e.target.value)}>{ERROR_REASONS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
      </div>
      {task.resultMode==='ACTION_QUESTIONS'&&<label className="row" style={{alignItems:'center',gap:8,marginTop:8}}>
        <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
        <span>Bu çalışmayı yaptığımı ve sonuçları onaylıyorum. Teslim sonradan değiştirilemez.</span>
      </label>}
      <button className="btn primary" disabled={busy||(task.resultMode==='ACTION_QUESTIONS'&&!confirmed)} onClick={saveQuestions}>{busy?'Kaydediliyor…':'Sonucu MİZA ile Kaydet'}</button>
    </div>;
  }

  if(task.resultMode==='TOPIC_COMPLETE'){
    return <div className="mizaResultBox"><button className="btn primary" disabled={busy} onClick={completeTopic}>{busy?'Kaydediliyor…':'Konuyu Tamamladım'}</button><span className="muted">Tamamlandığında 0–1–3–7–14–28 tekrar döngüsü otomatik oluşturulur.</span></div>;
  }

  if(task.resultMode==='REVIEW_FLOW'){
    return <div className="mizaReviewFlow">
      {reviews.length===0?<p className="muted">Vadesi gelen tekrar soruları yükleniyor veya tamamlandı.</p>:reviews.map(item=><div className="mizaReviewItem" key={item.id}>
        <strong>{item.question.subject} · {item.question.topic}</strong>
        <p>{item.question.prompt}</p>
        {item.question.inputMode==='TEXT'
          ?<div className="row"><input value={answer[item.id]||''} onChange={e=>setAnswer(x=>({...x,[item.id]:e.target.value}))} placeholder="Cevabın"/><button className="btn primary" disabled={busy||!String(answer[item.id]||'').trim()} onClick={()=>answerReview(item,String(answer[item.id]||''))}>Kaydet</button></div>
          :<div className="answerGrid">{Object.entries(item.question.options||{}).map(([key,val]:any)=><button className="btn" disabled={busy} key={key} onClick={()=>answerReview(item,key)}><strong>{key})</strong> {val}</button>)}</div>}
      </div>)}
    </div>;
  }

  return <div className="mizaResultBox">
    <label className="mizaAchieved">Gerçekleşen {task.metricType==='MINUTES'?'dakika':'miktar'}<input type="number" min="0" value={achieved} onChange={e=>setAchieved(e.target.value)}/></label>
    <label className="row" style={{alignItems:'center',gap:8,marginTop:8}}>
      <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
      <span>Çalışmamı onaylıyorum. Sistem teslim zamanını ve durumunu belirler.</span>
    </label>
    <button className="btn primary" disabled={busy||!confirmed} onClick={saveProgress}>{busy?'Kaydediliyor…':'Sonucu MİZA ile Kaydet'}</button>
  </div>;
}
