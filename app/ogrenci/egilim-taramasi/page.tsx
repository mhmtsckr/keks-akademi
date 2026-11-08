import Link from 'next/link';
import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {db} from '@/lib/db';
import {isStudentOnboardingRequired} from '@/lib/studentOnboarding';
import {detectEducationBand} from '@/lib/taskEvaluation';
import {getScreeningForm,SCREENING_DISCLAIMER} from '@/lib/screeningForms';
import {PortalShell} from '@/app/components/PortalShell';
import {StudentActions} from '@/app/components/StudentActions';
import {StudentPreInterview} from '@/app/components/StudentPreInterview';

export const metadata={title:'Eğilim Taraması ve Ön Görüşme | KEKS Akademi'};

export default async function NativeStudentScreeningPage(){
 const user=await currentUser();
 if(!user||user.role!=='STUDENT'||!user.student)redirect('/ogrenci');
 if(isStudentOnboardingRequired(user.student.profile))redirect('/ogrenci/baslangic');
 const student=await db.student.findUnique({
   where:{id:user.student.id},
   select:{id:true,studentCode:true,fullName:true,gradeLevel:true,academicTrack:true,
     goal:true,coachId:true,assessments:{orderBy:{completedAt:'desc'},take:1,select:{id:true,completedAt:true,report:true}},
     preInterviewAttempts:{orderBy:{completedAt:'desc'},take:1,select:{id:true,completedAt:true}}
   }
 });
 if(!student)redirect('/ogrenci');
 const last=student.assessments[0];
 const details=last?.report&&typeof last.report==='object'&&!Array.isArray(last.report)?last.report as Record<string,unknown>:{};
 const currentStage=String(details.workflowStatus||'');
 const band=detectEducationBand(student.gradeLevel);
 const form=getScreeningForm(band);
 const stage=last?'SCREENING_COMPLETED':'SCREENING_READY';
 const interviewReady=['PRE_INTERVIEW_ASSIGNED','PLAN_ADMIN_REVIEW','PLAN_ADMIN_APPROVED','COMPLETED'].includes(currentStage);
 const interviewDone=Boolean(student.preInterviewAttempts[0]);
 return <PortalShell signedIn active="ogrenci" wide
   eyebrow="KEKS AKADEMİ · ÖĞRENCİ DEĞERLENDİRME MERKEZİ"
   title="Eğilim Taraması ve Ön Görüşme"
   description="Tek öğrenci hesabında: eğitim düzeyin, çalışma alışkanlıkların, koç gözlemi ve kişisel planlama."
   meta={<><span>{student.studentCode}</span><span>{student.gradeLevel||'Eğitim düzeyi belirlenmedi'}</span><Link href="/ogrenci" className="btn">← Öğrenci paneli</Link></>}>
   <section className="section">
     <div className="keksNativeScreeningHero">
       <div className="keksNativeScreeningHeader">
         <img src="/keks-official-2026.webp" width="60" height="90" alt="KEKS Akademi resmî amblemi"/>
         <div><div className="moduleEyebrow">KEKS FOCUS PRO · TEK UYGULAMA</div>
          <h2>Öğrenme profilim</h2>
          <p>Bu ekran KEKS Akademi'nin kendi sisteminde çalışır. Ayrı üyelik veya dış platform gerektirmez.</p></div>
       </div>
       <div className="keksNativeScreeningSteps" aria-label="Değerlendirme aşamaları">
         <div><strong>01</strong><span>Eğitim profili</span><small>Tamamlandı</small></div>
         <div><strong>02</strong><span>Eğilim taraması</span><small>{stage==='SCREENING_COMPLETED'?'Tamamlandı':'Erişim / cevaplama'}</small></div>
         <div><strong>03</strong><span>Ön görüşme</span><small>{interviewDone?'Tamamlandı':interviewReady?'Açıldı':'Tarama sonrası'}</small></div>
         <div><strong>04</strong><span>Koç değerlendirmesi</span><small>Kanıta dayalı takip</small></div>
       </div>
     </div>
     <div className="card keksNativeScreeningProfile">
       <h3>Mevcut KEKS öğrenci profilim</h3>
       <div className="keksNativeScreeningFacts">
         <div><small>Eğitim düzeyi</small><strong>{student.gradeLevel||'Belirtilmedi'}</strong></div>
         <div><small>Alan / branş</small><strong>{student.academicTrack||'Genel'}</strong></div>
         <div><small>Öğrenme hedefi</small><strong>{student.goal||'Öğrenci profilimden belirlenebilir'}</strong></div>
         <div><small>Koç bağlantısı</small><strong>{student.coachId?'Bağlı':'Henüz bağlanmadı'}</strong></div>
       </div>
       <p className="muted">Bu bilgileri yeniden girmen gerekmez. Eğitim düzeyinin seçtiği tarama formu: {form.questions.length} madde. Koçun kendi yetki alanındaki sonuçları ve ön görüşme bulgularını görür.</p>
     </div>
   </section>
   <section className="section" id="egilim-taramasi">
     <div className="keksNativeSectionTitle"><span>1. AŞAMA</span><h2>KEKS Eğilim Taraması</h2><p>Form eğitim düzeyine göre oluşturulur; mevcut tek kullanımlık erişim ve sonuç kayıtları korunur.</p></div>
     <StudentActions hasAccess={false}/>
   </section>
   <section className="section" id="on-gorusme">
     <div className="keksNativeSectionTitle"><span>2. AŞAMA</span><h2>Eğitim Düzeyine Göre Ön Görüşme</h2><p>Eğilim taraması ve yetkili atama tamamlandığında aynı sayfada devam et.</p></div>
     <StudentPreInterview/>
   </section>
   <section className="section">
     <div className="card"><h3>Sonuçlarım ve koç takibi</h3>
       <p>{last?'Son eğilim taraman KEKS hesabında kayıtlı.':'Henüz tamamlanmış KEKS eğilim taraman bulunmuyor.'} {interviewDone?'Ön görüşmen de kayıtlı.':'Ön görüşme durumu yukarıda gösteriliyor.'}</p>
       <p className="muted">{SCREENING_DISCLAIMER}</p>
       <div className="row"><Link href="/ogrenci" className="btn primary">Öğrenci gelişim paneline dön</Link><Link href="/ogrenci/testler" className="btn">Soru çözme merkezine git</Link></div>
     </div>
   </section>
 </PortalShell>;
}
