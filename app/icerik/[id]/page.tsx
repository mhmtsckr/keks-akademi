import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ContentViewer } from '@/app/components/ContentViewer';
import { PortalShell } from '@/app/components/PortalShell';

export default async function GeneratedContentPage({params}:{params:Promise<{id:string}>}){
  const user=await currentUser();
  if(!user) return notFound();
  const {id}=await params;
  const item=await db.generatedContent.findUnique({where:{id},include:{student:true,upload:true}});
  if(!item) return notFound();

  let allowed=false;
  if(user.role==='ADMIN'||item.createdByUserId===user.id) allowed=true;
  if(user.role==='STUDENT'&&user.student?.id===item.studentId&&item.visibleToStudent) allowed=true;
  if(user.role==='PARENT'&&user.parentProfile?.studentId===item.studentId&&item.visibleToParent) allowed=true;
  if(user.role==='COACH'&&user.coachProfile?.id===item.student?.coachId) allowed=true;
  if(!allowed) return notFound();

  const active=user.role==='COACH'?'koc':user.role==='PARENT'?'veli':user.role==='ADMIN'?'yonetici':'ogrenci';
  const back=user.role==='COACH'?'/koc':user.role==='PARENT'?'/veli':user.role==='ADMIN'?'/yonetici':'/ogrenci';

  return <PortalShell
    active={active}
    eyebrow="KEKS ÖĞRENME İÇERİĞİ"
    title={item.title}
    description={'Kaynak: '+item.upload.fileName+' · Kalite skoru: '+(item.qualityScore??'—')+' / 100'}
    meta={<><span>{item.type}</span><a className="btn" href={back}>← Panele Dön</a></>}
    wide
  >
    <section className="section"><ContentViewer type={item.type} payload={item.payload} contentId={item.id} canTrack={user.role==='STUDENT'&&user.student?.id===item.studentId}/></section>
  </PortalShell>;
}
