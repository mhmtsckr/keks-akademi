'use client';

import { useEffect,useRef } from 'react';
import { useRouter } from 'next/navigation';

export function CoachLiveApprovalSync(){
  const router=useRouter();
  const version=useRef<string|null>(null);

  async function check(){
    try{
      const r=await fetch('/api/coach/approval-sync',{cache:'no-store'});
      const j=await r.json();
      if(!r.ok)return;
      const current=String(j.version||'none');
      if(version.current===null){
        version.current=current;
        return;
      }
      if(version.current!==current){
        version.current=current;
        router.refresh();
      }
    }catch{}
  }

  useEffect(()=>{
    void check();
    const timer=window.setInterval(()=>{void check()},4000);
    return ()=>window.clearInterval(timer);
  },[]);

  return null;
}
