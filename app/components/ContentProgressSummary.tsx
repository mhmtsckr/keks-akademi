export function ContentProgressSummary({items}:{items:Array<any>}){
  const completed=items.filter(x=>x.progress?.[0]?.completed).length;
  const scored=items.filter(x=>x.progress?.[0]?.score!=null);
  const avg=scored.length?Math.round(scored.reduce((a,x)=>a+Number(x.progress[0].score||0),0)/scored.length):null;
  return <div className="card">
    <h2>İçerik Kullanım Analitiği</h2>
    <div className="row">
      <span className="pill">Yayınlanan {items.length}</span>
      <span className="pill">Tamamlanan {completed}</span>
      <span className="pill">Ortalama test puanı {avg==null?'—':'%'+avg}</span>
    </div>
    <div className="stack" style={{marginTop:14}}>
      {items.length===0?<p className="muted">Henüz yayınlanmış içerik yok.</p>:items.map(x=>{
        const p=x.progress?.[0];
        const state:any=p?.state||{};
        const hard=Object.values(state.cardRatings||{}).filter(v=>v==='HARD').length;
        return <div key={x.id} style={{padding:'10px 0',borderBottom:'1px solid var(--line)'}}>
          <strong>{x.title}</strong>
          <div className="muted">{x.type} · {p?.completed?'Tamamlandı':'Devam ediyor'}{p?.score!=null?' · Puan %'+p.score:''}{hard?' · Zor kart '+hard:''}</div>
        </div>
      })}
    </div>
  </div>;
}