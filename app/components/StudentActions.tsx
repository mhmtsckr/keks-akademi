'use client';

import { FormEvent,useEffect,useMemo,useState } from 'react';

type Question={id:string;orderNo:number;prompt:string;kind:'TENDENCY'|'HABIT';dimension:string};
type FormDataState={title:string;version:string;educationBand:string;disclaimer:string;instruction:string;scale:string[];questionCount:number;questions:Question[]};
type ScreeningState={status:'READY'|'COMPLETED'|'NO_ACCESS'|'ERROR';form?:FormDataState;workflowStatus?:string};

const PAGE_SIZE=10;

function workflowCopy(status?:string){
  if(status==='ADMIN_REVIEW')return {eyebrow:'YÖNETİCİ İNCELEMESİNDE',title:'Eğilim taramanız tamamlandı',text:'Ayrıntılı değerlendirme ve gelişim raporunuz yöneticiye iletildi. Ön görüşme ataması için eğitim düzeyi ve koç bağlantınız kontrol ediliyor.'};
  if(status==='SCREENING_RETAKE_REQUIRED')return {eyebrow:'YENİDEN TARAMA',title:'Yönetici yeniden tarama istedi',text:'Yeni tarama erişiminiz açıldıysa form burada görünecektir. Görünmüyorsa sayfayı yenileyin.'};
  if(status==='PRE_INTERVIEW_ASSIGNED')return {eyebrow:'ÖN GÖRÜŞME OTOMATİK AÇILDI',title:'Açık uçlu ön görüşme aşamasına geçebilirsiniz',text:'Eğilim taramanız tamamlandı. Eğitim ve gelişim düzeyinize uygun açık uçlu ön görüşme otomatik açıldı; tarama sonucunuz yönetici tarafından ayrıca inceleniyor.'};
  if(status==='PLAN_ADMIN_REVIEW')return {eyebrow:'PLAN İNCELEMESİNDE',title:'Ön görüşmeniz tamamlandı',text:'Eğilim taraması ve ön görüşme birlikte değerlendirildi. Yıllık, aylık, haftalık ve günlük plan taslağınız yönetici onayında.'};
  if(status==='PLAN_ADMIN_APPROVED')return {eyebrow:'KOÇA GÖNDERİLDİ',title:'Planınız yönetici tarafından onaylandı',text:'Onaylı çalışma planı koçunuza gönderildi. Koçunuz son uygulama kontrolünden sonra öğrenci panelinizde aktifleştirecek.'};
  if(status==='COMPLETED')return {eyebrow:'AKTİF PLAN',title:'Değerlendirme süreci tamamlandı',text:'Yönetici onayı ve koç uygulama kontrolü tamamlandı. Onaylı planlarınız ve günlük görevleriniz panelinizde aktiftir.'};
  return {eyebrow:'TARAMA TAMAMLANDI',title:'KEKS Eğilim Taraması kaydedildi',text:'Sonuçlarınız güvenli şekilde KEKS sistemine kaydedildi.'};
}

