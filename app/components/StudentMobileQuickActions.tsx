'use client';

import {useEffect,useState} from 'react';

type DeferredPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};

export function StudentMobileQuickActions({examTypes}:{examTypes:string[]}){
  const [installEvent,setInstallEvent]=useState<DeferredPrompt|null>(null);
  const [showExam,setShowExam]=useState(false);
  const [examType,setExamType]=useState(examTypes[0]||'TYT');
  const [net,setNet]=useState('');
  const [duration,setDuration]=useState('');
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);
  const [standalone,setStandalone]=useState(false);

  useEffect(()=>{
    const media=window.matchMedia('(display-mode: standalone)');
    const detect=()=>setStandalone(media.matches||(navigator as any).standalone===true);
    detect();
    media.addEventListener?.('change',detect);
    const handler=(event:Event)=>{
      event.preventDefault();
      setInstallEvent(event as DeferredPrompt);
    };
    window.addEventListener('beforeinstallprompt',handler);
    return ()=>{
      media.removeEventListener?.('change',detect);
      window.removeEventListener('beforeinstallprompt',handler);
    };
  },[]);

  function go(id:string){
    document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function install(){
    if(!installEvent)return;
    await installEvent.prompt();
    const choice=await installEvent.userChoice;
    if(choice.outcome==='accepted')setInstallEvent(null);
  }

  async function saveExam(){
    const value=Number(net);
    if(!Number.isFinite(value)){setMsg('Net değerini gir.');return}
    setBusy(true);setMsg('');
    const body:any={examType,totalNet:value};
    if(duration.trim())body.durationMinutes=Number(duration);
    const r=await fetch('/api/student/quick-exam',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();setBusy(false);
    if(!r.ok){setMsg(j.error||'Deneme kaydedilemedi.');return}
    setMsg('Deneme kaydedildi.');
    setNet('');setDuration('');
    setTimeout(()=>setShowExam(false),650);
  }

  return <>
    {!standalone&&installEvent&&<div className="mobileInstallBanner">
      <div><strong>KEKS’i telefona yükle</strong><span>Uygulama gibi aç, Bugün ekranına doğrudan ulaş.</span></div>
      <button type="button" className="btn primary" onClick={install}>Yükle</button>
    </div>}

    <nav className="studentMobileDock" aria-label="Mobil hızlı işlemler">
      <button type="button" onClick={()=>go('gunluk-gorevler')}><b>✓</b><span>Görev</span></button>
      <button type="button" onClick={()=>go('yanlis-ekle')}><b>↺</b><span>Yanlış</span></button>
      <button type="button" onClick={()=>setShowExam(true)}><b>＋</b><span>Deneme</span></button>
    </nav>

    {showExam&&<div className="mobileQuickSheet" role="dialog" aria-modal="true" aria-label="Hızlı deneme girişi">
      <div className="mobileQuickSheetCard">
        <div className="moduleHeaderRow"><div><div className="moduleEyebrow">HIZLI DENEME GİRİŞİ</div><h3>Denemeyi kaydet</h3></div><button type="button" className="btn" onClick={()=>setShowExam(false)}>Kapat</button></div>
        <div className="field"><label>Sınav</label><select value={examType} onChange={e=>setExamType(e.target.value)}>{examTypes.map(x=><option key={x}>{x}</option>)}</select></div>
        <div className="field"><label>Toplam net</label><input inputMode="decimal" value={net} onChange={e=>setNet(e.target.value.replace(',','.'))} placeholder="Örn. 62.75"/></div>
        <div className="field"><label>Süre (dk) · isteğe bağlı</label><input inputMode="numeric" value={duration} onChange={e=>setDuration(e.target.value.replace(/\D/g,''))} placeholder="Örn. 135"/></div>
        <button type="button" className="btn primary" disabled={busy||!net.trim()} onClick={saveExam}>{busy?'Kaydediliyor…':'Denemeyi Kaydet'}</button>
        {msg&&<div className={'notice '+(msg.includes('kaydedildi')?'':'error')}>{msg}</div>}
      </div>
    </div>}
  </>;
}
