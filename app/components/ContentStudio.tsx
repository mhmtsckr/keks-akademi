'use client';

import { FormEvent,useState } from 'react';

const LABELS:any={
  FLASHCARDS:'Flashcard',QUIZ:'Soru Testi',SLIDES:'Slayt Sunumu',INFOGRAPHIC:'İnfografik',
  AUDIO_SCRIPT:'Sesli Anlatım',VIDEO_LESSON:'Videolu Anlatım',SIMILAR_QUESTIONS:'Benzer Sorular',
  MINI_TEST:'Mini Test',MATCHING:'Eşleştirme',FILL_BLANK:'Boşluk Doldurma',
  ACTIVE_RECALL:'Aktif Hatırlama Kartları',MICRO_GAME:'Mikro Oyun'
};
const ALL=Object.keys(LABELS);

export function ContentStudio({studentId,canPublish=false,existing=[]}:{studentId?:string;canPublish?:boolean;existing?:any[]}){
  const [upload,setUpload]=useState<any>(null);
  const [analysis,setAnalysis]=useState<any>(null);
  const [types,setTypes]=useState<string[]>([]);
  const [items,setItems]=useState<any[]>(existing);
  const [msg,setMsg]=useState('');

  async function uploadFile(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('Dosya analiz ediliyor...');
    const fd=new FormData(e.currentTarget); if(studentId)fd.set('studentId',studentId);
    const r=await fetch('/api/content-studio/upload',{method:'POST',body:fd});const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Yükleme başarısız.'));return}
    setUpload(j.upload);setAnalysis(j.analysis);
    const suggested=[...(j.analysis?.suggestedTypes||[]),'MINI_TEST','MATCHING','FILL_BLANK','ACTIVE_RECALL','MICRO_GAME'];
    setTypes([...new Set(suggested)].filter(x=>ALL.includes(String(x))));
    if(j.upload?.status==='APPROVED')setMsg('Onaylı kaynak hazır. Üretilecek içerikleri seçin.');
    else setMsg(j.deduplicated?'Kaynak daha önce yüklenmiş. Onay durumu kontrol edildi.':'Dosya yüklendi. İçerik üretiminden önce koç/yönetici kaynak onayı gerekir.');
  }

  async function approveSource(approved:boolean){
    if(!upload)return;
    const r=await fetch('/api/content-studio/uploads/'+upload.id+'/approve',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({approved})});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Kaynak onayı güncellenemedi.'));return}
    setUpload((x:any)=>({...x,status:j.upload.status}));
    setMsg(approved?'Kaynak onaylandı. Artık içerik üretilebilir.':'Kaynak reddedildi; bu kaynaktan içerik üretilemez.');
  }

  async function generate(){
    if(!upload)return;
    if(upload.status!=='APPROVED'){setMsg('Hata: Önce kaynağı koç/yönetici onayından geçirin.');return}
    setMsg('İçerikler öğrenci düzeyine göre hazırlanıyor ve kalite filtresinden geçiriliyor...');
    const r=await fetch('/api/content-studio/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({uploadId:upload.id,types})});
    const j=await r.json();if(!r.ok){setMsg('Hata: '+(j.error||'Üretim başarısız.'));return}
    setItems(prev=>{const map=new Map(prev.map((x:any)=>[x.id,x]));for(const x of j.outputs)map.set(x.id,x);return [...map.values()]});
    const failed=j.outputs?.filter((x:any)=>x.status==='QUALITY_FAILED').length||0;
    setMsg(failed?failed+' içerik kalite filtresini geçemedi; öğrenciye yayınlanamaz. Diğer içerikler insan onayı bekliyor.':'İçerikler kalite filtresini geçti. Öğrenciye açılmadan önce koç/yönetici onayı bekliyor.');
  }

  async function publish(id:string,student:boolean,parent:boolean){
    const r=await fetch('/api/content-studio/items/'+id+'/publish',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({visibleToStudent:student,visibleToParent:parent})});
    const j=await r.json();if(!r.ok){setMsg('Hata: '+(j.error||'Yayınlama başarısız.'));return}
    setItems(xs=>xs.map(x=>x.id===id?{...x,...j.row}:x));setMsg(student||parent?'İçerik insan onayıyla yayınlandı.':'İçerik taslağa alındı.');
  }

  return <div className="stack">
    <div className="card contentStudioUpload">
      <div className="moduleEyebrow">1 · ONAYLI KAYNAK</div>
      <div className="moduleHeaderRow"><div><h2>Kaynağı yükle, analiz et ve onayla</h2><p className="muted">Yeni kaynaklar otomatik olarak öğrenci içeriğine dönüşmez. Önce koç/yönetici onayından geçer.</p></div><span className="moduleIcon">⇧</span></div>
      <form className="form" onSubmit={uploadFile}>
        <div className="field"><label>Kaynak dosya</label><input name="file" type="file" accept=".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp" required/></div>
        <button className="btn primary">Dosyayı Yükle ve Analiz Et</button>
      </form>
      {upload&&<div className="notice" style={{marginTop:12}}><strong>Kaynak durumu:</strong> {upload.status}
        {canPublish&&upload.status!=='APPROVED'&&<div className="row" style={{marginTop:10}}><button type="button" className="btn primary" onClick={()=>approveSource(true)}>Kaynağı Onayla</button><button type="button" className="btn" onClick={()=>approveSource(false)}>Reddet</button></div>}
      </div>}
    </div>

    {analysis&&<div className="card contentStudioAnalysis">
      <div className="moduleEyebrow">2 · İÇERİK MOTORU</div>
      <h3>Öğrenci seviyesine göre üretilecek içerikler</h3>
      <p><strong>{analysis.title}</strong></p>
      <div className="row"><span className="pill">{analysis.keyTerms?.length||0} ana kavram</span>{analysis.isQuestionSource&&<span className="pill">Soru kaynağı</span>}<span className="pill">{upload?.status==='APPROVED'?'ONAYLI KAYNAK':'ONAY BEKLİYOR'}</span></div>
      <div className="contentTypeGrid" style={{marginTop:12}}>{ALL.map(t=><label className="card" key={t} style={{padding:12}}><input type="checkbox" checked={types.includes(t)} onChange={e=>setTypes(x=>e.target.checked?[...x,t]:x.filter(v=>v!==t))}/> <strong>{LABELS[t]}</strong></label>)}</div>
      <button className="btn primary" disabled={!types.length||upload?.status!=='APPROVED'} onClick={generate}>Seçilen İçerikleri Üret ve Kalite Kontrolünden Geçir</button>
      {upload?.status!=='APPROVED'&&<p className="muted">Üretim düğmesi kaynak onaylanana kadar kapalıdır.</p>}
    </div>}

    {items.length>0&&<div className="card contentStudioResults">
      <div className="moduleEyebrow">3 · KALİTE FİLTRESİ & İNSAN ONAYI</div>
      <h2>Üretilen İçerikler</h2>
      <p className="muted">AI veya otomatik üretim hiçbir zaman doğrudan öğrenciye gitmez. Kalite eşiği en az 75/100’dür ve son yayın kararı koç/yöneticiye aittir.</p>
      <div className="stack">{items.map((x:any)=>{
        const qualityOk=(x.qualityScore??0)>=75&&x.status!=='QUALITY_FAILED';
        return <div className="card" key={x.id}><div className="row" style={{justifyContent:'space-between'}}><div><span className="pill">{LABELS[x.type]||x.type}</span><h3>{x.title}</h3><p className="muted">Kalite: {x.qualityScore??'—'} / 100 · Durum: {x.status||'DRAFT'}</p>{x.generationSource&&<small>Üretim: {x.generationSource}</small>}</div><a className="btn primary" href={'/icerik/'+x.id}>Önizle</a></div>
        {Array.isArray(x.qualityIssues)&&x.qualityIssues.length>0&&<div className="notice error">{x.qualityIssues.join(' · ')}</div>}
        {canPublish&&<div className="row"><button className="btn" disabled={!qualityOk} onClick={()=>publish(x.id,true,false)}>Öğrenciye Onayla ve Yayınla</button><button className="btn" disabled={!qualityOk} onClick={()=>publish(x.id,true,true)}>Öğrenci + Veliye Yayınla</button><button className="btn" onClick={()=>publish(x.id,false,false)}>Taslağa Al</button></div>}
        {!qualityOk&&<p className="muted">Kalite filtresini geçmeyen içerik yayınlanamaz.</p>}
        </div>
      })}</div>
    </div>}
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
  </div>;
}
