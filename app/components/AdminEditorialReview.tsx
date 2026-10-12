'use client';

import {useEffect,useState} from 'react';

const STAGES=[
  {value:'SUBJECT',label:'Alan / Dil Editörü'},
  {value:'ASSESSMENT',label:'Ölçme-Değerlendirme Editörü'},
  {value:'SOURCE_RIGHTS',label:'Bilimsel Kaynak / Telif Editörü'}
] as const;
const names=['A','B','C','D','E'];
const initialNote='';

export function AdminEditorialReview(){
  const [items,setItems]=useState<any[]>([]);
  const [counts,setCounts]=useState<{status:string;count:number}[]>([]);
  const [reviewers,setReviewers]=useState<any[]>([]);
  const [myStages,setMyStages]=useState<string[]>([]);
  const [status,setStatus]=useState('PENDING');
  const [page,setPage]=useState(0);
  const [selectedId,setSelectedId]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [stage,setStage]=useState('SUBJECT');
  const [decision,setDecision]=useState('APPROVE');
  const [note,setNote]=useState(initialNote);
  const [reviewed,setReviewed]=useState(false);
  const [rights,setRights]=useState(false);
  const [staffEmail,setStaffEmail]=useState('');
  const [staffStage,setStaffStage]=useState('SUBJECT');
  const [file,setFile]=useState<File|null>(null);
  const [importProgress,setImportProgress]=useState('');
  const [edit,setEdit]=useState<any>(null);
  const [editReason,setEditReason]=useState('');
  const selected=items.find(x=>x.id===selectedId)||items[0];

  async function load(){
    const r=await fetch('/api/admin/editorial?status='+encodeURIComponent(status)+'&page='+page,{cache:'no-store'});
    const j=await r.json();
    if(!r.ok){setMessage(j.error||'Editör kaydı yüklenemedi.');return}
    setItems(j.items||[]);setCounts(j.counts||[]);
    setReviewers(j.reviewers||[]);setMyStages(j.myStages||[]);
  }
  useEffect(()=>{void load()},[page,status]);
  useEffect(()=>{
    if(!selected){setEdit(null);return}
    setSelectedId(selected.id);
    setEdit({
      examType:selected.examType,subject:selected.subject,topic:selected.topic,
      skill:selected.skill||'',difficulty:selected.difficulty||'',passage:selected.passage,
      stem:selected.stem,options:selected.options,correctAnswer:selected.correctAnswer,
      explanation:selected.explanation,sourceRefs:selected.sourceRefs,
      qualityFlags:selected.qualityFlags
    });
    setNote('');setReviewed(false);setRights(false);
  },[selected?.id,selected?.contentHash]);

  async function send(body:Record<string,unknown>,method:'POST'|'PATCH'='PATCH'){
    setBusy(true);setMessage('');
    try{
      const r=await fetch('/api/admin/editorial',{
        method,headers:{'content-type':'application/json'},body:JSON.stringify(body)
      });
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'İşlem tamamlanamadı.');
      setMessage('İşlem tamamlandı. '+(j.nextRevision?'Yeni sürüm: '+j.nextRevision:''));
      await load();
    }catch(e){setMessage('Hata: '+(e as Error).message)}
    finally{setBusy(false)}
  }

  async function importFile(){
    if(!file)return;
    setBusy(true);setMessage('');
    try{
      const raw=JSON.parse(await file.text());
      const records:Array<any>=Array.isArray(raw)?raw:raw.items;
      if(!Array.isArray(records)||records.length===0)
        throw new Error('İçe aktarma JSON dosyasında items dizisi bulunamadı.');
      if(records.length>7000)throw new Error('Tek seferde en çok 7000 kayıt kabul edilir.');
      let inserted=0,skipped=0;
      for(let i=0;i<records.length;i+=25){
        const batch=records.slice(i,i+25);
        const r=await fetch('/api/admin/editorial',{method:'POST',
          headers:{'content-type':'application/json'},
          body:JSON.stringify({operation:'IMPORT',items:batch})
        });
        const data=await r.json();
        if(!r.ok)throw new Error((i+1)+' numaralı kayıttan itibaren: '+(data.error||'İçe aktarılamadı.'));
        inserted+=data.inserted;skipped+=data.skipped;
        setImportProgress(Math.min(records.length,i+25)+' / '+records.length);
      }
      setMessage(inserted+' yeni taslak alındı, '+skipped+' mevcut kayıt atlandı. Hiçbiri yayımlanmadı.');
      setPage(0);setStatus('PENDING');await load();
    }catch(e){setMessage('İçe aktarma durduruldu: '+(e as Error).message+'. İşlemi tekrar başlatırsanız mevcut kayıtlar atlanır.')}
    finally{setBusy(false)}
  }

  function updateEdit(name:string,val:unknown){
    setEdit((prev:any)=>({...prev,[name]:val}));
  }
  async function saveRevision(){
    if(!selected||!edit)return;
    await send({operation:'REVISE',id:selected.id,revision:selected.revision,
      contentHash:selected.contentHash,reason:editReason,data:edit});
  }
  async function submitReview(){
    if(!selected)return;
    await send({operation:'REVIEW',id:selected.id,revision:selected.revision,
      contentHash:selected.contentHash,stage,decision,note,
      confirmedReviewed:reviewed,rightsVerified:rights});
  }
  async function publish(){
    if(!selected||!selected.gate?.ready)return;
    if(!window.confirm(selected.externalId+' sorusunu öğrencilere yayımlamak istiyor musunuz?'))return;
    await send({operation:'PUBLISH',id:selected.id,revision:selected.revision,
      contentHash:selected.contentHash,confirmedPublish:true});
  }
  return <div style={{display:'grid',gap:18}}>
    <section className="card" style={{padding:22}}>
      <h2>KEKS • Editöryal Onay Merkezi</h2>
      <p>6000 soru için insan editörü imzaları, sürüm geçmişi ve kanıt bazlı yayın kapısı.
        Otomatik kalite puanı <b>insan onayı değildir</b>. Taslaklar yayınlanmadan öğrencilere gösterilmez.</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:12}}>
        {counts.map(x=><span className="card" key={x.status} style={{padding:12}}>
          <b>{x.count}</b> {x.status==='PENDING'?'İncelemede':x.status==='PUBLISHED'?'Yayımlanan':x.status}
        </span>)}
      </div>
    </section>

    <section className="card" style={{padding:22}}>
      <h3>1 · Taslakları gizli havuza al</h3>
      <p>Yalnızca yönetici hesabıyla yüklenir. JSON içeriği GitHub'a gönderilmez; veritabanında onaysız saklanır.
         25'lik gruplarla güvenli ve tekrarlanabilir içe aktarma kullanılır.</p>
      <input aria-label="6000 soru JSON dosyası" type="file" accept=".json,application/json"
        onChange={e=>setFile(e.target.files?.[0]||null)}/>
      <div style={{marginTop:10}}>
        <button className="homeBtn homeBtnGold" disabled={busy||!file} onClick={()=>void importFile()}>
          İçe Aktar (yayımlama yok)
        </button>
      </div>
      {importProgress&&<p role="status">İlerleme: {importProgress}</p>}
    </section>

    <section className="card" style={{padding:22}}>
      <h3>2 · Gerçek editörleri yetkilendir</h3>
      <p>Üç farklı <b>aktif yönetici hesabı</b> gereklidir. Her karar oturum açmış gerçek kullanıcı ID'si,
      tarih ve gerekçeyle kaydedilir. Hesabı olmayan editöre onay verilemez.</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
        <input type="email" placeholder="Yetkili editörün kayıtlı e-postası" aria-label="Editör e-posta"
          value={staffEmail} onChange={e=>setStaffEmail(e.target.value)} style={{flex:'1 1 250px'}}/>
        <select aria-label="Editör aşaması" value={staffStage} onChange={e=>setStaffStage(e.target.value)}>
          {STAGES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button disabled={busy||!staffEmail} onClick={()=>void send({operation:'ASSIGN',email:staffEmail,stage:staffStage},'POST')}>
          Yetkilendir
        </button>
        <button disabled={busy||!staffEmail} onClick={()=>void send({operation:'REVOKE',email:staffEmail,stage:staffStage},'POST')}>
          Yetkiyi kaldır
        </button>
      </div>
      <div style={{marginTop:12}}>
        {reviewers.length===0?<p className="muted">Henüz editör atanmadı.</p>:
        reviewers.map((r,i)=><p key={i} style={{margin:'5px 0'}}>
          {STAGES.find(s=>s.value===r.stage)?.label}: <b>{r.name}</b> · {r.email||'E-posta yok'}
          {r.active?'':' · HESAP AKTİF DEĞİL'}
        </p>)}
      </div>
    </section>

    <section className="card" style={{padding:22}}>
      <h3>3 · Soruyu incele ve düzelt</h3>
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
        <select value={status} onChange={e=>{setPage(0);setStatus(e.target.value)}}>
          <option value="PENDING">İnceleme bekleyenler</option>
          <option value="PUBLISHED">Yayımlananlar</option>
          <option value="ALL">Tüm kayıtlar</option>
        </select>
        <button disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>Önceki sayfa</button>
        <span>Sayfa {page+1}</span>
        <button disabled={items.length<20} onClick={()=>setPage(p=>p+1)}>Sonraki sayfa</button>
      </div>
      {items.length===0?<p>Bu filtrede kayıt yok.</p>:<div style={{display:'grid',gridTemplateColumns:'minmax(180px, 1fr) minmax(0, 2fr)',gap:12}}>
        <div style={{maxHeight:600,overflowY:'auto',display:'grid',gap:6,alignContent:'start'}}>
          {items.map(q=><button key={q.id} onClick={()=>setSelectedId(q.id)}
            style={{textAlign:'left',background:selected?.id===q.id?'#e2f3ea':'#f7f7f7',
              color:'#19382b',border:'1px solid #d4dfd9',padding:11,borderRadius:8}}>
            <b>{q.externalId}</b><small style={{display:'block'}}>{q.topic} · {q.status}</small>
          </button>)}
        </div>
        {selected&&edit&&<article style={{minWidth:0}}>
          <h4>{selected.externalId} · Sürüm {selected.revision}</h4>
          <p className="muted">Kaynak: {Array.isArray(selected.sourceRefs)?
            selected.sourceRefs.map((r:any)=>r.doi||r.pmcid||r.url||r.sourceId).filter(Boolean).join(' · '):'Bilinmiyor'}</p>
          <div style={{display:'grid',gap:9}}>
            <label>Konu<input value={edit.topic} onChange={e=>updateEdit('topic',e.target.value)}/></label>
            <label>Paragraf<textarea rows={8} value={edit.passage}
              onChange={e=>updateEdit('passage',e.target.value)} style={{width:'100%'}}/></label>
            <label>Soru kökü<textarea rows={2} value={edit.stem}
              onChange={e=>updateEdit('stem',e.target.value)} style={{width:'100%'}}/></label>
            {names.map((n,i)=><label key={n}>{n} seçeneği
              <textarea rows={2} value={edit.options[i]} style={{width:'100%'}}
                onChange={e=>updateEdit('options',edit.options.map((v:string,k:number)=>k===i?e.target.value:v))}/>
            </label>)}
            <label>Doğru seçenek <select value={edit.correctAnswer}
              onChange={e=>updateEdit('correctAnswer',e.target.value)}>
              {names.map(n=><option key={n} value={n}>{n}</option>)}
            </select></label>
            <label>Çözüm<textarea rows={4} value={edit.explanation}
              onChange={e=>updateEdit('explanation',e.target.value)} style={{width:'100%'}}/></label>
            <label>Kaynak kayıtları (JSON)<textarea rows={3}
              defaultValue={JSON.stringify(selected.sourceRefs,null,2)} key={selected.contentHash}
              onBlur={e=>{try{updateEdit('sourceRefs',JSON.parse(e.target.value))}
                catch{setMessage('Kaynak JSON alanı geçerli değil.')}}} style={{width:'100%'}}/></label>
            {selected.status!=='PUBLISHED'&&<>
              <label>Düzeltme gerekçesi<textarea rows={2} value={editReason}
                onChange={e=>setEditReason(e.target.value)} style={{width:'100%'}}/></label>
              <button disabled={busy||editReason.trim().length<20}
                onClick={()=>void saveRevision()}>Düzeltilmiş yeni sürümü kaydet</button>
            </>}
          </div>
          <div style={{marginTop:18,borderTop:'1px solid #e4e4e4',paddingTop:14}}>
            <h4>Editöryal onay / ret</h4>
            <p>Bu kullanıcıya tanımlanan aşamalar: {myStages.join(', ')||'Henüz atama yok'}</p>
            <select aria-label="İnceleme aşaması" value={stage} onChange={e=>setStage(e.target.value)}>
              {STAGES.map(s=><option value={s.value} key={s.value}>{s.label}</option>)}
            </select>
            <select aria-label="Editör kararı" value={decision} onChange={e=>setDecision(e.target.value)}>
              <option value="APPROVE">Onayla</option>
              <option value="NEEDS_REVISION">Düzeltmeye gönder</option>
              <option value="REJECT">Reddet</option>
            </select>
            <textarea rows={3} placeholder="En az 20 karakter bilimsel/pedagojik gerekçe"
              value={note} onChange={e=>setNote(e.target.value)} style={{width:'100%',marginTop:8}}/>
            <label style={{display:'block'}}><input type="checkbox" checked={reviewed}
              onChange={e=>setReviewed(e.target.checked)}/> Soruyu ve bütün seçenekleri bizzat inceledim.</label>
            {stage==='SOURCE_RIGHTS'&&<label style={{display:'block'}}>
              <input type="checkbox" checked={rights} onChange={e=>setRights(e.target.checked)}/>
              Makale kaynağı, DOI ve ticari kullanım/telif durumunu doğruladım.</label>}
            <button disabled={busy||selected.status==='PUBLISHED'||!myStages.includes(stage)||
              note.trim().length<20||!reviewed||(stage==='SOURCE_RIGHTS'&&decision==='APPROVE'&&!rights)}
              onClick={()=>void submitReview()}>Kararı imzala ve kaydet</button>
            <h4>Yayın kapısı</h4>
            {selected.gate?.missing?.length?<ul>{selected.gate.missing.map((x:string)=><li key={x}>{x}</li>)}</ul>:
              <p>Üç ayrı editör imzası ve kaynak/telif doğrulaması tamamlandı.</p>}
            <button disabled={busy||!selected.gate?.ready} onClick={()=>void publish()}>
              Tüm kapıları geçen soruyu öğrenci bankasında yayımla
            </button>
            <p className="muted">Eski sürümlerde verilen imzalar geçersizdir.
              Yayınlama yalnızca tek soru için ve sunucuda tekrar kontrol edilerek yapılır.</p>
          </div>
        </article>}
      </div>}
    </section>
    {message&&<p role="status" className="card" style={{padding:14}}>{message}</p>}
  </div>
}
