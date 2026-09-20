'use client';

import { useEffect,useState } from 'react';

export function CoachPreInterviewSummary({studentId}:{studentId:string}){
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState('');

  async function load(){
    const r=await fetch('/api/coach/students/'+studentId+'/pre-interview');
    const j=await r.json();
    setData(j);
  }
  useEffect(()=>{load()},[studentId]);

  async function act(action:string,assignmentId?:string){
    setBusy(action+(assignmentId||''));setMsg('');
    const r=await fetch('/api/coach/students/'+studentId+'/pre-interview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(assignmentId?{action,assignmentId}:{action})});
    const j=await r.json();setBusy('');
    if(!r.ok)return setMsg('Hata: '+(j.error||'İşlem başarısız.'));
    if(action==='assign')setMsg('Ön görüşme formu öğrenci panelinde açıldı.');
    if(action==='approve')setMsg('Onaylandı. Rapor öğrenciye gönderildi ve 28 günlük kişisel görev planı aktifleştirildi.');
    if(action==='reopen')setMsg('Form yeniden doldurulmak üzere öğrenciye açıldı.');
    if(action==='revoke')setMsg('Form erişimi kapatıldı.');
    await load();
  }

  if(!data)return <div className="card"><p className="muted">Ön görüşme yönetimi yükleniyor…</p></div>;

  const current=data.assignments?.[0];
  return <div className="stack">
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    <div className="card">
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">ÖN GÖRÜŞME KONTROLÜ</div><h2>Formu Öğrenciye Aç / Kapat</h2><p className="muted">{data.activeForm?data.activeForm.title+' · '+data.activeForm.questions.length+' soru':'Aktif form bulunmuyor.'}</p></div>
        <div className="row">
          <button className="btn primary" disabled={!data.activeForm||busy==='assign'} onClick={()=>act('assign')}>{busy==='assign'?'Açılıyor…':'Öğrenciye Aç'}</button>
          {current&&['ASSIGNED','COMPLETED'].includes(current.status)&&<button className="btn" onClick={()=>act('revoke',current.id)}>Erişimi Kapat</button>}
        </div>
      </div>
      {current&&<div className="interviewStatusBar">
        <span className={'adminStatus '+(current.status==='APPROVED'?'active':current.status==='COMPLETED'?'pending':'')}>{current.status}</span>
        <span>Atama: {new Date(current.assignedAt).toLocaleString('tr-TR')}</span>
        {current.completedAt&&<span>Tamamlanma: {new Date(current.completedAt).toLocaleString('tr-TR')}</span>}
      </div>}
    </div>

    {(data.assignments||[]).map((a:any)=>{
      const attempt=a.attempt; if(!attempt)return <div className="card" key={a.id}><div className="moduleEyebrow">ÖĞRENCİ BEKLENİYOR</div><h3>{a.form.title}</h3><p className="muted">Öğrenci henüz formu tamamlamadı.</p></div>;
      const scores=attempt.scores||{},report=attempt.report||{},answers=attempt.answers||{};
      return <div className={'card interviewReviewCard '+(a.status==='COMPLETED'?'awaitingApproval':'')} key={a.id}>
        <div className="moduleHeaderRow"><div><div className="moduleEyebrow">{a.status==='COMPLETED'?'KOÇ ONAYI BEKLİYOR':'ÖN GÖRÜŞME DEĞERLENDİRMESİ'}</div><h2>{a.form.title}</h2><p className="muted">{new Date(attempt.completedAt).toLocaleString('tr-TR')} · Alan: {String(attempt.academicTrack).replace('_',' ')}</p></div><span className="pill">{attempt.reviewStatus}</span></div>
        <div className="interviewScoreGrid">{Object.entries(scores).map(([k,v])=><div className="briefMetric" key={k}><b>{Number(v).toFixed(2)}</b><span>{k}</span></div>)}</div>
        {report.weakest?.length>0&&<div className="notice"><strong>Öncelikli gelişim alanları:</strong> {report.weakest.map((x:any)=>x.dimension+' '+x.score+'/5').join(' · ')}</div>}
        {report.recommendations?.length>0&&<div className="briefAgenda"><h3>Değerlendirme / Koçluk Önerileri</h3>{report.recommendations.map((x:string,i:number)=><div key={i}><span>{i+1}</span><p>{x}</p></div>)}</div>}
        <div className="interviewAnswers"><h3>Soru – Cevap Dökümü</h3>{(a.form.questions||[]).map((q:any)=><div className="interviewAnswerRow" key={q.id}><div><span>{q.orderNo}</span><strong>{q.prompt}</strong><small>{q.dimension}</small></div><p>{String(answers[q.id]??'—')}</p></div>)}</div>
        {a.status==='COMPLETED'&&<div className="coachApprovalBox">
          <div><strong>Öğrenci bu raporu henüz görmüyor.</strong><p>Onay verirseniz değerlendirme öğrenciye açılır ve alanına özgü 28 günlük görev planı oluşturulur.</p></div>
          <div className="row"><button className="btn" onClick={()=>act('reopen',a.id)}>Yeniden Doldurt</button><button className="btn primary" disabled={busy==='approve'+a.id} onClick={()=>act('approve',a.id)}>{busy==='approve'+a.id?'Yayınlanıyor…':'Öğrenciye Gönder ve Planı Aktifleştir'}</button></div>
        </div>}
        {a.status==='APPROVED'&&<div className="notice"><strong>Yayınlandı.</strong> Öğrenci raporu görebilir ve 28 günlük kişisel görev planı aktiftir.</div>}
      </div>;
    })}
  </div>;
}
