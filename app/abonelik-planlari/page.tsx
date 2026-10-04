import {COACH_PLANS,type KeksPlan} from '@/lib/subscriptionPlans';
import {PortalShell,PortalSectionTitle} from '@/app/components/PortalShell';
import {BUSINESS_INFO} from '@/lib/businessInfo';
import {StudentPlanSelector} from './StudentPlanSelector';
import {CallbackRequestForm} from './CallbackRequestForm';

const FIRST_30_DAYS=[
  {range:'1–3. gün',title:'Başlangıç fotoğrafını çıkar',text:'Çalışma düzeni, hedef, mevcut performans, tekrar alışkanlığı ve ihtiyaç alanların ölçülür.'},
  {range:'4–7. gün',title:'Kişisel planını kur',text:'Günlük kapasiten, ders önceliklerin ve hedeflerine göre uygulanabilir bir çalışma akışı oluşturulur.'},
  {range:'8–14. gün',title:'Uygula ve veri üret',text:'Görev, soru, süre, doğru–yanlış–boş ve çalışma davranışların kaydedilmeye başlar.'},
  {range:'15–21. gün',title:'Tekrar ve yanlış döngüsünü çalıştır',text:'Geciken tekrarlar, yanlış sorular ve bilgi hâkimiyeti durumları görünür hâle gelir; plan buna göre güncellenir.'},
  {range:'22–30. gün',title:'Yeniden ölç ve yönünü netleştir',text:'İlk ay verisi karşılaştırılır; güçlü gelişen alanlar, müdahale gereken noktalar ve sonraki ayın ana hedefleri belirlenir.'}
];

const GUARANTEES=[
  {title:'Ölçmeden plan yok',text:'Planın yalnız beyana göre değil, sisteme kaydedilen performans ve çalışma davranışı verilerine göre şekillenir.'},
  {title:'Kaçan görev kaybolmaz',text:'Tamamlanmayan işler kapasiteye göre yeniden dağıtılır; yalnızca ertesi güne yığılmaz.'},
  {title:'Tekrar görünür kalır',text:'Geciken tekrarlar ve yanlış sorular takip döngüsünde yeniden önüne gelir.'},
  {title:'Gelişim açıklanabilir olur',text:'Koç ve öğrenci yalnız bir puan değil; neden, değişim, risk sinyali ve önerilen aksiyonu görür.'}
];

