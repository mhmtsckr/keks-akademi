'use client';

import { useEffect,useMemo,useRef,useState } from 'react';

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

function mmss(sec:number){const m=Math.floor(sec/60).toString().padStart(2,'0');const s=(sec%60).toString().padStart(2,'0');return m+':'+s}

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
  const startedAt=useRef<number|null>(null);

  useEffect(()=>{
    if(!running)return;
    const id=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);
    return()=>clearInterval(id);
  },[running]);

  useEffect(()=>{
    if(seconds!==0||!running)return;
    setRunning(false);
    if(mode==='focus'){
      if(round>=config.rounds){setMode('long');setSeconds(config.longBreak*60)}
      else{setMode('short');setSeconds(config.shortBreak*60)}
    }else{
      if(mode==='short')setRound(r=>r+1);
      setMode('focus');setSeconds(config.focus*60);
    }
  },[seconds,running,mode,round,config]);

  useEffect(()=>{
    if(!running){
      const value=mode==='focus'?config.focus:mode==='short'?config.shortBreak:config.longBreak;
      setSeconds(value*60);
    }
  },[config,mode]);

  async function savePreference(){
    const r=await fetch('/api/student/techniques',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'preference',techniqueKey:'POMODORO',config})});
    const j=await r.json(); setMsg(r.ok?'Pomodoro ayarların kaydedildi.':'Hata: '+(j.error||'Kaydedilemedi.'));
  }

  async function saveSession(techniqueKey:string,title:string,result:any,duration:number){
    const r=await fetch('/api/student/techniques',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'session',techniqueKey,title,config:techniqueKey==='POMODORO'?config:{},result,durationMinutes:Math.max(0,Math.round(duration)),completed:true})});
    const j=await r.json();setMsg(r.ok?'Çalışma oturumu kaydedildi ve koç paneline yansıdı.':'Hata: '+(j.error||'Oturum kaydedilemedi.'));
  }

  function startPomodoro(){if(!startedAt.current)startedAt.current=Date.now();setRunning(true)}
  function pausePomodoro(){setRunning(false)}
  function resetPomodoro(){setRunning(false);startedAt.current=null;setMode('focus');setRound(1);setSeconds(config.focus*60)}
  async function finishPomodoro(){
    setRunning(false);
    const minutes=startedAt.current?Math.max(1,(Date.now()-startedAt.current)/60000):config.focus;
    await saveSession('POMODORO','Pomodoro Odak Oturumu',{round,mode,task:form.task||'',note:form.note||''},minutes);
    startedAt.current=null;
  }

  const t=TECHNIQUES[key];

  return <div className="stack">
    <div className="card">
      <h2>Ders Çalışma Teknikleri Uygulama Alanı</h2>
      <p className="muted">Bir teknik seç. Nasıl uygulanacağını gör ve aynı ekranda hemen kullanmaya başla.</p>
      <div className="grid">
        {Object.entries(TECHNIQUES).map(([k,v]:any)=><button key={k} className="card" onClick={()=>{setKey(k);setMsg('')}} style={{textAlign:'left',borderColor:key===k?'var(--brand)':'var(--line)'}}>
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
      <div className="field" style={{marginTop:12}}><label>Bu oturumda ne çalışacaksın?</label><input value={form.task||''} onChange={e=>setForm({...form,task:e.target.value})} placeholder="Örn. TYT Matematik Problemler"/></div>
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
      <div className="field"><label>Oturum notu</label><textarea value={form.note||''} onChange={e=>setForm({...form,note:e.target.value})} rows={3} placeholder="Nasıl geçti? Nerede zorlandın?"/></div>
    </div>}

    {key==='ACTIVE_RECALL'&&<TechniqueForm title="Aktif Hatırlama Uygulaması" fields={[
      ['topic','Çalıştığın konu'],['questions','Kendine sorduğun sorular'],['recall','Kaynağa bakmadan hatırladıkların'],['gaps','Eksik kalan noktalar']
    ]} form={form} setForm={setForm} onSave={()=>saveSession(key,'Aktif Hatırlama',form,20)}/>}

    {key==='FEYNMAN'&&<TechniqueForm title="Feynman Uygulaması" fields={[
      ['topic','Kavram / konu'],['simple','Bir öğrenciye anlatır gibi sade anlatımın'],['gaps','Anlatırken takıldığın noktalar'],['final','Düzeltilmiş ve sadeleştirilmiş son anlatım']
    ]} form={form} setForm={setForm} onSave={()=>saveSession(key,'Feynman Tekniği',form,25)}/>}

    {key==='CORNELL'&&<TechniqueForm title="Cornell Not Uygulaması" fields={[
      ['topic','Konu başlığı'],['notes','Ana notlar'],['cues','Anahtar kelimeler / sorular'],['summary','Kendi cümlelerinle kısa özet']
    ]} form={form} setForm={setForm} onSave={()=>saveSession(key,'Cornell Not Sistemi',form,30)}/>}

    {key==='SQ3R'&&<TechniqueForm title="SQ3R Uygulaması" fields={[
      ['survey','Survey — bölümde ilk fark ettiklerin'],['questions','Question — cevaplamak istediğin sorular'],['read','Read — önemli bilgiler'],['recite','Recite — kaynağa bakmadan anlattıkların'],['review','Review — son tekrar özeti']
    ]} form={form} setForm={setForm} onSave={()=>saveSession(key,'SQ3R',form,35)}/>}

    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}
  </div>;
}

function TechniqueForm({title,fields,form,setForm,onSave}:{title:string;fields:string[][];form:any;setForm:(x:any)=>void;onSave:()=>void}){
  return <div className="card"><h2>{title}</h2><div className="form">{fields.map(([key,label])=><div className="field" key={key}><label>{label}</label><textarea rows={key==='summary'||key==='final'?4:3} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}/></div>)}<button className="btn primary" onClick={onSave}>Uygulamayı Tamamla ve Kaydet</button></div></div>
}
