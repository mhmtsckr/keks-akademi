import { currentUser } from '@/lib/auth';
import { QuizBuilder } from '@/app/components/QuizBuilder';
import { PortalShell } from '@/app/components/PortalShell';

export default async function StudentTestsPage(){
 const user=await currentUser();
 if(!user || user.role!=='STUDENT' || !user.student) return <PortalShell active="ogrenci" eyebrow="ÖĞRENCİ TESTLERİ" title="Bu alan için öğrenci girişi gerekir."><div className="card"><a className="btn primary" href="/ogrenci">Öğrenci Girişine Git</a></div></PortalShell>;
 const grade=(user.student.gradeLevel||'').toLowerCase();
 const allowed=(grade.includes('8')||grade.includes('ortaokul'))?['LGS'] as const:['TYT','AYT'] as const;
 return <PortalShell signedIn
   active="ogrenci"
   eyebrow="KONU BAZLI TESTLER"
   title="Branş ve konu seç, testini oluştur."
   description="Çözdüğün test sonuçları performans analizine ve koç raporlarına otomatik yansır."
   meta={<><span>{user.student.fullName}</span><a className="btn" href="/ogrenci">← Öğrenci Paneli</a></>}
   wide
 ><section className="section">
    <div className="card" style={{marginBottom:20}}>
      <h2>Basılı KEKS Paragraf kitabı</h2>
      <p>Kitap sayfalarında yanlış yaptığın soruların 0–1–3–7–14–28 gün temelli kişisel tekrarlarını yönet.</p>
      <a className="btn primary" href="/paragraf/tekrar">Paragraf tekrarlarıma git</a>
    </div>
    <QuizBuilder allowedExams={[...allowed]}/>
  </section></PortalShell>;
}
