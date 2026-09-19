'use client';
import { useEffect,useState } from 'react';

export function AdaptiveRecommendation(){
  const [data,setData]=useState<any>(null);
  useEffect(()=>{fetch('/api/student/adaptive').then(r=>r.json()).then(j=>{if(j.ok)setData(j.recommendation)}).catch(()=>{})},[]);
  if(!data) return <div className="card studentFocusCard"><div className="moduleEyebrow">AKILLI ÖNERİ</div><h2>Şimdi Ne Çalışmalıyım?</h2><p className="muted">Öneri hazırlanıyor…</p></div>;
  return <div className="card studentFocusCard">
    <div className="moduleEyebrow">SIRADAKİ EN DOĞRU ADIM</div>
    <div className="moduleHeaderRow">
      <div><h2>Şimdi Ne Çalışmalıyım?</h2><p className="muted">Son performansına göre öncelikli çalışma önerisi.</p></div>
      <span className="moduleIcon">↗</span>
    </div>
    <div className="focusRecommendation"><strong>{data.subject||'Genel tekrar'}{data.topic?' · '+data.topic:''}</strong><p>{data.reason}</p><span>Önerilen kısa test · {data.suggestedQuestionCount} soru</span></div>
    {data.subject&&<a className="btn primary" href="/ogrenci/testler">Önerilen Teste Git</a>}
  </div>;
}
