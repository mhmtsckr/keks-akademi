import { COACH_PLANS,STUDENT_PLANS } from '@/lib/subscriptionPlans';
import { PortalShell,PortalSectionTitle } from '@/app/components/PortalShell';

function PlanCard({plan}:{plan:(typeof STUDENT_PLANS)[number]}){
 return <article className="card" style={{display:'flex',flexDirection:'column',gap:12}}>
  <div><span className="portalEyebrow">{plan.level}</span><h2>{plan.name}</h2></div>
  <div className="kpi">{plan.price?plan.price.toLocaleString('tr-TR')+' TL / ay':'Özel Teklif'}</div>
  <div><strong>Neler dahil?</strong><ul>{plan.features.map(x=><li key={x}>{x}</li>)}</ul></div>
  <a className="btn primary" href={plan.audience==='STUDENT'?'/ogrenci':'/koc'}>{plan.price?'Planı Seç':'Teklif Al'}</a>
 </article>
}
export default function SubscriptionPlansPage(){
 return <PortalShell active="abonelik" eyebrow="KEKS AKADEMİ" title="Abonelik Planları" description="Eğitim düzeyinize veya koçluk kapasitenize uygun KEKS planını seçin. Aktif abonelik, ilgili panel araçlarına erişim sağlar." wide>
  <section className="section"><PortalSectionTitle eyebrow="ÖĞRENCİ" title="Eğitim düzeyine uygun öğrenci planları" description="Her planın araçları ilgili eğitim ve sınav düzeyine göre yapılandırılır."/><div className="subscriptionPlanRail" aria-label="Öğrenci abonelik planları">{STUDENT_PLANS.map(p=><PlanCard key={p.id} plan={p}/>)}</div></section>
  <section className="section"><PortalSectionTitle eyebrow="KOÇ" title="Koç abonelik planları" description="Koç planları aktif öğrenci kapasitesi ve profesyonel KEKS araçlarına göre ölçeklenir."/><div className="subscriptionPlanRail" aria-label="Koç abonelik planları">{COACH_PLANS.map(p=><PlanCard key={p.id} plan={p as any}/>)}</div></section>
 </PortalShell>
}
