'use client';

import { useEffect,useState } from 'react';

export function CoachPreInterviewSummary({studentId}:{studentId:string}){
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState('');

  async function load(){
    const r=await fetch('/api/coach/students/'+studentId+'/pre-interview',{cache:'no-store'});
    const j=await r.json();
    setData(j);
  }
  useEffect(()=>{load()},[studentId]);

  async function activate(assignmentId:string){
    setBusy(assignmentId);setMsg('');
    const r=await fetch('/api/coach/students/'+studentId+'/pre-interview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'approve',assignmentId})});
    const j=await r.json();setBusy('');
    if(!r.ok)return setMsg('Hata: '+(j.error||'Plan aktifleştirilemedi.'));
    setMsg('Yönetici onaylı 1 yıllık, aylık, haftalık ve günlük plan öğrenciye aktifleştirildi.');
    await load();
    setTimeout(()=>location.reload(),600);
  }

  if(!data)return <div className="card"><p className="muted">Yönetici onaylı değerlendirme akışı yükleniyor…</p></div>;
  const assignments=data.assignments||[];

  return <div className="stack">
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    <div className="card">
      <div className="moduleEyebrow">YÖNETİCİ ONAYLI KEKS AKIŞI</div>
      <h2>Eğilim Taraması → Ön Görüşme → Kişisel Plan</h2>
      <p className="muted">Ön görüşmeyi yönetici açar. Öğrenci tamamladıktan sonra yıllık, aylık, haftalık ve günlük plan yönetici tarafından onaylanır; yalnız onaylanmış plan koça gelir.</p>
    </div>

    {assignments.length===0&&<div className="card"><div className="notice">Henüz yönetici tarafından koça gönderilmiş veya öğrenciye açılmış bir ön görüşme süreci yok.</div></div>}

    {assignments.map((a:any)=>{
      const attempt=a.attempt;
      if(!attempt)return <div className="card" key={a.id}>
        <div className="moduleHeaderRow"><div><div className="moduleEyebrow">{a.status==='ASSIGNED'?'ÖĞRENCİ BEKLENİYOR':'SÜREÇ KAYDI'}</div><h3>{a.form.title}</h3><p className="muted">Yönetici eğilim taramasını onayladı. Öğrenci ön görüşmeyi henüz tamamlamadı.</p></div><span className="pill">{a.status}</span></div>
      </div>;

      if(a.status==='COMPLETED')return <div className="card" key={a.id}>
        <div className="moduleHeaderRow"><div><div className="moduleEyebrow">YÖNETİCİ İNCELEMESİNDE</div><h3>{a.form.title}</h3><p className="muted">Öğrenci ön görüşmeyi tamamladı. Ayrıntılı değerlendirme ve plan taslağı yönetici onayından geçmeden koça açılmaz.</p></div><span className="pill">BEKLEMEDE</span></div>
      </div>;
      const scores=attempt.scores||{},report=attempt.report||{},answers=attempt.answers||{},draft=report.planDraft||{};
      return <div className={'card interviewReviewCard '+(a.status==='ADMIN_APPROVED'?'awaitingApproval':'')} key={a.id}>
        <div className="moduleHeaderRow">
          <div><div className="moduleEyebrow">{a.status==='COMPLETED'?'YÖNETİCİ ONAYI BEKLİYOR':a.status==='ADMIN_APPROVED'?'YÖNETİCİ ONAYLADI · KOÇA GÖNDERİLDİ':a.status==='APPROVED'?'PLAN AKTİF':'ÖN GÖRÜŞME'}</div><h2>{a.form.title}</h2><p className="muted">{new Date(attempt.completedAt).toLocaleString('tr-TR')} · {a.form.educationBand}{attempt.academicTrack!=='GENERAL'?' · '+String(attempt.academicTrack).replaceAll('_',' '):''}</p></div>
          <span className="pill">{attempt.reviewStatus}</span>
        </div>

        {a.status==='COMPLETED'&&<div className="notice"><strong>Koç işlemi kapalı.</strong> Birleşik değerlendirme ve plan taslağı yönetici incelemesinde. Yönetici onayladıktan sonra aktifleştirme düğmesi açılır.</div>}

        <div className="interviewScoreGrid">{Object.entries(scores).map(([k,v])=><div className="briefMetric" key={k}><b>{Number(v).toFixed(2)}</b><span>{k}</span></div>)}</div>
        {report.weakest?.length>0&&<div className="notice"><strong>Programlama öncelikleri:</strong> {report.weakest.map((x:any)=>x.dimension+' '+x.score+'/5').join(' · ')}</div>}
        {report.screeningSummary?.leadingDimensions?.length>0&&<div className="notice"><strong>Eğilim taramasında öne çıkanlar:</strong> {report.screeningSummary.leadingDimensions.map((x:any)=>x.name+' '+Number(x.score).toFixed(2)+'/5').join(' · ')}</div>}
        {report.screeningSummary?.habitScores&&<><h3>Çalışma Alışkanlıkları</h3><div className="interviewScoreGrid">{Object.entries(report.screeningSummary.habitScores).map(([k,v]:any)=><div className="briefMetric" key={k}><b>{Number(v).toFixed(2)}</b><span>{k}</span></div>)}</div></>}
        {report.screeningSummary?.developmentSummary?.immediateActions?.length>0&&<div className="notice"><strong>Yönetici onaylı gelişim öncelikleri</strong>{report.screeningSummary.developmentSummary.immediateActions.map((x:string,i:number)=><div key={i}>{i+1}. {x}</div>)}</div>}
        {report.programParameters&&<div className="programParameterGrid">
          <div><b>{report.programParameters.focusBlockMinutes} dk</b><span>Önerilen odak bloğu</span></div>
          <div><b>{String(report.programParameters.taskSize).replaceAll('_',' ')}</b><span>Görev büyüklüğü</span></div>
          <div><b>{String(report.programParameters.coachCheckIn).replaceAll('_',' ')}</b><span>Koç kontrol sıklığı</span></div>
          <div><b>{report.programParameters.spacedReview?'Zorunlu':'Standart'}</b><span>Aralıklı tekrar</span></div>
        </div>}

        {draft.annual&&<div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
          <div className="card"><h3>1 Yıllık Plan</h3>{draft.annual.phases?.map((x:any)=><p key={x.phase}><strong>{x.phase}. Faz:</strong> {x.name} · Aylar {x.months?.join('-')}</p>)}</div>
          <div className="card"><h3>Aylık Plan</h3>{draft.monthly?.weeks?.map((x:string,i:number)=><p key={i}>{x}</p>)}</div>
        </div>}
        {draft.weekly&&<div className="card"><h3>Haftalık Plan</h3><p>{draft.weekly.goals?.join(' · ')}</p></div>}
        {draft.daily?.length>0&&<details><summary><strong>28 günlük görev taslağını görüntüle</strong></summary><div className="stack">{draft.daily.map((d:any)=><div className="card" key={d.date} style={{padding:12}}><strong>{new Date(d.date).toLocaleDateString('tr-TR')} · {d.subject}</strong><div className="muted">{d.durationMinutes} dk · {d.questions} soru · {d.method}</div></div>)}</div></details>}

        <details style={{marginTop:12}}><summary><strong>Ön görüşme soru – cevap dökümü</strong></summary><div className="interviewAnswers">{(a.form.questions||[]).map((q:any)=><div className="interviewAnswerRow" key={q.id}><div><span>{q.orderNo}</span><strong>{q.prompt}</strong><small>{q.dimension}</small></div><p>{String(answers[q.id]??'—')}</p></div>)}</div></details>

        {a.status==='ADMIN_APPROVED'&&<div className="coachApprovalBox">
          <div><strong>Yönetici planı onayladı.</strong><p>Planın içeriği yönetici onayından geçti. Koç olarak uygulama başlangıcını onayladığınızda dört plan öğrenci paneline ve ilk 28 günlük görevler günlük görev alanına aktarılır.</p></div>
          <button className="btn primary" disabled={busy===a.id} onClick={()=>activate(a.id)}>{busy===a.id?'Aktifleştiriliyor…':'Yönetici Onaylı Planı Öğrenciye Aktifleştir'}</button>
        </div>}
        {a.status==='APPROVED'&&<div className="notice"><strong>Aktif.</strong> Yönetici onaylı plan öğrenciye yayınlandı ve günlük görevler oluşturuldu.</div>}
      </div>;
    })}
  </div>;
}
