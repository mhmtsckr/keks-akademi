'use client';

import {useEffect,useState} from 'react';

function metricText(action:any){
  if(!action)return '';
  if(action.metricType==='QUESTIONS')return action.targetValue+' soru';
  if(action.metricType==='REVIEWS')return action.targetValue+' tekrar';
  if(action.metricType==='MINUTES')return action.targetValue+' dk';
  return String(action.targetValue||'');
}

export function StudentActionHub(){
  const [hub,setHub]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(true);

  async function load(){
    setBusy(true);setMsg('');
    try{
      const r=await fetch('/api/student/action-hub',{method:'POST',cache:'no-store',credentials:'include'});
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'Bugünkü aksiyon hazırlanamadı.'));
      setHub(j.hub||null);
    }finally{setBusy(false)}
  }

  useEffect(()=>{void load()},[]);

  if(busy&&!hub)return <div className="card"><div className="moduleEyebrow">BUGÜN NE YAPACAĞIM?</div><h2>KEKS sıradaki doğru aksiyonu hazırlıyor…</h2></div>;
  if(msg&&!hub)return <div className="notice error">{msg}</div>;
  if(!hub)return null;

  const action=hub.nextAction;
  const first7=hub.firstSevenDays||{};
  return <div className="stack">
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}

    <div className="card todayMissionCard">
      <div className="moduleHeaderRow">
        <div>
          <div className="moduleEyebrow">SONRAKİ EN DOĞRU AKSİYON</div>
          <h2>{action? action.title : 'Bugünkü plan tamamlandı'}</h2>
          <p className="muted">{action? action.why : 'Yeni görev eklenmiyor. Tamamlanan çalışmalar ve tekrar sonuçları sonraki planı besleyecek.'}</p>
        </div>
        {action&&<span className="pill">{action.badge}</span>}
      </div>

      {action?.masteryStatus==='RISKY'&&<div className="notice error" style={{marginTop:10}}>
        <strong>Riskli çünkü:</strong> {(action.masteryRiskReasons||[]).slice(0,2).join(' ')||'Konuya ait test, tekrar, hız veya unutma sinyalleri zayıf.'}
        <div className="row" style={{flexWrap:'wrap',gap:8,marginTop:8}}>
          {action.forgettingRiskScore!=null&&<span className="pill">Unutma riski {action.forgettingRiskScore}/100</span>}
          {action.avgSecondsPerQuestion!=null&&<span className="pill">{Math.round(action.avgSecondsPerQuestion)} sn/soru{action.targetSecondsPerQuestion?' · hedef '+Math.round(action.targetSecondsPerQuestion)+' sn':''}</span>}
          {action.primaryErrorReasonLabel&&<span className="pill">Yanlış nedeni: {action.primaryErrorReasonLabel}</span>}
          {action.resourceEfficiencyStatus&&<span className="pill">Kaynak: {action.resourceEfficiencyStatus}</span>}
        </div>
      </div>}

      {action&&<div className="todayMissionStats">
        <div><b>{action.estimatedMinutes}</b><span>yaklaşık dk</span></div>
        <div><b>{metricText(action)}</b><span>hedef</span></div>
        <div><b>{hub.today.remainingTasks}</b><span>görev kaldı</span></div>
      </div>}

      <div className="row" style={{marginTop:14,flexWrap:'wrap'}}>
        {action&&<a className="btn primary" href={action.executionTarget}>{action.ctaLabel}</a>}
        <button className="btn" type="button" onClick={()=>void load()} disabled={busy}>{busy?'Güncelleniyor…':'Planı Güncelle'}</button>
      </div>
    </div>

    <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
      <div className="card" style={{margin:0}}><div className="kpi">{hub.today.completedTasks}/{hub.today.totalTasks}</div><div className="muted">Bugün tamamlanan</div></div>
      <div className="card" style={{margin:0}}><div className="kpi">{hub.today.dueReviews}</div><div className="muted">Gecikmiş tekrar</div></div>
      <div className="card" style={{margin:0}}><div className="kpi">{hub.today.remainingMinutes}</div><div className="muted">Kalan yaklaşık dakika</div></div>
      <div className="card" style={{margin:0}}><div className="kpi">{hub.today.wrongQuestionCount}</div><div className="muted">Kişisel yanlış soru</div></div>
    </div>

    {first7.status!=='NOT_STARTED'&&<div className="card">
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">İLK 7 GÜN · GERÇEK KAPASİTE ÖĞRENİLİYOR</div><h3>{first7.active?first7.day+'. gün':'Başlangıç kalibrasyonu tamamlandı'}</h3></div>
        <span className="pill">%{first7.taskCompletionRate} görev tamamlama</span>
      </div>
      <p>{first7.message}</p>
      <div className="row" style={{flexWrap:'wrap'}}>
        <span className="pill">Gerçek ortalama: {first7.actualAverageMinutes||0} dk</span>
        <span className="pill">Planlanan: {first7.plannedDailyMinutes||0} dk</span>
        <span className="pill">Gözlenen gün: {first7.observedStudyDays||0}</span>
        <span className="pill">Önerilen günlük kapasite: {hub.capacity.suggestedDailyMinutes} dk</span>
      </div>
    </div>}

    {hub.rebalance.redistributedTasks>0&&<div className="notice">
      <strong>Akıllı yeniden dağıtım:</strong> {hub.rebalance.redistributedTasks} gecikmiş görev gerçek kapasiteye göre ileri günlere dengeli dağıtıldı.
    </div>}
    {hub.rebalance.deferredTasks>0&&<div className="notice error">
      <strong>Koç değerlendirmesi gerekiyor:</strong> {hub.rebalance.deferredTasks} görev güvenli kapasite içine sığmadı; KEKS yükü tek güne yığmadı.
    </div>}
  </div>;
}
