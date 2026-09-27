export function StudentGoalDistance({data}:{data:any}){
  if(!data?.hasTarget){
    return <div className="card">
      <div className="moduleEyebrow">HEDEFE KALAN MESAFE</div>
      <h2>{data?.target||'Hedef henüz tanımlanmadı'}</h2>
      <p className="muted">{data?.note||'Koçunuz hedef tanımladığında operasyonel göstergeler burada görünecek.'}</p>
    </div>;
  }

  const gap=data.netGap;
  const contribution=data.highestContributionAreas||[];

  return <div className="card">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">HEDEFE KALAN MESAFE · OPERASYONEL GÖSTERGE</div>
        <h2>{data.target}</h2>
        {data.targetInstitution&&data.targetDepartment&&<p className="muted">{data.targetInstitution} · {data.targetDepartment}</p>}
      </div>
      <span className="pill">{data.examLevel}</span>
    </div>

    <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
      <div className="card" style={{margin:0}}>
        <small className="muted">Mevcut performans</small>
        <div className="kpi">{data.currentPerformance?.net??'—'}</div>
        <span>{data.currentPerformance?.net!=null?'net':'Güncel net verisi yok'}</span>
        {data.currentPerformance?.score!=null&&<small className="muted">Puan: {data.currentPerformance.score}</small>}
      </div>

      <div className="card" style={{margin:0}}>
        <small className="muted">Tahmini konu açığı</small>
        <div className="kpi">{data.estimatedOpenTopics??0}</div>
        <span>açık konu</span>
        <small className="muted">{data.riskyTopicCount??0} konu riskli durumda</small>
      </div>

      <div className="card" style={{margin:0}}>
        <small className="muted">Hedef net farkı</small>
        <div className="kpi">{gap==null?'—':Math.abs(gap)}</div>
        <span>{gap==null?'Hedef net tanımlı değil':gap>0?'net fark':'hedef net seviyesine ulaşıldı/aşıldı'}</span>
        {data.targetPerformance?.net!=null&&<small className="muted">Hedef net: {data.targetPerformance.net}</small>}
      </div>

      <div className="card" style={{margin:0}}>
        <small className="muted">Son ölçüm</small>
        <div className="kpi">{data.latestExamType||'—'}</div>
        <span>{data.latestExamAt?new Date(data.latestExamAt).toLocaleDateString('tr-TR'):'Deneme kaydı yok'}</span>
      </div>
    </div>

    <div style={{marginTop:16}}>
      <div className="moduleEyebrow">EN YÜKSEK KATKI POTANSİYELİ OLAN 3 DERS</div>
      {!contribution.length?<p className="muted">Katkı alanlarını sıralamak için yeterli konu hâkimiyeti verisi yok.</p>:<div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>
        {contribution.map((x:any,i:number)=><div className="card" key={x.subject} style={{margin:0}}>
          <div className="moduleHeaderRow"><strong>{i+1}. {x.subject}</strong><span className="pill">{x.openTopics} açık konu</span></div>
          <p>{x.reason}</p>
          <small className="muted">Ortalama hâkimiyet: {x.avgMastery}/100{x.avgAccuracy==null?'':' · doğruluk %'+x.avgAccuracy}</small>
        </div>)}
      </div>}
    </div>

    <div className="notice" style={{marginTop:16}}>
      <strong>Nasıl okunmalı?</strong> Bu ekran hangi alanlarda çalışmanın operasyonel olarak daha fazla katkı potansiyeli taşıdığını gösterir. {data.note}
    </div>
  </div>;
}
