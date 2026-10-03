'use client';

import {useState} from 'react';
import {BUSINESS_INFO} from '@/lib/businessInfo';
import {STUDENT_PLANS,STUDENT_TERM_PRICING,type KeksPlan,type StudentTermPricing} from '@/lib/subscriptionPlans';

type TermKey='monthly'|'threeMonths'|'sixMonths'|'annual';

const EDUCATION_PLAN_IDS=[
  'student-primary-12',
  'student-primary-34',
  'student-middle-56',
  'student-lgs-prep',
  'student-lgs-360',
  'student-high-910',
  'student-yks-prep',
  'student-yks-360',
  'student-mezun-360'
];

const EXAM_PLAN_IDS=[
  'student-kamu',
  'student-dgs',
  'student-ales',
  'student-language',
  'student-ags-language',
  'student-teacher-360'
];

const TERM_OPTIONS:{key:TermKey;title:string;subtitle:string;badge?:string}[]=[
  {key:'monthly',title:'Aylık – Esnek Başlangıç',subtitle:'Her ay yenilenir. İstediğin zaman iptal edebilirsin.'},
  {key:'threeMonths',title:'3 Aylık – KEKS Kamp',subtitle:'90 günde çalışma düzenini kur ve güçlendir.',badge:'EN ÇOK TERCİH EDİLEN'},
  {key:'sixMonths',title:'6 Aylık – KEKS Güçlenme',subtitle:'Yeni döneme ve sınav sürecine daha sağlam hazırlan.'},
  {key:'annual',title:'Yıllık – KEKS 360',subtitle:'12 aylık kullanım. Tek seferlik ödeme.',badge:'EN AVANTAJLI'}
];

function tl(value:number){
  return value.toLocaleString('tr-TR')+' TL';
}

function getPlans(ids:string[]){
  return ids.map(id=>STUDENT_PLANS.find(plan=>plan.id===id)).filter((plan):plan is KeksPlan=>Boolean(plan));
}

function termPrice(pricing:StudentTermPricing,key:TermKey){
  if(key==='monthly') return pricing.firstMonth;
  return pricing[key];
}

function termDetail(pricing:StudentTermPricing,key:TermKey){
  if(key==='monthly') return `İlk ay ${tl(pricing.firstMonth)} · Sonraki aylar ${tl(pricing.monthly)} / ay`;
  if(key==='threeMonths') return `${tl(pricing.threeMonths)} / 3 ay`;
  if(key==='sixMonths') return `${tl(pricing.sixMonths)} / 6 ay`;
  return `${tl(pricing.annual)} / 12 ay · tek ödeme`;
}

function whatsappHref(plan:KeksPlan,pricing:StudentTermPricing,key:TermKey,title:string){
  const phone='90'+BUSINESS_INFO.phone.replace(/\D/g,'').replace(/^0/,'');
  const detail=termDetail(pricing,key);
  const message=`Merhaba KEKS Akademi! 👋\n\n${plan.level} için ${title} paketi hakkında bilgi almak istiyorum.\nFiyat: ${detail}\n\nPaket kapsamı, kayıt süreci ve başlangıç hakkında bilgi verebilir misiniz?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function StudentPlanSelector(){
  const educationPlans=getPlans(EDUCATION_PLAN_IDS);
  const examPlans=getPlans(EXAM_PLAN_IDS);
  const [selectedId,setSelectedId]=useState(educationPlans[0]?.id??STUDENT_PLANS[0].id);
  const selectedPlan=STUDENT_PLANS.find(plan=>plan.id===selectedId)??STUDENT_PLANS[0];
  const pricing=STUDENT_TERM_PRICING[selectedPlan.id];

  return <div className="studentPricingSelector">
    <div className="studentPlanPicker">
      <div className="studentPlanPickerGroup">
        <div className="studentPlanPickerHeading">
          <span className="portalEyebrow">EĞİTİM DÜZEYİ</span>
          <h3>Sınıfını seç</h3>
        </div>
        <div className="studentPlanChoiceGrid" role="group" aria-label="Eğitim düzeyi seçimi">
          {educationPlans.map(plan=><button key={plan.id} type="button" className={selectedId===plan.id?'active':''} aria-pressed={selectedId===plan.id} onClick={()=>setSelectedId(plan.id)}>
            <strong>{plan.level}</strong>
            <span>{plan.name}</span>
          </button>)}
        </div>
      </div>

      <div className="studentPlanPickerGroup">
        <div className="studentPlanPickerHeading">
          <span className="portalEyebrow">SINAV TÜRÜ</span>
          <h3>Hazırlandığın sınavı seç</h3>
        </div>
        <div className="studentPlanChoiceGrid compact" role="group" aria-label="Sınav türü seçimi">
          {examPlans.map(plan=><button key={plan.id} type="button" className={selectedId===plan.id?'active':''} aria-pressed={selectedId===plan.id} onClick={()=>setSelectedId(plan.id)}>
            <strong>{plan.level}</strong>
            <span>{plan.name}</span>
          </button>)}
        </div>
      </div>
    </div>

    <div className="selectedStudentPlan">
      <div>
        <span className="portalEyebrow">SEÇİLİ PAKET</span>
        <h2>{selectedPlan.level} · {selectedPlan.name}</h2>
        <p>Eğitim düzeyine veya sınav türüne göre fiyatlandırılmış dört üyelik seçeneğinden birini seçebilirsin.</p>
      </div>
      <div className="selectedStudentPlanFeatures">
        {selectedPlan.features.slice(0,4).map(feature=><span key={feature}>✓ {feature}</span>)}
      </div>
    </div>

    <div className="studentTermGrid" aria-live="polite">
      {TERM_OPTIONS.map(option=>{
        const price=termPrice(pricing,option.key);
        return <article className={`studentTermCard ${option.badge?'featured':''}`} key={option.key}>
          {option.badge&&<span className="studentTermBadge">{option.badge}</span>}
          <div className="studentTermCardHead">
            <span>{selectedPlan.level}</span>
            <h3>{option.title}</h3>
            <p>{option.subtitle}</p>
          </div>
          <div className="studentTermPrice">{tl(price)}</div>
          <div className="studentTermPriceDetail">{termDetail(pricing,option.key)}</div>
          {option.key==='monthly'&&<div className="studentTermNote">İlk ay özel başlangıç fiyatı. Sonraki aylarda standart aylık ücret uygulanır.</div>}
          {option.key==='threeMonths'&&<div className="studentTermNote">Kısa sürede düzen oluşturmak ve çalışma ritmini güçlendirmek için.</div>}
          {option.key==='sixMonths'&&<div className="studentTermNote">Orta vadeli gelişim, takip ve sınav hazırlığını birlikte yürütmek için.</div>}
          {option.key==='annual'&&<div className="studentTermNote">En uzun kullanım süresi ve en avantajlı toplam paket.</div>}
          <a className="btn primary studentTermCta" href={whatsappHref(selectedPlan,pricing,option.key,option.title)} target="_blank" rel="noopener noreferrer">WhatsApp’tan Bilgi Al</a>
        </article>;
      })}
    </div>
  </div>;
}
