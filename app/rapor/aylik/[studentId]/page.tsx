import {notFound} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {db} from '@/lib/db';
import {PrintButton} from '@/app/components/PrintButton';
import {MonthlyDevelopmentReport} from '@/app/components/MonthlyDevelopmentReport';

export default async function MonthlyReportExportPage({params}:{params:Promise<{studentId:string}>}){
  const user=await currentUser();
  if(!user)return notFound();
  const {studentId}=await params;

  let audience:'STUDENT'|'COACH'|'PARENT'='COACH';
  let allowed=false;

  if(user.role==='STUDENT'&&user.student?.id===studentId){
    audience='STUDENT';
    allowed=true;
  }else if(user.role==='PARENT'&&user.parentProfile?.active&&user.parentProfile.consentRecordedAt&&user.parentProfile.studentId===studentId){
    audience='PARENT';
    allowed=true;
  }else if(user.role==='COACH'&&user.coachProfile){
    allowed=Boolean(await db.student.findFirst({where:{id:studentId,coachId:user.coachProfile.id},select:{id:true}}));
    audience='COACH';
  }else if(user.role==='ADMIN'){
    allowed=Boolean(await db.student.findUnique({where:{id:studentId},select:{id:true}}));
    audience='COACH';
  }

  if(!allowed)return notFound();

  return <main className="shell monthlyReportPrintShell" style={{maxWidth:980}}>
    <div className="row no-print" style={{justifyContent:'space-between',marginBottom:16}}>
      <button className="btn" type="button" onClick={undefined as never}> </button>
      <PrintButton/>
    </div>
    <article>
      <div className="brand">KEKS AKADEMİ</div>
      <h1>KEKS Aylık Gelişim Raporu</h1>
      <MonthlyDevelopmentReport studentId={studentId} audience={audience} printable/>
    </article>
  </main>;
}
