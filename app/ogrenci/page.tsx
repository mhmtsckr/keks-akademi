import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { StudentLoginForm, StudentRegisterForm } from '@/app/components/AuthForms';
import { StudentActions } from '@/app/components/StudentActions';
import { StudentProgressTools } from '@/app/components/StudentProgressTools';
import { AdaptiveRecommendation } from '@/app/components/AdaptiveRecommendation';
import { SmartCoachDashboard } from '@/app/components/SmartCoachDashboard';
import { StudyTechniqueLab } from '@/app/components/StudyTechniqueLab';
import { PortalSectionTitle, PortalShell } from '@/app/components/PortalShell';
import { keksMonthlyProduct,productKeyFromReport } from '@/lib/monthlyProduct';
import { StudentEngagementHub } from '@/app/components/StudentEngagementHub';
import { StudentDailyTasks } from '@/app/components/StudentDailyTasks';
import { StudentPreInterview } from '@/app/components/StudentPreInterview';
import { StudentCommandCenter } from '@/app/components/StudentCommandCenter';
import { StudentWrongQuestionBank } from '@/app/components/StudentWrongQuestionBank';
import { PanelNavigator } from '@/app/components/PanelNavigator';
import { displayExamGroupWithTrack,getAdultExamGroup,isAgsOabtStudentRecord } from '@/lib/agsExamOptions';
import { getEffectiveOabtField } from '@/lib/oabtFieldApproval';
import { StudentOabtFieldApproval } from '@/app/components/StudentOabtFieldApproval';
import { AccountSecurity } from '@/app/components/AccountSecurity';

function pretty(v: unknown) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