const FAQ=[
  ['KEKS Akademi tam olarak nedir?','KEKS; ölçüm, kişisel planlama, uygulama takibi, yanlış soru yönetimi, tekrar, gelişim raporlama ve koç aksiyonlarını tek sistemde birleştiren eğitim ve koçluk platformudur.'],
  ['İlk 30 günde kesin net artışı olur mu?','KEKS belirli bir net, puan veya sıralama sonucu garanti etmez. İlk 30 günün amacı çalışma düzenini ölçülebilir hâle getirmek, kişisel sistemi kurmak ve sonraki müdahaleler için güvenilir veri oluşturmaktır.'],
  ['Aylık paketi istediğim zaman iptal edebilir miyim?','Aylık paket her ay yenilenir. Yenileme öncesinde iptal talebi verebilirsiniz. Güncel iptal ve iade koşulları İptal & İade sayfasında yer alır.'],
  ['3, 6 ve 12 aylık paketlerin farkı nedir?','Temel KEKS çalışma mantığı aynı kalır; süre uzadıkça takip döngüsü daha uzun bir gelişim dönemini kapsar ve toplam fiyat avantajı artar.'],
  ['MİZA insan koçun yerini mi alıyor?','Hayır. MİZA veri analizi, hatırlatma ve karar desteği sağlar. KEKS Partner Koç ise görüşme, takip, yorumlama ve gerekli insan müdahalesini yürütür.'],
  ['KEKS Partner Koç nedir?','KEKS ana markası ve metodolojisi içinde çalışan profesyonel koçtur. Öğrenci deneyimi, MİZA, ölçüm, planlama, tekrar ve raporlama KEKS Akademi altyapısıyla yürütülür.'],
  ['Hangi eğitim ve sınav grupları destekleniyor?','İlkokul, ortaokul, LGS, lise, YKS/mezun, KPSS/EKPSS, DGS, ALES, YDS/YÖKDİL, AGS/YDS ve AGS/ÖABT grupları için farklılaştırılmış planlar bulunur.'],
  ['Paket seçmeden önce görüşebilir miyim?','Evet. Sizi Arayalım formunu doldurabilir veya sayfadaki WhatsApp butonundan doğrudan KEKS Akademi ile iletişime geçebilirsiniz.']
];

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

    <section className="section conversionSection">
      <PortalSectionTitle
        eyebrow="İLK 30 GÜN"
        title="KEKS ile ilk 30 günde neler başarabilirsin?"
        description="Amaç mucize sonuç vaat etmek değil; dağınık çalışma sürecini ölçülebilir, takip edilebilir ve geliştirilebilir bir sisteme dönüştürmektir."
      />
      <div className="first30Rail">
        {FIRST_30_DAYS.map((item,index)=><article className="first30Card" key={item.range}>
          <span className="first30Index">{String(index+1).padStart(2,'0')}</span>
          <span className="portalEyebrow">{item.range}</span>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </article>)}
      </div>
    </section>

    <section className="section conversionSection">
      <PortalSectionTitle
        eyebrow="KEKS GARANTİSİ"
        title="Sonuç sözü değil, süreç standardı."
        description="KEKS Garantisi; belirli bir net, puan veya sıralamayı değil, aktif abonelik boyunca aşağıdaki çalışma ve takip standardını ifade eder."
      />
      <div className="guaranteeGrid">
        {GUARANTEES.map((item,index)=><article className="guaranteeCard" key={item.title}>
          <div className="guaranteeMark">✓</div>
          <div><span className="portalEyebrow">GARANTİ {index+1}</span><h3>{item.title}</h3><p>{item.text}</p></div>
        </article>)}
      </div>
      <div className="guaranteeFootnote">KEKS Akademi; öğrencinin çalışma süresi, uygulama düzeyi, sınav koşulları ve bireysel farklılıkları nedeniyle akademik sonuç garantisi vermez. Garanti edilen unsur sistemin ölçüm, planlama, takip, tekrar ve raporlama standardıdır.</div>
    </section>

    <section className="section conversionSection">
      <PortalSectionTitle
        eyebrow="KULLANICI YORUMLARI"
        title="Gerçek deneyimler, doğrulanmış kullanıcılar."
        description="KEKS bu alanda yalnızca gerçek kullanıcı hesaplarından izinle alınmış ve gerektiğinde anonimleştirilmiş yorumları yayınlar."
      />
      <div className="reviewEmptyState">
        <div className="reviewStars" aria-hidden="true">★★★★★</div>
        <h3>Doğrulanmış kullanıcı yorumları burada yayınlanacak.</h3>
        <p>Henüz doğrulanmamış veya yapay bir yorumu gerçek kullanıcı deneyimi gibi göstermiyoruz. Onaylı kullanıcı yorumları geldikçe bu bölüm güncellenecek.</p>
      </div>
    </section>

    <section className="section conversionSection callbackSection">
      <PortalSectionTitle
        eyebrow="SİZİ ARAYALIM"
        title="Hangi paketin size uygun olduğuna birlikte karar verelim."
        description="Bilgilerinizi bırakın; KEKS Akademi ekibi seçtiğiniz saat aralığında sizinle iletişime geçsin."
      />
      <div className="callbackShell">
        <div className="callbackIntro">
          <span className="portalEyebrow">ÜCRETSİZ ÖN BİLGİLENDİRME</span>
          <h3>Kısa bir görüşmede doğru paketi netleştirin.</h3>
          <p>Eğitim düzeyi, sınav hedefi, çalışma ihtiyacı veya Partner Koç kapasitesi üzerinden hangi KEKS planının daha uygun olduğunu konuşabiliriz.</p>
          <div className="callbackBullets"><span>✓ Paket ve süre karşılaştırması</span><span>✓ Öğrenci / veli ihtiyaç analizi</span><span>✓ Partner Koç lisans bilgisi</span></div>
        </div>
        <CallbackRequestForm/>
      </div>
    </section>

    <section className="section conversionSection">
      <PortalSectionTitle
        eyebrow="SIKÇA SORULAN SORULAR"
        title="Karar vermeden önce bilmek isteyebileceğiniz her şey."
        description="Paket, iptal, ilk 30 gün, MİZA ve KEKS Partner Koç modeliyle ilgili temel sorular."
      />
      <div className="faqList">
        {FAQ.map(([question,answer])=><details className="faqItem" key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}
      </div>
    </section>
  </PortalShell>;
}
