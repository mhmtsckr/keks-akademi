'use client';

import {useEffect,useMemo,useState} from 'react';

const LABELS:Record<string,string>={
  NEW:'Yeni',
  LEARNING:'Öğreniliyor',
  REINFORCING:'Pekiştiriliyor',
  DURABLE:'Kalıcı',
  RISKY:'Riskli'
};

function signalText(x:any){
  const parts:string[]=[];
  if(x.latestTestAccuracy!=null)parts.push('son test %'+x.latestTestAccuracy);
  if(x.reviewAccuracy!=null)parts.push('tekrar %'+x.reviewAccuracy);
  if(x.avgSecondsPerQuestion!=null)parts.push(x.avgSecondsPerQuestion+' sn/soru');
  if(x.primaryErrorReasonLabel)parts.push('yanlış: '+x.primaryErrorReasonLabel);
  return parts.slice(0,3).join(' · ');
}

export function StudentMasteryOverview(){
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');

  useEffect(()=>{
    fetch('/api/student/mastery',{cache:'no-store',credentials:'include'})
      .then(async r=>({ok:r.ok,j:await r.json()}))
      .then(({ok,j})=>ok?setData(j):setMsg(j.error||'Konu hâkimiyeti yüklenemedi.'))
      .catch(()=>setMsg('Konu hâkimiyeti yüklenemedi.'));
  },[]);

  const items=useMemo(()=>{
    const all=data?.mastery||[];
    return [...all].sort((a:any,b:any)=>{
      const order:Record<string,number>={RISKY:0,LEARNING:1,REINFORCING:2,NEW:3,DURABLE:4};
      return (order[a.status]??9)-(order[b.status]??9)||(a.score||0)-(b.score||0);
    }).slice(0,6);
  },[data]);

  if(msg&&!data)return null;
  if(!data)return <div className="card"><div className="moduleEyebrow">KONU HÂKİMİYETİ</div><p className="muted">Öğrenme sinyalleri hazırlanıyor…</p></div>;

  return <div className="card">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">KONU HÂKİMİYETİ · BASİT VE AÇIKLANABİLİR</div>
        <h2>Ne kadar bildiğin değil, bilginin ne durumda olduğu</h2>
        <p className="muted">KEKS; son test, tekrar başarısı, soru süresi, yanlış nedeni, kaynak verimliliği ve unutma riskini birlikte değerlendirir.</p>
      </div>
      <span className="pill">{data.summary?.risky||0} riskli konu</span>
    </div>

    <div className="row" style={{flexWrap:'wrap',gap:8,marginBottom:12}}>
      <span className="pill">Yeni</span>
      <span className="pill">Öğreniliyor</span>
      <span className="pill">Pekiştiriliyor</span>
      <span className="pill">Kalıcı</span>
      <span className="pill">Riskli</span>
    </div>

    {items.length===0?<p className="muted">Konu bazlı öğrenme kanıtı henüz oluşmadı.</p>:<div className="stack">
      {items.map((x:any)=><div className="card" key={x.subject+'|'+x.topic} style={{margin:0}}>
        <div className="moduleHeaderRow">
          <div>
            <strong>{x.subject} · {x.topic}</strong>
            <p className="muted" style={{marginBottom:0}}>{signalText(x)||'Veri birikiyor'}</p>
          </div>
          <span className={x.status==='RISKY'?'pill riskText':'pill'}>{LABELS[x.status]||x.status}</span>
        </div>

        {x.status==='RISKY'
          ?<div className="notice error" style={{marginTop:8}}>
            <strong>Riskli çünkü:</strong> {(x.riskReasons||[]).slice(0,2).join(' ')||x.statusReason}
          </div>
          :<p style={{marginTop:8,marginBottom:0}}>{x.statusReason}</p>}

        <details style={{marginTop:8}}>
          <summary>Neye göre?</summary>
          <div className="stack" style={{marginTop:8}}>
            <small>Son test: {x.latestTestAccuracy==null?'veri yok':'%'+x.latestTestAccuracy} · Tekrar: {x.reviewAccuracy==null?'veri yok':'%'+x.reviewAccuracy}</small>
            <small>Soru başına süre: {x.avgSecondsPerQuestion==null?'veri yok':x.avgSecondsPerQuestion+' sn/soru'}{x.targetSecondsPerQuestion?' · referans '+x.targetSecondsPerQuestion+' sn':''}</small>
            <small>Kaynak verimliliği: {x.resourceEfficiencyStatus||'veri yok'} · Son kanıt: {x.daysSinceLastEvidence>=999?'yok':x.daysSinceLastEvidence+' gün önce'}</small>
            {x.primaryErrorReasonLabel&&<small>Baskın yanlış nedeni: {x.primaryErrorReasonLabel}</small>}
          </div>
        </details>
      </div>)}
    </div>}
  </div>;
}