export default async function StudentPage() {
  const user = await currentUser();

  if (!user || user.role !== 'STUDENT' || !user.student) {
    return <PortalShell
      active="ogrenci"
      eyebrow="ÖĞRENCİ GİRİŞİ"
      title="Kendi öğrenme yolculuğuna giriş yap."
      description="Programların, hedeflerin, testlerin, tekrarların ve çalışma tekniklerin tek bir panelde."
    >
      <section className="portalLoginGrid">
        <div className="portalLoginIntro">
          <span className="portalEyebrow">KEKS ÖĞRENCİ DENEYİMİ</span>
          <h2>Planını gör, çalışmanı uygula, gelişimini takip et.</h2>
          <p>Koçunun oluşturduğu programları takip et; Pomodoro ve diğer teknikleri doğrudan uygula, konu bazlı test çöz ve hedefe yaklaşma durumunu gör.</p>
          <div className="portalLoginBullets">
            <span>Eğitsel profil + eğitim düzeyine göre ön görüşme</span>
            <span>Yıllık → aylık → haftalık → günlük kişisel plan</span>
            <span>Akademik performans, 0–1–3–7–14–28. Gün Tekrar Sistemi ve aylık gelişim</span>
          </div>
        </div>
        <div className="stack">
          <div className="card"><h2>Öğrenci Girişi</h2><p className="muted">Kayıtlı e-posta adresiniz ve kendi oluşturduğunuz şifreyle giriş yapın.</p><StudentLoginForm/></div>
          <div className="card"><h2>Öğrenci Kaydı</h2><p className="muted">Bilgilerinizi girin, güçlü şifrenizi oluşturun ve aktif koçlardan birini seçin.</p><StudentRegisterForm/></div>
        </div>
      </section>
    </PortalShell>;
  }

  const student = await db.student.findUnique({
    where:{id:user.student.id},
    include:{
      plans:{where:{active:true},orderBy:{updatedAt:'desc'}},
      dailyLogs:{orderBy:{date:'desc'},take:20},
      examResults:{orderBy:{createdAt:'desc'},take:20},
      studyTechniques:{where:{active:true},orderBy:{createdAt:'desc'}},
      techniquePreferences:{},
      reports:{where:{visibleToStudent:true},orderBy:{createdAt:'desc'}},
      libraryItems:{orderBy:{createdAt:'desc'}},
      testAccesses:{where:{status:'READY'},orderBy:{createdAt:'asc'},take:1},
      assessments:{orderBy:{completedAt:'desc'},take:1},
      targets:{where:{active:true},orderBy:{createdAt:'desc'},take:1},
      topicProgress:{},
      practiceLogs:{orderBy:{date:'desc'},take:30},
    }
  });
  if (!student) return null;

  const access = student.testAccesses[0];
  const latestAssessment=student.assessments[0];
  const latestReport=(latestAssessment?.report&&typeof latestAssessment.report==='object'&&!Array.isArray(latestAssessment.report)?latestAssessment.report:{}) as Record<string,any>;
  const latestWorkflow=String(latestReport.workflowStatus||'');
  const currentProduct=keksMonthlyProduct();
  const latestProductKey=latestAssessment?productKeyFromReport(latestAssessment.report,latestAssessment.completedAt):null;
  const showPreInterview=Boolean(latestAssessment&&
    ['PRE_INTERVIEW_ASSIGNED','PLAN_ADMIN_REVIEW','PLAN_ADMIN_APPROVED','COMPLETED'].includes(latestWorkflow)&&
    (latestProductKey===currentProduct.key||['PRE_INTERVIEW_ASSIGNED','PLAN_ADMIN_REVIEW','PLAN_ADMIN_APPROVED'].includes(latestWorkflow))
  );
  const activeTarget = student.targets[0];
  const grade=(student.gradeLevel||'').toLowerCase();
  const allowedExams=(grade.includes('8')||grade.includes('ortaokul'))?['LGS'] as const:['TYT','AYT'] as const;
  const isAgsOabt=isAgsOabtStudentRecord({gradeLevel:student.gradeLevel,academicTrack:student.academicTrack,profile:student.profile});
  const adultExamGroup=isAgsOabt?'AGS/ÖABT':getAdultExamGroup(student.gradeLevel);
  const defaultWrongExam=adultExamGroup||(grade.includes('8')||grade.includes('ortaokul')?'LGS':'TYT');
  const oabtField=isAgsOabt?getEffectiveOabtField(student.academicTrack,student.profile):null;
  const studentGroupLabel=isAgsOabt
    ?('AGS/ÖABT'+(oabtField?'- '+oabtField:''))
    :displayExamGroupWithTrack(student.gradeLevel,student.academicTrack);

  return <PortalShell signedIn
    active="ogrenci"
    eyebrow="ÖĞRENCİ PANELİ"
    title={'Merhaba, '+student.fullName}
    description="Bugünkü çalışmalarını başlat, hedefini kontrol et ve gelişimini tek ekrandan yönet."
    meta={<><span>Kod: {student.studentCode}</span>{student.gradeLevel&&<span>{adultExamGroup?'Sınav grubu: ':'Düzey: '}{studentGroupLabel}</span>}<span>{student.plans.length} aktif program</span></>}
    wide
  >
    <section id="genel-bakis" className="section section-anchor">
      <StudentCommandCenter/>
    </section>

    <section id="gunluk-gorevler" className="section section-anchor"><PortalSectionTitle eyebrow="BUGÜN" title="Günlük Görevlerim" description="Koçunuzun verdiği görevleri soru sonuçlarıyla birlikte kaydedin."/><StudentDailyTasks/></section>

    <section className="section"><details className="card"><summary>Diğer bölümler ve ayrıntılı araçlar</summary>
      <PanelNavigator roleLabel="Öğrenci" groups={[
        {label:'BUGÜN & PLANLAMA',description:'Günün öncelikleri, görevleri ve kişisel program.',items:[
          {href:'#genel-bakis',title:'Kontrol Merkezi',description:'Bugünkü durum ve hızlı aksiyonlar'},
          {href:'#gunluk-gorevler',title:'Günlük Görevler',description:'Koç görevleri ve günlük kayıt'},
          {href:'#programlar',title:'Kişisel Planlar',description:'Yıllık, aylık, haftalık ve günlük plan'}
        ]},
        {label:'ÖĞRENME & TEKRAR',description:'Yanlışları kapat, bilgiyi kalıcı hâle getir.',items:[
          {href:'#yanlis-soru-bankasi',title:'Yanlış Soru Bankası',description:'Fotoğraf/metin yükle ve tekrar görevine dönüştür',badge:'0–1–3–7–14–28'},
          {href:'#ogrenme-tekrar',title:'Çalışma Teknikleri',description:'Pomodoro, aktif hatırlama, Feynman ve diğer teknikler'}
        ]},
        {label:'AKADEMİK PERFORMANS',description:'Net, konu, doğruluk ve hedef gelişimini izle.',items:[
          {href:'#akilli-koc',title:'Akıllı Koç',description:'Hedefe yaklaşma, trend ve haftalık öneriler'},
          {href:'#akademik-performans',title:'Konu & Soru Analizi',description:'Doğru, yanlış, boş, net ve hata nedenleri'}
        ]},
        {label:'KOÇLUK & OYUNLAŞTIRMA',description:'Ko��luk aksiyonları, seanslar, XP ve mikro tekrar.',items:[
          {href:'#kocluk-oyunlastirma',title:'Koçluk & Oyunlaştırma',description:'Aksiyon, seans, XP, rozet ve mikro tekrar'}
        ]},
        {label:'RAPORLAR & KAYITLAR',description:'Geçmiş çalışmalar, denemeler ve koç raporları.',items:[
          {href:'#kayitlar-raporlar',title:'Kayıtlar & Raporlar',description:'Çalışma geçmişi, denemeler, raporlar ve kütüphane'}
        ]},
        {label:'TEST & DEĞERLENDİRME',description:'KEKS aylık değerlendirme ürünleri.',items:[
          ...(isAgsOabt?[{href:'#oabt-alani',title:'ÖABT Alanı',description:oabtField?('AGS/ÖABT- '+oabtField):'Alanınızı seçip kaydedin',badge:oabtField?'KİLİTLİ':'ZORUNLU'}]:[]),
          {href:'#keks-egilim-taramasi',title:'Aylık KEKS Test Ürünü',description:'Eğilim taraması ve ön görüşme',badge:'AYLIK'}
        ]}
      ]}/></details>
    </section>

    {isAgsOabt&&<section id="oabt-alani" className="section section-anchor">
      <PortalSectionTitle
        eyebrow="AGS/ÖABT PROFİLİ"
        title={oabtField?('AGS/ÖABT- '+oabtField):'ÖABT Alanı'}
        description={oabtField
          ?'Kayıt sırasında seçilen alan doğrudan öğrenci profilinize işlenmiştir. Yönetici onayı gerekmez.'
          :'Alanınızı bir kez seçip kaydedin. Kaydettiğiniz anda profilinize otomatik işlenir ve kilitlenir.'}
      />
      <StudentOabtFieldApproval/>
    </section>}

    <section className="section">
      <div className="grid">
        <div className="card"><div className="kpi">{student.plans.length}</div><div className="muted">Aktif program</div></div>
        <div className="card"><div className="kpi">{student.studyTechniques.length}</div><div className="muted">Atanmış teknik</div></div>
        <div className="card"><div className="kpi">{student.examResults.length}</div><div className="muted">Deneme kaydı</div></div>
      </div>
    </section>

    <section id="yanlis-soru-bankasi" className="section section-anchor"><PortalSectionTitle eyebrow="0–1–3–7–14–28 TEKRAR MOTORU" title="Günlük Yanlış Soru Bankam" description="Her derste yanlış yaptığın soruyu yükle. KEKS konuyu otomatik sınıflandırır ve tekrar gününde soruyu yeniden görev olarak önüne getirir."/><StudentWrongQuestionBank defaultExam={defaultWrongExam}/></section>
    <section className="section"><AdaptiveRecommendation/></section>
    <section id="akilli-koc" className="section section-anchor"><SmartCoachDashboard/></section>
    <section id="kocluk-oyunlastirma" className="section section-anchor"><PortalSectionTitle eyebrow="KOÇLUK & OYUNLAŞTIRMA" title="Aksiyonlar, seanslar, XP ve mikro tekrar" description="Koçluk sürecindeki görevleri, seansları, puanları, rozetleri ve kısa öğrenme oyunlarını tek alanda yönet."/><StudentEngagementHub/></section>

    <section id="ogrenme-tekrar" className="section section-anchor">
      <PortalSectionTitle eyebrow="AKILLI ÖĞRENME LABORATUVARI" title="Ders Çalışma Teknikleri ve Tekrar Motoru" description="Tekniği seç, hemen uygula; yanlış soru ve aralıklı tekrarlarını aynı öğrenme döngüsünde yönet."/>
      <StudyTechniqueLab initialPreferences={student.techniquePreferences}/>
    </section>

    <section id="hedef-teknikler" className="section section-anchor"><div className="panelSectionBand"><div><small>HEDEF & ÇALIŞMA AYARLARI</small><strong>Hedefim ve atanmış tekniklerim</strong><p>Hedef bilgisi ile koçun önerdiği çalışma tekniklerini aynı yerde gör.</p></div><span>KİŞİSEL AYAR</span></div><div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card"><h2>Hedefim</h2><p>{student.goal || 'Koçunuz henüz hedef bilgisi eklemedi.'}</p>{activeTarget&&<div className="notice"><strong>{activeTarget.institutionName}</strong>{activeTarget.departmentName?' · '+activeTarget.departmentName:''}<br/><span className="muted">{activeTarget.source} · {activeTarget.dataYear||'Yıl belirtilmedi'} · Puan {activeTarget.score??'—'} · Sıra {activeTarget.ranking??'—'} · Yüzdelik {activeTarget.percentile??'—'}</span></div>}{student.profile&&<p className="muted">{pretty(student.profile)}</p>}</div>
      <div className="card"><h2>Çalışma Tekniklerim</h2>{student.studyTechniques.length===0?<p className="muted">Henüz teknik atanmadı.</p>:student.studyTechniques.map(t=><div key={t.id} style={{marginBottom:12}}><strong>{t.title}</strong><div className="muted">{t.description}</div></div>)}</div>
    </div></section>

    <section id="programlar" className="section section-anchor"><PortalSectionTitle eyebrow="AKILLI KİŞİSEL ÇALIŞMA PLANI" title="Yıllık, Aylık, Haftalık ve Günlük Planlarım" description="Onaylı planların hedef, eksik ders, çalışma süresi ve gelişim verilerine göre aynı sistemde yürür."/>{student.plans.length===0?<div className="card muted">Henüz aktif program bulunmuyor.</div>:<div className="stack">{student.plans.map(p=><div className="card" key={p.id}><strong>{p.title}</strong><p className="muted">{pretty(p.payload)}</p></div>)}</div>}</section>

    <section id="kayitlar-raporlar" className="section section-anchor"><div className="panelSectionBand"><div><small>RAPORLAR & KAYITLAR</small><strong>Çalışma geçmişi ve gelişim kayıtları</strong><p>Çalışmalar, denemeler, koç raporları ve kütüphane içerikleri aynı bölümde.</p></div><span>GEÇMİŞ VERİ</span></div><div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card"><h2>Çalışma Kayıtlarım</h2>{student.dailyLogs.length===0?<p className="muted">Henüz kayıt yok.</p>:student.dailyLogs.map(l=><div key={l.id} style={{marginBottom:12}}><strong>{new Date(l.date).toLocaleDateString('tr-TR')}</strong><div className="muted">{pretty(l.payload)}</div></div>)}</div>
      <div className="card"><h2>Denemelerim</h2>{student.examResults.length===0?<p className="muted">Henüz deneme kaydı yok.</p>:student.examResults.map(x=><div key={x.id} style={{marginBottom:12}}><strong>{x.examType}</strong><div className="muted">{pretty(x.payload)}</div></div>)}</div>
    </div></section>

    <section className="section"><div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
      <div className="card"><h2>Koç Raporlarım</h2>{student.reports.length===0?<p className="muted">Henüz rapor yayınlanmadı.</p>:student.reports.map(r=><article key={r.id} style={{padding:'12px 0',borderBottom:'1px solid var(--line)'}}><strong>{r.title}</strong>{r.summary&&<p className="muted">{r.summary}</p>}<p>{r.content}</p></article>)}</div>
      <div className="card"><h2>Kütüphanem</h2>{student.libraryItems.length===0?<p className="muted">Henüz not veya dosya yok.</p>:student.libraryItems.map(i=><div key={i.id} style={{marginBottom:14}}><strong>{i.title}</strong>{i.note&&<div className="muted">{i.note}</div>}{i.fileName&&<a href={'/api/library/'+i.id}>Dosyayı Aç · {i.fileName}</a>}</div>)}</div>
    </div></section>

    <section id="akademik-performans" className="section section-anchor"><div className="row" style={{justifyContent:'space-between',alignItems:'center'}}><PortalSectionTitle eyebrow="AKADEMİK PERFORMANS MERKEZİ" title="Konu, Soru ve Hata Analizi" description="Doğru, yanlış, boş, net, konu ilerlemesi ve hata nedenlerini birlikte takip et."/><a className="btn primary" href="/ogrenci/testler">Konu Bazlı Test Çöz</a></div><StudentProgressTools allowedExams={[...allowedExams]} initialProgress={student.topicProgress.map(x=>({examType:x.examType,subject:x.subject,topic:x.topic,completed:x.completed}))} initialPractice={student.practiceLogs.map(x=>({id:x.id,examType:x.examType,subject:x.subject,topic:x.topic,correct:x.correct,wrong:x.wrong,blank:x.blank,net:x.net,date:x.date.toISOString(),errorReason:x.errorReason}))}/></section>

    <section id="hesap-guvenligi" className="section section-anchor"><PortalSectionTitle eyebrow="HESAP & GÜVENLİK" title="Hesap Güvenliği" description="Şifrenizi, son girişlerinizi ve aktif oturumlarınızı yönetin."/><AccountSecurity loginPath="/ogrenci"/></section>

    <section id="keks-egilim-taramasi" className="section section-anchor"><PortalSectionTitle eyebrow="KEKS AKADEMİ TEST ÜRÜNLERİ" title="Aylık KEKS Akademi Test Ürünü" description={`Ürün erişiminiz yoksa test soruları görünmez. Yönetici/koç tarafından verilen kodla veya ${keksMonthlyProduct().priceLabel} ödeme ile aylık ürünü hesabınıza tanımlayabilirsiniz.`}/><StudentActions hasAccess={Boolean(access)}/></section>
    {showPreInterview&&<section className="section"><PortalSectionTitle eyebrow="ÜRÜN AŞAMASI 2/2" title="Eğitim Düzeyine Göre Ön Görüşme" description="Bu bölüm yalnızca aynı aylık ürünün KEKS Eğilim Taraması tamamlandıktan sonra açılır. Form bir kez tamamlanabilir."/><StudentPreInterview/></section>}
  </PortalShell>;
}
