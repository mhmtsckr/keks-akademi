'use client';

import {useEffect,useState} from 'react';

type InstallPromptEvent = Event & {
  prompt:()=>Promise<void>;
  userChoice:Promise<{outcome:'accepted'|'dismissed';platform:string}>;
};

const DISMISS_KEY='keks-install-banner-dismissed';

export function MobileInstallBanner(){
  const [mobile,setMobile]=useState(false);
  const [standalone,setStandalone]=useState(false);
  const [dismissed,setDismissed]=useState(true);
  const [promptEvent,setPromptEvent]=useState<InstallPromptEvent|null>(null);
  const [ios,setIos]=useState(false);
  const [showIosHelp,setShowIosHelp]=useState(false);

  useEffect(()=>{
    const isMobile=window.matchMedia('(max-width: 820px)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isStandalone=window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & {standalone?:boolean}).standalone===true;
    const isIos=/iPhone|iPad|iPod/i.test(navigator.userAgent);
    setMobile(isMobile);
    setStandalone(isStandalone);
    setIos(isIos);
    setDismissed(localStorage.getItem(DISMISS_KEY)==='1');

    const onBeforeInstall=(event:Event)=>{
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setDismissed(false);
    };
    const onInstalled=()=>{
      setStandalone(true);
      setPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt',onBeforeInstall);
    window.addEventListener('appinstalled',onInstalled);
    return ()=>{
      window.removeEventListener('beforeinstallprompt',onBeforeInstall);
      window.removeEventListener('appinstalled',onInstalled);
    };
  },[]);

  const dismiss=()=>{
    localStorage.setItem(DISMISS_KEY,'1');
    setDismissed(true);
    setShowIosHelp(false);
  };

  const install=async()=>{
    if(promptEvent){
      await promptEvent.prompt();
      const choice=await promptEvent.userChoice;
      if(choice.outcome==='accepted')setStandalone(true);
      setPromptEvent(null);
      return;
    }
    if(ios)setShowIosHelp(true);
    else setShowIosHelp(true);
  };

  if(!mobile||standalone||dismissed)return null;

  return <div style={{
    position:'sticky',top:0,zIndex:1000,display:'flex',alignItems:'center',gap:10,
    padding:'10px 12px',background:'linear-gradient(135deg,#071d37,#0b2b4d)',
    color:'#fff',borderBottom:'1px solid rgba(232,187,76,.28)',
    boxShadow:'0 8px 24px rgba(0,0,0,.18)'
  }} role="region" aria-label="KEKS Akademi mobil uygulama kurulumu">
    <img src="/keks-robot-logo.svg" alt="" width="52" height="40" style={{objectFit:'contain',flex:'0 0 auto'}}/>
    <div style={{minWidth:0,flex:1}}>
      <strong style={{display:'block',fontSize:13,lineHeight:1.25}}>KEKS Akademi’yi telefonuna yükle</strong>
      <span style={{display:'block',fontSize:11,color:'#aebfd0',marginTop:2}}>Daha hızlı erişim · Ana ekrandan tek dokunuş</span>
      {showIosHelp&&<span style={{display:'block',fontSize:11,color:'#f1cf76',marginTop:5}}>
        {ios?'Safari’de Paylaş simgesine dokun → “Ana Ekrana Ekle”.':'Tarayıcı menüsünden “Uygulamayı yükle” veya “Ana ekrana ekle” seçeneğini kullan.'}
      </span>}
    </div>
    <button type="button" onClick={install} style={{
      border:0,borderRadius:10,padding:'9px 12px',background:'linear-gradient(135deg,#d59b30,#f1cf77)',
      color:'#071a30',fontWeight:900,fontSize:12,whiteSpace:'nowrap',cursor:'pointer'
    }}>Yükle</button>
    <button type="button" onClick={dismiss} aria-label="Kurulum önerisini kapat" style={{
      width:30,height:30,border:0,borderRadius:9,background:'rgba(255,255,255,.07)',
      color:'#c5d0dc',fontSize:18,cursor:'pointer',lineHeight:1
    }}>×</button>
  </div>;
}
