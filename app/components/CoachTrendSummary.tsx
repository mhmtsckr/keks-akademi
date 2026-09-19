export function CoachTrendSummary({exams,reviewDue}:{exams:Array<{createdAt:string;examType:string;payload:any}>;reviewDue:number}){
  const by:Record<string,Array<{date:string;net:number}>>={};
  for(const x of exams){
    const p=x.payload||{};
    const nets=p.subjectNets||{};
    for(const [subject,value] of Object.entries(nets)){by[subject]=by[subject]||[];by[subject].push({date:x.createdAt,net:Number(value)||0})}
    if(p.net!=null){by[x.examType]=by[x.examType]||[];by[x.examType].push({date:x.createdAt,net:Number(p.net)||0})}
  }
  return <div className="coachAnalyticsGrid">
    <div className="card coachTrendCard">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">PERFORMANS ANALİZİ</div><h2>Deneme Net Trendleri</h2></div><span className="moduleIcon">⌁</span></div>
      {Object.keys(by).length===0?<p className="muted">Ders bazlı trend için denemelere ders netleri girilmeli.</p>:<div className="trendList">{Object.entries(by).map(([subject,rows])=>{const recent=rows.slice(-8);const max=Math.max(...recent.map(x=>x.net),1);return <div key={subject} className="trendRow"><div className="trendLabel"><strong>{subject}</strong><span>Son net {recent[recent.length-1]?.net}</span></div><div className="trendBars">{recent.map((x,i)=><i key={i} title={new Date(x.date).toLocaleDateString('tr-TR')+' · '+x.net+' net'} style={{height:Math.max(6,(x.net/max)*66)}}/>)}</div></div>})}</div>}
    </div>
    <div className="card coachReviewLoad"><div className="moduleEyebrow">TEKRAR YÜKÜ</div><div className="kpi">{reviewDue}</div><strong>Vadesi gelmiş yanlış soru</strong><p className="muted">Öğrencinin bugün tekrar etmesi gereken soru sayısı.</p></div>
  </div>;
}