export function StudentActions({hasAccess}:{hasAccess:boolean}){
  const [state,setState]=useState<ScreeningState|null>(null);
  const [answers,setAnswers]=useState<Record<string,number>>({});
  const [page,setPage]=useState(0);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  async function load(){
    try{
      const r=await fetch('/api/student/test/form',{cache:'no-store'});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Tarama formu yüklenemedi.');
      setState(j);
      if(j.status==='READY')setPage(0);
    }catch(error:any){
      setState({status:'ERROR'});
      setMsg('Hata: '+(error?.message||'Tarama formu yüklenemedi.'));
    }
  }
  useEffect(()=>{load()},[]);

  async function code(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('');
    const form=e.currentTarget;
    const fd=new FormData(form);
    const r=await fetch('/api/student/test/access',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:fd.get('code')})});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Kod doğrulanamadı.'));
    form.reset();
    setMsg('KEKS tarama erişimi açıldı.');
    await load();
  }

  async function pay(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('');
    const form=e.currentTarget;
    const fd=new FormData(form);
    const body=Object.fromEntries(fd.entries());
    const r=await fetch('/api/paytr/start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Ödeme başlatılamadı.'));
    location.href=j.iframeUrl;
  }

  const form=state?.form;
  const totalPages=form?Math.ceil(form.questions.length/PAGE_SIZE):0;
  const pageQuestions=useMemo(()=>form?.questions.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)||[],[form,page]);
  const answered=form?form.questions.filter(q=>answers[q.id]!=null).length:0;

  async function submit(){
    if(!form)return;
    if(answered!==form.questions.length)return setMsg('Hata: Tüm maddeleri cevaplayın.');
    setBusy(true);setMsg('');
    const payload={
      formVersion:form.version,
      educationBand:form.educationBand,
      answers:form.questions.map(q=>({questionId:q.id,value:answers[q.id]}))
    };
    const r=await fetch('/api/student/test/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const j=await r.json();setBusy(false);
    if(!r.ok)return setMsg('Hata: '+(j.error||'Tarama kaydedilemedi.'));
    setMsg(j.message||'Tarama tamamlandı.');
    await load();
    setTimeout(()=>location.reload(),700);
  }

  if(!state)return <div className="card"><p className="muted">KEKS Eğilim Taraması yükleniyor…</p></div>;

  if(state.status==='COMPLETED'){
    const copy=workflowCopy(state.workflowStatus);
    return <div className="card">
      <div className="moduleEyebrow">{copy.eyebrow}</div>
      <h2>{copy.title}</h2>
      <div className="notice"><strong>Süreç durumu</strong><div className="muted">{copy.text}</div></div>
      {msg&&<div className="notice" style={{marginTop:12}}>{msg}</div>}
    </div>;
  }

  if(state.status==='READY'&&form){
    return <div className="card">
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">KEKS'İN KENDİ TARAMA MODÜLÜ</div><h2>{form.title}</h2><p className="muted">{form.questionCount} madde · Eğitim düzeyinize özgü işaretlemeli form.</p></div>
        <span className="pill">{answered}/{form.questionCount}</span>
      </div>
      <div className="notice">
        <strong>Yönerge:</strong> {form.instruction}
        <div className="muted" style={{marginTop:8}}>
          (1) {form.scale?.[0]||'Hiç katılmıyorum'} · (2) {form.scale?.[1]||'Katılmıyorum'} · (3) {form.scale?.[2]||'Bazen / Kararsızım'} · (4) {form.scale?.[3]||'Katılıyorum'} · (5) {form.scale?.[4]||'Tamamen katılıyorum'}
        </div>
      </div>
      <div className="notice" style={{marginTop:10}}><strong>Bilimsel kullanım sınırı:</strong> {form.disclaimer}</div>
      <div style={{margin:'14px 0'}}>
        <div className="muted">İlerleme · %{Math.round(answered/Math.max(1,form.questionCount)*100)}</div>
        <div style={{height:8,background:'var(--line)',borderRadius:99,overflow:'hidden'}}><div style={{height:'100%',width:(answered/Math.max(1,form.questionCount)*100)+'%',background:'currentColor'}}/></div>
      </div>
      <div className="stack">
        {pageQuestions.map(q=><div className="preInterviewQuestion" key={q.id}>
          <div className="questionMeta"><span>{q.orderNo}</span><small>{q.dimension}</small></div>
          <div style={{flex:1}}><strong>{q.prompt}</strong>
            <div className="likertRow">
              {[1,2,3,4,5].map(n=><label key={n} title={form.scale?.[n-1]||['Hiç katılmıyorum','Katılmıyorum','Bazen / Kararsızım','Katılıyorum','Tamamen katılıyorum'][n-1]}>
                <input type="radio" name={q.id} value={n} checked={answers[q.id]===n} onChange={()=>setAnswers(a=>({...a,[q.id]:n}))}/><span>{n}</span>
              </label>)}
            </div>
            <div className="muted" style={{fontSize:12,marginTop:4}}>1 Hiç katılmıyorum · 2 Katılmıyorum · 3 Bazen / Kararsızım · 4 Katılıyorum · 5 Tamamen katılıyorum</div>
          </div>
        </div>)}
      </div>
      <div className="row" style={{justifyContent:'space-between',marginTop:16}}>
        <button className="btn" disabled={page===0||busy} onClick={()=>{setPage(p=>Math.max(0,p-1));window.scrollTo({top:0,behavior:'smooth'})}}>← Önceki</button>
        <span className="pill">Sayfa {page+1} / {totalPages}</span>
        {page<totalPages-1?<button className="btn primary" disabled={pageQuestions.some(q=>answers[q.id]==null)||busy} onClick={()=>{setPage(p=>Math.min(totalPages-1,p+1));window.scrollTo({top:0,behavior:'smooth'})}}>Sonraki →</button>:<button className="btn primary" disabled={answered!==form.questionCount||busy} onClick={submit}>{busy?'Kaydediliyor…':'Taramayı Tamamla ve Ön Görüşmeye Geç'}</button>}
      </div>
      {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')} style={{marginTop:12}}>{msg}</div>}
    </div>;
  }

  if(state.status==='ERROR'&&hasAccess)return <div className="card"><div className="notice error">{msg||'Tarama formu açılamadı.'}</div><button className="btn primary" onClick={load}>Tekrar Dene</button></div>;

  return <div className="stack">
    <div className="card"><h3>Aylık KEKS Akademi Kodum Var</h3><p className="muted">Kod doğrulandıktan sonra KEKS Eğilim Taraması doğrudan bu sistem içinde açılır.</p><form className="form" onSubmit={code}><div className="field"><label>KEKS Akademi kodu</label><input name="code" required placeholder="KEKS-…"/></div><button className="btn primary">Kodu Kullan ve Taramayı Aç</button></form></div>
    <div className="card"><h3>350 TL ile Tarama Erişimi</h3><p className="muted">Ödeme PayTR üzerinden doğrulandıktan sonra yerleşik tarama erişimi otomatik açılır.</p><form className="form" onSubmit={pay}>
      <div className="field"><label>E-posta</label><input name="email" type="email" required/></div>
      <div className="field"><label>Ad soyad</label><input name="userName" required/></div>
      <div className="field"><label>Telefon</label><input name="userPhone" required/></div>
      <div className="field"><label>Adres</label><textarea name="userAddress" required/></div>
      <button className="btn primary">350 TL Öde ve Taramayı Aç</button>
    </form></div>
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
  </div>;
}
