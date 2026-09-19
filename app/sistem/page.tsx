import { PortalSectionTitle, PortalShell } from '@/app/components/PortalShell';

export default function SystemPage(){
  return <PortalShell
    active="sistem"
    eyebrow="KEKS SİSTEMİ"
    title="Öğrenci gelişimini tek akışta yöneten koçluk altyapısı."
    description="KEKS Akademi; hedef, program, gerçek çalışma süresi, deneme, konu ilerleme, içerik kullanımı ve koç müdahalesini aynı sistemde birleştirir."
    meta={<><span>Akıllı Koç</span><span>Gerçek Süre</span><span>Veli Takibi</span></>}
  >
    <section className="section">
      <PortalSectionTitle eyebrow="NASIL ÇALIŞIR?" title="Dört adımda kişisel gelişim döngüsü" description="Sistem yalnız veri toplamaz; öğrencinin ilerlemesini yorumlar ve bir sonraki adımı üretir."/>
      <div className="portalFlow">
        <div className="portalFlowStep"><b>01</b><h3>Profil ve hedef</h3><p>Öğrenci kayıt olur, hedef okul/üniversite ve hazırlık düzeyi tanımlanır.</p></div>
        <div className="portalFlowStep"><b>02</b><h3>Plan ve uygulama</h3><p>Koç plan oluşturur; öğrenci teknikleri, testleri ve içerikleri doğrudan uygular.</p></div>
        <div className="portalFlowStep"><b>03</b><h3>Ölçüm ve analiz</h3><p>Netler, gerçek çalışma süresi, konu ilerlemesi ve içerik sonuçları analiz edilir.</p></div>
        <div className="portalFlowStep"><b>04</b><h3>Yönlendirme</h3><p>Akıllı koç yeni program, tekrar, test ve koç müdahalesi önerileri oluşturur.</p></div>
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
