import { PortalSectionTitle, PortalShell } from '@/app/components/PortalShell';

export const metadata={
  title:'Özellikler | KEKS Akademi',
  description:'KEKS Akademi eğitsel profil, kişisel planlama, akademik analitik, öğrenme-tekrar, koçluk ve veli entegrasyonunu tek öğrenci profili altında birleştirir.'
};

const flowSteps=[
  ['01','Eğilim Taraması','Eğitim ve gelişim düzeyine uygun başlangıç verisi'],
  ['02','Ön Görüşme','İşaretlemeli ve açık uçlu öğrenci bağlamı'],
  ['03','Öğrenci Profili','Davranış, ihtiyaç ve akademik verinin birleşimi'],
  ['04','Kişisel Plan','Yıllık plandan günlük göreve kadar yapılandırma'],
  ['05','Günlük Çalışma','Görev, soru, teknik, odak ve tekrar uygulaması'],
  ['06','Performans Takibi','Net, doğruluk, süre, görev ve konu gelişimi'],
  ['07','Koç Müdahalesi','Risk uyarısı, görüşme özeti ve plan düzenleme'],
  ['08','Aylık Gelişim','Davranışsal değişim ve yeni dönem hedefleri']
] as const;

const systems=[
  {
    no:'01',
    eyebrow:'ÖĞRENCİYİ TANIMA',
    title:'Eğitsel Profil ve Gelişim Analizi',
    lead:'Öğrencinin eğitim ve gelişim düzeyine uygun eğilim taraması, çalışma davranışları ve ön görüşme verilerini birlikte değerlendirerek kişiselleştirilmiş eğitim profili oluşturur.',
    accent:'Profil tek bir test sonucundan oluşmaz; tarama, ön görüşme ve akademik performans birlikte yorumlanır.',
    features:[
      'Eğitim ve gelişim düzeyine göre Eğilim Taraması',
      'Düzeye özel soru havuzları ve Ön Görüşme Formu',
      'Dokuz davranışsal eğilim boyutu',
      'Çalışma ve öz-düzenleme analizi',
      'Motivasyon ihtiyacı ve odak ortamı analizi',
      'Koçluk ihtiyacı ve gelişim öncelikleri'
    ],
    metrics:['Planlama','Odak','Süreklilik','Aktif Hatırlama']
  },
  {
    no:'02',
    eyebrow:'DİNAMİK PROGRAMLAMA',
    title:'Akıllı Kişisel Çalışma Planı',
    lead:'Yıllık hedefi aylık önceliklere, haftalık çalışma düzenine ve günlük uygulanabilir görevlere dönüştürür.',
    accent:'Her öğrenciye aynı program değil.',
    features:[
      'Yıllık → Aylık → Haftalık → Günlük planlama',
      'Eğitim düzeyi ve hedefe göre görev hacmi',
      'Eksik ders ve konu önceliklendirmesi',
      'Deneme sonuçları ve çalışma süresini kullanma',
      'Eğilim taraması ve ön görüşme girdileri',
      'Geçmiş görev tamamlama oranına göre yeniden düzenleme'
    ],
    metrics:['Hedef','Eksik Konu','Çalışma Süresi','Tamamlama Oranı']
  },
  {
    no:'03',
    eyebrow:'VERİ VE GELİŞİM',
    title:'Akademik Performans Merkezi',
    lead:'Öğrencinin ne kadar çalıştığından fazlasını gösterir; ne ürettiğini, nerede zorlandığını ve hedefe nasıl yaklaştığını görünür kılar.',
    accent:'Tek bir gizemli puan yerine gelişimin bileşenleri ayrı ayrı gösterilir.',
    features:[
      'Deneme net gelişimi ve ders bazlı performans',
      'Hedef net – gerçek net karşılaştırması',
      'Doğru / yanlış / boş ve doğruluk oranı',
      'Soru çözme miktarı ve gerçek çalışma süresi',
      'Görev tamamlama ve konu bazlı eksikler',
      'Haftalık / aylık değişim ve hedefe yaklaşma'
    ],
    metrics:['Süreklilik','Görev','Soru','Deneme']
  },
  {
    no:'04',
    eyebrow:'ÖĞRENME VE KALICILIK',
    title:'Akıllı Öğrenme Laboratuvarı',
    lead:'Çalışma tekniklerini, aralıklı tekrarı ve yanlış soru döngüsünü aynı öğrenme motorunda birleştirir.',
    accent:'Yanlış veya unutulmaya açık içerikler tekrar kuyruğuna alınır; tekrar sıklığı başarıya göre yeniden düzenlenir.',
    features:[
      'Pomodoro ve 50/10 Ters Pomodoro',
      'Aktif Hatırlama, Feynman, Cornell ve SQ3R',
      '0–1–3–7–14–28. Gün Tekrar Sistemi',
      'Branş ve konu bazlı yanlış soru kuyruğu',
      'Başarıya göre genişleyen tekrar aralığı',
      'Unutma Riski: tekrar edilmeli → güçleniyor → kalıcılaşıyor'
    ],
    metrics:['Tekrar','Yanlış Kuyruğu','Aktif Hatırlama','Odak']
  },
  {
    no:'05',
    eyebrow:'PROFESYONEL KOÇLUK',
    title:'Koç Komuta Merkezi',
    lead:'Koçun yalnızca kayıt tutmasını değil; hangi öğrenciye, hangi konuda ve ne zaman müdahale etmesi gerektiğini görmesini sağlar.',
    accent:'Görüşme öncesi otomatik özet, haftanın kritik değişimlerini tek ekranda toplar.',
    features:[
      'Açıklanabilir müdahale sinyalleri ve önceliklendirme',
      'Ön görüşme ve eğilim sonuçlarının kontrollü görünümü',
      'Günlük görev ve tamamlanmamış iş takibi',
      'Koç notları, görüşme kararları ve sonraki adımlar',
      'Program düzenleme ve öğrenciye görev atama',
      'Bu hafta ne değişti? + görüşülecek 3 konu özeti'
    ],
    metrics:['Öncelik','Görüşme','Görev','Müdahale']
  },
  {
    no:'06',
    eyebrow:'ORTAK GELİŞİM EKOSİSTEMİ',
    title:'Öğrenci–Koç–Veli Ekosistemi',
    lead:'Aynı öğrenci verisini rol bazlı yetkilerle sunar; herkes aynı gelişim yolculuğunu görür ama yalnızca görmesi gereken veriye erişir.',
    accent:'Velinin görmesi gereken kadar veri.',
    features:[
      'Öğrenci Paneli: plan, görev, test, teknik ve hedef',
      'Koç Paneli: analiz, müdahale, görüşme ve programlama',
      'Veli Paneli: haftalık durum, gelişim özeti ve hedef ilerlemesi',
      'Koç onaylı veli notları ve aylık raporlar',
      'Ham eğilim ve özel ön görüşme yanıtlarında erişim sınırı',
      'Kaynak, içerik, dosya ve not kütüphanesi'
    ],
    metrics:['Öğrenci','Koç','Veli','Yetki']
  }
] as const;

