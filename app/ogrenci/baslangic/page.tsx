import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {db} from '@/lib/db';
import {isStudentOnboardingRequired} from '@/lib/studentOnboarding';
import {PortalShell,PortalSectionTitle} from '@/app/components/PortalShell';
import {StudentOnboardingWizard} from '@/app/components/StudentOnboardingWizard';

export default async function StudentOnboardingPage(){
  const user=await currentUser();
  if(!user||user.role!=='STUDENT'||!user.student)redirect('/ogrenci');
  if(!isStudentOnboardingRequired(user.student.profile))redirect('/ogrenci');

  const coaches=await db.coachProfile.findMany({
    where:{user:{status:'ACTIVE',role:'COACH'}},
    select:{id:true,user:{select:{name:true}},_count:{select:{students:true}}},
    orderBy:{user:{name:'asc'}}
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
        initialCoachId={user.student.coachId||''}
        coaches={coaches.map(coach=>({id:coach.id,name:coach.user.name,studentCount:coach._count.students}))}
      />
    </section>
  </PortalShell>;
}
