'use client';

import { useEffect,useRef,useState } from 'react';
import { useRouter } from 'next/navigation';

export function CoachOabtApprovalStatus({studentId}:{studentId:string}){
  const router=useRouter();
  const [data,setData]=useState<any>(null);
  const previous=useRef<string|null>(null);

  async function load(){
    try{
      const r=await fetch('/api/coach/students/'+studentId+'/oabt-field',{cache:'no-store'});
      const j=await r.json();
      if(!r.ok)return;
      const old=previous.current;
      previous.current=j.status;
      setData(j);
      if(old&&old!==j.status)router.refresh();
    }catch{}
  }

  useEffect(()=>{
    void load();
    const timer=window.setInterval(()=>{void load()},4000);
    return ()=>window.clearInterval(timer);
  },[studentId]);

  if(!data?.applicable)return null;

  const status=data.status;
  return <div className={'card oabtLiveStatus '+status.toLowerCase()}>
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">CANLI YÖNETİCİ ONAYI</div>
        <h3>ÖABT Alan Durumu</h3>
      </div>
      <span className={'adminStatus '+(status==='APPROVED'?'active':status==='PENDING'?'pending':'')}>
        {status==='APPROVED'?'ONAYLANDI':status==='PENDING'?'ONAY BEKLİYOR':status==='REJECTED'?'YENİDEN SEÇİM':'ALAN BEKLENİYOR'}
      </span>
    </div>
    {status==='APPROVED'&&<div className="oabtApprovedField"><span>Yönetici onaylı alan</span><strong>{data.approvedField}</strong></div>}
    {status==='PENDING'&&<div className="oabtApprovedField"><span>Öğrencinin gönderdiği alan</span><strong>{data.requestedField}</strong></div>}
    {status==='REJECTED'&&<div className="notice error">{data.rejectionNote||'Yönetici alanın yeniden seçilmesini istedi.'}</div>}
    <small className="muted">Durum otomatik güncellenir. Sayfayı yenilemeniz gerekmez.</small>
  </div>;
}
