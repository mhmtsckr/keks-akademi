'use client';

import { useEffect,useMemo,useState } from 'react';

function pctWidth(v:number|null){return Math.max(0,Math.min(100,v??0))+'%';}

export function SmartCoachDashboard(){
  const [metrics,setMetrics]=useState<any>(null);
  const [plan,setPlan]=useState<any>(null);
  const [reviews,setReviews]=useState<any[]>([]);
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

  async function review(id:string,correct:boolean){
    const r=await fetch('/api/student/reviews',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,correct})});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Tekrar güncellenemedi.'));return}
    setMsg(correct?'Doğru: bir sonraki tekrar tarihi planlandı.':'Yanlış: tekrar döngüsü 0. güne alındı.');
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

  return <div className="stack">
    <div className="grid">
      <div className="card">
        <h2>Hedefe Yaklaşma</h2>
        <div className="kpi">{metrics?.goal?.percent==null?'—':'%'+metrics.goal.percent}</div>
        <p className="muted">{metrics?.goal?.label||'Hedef verisi bekleniyor'}</p>
        <div style={{height:12,background:'#eef2f6',borderRadius:999,overflow:'hidden'}}><div style={{height:'100%',width:pctWidth(metrics?.goal?.percent??0),background:'var(--brand)'}}/></div>
        {(metrics?.goal?.details||[]).map((x:string)=><div className="muted" key={x}>{x}</div>)}
      </div>

      <div className="card">
        <h2>Akıllı Haftalık Program</h2>
        <p className="muted">Zayıf dersler, tamamlanmamış konular ve tekrar kuyruğuna göre otomatik oluşturulur.</p>
        <button className="btn primary" onClick={savePlan}>Bu Haftanın Programını Oluştur</button>
      </div>

      <div className="card">
        <h2>Bugünkü Tekrarlar</h2>
        <div className="kpi">{reviews.filter(x=>new Date(x.dueAt)<=new Date()).length}</div>
        <p className="muted">0–1–3–7–14–28 tekrar sistemindeki vadesi gelen yanlış soru.</p>
      </div>
    </div>

    {plan&&<div className="card"><h2>7 Günlük Akıllı Plan</h2><div className="grid">{plan.days.map((d:any)=><div className="card" key={d.date}><strong>{new Date(d.date).toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'short'})}</strong>{d.tasks.length===0?<p className="muted">Dinlenme / telafi</p>:d.tasks.map((t:any,i:number)=><div key={i} style={{marginTop:10}}><span className="pill">{t.type}</span><div>{t.title}</div><div className="muted">{t.duration} dk{t.questions?' · '+t.questions+' soru':''}</div></div>)}</div>)}</div></div>}

    <div className="card">
      <h2>Ders Bazlı Net Trendleri</h2>
      {Object.keys(trends).length===0?<p className="muted">Trend oluşturmak için en az iki deneme/net kaydı gerekir.</p>:Object.entries(trends).map(([subject,rows]:any)=><div key={subject} style={{marginBottom:18}}>
        <strong>{subject}</strong>
        <div style={{display:'flex',alignItems:'end',gap:6,height:90,marginTop:8,borderBottom:'1px solid var(--line)'}}>
          {rows.slice(-10).map((x:any,i:number)=>{const max=Math.max(...rows.map((z:any)=>z.net),1);const h=Math.max(4,(x.net/max)*80);return <div key={i} title={new Date(x.date).toLocaleDateString('tr-TR')+' · '+x.net+' net'} style={{flex:1,maxWidth:34,height:h,background:'var(--brand)',borderRadius:'6px 6px 0 0'}}/>})}
        </div>
        <div className="muted">Son {Math.min(rows.length,10)} kayıt · Son net: {rows[rows.length-1]?.net}</div>
      </div>)}
    </div>

    <div className="card">
      <h2>Yanlış Soru Tekrar Sistemi</h2>
      {reviews.length===0?<p className="muted">Tekrar kuyruğunda soru yok. Yanlış yaptığın test soruları otomatik buraya gelir.</p>:reviews.slice(0,12).map((x:any)=><article key={x.id} style={{padding:'14px 0',borderBottom:'1px solid var(--line)'}}>
        <strong>{x.question.subject} · {x.question.topic}</strong>
        <p>{x.question.prompt}</p>
        <div className="muted">Aşama: {x.stepIndex} · Tekrar tarihi: {new Date(x.dueAt).toLocaleDateString('tr-TR')}</div>
        {new Date(x.dueAt)<=new Date()&&<div className="row" style={{marginTop:8}}><button className="btn primary" onClick={()=>review(x.id,true)}>Doğru Hatırladım</button><button className="btn" onClick={()=>review(x.id,false)}>Yanlış / Unuttum</button></div>}
      </article>)}
    </div>
    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}
  </div>;
}
