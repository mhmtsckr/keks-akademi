'use client';

import {useEffect,useState} from 'react';

export function CoachInterventionLearning(){
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState('');
  useEffect(()=>{void (async()=>{
    const r=await fetch('/api/coach/intervention-patterns',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok){setError(j.error||'Müdahale etkisi yüklenemedi.');return}
    setData(j.learning);
  })()},[]);

  return <div className="card">
    <div className="moduleEyebrow">KOÇLUK MÜDAHALELERİNDEN ÖĞRENME</div>
    <h2>Hangi koçluk kararları hangi değişimlerle birlikte görülüyor?</h2>
    <p className="muted">KEKS, koç kararından önceki ve sonraki 3 haftayı karşılaştırır. Sonuçlar gözlemseldir; nedensellik kanıtı olarak sunulmaz.</p>
    {error&&<div className="notice error">{error}</div>}
    {!data&&!error&&<p className="muted">Müdahale örüntüleri hazırlanıyor…</p>}
    {data&&<>
      <div className="notice"><strong>{data.totalMeasuredInterventions}</strong> ölçülebilir müdahale örneği analiz edildi.</div>
      {!data.patterns?.length?<p className="muted">Henüz yeterli müdahale öncesi/sonrası soru verisi yok.</p>:<div className="stack" style={{marginTop:12}}>
        {data.patterns.slice(0,8).map((x:any)=><div className="card" key={x.kind} style={{margin:0}}>
          <div className="moduleHeaderRow">
            <strong>{x.label}</strong>
            <span className="pill">{x.confidence==='GÜÇLÜ'?'Güçlü veri':x.confidence==='ORTA'?'Orta veri':'Erken sinyal'}</span>
          </div>
          <p>
            {x.avgAccuracyDelta==null?'Doğruluk karşılaştırması yok':'Ortalama doğruluk değişimi '+(x.avgAccuracyDelta>0?'+':'')+x.avgAccuracyDelta+' puan'}
            {' · '}Ortalama boş değişimi {x.avgBlankDelta>0?'+':''}{x.avgBlankDelta}
          </p>
          <small className="muted">{x.cases} müdahale · {x.evidenceQuestions} soru kanıtı · {x.note}</small>
        </div>)}
      </div>}
    </>}
  </div>;
}
