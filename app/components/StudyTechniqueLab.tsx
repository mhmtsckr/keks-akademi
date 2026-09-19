'use client';

import { useEffect,useRef,useState } from 'react';

const TECHNIQUES:any={
  POMODORO:{
    name:'Pomodoro',
    short:'Odak blokları ve planlı molalarla çalışma.',
    how:['Tek bir görev seç.','Çalışma süresince yalnız o görevde kal.','Süre bitince kısa mola ver.','Belirlediğin tur sayısından sonra uzun mola yap.'],
  },
  ACTIVE_RECALL:{
    name:'Aktif Hatırlama',
    short:'Notlara bakmadan bilgiyi hafızadan geri çağırma.',
    how:['Konuyu kısa süre gözden geçir.','Kaynağı kapat.','Kendine soru sor ve cevabı yaz/söyle.','Cevabını kaynakla kontrol et.','Eksik noktaları yeniden çalış.'],
  },
  FEYNMAN:{
    name:'Feynman Tekniği',
    short:'Konuyu basit bir dille öğretir gibi anlatma.',
    how:['Bir kavram seç.','12 yaşındaki birine anlatır gibi yaz.','Takıldığın yerleri işaretle.','Kaynağa dönüp boşlukları kapat.','Anlatımı sadeleştirip yeniden yap.'],
  },
  CORNELL:{
    name:'Cornell Not Sistemi',
    short:'Notları ipucu, ana not ve özet olarak yapılandırma.',
    how:['Sayfayı üç bölüme ayır.','Sağa ana notları yaz.','Sola anahtar soru ve kavramları ekle.','En alta kendi cümlelerinle özet yaz.','Sonra sol sütundaki sorularla kendini test et.'],
  },
  SQ3R:{
    name:'SQ3R',
    short:'Uzun metinleri aktif okuyarak öğrenme.',
    how:['Survey: başlıkları ve görselleri tara.','Question: başlıklardan sorular üret.','Read: soruların cevabını bulmak için oku.','Recite: kitabı kapatıp cevabı anlat.','Review: kısa genel tekrar yap.'],
  },
};

function mmss(sec:number){
  const m=Math.floor(sec/60).toString().padStart(2,'0');
  const s=(sec%60).toString().padStart(2,'0');
  return m+':'+s;
}
function newSessionId(){
  if(typeof crypto!=='undefined'&&'randomUUID' in crypto) return crypto.randomUUID();
  return 'sess_'+Date.now()+'_'+Math.random().toString(36).slice(2);
}

