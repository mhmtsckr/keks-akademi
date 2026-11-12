import {currentUser} from '@/lib/auth';
import {QuizBuilder} from '@/app/components/QuizBuilder';
import {PortalShell} from '@/app/components/PortalShell';

export const dynamic='force-dynamic';
export default async function KeksMatematikPage(){
 const user=await currentUser();
 if(!user||user.role!=='STUDENT'||!user.student){
   return <PortalShell active="ogrenci" eyebrow="KEKS MATEMATİK" title="Matematik testleri için öğrenci girişi gerekir.">
     <div className="card"><a className="btn primary" href="/ogrenci">Öğrenci girişine git</a></div>
   </PortalShell>;
 }
 return <PortalShell signedIn active="ogrenci" eyebrow="KEKS MATEMATİK SORU BANKASI"
  title="Matematikte yanlışından öğren."
  description="Editör onaylı TYT Matematik sorularını çöz, çözümünü incele ve yanlış/boş soruları 0–1–3–7–14–28. günlerde tekrar et."
  meta={<><span>{user.student.fullName}</span><a className="btn" href="/ogrenci/testler">Tüm testler</a></>} wide>
   <div className="card" style={{background:'linear-gradient(115deg,#061d41,#0d3460)',color:'#fff',border:'1px solid #caa449',display:'flex',alignItems:'center',gap:18,flexWrap:'wrap'}}>
    <img src="/keks-official-2026.webp" alt="KEKS Akademi" width={90} height={90} style={{objectFit:'contain'}}/>
    <div><strong style={{fontSize:22,color:'#f6cf72'}}>KEKS MATEMATİK</strong>
      <p style={{margin:'6px 0',color:'#e7e9ee'}}>Çöz → İncele → Tekrar Et → Yeniden Ölç</p>
      <small>Yalnızca doğruluğu onaylanan sorular öğrencilerin kullanımına açılır.</small>
    </div>
   </div>
   <section className="section"><QuizBuilder allowedExams={['TYT']} fixedSubject="Matematik" bankOnly/></section>
 </PortalShell>;
}
