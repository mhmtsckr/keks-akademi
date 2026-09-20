export function CoachPreInterviewSummary({attempts}:{attempts:any[]}){
  if(!attempts?.length)return <div className="card"><div className="moduleEyebrow">ÖN GÖRÜŞME</div><h2>Henüz tamamlanmadı</h2><p className="muted">Öğrenci kişilik/eğilim taraması sonrasında ön görüşme formunu tamamladığında rapor burada açılır.</p></div>;
  return <div className="stack">{attempts.map((a:any)=>{
    const scores=a.scores||{};const report=a.report||{};const answers=a.answers||{};
    return <div className="card" key={a.id}>
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">ÖN GÖRÜŞME DEĞERLENDİRMESİ</div><h2>{a.form?.title||'Ön Görüşme'}</h2><p className="muted">{new Date(a.completedAt).toLocaleString('tr-TR')} · Alan: {String(a.academicTrack).replace('_',' ')}</p></div><span className="pill">{a.form?.version}</span></div>
      <div className="interviewScoreGrid">{Object.entries(scores).map(([k,v])=><div className="briefMetric" key={k}><b>{Number(v).toFixed(2)}</b><span>{k}</span></div>)}</div>
      {report.weakest?.length>0&&<div className="notice"><strong>Öncelikli gelişim alanları:</strong> {report.weakest.map((x:any)=>x.dimension+' '+x.score+'/5').join(' · ')}</div>}
      {report.recommendations?.length>0&&<div className="briefAgenda"><h3>Koçluk önerileri</h3>{report.recommendations.map((x:string,i:number)=><div key={i}><span>{i+1}</span><p>{x}</p></div>)}</div>}
      <div className="interviewAnswers"><h3>Soru – Cevap Dökümü</h3>{(a.form?.questions||[]).map((q:any)=><div className="interviewAnswerRow" key={q.id}><div><span>{q.orderNo}</span><strong>{q.prompt}</strong><small>{q.dimension}</small></div><p>{String(answers[q.id]??'—')}</p></div>)}</div>
    </div>
  })}</div>;
}
