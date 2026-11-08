import Link from 'next/link';
import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {PortalShell} from '@/app/components/PortalShell';

export const metadata={
 title:'KEKS Eğilim Taraması ve Ön Görüşme | KEKS Akademi',
 description:'Eğitim düzeyine göre eğilim taraması, güvenli öğrenci hesabı, ön görüşme ve koç değerlendirmesi tek KEKS Akademi uygulamasında.'
};

const stages=[
 {number:'01',title:'Profilini tanımla',description:'Eğitim düzeyini, alanını, hedefini ve çalışma alışkanlıklarını KEKS hesabında birleştir.'},
 {number:'02',title:'Eğilim taramasını çöz',description:'Eğitim ve öğrenme aşamana göre seçilen maddelerde kendini değerlendir.'},
 {number:'03',title:'Ön görüşmeye geç',description:'Yanıtların, koçunla yürütülecek bireysel değerlendirmeye ve çalışma planına temel olsun.'}
];

export default async function NativeAssessmentEntry(){
 const user=await currentUser();
 if(user?.role==='STUDENT'&&user.student)redirect('/ogrenci/egilim-taramasi');
 if(user?.role==='COACH'||user?.role==='ADMIN')redirect(user.role==='COACH'?'/koc':'/yonetici');
 return <PortalShell active="ogrenci" eyebrow="KEKS FOCUS PRO" title="Eğilim Taraması ve Ön Görüşme" description="Eğilimlerini keşfet, çalışma düzenini anlamlandır ve koçunla daha güçlü bir öğrenme planı oluştur." wide>
   <section className="section keksAssessmentLanding" aria-label="KEKS değerlendirme merkezi">
     <div className="keksAssessmentLandingHero">
       <div className="keksAssessmentLandingCopy">
         <div className="keksAssessmentEyebrow"><span className="keksAssessmentEyebrowDot"/> KEKS AKADEMİ · DEĞERLENDİRME MERKEZİ</div>
         <h2>Öğrenmeni tanı.<br/><span>Gelişimini yönet.</span></h2>
         <p>KEKS Akademi'nin kendi sistemi içinde eğitim düzeyine uygun tarama, kişisel ön görüşme ve koç takibi. Hepsi tek öğrenci hesabında.</p>
         <div className="keksAssessmentHeroActions">
           <Link className="btn keksAssessmentPrimary" href="/ogrenci">Öğrenci olarak başla <span aria-hidden="true">→</span></Link>
           <Link className="btn keksAssessmentSecondary" href="/koc">Koç paneline geç</Link>
         </div>
         <div className="keksAssessmentHeroFoot">
           <span>✓ Tek KEKS hesabı</span><span>✓ Düzeye uygun içerik</span><span>✓ Koçla bütünleşik takip</span>
         </div>
       </div>
       <div className="keksAssessmentLandingEmblem" aria-label="KEKS Akademi amblemi">
         <img src="/keks-official-2026.webp" width="184" height="270" alt="KEKS Akademi resmî amblemi"/>
         <div className="keksAssessmentEmblemCaption">Çalışmanı veriye, veriyi başarıya dönüştür.</div>
       </div>
     </div>
     <div className="keksAssessmentSteps">
       <div className="keksAssessmentSectionHeading"><span>SÜREÇ NASIL İŞLER?</span><h2>Tek platformda üç adım</h2><p>Öğrenciye ek bir uygulama veya yeni giriş anahtarı gerekmez.</p></div>
       <div className="keksAssessmentStepGrid">{stages.map(s=><article className="keksAssessmentStepCard" key={s.number}>
         <span className="keksAssessmentStepNumber">{s.number}</span><h3>{s.title}</h3><p>{s.description}</p>
       </article>)}</div>
     </div>
     <div className="keksAssessmentInfoBar">
       <div><strong>Mevcut öğrenciler için</strong><p>KEKS hesabındaki tarama sonuçların ve tanımlı ürün erişimlerin korunur. Tarama, mevcut aylık ürün koşullarına tabidir.</p></div>
       <div><strong>Bilimsel kullanım sınırı</strong><p>Bu araç eğitimsel öz değerlendirme içindir; psikolojik tanı koymaz. Önceki bağımsız sitedeki kayıtlar otomatik aktarılmaz.</p></div>
     </div>
   </section>
 </PortalShell>;
}
