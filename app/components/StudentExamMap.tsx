export function StudentExamMap({data}:{data:any}){
  if(!data)return null;
  return <div className="card">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">ÖSYM / MEB SINAV HARİTASI</div>
        <h2>Ders → Konu → Alt konu → Kazanım → Soru tipi</h2>
        <p className="muted">Tüm soru, deneme, süre ve hata verileri aynı akademik haritada birleştirilir.</p>
      </div>
      <span className="pill">{data.exams?.length||0} sınav türü</span>
    </div>

    <div className="notice" style={{marginBottom:16}}>
      <strong>{data.headline}</strong>
    </div>

    {!data.weakest?.length?<p className="muted">En az 5 soruluk alt beceri kanıtı oluştuğunda zayıf düğümler burada listelenecek.</p>:<div className="stack">
      {data.weakest.map((x:any,i:number)=><div className="card" key={[x.examType,x.subject,x.topic,x.subTopic,x.acquisition,x.questionType].join('|')} style={{margin:0}}>
        <div className="moduleHeaderRow">
          <strong>{i+1}. {x.examType} · {x.subject}</strong>
          <span className="pill">{x.status==='ZAYIF'?'Zayıf':x.status==='GELISIYOR'?'Gelişiyor':'Veri az'}</span>
        </div>
        <p><strong>{x.topic}</strong> → {x.subTopic} → {x.questionType}</p>
        <p className="muted">{x.acquisition}</p>
        <div className="row" style={{flexWrap:'wrap'}}>
          <span>Doğruluk: <strong>{x.accuracy==null?'—':'%'+x.accuracy}</strong></span>
          <span>Kanıt: <strong>{x.total} soru</strong></span>
          <span>Yanlış: <strong>{x.wrong}</strong></span>
          <span>Boş: <strong>{x.blank}</strong></span>
          {x.avgSeconds!=null&&<span>Süre: <strong>{x.avgSeconds} sn</strong></span>}
        </div>
        {x.primaryError&&<small className="muted">Baskın hata nedeni: {String(x.primaryError).replaceAll('_',' ').toLocaleLowerCase('tr-TR')}</small>}
      </div>)}
    </div>}

    <details style={{marginTop:16}}>
      <summary>Tüm ölçülen soru tiplerini göster</summary>
      <div className="stack" style={{marginTop:12}}>
        {(data.leaves||[]).slice(0,30).map((x:any)=><div key={[x.examType,x.subject,x.topic,x.subTopic,x.acquisition,x.questionType].join('|')} className="card" style={{margin:0}}>
          <strong>{x.examType} · {x.subject} · {x.topic}</strong>
          <p>{x.subTopic} → {x.questionType}</p>
          <small className="muted">{x.total} soru · doğruluk {x.accuracy==null?'—':'%'+x.accuracy} · kaynak: {(x.sources||[]).join(' + ')}</small>
        </div>)}
      </div>
    </details>

    <div className="notice" style={{marginTop:16}}>{data.note}</div>
  </div>;
}
