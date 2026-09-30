'use client';

import { FormEvent,useState } from 'react';

const LABELS:any={
  MINI_TEST:'Mini Test',
  FLASHCARDS:'Flashcard',
  MATCHING:'Eşleştirme',
  FILL_BLANK:'Boşluk Doldurma',
  ACTIVE_RECALL:'Aktif Hatırlama Kartları',
  MICRO_GAME:'Mikro Oyun',
  QUIZ:'Soru Testi',
  SLIDES:'Slayt Sunumu',
  INFOGRAPHIC:'İnfografik',
  AUDIO_SCRIPT:'Sesli Anlatım',
  VIDEO_LESSON:'Videolu Anlatım',
  SIMILAR_QUESTIONS:'Benzer Sorular'
};
const CORE=['MINI_TEST','FLASHCARDS','MATCHING','FILL_BLANK','ACTIVE_RECALL','MICRO_GAME'];
const ALL=Object.keys(LABELS);

export function ContentStudio({studentId,canPublish=false,existing=[]}:{studentId?:string;canPublish?:boolean;existing?:any[]}){
  const [upload,setUpload]=useState<any>(null);
  const [analysis,setAnalysis]=useState<any>(null);
  const [types,setTypes]=useState<string[]>(CORE);
  const [items,setItems]=useState<any[]>(existing);
  const [msg,setMsg]=useState('');

  async function uploadFile(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('Dosya analiz ediliyor...');
    const fd=new FormData(e.currentTarget); if(studentId)fd.set('studentId',studentId);
    const r=await fetch('/api/content-studio/upload',{method:'POST',body:fd});const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Yükleme başarısız.'));return}
    setUpload(j.upload);setAnalysis(j.analysis);
    const suggested=(j.analysis?.suggestedTypes||[]).filter((x:string)=>ALL.includes(x));
    setTypes(suggested.length?suggested:CORE);
    setMsg(j.upload?.status==='APPROVED'
      ?'Onaylı kaynak hazır. Üretilecek içerikleri seçin.'
      :canPublish
        ?'Kaynak analiz edildi. İçerik üretiminden önce kaynağı onaylayın.'
        :'Kaynak analiz edildi. Koç/yönetici onayından sonra içerik üretilebilir.');
  }

  async function approveSource(approved:boolean){
    if(!upload)return;
    const r=await fetch('/api/content-studio/uploads/'+upload.id+'/approve',{
      method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({approved})
    });
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Kaynak onayı güncellenemedi.'));return}
    setUpload((x:any)=>({...x,...j.upload}));
    setMsg(approved?'Kaynak onaylandı. Artık kalite filtreli içerik üretilebilir.':'Kaynak reddedildi.');
  }

  async function generate(){
    if(!upload)return;
    if(upload.status!=='APPROVED'){setMsg('Hata: Önce kaynak koç/yönetici tarafından onaylanmalı.');return}
    setMsg('İçerikler öğrenci seviyesine göre hazırlanıyor ve kalite filtresinden geçiriliyor...');
    const r=await fetch('/api/content-studio/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({uploadId:upload.id,types})});
    const j=await r.json();if(!r.ok){setMsg('Hata: '+(j.error||'Üretim başarısız.'));return}
    setItems(prev=>{const map=new Map(prev.map((x:any)=>[x.id,x]));for(const x of j.outputs)map.set(x.id,x);return [...map.values()]});
    setMsg('Üretim tamamlandı. İçerikler doğrudan öğrenciye gitmedi; kalite incelemesi ve yayın onayı bekliyor.');
  }

  async function publish(id:string,student:boolean,parent:boolean){
    const r=await fetch('/api/content-studio/items/'+id+'/publish',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({visibleToStudent:student,visibleToParent:parent})});
    const j=await r.json();if(!r.ok){setMsg('Hata: '+(j.error||'Yayınlama başarısız.'));return}
    setItems(xs=>xs.map(x=>x.id===id?{...x,...j.row}:x));setMsg(student||parent?'Kalite filtresini geçen içerik yayınlandı.':'İçerik kalite incelemesine geri alındı.');
  }

  return <div className="stack">
    <div className="card contentStudioUpload">
      <div className="moduleEyebrow">1 · ONAYLI KAYNAK</div>
      <div className="moduleHeaderRow"><div><h2>Kaynağı yükle, analiz et ve onayla</h2><p className="muted">PDF, DOCX, PPTX veya metin yükleyin. Öğrenme içeriği yalnız koç/yönetici tarafından onaylanan kaynaktan üretilebilir.</p></div><span className="moduleIcon">⇧</span></div>
      <form className="form" onSubmit={uploadFile}>
        <div className="field"><label>Kaynak dosya</label><input name="file" type="file" accept=".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp" required/></div>
        <button className="btn primary">Dosyayı Yükle ve Analiz Et</button>
      </form>
      {upload&&<div className="notice" style={{marginTop:12}}>
        <strong>Kaynak durumu:</strong> {upload.status}
        {canPublish&&upload.status!=='APPROVED'&&<div className="row" style={{marginTop:10}}>
          <button className="btn primary" type="button" onClick={()=>approveSource(true)}>Kaynağı Onayla</button>
          <button className="btn" type="button" onClick={()=>approveSource(false)}>Reddet</button>
        </div>}
      </div>}
    </div>

    {analysis&&<div className="card contentStudioAnalysis">
      <div className="moduleEyebrow">2 · SEVİYEYE GÖRE ÜRETİM</div>
      <h3>Kaynak Analizi</h3><p><strong>{analysis.title}</strong></p>
      <div className="row"><span className="pill">{analysis.questionCount} soru işareti</span><span className="pill">{analysis.keyTerms?.length||0} ana kavram</span>{analysis.isQuestionSource&&<span className="pill">Soru kaynağı</span>}</div>
      <h4>Üretilecek içerikleri seç</h4>
      <div className="contentTypeGrid">{ALL.map(t=><label className="card" key={t} style={{padding:12}}><input type="checkbox" checked={types.includes(t)} onChange={e=>setTypes(x=>e.target.checked?[...x,t]:x.filter(v=>v!==t))}/> <strong>{LABELS[t]}</strong></label>)}</div>
      <button className="btn primary" disabled={!types.length||upload?.status!=='APPROVED'} onClick={generate}>Onaylı Kaynaktan İçerik Üret</button>
      {upload?.status!=='APPROVED'&&<p className="muted">Üretim butonu kaynak onaylanana kadar kapalıdır.</p>}
    </div>}

    {items.length>0&&<div className="card contentStudioResults">
      <div className="moduleEyebrow">3 · KALİTE FİLTRESİ & YAYIN</div>
      <h2>Üretilen İçerikler</h2>
      <p className="muted">AI/otomatik üretim doğrudan öğrenciye gitmez. Önce kalite eşiği, ardından koç/yönetici yayın onayı gerekir.</p>
      <div className="stack">{items.map((x:any)=>{
        const passed=x.quality?.passed!==false && Number(x.qualityScore||0)>=70;
        return <div className="card" key={x.id}>
          <div className="row" style={{justifyContent:'space-between'}}>
            <div>
              <span className="pill">{LABELS[x.type]||x.type}</span>
              <h3>{x.title}</h3>
              <p className="muted">Kalite: {x.qualityScore??'—'} / 100 · Durum: {x.status||'QUALITY_REVIEW'}</p>
              <p className={passed?'muted':'riskText'}>{passed?'Otomatik kalite filtresi uygun. Yayın için insan onayı bekliyor.':'Kalite filtresi geçilmedi; öğrenciye yayınlanamaz.'}</p>
              {Array.isArray(x.quality?.issues)&&x.quality.issues.length>0&&<p className="muted">{x.quality.issues.join(' · ')}</p>}
            </div>
            <a className="btn primary" href={'/icerik/'+x.id}>Aç</a>
          </div>
          {canPublish&&<div className="row">
            <button className="btn" disabled={!passed} onClick={()=>publish(x.id,true,false)}>Öğrenciye Yayınla</button>
            <button className="btn" disabled={!passed} onClick={()=>publish(x.id,true,true)}>Öğrenci + Veliye Yayınla</button>
            <button className="btn" onClick={()=>publish(x.id,false,false)}>İncelemeye Al</button>
          </div>}
        </div>;
      })}</div>
    </div>}
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
  </div>;
}
