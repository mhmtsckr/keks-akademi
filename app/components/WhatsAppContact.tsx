'use client';
import {useState} from 'react';
import {BUSINESS_INFO} from '@/lib/businessInfo';
import {STUDENT_PLANS} from '@/lib/subscriptionPlans';

type Audience='STUDENT'|'PARENT'|'COACH';
const options=[
 {id:'STUDENT' as const,label:'Öğrenciyim',detail:'Kendim için bilgi almak istiyorum'},
 {id:'PARENT' as const,label:'Veliyim',detail:'Çocuğum için bilgi almak istiyorum'},
 {id:'COACH' as const,label:'Öğrenci koçuyum',detail:'Sistemi kullanmak istiyorum'}
];

const studentLevels=STUDENT_PLANS.map(plan=>({
 id:plan.id,
 level:plan.level,
 name:plan.name
}));

export function WhatsAppContact(){
 const [open,setOpen]=useState(false);
 const [audience,setAudience]=useState<Audience>('STUDENT');
 const [detail,setDetail]=useState('');
 const phone='90'+BUSINESS_INFO.phone.replace(/\D/g,'').replace(/^0/,'');
 const selected=options.find(x=>x.id===audience)!;
 const label=audience==='COACH'?'Takip ettiğiniz öğrenci sayısı':'Sınıf / hazırlanılan sınav';
 const message=`Merhaba KEKS Akademi! 👋\n\n${selected.label}. ${selected.detail}.\n${label}: ${detail.trim()||'-'}\n\nBana uygun abonelik planları ve ücretleri hakkında bilgi almak istiyorum.`;
 const href=`https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
 const canContinue=detail.trim().length>0;

 return <div className="waContact">
  {open&&<div className="waPanel" role="dialog" aria-label="KEKS Akademi WhatsApp bilgi">
   <div className="waPanelHead"><div><strong>KEKS Akademi</strong><span>WhatsApp bilgi hattı</span></div><button type="button" onClick={()=>setOpen(false)} aria-label="Kapat">×</button></div>
   <div className="waWelcome"><b>Merhaba, KEKS Akademi’ye hoş geldiniz! 👋</b><p>Size uygun paketler ve ücretler hakkında bilgi verebilmemiz için aşağıdan seçim yapın.</p></div>
   <div className="waChoices">{options.map(x=><button type="button" className={audience===x.id?'active':''} key={x.id} onClick={()=>{setAudience(x.id);setDetail('')}}><b>{x.label}</b><span>{x.detail}</span></button>)}</div>
   <label className="waField">
    <span>{label}</span>
    {audience==='COACH'
      ?<input value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Örn. 25 öğrenci"/>
      :<select value={detail} onChange={e=>setDetail(e.target.value)}>
        <option value="">Eğitim düzeyi / sınav seçin</option>
        {studentLevels.map(item=><option value={item.level} key={item.id}>{item.level} · {item.name}</option>)}
       </select>}
   </label>
   <a className={`waContinue${canContinue?'':' disabled'}`} href={canContinue?href:undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!canContinue} onClick={event=>{if(!canContinue)event.preventDefault()}}>WhatsApp’tan Bilgi Al <span>→</span></a>
   <small>{audience==='COACH'?'Öğrenci kapasitenizi yazın; lisans seçeneklerini paylaşalım.':'Eğitim düzeyini seçin; mesajınız doğru paket eşleştirmesi için standart biçimde hazırlanır.'}</small>
  </div>}
  <button type="button" className="waFloat" onClick={()=>setOpen(v=>!v)} aria-expanded={open}><span className="waIcon">◔</span><span>WhatsApp’tan Bilgi Al</span></button>
 </div>;
}
