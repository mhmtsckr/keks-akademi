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
import {NativeScreeningContext} from '@/app/components/NativeScreeningContext';
import {readScreeningStage} from '@/lib/screeningForms';

export const metadata={title:'Eğilim Taraması ve Ön Görüşme | KEKS Akademi'};

export default async function NativeStudentScreeningPage(){
 const user=await currentUser();
 if(!user||user.role!=='STUDENT'||!user.student)redirect('/ogrenci');
 if(isStudentOnboardingRequired(user.student.profile))redirect('/ogrenci/baslangic');
 const student=await db.student.findUnique({
   where:{id:user.student.id},
   select:{id:true,studentCode:true,fullName:true,gradeLevel:true,academicTrack:true,profile:true,
     goal:true,coachId:true,assessments:{orderBy:{completedAt:'desc'},take:1,select:{id:true,completedAt:true,report:true}},
     preInterviewAttempts:{orderBy:{completedAt:'desc'},take:1,select:{id:true,completedAt:true}}
   }
 });
 if(!student)redirect('/ogrenci');
 const last=student.assessments[0];
 const details=last?.report&&typeof last.report==='object'&&!Array.isArray(last.report)?last.report as Record<string,unknown>:{};
 const currentStage=String(details.workflowStatus||'');
 const band=detectEducationBand(student.gradeLevel);
 const learningStage=readScreeningStage(student.profile);
 const form=getScreeningForm(band,learningStage);
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
         <div><div className="moduleEyebrow">KEKS FOCUS PRO · KİŞİSEL DEĞERLENDİRME</div>
          <h2>Öğrenme profilim</h2>
          <p>Eğilimlerin, çalışma alışkanlıkların ve koç desteğin KEKS Akademi'nin kendi sisteminde bir arada.</p>
          <div className="keksNativeHeroActions">
            <a href="#egilim-taramasi" className="btn keksAssessmentPrimary">Taramaya devam et <span aria-hidden="true">↓</span></a>
            <a href="#on-gorusme" className="btn keksAssessmentSecondary">Ön görüşmeyi görüntüle</a>
          </div></div>
       </div>
       <div className="keksNativeScreeningSteps" aria-label="Değerlendirme aşamaları">
         <div className="keksAssessmentStepDone"><strong>01</strong><span>Eğitim profili</span><small>✓ Tamamlandı</small></div>
         <div className={last?'keksAssessmentStepDone':'keksAssessmentStepCurrent'}><strong>02</strong><span>Eğilim taraması</span><small>{stage==='SCREENING_COMPLETED'?'✓ Tamamlandı':'Şu anki aşama'}</small></div>
         <div className={interviewDone?'keksAssessmentStepDone':interviewReady?'keksAssessmentStepCurrent':'keksAssessmentStepPending'}><strong>03</strong><span>Ön görüşme</span><small>{interviewDone?'✓ Tamamlandı':interviewReady?'Görüşme açıldı':'Tarama sonrası'}</small></div>
         <div className={interviewDone?'keksAssessmentStepCurrent':'keksAssessmentStepPending'}><strong>04</strong><span>Koç değerlendirmesi</span><small>Takip ve planlama</small></div>
       </div>
     </div>
     <div className="card keksNativeScreeningProfile">
       <div className="keksNativeCardHeading"><span className="keksAssessmentKicker">PROFİL BİLGİLERİM</span><h3>KEKS öğrenci profilim</h3><p>Bilgilerini tekrar girmen gerekmiyor; tarama bu profili esas alır.</p></div>
       <div className="keksNativeScreeningFacts">
         <div><small>Eğitim düzeyi</small><strong>{student.gradeLevel||'Belirtilmedi'}</strong></div>
         <div><small>Alan / branş</small><strong>{student.academicTrack||'Genel'}</strong></div>
         <div><small>Öğrenme hedefi</small><strong>{student.goal||'Öğrenci profilimden belirlenebilir'}</strong></div>
         <div><small>Koç bağlantısı</small><strong>{student.coachId?'Bağlı':'Henüz bağlanmadı'}</strong></div>
       </div>
       <div className="keksNativeProfileFooter"><span><strong>{form.questions.length} madde</strong> · Eğitim ve öğrenme düzeyine göre form</span><span><strong>Güvenli paylaşım</strong> · Yalnızca yetkili koç</span></div>
     </div>
   </section>
   <section className="section" id="egilim-taramasi">
     <div className="keksNativeSectionTitle"><span>01 · KEKS FOCUS PRO</span><h2>Eğilim Taraması</h2><p>Önce öğrenme profilini gözden geçir, ardından sana özel formda ilerle. Mevcut erişim hakların korunur.</p></div>
     <NativeScreeningContext/>
     {learningStage||last?<StudentActions hasAccess={false}/>:<div className="notice">Önce yukarıdaki öğrenme profilini kaydet. Böylece KEKS soruları eğitim ve gelişim düzeyine göre hazırlasın.</div>}
   </section>
   <section className="section" id="on-gorusme">
     <div className="keksNativeSectionTitle"><span>02 · KEKS FOCUS PRO</span><h2>Ön Görüşme</h2><p>Tarama tamamlandığında ve görüşme atandığında aynı KEKS hesabından devam et.</p></div>
     <StudentPreInterview/>
   </section>
   <section className="section">
     <div className="card keksAssessmentResults"><span className="keksAssessmentKicker">03 · GELİŞİM TAKİBİ</span><h3>Sonuçlarım ve koç takibi</h3>
       <p>{last?'Son eğilim taraman KEKS hesabında kayıtlı.':'Henüz tamamlanmış KEKS eğilim taraman bulunmuyor.'} {interviewDone?'Ön görüşmen de kayıtlı.':'Ön görüşme durumu yukarıda gösteriliyor.'}</p>
       <p className="muted">{SCREENING_DISCLAIMER}</p>
       <div className="row"><Link href="/ogrenci" className="btn primary">Öğrenci gelişim paneline dön</Link><Link href="/ogrenci/testler" className="btn">Soru çözme merkezine git</Link></div>
     </div>
   </section>
 </PortalShell>;
}
