import { PortalSectionTitle, PortalShell } from '@/app/components/PortalShell';
import { KeksCoreLoop } from '@/app/components/KeksCoreLoop';
import { KEKS_CORE_SENTENCE, KEKS_CORE_STEPS } from '@/lib/keksCore';

export default function SystemPage(){
  return <PortalShell
    active="sistem"
    eyebrow="KEKS SİSTEMİ"
    title="KEKS’in çekirdeği: ölç, planla, uygulat, kaydet, tekrar ettir, yeniden ölç ve koça aksiyon öner."
    description={KEKS_CORE_SENTENCE}
    meta={<><span>Akıllı Koç</span><span>Gerçek Süre</span><span>Veli Takibi</span></>}
  >
    <section className="section">
      <KeksCoreLoop/>
      <div className="portalFlow keksCoreDetailFlow">
        {KEKS_CORE_STEPS.map((step,index)=><div className="portalFlowStep" key={step.key}><b>{String(index+1).padStart(2,'0')}</b><h3>{step.label}</h3><p>{step.detail}</p></div>)}
      </div>
    </section>

    <section className="section">
      <PortalSectionTitle eyebrow="VERİ AKIŞI" title="Koç, öğrenci ve veli aynı gelişim tablosunu farklı yetkilerle görür."/>
      <div className="portalFeatureGrid">
        <div className="portalFeatureCard"><span className="icon">◎</span><small>ÖĞRENCİ</small><h3>Uygular ve kaydeder</h3><p>Program, teknik, test, tekrar, dosya ve içerik çalışmalarını tek panelden yürütür.</p></div>
        <div className="portalFeatureCard"><span className="icon">↗</span><small>KOÇ</small><h3>Analiz eder ve yönlendirir</h3><p>Öğrencinin hedef açığını, net trendlerini, çalışma süresini ve uyarıları takip eder.</p></div>
        <div className="portalFeatureCard"><span className="icon">◇</span><small>VELİ</small><h3>Özet ve rapor görür</h3><p>Teknik ayrıntıya boğulmadan haftalık gelişim ve koç değerlendirmelerine erişir.</p></div>
      </div>
    </section>
  </PortalShell>
}
