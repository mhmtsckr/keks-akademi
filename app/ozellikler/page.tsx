import { PortalSectionTitle, PortalShell } from '@/app/components/PortalShell';

const features=[
  ['↗','HEDEF ODAKLI','Akıllı Eğitim Koçu','Zayıf dersleri, tamamlanmamış konuları ve hedef açığını değerlendirerek haftalık program üretir.'],
  ['◎','ANALİTİK','Net Trendleri','Deneme sonuçlarındaki ders bazlı net değişimini ve hedefe yaklaşma durumunu gösterir.'],
  ['◉','ODAK','Çalışma Teknikleri Laboratuvarı','Pomodoro, Aktif Hatırlama, Feynman, Cornell ve SQ3R doğrudan uygulanır ve gerçek aktif süre kaydedilir.'],
  ['↺','TEKRAR','0–1–3–7–14–28. Gün Tekrar Sistemi','Yanlış soruları otomatik tekrar kuyruğuna alır ve doğru oldukça tekrar aralığını genişletir.'],
  ['⚑','HEDEF','Okul / Üniversite Takibi','LGS ve YKS hedef verilerini öğrenci performansıyla karşılaştırır.'],
  ['!','MÜDAHALE','Koç Uyarıları','Düşük performans ve konu birikimi gibi durumlarda koça otomatik uyarı oluşturur.'],
  ['◇','VELİ','Veli Gelişim Paneli','Veliye haftalık çalışma özeti, hedef durumu ve koç raporlarını sade şekilde sunar.'],
  ['▣','KÜTÜPHANE','Dosya ve Not Alanı','Koç öğrenciye dosya, not, rapor ve çalışma materyali ekleyebilir.'],
];

export default function FeaturesPage(){
  return <PortalShell
    active="ozellikler"
    eyebrow="KEKS ÖZELLİKLERİ"
    title="Tek tek araçlardan değil, birbirine bağlı bir öğrenme sisteminden oluşur."
    description="Her modül aynı öğrenci verisini besler; test sonucu, çalışma tekniği, hedef ve ilerleme verileri birbirinden kopuk kalmaz."
  >
    <section className="section">
      <PortalSectionTitle eyebrow="MODÜLLER" title="Öğrencinin ihtiyacına göre çalışan bütünleşik araçlar"/>
      <div className="portalFeatureGrid">
        {features.map(([icon,eyebrow,title,desc])=><div className="portalFeatureCard" key={title}><span className="icon">{icon}</span><small>{eyebrow}</small><h3>{title}</h3><p>{desc}</p></div>)}
      </div>
    </section>
  </PortalShell>
}