export function StudyTechniqueLab({initialPreferences=[]}:{initialPreferences?:any[]}){
  const prefMap=Object.fromEntries(initialPreferences.map((x:any)=>[x.techniqueKey,x.config]));
  const [key,setKey]=useState('POMODORO');
  const [msg,setMsg]=useState('');
  const [form,setForm]=useState<any>({});
  const [config,setConfig]=useState<any>(prefMap.POMODORO||{focus:25,shortBreak:5,longBreak:15,rounds:4});
  const [mode,setMode]=useState<'focus'|'short'|'long'>('focus');
  const [round,setRound]=useState(1);
  const [seconds,setSeconds]=useState((prefMap.POMODORO?.focus||25)*60);
  const [running,setRunning]=useState(false);

  const sessionIdRef=useRef('');
  const sessionActiveRef=useRef(false);
  const segmentStartedRef=useRef<number|null>(null);
  const activeSecondsRef=useRef(0);
  const autosavedRef=useRef(false);
  const keyRef=useRef(key);
  const formRef=useRef(form);
  const configRef=useRef(config);
  const modeRef=useRef(mode);
  const roundRef=useRef(round);

  useEffect(()=>{keyRef.current=key},[key]);
  useEffect(()=>{formRef.current=form},[form]);
  useEffect(()=>{configRef.current=config},[config]);
  useEffect(()=>{modeRef.current=mode},[mode]);
  useEffect(()=>{roundRef.current=round},[round]);

  function beginTracking(){
    if(sessionActiveRef.current) return;
    sessionIdRef.current=newSessionId();
    activeSecondsRef.current=0;
    segmentStartedRef.current=Date.now();
    sessionActiveRef.current=true;
    autosavedRef.current=false;
  }

  function closeActiveSegment(){
    if(segmentStartedRef.current){
      activeSecondsRef.current+=Math.max(0,Math.floor((Date.now()-segmentStartedRef.current)/1000));
      segmentStartedRef.current=null;
    }
  }

  function currentTitle(){
    const k=keyRef.current;
    if(k==='POMODORO') return 'Pomodoro Odak Oturumu';
    if(k==='ACTIVE_RECALL') return 'Aktif Hatırlama';
    if(k==='FEYNMAN') return 'Feynman Tekniği';
    if(k==='CORNELL') return 'Cornell Not Sistemi';
    return 'SQ3R';
  }

  function interruptionPayload(reason:string){
    closeActiveSegment();
    return {
      action:'session',
      techniqueKey:keyRef.current,
      title:currentTitle(),
      config:keyRef.current==='POMODORO'?configRef.current:{},
      result:{
        ...formRef.current,
        round:roundRef.current,
        mode:modeRef.current,
        autoSaved:true
      },
      durationMinutes:Math.floor(activeSecondsRef.current/60),
      activeSeconds:activeSecondsRef.current,
      completed:false,
      clientSessionId:sessionIdRef.current,
      interruptedReason:reason
    };
  }

  function heartbeatPayload(){
    if(!sessionActiveRef.current||!sessionIdRef.current) return null;
    const liveSeconds=activeSecondsRef.current+(segmentStartedRef.current?Math.max(0,Math.floor((Date.now()-segmentStartedRef.current)/1000)):0);
    return {
      action:'session',
      techniqueKey:keyRef.current,
      title:currentTitle(),
      config:keyRef.current==='POMODORO'?configRef.current:{},
      result:{...formRef.current,round:roundRef.current,mode:modeRef.current,autoSaved:true},
      durationMinutes:Math.floor(liveSeconds/60),
      activeSeconds:liveSeconds,
      completed:false,
      clientSessionId:sessionIdRef.current,
      interruptedReason:'HEARTBEAT'
    };
  }

  function autosaveInterruption(reason:string){
    if(!sessionActiveRef.current||autosavedRef.current||!sessionIdRef.current) return;
    const payload=interruptionPayload(reason);
    autosavedRef.current=true;
    sessionActiveRef.current=false;
    setRunning(false);

    const body=JSON.stringify(payload);
    try{
      if(typeof navigator!=='undefined'&&navigator.sendBeacon){
        const ok=navigator.sendBeacon('/api/student/techniques',new Blob([body],{type:'application/json'}));
        if(ok) return;
      }
    }catch{}
    fetch('/api/student/techniques',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body,
      keepalive:true
    }).catch(()=>{});
  }

  useEffect(()=>{
    const heartbeat=setInterval(()=>{
      const payload=heartbeatPayload();
      if(!payload||document.visibilityState!=='visible') return;
      fetch('/api/student/techniques',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
    },20000);
    return()=>clearInterval(heartbeat);
  },[]);

  useEffect(()=>{
    const onVisibility=()=>{if(document.visibilityState==='hidden') autosaveInterruption('TAB_HIDDEN')};
    const onPageHide=()=>autosaveInterruption('PAGE_EXIT');
    const onBeforeUnload=()=>autosaveInterruption('PAGE_EXIT');
    const onBlur=()=>autosaveInterruption('WINDOW_BLUR');
    document.addEventListener('visibilitychange',onVisibility);
    window.addEventListener('pagehide',onPageHide);
    window.addEventListener('beforeunload',onBeforeUnload);
    window.addEventListener('blur',onBlur);
    return()=>{
      document.removeEventListener('visibilitychange',onVisibility);
      window.removeEventListener('pagehide',onPageHide);
      window.removeEventListener('beforeunload',onBeforeUnload);
      window.removeEventListener('blur',onBlur);
    };
  },[]);

  useEffect(()=>{
    if(!running)return;
    const id=setInterval(()=>{
      if(document.visibilityState!=='visible') return;
      setSeconds(s=>Math.max(0,s-1));
    },1000);
    return()=>clearInterval(id);
  },[running]);

  useEffect(()=>{
    if(seconds!==0||!running)return;
    closeActiveSegment();
    setRunning(false);
    if(mode==='focus'){
      if(round>=config.rounds){setMode('long');setSeconds(config.longBreak*60)}
      else{setMode('short');setSeconds(config.shortBreak*60)}
    }else{
      if(mode==='short')setRound(r=>r+1);
      setMode('focus');
      setSeconds(config.focus*60);
    }
    segmentStartedRef.current=Date.now();
    setRunning(true);
  },[seconds,running,mode,round,config]);

  useEffect(()=>{
    if(!running){
      const value=mode==='focus'?config.focus:mode==='short'?config.shortBreak:config.longBreak;
      setSeconds(value*60);
    }
  },[config,mode,running]);

  async function savePreference(){
    const r=await fetch('/api/student/techniques',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({action:'preference',techniqueKey:'POMODORO',config})
    });
    const j=await r.json();
    setMsg(r.ok?'Pomodoro ayarların kaydedildi.':'Hata: '+(j.error||'Kaydedilemedi.'));
  }

  async function saveCompletedSession(techniqueKey:string,title:string,result:any){
    if(!sessionActiveRef.current) beginTracking();
    closeActiveSegment();
    const clientSessionId=sessionIdRef.current;
    const activeSeconds=activeSecondsRef.current;
    sessionActiveRef.current=false;
    autosavedRef.current=true;

    const r=await fetch('/api/student/techniques',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        action:'session',
        techniqueKey,
        title,
        config:techniqueKey==='POMODORO'?config:{},
        result,
        durationMinutes:Math.floor(activeSeconds/60),
        activeSeconds,
        completed:true,
        clientSessionId,
        interruptedReason:undefined
      })
    });
    const j=await r.json();
    setMsg(r.ok?'Çalışma oturumu gerçek aktif süreyle kaydedildi ve koç paneline yansıdı.':'Hata: '+(j.error||'Oturum kaydedilemedi.'));
    sessionIdRef.current='';
    activeSecondsRef.current=0;
    segmentStartedRef.current=null;
  }

  function updateForm(next:any){
    beginTracking();
    setForm(next);
  }

  function startPomodoro(){
    beginTracking();
    segmentStartedRef.current=Date.now();
    setRunning(true);
  }
  function pausePomodoro(){
    closeActiveSegment();
    setRunning(false);
  }
  function resetPomodoro(){
    setRunning(false);
    sessionActiveRef.current=false;
    autosavedRef.current=true;
    sessionIdRef.current='';
    activeSecondsRef.current=0;
    segmentStartedRef.current=null;
    setMode('focus');
    setRound(1);
    setSeconds(config.focus*60);
  }
  async function finishPomodoro(){
    closeActiveSegment();
    setRunning(false);
    await saveCompletedSession('POMODORO','Pomodoro Odak Oturumu',{
      round,
      mode,
      task:form.task||'',
      note:form.note||''
    });
  }

  function chooseTechnique(k:string){
    if(sessionActiveRef.current) autosaveInterruption('TECHNIQUE_CHANGED');
    setKey(k);
    setForm({});
    setMsg('');
  }

  const t=TECHNIQUES[key];

  return <div className="stack">
    <div className="card">
      <h2>Ders Çalışma Teknikleri Uygulama Alanı</h2>
      <p className="muted">Bir teknik seç. Nasıl uygulanacağını gör ve aynı ekranda hemen kullanmaya başla. Sekmeden veya uygulamadan ayrılırsan aktif oturum otomatik durdurulur ve gerçek süre kaydedilir.</p>
      <div className="grid">
        {Object.entries(TECHNIQUES).map(([k,v]:any)=><button key={k} className="card" onClick={()=>chooseTechnique(k)} style={{textAlign:'left',borderColor:key===k?'var(--brand)':'var(--line)'}}>
          <strong>{v.name}</strong><p className="muted">{v.short}</p>
        </button>)}
      </div>
    </div>

    <div className="card">
      <span className="pill">{t.name}</span>
      <h2>Nasıl Uygulanır?</h2>
      <ol>{t.how.map((x:string,i:number)=><li key={i} style={{margin:'8px 0'}}>{x}</li>)}</ol>
    </div>

    {key==='POMODORO'&&<div className="card">
      <h2>Kişisel Pomodoro</h2>
      <div className="grid">
        <div className="field"><label>Çalışma (dk)</label><input type="number" min="5" max="120" value={config.focus} onChange={e=>setConfig({...config,focus:Number(e.target.value)})}/></div>
        <div className="field"><label>Kısa mola (dk)</label><input type="number" min="1" max="30" value={config.shortBreak} onChange={e=>setConfig({...config,shortBreak:Number(e.target.value)})}/></div>
        <div className="field"><label>Uzun mola (dk)</label><input type="number" min="5" max="60" value={config.longBreak} onChange={e=>setConfig({...config,longBreak:Number(e.target.value)})}/></div>
        <div className="field"><label>Uzun mola öncesi tur</label><input type="number" min="1" max="8" value={config.rounds} onChange={e=>setConfig({...config,rounds:Number(e.target.value)})}/></div>
      </div>
      <div className="field" style={{marginTop:12}}><label>Bu oturumda ne çalışacaksın?</label><input value={form.task||''} onChange={e=>updateForm({...form,task:e.target.value})} placeholder="Örn. TYT Matematik Problemler"/></div>
      <button className="btn" onClick={savePreference} style={{marginTop:10}}>Ayarlarımı Kaydet</button>
      <div style={{textAlign:'center',padding:'28px 0'}}>
        <div className="pill">{mode==='focus'?'Çalışma':mode==='short'?'Kısa Mola':'Uzun Mola'} · Tur {round}/{config.rounds}</div>
        <div style={{fontSize:'64px',fontWeight:800,letterSpacing:'-2px',margin:'12px 0'}}>{mmss(seconds)}</div>
        <div className="row" style={{justifyContent:'center'}}>
          {!running?<button className="btn primary" onClick={startPomodoro}>Başlat</button>:<button className="btn" onClick={pausePomodoro}>Duraklat</button>}
          <button className="btn" onClick={resetPomodoro}>Sıfırla</button>
          <button className="btn" onClick={finishPomodoro}>Oturumu Bitir ve Kaydet</button>
        </div>
      </div>
      <div className="field"><label>Oturum notu</label><textarea value={form.note||''} onChange={e=>updateForm({...form,note:e.target.value})} rows={3} placeholder="Nasıl geçti? Nerede zorlandın?"/></div>
    </div>}

    {key==='ACTIVE_RECALL'&&<TechniqueForm title="Aktif Hatırlama Uygulaması" fields={[
      ['topic','Çalıştığın konu'],['questions','Kendine sorduğun sorular'],['recall','Kaynağa bakmadan hatırladıkların'],['gaps','Eksik kalan noktalar']
    ]} form={form} setForm={updateForm} onSave={()=>saveCompletedSession(key,'Aktif Hatırlama',form)}/>}

    {key==='FEYNMAN'&&<TechniqueForm title="Feynman Uygulaması" fields={[
      ['topic','Kavram / konu'],['simple','Bir öğrenciye anlatır gibi sade anlatımın'],['gaps','Anlatırken takıldığın noktalar'],['final','Düzeltilmiş ve sadeleştirilmiş son anlatım']
    ]} form={form} setForm={updateForm} onSave={()=>saveCompletedSession(key,'Feynman Tekniği',form)}/>}

    {key==='CORNELL'&&<TechniqueForm title="Cornell Not Uygulaması" fields={[
      ['topic','Konu başlığı'],['notes','Ana notlar'],['cues','Anahtar kelimeler / sorular'],['summary','Kendi cümlelerinle kısa özet']
    ]} form={form} setForm={updateForm} onSave={()=>saveCompletedSession(key,'Cornell Not Sistemi',form)}/>}

    {key==='SQ3R'&&<TechniqueForm title="SQ3R Uygulaması" fields={[
      ['survey','Survey — bölümde ilk fark ettiklerin'],['questions','Question — cevaplamak istediğin sorular'],['read','Read — önemli bilgiler'],['recite','Recite — kaynağa bakmadan anlattıkların'],['review','Review — son tekrar özeti']
    ]} form={form} setForm={updateForm} onSave={()=>saveCompletedSession(key,'SQ3R',form)}/>}

    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}
  </div>;
}

function TechniqueForm({title,fields,form,setForm,onSave}:{title:string;fields:string[][];form:any;setForm:(x:any)=>void;onSave:()=>void}){
  return <div className="card"><h2>{title}</h2><div className="form">{fields.map(([key,label])=><div className="field" key={key}><label>{label}</label><textarea rows={key==='summary'||key==='final'?4:3} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}/></div>)}<button className="btn primary" onClick={onSave}>Uygulamayı Tamamla ve Kaydet</button></div></div>
}
