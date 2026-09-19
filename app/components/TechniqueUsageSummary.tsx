export function TechniqueUsageSummary({sessions}:{sessions:Array<any>}){
  const totalSeconds=sessions.reduce((a,x)=>a+(x.activeSeconds||x.durationMinutes*60),0);
  const interrupted=sessions.filter(x=>!x.completed).length;
  const by:Record<string,{count:number;seconds:number;interrupted:number}>={};
  for(const x of sessions){
    by[x.techniqueKey]=by[x.techniqueKey]||{count:0,seconds:0,interrupted:0};
    by[x.techniqueKey].count++;
    by[x.techniqueKey].seconds+=x.activeSeconds||x.durationMinutes*60;
    if(!x.completed) by[x.techniqueKey].interrupted++;
  }
  const labels:any={POMODORO:'Pomodoro',ACTIVE_RECALL:'Aktif Hatırlama',FEYNMAN:'Feynman',CORNELL:'Cornell',SQ3R:'SQ3R'};
  const mins=Math.floor(totalSeconds/60);
  return <div className="card">
    <h2>Teknik Kullanım Özeti</h2>
    <div className="row">
      <span className="pill">{sessions.length} kayıt</span>
      <span className="pill">{mins} dk gerçek aktif süre</span>
      <span className="pill">{interrupted} yarıda kesilen</span>
    </div>
    <div className="stack" style={{marginTop:12}}>
      {Object.entries(by).map(([k,v])=><div key={k}>
        <strong>{labels[k]||k}</strong>
        <div className="muted">{v.count} kayıt · {Math.floor(v.seconds/60)} dk aktif · {v.interrupted} kesinti</div>
      </div>)}
    </div>
    {sessions.slice(0,5).map(x=><div key={x.id} style={{marginTop:10,paddingTop:10,borderTop:'1px solid var(--line)'}}>
      <strong>{labels[x.techniqueKey]||x.techniqueKey}</strong>
      <div className="muted">{x.completed?'Tamamlandı':'Yarıda kesildi'} · {Math.floor((x.activeSeconds||0)/60)} dk {Math.floor((x.activeSeconds||0)%60)} sn aktif{x.interruptedReason?' · '+x.interruptedReason:''}</div>
    </div>)}
  </div>;
}