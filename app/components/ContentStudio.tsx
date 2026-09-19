'use client';

import { FormEvent,useState } from 'react';

const LABELS:any={
  FLASHCARDS:'Soru Kartları',QUIZ:'Soru Testi',SLIDES:'Slayt Sunumu',INFOGRAPHIC:'İnfografik',
  AUDIO_SCRIPT:'Sesli Anlatım',VIDEO_LESSON:'Videolu Anlatım',SIMILAR_QUESTIONS:'Benzer Sorular'
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
    setUpload(j.upload);setAnalysis(j.analysis);setTypes(j.analysis?.suggestedTypes||[]);
    setMsg(j.deduplicated?'Bu dosya daha önce yüklenmiş. Mevcut kaynak kullanılıyor.':j.extractionError?'Dosya yüklendi; metin çıkarma notu: '+j.extractionError:'Dosya hazır. Üretmek istediğiniz içerikleri seçin.');
  }

  async function generate(){
    if(!upload)return;setMsg('En iyi içerik sürümü hazırlanıyor...');
    const r=await fetch('/api/content-studio/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({uploadId:upload.id,types})});
    const j=await r.json();if(!r.ok){setMsg('Hata: '+(j.error||'Üretim başarısız.'));return}
    setItems(prev=>{const map=new Map(prev.map((x:any)=>[x.id,x]));for(const x of j.outputs)map.set(x.id,x);return [...map.values()]});
    setMsg('İçerikler hazır. Aynı içerik daha önce üretilmişse yeniden oluşturulmadı.');
  }

  async function publish(id:string,student:boolean,parent:boolean){
    const r=await fetch('/api/content-studio/items/'+id+'/publish',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({visibleToStudent:student,visibleToParent:parent})});
    const j=await r.json();if(!r.ok){setMsg('Hata: '+(j.error||'Yayınlama başarısız.'));return}
    setItems(xs=>xs.map(x=>x.id===id?{...x,...j.row}:x));setMsg('Yayın ayarları güncellendi.');
  }

  return <div className="stack">
    <div className="card contentStudioUpload">
      <div className="moduleEyebrow">1 · KAYNAK</div>
      <div className="moduleHeaderRow"><div><h2>Dosyayı yükle ve analiz et</h2><p className="muted">PDF, DOCX, PPTX veya metin yükleyin. Aynı kaynak tekrar yüklenirse mevcut kayıt kullanılır.</p></div><span className="moduleIcon">⇧</span></div>
      <form className="form" onSubmit={uploadFile}>
        <div className="field"><label>Kaynak dosya</label><input name="file" type="file" accept=".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp" required/></div>
        <button className="btn primary">Dosyayı Yükle ve Analiz Et</button>
      </form>
    </div>

    {analysis&&<div className="card contentStudioAnalysis"><div className="moduleEyebrow">2 · ANALİZ</div><h3>Kaynak Analizi</h3><p><strong>{analysis.title}</strong></p><div className="row"><span className="pill">{analysis.questionCount} soru işareti</span><span className="pill">{analysis.keyTerms?.length||0} ana kavram</span>{analysis.isQuestionSource&&<span className="pill">Soru kaynağı</span>}</div><h4>Üretilecek içerikleri seç</h4><div className="contentTypeGrid">{ALL.map(t=><label className="card" key={t} style={{padding:12}}><input type="checkbox" checked={types.includes(t)} onChange={e=>setTypes(x=>e.target.checked?[...x,t]:x.filter(v=>v!==t))}/> <strong>{LABELS[t]}</strong></label>)}</div><button className="btn primary" disabled={!types.length} onClick={generate}>Seçilen İçerikleri Üret</button></div>}

    {items.length>0&&<div className="card contentStudioResults"><div className="moduleEyebrow">3 · ÜRETİM</div><h2>Üretilen İçerikler</h2><div className="stack">{items.map((x:any)=><div className="card" key={x.id}><div className="row" style={{justifyContent:'space-between'}}><div><span className="pill">{LABELS[x.type]||x.type}</span><h3>{x.title}</h3><p className="muted">Kalite: {x.qualityScore??'—'} / 100 · {x.reused?'Mevcut en iyi sürüm kullanıldı':x.status||'DRAFT'}</p></div><a className="btn primary" href={'/icerik/'+x.id}>Aç</a></div>{canPublish&&<div className="row"><button className="btn" onClick={()=>publish(x.id,true,false)}>Öğrenciye Yayınla</button><button className="btn" onClick={()=>publish(x.id,true,true)}>Öğrenci + Veliye Yayınla</button><button className="btn" onClick={()=>publish(x.id,false,false)}>Taslağa Al</button></div>}</div>)}</div></div>}
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
  </div>;
}
