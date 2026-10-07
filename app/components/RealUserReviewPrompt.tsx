'use client';

import {useEffect,useState} from 'react';

type State={
  eligible:boolean;
  shouldPrompt:boolean;
  contextLabel:string;
  testimonial:null|{
    status:string;
    rating:number|null;
    publishConsent:boolean;
    submittedAt:string|null;
    publishedAt:string|null;
    nextPromptAt:string|null;
  };
};

export function RealUserReviewPrompt(){
  const [state,setState]=useState<State|null>(null);
  const [rating,setRating]=useState(5);
  const [comment,setComment]=useState('');
  const [publishConsent,setPublishConsent]=useState(false);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function load(){
    try{
      const r=await fetch('/api/testimonials/me',{cache:'no-store'});
      const j=await r.json();
      if(r.ok)setState(j);
    }catch{}
  }

  useEffect(()=>{void load()},[]);

  async function post(body:Record<string,unknown>){
    setBusy(true);setMsg('');
    try{
      const r=await fetch('/api/testimonials/me',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify(body)
      });
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'İşlem tamamlanamadı.'));return}
      setMsg(j.message||'İşlem tamamlandı.');
      await load();
    }finally{setBusy(false)}
  }

  if(!state?.eligible)return null;

  if(state.testimonial?.submittedAt){
    const published=state.testimonial.status==='PUBLISHED';
    const review=state.testimonial.status==='REVIEW';
    return <section className="card">
      <div className="moduleEyebrow">GERÇEK KULLANICI DENEYİMİ</div>
      <h2>Yorumunuz için teşekkürler.</h2>
      <p className="muted">{state.contextLabel}</p>
      <div className="notice">
        {published
          ?'Yorumunuz kimliğiniz gösterilmeden anasayfada yayınlanıyor.'
          :review
            ?'Yorumunuz yayın izniyle alındı; kişisel bilgi güvenliği için inceleme sırasında.'
            :'Yorumunuz yalnız KEKS gelişimi için kaydedildi; herkese açık değil.'}
      </div>
      {state.testimonial.publishConsent&&<button className="btn" type="button" disabled={busy} onClick={()=>post({action:'REVOKE'})}>Anasayfa yayın iznini kaldır</button>}
      {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    </section>;
  }

  if(!state.shouldPrompt)return null;

  return <section className="card">
    <div className="moduleEyebrow">30 GÜNLÜK KEKS DENEYİMİNİZ</div>
    <h2>KEKS size nasıl katkı sağladı?</h2>
    <p className="muted">30 günü tamamladınız. Deneyiminizi 1–5 yıldızla değerlendirin ve kısa bir yorum bırakın. İsterseniz yorumunuzu kimlik bilgileri gösterilmeden anasayfada yayınlayabiliriz.</p>

    <div className="field">
      <label>Değerlendirme</label>
      <div className="row" style={{gap:8,flexWrap:'wrap'}}>
        {[1,2,3,4,5].map(value=><button
          type="button"
          key={value}
          className={rating===value?'btn primary':'btn'}
          onClick={()=>setRating(value)}
          aria-label={value+' yıldız'}
        >{'★'.repeat(value)}</button>)}
      </div>
    </div>

    <div className="field">
      <label>Deneyiminiz</label>
      <textarea
        rows={4}
        minLength={20}
        maxLength={800}
        value={comment}
        onChange={e=>setComment(e.target.value)}
        placeholder="Örn. Çalışma planım daha düzenli hale geldi ve tekrarları kaçırmamaya başladım."
      />
      <small className="muted">Ad-soyad, telefon, e-posta, okul adı veya başka kişisel bilgi yazmayın. Sistem doğrudan kimlik verilerini ayrıca temizler.</small>
    </div>

    <label className="card row" style={{justifyContent:'flex-start',gap:10,alignItems:'flex-start'}}>
      <input type="checkbox" checked={publishConsent} onChange={e=>setPublishConsent(e.target.checked)}/>
      <span>
        <strong>Anonim olarak anasayfada yayınlanmasına izin veriyorum.</strong><br/>
        <small className="muted">Yayın etiketi yalnız “{state.contextLabel}” gibi anonim bir bağlam içerir. Adınız, e-postanız veya kullanıcı kodunuz yayınlanmaz.</small>
      </span>
    </label>

    <div className="row" style={{gap:10,flexWrap:'wrap'}}>
      <button
        className="btn primary"
        type="button"
        disabled={busy||comment.trim().length<20}
        onClick={()=>post({action:'SUBMIT',rating,comment:comment.trim(),publishConsent})}
      >{busy?'Gönderiliyor…':'Yorumumu Gönder'}</button>
      <button className="btn" type="button" disabled={busy} onClick={()=>post({action:'SNOOZE'})}>30 gün sonra hatırlat</button>
    </div>
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
  </section>;
}
