export function StudentExamInterventionReport({report}:{report:any}){
  if(!report)return <div className="card"><div className="moduleEyebrow">OTOMATİK DENEME RAPORU</div><h2>Henüz deneme raporu yok</h2><p className="muted">İlk deneme kaydından sonra analiz burada otomatik oluşacak.</p></div>;

  const delta=report.overall?.delta;
  return <div className="card">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">DENEME SONRASI OTOMATİK RAPOR</div>
        <h2>{report.examType} · {new Date(report.createdAt).toLocaleDateString('tr-TR')}</h2>
        <p className="muted">Aynı sınav türündeki önceki denemeye göre karşılaştırma ve 7 günlük müdahale planı.</p>
      </div>
      <span className="pill">OTOMATİK</span>
    </div>

    <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))'}}>
      <div className="card" style={{margin:0}}>
        <small className="muted">Önceki denemeye göre</small>
        <div className="kpi">{delta==null?'—':(delta>0?'+':'')+delta}</div>
        <span>{delta==null?'Karşılaştırılabilir önceki deneme yok':'net/puan değişimi'}</span>
      </div>
      <div className="card" style={{margin:0}}>
        <small className="muted">En fazla net kazandıran ders</small>
        <div className="kpi">{report.biggestGain?.subject||'—'}</div>
        <span>{report.biggestGain?('+'+report.biggestGain.delta+' net'):'Artış sinyali yok'}</span>
      </div>
      <div className="card" style={{margin:0}}>
        <small className="muted">En fazla kayıp</small>
        <div className="kpi">{report.biggestLoss?.subject||'—'}</div>
        <span>{report.biggestLoss?(report.biggestLoss.delta+' net'):'Kayıp sinyali yok'}</span>
      </div>
      <div className="card" style={{margin:0}}>
        <small className="muted">Süre durumu</small>
        <div className="kpi">{report.timeSignal?.problem===true?'MÜDAHALE':report.timeSignal?.problem===false?'NORMAL':'—'}</div>
        <span>{report.timeSignal?.averageSeconds!=null?report.timeSignal.averageSeconds+' sn/soru':'Süre verisi yok'}</span>
      </div>
    </div>

    <div className="grid" style={{gridTemplateColumns:'1fr 1fr',marginTop:16}}>
      <div className="card" style={{margin:0}}>
        <div className="moduleEyebrow">KONU BAZLI AÇIKLAR</div>
        {!report.topicGaps?.length?<p className="muted">Riskli/öğrenilen konu sinyali yok.</p>:report.topicGaps.map((x:any)=><div key={x.subject+x.topic} style={{marginBottom:10}}>
          <strong>{x.subject} · {x.topic}</strong>
          <div className="muted">{x.status==='RISKY'?'Riskli':'Öğreniliyor'} · Hâkimiyet {x.score}/100{x.accuracy==null?'':' · doğruluk %'+x.accuracy}</div>
        </div>)}
      </div>

      <div className="card" style={{margin:0}}>
        <div className="moduleEyebrow">SÜRE ANALİZİ</div>
        <p>{report.timeSignal?.message}</p>
        {report.timeSignal?.usedSeconds!=null&&<p className="muted">Kullanılan süre: {Math.round(report.timeSignal.usedSeconds/60)} dk{report.timeSignal.allowedSeconds!=null?' / '+Math.round(report.timeSignal.allowedSeconds/60)+' dk':''}</p>}
      </div>
    </div>

    <div style={{marginTop:16}}>
      <div className="moduleEyebrow">BİR SONRAKİ 7 GÜNLÜK MÜDAHALE PLANI</div>
      <div className="stack">
        {report.sevenDayPlan?.map((x:any,i:number)=><div className="card" key={i} style={{margin:0}}>
          <div className="moduleHeaderRow"><strong>{x.day}. Gün · {x.subject}</strong>{x.topic&&<span className="pill">{x.topic}</span>}</div>
          <p>{x.task}</p><small className="muted">{x.reason}</small>
        </div>)}
      </div>
    </div>

    <div className="notice" style={{marginTop:16}}>{report.note}</div>
  </div>;
}
