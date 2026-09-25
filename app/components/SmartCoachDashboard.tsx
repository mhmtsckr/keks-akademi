'use client';

import Image from 'next/image';
import { useEffect,useMemo,useState } from 'react';

function pctWidth(v:number|null){return Math.max(0,Math.min(100,v??0))+'%';}

export function SmartCoachDashboard(){
  const [metrics,setMetrics]=useState<any>(null);
  const [plan,setPlan]=useState<any>(null);
  const [reviews,setReviews]=useState<any[]>([]);
  const [reviewAnswers,setReviewAnswers]=useState<Record<string,string>>({});
  const [msg,setMsg]=useState('');

  async function load(){
    const [m,p,r]=await Promise.all([
      fetch('/api/student/metrics').then(x=>x.json()),
      fetch('/api/student/smart-plan').then(x=>x.json()),
      fetch('/api/student/reviews').then(x=>x.json())
    ]);
    if(m.ok)setMetrics(m);
    if(p.ok)setPlan(p.plan);
    if(r.ok)setReviews(r.items||[]);
  }
  useEffect(()=>{load()},[]);

  async function savePlan(){
    setMsg('Haftalık program oluşturuluyor...');
    const r=await fetch('/api/student/smart-plan',{method:'POST'});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Program oluşturulamadı.'));return}
    setPlan(j.plan);setMsg('Akıllı haftalık program kaydedildi.');
  }

  async function review(id:string,answer:string){
    const r=await fetch('/api/student/reviews',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,answer})});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Tekrar güncellenemedi.'));return}
    setMsg(j.correct?'Doğru: bir sonraki tekrar tarihi planlandı.':'Yanlış. Doğru cevap: '+j.correctAnswer+(j.explanation?' · '+j.explanation:''));
    setReviewAnswers(x=>({...x,[id]:''}));
    load();
  }

  const trends=useMemo(()=>{
    const rows=metrics?.series||[];
    const by:any={};
    for(const x of rows){
      const p=x.payload||{};
      const subjectNets=p.subjectNets||{};
      for(const [s,n] of Object.entries(subjectNets)){
        by[s]=by[s]||[];
        by[s].push({date:x.date,net:Number(n)||0});
      }
      if(p.net!=null){
        by[x.examType]=by[x.examType]||[];
        by[x.examType].push({date:x.date,net:Number(p.net)||0});
      }
    }
    return by;
  },[metrics]);

  const due=reviews.filter(x=>new Date(x.dueAt)<=new Date()).length;
  const goalPct=metrics?.goal?.percent??0;

  return <div className="stack">
    <div className="smartCoachTop">
      <div className="card goalCard">
        <div className="moduleEyebrow">HEDEFE YAKLAŞMA</div>
        <div className="goalCardMain"><div><div className="kpi">{metrics?.goal?.percent==null?'—':'%'+goalPct}</div><strong>{metrics?.goal?.label||'Hedef verisi bekleniyor'}</strong></div><span className="moduleIcon">⚑</span></div>
        <div className="goldProgress"><i style={{width:pctWidth(goalPct)}}/></div>
        <div className="goalDetails">{(metrics?.goal?.details||[]).map((x:string)=><span key={x}>{x}</span>)}</div>
      </div>

      <div className="card planActionCard">
        <div className="moduleEyebrow">HAFTALIK PLAN</div>
        <h2>Akıllı programı güncelle</h2>
        <p className="muted">Son doğruluk verileri, tamamlanmamış konular ve tekrar kuyruğuna göre açıklanabilir 7 günlük çalışma akışı oluşturur. Bu öneri kesin karar değildir.</p>
        <button className="btn primary" onClick={savePlan}>Bu Haftanın Programını Oluştur</button>
      </div>

      <div className="card dueReviewCard">
        <div className="moduleEyebrow">BUGÜN</div>
        <div className="goalCardMain"><div><div className="kpi">{due}</div><strong>Tekrar bekliyor</strong></div><span className="moduleIcon">↺</span></div>
        <p className="muted">Yanlış soru tekrar sistemindeki vadesi gelen sorular.</p>
      </div>
    </div>

    {plan&&<div className="card weeklyPlanCard"><div className="moduleHeaderRow"><div><div className="moduleEyebrow">7 GÜNLÜK PLAN</div><h2>Bu haftanın çalışma akışı</h2></div><span className="moduleIcon">▦</span></div>{plan.explanation&&<div className="notice"><strong>Plan neden böyle?</strong><div className="muted">{plan.explanation}</div></div>}<div className="weeklyPlanGrid">{plan.days.map((d:any)=><div className="dayPlan" key={d.date}><strong>{new Date(d.date).toLocaleDateString('tr-TR',{weekday:'long'})}</strong><span className="dayDate">{new Date(d.date).toLocaleDateString('tr-TR',{day:'numeric',month:'short'})}</span>{d.tasks.length===0?<p className="muted">Dinlenme / telafi</p>:d.tasks.map((t:any,i:number)=><div className="dayTask" key={i}><span>{t.type}</span><b>{t.title}</b><small>{t.duration} dk{t.questions?' · '+t.questions+' soru':''}</small>{t.reason&&<small className="muted">{t.reason}</small>}</div>)}</div>)}</div></div>}

    <div className="card trendCard">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">NET TRENDLERİ</div><h2>Ders bazlı gelişim</h2></div><span className="moduleIcon">⌁</span></div>
      {Object.keys(trends).length===0?<p className="muted">Trend oluşturmak için en az iki deneme/net kaydı gerekir.</p>:<div className="trendList">{Object.entries(trends).map(([subject,rows]:any)=><div key={subject} className="trendRow">
        <div className="trendLabel"><strong>{subject}</strong><span>Son net {rows[rows.length-1]?.net}</span></div>
        <div className="trendBars">{rows.slice(-10).map((x:any,i:number)=>{const max=Math.max(...rows.map((z:any)=>z.net),1);const h=Math.max(6,(x.net/max)*72);return <i key={i} title={new Date(x.date).toLocaleDateString('tr-TR')+' · '+x.net+' net'} style={{height:h}}/>})}</div>
      </div>)}</div>}
    </div>

    <div className="card reviewCard">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">YANLIŞ SORU TEKRARI</div><h2>0–1–3–7–14–28 tekrar kuyruğu</h2></div><span className="moduleIcon">↺</span></div>
      {reviews.length===0?<p className="muted">Tekrar kuyruğunda soru yok.</p>:<div className="reviewList">{reviews.slice(0,10).map((x:any)=><article key={x.id} className="reviewItem">
        <div className="reviewItemHead"><div><strong>{x.question.subject} · {x.question.topic}</strong><span>Aşama {x.stepIndex} · {new Date(x.dueAt).toLocaleDateString('tr-TR')}</span></div>{new Date(x.dueAt)<=new Date()&&<span className="pill">Bugün</span>}</div>
        {x.question.imageUrl&&<div className="reviewQuestionImage"><Image src={x.question.imageUrl} alt="Tekrar edilecek yanlış soru" width={720} height={480} unoptimized/></div>}
        <p>{x.question.prompt}</p>
        {new Date(x.dueAt)<=new Date()&&(x.question.inputMode==='TEXT'
          ? <div className="reviewTextAnswer">
              <input value={reviewAnswers[x.id]||''} onChange={e=>setReviewAnswers(v=>({...v,[x.id]:e.target.value}))} placeholder="Cevabını yaz"/>
              <button className="btn primary" disabled={!String(reviewAnswers[x.id]||'').trim()} onClick={()=>review(x.id,String(reviewAnswers[x.id]||'').trim())}>Cevabı Kontrol Et</button>
            </div>
          : <div className="answerGrid">{Object.entries(x.question.options||{}).map(([key,val]:any)=><button key={key} className="btn" onClick={()=>review(x.id,key)}><strong>{key})</strong> {val}</button>)}</div>)}
      </article>)}</div>}
    </div>
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
  </div>;
}
