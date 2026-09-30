import {notFound} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {PortalShell} from '@/app/components/PortalShell';
import {StudentTodayPlan} from '@/app/components/StudentTodayPlan';
import {StudentDailyTasks} from '@/app/components/StudentDailyTasks';
import {StudentWrongQuestionBank} from '@/app/components/StudentWrongQuestionBank';
import {StudentMobileQuickActions} from '@/app/components/StudentMobileQuickActions';
import {getAdultExamGroup,isAgsOabtStudentRecord} from '@/lib/agsExamOptions';

export default async function StudentTodayMobilePage(){
  const user=await currentUser();
  if(!user||user.role!=='STUDENT'||!user.student)return notFound();

  const grade=(user.student.gradeLevel||'').toLowerCase();
  const isAgsOabt=isAgsOabtStudentRecord({gradeLevel:user.student.gradeLevel,academicTrack:user.student.academicTrack,profile:user.student.profile});
  const adultExamGroup=isAgsOabt?'AGS/ÖABT':getAdultExamGroup(user.student.gradeLevel);
  const examTypes=adultExamGroup==='AGS/ÖABT'?['AGS','OABT']:
    adultExamGroup==='AGS/YDS'?['AGS','YDS']:
    adultExamGroup==='KPSS'?['KPSS']:
    adultExamGroup==='ALES'?['ALES']:
    adultExamGroup==='DGS'?['DGS']:
    adultExamGroup==='YDS'||adultExamGroup==='YÖKDİL'?['YDS']:
    (grade.includes('8')||grade.includes('ortaokul'))?['LGS']:['TYT','AYT'];
  const defaultWrongExam=adultExamGroup||(grade.includes('8')||grade.includes('ortaokul')?'LGS':'TYT');

  return <PortalShell signedIn
    active="ogrenci"
    eyebrow="KEKS MOBİL · BUGÜN"
    title={'Bugün · '+user.student.fullName}
    description="Günün görevlerini tamamla, yanlışını ekle veya denemeni saniyeler içinde kaydet."
    meta={<><span>Hızlı mobil ekran</span><a className="btn" href="/ogrenci">Tam panele geç</a></>}
    wide
  >
    <StudentMobileQuickActions examTypes={examTypes}/>

    <section id="bugunun-plani" className="section section-anchor mobileTodayPriority">
      <StudentTodayPlan/>
    </section>

    <section id="gunluk-gorevler" className="section section-anchor">
      <StudentDailyTasks/>
    </section>

    <section id="yanlis-soru-bankasi" className="section section-anchor">
      <StudentWrongQuestionBank defaultExam={defaultWrongExam}/>
    </section>
  </PortalShell>;
}
