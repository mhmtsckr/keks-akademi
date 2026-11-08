import Link from 'next/link';
import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {PortalShell} from '@/app/components/PortalShell';

export const metadata={
 title:'KEKS Eğilim Taraması ve Ön Görüşme | KEKS Akademi',
 description:'Eğitim düzeyine göre eğilim taraması, güvenli öğrenci hesabı, ön görüşme ve koç değerlendirmesi tek KEKS Akademi uygulamasında.'
};

export default async function NativeAssessmentEntry(){
 const user=await currentUser();
 if(user?.role==='STUDENT'&&user.student)redirect('/ogrenci/egilim-taramasi');
 if(user?.role==='COACH'||user?.role==='ADMIN')redirect(user.role==='COACH'?'/koc':'/yonetici');
 return <PortalShell active="ogrenci" eyebrow="KEKS AKADEMİ" title="Eğilim Taraması ve Ön Görüşme" description="Öğrenci profili, eğitim düzeyine uygun sorular, değerlendirme, ön görüşme ve koç takibi artık KEKS Akademi bünyesinde, tek hesapta.">
   <section className="section">
     <div className="card keksUnifiedAssessmentIntro">
       <img src="/keks-official-2026.webp" width="66" height="99" alt="KEKS Akademi amblemi"/>
       <div className="stack">
         <div className="moduleEyebrow">KEKS FOCUS PRO · TEK UYGULAMA</div>
         <h2>Kendi öğrencilik ve öğrenme profilini oluştur.</h2>
         <p>Mevcut KEKS öğrenci hesabınla giriş yap; tekrar kayıt veya ayrı bir öğrenci anahtarı gerekmez. Henüz hesabın yoksa öğrenci kaydını tamamla.</p>
         <div className="row"><Link className="btn primary" href="/ogrenci">Öğrenci girişi / kayıt</Link><Link className="btn" href="/koc">Koç paneline giriş</Link></div>
       </div>
     </div>
     <div className="grid">
       <div className="card"><h3>1 · Eğitim düzeyini belirle</h3><p>İlkokuldan yetişkin sınavlarına kadar kendi profiline uygun içerik.</p></div>
       <div className="card"><h3>2 · Eğilim taramasını tamamla</h3><p>Kendini değerlendirme soruları; sınav notu veya psikolojik tanı değildir.</p></div>
       <div className="card"><h3>3 · Ön görüşmeye geç</h3><p>Koçun, hedeflerini ve öğrenme alışkanlıklarını aynı KEKS öğrenci hesabında inceler.</p></div>
     </div>
     <p className="muted">Eğilim taraması aylık KEKS test ürünü erişimine tabidir. Mevcut erişim kodların ve tamamlanan KEKS değerlendirmelerin korunur. Başka bir sitede daha önce doldurduğun kayıtlar otomatik taşınmaz.</p>
   </section>
 </PortalShell>;
}
