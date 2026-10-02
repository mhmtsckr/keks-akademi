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
 return <PortalShell active="abonelik" eyebrow="KEKS AKADEMİ" title="Abonelik Planları" description="Eğitim düzeyinize veya koçluk kapasitenize uygun KEKS planını seçin. Aktif abonelik olmadan panel araçları açılmaz; yalnız KEKS Akademi özelliklerini inceleyebilirsiniz." wide>
  <section className="section"><PortalSectionTitle eyebrow="ÖĞRENCİ" title="Eğitim düzeyine uygun öğrenci planları" description="Her planın araçları ilgili eğitim ve sınav düzeyine göre yapılandırılır."/><div className="subscriptionPlanRail" aria-label="Öğrenci abonelik planları">{STUDENT_PLANS.map(p=><PlanCard key={p.id} plan={p}/>)}</div></section>
  <section className="section"><PortalSectionTitle eyebrow="KOÇ" title="Koç abonelik planları" description="Koç planları aktif öğrenci kapasitesi ve profesyonel KEKS araçlarına göre ölçeklenir."/><div className="subscriptionPlanRail" aria-label="Koç abonelik planları">{COACH_PLANS.map(p=><PlanCard key={p.id} plan={p as any}/>)}</div></section>
  <section className="section"><div className="card"><h2>Abonelik olmadan erişim</h2><p className="muted">Abonelik seçmeyen veya aktif aboneliği bulunmayan öğrenci ve koçlar çalışma araçlarını, analizleri, testleri, MİZA'yı, raporları ve yönetim modüllerini göremez. Yalnız KEKS Akademi Özellikler sayfasındaki tanıtım içerikleri ve Abonelik Planları görüntülenir.</p><a className="btn" href="/ozellikler">KEKS Akademi Özellikleri</a></div></section>
 </PortalShell>
}