'use client';

import {FormEvent,useState} from 'react';

type Status={type:'idle'|'loading'|'success'|'error';message?:string};

export function CallbackRequestForm(){
  const [status,setStatus]=useState<Status>({type:'idle'});

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(status.type==='loading')return;
    const form=e.currentTarget;
    const data=new FormData(form);
    setStatus({type:'loading'});
    try{
      const response=await fetch('/api/public/callback-request',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          name:String(data.get('name')||''),
          phone:String(data.get('phone')||''),
          audience:String(data.get('audience')||'ÖĞRENCİ'),
          education:String(data.get('education')||''),
          preferredTime:String(data.get('preferredTime')||'12:00–15:00'),
          note:String(data.get('note')||''),
          consent:data.get('consent')==='on',
          website:String(data.get('website')||'')
        })
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(body.error||'Talep gönderilemedi.');
      form.reset();
      setStatus({type:'success',message:'Talebiniz alındı. KEKS Akademi ekibi seçtiğiniz zaman aralığında sizinle iletişime geçecek.'});
    }catch(error){
      setStatus({type:'error',message:error instanceof Error?error.message:'Talep gönderilemedi.'});
    }
  }

  return <form className="callbackForm" onSubmit={submit}>
    <div className="callbackGrid">
      <label><span>Ad Soyad</span><input name="name" autoComplete="name" minLength={2} maxLength={80} required placeholder="Adınız Soyadınız"/></label>
      <label><span>Telefon</span><input name="phone" autoComplete="tel" inputMode="tel" minLength={10} maxLength={24} required placeholder="05xx xxx xx xx"/></label>
      <label><span>Kim için bilgi alıyorsunuz?</span><select name="audience" defaultValue="ÖĞRENCİ"><option value="ÖĞRENCİ">Öğrenciyim</option><option value="VELİ">Veliyim</option><option value="PARTNER_KOÇ">KEKS Partner Koç olmak istiyorum</option></select></label>
      <label><span>Eğitim düzeyi / sınav</span><input name="education" maxLength={80} placeholder="Örn. 8. sınıf / LGS / YKS"/></label>
      <label><span>Aranmak istediğiniz saat</span><select name="preferredTime" defaultValue="12:00–15:00"><option>09:00–12:00</option><option>12:00–15:00</option><option>15:00–18:00</option><option>18:00–21:00</option></select></label>
      <label className="callbackNote"><span>Notunuz</span><textarea name="note" maxLength={500} rows={3} placeholder="Özellikle konuşmak istediğiniz konu varsa yazabilirsiniz."/></label>
    </div>
    <label className="callbackConsent"><input type="checkbox" name="consent" required/><span>İletişim talebimin yanıtlanması amacıyla verdiğim iletişim bilgilerinin kullanılmasını kabul ediyorum. <a href="/gizlilik-guvenlik">Gizlilik & Güvenlik</a></span></label>
    <input className="callbackHoney" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
    <button className="btn primary callbackSubmit" type="submit" disabled={status.type==='loading'}>{status.type==='loading'?'Gönderiliyor…':'Beni Arayın'}</button>
    {status.type!=='idle'&&status.type!=='loading'&&<div className={status.type==='success'?'callbackStatus success':'callbackStatus error'} role="status">{status.message}</div>}
  </form>;
}
