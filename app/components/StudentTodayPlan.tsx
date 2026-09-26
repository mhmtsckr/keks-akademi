'use client';

import {useEffect,useMemo,useState} from 'react';

function taskMeta(item:any){
  if(item.source==='REVIEW_BATCH')return item.targetValue+' tekrar';
  if(item.metricType==='QUESTIONS')return item.targetValue+' soru';
  if(item.metricType==='MINUTES')return item.targetValue+' dk';
  return '';
}

export function StudentTodayPlan(){
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');

  async function load(){
    const r=await fetch('/api/student/today',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||'Bugünün planı hazırlanamadı.');return}
    setData(j.today||null);
    setMsg('');
  }

  useEffect(()=>{void load()},[]);

  const plan=useMemo(()=>Array.isArray(data?.plan)?data.plan.filter((x:any)=>!x.completed):[],[data]);

  if(msg)return <div className="notice error">{msg}</div>;
  if(!data)return <div className="card"><div className="moduleEyebrow">BUGÜNÜN PLANI</div><h2>Plan hazırlanıyor…</h2><p className="muted">Bugünkü görevlerin sıralanıyor.</p></div>;

  return <div className="card todayLearningPlan">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">BUGÜNÜN PLANI</div>
        <h2>{plan.length?plan.length+' görev':'Bugünkü plan tamamlandı'}</h2>
        <p className="muted">Sırayla ilerle. Önce ilk görevi tamamla, sonra bir sonrakine geç.</p>
      </div>
    </div>

    {plan.length===0
      ?<div className="notice">Bugün için yapılacak zorunlu görev kalmadı.</div>
      :<div className="stack">
        {plan.map((item:any,index:number)=><div className="card" key={item.id} style={{margin:0}}>
          <div className="moduleHeaderRow">
            <div>
              <div className="moduleEyebrow">{index===0?'ŞİMDİ':'SONRA'}</div>
              <strong>{item.title}</strong>
              {taskMeta(item)&&<div className="muted">{taskMeta(item)}</div>}
            </div>
            <span className="pill">{index+1}</span>
          </div>
        </div>)}
      </div>}
  </div>;
}
