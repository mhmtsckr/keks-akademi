'use client';

import Image from 'next/image';
import { FormEvent,useEffect,useMemo,useState } from 'react';

type Question={id:string;orderNo:number;prompt:string;kind:'TENDENCY'|'HABIT';dimension:string};
type FormDataState={title:string;version:string;educationBand:string;disclaimer:string;instruction:string;scale:string[];questionCount:number;questions:Question[]};
type ProductState={key:string;monthName:string;name:string;listPriceKurus:number;listPriceLabel:string;priceKurus:number;priceLabel:string;discountPercent:number};
type ScreeningState={status:'READY'|'COMPLETED'|'NO_ACCESS'|'ERROR';form?:FormDataState;workflowStatus?:string;product?:ProductState};

const PAGE_SIZE=10;

function workflowCopy(status?:string){
  if(status==='ADMIN_REVIEW')return {eyebrow:'1/2 TAMAMLANDI · YÖNETİCİ İNCELEMESİNDE',title:'KEKS Eğilim Taraması tamamlandı',text:'Tarama kaydedildi. Eğitim düzeyine uygun ön görüşme ataması ve yönetici incelemesi devam ediyor.'};
  if(status==='SCREENING_RETAKE_REQUIRED')return {eyebrow:'YÖNETİCİ İNCELEMESİ',title:'Tek kullanım kuralı uygulanıyor',text:'Bu aylık ürünün Eğilim Taraması yeniden çözülemez. Kayıt yönetici incelemesine alınır ve mevcut sonuç üzerinden süreç devam eder.'};
  if(status==='PRE_INTERVIEW_ASSIGNED')return {eyebrow:'1/2 TAMAMLANDI',title:'KEKS Eğilim Taraması tamamlandı',text:'Ürünün ikinci aşaması olan Eğitim Düzeyine Göre Ön Görüşme aşağıda otomatik olarak açıldı.'};
  if(status==='PLAN_ADMIN_REVIEW')return {eyebrow:'2/2 TAMAMLANDI · İNCELEMEDE',title:'Aylık test ürününüz tamamlandı',text:'Eğilim taraması ve ön görüşme birlikte değerlendirildi. Çalışma planı taslağınız yönetici onayında.'};
  if(status==='PLAN_ADMIN_APPROVED')return {eyebrow:'2/2 TAMAMLANDI · KOÇA GÖNDERİLDİ',title:'Aylık test ürününüz tamamlandı',text:'Onaylı değerlendirme ve çalışma planı koçunuza gönderildi.'};
  if(status==='COMPLETED')return {eyebrow:'2/2 TAMAMLANDI',title:'Aylık test ürününüz tamamlandı',text:'Bu aylık ürün bir kez tamamlandı ve yeniden çözülemez.'};
  return {eyebrow:'1/2 TAMAMLANDI',title:'KEKS Eğilim Taraması kaydedildi',text:'Sonuçlarınız güvenli şekilde KEKS sistemine kaydedildi.'};
}