const audiences=[
  ['İlkokul 1–2','Kısa, gelişim düzeyine uygun ifadeler; temel rutin, odak ve görev davranışları.'],
  ['İlkokul 3–4','Bağımsız çalışma, görev planlama ve öğrenme alışkanlıkları daha görünür izlenir.'],
  ['Ortaokul 5–6','Ders çeşitliliği, erteleme, aktif hatırlama ve düzenli soru çözme davranışları öne çıkar.'],
  ['Ortaokul 7–8 / LGS','LGS hedefi, deneme düzeni, süre yönetimi, paragraf/problem rutini ve hata analizi birlikte ele alınır.'],
  ['Lise 9–10','Temel akademik sistem, alan farkındalığı, sürdürülebilir çalışma ve öğrenme stratejileri geliştirilir.'],
  ['Lise 11–12 / YKS / Lise Mezunu','TYT–AYT hedefi, net gelişimi, deneme stratejisi, tekrar ve günlük çalışma kapasitesi birlikte planlanır.'],
  ['Yetişkin Sınav Grubu','KPSS, DGS, ALES ve benzeri sınavlarda yaşam sorumluluklarına uygun gerçekçi çalışma sistemi kurulur.']
] as const;

const differences=[
  ['Klasik program','Her öğrenciye benzer çizelge','KEKS','Öğrenci verisine göre dinamik plan'],
  ['Klasik test','Bir kez uygulanır','KEKS','Başlangıç profili + aylık gelişim'],
  ['Klasik koçluk','Görüşmeye dayalı','KEKS','Görüşme + görev + deneme + çalışma verisi'],
  ['Klasik takip','Ne kadar çalıştı?','KEKS','Nasıl çalıştı, ne öğrendi, neden hata yaptı?']
] as const;

const growthAxes=['Çalışma Sürekliliği','Görev Tamamlama','Soru Performansı','Tekrar Disiplini','Deneme Gelişimi','Odak Süresi'] as const;

