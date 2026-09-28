'use client';

import {useEffect,useState} from 'react';

export function CoachResourceSummary({studentId}:{studentId:string}){
  const [resources,setResources]=useState<any[]>([]);
  const [msg,setMsg]=useState('');

  useEffect(()=>{void (async()=>{
    const r=await fetch('/api/coach/students/'+studentId+'/resources',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||'Kaynak takibi yüklenemedi.');return}
    setResources(j.resources||[]);
  })()},[studentId]);

  return <div className="card">
    <div className="moduleEyebrow">KAYNAK TAKİBİ</div>
    <h2>Kitap ve kaynak kullanım verisi</h2>
    <p className="muted">Amaç daha çok kaynak kullandırmak değil; öğrencinin bir kaynakta gereksiz yere oyalanıp oyalanmadığını ve çalışma çıktısını görmek.</p>
    {msg&&<div className="notice error">{msg}</div>}
    {resources.length===0?<p className="muted">Öğrenci henüz kaynak eklemedi.</p>:<div className="stack">{resources.map(r=><div className="card" key={r.id} style={{margin:0}}>
      <div className="moduleHeaderRow">
        <div><strong>{r.title}</strong><div className="muted">{r.examType} · {r.subject}{r.currentPage?' · s. '+r.currentPage:''}</div></div>
        <span className="pill">{r.efficiency?.label||'—'}</span>
      </div>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))'}}>
        <div><small className="muted">Toplam soru</small><div><strong>{r.questions}</strong></div></div>
        <div><small className="muted">Genel doğruluk</small><div><strong>{r.accuracy==null?'—':'%'+r.accuracy}</strong></div></div>
        <div><small className="muted">Çalışılan sayfa</small><div><strong>{r.efficiency?.pagesStudied??'—'}</strong></div></div>
        <div><small className="muted">Aktif gün</small><div><strong>{r.efficiency?.activeDays??'—'}</strong></div></div>
        <div><small className="muted">Soru / sayfa</small><div><strong>{r.efficiency?.questionsPerPage??'—'}</strong></div></div>
        <div><small className="muted">Son doğruluk</small><div><strong>{r.efficiency?.recentAccuracy==null?'—':'%'+r.efficiency.recentAccuracy}</strong></div></div>
      </div>

      {r.efficiency?.accuracyDelta!=null&&<p className="muted">Doğruluk trendi: %{r.efficiency.previousAccuracy} → %{r.efficiency.recentAccuracy} ({r.efficiency.accuracyDelta>0?'+':''}{r.efficiency.accuracyDelta} puan)</p>}

      {r.efficiency?.status!=='NORMAL'&&r.efficiency?.status!=='NEW'&&<div className="notice">
        <strong>{r.efficiency.status==='REVIEW'?'Kaynak kullanımını gözden geçir':'Kaynağı izle'}</strong>
        {(r.efficiency.reasons||[]).map((x:string,i:number)=><p key={i} style={{margin:'6px 0'}}>• {x}</p>)}
        {r.efficiency.suggestedCoachAction&&<p><strong>Önerilen koç aksiyonu:</strong> {r.efficiency.suggestedCoachAction}</p>}
      </div>}

      {r.recentEntries?.length>0&&<details style={{marginTop:10}}>
        <summary>Konu ve sayfa kayıtlarını incele</summary>
        <div className="stack" style={{marginTop:8}}>
          {r.recentEntries.map((x:any)=>{
            const acc=x.questions?Math.round(x.correct/x.questions*100):null;
            return <div className="row" key={x.id} style={{justifyContent:'space-between',gap:12}}>
              <span>{new Date(x.date).toLocaleDateString('tr-TR')} · {x.topic||'Genel'} · s. {x.pageStart||'—'}–{x.pageEnd||'—'}</span>
              <span>{x.questions} soru · {acc==null?'—':'%'+acc} doğruluk</span>
            </div>
          })}
        </div>
      </details>}
    </div>)}</div>}
  </div>;
}
