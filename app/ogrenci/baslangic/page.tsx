import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {isStudentOnboardingRequired} from '@/lib/studentOnboarding';
import {PortalShell,PortalSectionTitle} from '@/app/components/PortalShell';
import {StudentOnboardingWizard} from '@/app/components/StudentOnboardingWizard';
import {buildPartnerCoachDirectory} from '@/lib/partnerCoachNetwork';

export default async function StudentOnboardingPage(){
  const user=await currentUser();
  if(!user||user.role!=='STUDENT'||!user.student)redirect('/ogrenci');
  if(!isStudentOnboardingRequired(user.student.profile))redirect('/ogrenci');

  const coaches=await buildPartnerCoachDirectory({
    gradeLevel:user.student.gradeLevel,
    academicTrack:user.student.academicTrack,
    currentCoachId:user.student.coachId
  });

  return <PortalShell
    signedIn
    active="ogrenci"
    eyebrow="İLK GİRİŞ"
    title="KEKS’i sana göre kuralım."
    description="Sekiz kısa adımın sonunda KEKS, ilk 7 günlük çalışma planını hemen oluşturacak."
    wide
  >
    <section className="section">
      <PortalSectionTitle
        eyebrow="0 → 7 GÜN"
        title="Boş panel yok. İlk dakikada uygulanabilir plan."
        description="Hedefin, eğitim düzeyin, gerçek kapasiten, zayıf derslerin, kaynakların, deneme verin, çalışma saatlerin ve koçun tek başlangıç profiline bağlanır."
      />
      <StudentOnboardingWizard
        initialGradeLevel={user.student.gradeLevel||''}
        initialGoal={user.student.goal||''}
        initialAcademicTrack={user.student.academicTrack||''}
        initialCoachId={user.student.coachId||''}
        coaches={coaches.map(coach=>({
          id:coach.id,name:coach.name,studentCount:coach.studentCount,
          displayTitle:coach.displayTitle,specialties:coach.specialties,
          availableSlots:coach.availableSlots,responseHours:coach.responseHours,
          responseTargetHours:coach.responseTargetHours,
          sessionCompletionRate:coach.sessionCompletionRate,
          profileCompleteness:coach.profileCompleteness,fitReasons:coach.fitReasons
        }))}
      />
    </section>
  </PortalShell>;
}