export default function FeaturesPage(){
  return <PortalShell
    active="ozellikler"
    eyebrow="KEKS ÜRÜN MİMARİSİ"
    title="Öğrenciyi tanıyan, gelişimini izleyen ve çalışma sistemini sürekli yeniden düzenleyen bütünleşik eğitim koçluğu."
    description="KEKS; eğilim taraması, ön görüşme, akademik performans, çalışma davranışları, deneme sonuçları ve koç gözlemlerini tek öğrenci profili altında birleştirir. Sistem bu verileri günlük görevlerden aylık gelişim raporuna kadar aynı öğrenme döngüsünde kullanır."
    wide
  >
    <section className="section keksFeaturesIntro">
      <PortalSectionTitle
        eyebrow="KEKS NASIL ÇALIŞIR?"
        title="Tek bir test ya da çizelge değil, sürekli çalışan bir öğrenme döngüsü."
        description="Her adım bir sonraki adımı besler. Öğrenci hakkında toplanan veri, planı ve koç müdahalesini sürekli günceller."
      />
      <div className="keksProcess">
        {flowSteps.map(([no,title,desc],i)=><div className="keksProcessStep" key={no}>
          <div className="keksProcessTop"><b>{no}</b>{i<flowSteps.length-1&&<span aria-hidden="true">→</span>}</div>
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>)}
      </div>
    </section>

    <section className="section">
      <PortalSectionTitle
        eyebrow="6 ANA SİSTEM"
        title="18 özelliği tek tek sıralamak yerine, aynı öğrenci profiline bağlanan altı güçlü sistem."
        description="Her sistem kendi işini yapar; fakat veri, planlama ve koçluk katmanları birbirinden kopuk değildir."
      />
      <div className="keksSystemGrid">
        {systems.map(system=><article className="keksSystemCard" key={system.no}>
          <div className="keksSystemHeader">
            <span className="keksSystemNo">{system.no}</span>
            <div><small>{system.eyebrow}</small><h3>{system.title}</h3></div>
          </div>
          <p className="keksSystemLead">{system.lead}</p>
          <div className="keksSystemAccent">{system.accent}</div>
          <div className="keksFeatureList">
            {system.features.map(feature=><div key={feature}><span>✓</span><p>{feature}</p></div>)}
          </div>
          <div className="keksMetricRow">
            {system.metrics.map(metric=><span key={metric}>{metric}</span>)}
          </div>
        </article>)}
      </div>
    </section>

    <section className="section">
      <div className="keksMonthlySpotlight">
        <div className="keksMonthlyCopy">
          <span className="keksSpotlightEyebrow">AYLIK GELİŞİM VE DEĞERLENDİRME</span>
          <h2>Başlangıç profilini, davranışsal gelişimden ayırarak değişimi izler.</h2>
          <p>Öğrencinin eğilim profili sabit bir etiket gibi kullanılmaz. Planlama, odak, süreklilik, aktif hatırlama, tekrar ve hata analizi gibi geliştirilebilir davranışların aylık değişimi ayrı izlenir; yeni ayın planı bu değişime göre yeniden düzenlenir.</p>
          <div className="keksSpotlightBullets">
            <span>Başlangıç profili</span><span>Aylık davranış değişimi</span><span>Yeni gelişim hedefleri</span><span>Koç değerlendirmesi</span>
          </div>
        </div>
        <div className="keksGrowthScore">
          <div className="keksGrowthScoreHead">
            <div><small>GELİŞİM SKORU</small><strong>Bileşen bazlı görünüm</strong></div>
            <span>6 eksen</span>
          </div>
          <p>Tek bir gizemli puan yerine gelişimi oluşturan göstergeler açıkça izlenir.</p>
          <div className="keksGrowthAxes">
            {growthAxes.map((axis,i)=><div key={axis}>
              <div><span>{axis}</span><small>{['Düzen','Uygulama','Doğruluk','Kalıcılık','İlerleme','Süre'][i]}</small></div>
              <div className="keksGrowthTrack"><i style={{width:(58+i*6)+'%'}}/></div>
            </div>)}
          </div>
        </div>
      </div>
    </section>

    <section className="section">
      <PortalSectionTitle
        eyebrow="KİMLER İÇİN?"
        title="Tek tip öğrenci modeli yok."
        description="Soru dili, değerlendirme bağlamı, sınav hedefi ve çalışma sistemi eğitim ve gelişim düzeyine göre farklılaşır."
      />
      <div className="keksAudienceGrid">
        {audiences.map(([title,desc],i)=><article key={title} className="keksAudienceCard">
          <span>{String(i+1).padStart(2,'0')}</span>
          <h3>{title}</h3>
          <p>{desc}</p>
        </article>)}
      </div>
    </section>

    <section className="section">
      <PortalSectionTitle
        eyebrow="KEKS NEDEN FARKLI?"
        title="Takip etmekten çok, veriyi anlamlandırıp çalışma sistemini değiştirmeye odaklanır."
      />
      <div className="keksCompare">
        {differences.map(([classic,classicText,keks,keksText])=><div className="keksCompareRow" key={classicText}>
          <div><small>{classic}</small><p>{classicText}</p></div>
          <span aria-hidden="true">→</span>
          <div className="isKeks"><small>{keks}</small><p>{keksText}</p></div>
        </div>)}
      </div>
    </section>

    <section className="section">
      <div className="keksClosingPanel">
        <div>
          <span>TEK ÖĞRENCİ PROFİLİ · ORTAK VERİ · SÜREKLİ GELİŞİM</span>
          <h2>KEKS’in değeri özellik sayısında değil, özelliklerin aynı öğrenme döngüsünde birlikte çalışmasında.</h2>
          <p>Eğitsel profil, kişisel plan, günlük çalışma, akademik analitik, tekrar motoru, koç müdahalesi ve veli görünümü aynı öğrenci yolculuğunun parçalarıdır.</p>
        </div>
        <div className="keksClosingStats">
          <div><strong>6</strong><span>ana sistem</span></div>
          <div><strong>18+</strong><span>ürün özelliği</span></div>
          <div><strong>7</strong><span>eğitim / sınav düzeyi</span></div>
        </div>
      </div>
    </section>
  </PortalShell>;
}