function ProductBrand(){
  return <div className="keksProductBrand" aria-label="KEKS Akademi">
    <span className="portalBrandMark"><span className="portalBrandOrbit"/><span className="portalBrandCore">K</span></span>
    <span className="portalBrandText"><strong>KEKS</strong><small>AKADEMİ</small></span>
  </div>;
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
      if(!r.ok)throw new Error(j.error||'Test ürünü yüklenemedi.');
      setState(j);
      if(j.status==='READY')setPage(0);
    }catch(error:any){
      setState({status:'ERROR'});
      setMsg('Hata: '+(error?.message||'Test ürünü yüklenemedi.'));
    }
  }
  useEffect(()=>{load()},[]);

  async function code(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('');setBusy(true);
    const form=e.currentTarget;
    try{
      const fd=new FormData(form);
      const r=await fetch('/api/student/test/access',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:fd.get('code')})});
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'Kod doğrulanamadı.'));
      form.reset();
      setMsg('Ürün erişimi açıldı. İlk aşama hazırlanıyor.');
      await load();
    }finally{setBusy(false)}
  }

  async function pay(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('');setBusy(true);
    const form=e.currentTarget;
    try{
      const fd=new FormData(form);
      const body=Object.fromEntries(fd.entries());
      const r=await fetch('/api/paytr/start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'Ödeme başlatılamadı.'));
      location.href=j.iframeUrl;
    }finally{setBusy(false)}
  }

  const form=state?.form;
  const product=state?.product;
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

  if(!state)return <div className="card"><p className="muted">KEKS Akademi aylık test ürünü yükleniyor…</p></div>;

  if(state.status==='COMPLETED'){
    const copy=workflowCopy(state.workflowStatus);
    return <div className="card keksProductCard">
      <div className="keksProductTop"><ProductBrand/><span className="pill">TEK KULLANIMLIK</span></div>
      <div className="moduleEyebrow">{copy.eyebrow}</div>
      <h2>{product?.name||'KEKS Eğilim Taraması ve Eğitim Düzeyine Göre Ön Görüşme Test Formu'}</h2>
      <div className="notice"><strong>{copy.title}</strong><div className="muted">{copy.text}</div></div>
      {msg&&<div className="notice" style={{marginTop:12}}>{msg}</div>}
    </div>;
  }

  if(state.status==='READY'&&form){
    return <div className="card keksProductCard keksProductActive">
      <div className="keksProductTop"><ProductBrand/><div className="row"><span className="pill">1/2 · EĞİLİM TARAMASI</span><span className="pill">TEK KULLANIMLIK</span></div></div>
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">{product?.name||'AYLIK KEKS TEST ÜRÜNÜ'}</div><h2>{form.title}</h2><p className="muted">{form.questionCount} madde · Eğitim düzeyinize özgü işaretlemeli form. Bu aşama tamamlandıktan sonra aynı ürünün ön görüşme formu otomatik açılır.</p></div>
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
        {page<totalPages-1?<button className="btn primary" disabled={pageQuestions.some(q=>answers[q.id]==null)||busy} onClick={()=>{setPage(p=>Math.min(totalPages-1,p+1));window.scrollTo({top:0,behavior:'smooth'})}}>Sonraki →</button>:<button className="btn primary" disabled={answered!==form.questionCount||busy} onClick={submit}>{busy?'Kaydediliyor…':'1. Aşamayı Tamamla ve Ön Görüşmeye Geç'}</button>}
      </div>
      {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')} style={{marginTop:12}}>{msg}</div>}
    </div>;
  }

  if(state.status==='ERROR'&&hasAccess)return <div className="card"><div className="notice error">{msg||'Test ürünü açılamadı.'}</div><button className="btn primary" onClick={load}>Tekrar Dene</button></div>;

  return <div className="card keksProductCard keksProductStorefront">
    <div className="keksProductTop"><ProductBrand/><span className="pill">AYLIK DİJİTAL ÜRÜN</span></div>
    <div className="keksProductVisual">
      <Image
        src="/api/assets/keks-product-image"
        alt="KEKS Eğilim Taraması ve Eğitim Düzeyine Göre Ön Görüşme Test Formu"
        fill
        sizes="(max-width: 820px) 100vw, 1100px"
        priority
        unoptimized
      />
      <div className="keksProductVisualBadge">%{product?.discountPercent||50} İNDİRİM</div>
    </div>
    <div className="keksProductHero">
      <div>
        <div className="moduleEyebrow">KEKS AKADEMİ · {product?.monthName||'BU AY'}</div>
        <h2>{product?.name||'KEKS Eğilim Taraması ve Eğitim Düzeyine Göre Ön Görüşme Test Formu'}</h2>
        <p className="muted">İki aşamalı tek üründür: önce KEKS Eğilim Taraması, ardından eğitim düzeyinize uygun Ön Görüşme Test Formu açılır. Her kullanıcı bu aylık ürünü yalnızca bir kez tamamlayabilir.</p>
        <div className="keksProductSteps">
          <span><b>1</b> KEKS Eğilim Taraması</span>
          <span><b>2</b> Eğitim Düzeyine Göre Ön Görüşme</span>
        </div>
      </div>
      <div className="keksProductPrice">
        <small>%{product?.discountPercent||50} İNDİRİMLİ SATIŞ</small>
        <span className="keksProductOldPrice">{product?.listPriceLabel||'800 TL'}</span>
        <strong>{product?.priceLabel||'400 TL'}</strong>
        <span>Normal fiyat {product?.listPriceLabel||'800 TL'} · Tek kullanıcı · tek çözüm</span>
      </div>
    </div>

    <div className="keksProductAccessGrid">
      <div className="keksProductAccess">
        <div className="moduleEyebrow">KOD İLE ERİŞİM</div>
        <h3>Yönetici / koç kodum var</h3>
        <p className="muted">Öğrenci kaydınızla birlikte size bağlı ürün kodu yönetici kayıtlarında otomatik oluşturulur. Yönetici veya koç kodu size ilettiyse buraya girin. Kod onaylanmadan test soruları açılmaz.</p>
        <form className="form" onSubmit={code}>
          <div className="field"><label>KEKS Akademi ürün kodu</label><input name="code" required placeholder="KEKS-…" autoComplete="off"/></div>
          <button className="btn primary" disabled={busy}>{busy?'Kontrol ediliyor…':'Kodu Kullan ve Ürünü Aç'}</button>
        </form>
      </div>

      <div className="keksProductAccess">
        <div className="moduleEyebrow">KOD GEREKMEZ</div>
        <h3><span className="keksProductOldPrice inline">{product?.listPriceLabel||'800 TL'}</span> {product?.priceLabel||'400 TL'} ile satın al</h3>
        <p className="muted">Kodunuz yoksa %{product?.discountPercent||50} indirimli fiyatla PayTR üzerinden güvenli ödeme yapabilirsiniz. Ödeme doğrulandığında ürün hesabınıza otomatik tanımlanır; kart bilgileriniz KEKS Akademi sunucularında saklanmaz.</p>
        <form className="form" onSubmit={pay}>
          <div className="field"><label>E-posta</label><input name="email" type="email" required/></div>
          <div className="field"><label>Ad soyad</label><input name="userName" required/></div>
          <div className="field"><label>Telefon</label><input name="userPhone" required/></div>
          <div className="field"><label>Adres</label><textarea name="userAddress" required/></div>
          <button className="btn primary" disabled={busy}>{busy?'Hazırlanıyor…':(product?.priceLabel||'400 TL')+' ile Güvenli Ödemeye Geç'}</button>
        </form>
      </div>
    </div>
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')} style={{marginTop:14}}>{msg}</div>}
  </div>;
}
