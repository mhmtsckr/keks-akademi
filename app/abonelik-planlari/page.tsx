import { PortalShell,PortalSectionTitle } from '@/app/components/PortalShell';
import { BUSINESS_INFO } from '@/lib/businessInfo';

function whatsappHref(audience:'STUDENT'|'PARENT'|'COACH'){
 const phone='90'+BUSINESS_INFO.phone.replace(/\D/g,'').replace(/^0/,'');
 const messages={
  STUDENT:'Merhaba KEKS Akademi, öğrenciyim. Bana uygun abonelik planları ve ücretleri hakkında bilgi almak istiyorum. Sınıfım / hazırlandığım sınav: ',
  PARENT:'Merhaba KEKS Akademi, veliyim. Çocuğuma uygun abonelik planları ve ücretleri hakkında bilgi almak istiyorum. Sınıfı / hazırlandığı sınav: ',
  COACH:'Merhaba KEKS Akademi, öğrenci koçuyum. Koç abonelik planları ve ücretleri hakkında bilgi almak istiyorum. Takip ettiğim öğrenci sayısı: '
 };
 return `https://wa.me/${phone}?text=${encodeURIComponent(messages[audience])}`;
}

const options=[
 {audience:'STUDENT' as const,eyebrow:'ÖĞRENCİ',title:'Kendim için bilgi almak istiyorum',description:'Sınıfınızı veya hazırlandığınız sınavı paylaşın; size uygun öğrenci abonelik planları WhatsApp üzerinden sunulsun.',cta:'Öğrenci Planlarını Sor'},
 {audience:'PARENT' as const,eyebrow:'VELİ',title:'Çocuğum için bilgi almak istiyorum',description:'Çocuğunuzun sınıfını veya hazırlandığı sınavı paylaşın; uygun öğrenci planları ve ücretleri size iletilsin.',cta:'Veli Olarak Bilgi Al'},
 {audience:'COACH' as const,eyebrow:'ÖĞRENCİ KOÇU',title:'Sistemi koç olarak kullanmak istiyorum',description:'Takip ettiğiniz öğrenci sayısını paylaşın; kapasitenize uygun koç planları ve ücretleri sunulsun.',cta:'Koç Planlarını Sor'}
];

export default function SubscriptionPlansPage(){
 return <PortalShell active="abonelik" eyebrow="KEKS AKADEMİ" title="Abonelik Planları" description="KEKS abonelik planları ihtiyacınıza göre WhatsApp üzerinden sunulur. Aşağıdan size uygun seçeneği belirleyerek görüşmeyi başlatın." wide>
  <section className="section">
   <PortalSectionTitle eyebrow="WHATSAPP'TAN BİLGİ AL" title="Size uygun planı birlikte belirleyelim" description="Öğrenci, veli veya öğrenci koçu seçeneğini belirleyin. Açılan WhatsApp mesajındaki bilgiyi tamamlayıp gönderdiğinizde size uygun paket ve ücret seçenekleri paylaşılır."/>
   <div className="subscriptionPlanRail" aria-label="WhatsApp abonelik planı bilgi seçenekleri">
    {options.map(option=><article className="card" key={option.audience} style={{display:'flex',flexDirection:'column',gap:12}}>
      <div><span className="portalEyebrow">{option.eyebrow}</span><h2>{option.title}</h2></div>
      <p>{option.description}</p>
      <a className="btn primary" href={whatsappHref(option.audience)} target="_blank" rel="noopener noreferrer">{option.cta}</a>
    </article>)}
   </div>
  </section>
 </PortalShell>
}
