'use client';
import {useCallback,useEffect,useState} from 'react';

type Question={id:string;sourceKind:string;topic:string;prompt:string;options:Record<string,string>;correctAnswer:string;explanation:string;reviewStatus:string;reviewNote:string|null};
type Summary={total:number;imported:number;approved:number;pending:number;rejected:number;items:Question[];page:number};
const gold='#e7bc5b',navy='#09264f';
export function KeksMathAdmin(){
 const [data,setData]=useState<Summary|null>(null);
 const [status,setStatus]=useState<'PENDING'|'APPROVED'|'REJECTED'|'ALL'>('PENDING');
 const [page,setPage]=useState(0);
 const [index,setIndex]=useState(0);
 const [edit,setEdit]=useState<Question|null>(null);
 const [note,setNote]=useState('');
 const [checkedMath,setCheckedMath]=useState(false);
 const [checkedSolution,setCheckedSolution]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [importProgress,setImportProgress]=useState(0);
 const load=useCallback(async()=>{
  const r=await fetch('/api/admin/keks-matematik?page='+page+'&status='+status,{cache:'no-store'});
  const j=await r.json();
  if(!r.ok)throw new Error(j.error||'Veriler alınamadı.');
  setData(j);return j as Summary;
 },[page,status]);
 useEffect(()=>{void load().catch(e=>setMessage((e as Error).message));},[load]);
 useEffect(()=>{
   const q=data?.items[index]||null;
   setEdit(q?{...q,options:{...q.options}}:null);
   setNote('');setCheckedMath(false);setCheckedSolution(false);
 },[data,index]);
 async function importBundle(){
  if(!confirm('2.072 matematik sorusu TASLAK olarak içe aktarılsın mı? Bu işlem öğrencilere soru yayımlamaz.'))return;
  setBusy(true);setMessage('İçe aktarma başladı.');
  try{
   const total=2072;
   for(let offset=0;offset<total;offset+=50){
    const r=await fetch('/api/admin/keks-matematik',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({offset,limit:50})});
    const j=await r.json();if(!r.ok)throw new Error(j.error||'İçe aktarma sırasında hata oluştu.');
    setImportProgress(j.nextOffset);
   }
   setMessage('2.072 kayıt denetlendi; yeni kayıtlar onay bekleyen taslak durumundadır.');
   setPage(0);setStatus('PENDING');setIndex(0);
   await load();
  }catch(e){setMessage('İçe aktarma durdu: '+(e as Error).message+'. Aynı işlemi tekrar başlatabilirsiniz; mevcut kayıtlar atlanır.');}
  finally{setBusy(false);}
 }
 async function save(action:'APPROVE'|'REJECT'|'PENDING'){
  if(!edit)return;
  if(action==='APPROVE'&&!confirm('Soruyu ve çözümünü bağımsız olarak kontrol ettiğinizi onaylıyor musunuz?'))return;
  setBusy(true);setMessage('');
  try{
   const r=await fetch('/api/admin/keks-matematik',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({
    id:edit.id,action,prompt:edit.prompt,topic:edit.topic,options:edit.options,correctAnswer:edit.correctAnswer,
    explanation:edit.explanation,note,checkedMath,checkedSolution
   })});
   const j=await r.json();if(!r.ok)throw new Error(j.error||'Onay kaydedilemedi.');
   setMessage('Soru '+(action==='APPROVE'?'doğrulanarak yayımlandı':action==='REJECT'?'reddedildi':'taslağa alındı')+'.');
   setIndex(0);await load();
  }catch(e){setMessage('Hata: '+(e as Error).message);}
  finally{setBusy(false);}
 }
 return <div className="stack" style={{maxWidth:1100,margin:'auto'}}>
  <section className="card" style={{background:navy,color:'#fff',border:'2px solid '+gold,padding:22}}>
   <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
    <img src="/keks-official-2026.webp" alt="KEKS Akademi" width={82} height={82}/>
    <div><h1 style={{margin:0,color:gold}}>KEKS Matematik · Editör Merkezi</h1>
     <p style={{color:'#f3f4f6',margin:'8px 0'}}>Matematiksel doğruluk ve adım adım çözüm onayı olmadan hiçbir soru öğrenciye açılmaz.</p></div>
   </div>
  </section>
  <section className="card">
   <h2>Soru havuzu</h2>
   <div className="row" style={{gap:14,flexWrap:'wrap'}}>
    <strong>Kaynak: {data?.total||2072}</strong><span>İçe aktarılan: {data?.imported??'–'}</span>
    <span>Onaylanan: {data?.approved??'–'}</span><span>Kontrol bekleyen: {data?.pending??'–'}</span>
    <span>Reddedilen: {data?.rejected??'–'}</span>
   </div>
   <p className="muted">Kaynak bankadaki bütün sorular başlangıçta editör kontrolü gerektirir. İçe aktarma otomatik yayın yapmaz.</p>
   <button className="btn primary" disabled={busy} onClick={()=>void importBundle()}>{busy?'İşlem sürüyor…':'2.072 soruyu taslak olarak içe aktar'}</button>
   {importProgress>0&&<p role="status">{importProgress} / 2072 kayıt işlendi.</p>}
  </section>
  <section className="card">
   <div className="row">
    <div className="field"><label>Durum</label><select value={status} onChange={e=>{setStatus(e.target.value as typeof status);setPage(0);setIndex(0);}}>
      <option value="PENDING">Kontrol bekleyen</option><option value="APPROVED">Onaylanan</option><option value="REJECTED">Reddedilen</option><option value="ALL">Tümü</option>
    </select></div>
    <button className="btn" disabled={busy||page===0} onClick={()=>{setPage(p=>p-1);setIndex(0);}}>Önceki sayfa</button>
    <span>Sayfa {page+1}</span>
    <button className="btn" disabled={busy||(data?.items.length||0)<20} onClick={()=>{setPage(p=>p+1);setIndex(0);}}>Sonraki sayfa</button>
   </div>
   <div className="row" style={{flexWrap:'wrap',marginTop:12}}>
    {data?.items.map((q,i)=><button type="button" key={q.id} onClick={()=>setIndex(i)} className={'btn '+(i===index?'primary':'')}>{page*20+i+1}</button>)}
   </div>
   {!edit?<p className="notice">Bu filtre için kayıt bulunamadı. Önce taslak içe aktarma işlemini yapın.</p>:<div className="stack" style={{marginTop:20}}>
    <p><strong>{edit.sourceKind}</strong> · {edit.reviewStatus}</p>
    <label className="field">Konu<input value={edit.topic} onChange={e=>setEdit(x=>x?{...x,topic:e.target.value}:x)}/></label>
    <label className="field">Soru metni<textarea rows={4} value={edit.prompt} onChange={e=>setEdit(x=>x?{...x,prompt:e.target.value}:x)}/></label>
    {('ABCDE'.split('')).map(key=><label className="field" key={key}>{key} seçeneği
     <input value={edit.options[key]||''} onChange={e=>setEdit(x=>x?{...x,options:{...x.options,[key]:e.target.value}}:x)}/>
    </label>)}
    <label className="field">Doğru seçenek<select value={edit.correctAnswer} onChange={e=>setEdit(x=>x?{...x,correctAnswer:e.target.value}:x)}>
     {('ABCDE'.split('')).map(key=><option key={key}>{key}</option>)}
    </select></label>
    <label className="field">Ayrıntılı çözüm (en az 100 karakter)
     <textarea rows={7} value={edit.explanation||''} onChange={e=>setEdit(x=>x?{...x,explanation:e.target.value}:x)}/>
    </label>
    <label><input type="checkbox" checked={checkedMath} onChange={e=>setCheckedMath(e.target.checked)}/> Soru ve bütün seçenekleri matematiksel olarak kontrol ettim.</label>
    <label><input type="checkbox" checked={checkedSolution} onChange={e=>setCheckedSolution(e.target.checked)}/> Adım adım çözümü bağımsız olarak doğruladım.</label>
    <label className="field">Editör inceleme notu (en az 20 karakter)
     <textarea rows={2} value={note} onChange={e=>setNote(e.target.value)}/>
    </label>
    <div className="row" style={{flexWrap:'wrap'}}>
     <button className="btn primary" disabled={busy||!checkedMath||!checkedSolution||note.trim().length<20||edit.explanation.trim().length<100} onClick={()=>void save('APPROVE')}>Denetle ve yayımla</button>
     <button className="btn" disabled={busy||note.trim().length<20} onClick={()=>void save('REJECT')}>Reddet</button>
     <button className="btn" disabled={busy||note.trim().length<20} onClick={()=>void save('PENDING')}>Taslak olarak sakla</button>
    </div>
   </div>}
  </section>
  {message&&<p className="notice" role="status">{message}</p>}
 </div>;
}
