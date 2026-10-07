import {buildCoachQualityOperations,CoachQualityStatus} from '@/lib/coachQualityOperations';

const STATUS_LABEL:Record<CoachQualityStatus,string>={
  GOOD:'İYİ',
  WATCH:'İZLEM',
  ACTION:'MÜDAHALE',
  NO_DATA:'VERİ YOK'
};

export async function CoachQualityOperations({coachId}:{coachId:string}){
  const data=await buildCoachQualityOperations(coachId);
  if(!data)return null;

  return <div className="card coachQualityPanel">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">KOÇ KALİTE SİSTEMİ · SON 30 GÜN</div>
        <h2>Operasyon kalitesi</h2>
        <p className="muted">Öğrenci sayısı veya görüşme hacmi yerine; yanıt süresi, görüşme tamamlama ve takip disiplinini gösterir.</p>
      </div>
      <div className="row" style={{gap:8,justifyContent:'flex-end'}}>
        <span className="pill">{data.summary?.standardsMet||0}/{data.summary?.standardsMeasured||0} standart karşılandı</span>
        <span className="pill">{data.summary?.operationalSamples||0} ölçülebilir olay</span>
      </div>
    </div>

    {data.metrics.length===0
      ?<p className="muted">{data.note}</p>
      :<div className="coachQualityGrid">
        {data.metrics.map(metric=><article className={'coachQualityMetric '+metric.status.toLowerCase()} key={metric.key}>
          <div className="coachQualityMetricTop">
            <span className="pill">{STATUS_LABEL[metric.status]}</span>
            <small>{metric.numerator}/{metric.denominator} olay</small>
          </div>
          <strong className="coachQualityValue">{metric.value}</strong>
          <h3>{metric.title}</h3>
          <p>{metric.detail}</p>
          {metric.evidence.length>0&&<details>
            <summary>Örnek kayıtlar</summary>
            <div className="stack">{metric.evidence.map((x,i)=><small key={i}>• {x}</small>)}</div>
          </details>}
        </article>)}
      </div>}

    <div className="notice">
      <strong>Değerlendirme ilkesi:</strong> {data.note}
    </div>
  </div>;
}
