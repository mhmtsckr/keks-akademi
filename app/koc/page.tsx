import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { AccountLoginForm, CoachRegisterForm } from '@/app/components/AuthForms';
import { CoachActions } from '@/app/components/CoachActions';
import { PortalSectionTitle, PortalShell } from '@/app/components/PortalShell';
import { CoachStudentTable } from '@/app/components/CoachStudentTable';

export default async function CoachPage() {
  const user = await currentUser();

  if (!user || (user.role !== 'COACH' && user.role !== 'ADMIN') || !user.coachProfile) {
    return <PortalShell
      active="koc"
      eyebrow="KOÇ GİRİŞİ"
      title="Öğrencilerini tek merkezden yönet."
      description="Plan, deneme, hedef, içerik, teknik kullanımı ve koç uyarılarını aynı panelde takip et."
    >
      <section className="portalLoginGrid">
        <div className="portalLoginIntro">
          <span className="portalEyebrow">KOÇ KONTROL MERKEZİ</span>
          <h2>Veriyi gör, öğrenciyi yönlendir, gelişimi ölç.</h2>
          <p>KEKS koç paneli yalnız öğrenci listesi değildir; hedef açığını, çalışma davranışını ve müdahale gerektiren durumları tek ekranda toplar.</p>
          <div className="portalLoginBullets">
            <span>Öğrenci bazlı akıllı program</span>
            <span>Net trendleri ve gerçek aktif süre</span>
            <span>Rapor, içerik ve veli erişimi yönetimi</span>
          </div>
        </div>
        <div className="stack">
          <div className="card"><h2>Koç Girişi</h2><p className="muted">Kendi koç hesabınızla giriş yapın.</p><AccountLoginForm/></div>
          <div className="card"><h2>Yeni Koç Hesabı</h2><p className="muted">Yeni hesaplar yönetici onayından sonra aktifleşir.</p><CoachRegisterForm/></div>
        </div>
      </section>
    </PortalShell>;
  }

  const students = await db.student.findMany({
    where:{coachId:user.coachProfile.id},
    select:{id:true,fullName:true,studentCode:true,gradeLevel:true,createdAt:true},
    orderBy:{createdAt:'desc'}
  });

  return <PortalShell
    active="koc"
    eyebrow="KOÇ PANELİ"
    title={'Koç Kontrol Merkezi · '+user.name}
    description="Öğrencilerini, çalışma planlarını ve gelişim verilerini tek merkezden yönet."
    meta={<><span>{students.length} öğrenci</span><span>Kişisel takip</span><span>Akıllı uyarılar</span></>}
    wide
  >
    <section className="section">
      <PortalSectionTitle eyebrow="ÖĞRENCİ YÖNETİMİ" title="Öğrencilerim" description="Bir öğrencinin adına dokunarak detaylı koç çalışma alanını açabilirsiniz."/>
      <div className="grid" style={{gridTemplateColumns:'minmax(280px,.8fr) minmax(0,2fr)'}}>
        <CoachActions/>
        <div className="card">
          <h2>Öğrenciler ({students.length})</h2>
          <CoachStudentTable students={students}/>
        </div>
      </div>
    </section>

    {user.role==='ADMIN'&&<section className="section"><div className="card"><h2>Yönetici erişimi</h2><p className="muted">Bu hesap aynı zamanda yönetici yetkisine sahip.</p><a className="btn primary" href="/yonetici">Yönetici Paneline Git</a></div></section>}
  </PortalShell>;
}
