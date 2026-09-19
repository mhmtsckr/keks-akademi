export function TechniqueUsageSummary({sessions}:{sessions:Array<any>}){
  const total=sessions.reduce((a,x)=>a+x.durationMinutes,0);
  const by:Record<string,{count:number;minutes:number}>={};
  for(const x of sessions){by[x.techniqueKey]=by[x.techniqueKey]||{count:0,minutes:0};by[x.techniqueKey].count++;by[x.techniqueKey].minutes+=x.durationMinutes}
  const labels:any={POMODORO:'Pomodoro',ACTIVE_RECALL:'Aktif Hatırlama',FEYNMAN:'Feynman',CORNELL:'Cornell',SQ3R:'SQ3R'};
  return <div className="card"><h2>Teknik Kullanım Özeti</h2><div className="row"><span className="pill">{sessions.length} oturum</span><span className="pill">{total} dk toplam</span></div><div className="stack" style={{marginTop:12}}>{Object.entries(by).map(([k,v])=><div key={k}><strong>{labels[k]||k}</strong><div className="muted">{v.count} oturum · {v.minutes} dk</div></div>)}</div></div>;
}