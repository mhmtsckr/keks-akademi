import {COACH_PLANS,type KeksPlan} from '@/lib/subscriptionPlans';
import {PortalShell,PortalSectionTitle} from '@/app/components/PortalShell';
import {BUSINESS_INFO} from '@/lib/businessInfo';
import {StudentPlanSelector} from './StudentPlanSelector';
import {CallbackRequestForm} from './CallbackRequestForm';
import {FIRST_30_DAYS,KEKS_GUARANTEES,MARKETING_FAQ} from '@/lib/marketingContent';

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
        {KEKS_GUARANTEES.map((item,index)=><article className="guaranteeCard" key={item.title}>
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
        {MARKETING_FAQ.map(([question,answer])=><details className="faqItem" key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}
      </div>
    </section>
  </PortalShell>;
}
