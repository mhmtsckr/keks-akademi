'use client';

import {useEffect,useState} from 'react';

const sourceLabel:Record<string,string>={
  ACTION:'Görev',
  REVIEW:'Tekrar',
  ROUTINE:'Rutin',
  MICRO:'Mikro tekrar'
};

function masteryLabel(v:string){
  return v==='NEW'?'Yeni'
    :v==='LEARNING'?'Öğreniliyor'
    :v==='REINFORCING'?'Pekiştiriliyor'
    :v==='DURABLE'?'Kalıcı'
    :v==='RISKY'?'Riskli':'—';
}

export function StudentTodayPlan(){
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');

  async function load(){
    const r=await fetch('/api/student/today',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||'Bugünün planı hazırlanamadı.');return}
    setData(j);setMsg('');
  }

  useEffect(()=>{void load()},[]);

  if(msg)return <div className="notice error">{msg}</div>;
  if(!data)return <div className="card"><div className="moduleEyebrow">BUGÜNÜN PLANI</div><h2>Plan hazırlanıyor…</h2><p className="muted">KEKS son çalışma kayıtlarını ve tekrar kuyruğunu değerlendiriyor.</p></div>;

  const today=data.today||{};
  const capacity=today.capacity||{};
  const plan=today.plan||[];
  const unfinished=plan.filter((x:any)=>!x.completed);
  const goal=data.goal;
  const weakest=(data.mastery||[]).slice(0,5);

  return <div className="stack">
    <div className="card todayLearningPlan">
      <div className="moduleHeaderRow">
        <div>
          <div className="moduleEyebrow">BUGÜNÜN PLANI</div>
          <h2>{unfinished.length?unfinished.length+' adım kaldı':'Bugünkü plan tamamlandı'}</h2>
          <p className="muted">Sadece sıradaki işi yap. Plan; tekrar zamanı, konu durumu ve gerçek çalışma kapasitesine göre sıralandı.</p>
        </div>
        <span className="pill">≈ {today.plannedMinutes||0} dk</span>
      </div>

      {unfinished.length===0
        ?<div className="notice">Bugünkü zorunlu plan tamamlandı. İstersen mikro tekrar veya yanlış soru bankasından kısa çalışma yapabilirsin.</div>
        :<div className="stack">
          {unfinished.map((item:any,index:number)=><div className="card" key={item.id} style={{margin:0}}>
            <div className="moduleHeaderRow">
              <div>
                <div className="moduleEyebrow">{index===0?'ŞİMDİ':'SONRA'} · {sourceLabel[item.source]||item.source}</div>
                <strong>{item.title}</strong>
                <div className="muted">{item.targetValue} {item.metricType==='QUESTIONS'?'soru':item.metricType==='MINUTES'?'dk':''} · yaklaşık {item.estimatedMinutes} dk</div>
              </div>
              <span className="pill">#{index+1}</span>
            </div>
            <details>
              <summary>Program neden böyle?</summary>
              <p className="muted">{item.why}</p>
            </details>
          </div>)}
        </div>}

      {(today.notifications||[]).length>0&&<div style={{marginTop:14}}>
        {(today.notifications||[]).map((n:string,i:number)=><div className="notice" key={i}>{n}</div>)}
      </div>}
    </div>

    <details className="card">
      <summary>KEKS planı hangi veriye göre hazırladı?</summary>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',marginTop:14}}>
        <div className="card"><div className="moduleEyebrow">GERÇEK KAPASİTE</div><strong>{capacity.actualAverageMinutes??'—'} dk/gün</strong><p className="muted">Planlanan: {capacity.plannedMinutes??'—'} dk · Önerilen: {capacity.suggestedDailyMinutes??'—'} dk</p></div>
        <div className="card"><div className="moduleEyebrow">VERİMLİ SAAT</div><strong>{capacity.bestWindow||'Henüz ölçülmedi'}</strong><p className="muted">Kanıt günü: {capacity.evidenceDays||0} · Güven: {capacity.confidence||'LOW'}</p></div>
        <div className="card"><div className="moduleEyebrow">SORU KAPASİTESİ</div><strong>{capacity.questionCapacity??'—'} soru/gün</strong><p className="muted">Gerçek teslimlerden hesaplanır.</p></div>
      </div>
      {goal&&<div className="notice" style={{marginTop:12}}>
        <strong>Hedef mesafesi:</strong> {goal.target}
        <div className="muted">Mevcut: {goal.currentPerformance??'—'} · Hedef ölçüt: {goal.targetValue??'—'} · Fark: {goal.gap??'—'} · Açık konu tahmini: {goal.estimatedOpenTopics}</div>
      </div>}
      {data.examReport&&<div className="card" style={{marginTop:12}}>
        <div className="moduleEyebrow">DENEME SONRASI OTOMATİK RAPOR</div>
        <strong>{data.examReport.examType}</strong>
        <p>Değişim: {data.examReport.overall?.delta==null?'Karşılaştırma için önceki deneme yok':(data.examReport.overall.delta>=0?'+':'')+data.examReport.overall.delta}</p>
        {data.examReport.biggestGain&&<p className="muted">En fazla kazanç: {data.examReport.biggestGain.subject} · {data.examReport.biggestGain.delta>0?'+':''}{data.examReport.biggestGain.delta}</p>}
        {data.examReport.biggestLoss&&<p className="muted">En fazla kayıp: {data.examReport.biggestLoss.subject} · {data.examReport.biggestLoss.delta}</p>}
        <p className="muted">{data.examReport.timeSignal?.message}</p>
        {data.examReport.sevenDayPlan?.length>0&&<details><summary>7 günlük müdahale planı</summary>{data.examReport.sevenDayPlan.map((x:any,i:number)=><div key={i}>Gün {x.day}: {x.subject}{x.topic?' · '+x.topic:''} — {x.task}</div>)}</details>}
      </div>}
      {weakest.length>0&&<div style={{marginTop:12}}>
        <strong>Bilgi hâkimiyeti odağı</strong>
        <div className="stack" style={{marginTop:8}}>
          {weakest.map((x:any)=><div className="row" key={x.subject+'|'+x.topic} style={{justifyContent:'space-between'}}>
            <span>{x.subject} · {x.topic}</span><span className="pill">{masteryLabel(x.status)} · %{x.accuracy}</span>
          </div>)}
        </div>
      </div>}
    </details>
  </div>;
}
