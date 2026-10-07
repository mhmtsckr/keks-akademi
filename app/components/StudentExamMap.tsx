export function StudentExamMap({data}:{data:any}){
  if(!data)return null;
  return <div className="card">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">{data.framework==='TYMM'?'MAARİF MODELİ / ÖLÇÜM HARİTASI':'ÖSYM / MEB SINAV HARİTASI'}</div>
        <h2>Ders → Ünite → Konu → Alt konu → Kazanım → Soru tipi</h2>
        <p className="muted">{data.educationLevel?data.educationLevel+' · ':''}Tüm soru, deneme, süre ve hata verileri aynı akademik haritada birleştirilir.</p>
      </div>
      <span className="pill">{data.framework==='TYMM'?'DÜZEYE ÖZEL':'SINAV HARİTASI'}</span>
    </div>

    <div className="notice" style={{marginBottom:16}}>
      <strong>{data.headline}</strong>
    </div>

    {!data.weakest?.length?<p className="muted">Bir kazanımda en az 3 ayrı ölçüm oluştuğunda son üç ölçüm başarısı ve zayıf düğümler burada gösterilecek.</p>:<div className="stack">
      {data.weakest.map((x:any,i:number)=><div className="card" key={[x.educationLevelKey,x.examType,x.unit,x.subject,x.topic,x.subTopic,x.acquisitionId||x.acquisition].join('|')} style={{margin:0}}>
        <div className="moduleHeaderRow">
          <strong>{i+1}. {x.subject}</strong>
          <span className="pill">{x.status==='ZAYIF'?'Zayıf':x.status==='GELISIYOR'?'Gelişiyor':'Veri az'}</span>
        </div>
        <p><strong>{x.unit}</strong> → {x.topic} → {x.subTopic}</p>
        <p>{x.acquisitionId&&<strong>{x.acquisitionId} · </strong>}{x.acquisition}</p>
        <div className="row" style={{flexWrap:'wrap'}}>
          <span>Son 3 ölçüm: <strong>{x.last3MeasurementCount<3?'—':'%'+x.last3Accuracy}</strong></span>
          <span>Ölçüm: <strong>{x.measurementCount}</strong></span>
          <span>Son 3 kanıt: <strong>{x.last3Questions} soru</strong></span>
          <span>Soru tipleri: <strong>{(x.questionTypes||[]).join(', ')||'—'}</strong></span>
        </div>
      </div>)}
    </div>}

    <details style={{marginTop:16}}>
      <summary>Tüm ölçülen kazanımları göster</summary>
      <div className="stack" style={{marginTop:12}}>
        {(data.acquisitions||[]).slice(0,40).map((x:any)=><div key={[x.educationLevelKey,x.examType,x.unit,x.subject,x.topic,x.subTopic,x.acquisitionId||x.acquisition].join('|')} className="card" style={{margin:0}}>
          <strong>{x.subject} · {x.unit}</strong>
          <p>{x.topic} → {x.subTopic}</p>
          <p className="muted">{x.acquisitionId&&x.acquisitionId+' · '}{x.acquisition}</p>
          <small className="muted">{x.measurementCount} ölçüm · son 3 ölçüm {x.last3MeasurementCount<3?'henüz yetersiz':'%'+x.last3Accuracy} · soru tipi: {(x.questionTypes||[]).join(', ')}</small>
        </div>)}
      </div>
    </details>

    {data.curriculum?.subjects?.length>0&&<details style={{marginTop:16}}>
      <summary>Bu eğitim düzeyinin haritasını göster</summary>
      <div className="stack" style={{marginTop:12}}>
        {data.curriculum.subjects.map((subject:any)=><div className="card" key={subject.name} style={{margin:0}}>
          <strong>{subject.name}</strong>
          {(subject.units||[]).map((unit:any)=><div key={unit.name} style={{marginTop:10}}>
            <div><b>{unit.name}</b></div>
            <small className="muted">{(unit.topics||[]).map((topic:any)=>topic.name).join(' · ')}</small>
          </div>)}
        </div>)}
      </div>
    </details>}

    <div className="notice" style={{marginTop:16}}>{data.note}</div>
  </div>;
}
