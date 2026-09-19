export function CoachTrendSummary({exams,reviewDue}:{exams:Array<{createdAt:string;examType:string;payload:any}>;reviewDue:number}){
  const by:Record<string,Array<{date:string;net:number}>>={};
  for(const x of exams){
    const p=x.payload||{};
    const nets=p.subjectNets||{};
    for(const [subject,value] of Object.entries(nets)){
      by[subject]=by[subject]||[];
      by[subject].push({date:x.createdAt,net:Number(value)||0});
    }
    if(p.net!=null){
      by[x.examType]=by[x.examType]||[];
      by[x.examType].push({date:x.createdAt,net:Number(p.net)||0});
    }
  }
  return <div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
    <div className="card"><h2>Deneme Net Trendleri</h2>{Object.keys(by).length===0?<p className="muted">Ders bazlı trend için denemelere ders netleri girilmeli.</p>:Object.entries(by).map(([subject,rows])=>{const recent=rows.slice(-8);const max=Math.max(...recent.map(x=>x.net),1);return <div key={subject} style={{marginBottom:18}}><strong>{subject}</strong><div style={{display:'flex',alignItems:'end',gap:5,height:72,marginTop:8,borderBottom:'1px solid var(--line)'}}>{recent.map((x,i)=><div key={i} title={new Date(x.date).toLocaleDateString('tr-TR')+' · '+x.net+' net'} style={{height:Math.max(4,(x.net/max)*64),flex:1,maxWidth:28,background:'var(--brand)',borderRadius:'5px 5px 0 0'}}/>)}</div><div className="muted">Son net: {recent[recent.length-1]?.net}</div></div>})}</div>
    <div className="card"><h2>Tekrar Yükü</h2><div className="kpi">{reviewDue}</div><p className="muted">Şu anda vadesi gelmiş yanlış soru tekrarı.</p></div>
  </div>;
}