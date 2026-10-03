import {COACH_PLANS,type KeksPlan} from '@/lib/subscriptionPlans';
import {PortalShell,PortalSectionTitle} from '@/app/components/PortalShell';
import {BUSINESS_INFO} from '@/lib/businessInfo';
import {StudentPlanSelector} from './StudentPlanSelector';

function coachWhatsappHref(plan:KeksPlan){
  const phone='90'+BUSINESS_INFO.phone.replace(/\D/g,'').replace(/^0/,'');
  const message=`Merhaba KEKS Akademi! 👋\n\n${plan.name} (${plan.level}) KEKS Partner Koç lisansınız hakkında bilgi almak istiyorum. Paket kapsamı, kayıt süreci ve ücret hakkında bilgi verebilir misiniz?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function CoachPlanCard({plan}:{plan:KeksPlan}){
  return <article className="card" style={{display:'flex',flexDirection:'column',gap:12}}>
    <div>
      <span className="portalEyebrow">{plan.level}</span>
      <h2>{plan.name}</h2>
    </div>
    <div className="kpi">{plan.price?plan.price.toLocaleString('tr-TR')+' TL / ay':'Özel Teklif'}</div>
    <div>
      <strong>Neler dahil?</strong>
      <ul>{plan.features.map(feature=><li key={feature}>{feature}</li>)}</ul>
    </div>
    <a className="btn primary" href={coachWhatsappHref(plan)} target="_blank" rel="noopener noreferrer">Paket Hakkında Bilgi Al</a>
  </article>;
}

export default function SubscriptionPlansPage(){
  return <PortalShell
    active="abonelik"
    eyebrow="KEKS AKADEMİ"
    title="Abonelik Planları"
    description="Önce eğitim düzeyinizi veya hazırlandığınız sınavı seçin; ardından size özel Aylık, 3 Aylık, 6 Aylık ve Yıllık KEKS seçeneklerini karşılaştırın."
    wide
  >
    <section className="section">
      <PortalSectionTitle
        eyebrow="ÖĞRENCİ"
        title="Eğitim düzeyini veya sınav türünü seç"
        description="Seçiminize göre dört farklı süre seçeneği ve o gruba özel fiyatlar otomatik gösterilir."
      />
      <StudentPlanSelector/>
    </section>

    <section className="section">
      <PortalSectionTitle
        eyebrow="KOÇ"
        title="KEKS Partner Koç lisansları"
        description="KEKS ana marka olarak kalır; koçlar KEKS Partner Koç lisansıyla aktif öğrenci kapasitesine göre profesyonel araçlara erişir."
      />
      <div className="notice" style={{marginBottom:16}}>
        <strong>KEKS ana marka · Partner Koç insan desteği</strong>
        <div className="muted">Öğrenci deneyimi, MİZA, ölçüm, planlama, tekrar ve raporlar KEKS Akademi markasıyla sunulur. Partner Koç; öğrenciyi takip eder, görüşme yapar ve KEKS aksiyonlarına müdahale eder.</div>
      </div>
      <div className="subscriptionPlanRail" aria-label="KEKS Partner Koç lisansları">
        {COACH_PLANS.map(plan=><CoachPlanCard key={plan.id} plan={plan}/>)}
      </div>
    </section>
  </PortalShell>;
}
