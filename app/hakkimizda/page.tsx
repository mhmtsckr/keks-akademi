import {KeksCoreLoop} from '@/app/components/KeksCoreLoop';
import {PortalShell,PortalSectionTitle} from '@/app/components/PortalShell';

const PRINCIPLES=[
  {title:'Veriye dayalı yönlendirme',text:'Planlama; yalnızca niyet beyanına değil, görev, süre, tekrar, deneme ve konu performansı gibi kaydedilen verilere dayanır.'},
  {title:'İnsan koç + teknoloji',text:'MİZA ve KEKS motoru karar desteği üretir; KEKS Partner Koç öğrenciyi tanır, görüşür, yorumlar ve gerekli insan müdahalesini yapar.'},
  {title:'Süreklilik, yalnız sonuç değil',text:'KEKS sadece nete bakmaz. Başlama davranışı, görev tamamlama, tekrar disiplini, yanlış nedenleri ve çalışma kapasitesi de takip edilir.'},
  {title:'Açıklanabilir gelişim',text:'Öğrenci ve koç yalnızca bir puan görmez; değişimin nedeni, risk sinyali ve önerilen sonraki aksiyon görünür olur.'},
  {title:'Eğitsel kullanım sınırı',text:'Eğilim taramaları psikolojik tanı koymaz ve kesin kişilik tipi belirlemez; eğitim planlamasına destek veren davranışsal veriler olarak değerlendirilir.'},
  {title:'Gerçekçi vaat',text:'KEKS belirli bir net, puan veya sıralama garantisi vermez. Garanti edilen unsur sistemin ölçüm, planlama, takip, tekrar ve raporlama standardıdır.'}
];

export default function AboutPage(){
  return <PortalShell
    active="sistem"
    eyebrow="HAKKIMIZDA"
    title="KEKS Akademi neden var?"
    description="Kazandıran Eğitim ve Koçluk Sistemi; öğrencinin ne çalışacağını söylemekten öte, öğrenme sürecini ölçülebilir ve yönetilebilir hale getirmek için tasarlanmıştır."
    wide
  >
    <section className="section aboutLead">
      <div className="aboutLeadCopy">
        <span className="portalEyebrow">KEKS AKADEMİ</span>
        <h2>Ders çalışmayı tesadüften çıkarıp sisteme dönüştürüyoruz.</h2>
        <p>Bir öğrencinin ihtiyacı yalnızca haftalık program almak değildir. Programın uygulanıp uygulanmadığını, hangi konunun unutulduğunu, yanlışların neden oluştuğunu, gerçek çalışma kapasitesini ve bir sonraki müdahalenin ne olması gerektiğini görmek gerekir.</p>
        <p>KEKS Akademi bu süreci öğrenci, KEKS Partner Koç ve veli arasında ortak fakat rol bazlı bir yapıda birleştirir. Öğrenci ne yapacağını görür, koç nerede müdahale etmesi gerektiğini anlar, veli ise baskı kurmadan gelişimin genel yönünü takip eder.</p>
      </div>
      <div className="aboutBrandStatement">
        <small>TEK CÜMLEDE KEKS</small>
        <strong>Ölç → Planla → Uygulat → Kaydet → Tekrar Ettir → Yeniden Ölç → Koça Aksiyon Öner.</strong>
      </div>
    </section>

    <section className="section">
      <KeksCoreLoop/>
    </section>

    <section className="section">
      <PortalSectionTitle
        eyebrow="NASIL ÇALIŞIR?"
        title="Teknoloji karar desteği verir, insan koç ilişkiyi yönetir."
        description="KEKS’in amacı insan koçu görünmez yapmak değil; koçun öğrenciyi daha doğru veriyle ve daha zamanında yönlendirmesini sağlamaktır."
      />
      <div className="aboutRoleGrid">
        <article><span>01</span><h3>Öğrenci</h3><p>Günlük planını, görevlerini, tekrarlarını, yanlışlarını ve gelişimini tek yerde görür.</p></article>
        <article><span>02</span><h3>KEKS Partner Koç</h3><p>KEKS Akademi metodolojisi içinde öğrenciyi takip eder; görüşme, yorumlama ve müdahale sorumluluğunu üstlenir.</p></article>
        <article><span>03</span><h3>MİZA</h3><p>Verileri işler, hatırlatır, örüntüleri görünür hale getirir ve koça açıklanabilir aksiyon önerileri sunar.</p></article>
        <article><span>04</span><h3>Veli</h3><p>Öğrencinin mahremiyetini koruyan sınırlı görünüm üzerinden devamlılık ve gelişim yönünü takip eder.</p></article>
      </div>
    </section>

    <section className="section">
      <PortalSectionTitle
        eyebrow="İLKELERİMİZ"
        title="KEKS’i hangi prensiplerle geliştiriyoruz?"
      />
      <div className="aboutPrincipleGrid">
        {PRINCIPLES.map(item=><article key={item.title}><div>✓</div><h3>{item.title}</h3><p>{item.text}</p></article>)}
      </div>
    </section>

    <section className="section aboutAudience">
      <PortalSectionTitle
        eyebrow="KİMLER İÇİN?"
        title="Öğrenci, veli ve profesyonel koç için aynı ekosistem."
        description="İlkokuldan sınav hazırlık gruplarına kadar farklı eğitim düzeyleri için öğrenci planları; profesyonel takip yapmak isteyen koçlar için KEKS Partner Koç lisansları bulunur."
      />
      <div className="homeConversionActions">
        <a className="btn primary" href="/abonelik-planlari">Paketleri İncele</a>
        <a className="btn" href="/kayit">Kaydol</a>
        <a className="btn" href="/giris">Giriş Yap</a>
      </div>
    </section>
  </PortalShell>;
}
